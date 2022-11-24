
const ObjectID = require("mongodb").ObjectID;
const ElasticsearchDbQueryBuilderHelper = require('./../helpers/elasticsearchDbQueryBuilderHelper');
const MongoDbHandler = require("../db/mongoDbHandler");
const ElasticsearchDbHandler = require("../db/elasticsearchDbHandler");
const WorkspaceSchema = require("../schemas/workspaceSchema");
const ActivityModel = require("../models/activityModel");
const { getSearchData } = require("../helpers/recordSearchHelper")
const ExcelJS = require("exceljs");
const s3Config = require("../config/aws/s3Config");
const { searchEngine } = require("../helpers/searchHelper");
const { logger } = require("../config/logger")

let recordsLimitPerWorkspace = 50000; //default workspace record limit

const accountLimitsCollection = MongoDbHandler.collections.account_limits;

const INDIA_EXPORT_COLUMN_NAME = {
  "BILL_NO": "SB_NO",
  "FOUR_DIGIT": "FOUR_DIGIT",
  "EXP_DATE": "DATE",
  "HS_CODE": "HS_CODE",
  "PRODUCT_DESCRIPTION": "GOODS_DESCRIPTION",
  "QUANTITY": "QUANTITY",
  "UNIT": "UNIT",
  "ITEM_RATE_INV": "ITEM_PRICE_INV",
  "CURRENCY": "CURRENCY",
  "TOTAL_AMOUNT_INV_FC": "TOTAL_PRICE_INV_FC",
  "FOB_INR": "FOB_INR",
  "ITEM_RATE_INR": "UNIT_PRICE_INR",
  "FOB_USD": "FOB_USD",
  "USD_EXCHANGE_RATE": "EXCHANGE_RATE_USD",
  "FOREIGN_PORT": "DESTINATION_PORT",
  "COUNTRY": "COUNTRY",
  "INDIAN_PORT": "INDIAN_PORT",
  "IEC": "IEC",
  "EXPORTER_NAME": "EXPORTER",
  "ADDRESS": "ADDRESS",
  "CITY": "CITY",
  "PIN": "PIN",
  "BUYER_NAME": "CONSIGNEE_NAME",
  "BUYER_ADDRESS": "CONSIGNEE_ADDRESS",
  "INVOICE_NO": "INVOICE_NO",
  "CUSH": "PORT_CODE",
  "ITEM_NO": "ITEM_NO",
  "DRAWBACK": "DRAWBACK",
  "STD_QUANTITY": "STD_QUANTITY",
  "STD_UNIT": "STD_UNIT",
  "STD_ITEM_RATE_INR": "STD_ITEM_RATE_INR",
  "STD_ITEM_RATE_INV": "STD_ITEM_RATE_USD"
}

const INDIA_IMPORT_COLUMN_NAME = {
  "HS_CODE": "HS_CODE",
  "IMP_DATE": "DATE",
  "PRODUCT_DESCRIPTION": "GOODS_DESCRIPTION",
  "TOTAL_ASSESS_USD": "TOTAL_VALUE_USD",
  "TOTAL_ASSESSABLE_VALUE_INR": "TOTAL_VALUE_INR",
  "IMPORTER_NAME": "IMPORTER",
  "SUPPLIER_NAME": "SUPPLIER",
  "UNIT": "UNIT",
  "QUANTITY": "QUANTITY",
  "ADDRESS": "ADDRESS",
  "APPRAISING_GROUP": "APPRAISING_GROUP",
  "BE_NO": "BILL OF ENTRY",
  "CHA_NAME": "CHA_NAME",
  "CHA_NO": "CHA_NO",
  "CITY": "CITY",
  "CUSH": "PORT_CODE",
  "IEC": "IEC",
  "INDIAN_PORT": "INDIAN_PORT",
  "INVOICE_CURRENCY": "INVOICE_CURRENCY",
  "INVOICE_NO": "INVOICE_NO",
  "INVOICE_UNITPRICE_FC": "INVOICE_UNITPRICE_FC",
  "ORIGIN_COUNTRY": "COUNTRY_OF_ORIGIN",
  "PORT_OF_SHIPMENT": "LOADING_PORT",
  "RECORDS_TAG": "RECORDS_TAG",
  "SUPPLIER_ADDRESS": "SUPPLIER_ADDRESS",
  "TOTAL_DUTY_PAID": "DUTY_PAID_INR",
  "TYPE": "BE_TYPE",
  "UNIT_PRICE_USD": "UNIT_PRICE_USD",
  "UNIT_VALUE_INR": "UNIT_PRICE_INR",
  "STD_QUANTITY": "STD_QUANTITY",
  "STD_UNIT": "STD_UNIT",
  "STD_UNIT_PRICE_USD": "STD_UNIT_PRICE_USD",
  "STD_UNIT_VALUE_INR": " STD_UNIT_VALUE_INR"
}

const buildFilters = (filters) => {
  let filterClause = {};
  // filterClause.years = {};
  if (filters.tradeType != null) filterClause.trade = filters.tradeType;
  if (filters.countryCode != null)
    filterClause.code_iso_3 = filters.countryCode;
  // if (filters.tradeYear != null) filterClause.years.$in = [filters.tradeYear];
  return filterClause;
}

const add = (workspace, cb) => {
  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.workspace)
    .insertOne(workspace, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
}

