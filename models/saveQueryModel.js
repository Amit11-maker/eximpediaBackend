const MongoDbHandler = require("../db/mongoDbHandler");
const QuerySchema = require("../schemas/saveQuerySchema");
const tradeSchema = require("../schemas/tradeSchema");
const ObjectID = require("mongodb").ObjectID;
const ElasticsearchDbHandler = require("../db/elasticsearchDbHandler");
const ElasticsearchDbQueryBuilderHelper = require("./../helpers/elasticsearchDbQueryBuilderHelper");
const accountLimitsCollection = MongoDbHandler.collections.account_limits;
const { logger } = require("../config/logger");

const deleteQueryModal = (userId, cb) => {
  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.saveQuery)
    .deleteOne(
      {
        _id: ObjectID(userId),
      },
      function (err, result) {
        if (err) {
          cb(err);
        } else {
          cb(null, result);
        }
      }
    );
};

const updateQueryModal = (userId, data, cb) => {
  try {
    let filterClause = {
      _id: ObjectID(userId),
    };
    MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.saveQuery)
      .updateOne(
        filterClause,
        { $set: { payload: data } },
        function (err, result) {
          if (err) {
            cb(err);
          } else {
            cb(result);
          }
        }
      );
  } catch (error) {
    logger.log(JSON.stringify(error));
  }
};

const findTradeShipmentRecordsAggregation = (
  aggregationParams,
  dataBucket,
  accountId,
  recordPurchasedParams,
  offset,
  limit,
  cb
) => {
  aggregationParams.accountId = accountId;
  aggregationParams.purhcaseParams = recordPurchasedParams;
  aggregationParams.offset = offset;
  aggregationParams.limit = limit;
  let clause =
    QuerySchema.formulateShipmentRecordsAggregationPipeline(aggregationParams);

  let aggregationExpression = [
    {
      $match: clause.match,
    },
    {
      $limit: clause.limit,
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
          throw err; //cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              throw err; //cb(err);
            } else {
              cb(null, documents ? documents[0] : null);
            }
          });
        }
      }
    );
};

const findSaveQuery = (account_id, cb) => {
  if (account_id !== undefined) {
    MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.saveQuery)
      .find({ account_id: ObjectID(account_id) })
      .toArray(function (err, result) {
        if (err) {
          // console.log(
          //   "Function ======= findSaveQuery ERROR ============ ",
          //   err
          // );
          // console.log("Account_ID =========8=========== ", account_id);
          logger.log(`SaveQueryModel == ${JSON.stringify(err)}`)
          cb(err);
        } else {
          cb(null, result);
        }
      });
  }
};

const findTradeShipmentRecordsAggregationEngine = async (
  aggregationParams,
  cb
) => {
  try {
    const userId = aggregationParams.userId
      ? aggregationParams.userId.trim()
      : null;
    const accountId = aggregationParams.accountId
      ? aggregationParams.accountId.trim()
      : null;

    let explore_search_query_input = {
      account_id: ObjectID(accountId),
      user_id: ObjectID(userId),
      created_at: new Date().getTime(),
      payload: aggregationParams,
    };

    let insertId = "";
    MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.saveQuery)
      .insertOne(explore_search_query_input)
      .then((res) => {
        insertId = res.insertedId.toString();
        cb(null, insertId ? insertId : null);
      });
  } catch (err) {
    cb(err);
  }
};

async function refactorResultArrayForSaveQuery(
  mappedResult,
  idArr,
  aggregationParams
) {
  for (let idx = 0; idx < resultArr.length; idx++) {
    let result = await resultArr[idx];
    if (idx == 0) {
      mappedResult[QuerySchema.RESULT_PORTION_TYPE_SUMMARY] = [
        {
          _id: null,
          count: result.body.hits.total.value,
        },
      ];
      mappedResult[QuerySchema.RESULT_PORTION_TYPE_RECORDS] = [];
      result.body.hits.hits.forEach((hit) => {
        let sourceData = hit._source;
        sourceData._id = hit._id;
        idArr.push(hit._id);
        mappedResult[QuerySchema.RESULT_PORTION_TYPE_RECORDS].push(sourceData);
      });
    }
    for (const prop in result.body.aggregations) {
      if (result.body.aggregations.hasOwnProperty(prop)) {
        if (prop.indexOf("FILTER") === 0) {
          let mappingGroups = [];
          let groupExpression = aggregationParams.groupExpressions.filter(
            (expression) => expression.identifier == prop
          )[0];

          if (groupExpression.isFilter) {
            if (result.body.aggregations[prop].buckets) {
              result.body.aggregations[prop].buckets.forEach((bucket) => {
                if (bucket.doc_count != null && bucket.doc_count != undefined) {
                  let groupedElement = {
                    _id:
                      bucket.key_as_string != null &&
                      bucket.key_as_string != undefined
                        ? bucket.key_as_string
                        : bucket.key,
                    count: bucket.doc_count,
                  };

                  if (
                    bucket.minRange != null &&
                    bucket.minRange != undefined &&
                    bucket.maxRange != null &&
                    bucket.maxRange != undefined
                  ) {
                    groupedElement.minRange = bucket.minRange.value;
                    groupedElement.maxRange = bucket.maxRange.value;
                  }

                  mappingGroups.push(groupedElement);
                }
              });
            }

            let propElement = result.body.aggregations[prop];
            if (
              propElement.min != null &&
              propElement.min != undefined &&
              propElement.max != null &&
              propElement.max != undefined
            ) {
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

        if (
          prop.indexOf("SUMMARY") === 0 &&
          result.body.aggregations[prop].value
        ) {
          mappedResult[prop] = result.body.aggregations[prop].value;
        }
      }
    }
  }
}

function getPayloadForAnalyzer(
  aggregationParams,
  tradeType,
  country,
  dataBucket,
  userId,
  accountId,
  recordPurchaseKeeperParams,
  offset,
  limit
) {
  let payload = {};
  payload.aggregationParams = aggregationParams;
  payload.tradeType = tradeType;
  payload.country = country;
  payload.dataBucket = dataBucket;
  payload.userId = userId;
  payload.accountId = accountId;
  payload.purhcaseParams = recordPurchaseKeeperParams;
  payload.offset = offset;
  payload.limit = limit;
  return payload;
}

async function getSaveQueryLimit(accountId) {
  const aggregationExpression = [
    {
      $match: {
        account_id: ObjectID(accountId),
        max_save_query: {
          $exists: true,
        },
      },
    },
    {
      $project: {
        max_save_query: 1,
        _id: 0,
      },
    },
  ];

  try {
    let limitDetails = await MongoDbHandler.getDbInstance()
      .collection(accountLimitsCollection)
      .aggregate(aggregationExpression)
      .toArray();

    return limitDetails[0];
  } catch (error) {
    throw error;
  }
}

async function updateSaveQueryLimit(accountId, updatedSaveQueryLimits) {
  const matchClause = {
    account_id: ObjectID(accountId),
    max_save_query: {
      $exists: true,
    },
  };

  const updateClause = {
    $set: updatedSaveQueryLimits,
  };

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
  findSaveQuery,
  deleteQueryModal,
  updateQueryModal,
  findTradeShipmentRecordsAggregationEngine,
  findTradeShipmentRecordsAggregation,
  getSaveQueryLimit,
  updateSaveQueryLimit,
};
