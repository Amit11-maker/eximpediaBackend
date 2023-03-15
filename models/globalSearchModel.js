const TAG = 'tradeModel';

const ObjectID = require('mongodb').ObjectID;

const MongoDbHandler = require('../db/mongoDbHandler');
const ElasticsearchDbHandler = require('../db/elasticsearchDbHandler');
const GlobalSearchSchema = require('../schemas/globalSearchSchema');
const tradeSchema = require("../schemas/tradeSchema");



async function getDataElasticsearch(output, taxonomy, columnName, value) {
  try {

    let dataBucket = tradeSchema.deriveDataBucket(taxonomy.trade, taxonomy.country);
    let aggregationParams = {}
    aggregationParams.offset = 0;
    aggregationParams.limit = 10;
    aggregationParams.matchExpressions = [];

    let Arr1 = taxonomy.fields.explore_aggregation.matchExpressions.concat()
    let foundadvsem = Arr1.find(function (Arr) {
      return Arr.identifier === columnName;
    });
    if (foundadvsem) {
      if (columnName.toLowerCase() == "search_hs_code") {
        if (/^[0-9]+$/.test(value)) {
          let leftValue = value;
          let rightValue = value;
          let digitsCount = value.length;
          for (let index = digitsCount + 1; index <= taxonomy.hs_code_digit_classification; index++) {
            leftValue += 0;
            rightValue += 9;
          }
          foundadvsem.fieldValueLeft = leftValue
          foundadvsem.fieldValueRight = rightValue
        } else {
          throw new Error("Value should be number")
        }

      } else {
        foundadvsem.fieldValue = value
      }
      aggregationParams.matchExpressions.push({
        ...foundadvsem
      })
    } else {
      return
    }

    aggregationParams.groupExpressions = taxonomy.fields.explore_aggregation.groupExpressions
    let clause = GlobalSearchSchema.formulateShipmentRecordsAggregationPipelineEngine(aggregationParams);
    let count = 0
    let aggregationExpressionArr = [];
    let aggregationExpression = {
      from: clause.offset,
      size: clause.limit,
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

    var resultArr = []
    for (let query of aggregationExpressionArr) {
      resultArr.push(ElasticsearchDbHandler.dbClient.search({
        index: dataBucket,
        track_total_hits: true,
        body: query
      }))
    }


    var mappedResult = {};

    for (var idx = 0; idx < resultArr.length; idx++) {
      var result = await resultArr[idx];
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
            // logger.info(result.body.aggregations[prop].value , result.meta.request.params.path)
            mappedResult[prop] = result.body.aggregations[prop].value;
          }
        }
      }
    }
    let country = taxonomy.country.toLowerCase();
    let mainObject = {}
    mainObject[country] = { ...mappedResult, type: taxonomy.trade.toLowerCase() }
    output.push({ ...mainObject })

  } catch (err) {
    throw err;
  }
}
const findTradeShipmentAllCountries = async (countryCodeArr, columnName, value) => {
  try {
    let matchExpression = {}
    if (countryCodeArr && countryCodeArr.length > 0) {
      matchExpression = {
        code_iso_3: {
          $in: countryCodeArr
        }
      }
    }
    else {
      matchExpression = {
        code_iso_3: {
          $nin: []
        }
      }
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
      let output = []
      let awaitOutput = [];
      for (let taxonomy of result) {
        if ((taxonomy.country == undefined || taxonomy.trade == undefined) || taxonomy.bl_flag == true) {
          continue
        }
        if (taxonomy.fields == undefined || taxonomy.fields.explore_aggregation == undefined ||
          taxonomy.hs_code_digit_classification == undefined ||
          taxonomy.fields.explore_aggregation.groupExpressions == undefined ||
          taxonomy.fields.explore_aggregation.matchExpressions == undefined) {
          continue
        }
        await getDataElasticsearch(output, taxonomy, columnName, value)
      }
      return (output) ? output : null
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
