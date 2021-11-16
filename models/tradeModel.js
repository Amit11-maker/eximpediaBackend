const TAG = 'tradeModel';

const ObjectID = require('mongodb').ObjectID;

const MongoDbHandler = require('../db/mongoDbHandler');
const ElasticsearchDbHandler = require('../db/elasticsearchDbHandler');
const TradeSchema = require('../schemas/tradeSchema');

const SEPARATOR_UNDERSCORE = '_';

function isEmptyObject(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key))
      return false;
  }
  return true;
}

const buildFilters = (filters) => {
  let filterClause = {};
  if (filters.tradeType) filterClause.trade = filters.tradeType;
  if (filters.countryCode) {
    filterClause.$or = [{
      'code_iso_3': filters.countryCode
    }, {
      'code_iso_2': filters.countryCode
    }];
  }
  if (filters.tradeYear) filterClause.year = parseInt(filters.tradeYear);
  if (filters.isPublished) filterClause.is_published = parseInt(filters.isPublished);
  return filterClause;
};

const findByFilters = (filters, cb) => {
  let filterClause = buildFilters(filters);
  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.taxonomy)
    .find(filterClause)
    .project({
      '_id': 1,
      'country': 1,
      'code_iso_3': 1,
      'flag_uri': 1,
      'trade': 1,
      'bucket': 1,
      'fields': 1
    })
    .toArray(function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
};

const findTradeCountries = (tradeType, constraints, cb) => {
  let matchBlock = {
    "data_stages.examine.status": "COMPLETED",
    "data_stages.upload.status": "COMPLETED",
    "data_stages.ingest.status": "COMPLETED"
  };

  if (tradeType) {
    matchBlock.trade = tradeType;
  }

  if (constraints.allowedCountries) {
    matchBlock.code_iso_3 = {
      $in: constraints.allowedCountries
    };
  }


  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.ledger)
    .aggregate(
      [{
        "$match": matchBlock
      },
      {
        "$group": {
          "_id": {
            country: "$country",
            trade: "$trade"
          },
          "taxonomy_id": {
            $first: "$taxonomy_id"
          },
          "data_bucket": {
            $first: "$data_bucket"
          },
          "recentRecordsAddition": {
            $max: "$created_ts"
          },
          "totalRecords": {
            $sum: "$records"
          },
          "publishedRecords": {
            $sum: {
              $cond: [{
                $eq: ["$is_published", 1]
              }, "$records", 0]
            }
          },
          "unpublishedRecords": {
            $sum: {
              $cond: [{
                $eq: ["$is_published", 0]
              }, "$records", 0]
            }
          }
        }
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
        "$addFields": {
          "country_lower": {
            "$toLower": "$_id.country"
          },
          "trade_lower": {
            "$toLower": "$_id.trade"
          }
        }
      },
      {
        "$lookup": {
          from: 'country_date_range',
          localField: 'country_lower',
          foreignField: 'country',
          as: 'country_refresh'
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
          "country": "$_id.country",
          "trade": "$_id.trade",
          "code_iso_3": 1,
          "code_iso_2": 1,
          "flag_uri": 1,
          "mode": 1,
          "showcase_fields": "$fields.showcase",
          "data_bucket": 1,
          "recentRecordsAddition": 1,
          "totalRecords": 1,
          "publishedRecords": 1,
          "unpublishedRecords": 1,
          "refresh_data": {
            "$filter": {
              "input": "$country_refresh",
              "as": "country_refresh",
              "cond": {
                "$eq": [
                  "$$country_refresh.trade_type",
                  "$trade_lower"
                ]
              }
            }
          }
        }
      },
      {
        "$sort": {
          "country": 1
        }
      },
      ], {
      allowDiskUse: true
    },
      function (err, cursor) {
        if (err) {
          cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              console.log(err)
              cb(err);
            } else {
              var output = {}
              for (var doc of documents) {
                if (doc.hasOwnProperty("refresh_data") && doc.refresh_data.length > 0) {
                  doc.dataRange = {
                    start: doc.refresh_data[0].start_date,
                    end: doc.refresh_data[0].end_date
                  }
                  doc.count = doc.refresh_data[0].number_of_records
                  delete doc.refresh_data
                }
              }
              cb(null, documents);
            }
          });
        }
      }
    );

};

