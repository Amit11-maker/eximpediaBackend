const TAG = 'workspaceModel';

const ObjectID = require('mongodb').ObjectID;

const MongoDbHandler = require('../db/mongoDbHandler');
const ElasticsearchDbHandler = require('../db/elasticsearchDbHandler');
const WorkspaceSchema = require('../schemas/workspaceSchema');

const buildFilters = (filters) => {
  let filterClause = {};
  // filterClause.years = {};
  if (filters.tradeType != null) filterClause.trade = filters.tradeType;
  if (filters.countryCode != null) filterClause.code_iso_3 = filters.countryCode;
  // if (filters.tradeYear != null) filterClause.years.$in = [filters.tradeYear];
  return filterClause;
};

const add = (workspace, cb) => {
  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.workspace)
    .insertOne(workspace, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
};

const remove = (workspaceId, cb) => {
  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.workspace)
    .deleteOne({
      "_id": ObjectID(workspaceId)
    }, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
}
const createIndexes = (collection, indexSpecifications, cb) => {

  let keyedIndexSpecifications = indexSpecifications.map(indexSpecification => {
    return {
      "key": indexSpecification
    };
  });

  //

  MongoDbHandler.getDbInstance().collection(collection)
    .createIndexes(keyedIndexSpecifications,
      function (err, result) {
        if (err) {
          cb(err);
        } else {
          cb(null, result);
        }
      });

};


const addRecordsAggregation = (aggregationParams, tradeDataBucket, workspaceDataBucket, indexSpecifications, cb) => {
  let shipmentRecordsIds = [];
  let clause = {};
  if (aggregationParams.recordsSelections && aggregationParams.recordsSelections.length > 0) {
    shipmentRecordsIds = aggregationParams.recordsSelections.map(shipmentRecordsId => ObjectID(shipmentRecordsId));
    clause.match = {
      "_id": {
        $in: shipmentRecordsIds
      }
    };
  } else {
    clause = WorkspaceSchema.formulateShipmentRecordsIdentifierAggregationPipeline(aggregationParams);
  }

  let aggregationExpression = [{
    $match: clause.match
  },
  {
    $merge: {
      into: workspaceDataBucket
    }
  }
  ];

  // 

  createIndexes(workspaceDataBucket, indexSpecifications, function (err, result) {
    if (err) {
      cb(err);
    } else {

      MongoDbHandler.getDbInstance().collection(tradeDataBucket)
        .aggregate(aggregationExpression, {
          allowDiskUse: true
        },
          function (err, cursor) {
            if (err) {
              cb(err);
            } else {
              cursor.toArray(function (err, documents) {
                if (err) {
                  cb(err);
                } else {
                  cb(null, {
                    merged: true
                  });
                }
              });
            }
          }
        );

    }
  });


};