const updateRecordMetrics = (workspaceId, workspaceDataBucket, recordsYear, recordsCount, s3FilePath, cb) => {
  let filterClause = {
    _id: ObjectID(workspaceId)
  }

  let updateClause = {
    $set: {
      records: recordsCount,
      s3_path: s3FilePath,
      start_date: "",
      end_date: "",
    },
    $addToSet: {
      years: recordsYear
    }
  }

  if (workspaceDataBucket != null) {
    updateClause.$set.data_bucket = workspaceDataBucket;
  }

  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.workspace)
    .updateOne(filterClause, updateClause, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
}

const findByFilters = (filters, cb) => {
  let filterClause = buildFilters(filters);
  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.workspace)
    .find(filterClause)
    .project({
      _id: 1,
      taxonomy_id: 1,
      account_id: 1,
      user_id: 1,
      country: 1,
      code_iso_3: 1,
      code_iso_2: 1,
      trade: 1,
      years: 1,
      records: 1,
      data_bucket: 1,
      name: 1,
      created_ts: 1,
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
  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.workspace)
    .find(filterClause)
    .project({
      _id: 1,
      taxonomy_id: 1,
      account_id: 1,
      user_id: 1,
      country: 1,
      code_iso_3: 1,
      code_iso_2: 1,
      trade: 1,
      years: 1,
      records: 1,
      data_bucket: 1,
      name: 1,
      flag_uri: 1,
      created_ts: 1,
      end_date: 1,
      start_date: 1,
      s3_path: 1
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
  let filterClause = {}
  if (accountId) filterClause.account_id = ObjectID(accountId);
  if (userId) filterClause.user_id = ObjectID(userId);
  if (tradeType) filterClause.trade = tradeType;
  if (country) filterClause.country = country;

  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.workspace)
    .find(filterClause).project({ _id: 1, taxonomy_id: 1, name: 1, })
    .toArray((err, result) => {
      if (err) {
        console.log("Function = findTemplates ERROR = ", err);
        cb(err);
      } else {
        cb(null, result);
      }
    });
}

const findByName = (accountId, userId, tradeType, countryCode, workspaceName, cb) => {
  let filterClause = {};
  if (accountId) filterClause.account_id = ObjectID(accountId);
  if (userId) filterClause.user_id = ObjectID(userId);
  if (tradeType) filterClause.trade = tradeType;
  if (countryCode) filterClause.code_iso_3 = countryCode;
  if (workspaceName) filterClause.name = workspaceName;

  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.workspace)
    .findOne(filterClause, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
};

const findShipmentRecordsIdentifierAggregation = (
  aggregationParams,
  dataBucket,
  cb
) => {
  if (
    aggregationParams.recordsSelections &&
    aggregationParams.recordsSelections.length > 0
  ) {
    let shipmentRecordsIds = aggregationParams.recordsSelections.map(
      (shipmentRecordsId) => ObjectID(shipmentRecordsId)
    );
    let aliasResult = {
      shipmentRecordsIdentifier: shipmentRecordsIds,
    };
    cb(null, aliasResult);
  } else {
    let clause =
      WorkspaceSchema.formulateShipmentRecordsIdentifierAggregationPipeline(
        aggregationParams
      );

    let aggregationExpression = [
      {
        $match: clause.match,
      },
      {
        $group: clause.group,
      },
      {
        $project: clause.project,
      },
    ];

    //

    MongoDbHandler.getDbInstance()
      .collection(dataBucket)
      .aggregate(
        aggregationExpression,
        {
          allowDiskUse: true,
        },
        function (err, cursor) {
          if (err) {
            cb(err);
          } else {
            cursor.toArray(function (err, documents) {
              if (err) {
                cb(err);
              } else {
                cb(null, documents ? documents[0] : null);
              }
            });
          }
        }
      );
  }
}

const findShipmentRecordsPurchasableCountAggregation = (accountId, tradeType, country, shipmentRecordsIds, cb) => {
  // shipmentRecordsIds = shipmentRecordsIds.map(shipmentRecordsId => ObjectID(shipmentRecordsId));

  let aggregationExpression = [
    {
      $match: {
        account_id: ObjectID(accountId),
        country: country,
        trade: tradeType,
      },
    },
    {
      $project: {
        _id: 0,
        purchase_records: {
          $filter: {
            input: shipmentRecordsIds,
            as: "record",
            cond: {
              $not: {
                $in: ["$$record", "$records"],
              },
            },
          },
        },
      },
    },
    {
      $addFields: {
        purchasable_records_count: {
          $size: "$purchase_records",
        },
      },
    },
    {
      $project: {
        purchasable_records_count: 1,
      },
    },
  ]
  //
  //
  //
  console.log("AccountID =======================", accountId, "\nshipmentRecordsIds =====================", shipmentRecordsIds.length);

  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.purchased_records_keeper)
    .aggregate(
      aggregationExpression,
      {
        allowDiskUse: true,
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
              cb(null, documents ? documents[0] : null);
            }
          });
        }
      }
    );
};

