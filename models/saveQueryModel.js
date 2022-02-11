const MongoDbHandler = require("../db/mongoDbHandler");
const QuerySchema = require("../schemas/saveQuerySchema");
const ObjectID = require("mongodb").ObjectID;
const SEPARATOR_UNDERSCORE = "_";
const ElasticsearchDbHandler = require("../db/elasticsearchDbHandler");

const add = (user, cb) => {
  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.saveQuery)
    .insertOne(user, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
};

const update = (userId, data) => {
  const ObjectID = require("mongodb").ObjectID;
  data.account_id = ObjectID(data.account_id);
  data.user_id = ObjectID(data.user_id);
  data._id = ObjectID(data._id);
  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.saveQuery)
    .updateOne(
      { _id: userId },
      { $set: data },
      { upsert: true },
      function (err, result) {
        if (err) {
          return err;
        } else {
          return result;
        }
      }
    );
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

const findQuery = (cb) => {
  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.saveQuery)
    .find()
    .toArray(function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
};

const findTradeShipmentRecordsAggregationEngine = async (
  aggregationParams,
  tradeType,
  country,
  dataBucket,
  userId,
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
  for (let matchExpression of aggregationParams.matchExpressions) {
    if (matchExpression.expressionType == 203) {
      if (matchExpression.fieldValue.slice(-1).toLowerCase() == "y") {
        var analyzerOutput =
          await ElasticsearchDbHandler.dbClient.indices.analyze({
            index: dataBucket,
            body: {
              text: matchExpression.fieldValue,
              analyzer: "my_search_analyzer",
            },
          });
        if (
          analyzerOutput.body.tokens.length > 0 &&
          analyzerOutput.body.tokens[0].token.length <
            matchExpression.fieldValue.length
        ) {
          matchExpression.analyser = true;
        } else matchExpression.analyser = false;
      } else {
        matchExpression.analyser = true;
      }
    }
  }
  let clause =
    QuerySchema.formulateShipmentRecordsAggregationPipelineEngine(
      aggregationParams
    );
  let count = 0;

  var explore_search_query_input = {
    // query: JSON.stringify(aggregationParams.matchExpressions),
     account_id: ObjectID(accountId),
     user_id: ObjectID(userId),
     created_at: new Date().getTime(),
    // tradeType,
    // country,
    payload: aggregationParams,
  };

  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.saveQuery)
    .insertOne(explore_search_query_input);

  let aggregationExpressionArr = [];
  let aggregationExpression = {
    from: clause.offset,
    size: clause.limit,
    sort: clause.sort,
    query: clause.query,
    aggs: {},
  };
  // console.log(aggregationExpression, clause.aggregation);
  aggregationExpressionArr.push({ ...aggregationExpression });
  aggregationExpression = {
    from: clause.offset,
    size: 0,
    sort: clause.sort,
    query: clause.query,
    aggs: {},
  };
  for (let agg in clause.aggregation) {
    count += 1;
    aggregationExpression.aggs[agg] = clause.aggregation[agg];

    aggregationExpressionArr.push({ ...aggregationExpression });
    aggregationExpression = {
      from: clause.offset,
      size: 0,
      sort: clause.sort,
      query: clause.query,
      aggs: {},
    };
  }
  // dataBucket = "eximpedia_bucket_import_ind"
  try {
    resultArr = [];
    for (let query of aggregationExpressionArr) {
      // console.log(JSON.stringify(query));
      resultArr.push(
        ElasticsearchDbHandler.dbClient.search({
          index: dataBucket,
          track_total_hits: true,
          body: query,
        })
      );
    }

    let mappedResult = {};
    let idArr = [];

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
          mappedResult[QuerySchema.RESULT_PORTION_TYPE_RECORDS].push(
            sourceData
          );
        });
      }
      for (const prop in result.body.aggregations) {
        if (result.body.aggregations.hasOwnProperty(prop)) {
          if (prop.indexOf("FILTER") === 0) {
            let mappingGroups = [];
            //let mappingGroupTermCount = 0;
            let groupExpression = aggregationParams.groupExpressions.filter(
              (expression) => expression.identifier == prop
            )[0];

            if (groupExpression.isFilter) {
              if (result.body.aggregations[prop].buckets) {
                result.body.aggregations[prop].buckets.forEach((bucket) => {
                  if (
                    bucket.doc_count != null &&
                    bucket.doc_count != undefined
                  ) {
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
    mappedResult["idArr"] = idArr;

    cb(null, mappedResult ? mappedResult : null);
  } catch (err) {
    // console.log(JSON.stringify(err))
    cb(err);
  }
};

module.exports = {
  add,
  findQuery,
  update,
  findTradeShipmentRecordsAggregationEngine,
  findTradeShipmentRecordsAggregation,
};