const addRecordsAggregationEngine = async (aggregationParams, accountId, userId, tradeDataBucket, workspaceDataBucket, indexSpecifications, workspaceElasticConfig, cb) => {
  let shipmentRecordsIds = [];
  let clause = {};

  let aggregationExpression = {};

  if (aggregationParams.recordsSelections && aggregationParams.recordsSelections.length > 0) {
    shipmentRecordsIds = aggregationParams.recordsSelections;
    clause.terms = {
      "_id": shipmentRecordsIds
    };
    aggregationExpression.query = clause;
    aggregationExpression.from = 0; // clause.offset;
    aggregationExpression.size = 500000; // clause.limit;
  } else {
    if (aggregationParams.recordsSelections == null) {
      cb(null, {
        merged: false,
        message: 'Nothing to add'
      });
      return
    }
    clause = WorkspaceSchema.formulateShipmentRecordsIdentifierAggregationPipelineEngine(aggregationParams);
    aggregationExpression.from = 0; // clause.offset;
    aggregationExpression.size = 500000; // clause.limit;
    aggregationExpression.sort = clause.sort;
    aggregationExpression.query = clause.query;
  } 
  var workspace_search_query_input = {
    query: JSON.stringify(aggregationParams.matchExpressions),
    account_id: ObjectID(accountId),
    user_id: ObjectID(userId),
    created_at: new Date().getTime()
  }
  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.workspace_query_save)
    .insertOne(workspace_search_query_input)


  result = await ElasticsearchDbHandler.getDbInstance().search({
    index: tradeDataBucket,
    track_total_hits: true,
    body: aggregationExpression
  })
  let dataset = [];
  result.body.hits.hits.forEach(hit => {
    let sourceData = hit._source;
    sourceData.id = hit._id;
    dataset.push(sourceData);
  });


  await ElasticsearchDbHandler.getDbInstance().indices.create({
    index: workspaceDataBucket,
    body: workspaceElasticConfig
  }, {
      ignore: [400]
    })

  const body = dataset.flatMap(doc => [{
    index: {
      _index: workspaceDataBucket
    }
  }, doc]);

  const { body: bulkResponse } = await ElasticsearchDbHandler.getDbInstance().bulk({
    refresh: true,
    body
  })
  if (bulkResponse.errors) {
    console.log("error", bulkResponse.errors)
    const erroredDocuments = []
    // The items array has the same order of the dataset we just indexed.
    // The presence of the `error` key indicates that the operation
    // that we did for the document has failed.
    bulkResponse.items.forEach((action, i) => {
      const operation = Object.keys(action)[0];
      if (action[operation].error) {
        erroredDocuments.push({
          // If the status is 429 it means that you can retry the document,
          // otherwise it's very likely a mapping error, and you should
          // fix the document before to try it again.
          status: action[operation].status,
          error: action[operation].error,
          operation: body[i * 2],
          document: body[i * 2 + 1]
        });
      }
    });
    // 
    cb(bulkResponse.errors);
  }
  else {
    cb(null, {
      merged: true
    });

  }
};


const updateRecordMetrics = (workspaceId, workspaceDataBucket, recordsYear, recordsCount, cb) => {
  let filterClause = {
    _id: ObjectID(workspaceId)
  };

  let updateClause = {};

  updateClause.$set = {
    "records": recordsCount
  };

  if (workspaceDataBucket != null) {
    updateClause.$set.data_bucket = workspaceDataBucket;
  }

  updateClause.$addToSet = {
    "years": recordsYear
  };

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.workspace)
    .updateOne(filterClause, updateClause,
      function (err, result) {
        if (err) {
          cb(err);
        } else {
          cb(null, result);
        }
      });

};

const updatePurchaseRecordsKeeper = (workspacePurchase, cb) => {
  let filterClause = {
    taxonomy_id: ObjectID(workspacePurchase.taxonomy_id),
    account_id: ObjectID(workspacePurchase.account_id),
    code_iso_3: workspacePurchase.country,
    trade: workspacePurchase.trade
  };

  let updateClause = {};

  updateClause.$set = {
    "country": workspacePurchase.country,
    "flag_uri": workspacePurchase.flag_uri,
    "code_iso_2": workspacePurchase.code_iso_2
  };

  updateClause.$addToSet = {
    "records": {
      $each: workspacePurchase.records
    }
  };

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.purchased_records_keeper)
    .updateOne(filterClause, updateClause, {
      upsert: true
    },
      function (err, result) {
        if (err) {
          cb(err);
        } else {
          cb(null, result);
        }
      });
};

const findByFilters = (filters, cb) => {
  let filterClause = buildFilters(filters);
  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.workspace)
    .find(filterClause)
    .project({
      '_id': 1,
      'taxonomy_id': 1,
      'account_id': 1,
      'user_id': 1,
      'country': 1,
      'code_iso_3': 1,
      'code_iso_2': 1,
      'trade': 1,
      'years': 1,
      'records': 1,
      'data_bucket': 1,
      'name': 1,
      'created_ts': 1
    })
    .toArray(function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
};

const findByUser = (userId, filters, cb) => {
  let filterClause = buildFilters(filters);
  filterClause.user_id = ObjectID(userId);

  // 
  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.workspace)
    .find(filterClause)
    .project({
      '_id': 1,
      'taxonomy_id': 1,
      'account_id': 1,
      'user_id': 1,
      'country': 1,
      'code_iso_3': 1,
      'code_iso_2': 1,
      'trade': 1,
      'years': 1,
      'records': 1,
      'data_bucket': 1,
      'name': 1,
      'flag_uri': 1,
      'created_ts': 1
    })
    .toArray(function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
};