const findShipmentRecordsPurchasableAggregation = (
  accountId,
  tradeType,
  country,
  shipmentRecordsIds,
  cb
) => {
  let aggregationExpression = [
    {
      $match: {
        account_id: ObjectID(accountId),
        country: country,
        trade: tradeType,
      },
    },
    {
      $project: {
        _id: 0,
        purchase_records: {
          $filter: {
            input: shipmentRecordsIds,
            as: "record",
            cond: {
              $not: {
                $in: ["$$record", "$records"],
              },
            },
          },
        },
      },
    },
    {
      $addFields: {
        purchasable_records_count: {
          $size: "$purchase_records",
        },
      },
    },
    {
      $project: {
        purchase_records: 1,
        purchasable_records_count: 1,
      },
    },
  ];
  //
  //
  //

  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.purchased_records_keeper)
    .aggregate(
      aggregationExpression,
      {
        allowDiskUse: true,
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
              cb(null, documents ? documents[0] : null);
            }
          });
        }
      }
    );
};

const findShipmentRecordsCount = (dataBucket, cb) => {
  MongoDbHandler.getDbInstance()
    .collection(dataBucket)
    .estimatedDocumentCount({}, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
}

const getDatesByIndices = async (dataBucket, id, dateColumn) => {
  try {
    var result = await ElasticsearchDbHandler.getDbInstance().search({
      index: dataBucket,
      track_total_hits: true,
      body: {
        size: 0,
        aggs: {
          start_date: {
            min: {
              field: dateColumn,
            },
          },
          end_date: {
            max: {
              field: dateColumn,
            },
          },
        },
      },
    });
    const end_date =
      result.body.aggregations.end_date.value_as_string.split("T")[0];
    const start_date =
      result.body.aggregations.start_date.value_as_string.split("T")[0];
    MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.workspace)
      .updateOne(
        {
          _id: id,
        },
        {
          $set: {
            start_date: start_date,
            end_date: end_date,
          },
        },
        function (err) {
          if (err) {
          } else {
          }
        }
      );
    return { start_date, end_date };
  } catch (err) {
    console.log(JSON.stringify(err));
    return null;
  }
};

const findAnalyticsSpecificationByUser = (userId, workspaceId, cb) => {
  let matchBlock = {};
  if (workspaceId) {
    matchBlock._id = ObjectID(workspaceId);
  }

  if (userId) {
    matchBlock.user_id = ObjectID(userId);
  }

  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.workspace)
    .aggregate(
      [
        {
          $match: matchBlock,
        },
        {
          $lookup: {
            from: "taxonomies",
            localField: "taxonomy_id",
            foreignField: "_id",
            as: "taxonomy_map",
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [
                {
                  $arrayElemAt: ["$taxonomy_map", 0],
                },
                "$$ROOT",
              ],
            },
          },
        },
        {
          $project: {
            _id: 0,
            taxonomy_id: 1,
            country: 1,
            trade: 1,
            code_iso_3: 1,
            code_iso_2: 1,
            flag_uri: 1,
            mode: 1,
            hs_code_digit_classification: 1,
            explore_fields: "$fields.explore",
            search_fields: "$fields.search",
            filter_fields: "$fields.filter",
            all_fields: "$fields.all",
            dataTypes_fields: "$fields.dataTypes",
            search_field_semantic: "$fields.search_semantic",
            filter_field_semantic: "$fields.filter_semantic",
            traders_aggregation: "$fields.traders_aggregation",
            records_aggregation: "$fields.records_aggregation",
            explore_aggregation: "$fields.explore_aggregation",
            statistics_aggregation: "$fields.statistics_aggregation",
            analytics_framework: "$fields.analytics_framework",
            data_bucket: 1,
            years: 1,
            totalRecords: "$records",
          },
        },
      ],
      {
        allowDiskUse: true,
      },
      function (err, cursor) {
        if (err) {
          cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              cb(err);
            } else {
              cb(null, documents ? documents[0] : null);
            }
          });
        }
      }
    );
};

const findAnalyticsShipmentRecordsAggregation = (
  aggregationParams,
  dataBucket,
  offset,
  limit,
  cb
) => {
  aggregationParams.offset = offset;
  aggregationParams.limit = limit;
  let clause =
    WorkspaceSchema.formulateShipmentRecordsAggregationPipeline(
      aggregationParams
    );

  let aggregationExpression = [
    {
      $match: clause.match,
    },
    {
      $facet: clause.facet,
    },
    {
      $project: clause.project,
    },
  ];

  //

  MongoDbHandler.getDbInstance()
    .collection(dataBucket)
    .aggregate(
      aggregationExpression,
      {
        allowDiskUse: true,
      },
      function (err, cursor) {
        if (err) {
          cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              cb(err);
            } else {
              cb(null, documents ? documents[0] : null);
            }
          });
        }
      }
    );
};

const findAnalyticsShipmentRecordsAggregationEngine = async (
  aggregationParams,
  dataBucket,
  offset,
  limit,
  cb
) => {
  try {
    let payload = {};
    payload.aggregationParams = aggregationParams;
    payload.dataBucket = dataBucket;
    payload.offset = offset;
    payload.limit = limit;

    let data = await getSearchData(payload)
    cb(null, data)
  } catch (error) {
    logger.error(` TRADE MODEL ============================ ${JSON.stringify(error)}`)
    cb(error)
  }
}

const findShipmentRecordsDownloadAggregationEngine = async (dataBucket, offset, limit, payload, cb) => {
  let aggregationExpression = {
    from: offset,
    size: limit,
    query: {
      match_all: {},
    }
  }

  try {
    var result = await ElasticsearchDbHandler.getDbInstance().search({
      index: dataBucket,
      track_total_hits: true,
      body: aggregationExpression,
    });
    let mappedResult = [];

    result.body.hits.hits.forEach((hit) => {
      delete hit._source["id"];
      mappedResult.push(hit._source);
    });

    cb(null, mappedResult ? mappedResult : null, payload.country);
  } catch (err) {
    console.log(JSON.stringify(err));
    cb(err);
  }
}