const findTradeShipmentSpecifications = (tradeType, countryCode, constraints, cb) => {

  let matchBlock = {
    "data_stages.examine.status": "COMPLETED",
    "data_stages.upload.status": "COMPLETED",
    "data_stages.ingest.status": "COMPLETED"
  };

  if (tradeType) {
    matchBlock.trade = tradeType;
  }

  if (countryCode) {
    matchBlock.code_iso_3 = countryCode;
  }

  /*if (countryCode) {
    if (constraints.allowedCountries && constraints.allowedCountries.length >= 0) {
      matchBlock.code_iso_3 = (constraints.allowedCountries.includes(countryCode) ? countryCode : "");
    } else {
      matchBlock.code_iso_3 = countryCode;
    }
  }*/

  // if (constraints.dataAccessYears) {
  //   matchBlock.year = {
  //     $in: constraints.dataAccessYears
  //   };
  // }
  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.ledger)
    .aggregate(
      [{
        "$match": matchBlock
      },
      {
        "$group": {
          "_id": {
            country: "$country",
            trade: "$trade"
          },
          "taxonomy_id": {
            $first: "$taxonomy_id"
          },
          "data_bucket": {
            $first: "$data_bucket"
          },
          // "years": {
          //   $addToSet: "$year"
          // },
          "recentRecordsAddition": {
            $max: "$created_ts"
          },
          "totalRecords": {
            $sum: "$records"
          },
          "publishedRecords": {
            $sum: {
              $cond: [{
                $eq: ["$is_published", 1]
              }, "$records", 0]
            }
          },
          "unpublishedRecords": {
            $sum: {
              $cond: [{
                $eq: ["$is_published", 0]
              }, "$records", 0]
            }
          }
        }
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
        "$lookup": {
          from: "country_date_range",
          localField: "taxonomy_id",
          foreignField: "taxonomy_id",
          as: "country_date"
        }
      },
      {
        "$project": {
          _id: 0,
          "country": "$_id.country",
          "trade": "$_id.trade",
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
          "explore_aggregation": "$fields.explore_aggregation",
          "records_aggregation": "$fields.records_aggregation",
          "statistics_aggregation": "$fields.statistics_aggregation",
          "data_bucket": "$bucket",
          "years": 1,
          "recentRecordsAddition": 1,
          "totalRecords": 1,
          "publishedRecords": 1,
          "unpublishedRecords": 1,
          "data_start_date": { $arrayElemAt: ["$country_date.start_date", 0] },
          "data_end_date": { $arrayElemAt: ["$country_date.end_date", 0] }
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
              cb(null, documents);
            }
          });
        }
      }
    );

};

const findTradeShipments = (searchParams, filterParams, dataBucket, offset, limit, cb) => {

  let matchBlock = {};

  MongoDbHandler.getDbInstance().collection(dataBucket)
    .find({})
    .skip(parseInt(offset))
    .limit(parseInt(limit))
    .toArray(function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });

};


const findTradeShipmentRecordsAggregation = (aggregationParams, dataBucket, accountId, recordPurchasedParams, offset, limit, cb) => {

  aggregationParams.accountId = accountId;
  aggregationParams.purhcaseParams = recordPurchasedParams;
  aggregationParams.offset = offset;
  aggregationParams.limit = limit;
  let clause = TradeSchema.formulateShipmentRecordsAggregationPipeline(aggregationParams);

  let aggregationExpression = [{
    $match: clause.match
  },
  {
    $limit: clause.limit
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
          throw err; //cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              throw err; //cb(err);
            } else {
              cb(null, (documents) ? documents[0] : null);
            }
          });
        }
      }
    );

};