const findTemplates = (accountId, userId, tradeType, country, cb) => {

  let filterClause = {};
  if (accountId) filterClause.account_id = ObjectID(accountId);
  if (userId) filterClause.user_id = ObjectID(userId);
  if (tradeType) filterClause.trade = tradeType;
  if (country) filterClause.country = country;

  //

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.workspace)
    .find(filterClause)
    .project({
      '_id': 1,
      'taxonomy_id': 1,
      'name': 1,
    })
    .toArray(function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
};

const findByName = (accountId, userId, tradeType, countryCode, workspaceName, cb) => {

  let filterClause = {};
  if (accountId) filterClause.account_id = ObjectID(accountId);
  if (userId) filterClause.user_id = ObjectID(userId);
  if (tradeType) filterClause.trade = tradeType;
  if (countryCode) filterClause.code_iso_3 = countryCode;
  if (workspaceName) filterClause.name = workspaceName;

  //

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.workspace)
    .findOne(filterClause, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }

    });

};


const findShipmentRecordsIdentifierAggregation = (aggregationParams, dataBucket, cb) => {

  if (aggregationParams.recordsSelections && aggregationParams.recordsSelections.length > 0) {

    let shipmentRecordsIds = aggregationParams.recordsSelections.map(shipmentRecordsId => ObjectID(shipmentRecordsId));
    let aliasResult = {
      shipmentRecordsIdentifier: shipmentRecordsIds
    };
    cb(null, aliasResult);

  } else {
    let clause = WorkspaceSchema.formulateShipmentRecordsIdentifierAggregationPipeline(aggregationParams);

    let aggregationExpression = [{
      $match: clause.match
    },
    {
      $group: clause.group
    },
    {
      $project: clause.project
    }
    ];

    //

    MongoDbHandler.getDbInstance().collection(dataBucket)
      .aggregate(aggregationExpression, {
        allowDiskUse: true
      },
        function (err, cursor) {
          if (err) {
            cb(err);
          } else {
            cursor.toArray(function (err, documents) {
              if (err) {
                cb(err);
              } else {
                cb(null, (documents) ? documents[0] : null);
              }
            });
          }
        }
      );
  }

};

const findShipmentRecordsIdentifierAggregationEngine = async (aggregationParams, dataBucket, cb) => {

  if (aggregationParams.recordsSelections && aggregationParams.recordsSelections.length > 0) {

    let aliasResult = {
      shipmentRecordsIdentifier: aggregationParams.recordsSelections
    };
    cb(null, aliasResult);

  } else {
    let clause = WorkspaceSchema.formulateShipmentRecordsIdentifierAggregationPipelineEngine(aggregationParams);

    // from: clause.offset,
    // size: clause.limit,
    let aggregationExpression = {
      from: 0, //clause.offset,
      size: 500000, //clause.limit,
      sort: clause.sort,
      query: clause.query,
      aggs: clause.aggregation
    };
    

    try{
      var result = await ElasticsearchDbHandler.getDbInstance().search({
        index: dataBucket,
        track_total_hits: true,
        body: aggregationExpression
      })
      let mappedResult = {};
      mappedResult[WorkspaceSchema.IDENTIFIER_SHIPMENT_RECORDS] = [];
      result.body.hits.hits.forEach(hit => {
        mappedResult[WorkspaceSchema.IDENTIFIER_SHIPMENT_RECORDS].push(hit._id);
      });
  
  
      cb(null, (mappedResult) ? mappedResult : null);
    }catch(error){
      console.log(JSON.stringify(error));
      cb(error);
    }
    

  }

};