const findAnalyticsShipmentRecordsDownloadAggregationEngine = async (aggregationParams, dataBucket, cb) => {
  aggregationParams = await ElasticsearchDbQueryBuilderHelper.addAnalyzer(aggregationParams, dataBucket)
  let clause = WorkspaceSchema.formulateShipmentRecordsAggregationPipelineEngine(aggregationParams);
  let aggregationExpression = {
    from: clause.offset,
    size: clause.limit,
    sort: clause.sort,
    query: clause.query,
  }

  try {
    var result = await ElasticsearchDbHandler.getDbInstance().search({
      index: dataBucket,
      track_total_hits: true,
      body: aggregationExpression,
    });


    let mappedResult = [];
    result.body.hits.hits.forEach((hit) => {
      delete hit._source["id"];
      mappedResult.push(hit._source);
    });

    cb(null, mappedResult ? mappedResult : null);
  } catch (err) {
    cb(err);
  }
}

const findAnalyticsShipmentStatisticsAggregation = (
  aggregationParams,
  dataBucket,
  offset,
  limit,
  cb
) => {
  aggregationParams.offset = offset;
  aggregationParams.limit = limit;
  let clause =
    WorkspaceSchema.formulateShipmentStatisticsAggregationPipeline(
      aggregationParams
    );

  let aggregationExpression = [
    {
      $match: clause.match,
    },
    {
      $facet: clause.facet,
    },
    {
      $project: clause.project,
    },
  ];

  //

  MongoDbHandler.getDbInstance()
    .collection(dataBucket)
    .aggregate(
      aggregationExpression,
      {
        allowDiskUse: true,
      },
      function (err, cursor) {
        if (err) {
          cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              cb(err);
            } else {
              cb(null, documents ? documents[0] : null);
            }
          });
        }
      }
    );
};

const findAnalyticsShipmentsTradersByPattern = (
  searchTerm,
  searchField,
  dataBucket,
  cb
) => {
  let regExpSearchTermGroups = "";
  const searchTermWords = searchTerm.split(" ");
  searchTermWords.forEach((searchElement) => {
    //regExpSearchTermGroups = regExpSearchTermGroups + `(?=.*\\b${searchElement}\\b)`; // APPLY WORD BOUNDARY
    regExpSearchTermGroups = regExpSearchTermGroups + `(?=.*${searchElement})`;
  });
  let regExpSearchTerm = new RegExp(regExpSearchTermGroups + ".+");

  let matchClause = {};
  matchClause[searchField] = {
    $regex: regExpSearchTerm, //searchTerm,
    $options: "i",
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

  let aggregationExpression = [
    {
      $match: matchClause,
    },
    {
      $group: groupClause,
    },
    {
      $skip: 0,
    },
    {
      $limit: 100,
    },
    {
      $project: {
        _id: `$_id`,
      },
    },
  ];


  MongoDbHandler.getDbInstance()
    .collection(dataBucket)
    .aggregate(
      aggregationExpression,
      {
        allowDiskUse: true,
      },
      function (err, cursor) {
        if (err) {
          cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              cb(err);
            } else {
              cb(null, documents ? documents : null);
            }
          });
        }
      }
    );
};

const findAnalyticsShipmentsTradersByPatternEngine = async (payload, cb) => {
  try {
    let getSearchedData = await searchEngine(payload)
    if (getSearchedData) {
      cb(null, getSearchedData)
    }
  } catch (err) {
    cb(err);
  }
}

async function findRecordsByID (workspaceId) {
  try {
    const aggregationExpression = [
      {
        $match: {
          _id: ObjectID(workspaceId)
        }
      },
      {
        $project: {
          _id: 0,
          records: 1
        }
      }
    ]

    const workspaceRecords = await MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.workspace)
      .aggregate(aggregationExpression).toArray();

    return workspaceRecords[0];
  } catch (error) {
    throw error;
  }
}

/** Find shipmentIds in case of recordsSelection null from UI (case all records addition)*/
async function findShipmentRecordsIdentifierAggregationEngine (payload, workspaceRecordsLimit) {
  console.log("Method = findShipmentRecordsIdentifierAggregationEngine , Entry");
  try {

    const dataBucket = WorkspaceSchema.deriveDataBucket(payload.tradeType, payload.country);
    const shipmentIds = []

    if (workspaceRecordsLimit?.max_workspace_record_count?.alloted_limit) {
      recordsLimitPerWorkspace = workspaceRecordsLimit?.max_workspace_record_count?.alloted_limit;
    }

    payload = await ElasticsearchDbQueryBuilderHelper.addAnalyzer(payload, dataBucket);
    let clause = WorkspaceSchema.formulateShipmentRecordsIdentifierAggregationPipelineEngine(payload);
    let aggregationExpression = {
      from: 0,
      size: recordsLimitPerWorkspace,
      sort: clause.sort,
      query: clause.query,
      aggs: clause.aggregation,
    }

    var result = await ElasticsearchDbHandler.getDbInstance().search({
      index: dataBucket,
      track_total_hits: true,
      body: aggregationExpression,
    });

    result.body.hits.hits.forEach((hit) => {
      shipmentIds.push(hit._id);
    });

    return shipmentIds;
  } catch (error) {
    console.log("Method = findShipmentRecordsIdentifierAggregationEngine , Error", error);
    throw error;
  }
  finally {
    console.log("Method = findShipmentRecordsIdentifierAggregationEngine , Exit");
  }
}

