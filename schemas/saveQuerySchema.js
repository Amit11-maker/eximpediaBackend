const ObjectID = require("mongodb").ObjectID;
const RESULT_PORTION_TYPE_RECORDS = "RECORD_SET";
const RESULT_PORTION_TYPE_SUMMARY = "SUMMARY_RECORDS";

const SEPARATOR_UNDERSCORE = "_";

const ElasticsearchDbQueryBuilderHelper = require("../helpers/elasticsearchDbQueryBuilderHelper");


const deriveDataBucket = (tradeType, country) => {
  return country
    .toLowerCase()
    .concat(SEPARATOR_UNDERSCORE, tradeType.toLowerCase());
};

const formulateShipmentRecordsAggregationPipelineEngine = (data) => {
  let queryClause = {
    bool: {},
  };
  queryClause.bool.must = [];
  queryClause.bool.should = [];
  queryClause.bool.filter = [];

  let aggregationClause = {};

  data.aggregationParams.matchExpressions.forEach((matchExpression) => {
    let builtQueryClause =
      ElasticsearchDbQueryBuilderHelper.buildQueryEngineExpressions(
        matchExpression
      );

    //queryClause[builtQueryClause.key] = builtQueryClause.value;
    if (builtQueryClause.or != null && builtQueryClause.or.length > 0) {
      var query = {
        bool: {
          should: [],
          minimum_should_match: 1,
        },
      };
      builtQueryClause.or.forEach((clause) => {
        query.bool.should.push(clause);
      });
      builtQueryClause = query;
    }
    if (
      matchExpression &&
      matchExpression.relation &&
      matchExpression.relation.toLowerCase() == "or"
    ) {
      queryClause.bool.should.push(builtQueryClause);
    } else {
      queryClause.bool.must.push(builtQueryClause);
    }
  });
  //

  let sortKey = {};
  if (data.sortTerm) {
    sortKey[data.sortTerm] = {
      order: "desc",
    };
  }

  data.aggregationParams.groupExpressions.forEach((groupExpression) => {
    let builtQueryClause =
      ElasticsearchDbQueryBuilderHelper.applyQueryGroupExpressions(
        groupExpression
      );
    //let groupClause = {};
    //groupClause[builtQueryClause.key] = builtQueryClause.value;
    aggregationClause[groupExpression.identifier] = builtQueryClause;
  });

  console.log(JSON.stringify(aggregationClause));
  return {
    offset: data.offset,
    limit: data.limit,
    sort: sortKey,
    query: queryClause.bool.must.length != 0 ? queryClause : {},
    aggregation: aggregationClause,
  };
};

module.exports = {
  formulateShipmentRecordsAggregationPipelineEngine,
  deriveDataBucket,
  RESULT_PORTION_TYPE_RECORDS,
  RESULT_PORTION_TYPE_SUMMARY,
};