const findShipmentRecordsPurchasableCountAggregation = (accountId, tradeType, country, shipmentRecordsIds, cb) => {

  // shipmentRecordsIds = shipmentRecordsIds.map(shipmentRecordsId => ObjectID(shipmentRecordsId));

  let aggregationExpression = [{
    $match: {
      "account_id": ObjectID(accountId),
      "country": country,
      "trade": tradeType
    }
  },
  {
    $project: {
      "_id": 0,
      "purchase_records": {
        $filter: {
          input: shipmentRecordsIds,
          as: "record",
          cond: {
            $not: {
              $in: ["$$record", "$records"]
            }
          }
        }
      }
    }
  },
  {
    $addFields: {
      "purchasable_records_count": {
        $size: "$purchase_records"
      }
    }
  },
  {
    $project: {
      "purchasable_records_count": 1
    }
  },
  ];
  // 
  // 
  // 

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.purchased_records_keeper)
    .aggregate(aggregationExpression, {
      allowDiskUse: true
    },
      function (err, cursor) {
        if (err) {
          cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              cb(err);
            } else {
              // 
              cb(null, (documents) ? documents[0] : null);
            }
          });
        }
      }
    );

};

const findShipmentRecordsPurchasableAggregation = (accountId, tradeType, country, shipmentRecordsIds, cb) => {

  // shipmentRecordsIds = shipmentRecordsIds.map(shipmentRecordsId => ObjectID(shipmentRecordsId));

  let aggregationExpression = [{
    $match: {
      "account_id": ObjectID(accountId),
      "country": country,
      "trade": tradeType,
    }
  },
  {
    $project: {
      "_id": 0,
      "purchase_records": {
        $filter: {
          input: shipmentRecordsIds,
          as: "record",
          cond: {
            $not: {
              $in: ["$$record", "$records"]
            }
          }
        }
      }
    }
  },
  {
    $addFields: {
      "purchasable_records_count": {
        $size: "$purchase_records"
      }
    }
  },
  {
    $project: {
      "purchase_records": 1,
      "purchasable_records_count": 1
    }
  },
  ];
  // 
  // 
  // 

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.purchased_records_keeper)
    .aggregate(aggregationExpression, {
      allowDiskUse: true
    },
      function (err, cursor) {
        if (err) {
          cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              cb(err);
            } else {
              // 
              cb(null, (documents) ? documents[0] : null);
            }
          });
        }
      }
    );

};

const findShipmentRecordsCount = (dataBucket, cb) => {
  MongoDbHandler.getDbInstance().collection(dataBucket)
    .estimatedDocumentCount({}, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
};

const findShipmentRecordsCountEngine = async (dataBucket, cb) => {
  var result = await ElasticsearchDbHandler.getDbInstance().count({
    index: dataBucket
  })
  //cb(err);
  cb(null, result.body.count);

};

const findAnalyticsSpecificationByUser = (userId, workspaceId, cb) => {
  let matchBlock = {};

  if (workspaceId) {
    matchBlock._id = ObjectID(workspaceId);
  }

  if (userId) {
    matchBlock.user_id = ObjectID(userId);
  }

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.workspace)
    .aggregate(
      [{
        "$match": matchBlock
      },
      {
        "$lookup": {
          from: "taxonomies",
          localField: "taxonomy_id",
          foreignField: "_id",
          as: "taxonomy_map"
        }
      },
      {
        "$replaceRoot": {
          "newRoot": {
            "$mergeObjects": [{
              "$arrayElemAt": ["$taxonomy_map", 0]
            }, "$$ROOT"]
          }
        }
      },
      {
        "$project": {
          _id: 0,
          "taxonomy_id": 1,
          "country": 1,
          "trade": 1,
          "code_iso_3": 1,
          "code_iso_2": 1,
          "flag_uri": 1,
          "mode": 1,
          "hs_code_digit_classification": 1,
          "explore_fields": "$fields.explore",
          "search_fields": "$fields.search",
          "filter_fields": "$fields.filter",
          "all_fields": "$fields.all",
          "dataTypes_fields": "$fields.dataTypes",
          "search_field_semantic": "$fields.search_semantic",
          "filter_field_semantic": "$fields.filter_semantic",
          "traders_aggregation": "$fields.traders_aggregation",
          "records_aggregation": "$fields.records_aggregation",
          "explore_aggregation": "$fields.explore_aggregation",
          "statistics_aggregation": "$fields.statistics_aggregation",
          "analytics_framework": "$fields.analytics_framework",
          "data_bucket": 1,
          "years": 1,
          "totalRecords": "$records"
        }
      }
      ], {
        allowDiskUse: true
      },
      function (err, cursor) {
        if (err) {
          cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              cb(err);
            } else {
              cb(null, (documents) ? documents[0] : null);
            }
          });
        }
      }
    );

};