/** Function to find PurchasableRecordsCount for selected records during creation of workspace */
async function findPurchasableRecordsForWorkspace (payload, shipmentRecordsIds) {
  console.log("Method = findPurchasableRecordsForWorkspace , Entry");
  const accountId = payload.accountId ? payload.accountId.trim() : null;
  const tradeType = payload.tradeType ? payload.tradeType.trim().toUpperCase() : null;
  const country = payload.country ? payload.country.trim().toUpperCase() : null;

  let aggregationExpression = [
    {
      $match: {
        account_id: ObjectID(accountId),
        country: country,
        trade: tradeType,
      }
    },
    {
      $project: {
        _id: 0,
        purchase_records: {
          $setDifference: [shipmentRecordsIds, "$records"]
        }
      }
    },
    {
      $project: {
        purchase_records: 1
      }
    }
  ]
  try {
    const recordsCount = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.purchased_records_keeper)
      .aggregate(aggregationExpression, { allowDiskUse: true, }).toArray();

    if (!recordsCount || recordsCount.length == 0) {
      let data = {
        purchasable_records_count: shipmentRecordsIds.length,
        purchase_records: shipmentRecordsIds
      }
      return data;
    }
    else {
      recordsCount[0].purchasable_records_count = recordsCount[0].purchase_records.length
      return recordsCount[0];
    }
  }
  catch (error) {
    console.log("MethodName = findPurchasableRecordsForWorkspace , Error = ", error);
    throw error;
  }
  finally {
    console.log("Method = findPurchasableRecordsForWorkspace , Exit");
  }
}

/** Function to add records to data bucket and creating s3 downloadable file */
async function addRecordsToWorkspaceBucket (payload) {
  try {
    console.log("Method = addRecordsToWorkspaceBucket . Entry");
    const startQueryTime = new Date();
    var workspaceElasticConfig = payload.workspaceElasticConfig;
    const workspaceType = payload.workspaceType;
    var workspaceId = await getWorkspaceIdForPayload(payload);
    workspaceId = workspaceId.toString();
    const workspaceDataBucket = WorkspaceSchema.deriveWorkspaceBucket(workspaceId);

    let shipmentRecordsIds = []
    let existing_records = [[], []]

    payload = await ElasticsearchDbQueryBuilderHelper.addAnalyzer(payload, workspaceDataBucket);
    if (workspaceType == "NEW") {
      shipmentRecordsIds = payload.aggregationParams.recordsSelections;
    } else {
      let allRecords = payload.aggregationParams.recordsSelections;
      existing_records = await fetchPurchasedRecords(workspaceDataBucket);
      if (allRecords && existing_records[1]) {
        for (let record of allRecords) {
          if (!existing_records[1].includes(record)) {
            shipmentRecordsIds.push(record)
          }
        }
      }
    }

    if (shipmentRecordsIds.length === 0) {
      console.log("Method = addRecordsToWorkspaceBucket . Exit");
      let data = { merged: false, message: "Nothing to add" }
      return data;
    }

    let aggregationExpression = {}
    aggregationExpression.query = { terms: { _id: shipmentRecordsIds } }
    aggregationExpression.from = 0;
    aggregationExpression.size = recordsLimitPerWorkspace;

    const recordsForShipmentIds = await ElasticsearchDbHandler.getDbInstance().search({
      index: WorkspaceSchema.deriveDataBucket(payload.tradeType, payload.country),
      track_total_hits: true,
      body: aggregationExpression,
    });

    let dataset = []
    recordsForShipmentIds.body.hits.hits.forEach((hit) => {
      let sourceData = hit._source;
      sourceData.id = hit._id;
      dataset.push(sourceData);
    });

    await ElasticsearchDbHandler.getDbInstance().indices.create(
      {
        index: workspaceDataBucket,
        body: workspaceElasticConfig
      },
      {
        ignore: [400],
      }
    );

    const body = dataset.flatMap((doc) => [
      {
        index: {
          _index: workspaceDataBucket
        }
      },
      doc
    ]);

    const { body: bulkResponse } = await ElasticsearchDbHandler.getDbInstance().bulk({ refresh: true, body });

    if (bulkResponse.errors) {
      console.log("Method = addRecordsToWorkspaceBucket . Error = ", bulkResponse.errors);
      const erroredDocuments = [];
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
      console.log("Method = addRecordsToWorkspaceBucket . Exit");
      throw bulkResponse.errors;
    } else {
      const endQueryTime = new Date();

      const queryTimeResponse = (endQueryTime.getTime() - startQueryTime.getTime()) / 1000;
      addQueryToActivityTrackerForUser(payload.aggregationParams, payload.accountId, payload.userId, payload.tradeType, payload.country, queryTimeResponse);

      for (let data of existing_records[0]) {
        dataset.push(data)
      }

      try {
        let downloadPayload = {
          country: payload.country,
          trade: payload.tradeType,
          workspaceBucket: workspaceDataBucket,
          indexNamePrefix: WorkspaceSchema.deriveDataBucket(payload.tradeType, payload.country),
          allFields: payload.allFields
        }
        /** Adding data in s3 file */
        const s3FilePath = await analyseData(dataset, downloadPayload, workspaceId, payload.workspaceName);
        let data = {
          merged: true,
          s3FilePath: s3FilePath,
          workspaceId: workspaceId,
          workspaceDataBucket: workspaceDataBucket
        }
        return data;
      } catch (error) {
        console.log("Method = addRecordsToWorkspaceBucket . Error = ", error);
        throw error;
      }
      finally {
        console.log("Method = addRecordsToWorkspaceBucket . Exit");
      }
    }

  } catch (error) {
    logger.error(JSON.stringify(error))
  }
}
// fetches existing purchased record id's from elasticsearch
const fetchPurchasedRecords = async (wks) => {
  let query = {
    size: recordsLimitPerWorkspace,
    query: {
      match_all: {}
    }
  }
  try {
    let results = await ElasticsearchDbHandler.getDbInstance().search({
      index: wks,
      track_total_hits: true,
      body: query
    }
    );
    let mappedResult = {}
    mappedResult[WorkspaceSchema.IDENTIFIER_SHIPMENT_RECORDS] = [];
    mappedResult['id'] = [];

    results.body.hits.hits.forEach((hit) => {
      mappedResult[WorkspaceSchema.IDENTIFIER_SHIPMENT_RECORDS].push(hit._source);
      mappedResult["id"].push(hit._source.id);
    });
    return [mappedResult[WorkspaceSchema.IDENTIFIER_SHIPMENT_RECORDS], mappedResult["id"]]
  } catch (err) {
    return [[], []]
  }

}

