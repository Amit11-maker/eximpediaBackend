const TAG = 'tradeModel';

const ObjectID = require('mongodb').ObjectID;

const MongoDbHandler = require('../db/mongoDbHandler');
const ElasticsearchDbHandler = require('../db/elasticsearchDbHandler');
const GlobalSearchSchema = require('../schemas/globalSearchSchema');
const tradeSchema = require("../schemas/tradeSchema");



async function getDataElasticsearch(output, taxonomy, columnName, value) {
  var dataBucket = tradeSchema.deriveDataBucket(taxonomy.trade , taxonomy.country);
  var aggregationParams = {}
  aggregationParams.offset = 0;
  aggregationParams.limit = 10;
  aggregationParams.matchExpressions = [];
  var fieldFlag = false;
  for (var matchExpression of taxonomy.fields.explore_aggregation.matchExpressions) {
    if (columnName.toLowerCase() == matchExpression.identifier.toLowerCase()) {
      matchExpression.fieldValue = value
      if (columnName.toLowerCase() == "search_hs_code") {
        var leftValue = value;
        var rightValue = value;
        var digitsCount = value.length;
        for (var index = digitsCount + 1; index <= taxonomy.hs_code_digit_classification; index++) {
          leftValue += 0;
          rightValue += 9;
        }
        matchExpression.fieldValueLeft = leftValue
        matchExpression.fieldValueRight = rightValue
      }
      aggregationParams.matchExpressions.push({
        ...matchExpression
      })
      fieldFlag = true
      break
    }
  }
  if (!fieldFlag)
    return
  aggregationParams.groupExpressions = taxonomy.fields.explore_aggregation.groupExpressions
  var clause = GlobalSearchSchema.formulateShipmentRecordsAggregationPipelineEngine(aggregationParams);
  var count = 0
  var aggregationExpressionArr = [];
  var aggregationExpression = {
    from: clause.offset,
    size: clause.limit,
    sort: clause.sort,
    query: clause.query,
    aggs: {}
  };
  for (var agg in clause.aggregation) {
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
  for (var query of aggregationExpressionArr) {
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
  var country = taxonomy.country.toLowerCase();
  var mainObject = {}
  mainObject[country] = { ...mappedResult, type:taxonomy.trade.toLowerCase()}
  output.push({ ...mainObject });
}

const findTradeShipmentAllCountries = async (countryCodeArr, columnName, value, cb) => {
  var matchExpression = {}
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
  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.taxonomy)
    .aggregate([{
      "$match": matchExpression
    }], {
      allowDiskUse: true
    },
      async function (err, cursor) {
        if (err) cb(err);
        cursor.toArray(async function (err, results) {
          if (err) {
            cb(err);
          } else {
            try {
              var output = [];
              var awaitOutput = [];
              for (var taxonomy of results) {
                if ((taxonomy.country == undefined || taxonomy.trade == undefined) || taxonomy.bl_flag == true) {
                  continue
                }
                if (taxonomy.fields == undefined || taxonomy.fields.explore_aggregation == undefined ||
                  taxonomy.hs_code_digit_classification == undefined ||
                  taxonomy.fields.explore_aggregation.groupExpressions == undefined ||
                  taxonomy.fields.explore_aggregation.matchExpressions == undefined) {
                  continue
                }
                awaitOutput.push(getDataElasticsearch(output, taxonomy, columnName, value))
              }
              Promise.all(awaitOutput).then((values) => {
                cb(null, (output) ? output : null);
              });
            } catch (err) {
              logger.error(JSON.stringify(err))
              cb(err)
            }
          }
        });
      });

};


module.exports = {
  findTradeShipmentAllCountries
};