const findAnalyticsShipmentRecordsAggregation = (aggregationParams, dataBucket, offset, limit, cb) => {

  aggregationParams.offset = offset;
  aggregationParams.limit = limit;
  let clause = WorkspaceSchema.formulateShipmentRecordsAggregationPipeline(aggregationParams);

  let aggregationExpression = [{
    $match: clause.match
  },
  {
    $facet: clause.facet
  },
  {
    $project: clause.project
  }
  ];

  //

  MongoDbHandler.getDbInstance().collection(dataBucket)
    .aggregate(aggregationExpression, {
      allowDiskUse: true
    },
      function (err, cursor) {
        if (err) {
          cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              cb(err);
            } else {
              cb(null, (documents) ? documents[0] : null);
            }
          });
        }
      }
    );
};

const findAnalyticsShipmentRecordsAggregationEngine = async (aggregationParams, dataBucket, offset, limit, cb) => {

  aggregationParams.offset = offset;
  aggregationParams.limit = limit;
  let clause = WorkspaceSchema.formulateShipmentRecordsAggregationPipelineEngine(aggregationParams);

  let aggregationExpression = {
    from: clause.offset,
    size: clause.limit,
    sort: clause.sort,
    query: clause.query,
    aggs: clause.aggregation
  };
  //

  result = await ElasticsearchDbHandler.getDbInstance().search({
    index: dataBucket,
    track_total_hits: true,
    body: aggregationExpression
  })
  //cb(err);
  //
  //
  let mappedResult = {};
  mappedResult[WorkspaceSchema.RESULT_PORTION_TYPE_SUMMARY] = [{
    _id: null,
    count: result.body.hits.total.value
  }];
  mappedResult[WorkspaceSchema.RESULT_PORTION_TYPE_RECORDS] = [];
  result.body.hits.hits.forEach(hit => {
    mappedResult[WorkspaceSchema.RESULT_PORTION_TYPE_RECORDS].push(hit._source);
  });
  for (const prop in result.body.aggregations) {
    if (result.body.aggregations.hasOwnProperty(prop)) {
      if (prop.indexOf('FILTER') === 0) {
        let mappingGroups = [];
        //let mappingGroupTermCount = 0;
        let groupExpression = aggregationParams.groupExpressions.filter(expression => expression.identifier == prop)[0];

        /*if (groupExpression.isSummary) {
          mappingGroupTermCount = result.body.aggregations[prop].buckets.length;
          mappedResult[prop.replace('FILTER', 'SUMMARY')] = mappingGroupTermCount;
        }*/

        if (groupExpression.isFilter) {
          if (result.body.aggregations[prop].buckets) {
            result.body.aggregations[prop].buckets.forEach(bucket => {

              if (bucket.doc_count != null && bucket.doc_count != undefined) {
                let groupedElement = {
                  _id: ((bucket.key_as_string != null && bucket.key_as_string != undefined) ? bucket.key_as_string : bucket.key),
                  count: bucket.doc_count
                };

                if ((bucket.minRange != null && bucket.minRange != undefined) && (bucket.maxRange != null && bucket.maxRange != undefined)) {
                  groupedElement.minRange = bucket.minRange.value;
                  groupedElement.maxRange = bucket.maxRange.value;
                }

                mappingGroups.push(groupedElement);
              }

            });
          }

          let propElement = result.body.aggregations[prop];
          if ((propElement.min != null && propElement.min != undefined) && (propElement.max != null && propElement.max != undefined)) {

            let groupedElement = {};
            if (propElement.meta != null && propElement.meta != undefined) {
              groupedElement = propElement.meta;
            }
            groupedElement._id = null;
            groupedElement.minRange = propElement.min;
            groupedElement.maxRange = propElement.max;
            mappingGroups.push(groupedElement);
          }

          mappedResult[prop] = mappingGroups;
        }

      }

      if (prop.indexOf('SUMMARY') === 0 && result.body.aggregations[prop].value) {
        mappedResult[prop] = result.body.aggregations[prop].value;
      }

    }
  }
  //
  cb(null, (mappedResult) ? mappedResult : null);
};