async function getWorkspaceIdForPayload (payload) {
  console.log("Method = getWorkspaceIdForPayload , Entry");
  var workspaceId = payload.workspaceId;
  if (!workspaceId) {
    try {
      const workspace = WorkspaceSchema.buildWorkspace(payload);
      const workspaceEntry = await MongoDbHandler.getDbInstance()
        .collection(MongoDbHandler.collections.workspace).insertOne(workspace);

      workspaceId = workspaceEntry.insertedId;
      return workspaceId;
    }
    catch (error) {
      console.log("Method = getWorkspaceIdForPayload , Error = ", error);
      throw error;
    }
    finally {
      console.log("Method = getWorkspaceIdForPayload , Exit");
    }
  }
  else {
    console.log("Method = getWorkspaceIdForPayload , Exit");
    return workspaceId;
  }
}

/** Function to transform data into required worksheet for S3 */
async function analyseData (mappedResult, payload, workspaceId, workspaceName) {
  let isHeaderFieldExtracted = false;
  let shipmentDataPack = {};
  shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_RECORDS] = [];
  shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_FIELD_HEADERS] = [];

  let newArr = [...mappedResult];

  newArr.forEach((hit) => {

    if (payload) {
      let row_values = [];
      for (let fields of payload.allFields) {
        if (fields.toLowerCase() == "records_tag")
          continue;
        else if (fields.toLowerCase() == "be_no")
          continue;

        else if (fields.toLowerCase() == "bill_no")
          continue;
        if (hit[fields] == null || hit[fields] == "NULL" || hit[fields] == "") {
          hit[fields] = "null";
        }
        row_values.push(hit[fields]);
      }
      shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_RECORDS].push([
        ...row_values,
      ]);
    }
    else
      shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_RECORDS].push([
        ...Object.values(hit),
      ]);
    if (!isHeaderFieldExtracted) {
      var headerArr = [];
      if (payload)
        headerArr = payload.allFields.filter((columnName) => { return columnName.toLowerCase() != 'records_tag' });
      else
        headerArr = Object.keys(hit);

      if ((payload.country && payload.trade && payload.country.toLowerCase() == 'india' && payload.trade.toLowerCase() == 'import')
        || (payload.indexNamePrefix && payload.indexNamePrefix.includes("ind") && payload.indexNamePrefix.includes("import"))) {
        let finalHeader = [];
        for (let key of headerArr) {
          if (key.toLowerCase() == "be_no")
            continue;
          if (INDIA_IMPORT_COLUMN_NAME[key]) {
            finalHeader.push(INDIA_IMPORT_COLUMN_NAME[key]);
          }
          else {
            finalHeader.push(key);
          }
        }
        headerArr = [...finalHeader];
      }
      else if ((payload.country && payload.trade && payload.country.toLowerCase() == 'india' && payload.trade.toLowerCase() == 'export')
        || (payload.indexNamePrefix && payload.indexNamePrefix.includes("ind") && payload.indexNamePrefix.includes("export"))) {
        let finalHeader = [];
        for (let key of headerArr) {
          if (key.toLowerCase() == "bill_no")
            continue;
          if (INDIA_EXPORT_COLUMN_NAME[key]) {
            finalHeader.push(INDIA_EXPORT_COLUMN_NAME[key]);
          }
          else {
            finalHeader.push(key);
          }
        }
        headerArr = [...finalHeader];

      }
      headerArr.forEach((key) => {
        shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_FIELD_HEADERS].push(key.replace("_", " "));
      });
    }
    isHeaderFieldExtracted = true;
  });
  let bundle = {};

  bundle.data = shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_RECORDS];
  bundle.headers =
    shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_FIELD_HEADERS];

  try {
    var text = " DATA";
    var workbook = new ExcelJS.Workbook();
    let worksheet = workbook.addWorksheet("Trade Data");
    var getCellCountryText = worksheet.getCell("C2");
    var getCellRecordText = worksheet.getCell("C4");

    worksheet.getCell("A5").value = "";

    getCellCountryText.value = text;
    getCellCountryText.font = {
      name: "Calibri",
      size: 22,
      underline: "single",
      bold: true,
      color: { argb: "005d91" },
      height: "auto",
    }
    worksheet.mergeCells("C2", "E3");
    getCellRecordText.font = {
      name: "Calibri",
      size: 14,
      bold: true,
      color: { argb: "005d91" },
    }
    getCellCountryText.alignment = { vertical: "middle", horizontal: "center" };
    getCellRecordText.alignment = { vertical: "middle", horizontal: "center" };
    worksheet.mergeCells("C4", "E4");

    //Add Image
    let myLogoImage = workbook.addImage({
      filename: "./public/images/logo-new.jpg",
      extension: "jpeg",
    });

    worksheet.addImage(myLogoImage, "A1:A4");
    worksheet.add;
    let headerRow = worksheet.addRow(bundle.headers);

    var colLength = [];
    let highlightCell = 0;
    headerRow.eachCell((cell, number) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "005d91" },
        bgColor: { argb: "" },
      }
      cell.font = {
        bold: true,
        color: { argb: "FFFFFF" },
        size: 12,
      }
      if (cell.value == "HS CODE") {
        highlightCell = number;
      }
      colLength.push(cell.value ? cell.value.toString().length : 10);
    });
    worksheet.columns.forEach(function (column, i) {
      if (colLength[i] < 10) {
        colLength[i] = 10;
      }
      column.width = colLength[i] * 2;
    });

    // Adding Data with Conditional Formatting
    bundle.data.forEach((d) => {
      var rowValue = [];
      for (let value of d) {
        if (typeof value == "string" || typeof value == "number")
          rowValue.push(value);
        else if (!Array.isArray(value) &&
          typeof value == "object" &&
          value.hasOwnProperty("value"))
          rowValue.push(value.value);
      }
      let row = worksheet.addRow(rowValue);
      if (highlightCell != 0) {
        let color = "FF99FF99";
        let sales = row.getCell(highlightCell);
        if (+sales.value < 200000) {
          color = "FF9999";
        }

        sales.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: color },
        };
      }
    });

    worksheet.getColumn(1).width = 35;
    wbOut = await workbook.xlsx.writeBuffer();

    return await fetchAndAddDataToS3(wbOut, workspaceId, workspaceName);
  } catch (err) {
    logger.error(JSON.stringify(err));
    throw error;
  }
}

