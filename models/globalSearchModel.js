const TAG = 'tradeModel';

const ObjectID = require('mongodb').ObjectID;

const MongoDbHandler = require('../db/mongoDbHandler');
const ElasticsearchDbHandler = require('../db/elasticsearchDbHandler');
const GlobalSearchSchema = require('../schemas/globalSearchSchema');
const tradeSchema = require("../schemas/tradeSchema");



async function getDataElasticsearch(res, payload) {
  try {
    let dataBucket
    if (payload.trade && payload.country) {
      dataBucket = tradeSchema.deriveDataBucket(payload.trade, payload.taxonomy.country);
    } else if (payload.trade || payload.country) {
      dataBucket = tradeSchema.deriveDataBucket(payload.trade ? payload.trade : payload.taxonomy.trade, payload.taxonomy.country);
    } else {
      dataBucket = tradeSchema.deriveDataBucket(payload.taxonomy.trade, payload.taxonomy.country);
    }

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

    if (payload.taxonomy.bl_flag) {
      let resultArr = []
      for (let query of aggregationExpressionArr) {
        resultArr.push(ElasticsearchDbHandler.dbClient.search({
          index: dataBucket,
          track_total_hits: true,
          body: query
        }))
      }


      let mappedResult = {};

      for (let idx = 0; idx < resultArr.length; idx++) {
        let result = await resultArr[idx];
        if (idx == 0) {
          mappedResult[GlobalSearchSchema.RESULT_PORTION_TYPE_SUMMARY] = [{
            _id: null,
            count: result.body.hits.total.value
          }];
          mappedResult[GlobalSearchSchema.RESULT_PORTION_TYPE_RECORDS] = [];
          result.body.hits.hits.forEach(hit => {
            var sourceData = hit._source;
            sourceData._id = hit._id;
            mappedResult[GlobalSearchSchema.RESULT_PORTION_TYPE_RECORDS].push(sourceData);
          });
        }
        for (const prop in result.body.aggregations) {
          if (result.body.aggregations.hasOwnProperty(prop)) {
            if (prop.indexOf('SUMMARY') === 0 && result.body.aggregations[prop].value) {
              mappedResult[prop] = result.body.aggregations[prop].value;
            } else if (prop.indexOf('FILTER') === 0 && result.body.aggregations[prop].buckets) {
              mappedResult[prop] = result.body.aggregations[prop].buckets;
            }
          }
        }
      }
      let country = payload.taxonomy.country.toLowerCase();
      let mainObject = {}
      mainObject[country] = { ...mappedResult, type: payload.taxonomy.trade.toLowerCase() }
      res.bl_output.push({ ...mainObject })

    } else {
      let resultArr = []
      for (let query of aggregationExpressionArr) {
        resultArr.push(ElasticsearchDbHandler.dbClient.search({
          index: dataBucket,
          track_total_hits: true,
          body: query
        }))
      }


      let mappedResult = {};

      for (let idx = 0; idx < resultArr.length; idx++) {
        let result = await resultArr[idx];
        if (idx == 0) {
          mappedResult[GlobalSearchSchema.RESULT_PORTION_TYPE_SUMMARY] = [{
            _id: null,
            count: result.body.hits.total.value
          }];
          mappedResult[GlobalSearchSchema.RESULT_PORTION_TYPE_RECORDS] = [];
          result.body.hits.hits.forEach(hit => {
            var sourceData = hit._source;
            sourceData._id = hit._id;
            mappedResult[GlobalSearchSchema.RESULT_PORTION_TYPE_RECORDS].push(sourceData);
          });
        }
        for (const prop in result.body.aggregations) {
          if (result.body.aggregations.hasOwnProperty(prop)) {
            if (prop.indexOf('SUMMARY') === 0 && result.body.aggregations[prop].value) {
              mappedResult[prop] = result.body.aggregations[prop].value;
            } else if (prop.indexOf('FILTER') === 0 && result.body.aggregations[prop].buckets) {
              mappedResult[prop] = result.body.aggregations[prop].buckets;
            }
          }
        }
      }
      let country = payload.taxonomy.country.toLowerCase();
      let mainObject = {}
      mainObject[country] = { ...mappedResult, type: payload.taxonomy.trade.toLowerCase() }
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
        "country": 1,
        "trade": 1,
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


module.exports = {
  findTradeShipmentAllCountries
};