const findShipmentRecordsDownloadAggregationEngine = async (dataBucket, offset, limit, cb) => {
  //from: offset,
  //size: limit,
  let aggregationExpression = {
    from: offset,
    size: limit,
    query: {
      match_all: {}
    }
  };
  //

  var result = await ElasticsearchDbHandler.getDbInstance().search({
    index: dataBucket,
    track_total_hits: true,
    body: aggregationExpression
  })
  //
  try {
    let mappedResult = {};
    let isHeaderFieldExtracted = false;
    mappedResult[WorkspaceSchema.RESULT_PORTION_TYPE_RECORDS] = [];
    mappedResult[WorkspaceSchema.RESULT_PORTION_TYPE_FIELD_HEADERS] = [];
    result.body.hits.hits.forEach(hit => {
      mappedResult[WorkspaceSchema.RESULT_PORTION_TYPE_RECORDS].push(hit._source);
      if (!isHeaderFieldExtracted) {
        const keys = Object.keys(hit._source);
        keys.forEach((key, index) => {
          //
          mappedResult[WorkspaceSchema.RESULT_PORTION_TYPE_FIELD_HEADERS].push({
            id: key,
            title: key
          });
        });
      }
      isHeaderFieldExtracted = true;
    });

    // 
    cb(null, (mappedResult) ? mappedResult : null);
  } catch (err) {
    console.log(err);
    cb(err)
  }

};

const findAnalyticsShipmentRecordsDownloadAggregationEngine = async (aggregationParams, dataBucket, cb) => {

  let clause = WorkspaceSchema.formulateShipmentRecordsAggregationPipelineEngine(aggregationParams);

  let aggregationExpression = {
    from: clause.offset,
    size: clause.limit,
    sort: clause.sort,
    query: clause.query
  };
  //
  try {

    var result = await ElasticsearchDbHandler.getDbInstance().search({
      index: dataBucket,
      track_total_hits: true,
      body: aggregationExpression
    })
    //

    let mappedResult = {};
    let isHeaderFieldExtracted = false;
    mappedResult[WorkspaceSchema.RESULT_PORTION_TYPE_RECORDS] = [];
    mappedResult[WorkspaceSchema.RESULT_PORTION_TYPE_FIELD_HEADERS] = [];
    result.body.hits.hits.forEach(hit => {
      mappedResult[WorkspaceSchema.RESULT_PORTION_TYPE_RECORDS].push(hit._source);
      if (!isHeaderFieldExtracted) {
        const keys = Object.keys(hit._source);
        keys.forEach((key, index) => {
          //
          mappedResult[WorkspaceSchema.RESULT_PORTION_TYPE_FIELD_HEADERS].push({
            id: key,
            title: key
          });
        });
      }
      isHeaderFieldExtracted = true;
    });

    // 
    cb(null, (mappedResult) ? mappedResult : null);
  }
  catch (err) {
    cb(err)
  }
};



const findAnalyticsShipmentStatisticsAggregation = (aggregationParams, dataBucket, offset, limit, cb) => {

  aggregationParams.offset = offset;
  aggregationParams.limit = limit;
  let clause = WorkspaceSchema.formulateShipmentStatisticsAggregationPipeline(aggregationParams);

  let aggregationExpression = [{
    $match: clause.match
  },
  {
    $facet: clause.facet
  },
  {
    $project: clause.project
  }
  ];

  //

  MongoDbHandler.getDbInstance().collection(dataBucket)
    .aggregate(aggregationExpression, {
      allowDiskUse: true
    },
      function (err, cursor) {
        if (err) {
          cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              cb(err);
            } else {
              cb(null, (documents) ? documents[0] : null);
            }
          });
        }
      }
    );

};


