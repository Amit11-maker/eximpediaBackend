const TAG = 'tradeModel';

const ObjectID = require('mongodb').ObjectID;

const MongoDbHandler = require('../db/mongoDbHandler');
const ElasticsearchDbHandler = require('../db/elasticsearchDbHandler');
const GlobalSearchSchema = require('../schemas/globalSearchSchema');



async function getDataElasticsearch(output, taxonomy, columnName, value) {
  dataBucket = taxonomy.country.toLowerCase() + "_" + taxonomy.trade.toLowerCase()
  var aggregationParams = {}
  aggregationParams.offset = 0;
  aggregationParams.limit = 10;
  aggregationParams.matchExpressions = [];
  let fieldFlag = false;
  for (var matchExpression of taxonomy.fields.explore_aggregation.matchExpressions) {
    if (columnName.toLowerCase() == matchExpression.identifier.toLowerCase()) {
      matchExpression.fieldValue = value
      if (columnName.toLowerCase() == "search_hs_code") {
        let leftValue = value;
        let rightValue = value;
        let digitsCount = value.length;
        for (let index = digitsCount + 1; index <= taxonomy.hs_code_digit_classification; index++) {
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
  let clause = GlobalSearchSchema.formulateShipmentRecordsAggregationPipelineEngine(aggregationParams);
  var count = 0
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

  resultArr = []
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
        let sourceData = hit._source;
        sourceData._id = hit._id;
        mappedResult[GlobalSearchSchema.RESULT_PORTION_TYPE_RECORDS].push(sourceData);
      });
    }
    for (const prop in result.body.aggregations) {
      if (result.body.aggregations.hasOwnProperty(prop)) {
        if (prop.indexOf('FILTER') === 0) {
          let mappingGroups = [];
          //let mappingGroupTermCount = 0;
          let groupExpression = aggregationParams.groupExpressions.filter(expression => expression.identifier == prop)[0];

          if (groupExpression && groupExpression.isFilter) {
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
  // var country = taxonomy.country.toLowerCase();
  var mainObject = {}
  mainObject[dataBucket] = { ...mappedResult }
  output.push({ ...mainObject });
}

const findTradeShipmentAllCountries = async (countryCodeArr, columnName, value, cb) => {
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
                if (taxonomy.country == undefined || taxonomy.trade == undefined) {
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
              console.log(JSON.stringify(err))
              cb(err)
            }
          }
        });
      });

};


module.exports = {
  findTradeShipmentAllCountries
};