async function fetchAndAddDataToS3 (fileObj, workspaceId, workspaceName) {
  try {
    const filePath = workspaceId + "/" + workspaceName + ".xlsx";

    var uploadParams = {
      Bucket: "eximpedia-workspaces",
      Key: filePath,
      ACL: 'public-read',
      Body: fileObj,
      ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }

    await s3Config.s3ConnectionConfig.upload(uploadParams).promise()
    console.log("File uploaded Successfully");

    var getUrlParams = {
      Bucket: "eximpedia-workspaces",
      Key: filePath,
      Expires: s3Config.EXPIRATION_FOR_UNSIGNED_URL_IN_SEC
    }

    const s3DownloadUrl = s3Config.s3ConnectionConfig.getSignedUrl("getObject", getUrlParams);
    console.log("url :" + s3DownloadUrl);
    return s3DownloadUrl;

  } catch (error) {
    console.log("Error at uploadCSVFileOnS3Bucket function", error);
    throw error;
  }
}

async function addQueryToActivityTrackerForUser (aggregationParams, accountId, userId, tradeType, country, queryResponseTime) {

  var workspace_search_query_input = {
    query: JSON.stringify(aggregationParams.matchExpressions),
    account_id: ObjectID(accountId),
    user_id: ObjectID(userId),
    tradeType: tradeType,
    country: country,
    queryResponseTime: queryResponseTime,
    isWorkspaceQuery: true,
    created_ts: Date.now(),
    modified_ts: Date.now()
  }

  try {
    await ActivityModel.addActivity(workspace_search_query_input);
  }
  catch (error) {
    throw error;
  }
}

/** Function to update workspace data collection*/
async function updateWorkspaceDataRecords (workspaceId, payload) {

  let filterClause = {
    _id: ObjectID(workspaceId)
  }

  let updateClause = {
    $set: {},
  }

  if (payload != null) {
    updateClause.$set = payload;
  }

  try {
    const updateWorkspaceResult = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.workspace)
      .updateOne(filterClause, updateClause);

    return updateWorkspaceResult;
  }
  catch (error) {
    throw error;
  }
}

/** Function to get workspace data collection by given id*/
async function findWorkspaceById (workspaceId) {

  try {
    const workspaceData = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.workspace)
      .find({ _id: ObjectID(workspaceId) }).toArray();

    return workspaceData[0];
  }
  catch (error) {
    throw error;
  }
}

function chunkArray (array, chunkSize) {
  return Array.from(
    { length: Math.ceil(array.length / chunkSize) },
    (_, index) => array.slice(index * chunkSize, (index + 1) * chunkSize)
  );
}

