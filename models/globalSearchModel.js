const TAG = 'tradeModel';

const ObjectID = require('mongodb').ObjectID;

const MongoDbHandler = require('../db/mongoDbHandler');
const ElasticsearchDbHandler = require('../db/elasticsearchDbHandler');
const GlobalSearchSchema = require('../schemas/globalSearchSchema');
const tradeSchema = require("../schemas/tradeSchema");



async function getDataElasticsearch(res, payload) {
  try {

    // const startQueryTime = new Date();
    payload.aggregationParams = {}
    payload.aggregationParams.offset = 0;
    payload.aggregationParams.limit = 10;
    payload.aggregationParams.matchExpressions = [];

    let Arr1 = payload.taxonomy.fields.explore_aggregation.matchExpressions.concat()
    let foundadvsem = Arr1.find(function (Arr) {
      return Arr.identifier === payload.column;
    });

    let dateMatchExpression = Arr1.find(function (Arr) {
      return Arr.identifier === "SEARCH_MONTH_RANGE";
    });
    dateMatchExpression.fieldValueLeft = payload.startDate
    dateMatchExpression.fieldValueRight = payload.endDate
    payload.aggregationParams.matchExpressions.push({
      ...dateMatchExpression
    })

    let buyerMatchExpression = Arr1.find(function (Arr) {
      return Arr.identifier === "SEARCH_BUYER";
    });
    let sellerMatchExpression = Arr1.find(function (Arr) {
      return Arr.identifier === "SEARCH_SELLER";
    });

    if (foundadvsem) {
      if (payload.column.toLowerCase() == "search_hs_code") {
        if (/^[0-9]+$/.test(payload.value)) {
          let leftValue = payload.value;
          let rightValue = payload.value;
          let digitsCount = payload.value.length;
          for (let index = digitsCount + 1; index <= payload.taxonomy.hs_code_digit_classification; index++) {
            leftValue += 0;
            rightValue += 9;
          }
          foundadvsem.fieldValueLeft = leftValue
          foundadvsem.fieldValueRight = rightValue
        } else {
          throw new Error("Value should be number")
        }

      } else {
        foundadvsem.fieldValue = payload.value
      }
      payload.aggregationParams.matchExpressions.push({
        ...foundadvsem
      })
    } else {
      throw new Error("invalid key")
    }

    let dataBucket
    if (payload.taxonomy.bl_flag === false) {
      dataBucket = tradeSchema.deriveDataBucket(payload.taxonomy.trade, payload.taxonomy.country);
    } else {
      dataBucket = payload.taxonomy.bucket ? payload.taxonomy.bucket + '*' : 'bl' + payload.taxonomy.trade + '*';
      let countryMatchExpression = {
        "identifier": "SEARCH_COUNTRY",
        "alias": "COUNTRY",
        "clause": "MATCH",
        "expressionType": 202,
        "relation": "and",
        "fieldTerm": "COUNTRY_DATA",
        "fieldValue": '',
        "fieldTermTypeSuffix": ""
      }
      countryMatchExpression.fieldValue = [payload.taxonomy.country.toUpperCase()]
      payload.aggregationParams.matchExpressions.push({
        ...countryMatchExpression
      })

    }


    payload.aggregationParams.groupExpressions = payload.taxonomy.fields.explore_aggregation.groupExpressions ?
      payload.taxonomy.fields.explore_aggregation.groupExpressions : []
    let clause = GlobalSearchSchema.formulateShipmentRecordsAggregationPipelineEngine(payload);
    let count = 0
    let aggregationExpressionArr = [];
    for (let agg in clause.aggregation) {
      let aggregationExpression = {
        sort: clause.sort,
        query: clause.query,
        aggs: {}
      };
      count += 1;
      aggregationExpression.aggs[agg] = clause.aggregation[agg]

      aggregationExpressionArr.push({ ...aggregationExpression })
      aggregationExpression = {
        size: 0,
        sort: clause.sort,
        query: clause.query,
        aggs: {}
      };
    }


    let resultArr = []
    for (let query of aggregationExpressionArr) {
      resultArr.push(ElasticsearchDbHandler.dbClient.search({
        index: dataBucket,
        track_total_hits: true,
        body: query
      }))
    }


    let mappedResult = {};
    let idArr = [];

    for (let idx = 0; idx < resultArr.length; idx++) {
      let result = await resultArr[idx];
      if (idx == 0) {
        mappedResult[GlobalSearchSchema.RESULT_PORTION_TYPE_SUMMARY] = [{
          _id: null,
          count: result.body.hits.total.value
        }];
        mappedResult[GlobalSearchSchema.RESULT_PORTION_TYPE_RECORDS] = [];
        result.body.hits.hits.forEach((hit) => {
          let buyerData = hit._source;
          buyerData._id = hit._id;
          idArr.push(hit._id);
          mappedResult[GlobalSearchSchema.RESULT_PORTION_TYPE_RECORDS].push(
            buyerData
          );
        });
      }

      for (const prop in result.body.aggregations) {
        if (result.body.aggregations.hasOwnProperty(prop)) {
          if (prop.indexOf('SUMMARY') === 0 && result.body.aggregations[prop].value) {
            mappedResult[prop] = result.body.aggregations[prop].value;
          } else if (prop.indexOf('FILTER') === 0) {
            let mappingGroups = [];
            //let mappingGroupTermCount = 0;
            //finding prop from grp expression aggs params(only filter one)
            let groupExpression = payload.aggregationParams.groupExpressions.filter(
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
                    if (bucket.totalSum) {
                      groupedElement.totalSum = bucket?.totalSum?.value
                    }
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
                groupedElement.totalSum = propElement.sum
                mappingGroups.push(groupedElement);
              }
              mappedResult[prop] = mappingGroups;
            }
          }
        }
      }
    }

    let mainObject = {}
    // mappedResult["idArr"] = idArr;
    let country = payload.taxonomy.country.toLowerCase();
    mainObject["DATE_RANGE"] = {
      "startDate": payload.startDate,
    }
    let endDate = await getDateRange(payload.taxonomy._id);
    if(endDate && endDate.length > 0){
      mainObject["DATE_RANGE"].endDate = endDate[0].end_date
    }else{
      mainObject["DATE_RANGE"].endDate = ''
    }
    mainObject[country] = { ...mappedResult, type: payload.taxonomy.trade.toLowerCase() }
    mainObject["FLAG_URI"] = payload.taxonomy.flag_uri;
    mainObject["SEARCH_BUYER"] = buyerMatchExpression;
    mainObject["SEARCH_SELLER"] = sellerMatchExpression;
    // const endQueryTime = new Date();
    // const queryTimeResponse = (endQueryTime.getTime() - startQueryTime.getTime()) / 1000;
    // if (payload.aggregationParams.resultType === TRADE_SHIPMENT_RESULT_TYPE_RECORDS) {
    //   await addQueryToActivityTrackerForUser(payload.aggregationParams, payload.accountId, payload.userId, payload.tradeType, payload.country, queryTimeResponse);
    // }
    if (payload.taxonomy.bl_flag) {
      res.bl_output.push({ ...mainObject })
    } else {
      res.output.push({ ...mainObject })
    }

  } catch (err) {
    throw err;
  }
}
const findTradeShipmentAllCountries = async (payload) => {
  try {
    let matchExpression = {}

    if (payload.country) {
      matchExpression = {
        "country": {
          $in: payload.country
        }
      }
    } else if (payload.available_country && payload.available_country.length > 0) {
      matchExpression = {
        code_iso_3: {
          $in: payload.available_country
        }
      }

    } else {
      matchExpression = {
        code_iso_3: {
          $nin: []
        }
      }
    }

    if (payload.trade) {
      matchExpression.trade = payload.trade;
    }

    if (payload.bl_flag) {
      matchExpression.bl_flag = payload.bl_flag;
    }

    let result = await MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.taxonomy)
      .find(matchExpression)
      .project({
        "_id": 1,
        "country": 1,
        "trade": 1,
        "bucket": 1,
        "flag_uri": 1,
        "bl_flag": 1,
        "hs_code_digit_classification": 1,
        "fields.explore_aggregation.matchExpressions": 1,
        "fields.explore_aggregation.groupExpressions": 1
      })
      .toArray();
    if (result) {
      let res = {
        "output": [],
        "bl_output": []

      }

      for (let taxonomy of result) {
        if ((taxonomy.country == undefined || taxonomy.trade == undefined) ||
          taxonomy.fields == undefined || taxonomy.fields.explore_aggregation == undefined ||
          taxonomy.hs_code_digit_classification == undefined || taxonomy.fields.explore_aggregation.groupExpressions == undefined ||
          taxonomy.fields.explore_aggregation.matchExpressions == undefined) {
          continue
        }
        payload.taxonomy = taxonomy
        await getDataElasticsearch(res, payload)
      }
      return (res) ? res : null
      // Promise.all(awaitOutput).then((values) => {
      //   console.log(values)
      //   return (output) ? output : null
      // });
    }
  } catch (err) {
    throw err
  }
}

const getDateRange = async (id) => {
  try {
    let dateMatchExpression = {
      "taxonomy_id": ObjectID(id)
    }
    let endDate = await MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.country_date_range)
      .find(dateMatchExpression)
      .project({
        "end_date": 1
      })
      .toArray();

      return endDate

  } catch (err) {
    throw err
  }
}


const getCountryNames = async (matchExpression) => {
  let result = await MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.taxonomy)
    .find(matchExpression)
    .project({
      "country": 1,
      "_id": 0
    })
    .toArray();

  return result
}

module.exports = {
  findTradeShipmentAllCountries,
  getCountryNames,
  getDateRange
};
