const ObjectID = require("mongodb").ObjectID;
const RESULT_PORTION_TYPE_RECORDS = "RECORD_SET";
const RESULT_PORTION_TYPE_SUMMARY = "SUMMARY_RECORDS";

const SEPARATOR_UNDERSCORE = "_";

const ElasticsearchDbQueryBuilderHelper = require("../helpers/elasticsearchDbQueryBuilderHelper");

const userSchema = {
  account_id: "",
  user_id: "",
  tradeType: "",
  country: "",
  query: [],
  recordSetKey: "",
  sortTerm: "",
  created_ts: 0,
  modified_ts: 0,
};

const buildQuery = (data) => {
  let currentTimestamp = Date.now();
  let content = JSON.parse(JSON.stringify(userSchema));
  content.account_id = ObjectID(data.account_id);
  content.user_id = ObjectID(data.user_id);
  content.tradeType = data.tradeType;
  content.country = data.country;
  content.query = data.query;
  content.sortTerm = data.sortTerm;
  content.recordSetKey = data.recordSetKey;
  content.created_ts = currentTimestamp;
  content.modified_ts = currentTimestamp;
  return content;
};
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

  data.matchExpressions.forEach((matchExpression) => {
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

  data.groupExpressions.forEach((groupExpression) => {
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
  buildQuery,
  formulateShipmentRecordsAggregationPipelineEngine,
  deriveDataBucket,
  RESULT_PORTION_TYPE_RECORDS,
  RESULT_PORTION_TYPE_SUMMARY,
};
