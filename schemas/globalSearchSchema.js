const TAG = 'globalSearchSchema';
const ElasticsearchDbQueryBuilderHelper = require('./../helpers/elasticsearchDbQueryBuilderHelper');

const RESULT_PORTION_TYPE_RECORDS = 'RECORD_SET';
const RESULT_PORTION_TYPE_SUMMARY = 'SUMMARY_RECORDS';

const formulateShipmentRecordsAggregationPipelineEngine = (data) => {

  let queryClause = {
    bool: {}
  };
  queryClause.bool.must = [];
  queryClause.bool.should = [];
  queryClause.bool.filter = [];

  let aggregationClause = {};
  data.matchExpressions.forEach(matchExpression => {
    let builtQueryClause = ElasticsearchDbQueryBuilderHelper.buildQueryEngineExpressions(matchExpression);

    //queryClause[builtQueryClause.key] = builtQueryClause.value;
    if (builtQueryClause.or != null && builtQueryClause.or.length > 0) {
      var query = {
        "bool": {
          "should": [],
          "minimum_should_match":1
        }
      }
      builtQueryClause.or.forEach(clause => {
        query.bool.should.push(clause);
      });
      builtQueryClause = query;
    } 
    queryClause.bool.must.push(builtQueryClause);

  });

  let sortKey = {};
  if (data.sortTerm) {
    sortKey[data.sortTerm] = {
      order: "desc"
    };
  }

  data.groupExpressions.forEach(groupExpression => {
    let builtQueryClause = ElasticsearchDbQueryBuilderHelper.applyQueryGroupExpressions(groupExpression);
    aggregationClause[groupExpression.identifier] = builtQueryClause;
  });

    // console.log(JSON.stringify(queryClause));
  return {
    offset: data.offset,
    limit: data.limit,
    sort: sortKey,
    query: (queryClause.bool.must.length != 0) ? queryClause : {},
    aggregation: aggregationClause
  };

};

module.exports = {
  RESULT_PORTION_TYPE_SUMMARY,
  RESULT_PORTION_TYPE_RECORDS,
  formulateShipmentRecordsAggregationPipelineEngine
};
