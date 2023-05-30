const ObjectID = require("mongodb").ObjectID;
const RESULT_PORTION_TYPE_RECORDS = "RECORD_SET";
const RESULT_PORTION_TYPE_SUMMARY = "SUMMARY_RECORDS";

const SEPARATOR_UNDERSCORE = "_";

const ElasticsearchDbQueryBuilderHelper = require("../helpers/elasticsearchDbQueryBuilderHelper");

const deriveDataBucket = (tradeType, country) => {
  return country
    .toLowerCase()
    .concat(SEPARATOR_UNDERSCORE, tradeType.toLowerCase(), "*");
};

const formulateShipmentRecordsAggregationPipelineEngine = (data) => {
  try {
    let queryClause = {
      bool: {},
    };

    queryClause.bool.must = [
      {
        bool: {
          should: [],
        },
      },
    ];
    queryClause.bool.must_not = [];
    queryClause.bool.should = [];
    queryClause.bool.filter = [
      {
        bool: {
          should: [],
          must: [],
        },
      },
    ];

    let aggregationClause = {};

    if (data.aggregationParams.matchExpressions.length > 0) {
      data.aggregationParams.matchExpressions.forEach((matchExpression) => {
        let builtQueryClause =
          ElasticsearchDbQueryBuilderHelper.buildQueryEngineExpressions(
            matchExpression
          );

        //queryClause[builtQueryClause.key] = builtQueryClause.value;
        if (builtQueryClause.or != null && builtQueryClause.or.length > 0) {
          var query = {
            bool: {
              minimum_should_match: 1,
              should: [],
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
          if (builtQueryClause.multiple) {
            queryClause.bool.filter[0].bool.should.push(
              ...builtQueryClause.multiple
            );
          } else {
            queryClause.bool.filter[0].bool.should.push(builtQueryClause);
          }
        } else if (
          matchExpression &&
          matchExpression.relation &&
          matchExpression.relation.toLowerCase() == "not"
        ) {
          if (builtQueryClause.multiple) {
            queryClause.bool.must_not.push(...builtQueryClause.multiple);
          } else {
            queryClause.bool.must_not.push(builtQueryClause);
          }
        } else if (
          !matchExpression.hasOwnProperty("relation") &&
          builtQueryClause.multiple
        ) {
          // Condition for not contains
          if (matchExpression.expressionType == "204") {
            queryClause.bool.must_not.push(...builtQueryClause.multiple);
          } else {
            queryClause.bool.filter[0].bool.should.push(
              ...builtQueryClause.multiple
            );
          }
        } else {
          if (builtQueryClause.multiple) {
            if (
              matchExpression.alias == "COUNTRY" &&
              matchExpression.fieldTerm == "COUNTRY_DATA"
            ) {
              queryClause.bool.must.push(builtQueryClause.multiple[0]);
            } else if (matchExpression.expressionType == "204") {
              //Condition for not contain of product description
              queryClause.bool.must_not.push(...builtQueryClause.multiple);
            } else if (
              matchExpression.alias == "UNIT" &&
              matchExpression.identifier == "FILTER_UNIT"
            ) {
              queryClause.bool.must[0].bool.should.push(
                ...builtQueryClause.multiple
              );
            } else {
              queryClause.bool.must.push(...builtQueryClause.multiple);
            }
          } else {
            queryClause.bool.must.push(builtQueryClause);
          }
        }
      });
    }
    //

    if (data.aggregationParams.groupExpressions) {
      data.aggregationParams.groupExpressions.forEach((groupExpression) => {
        if (groupExpression.identifier.includes("SUMMARY")) {
          let builtQueryClause =
            ElasticsearchDbQueryBuilderHelper.applyQueryGroupExpressions(
              groupExpression
            );
          aggregationClause[groupExpression.identifier] = builtQueryClause;
        }
      });
    }

    let sortArr = [];
    if (
      data.aggregationParams.sortTerms &&
      data.aggregationParams.sortTerms.length > 0
    ) {
      for (let term of data.aggregationParams.sortTerms) {
        let sortKey = {};
        sortKey[term.fieldTerm + term.fieldTermTypeSuffix] = {
          order: term.sortType,
        };
        sortArr.push(sortKey);
      }
    }

    return {
      offset: data.offset,
      limit: data.limit,
      sort: sortArr,
      query:
        queryClause.bool.must.length != 0 ||
        queryClause.bool.filter[0].bool.should.length != 0
          ? queryClause
          : {},
      aggregation: aggregationClause,
    };
  } catch (error) {
    logger.log(error);
    throw error;
  }
};

module.exports = {
  formulateShipmentRecordsAggregationPipelineEngine,
  deriveDataBucket,
  RESULT_PORTION_TYPE_RECORDS,
  RESULT_PORTION_TYPE_SUMMARY,
};