/** Function to update record keeper collection */
async function updatePurchaseRecordsKeeper (workspacePurchase) {
  var chhunkOutput = chunkArray(workspacePurchase.records, 500)
  for (let chunk of chhunkOutput) {
    let filterClause = {
      taxonomy_id: ObjectID(workspacePurchase.taxonomy_id),
      account_id: ObjectID(workspacePurchase.account_id),
      code_iso_3: workspacePurchase.country,
      trade: workspacePurchase.trade,
    }

    let updateClause = {}

    updateClause.$set = {
      country: workspacePurchase.country,
      flag_uri: workspacePurchase.flag_uri,
      code_iso_2: workspacePurchase.code_iso_2,
    }

    updateClause.$addToSet = {
      records: {
        $each: [...chunk],
      },
    }
    console.log("updatePurchaseRecordsKeeper ==================================", chunk.length)

    try {
      const updateKeeperResult = await MongoDbHandler.getDbInstance()
        .collection(MongoDbHandler.collections.purchased_records_keeper)
        .updateOne(filterClause, updateClause, { upsert: true });
      console.log("Chunk completed ================================== complete")
    }
    catch (error) {
      console.log("error in updatePurchaseRecordsKeeper")
      throw error;
    }
  }
  console.log("updatedPurchaseRecordsKeeper ================================== complete")
  return updateKeeperResult;
}

/** Function to get records count in a workspace bucket */
async function findShipmentRecordsCountEngine (dataBucket) {
  try {
    var result = await ElasticsearchDbHandler.getDbInstance().count({
      index: dataBucket,
    });

    return result.body.count;
  }
  catch (error) {
    throw error;
  }
}

/** Function to delete Workspace */
async function deleteWorkspace (workspaceId) {
  try {
    const deleteWorkspaceResult = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.workspace)
      .deleteOne({ _id: ObjectID(workspaceId) });

    return deleteWorkspaceResult;
  }
  catch (error) {
    throw error;
  }
}

/** Count number of workspaces for a user */
async function countWorkspacesForUser (userId) {
  try {
    const workspaceCount = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.workspace).countDocuments({ user_id: ObjectID(userId) });

    return workspaceCount;
  }
  catch (error) {
    throw error;
  }
}

async function getWorkspaceCreationLimits (accountId) {

  const aggregationExpression = [
    {
      '$match': {
        'account_id': ObjectID(accountId),
        'max_workspace_count': {
          '$exists': true
        }
      }
    },
    {
      '$project': {
        'max_workspace_count': 1,
        '_id': 0
      }
    }
  ]

  try {
    let limitDetails = await MongoDbHandler.getDbInstance()
      .collection(accountLimitsCollection)
      .aggregate(aggregationExpression).toArray();

    return limitDetails[0];
  } catch (error) {
    throw error;
  }
}

async function updateWorkspaceCreationLimits (accountId, updatedWorkspaceCreationLimits) {

  const matchClause = {
    'account_id': ObjectID(accountId),
    'max_workspace_count': {
      '$exists': true
    }
  }

  const updateClause = {
    $set: updatedWorkspaceCreationLimits
  }

  try {
    let limitUpdationDetails = await MongoDbHandler.getDbInstance()
      .collection(accountLimitsCollection)
      .updateOne(matchClause, updateClause);

    return limitUpdationDetails;
  } catch (error) {
    throw error;
  }
}

async function getWorkspaceRecordLimit (accountId) {

  const aggregationExpression = [
    {
      '$match': {
        'account_id': ObjectID(accountId),
        'max_workspace_record_count': {
          '$exists': true
        }
      }
    },
    {
      '$project': {
        'max_workspace_record_count': 1,
        '_id': 0
      }
    }
  ]

  try {
    let limitDetails = await MongoDbHandler.getDbInstance()
      .collection(accountLimitsCollection)
      .aggregate(aggregationExpression).toArray();

    return limitDetails[0];
  } catch (error) {
    throw error;
  }
}

async function getWorkspaceDeletionLimit (accountId) {

  const aggregationExpression = [
    {
      '$match': {
        'account_id': ObjectID(accountId),
        'max_workspace_delete_count': {
          '$exists': true
        }
      }
    },
    {
      '$project': {
        'max_workspace_delete_count': 1,
        '_id': 0
      }
    }
  ]

  try {
    let limitDetails = await MongoDbHandler.getDbInstance()
      .collection(accountLimitsCollection)
      .aggregate(aggregationExpression).toArray();

    return limitDetails[0];
  } catch (error) {
    throw error;
  }
}

async function updateWorkspaceDeletionLimit (accountId, updatedWorkspaceDeletionLimits) {

  const matchClause = {
    'account_id': ObjectID(accountId),
    'max_workspace_delete_count': {
      '$exists': true
    }
  }

  const updateClause = {
    $set: updatedWorkspaceDeletionLimits
  }

  try {
    let limitUpdationDetails = await MongoDbHandler.getDbInstance()
      .collection(accountLimitsCollection)
      .updateOne(matchClause, updateClause);

    return limitUpdationDetails;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  add,
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
  findAnalyticsShipmentsTradersByPatternEngine,
  getDatesByIndices,
  findRecordsByID,
  fetchPurchasedRecords,
  findPurchasableRecordsForWorkspace,
  addRecordsToWorkspaceBucket,
  updateWorkspaceDataRecords,
  findWorkspaceById,
  deleteWorkspace,
  analyseData,
  countWorkspacesForUser,
  getWorkspaceCreationLimits,
  updateWorkspaceCreationLimits,
  getWorkspaceRecordLimit,
  getWorkspaceDeletionLimit,
  updateWorkspaceDeletionLimit
}