const findAnalyticsShipmentsTradersByPattern = (searchTerm, searchField, dataBucket, cb) => {

  let regExpSearchTermGroups = '';
  const searchTermWords = searchTerm.split(' ');
  searchTermWords.forEach(searchElement => {
    //regExpSearchTermGroups = regExpSearchTermGroups + `(?=.*\\b${searchElement}\\b)`; // APPLY WORD BOUNDARY
    regExpSearchTermGroups = regExpSearchTermGroups + `(?=.*${searchElement})`;
  });
  let regExpSearchTerm = new RegExp(regExpSearchTermGroups + '.+');

  let matchClause = {};
  matchClause[searchField] = {
    $regex: regExpSearchTerm, //searchTerm,
    $options: 'i'
  };
  /*matchClause[searchField] = {
    $regex: searchTerm,
    $options: 'i'
  };*/

  let groupClause = {};
  groupClause._id = `$${searchField}`;

  /*let aggregationExpression = [{
    $match: matchClause
  }, {
    $group: groupClause
  }];*/

  let aggregationExpression = [{
    $match: matchClause
  },
  {
    $group: groupClause
  },
  {
    $skip: 0,
  },
  {
    $limit: 100
  },
  {
    $project: {
      _id: `$_id`
    }
  }
  ];

  // 

  MongoDbHandler.getDbInstance().collection(dataBucket)
    .aggregate(aggregationExpression, {
      allowDiskUse: true
    },
      function (err, cursor) {
        if (err) {
          cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              cb(err);
            } else {
              cb(null, (documents) ? documents : null);
            }
          });
        }
      }
    );

};


const findAnalyticsShipmentsTradersByPatternEngine = (searchTerm, searchField, dataBucket, cb) => {

  let wildcardSearchTermGroups = [];
  const searchTermWords = searchTerm.split(' ');
  searchTermWords.forEach(searchElement => {
    let wildcardPortion = {};
    wildcardPortion[searchField] = {
      value: '*' + searchElement + '*'
    };
    wildcardSearchTermGroups.push({
      wildcard: wildcardPortion
    });
  });
  let queryClause = {
    bool: {
      must: wildcardSearchTermGroups
    }
  };

  let aggregationClause = {
    GROUPED_PATTERNS: {
      terms: {
        field: searchField + '.keyword',
        size: 1000
      }
    }
  };

  let aggregationExpression = {
    size: 0,
    _source: searchField,
    query: queryClause,
    aggs: aggregationClause
  };
  // 


  ElasticsearchDbHandler.getDbInstance().search({
    index: dataBucket,
    track_total_hits: true,
    body: aggregationExpression
  }, (err, result) => {
    if (err) {
      cb(err);
    } else {

      let mappedResult = [];
      // 
      result.body.aggregations.GROUPED_PATTERNS.buckets.forEach(bucket => {
        mappedResult.push({
          _id: bucket.key
        });
      });

      // 
      cb(null, (mappedResult) ? mappedResult : null);

    }

  });

};


module.exports = {
  add,
  remove,
  addRecordsAggregation,
  addRecordsAggregationEngine,
  updateRecordMetrics,
  updatePurchaseRecordsKeeper,
  findByFilters,
  findByUser,
  findTemplates,
  findByName,
  findShipmentRecordsIdentifierAggregation,
  findShipmentRecordsIdentifierAggregationEngine,
  findShipmentRecordsPurchasableCountAggregation,
  findShipmentRecordsPurchasableAggregation,
  findShipmentRecordsCount,
  findShipmentRecordsCountEngine,
  findAnalyticsSpecificationByUser,
  findAnalyticsShipmentRecordsAggregation,
  findAnalyticsShipmentRecordsAggregationEngine,
  findShipmentRecordsDownloadAggregationEngine,
  findAnalyticsShipmentRecordsDownloadAggregationEngine,
  findAnalyticsShipmentStatisticsAggregation,
  findAnalyticsShipmentsTradersByPattern,
  findAnalyticsShipmentsTradersByPatternEngine
};