const findTradeShipmentRecordsAggregationEngine = async (aggregationParams, dataBucket, userId, accountId, recordPurchasedParams, offset, limit, cb) => {
  aggregationParams.accountId = accountId;
  aggregationParams.purhcaseParams = recordPurchasedParams;
  aggregationParams.offset = offset;
  aggregationParams.limit = limit;
  for (let matchExpression of aggregationParams.matchExpressions) {
    if (matchExpression.expressionType == 203) {
      if (matchExpression.fieldValue.slice(-1).toLowerCase() == "y") {
        var analyzerOutput = await ElasticsearchDbHandler.dbClient.indices.analyze({
          index: dataBucket,
          body: {
            "text": matchExpression.fieldValue,
            "analyzer": "my_search_analyzer"
          }
        })
        if (analyzerOutput.body.tokens.length > 0 && analyzerOutput.body.tokens[0].token.length < matchExpression.fieldValue.length) {
          matchExpression.analyser = true
        }
        else
          matchExpression.analyser = false
      }
      else {
        matchExpression.analyser = true
      }
    }
  }
  let clause = TradeSchema.formulateShipmentRecordsAggregationPipelineEngine(aggregationParams);
  count = 0
  var explore_search_query_input = {
    query: JSON.stringify(aggregationParams.matchExpressions),
    account_id: ObjectID(accountId),
    user_id: ObjectID(userId),
    created_at: new Date().getTime()
  }
  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.explore_search_query)
    .insertOne(explore_search_query_input)

  let aggregationExpressionArr = [];
  let aggregationExpression = {
    from: clause.offset,
    size: clause.limit,
    sort: clause.sort,
    query: clause.query,
    aggs: {}
  };
  // console.log(aggregationExpression, clause.aggregation);
  aggregationExpressionArr.push({ ...aggregationExpression })
  aggregationExpression = {
    from: clause.offset,
    size: 0,
    sort: clause.sort,
    query: clause.query,
    aggs: {}
  };
  for (let agg in clause.aggregation) {
    count += 1;
    aggregationExpression.aggs[agg] = clause.aggregation[agg]

    aggregationExpressionArr.push({ ...aggregationExpression })
    aggregationExpression = {
      from: clause.offset,
      size: 0,
      sort: clause.sort,
      query: clause.query,
      aggs: {}
    };

  }
  // dataBucket = "eximpedia_bucket_import_ind"
  try {
    resultArr = []
    for (let query of aggregationExpressionArr) {
      // console.log(JSON.stringify(query));
      resultArr.push(ElasticsearchDbHandler.dbClient.search({
        index: dataBucket,
        track_total_hits: true,
        body: query
      }))
    }

    let mappedResult = {};
    let idArr = []

    for (let idx = 0; idx < resultArr.length; idx++) {
      let result = await resultArr[idx];
      if (idx == 0) {
        mappedResult[TradeSchema.RESULT_PORTION_TYPE_SUMMARY] = [{
          _id: null,
          count: result.body.hits.total.value
        }];
        mappedResult[TradeSchema.RESULT_PORTION_TYPE_RECORDS] = [];
        result.body.hits.hits.forEach(hit => {
          let sourceData = hit._source;
          sourceData._id = hit._id;
          idArr.push(hit._id);
          mappedResult[TradeSchema.RESULT_PORTION_TYPE_RECORDS].push(sourceData);
        });
      }
      for (const prop in result.body.aggregations) {
        if (result.body.aggregations.hasOwnProperty(prop)) {
          if (prop.indexOf('FILTER') === 0) {
            let mappingGroups = [];
            //let mappingGroupTermCount = 0;
            let groupExpression = aggregationParams.groupExpressions.filter(expression => expression.identifier == prop)[0];


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
    }
    mappedResult["idArr"] = idArr
    cb(null, (mappedResult) ? mappedResult : null);
  } catch (err) {
    console.log(JSON.stringify(err))
    cb(err)
  }

};


// Distribute Result Explore
const findTradeShipmentRecords = (aggregationParams, dataBucket, accountId, recordPurchasedParams, offset, limit, cb) => {

  aggregationParams.accountId = accountId;
  aggregationParams.purhcaseParams = recordPurchasedParams;
  aggregationParams.offset = offset;
  aggregationParams.limit = limit;
  let clause = TradeSchema.formulateShipmentRecordsStrippedAggregationPipeline(aggregationParams);

  let aggregationExpression = [];

  if (clause.search != null && clause.search != undefined) {
    if (!isEmptyObject(clause.search)) {
      aggregationExpression.push({
        $search: clause.search
      });
    }
  }

  if (clause.match != null && clause.match != undefined) {
    if (!isEmptyObject(clause.match)) {
      aggregationExpression.push({
        $match: clause.match
      });
    }
  }

  if (clause.sort != null && clause.sort != undefined) {
    if (!isEmptyObject(clause.sort)) {
      aggregationExpression.push({
        $sort: clause.sort
      });
    }
  }

  if ((clause.skip != null && clause.skip != undefined) && (clause.limit != null && clause.limit != undefined)) {
    aggregationExpression.push({
      $skip: clause.skip
    });
    aggregationExpression.push({
      $limit: clause.limit
    });
  }

  aggregationExpression.push({
    $lookup: clause.lookup
  });

  // 

  MongoDbHandler.getDbInstance().collection(dataBucket)
    .aggregate(aggregationExpression, {
      allowDiskUse: true
    },
      function (err, cursor) {
        if (err) {
          throw err; //cb(err);
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

// Distribute Result Explore
const findTradeShipmentSummary = (aggregationParams, dataBucket, offset, limit, cb) => {

  aggregationParams.offset = offset;
  aggregationParams.limit = limit;
  let clause = TradeSchema.formulateShipmentSummaryStrippedAggregationPipeline(aggregationParams);

  let aggregationExpression = [];

  if (clause.search != null && clause.search != undefined) {
    if (!isEmptyObject(clause.search)) {
      aggregationExpression.push({
        $search: clause.search
      });
    }
  }

  if (clause.match != null && clause.match != undefined) {
    if (!isEmptyObject(clause.match)) {
      aggregationExpression.push({
        $match: clause.match
      });
    }
  }

  if (clause.sort != null && clause.sort != undefined) {
    if (!isEmptyObject(clause.sort)) {
      aggregationExpression.push({
        $sort: clause.sort
      });
    }
  }

  if ((clause.skip != null && clause.skip != undefined) && (clause.limit != null && clause.limit != undefined)) {
    aggregationExpression.push({
      $skip: clause.skip
    });
    aggregationExpression.push({
      $limit: clause.limit
    });
  }

  // Searchable Data Results Limit for Efficiency
  aggregationExpression.push({
    $limit: 1000
  });

  aggregationExpression.push({
    $facet: clause.facet
  });

  aggregationExpression.push({
    $project: clause.project
  });

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

// Distribute Result Explore
const findTradeShipmentFilter = (aggregationParams, dataBucket, offset, limit, cb) => {

  aggregationParams.offset = offset;
  aggregationParams.limit = limit;
  let clause = TradeSchema.formulateShipmentFilterStrippedAggregationPipeline(aggregationParams);

  let aggregationExpression = [];

  if (clause.search != null && clause.search != undefined) {
    if (!isEmptyObject(clause.search)) {
      aggregationExpression.push({
        $search: clause.search
      });
    }
  }

  if (clause.match != null && clause.match != undefined) {
    if (!isEmptyObject(clause.match)) {
      aggregationExpression.push({
        $match: clause.match
      });
    }
  }

  if (clause.sort != null && clause.sort != undefined) {
    if (!isEmptyObject(clause.sort)) {
      aggregationExpression.push({
        $sort: clause.sort
      });
    }
  }

  if ((clause.skip != null && clause.skip != undefined) && (clause.limit != null && clause.limit != undefined)) {
    aggregationExpression.push({
      $skip: clause.skip
    });
    aggregationExpression.push({
      $limit: clause.limit
    });
  }

  // Searchable Data Results Limit for Efficiency
  aggregationExpression.push({
    $limit: 1000
  });

  aggregationExpression.push({
    $facet: clause.facet
  });

  aggregationExpression.push({
    $project: clause.project
  });

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


const findTradeShipmentStatisticsAggregation = (aggregationParams, dataBucket, offset, limit, cb) => {

  aggregationParams.offset = offset;
  aggregationParams.limit = limit;
  let clause = TradeSchema.formulateShipmentStatisticsAggregationPipeline(aggregationParams);

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


const findTradeShipmentsTraders = (aggregationParams, dataBucket, cb) => {

  let clause = TradeSchema.formulateShipmentTradersAggregationPipeline(aggregationParams);

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

const findTradeShipmentsTradersByPattern = (searchTerm, searchField, dataBucket, tradeMeta, cb) => {

  let searchClause = {
    index: tradeMeta.indexNamePrefix.concat(tradeMeta.traderType, SEPARATOR_UNDERSCORE, tradeMeta.tradeYear), //searchTerm,
    autocomplete: {
      query: searchTerm,
      path: searchField,
      tokenOrder: "any" // any|sequential
    }
  };

  let groupClause = {};
  groupClause._id = `$${searchField}`;

  let aggregationExpression = [{
    $search: searchClause
  },
  {
    $skip: 0,
  },
  {
    $limit: 100
  },
  {
    $project: {
      _id: `$${searchField}`
    }
  }
  ];

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

const findTradeShipmentsTradersByPatternEngine = async (searchTerm, searchField, tradeMeta, cb) => {
  let aggregationExpressionFuzzy = {
    size: 0,
    query: {
      match: {
      }
    },
    aggs: {
    }
  };
  aggregationExpressionFuzzy.query.match[searchField] = {
    "query": searchTerm,
    "operator": "and",
    "fuzziness": "auto"
  }
  aggregationExpressionFuzzy.aggs["searchText"] = {
    "terms": {
      "field": searchField + ".keyword"
    }
  }
  let aggregationExpressionPrefix = {
    size: 0,
    query: {
      match_phrase_prefix: {
      }
    },
    aggs: {
    }
  };
  aggregationExpressionPrefix.query.match_phrase_prefix[searchField] = { "query": searchTerm }
  aggregationExpressionPrefix.aggs["searchText"] = {
    "terms": {
      "field": searchField + ".keyword"
    }
  }
  // console.log(tradeMeta.indexNamePrefix, JSON.stringify(aggregationExpressionPrefix))

  try {
    let resultPrefix = ElasticsearchDbHandler.dbClient.search({
      index: tradeMeta.indexNamePrefix,
      track_total_hits: true,
      body: aggregationExpressionPrefix
    })
    let result = await ElasticsearchDbHandler.dbClient.search({
      index: tradeMeta.indexNamePrefix,
      track_total_hits: true,
      body: aggregationExpressionFuzzy
    })
    var output = [];
    // console.log(JSON.stringify(aggregationExpression), result.body.aggregations)
    var dataSet = []
    if (result.body.aggregations.hasOwnProperty("searchText")) {
      if (result.body.aggregations.searchText.hasOwnProperty("buckets")) {
        for (const prop of result.body.aggregations.searchText.buckets) {
          // console.log(prop);
          if (!dataSet.includes(prop.key.trim())) {
            output.push({ "_id": prop.key.trim() })
            dataSet.push(prop.key.trim())
          }
        }
      }
    }
    resultPrefix = await resultPrefix;
    if (await resultPrefix.body.aggregations.hasOwnProperty("searchText")) {
      if (resultPrefix.body.aggregations.searchText.hasOwnProperty("buckets")) {
        for (const prop of resultPrefix.body.aggregations.searchText.buckets) {
          // console.log(prop);
          if (!dataSet.includes(prop.key.trim())) {
            output.push({ "_id": prop.key.trim() })
            dataSet.push(prop.key.trim())
          }
        }
      }
    }

    cb(null, (output) ? output : null);
  } catch (err) {
    console.log(err)
    cb(err)
  }

};

const findShipmentsCount = (dataBucket, cb) => {
  MongoDbHandler.getDbInstance().collection(dataBucket)
    .estimatedDocumentCount({}, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
};


module.exports = {
  findByFilters,
  findTradeCountries,
  findTradeShipmentSpecifications,
  findTradeShipments,
  findTradeShipmentRecordsAggregation,
  findTradeShipmentRecordsAggregationEngine,
  findTradeShipmentRecords,
  findTradeShipmentSummary,
  findTradeShipmentFilter,
  findTradeShipmentStatisticsAggregation,
  findTradeShipmentsTraders,
  findTradeShipmentsTradersByPattern,
  findTradeShipmentsTradersByPatternEngine,
  findShipmentsCount
};
