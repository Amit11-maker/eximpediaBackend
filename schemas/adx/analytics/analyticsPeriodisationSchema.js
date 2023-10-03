// @ts-check
const TAG = 'analyticsPeriodisationSchema';

const ObjectID = require('mongodb').ObjectID;

const SourceDateManipulatorUtil = require('./utils/sourceDateManipulatorUtil');
const MongoDbQueryBuilderHelper = require('./../../../helpers/mongoDbQueryBuilderHelper');
const MongoDbHandler = require('./../../../db/mongoDbHandler');
const ElasticsearchDbQueryBuilderHelper = require('./../../../helpers/elasticsearchDbQueryBuilderHelper');

const ORDER_ASCENDING = 1;
const ORDER_TERM_ASCENDING = "asc";
const ORDER_DESCENDING = -1;
const ORDER_TERM_DESCENDING = "desc";

/* Switch For Enabling Date Computation Based On Source Date Formatting  */
const MUST_INTERPRET_CUSTOM_SOURCE_DATA_FORMATTING = false;

const QUERY_FIELD_TERM_TRADE_DATE = 'tradeDate';

const RESULT_ORDER_TYPE_TOP = 'TOP';

const TRADE_ENTITY_TYPE_HSCODE = "HSCODE";
const TRADE_ENTITY_TYPE_COUNTRY = "COUNTRY";
const TRADE_ENTITY_TYPE_PORT = "PORT";
const TRADE_ENTITY_TYPE_IMPORTER = "IMPORTER";
const TRADE_ENTITY_TYPE_EXPORTER = "EXPORTER";

const TRADE_FACTOR_TYPE_QUANTITY = "QUANTITY";
const TRADE_FACTOR_TYPE_PRICE = "PRICE";
const TRADE_FACTOR_TYPE_UNIT_PRICE = "UNIT_PRICE";
const TRADE_FACTOR_TYPE_AVERAGE_UNIT_PRICE = "AVERAGE_UNIT_PRICE";
const TRADE_FACTOR_TYPE_SHIPMENT = "SHIPMENT";
const TRADE_FACTOR_TYPE_DUTY = "DUTY";

const TRADE_INTERVAL_TYPE_FIXED = "FIXED";
const TRADE_INTERVAL_TYPE_COMPUTED = "COMPUTED";

const QUERY_GROUP_KEY_TOTAL_SHIPMENTS = "totalShipment";
const QUERY_GROUP_KEY_TOTAL_QUANTITY = "totalQuantity";
const QUERY_GROUP_KEY_TOTAL_PRICE = "totalPrice";
const QUERY_GROUP_KEY_TOTAL_UNIT_PRICE = "totalUnitPrice";
const QUERY_GROUP_KEY_TOTAL_DUTY = "totalDuty";
const QUERY_GROUP_KEY_AVERAGE_UNIT_PRICE = "averageUnitPrice";


const classifyAggregationPipelineFormulator = (data) => {
  switch (data.specification.interval) {
    case TRADE_INTERVAL_TYPE_FIXED: {
      return formulateTradeFactorsFixedPeriodisationAggregationPipelineEngine(data);
    }
    case TRADE_INTERVAL_TYPE_COMPUTED: {
      return null;
    }
    default: {
      break;
    }
  }
};

const classifyAggregationResultFormulator = (data) => {
  switch (data.specification.interval) {
    case TRADE_INTERVAL_TYPE_FIXED: {
      return constructTradeFactorsFixedPeriodisationAggregationResultEngine(data);
    }
    case TRADE_INTERVAL_TYPE_COMPUTED: {
      return null;
    }
    default: {
      break;
    }
  }
};


const formulateMatchAggregationStage = (data) => {
  let matchClause = {};
  matchClause.$and = [];

  /*data.matchExpressions.forEach(matchExpression => {
    let builtQueryClause = MongoDbQueryBuilderHelper.buildQueryMatchExpressions(matchExpression);
    let queryClause = {};
    queryClause[builtQueryClause.key] = builtQueryClause.value;
    matchClause.$and.push(queryClause);
  });*/

  data.matchExpressions.forEach(matchExpression => {
    let builtQueryClause = MongoDbQueryBuilderHelper.buildQueryMatchExpressions(matchExpression);
    let queryClause = {};
    queryClause[builtQueryClause.key] = builtQueryClause.value;
    if (queryClause.key == "$or") {
      queryClause.value.forEach(clause => {
        matchClause.$or.push(clause);
      });
    } else {
      matchClause.$and.push(queryClause);
    }
  });

  return (matchClause.$and.length != 0) ? matchClause : {};
};

const formulateMatchAggregationStageEngine = (data) => {

  let queryClause = {
    bool: {}
  };
  queryClause.bool.must = [
    {
      bool: {
        should: []
      }
    },
    {
      bool: {
        should: []
      }
    }
  ];
  queryClause.bool.should = [];

  data.matchExpressions.forEach(matchExpression => {
    let builtQueryClause = ElasticsearchDbQueryBuilderHelper.buildQueryEngineExpressions(matchExpression);

    //queryClause[builtQueryClause.key] = builtQueryClause.value;
    if (builtQueryClause.or != null && builtQueryClause.or.length > 0) {
      builtQueryClause.or.forEach(clause => {
        queryClause.bool.should.push(clause);
      });
      queryClause.bool.minimum_should_match = 1;
    } else {
      if (builtQueryClause.multiple) {
        queryClause.bool.must.push(...builtQueryClause.multiple)
      } else if (builtQueryClause.datas) {
        for (let i = 0; i < builtQueryClause.datas.length; i++) {
          queryClause.bool.must[0].bool.should.push(builtQueryClause.datas[i]);
        }
      } else {
        queryClause.bool.must.push(builtQueryClause);
      }
    }

  });
  //

  return (queryClause.bool.must != 0) ? queryClause : {};

};


const mapQueryFieldTerms = (term, fieldDefinitions) => {
  let queryField = null;
  switch (term) {
    case TRADE_ENTITY_TYPE_IMPORTER: {
      queryField = fieldDefinitions.fieldTerms.importer;
      break;
    }
    case TRADE_ENTITY_TYPE_EXPORTER: {
      queryField = fieldDefinitions.fieldTerms.exporter;
      break;
    }
    case TRADE_ENTITY_TYPE_HSCODE: {
      queryField = fieldDefinitions.fieldTerms.hs_code;
      break;
    }
    case TRADE_ENTITY_TYPE_PORT: {
      queryField = fieldDefinitions.fieldTerms.port;
      break;
    }
    case TRADE_ENTITY_TYPE_COUNTRY: {
      queryField = fieldDefinitions.fieldTerms.country;
      break;
    }
    case TRADE_FACTOR_TYPE_QUANTITY: {
      queryField = fieldDefinitions.fieldTerms.quantity;
      break;
    }
    case TRADE_FACTOR_TYPE_PRICE: {
      queryField = fieldDefinitions.fieldTerms.price;
      break;
    }
    case TRADE_FACTOR_TYPE_UNIT_PRICE: {
      queryField = fieldDefinitions.fieldTerms.unit_price;
      break;
    }
    case TRADE_FACTOR_TYPE_DUTY: {
      queryField = fieldDefinitions.fieldTerms.duty;
      break;
    }
    default: {
      break;
    }
  }
  return queryField;
};

const mapQueryFieldTermsEngine = (term, fieldDefinitions) => {
  let queryField = null;
  switch (term) {
    case TRADE_ENTITY_TYPE_IMPORTER: {
      queryField = fieldDefinitions.fieldTerms.importer;
      break;
    }
    case TRADE_ENTITY_TYPE_EXPORTER: {
      queryField = fieldDefinitions.fieldTerms.exporter;
      break;
    }
    case TRADE_ENTITY_TYPE_HSCODE: {
      queryField = fieldDefinitions.fieldTerms.hs_code;
      break;
    }
    case TRADE_ENTITY_TYPE_PORT: {
      queryField = fieldDefinitions.fieldTerms.port;
      break;
    }
    case TRADE_ENTITY_TYPE_COUNTRY: {
      queryField = fieldDefinitions.fieldTerms.country;
      break;
    }
    case TRADE_FACTOR_TYPE_QUANTITY: {
      queryField = fieldDefinitions.fieldTerms.quantity;
      break;
    }
    case TRADE_FACTOR_TYPE_PRICE: {
      queryField = fieldDefinitions.fieldTerms.price;
      break;
    }
    case TRADE_FACTOR_TYPE_UNIT_PRICE: {
      queryField = fieldDefinitions.fieldTerms.unit_price;
      break;
    }
    case TRADE_FACTOR_TYPE_DUTY: {
      queryField = fieldDefinitions.fieldTerms.duty;
      break;
    }
    default: {
      break;
    }
  }
  return queryField;
};


const mapQueryFieldGroupKeys = (term, fieldDefinitions) => {
  let queryField = null;
  switch (term) {
    case TRADE_FACTOR_TYPE_SHIPMENT: {
      queryField = QUERY_GROUP_KEY_TOTAL_SHIPMENTS;
      break;
    }
    case TRADE_FACTOR_TYPE_QUANTITY: {
      queryField = QUERY_GROUP_KEY_TOTAL_QUANTITY;
      break;
    }
    case TRADE_FACTOR_TYPE_PRICE: {
      queryField = QUERY_GROUP_KEY_TOTAL_PRICE;
      break;
    }
    case TRADE_FACTOR_TYPE_UNIT_PRICE: {
      queryField = QUERY_GROUP_KEY_TOTAL_UNIT_PRICE;
      break;
    }
    case TRADE_FACTOR_TYPE_DUTY: {
      queryField = QUERY_GROUP_KEY_TOTAL_DUTY;
      break;
    }
    case TRADE_FACTOR_TYPE_AVERAGE_UNIT_PRICE: {
      queryField = QUERY_GROUP_KEY_AVERAGE_UNIT_PRICE;
      break;
    }
    default: {
      break;
    }
  }
  return queryField;
};


const formulateTradeFactorsFixedPeriodisationAggregationPipeline = (data) => {

  let matchClause = formulateMatchAggregationStage(data);

  let periodisationAnalysisStages = [];
  let interpretedDateTerm = null;

  let entityGroupQueryField = mapQueryFieldTerms(data.specification.entity, data.definition);


  if (MUST_INTERPRET_CUSTOM_SOURCE_DATA_FORMATTING) {
    interpretedDateTerm = QUERY_FIELD_TERM_TRADE_DATE;
    let additionalProjectionExpressions = {};
    additionalProjectionExpressions[entityGroupQueryField] = 1;
    additionalProjectionExpressions[data.definition.fieldTerms.unit_price] = 1;
    additionalProjectionExpressions[data.definition.fieldTerms.quantity] = 1;
    additionalProjectionExpressions[data.definition.fieldTerms.price] = 1;
    additionalProjectionExpressions[data.definition.fieldTerms.duty] = 1;
    periodisationAnalysisStages = SourceDateManipulatorUtil.formulateSourceDateManipulationStages(data.definition.fieldTerms.date, additionalProjectionExpressions);
  } else {
    interpretedDateTerm = data.definition.fieldTerms.date;
  }

  let preSortDate = {};
  preSortDate[interpretedDateTerm] = ((data.definition.order === RESULT_ORDER_TYPE_TOP) ? ORDER_DESCENDING : ORDER_ASCENDING);
  periodisationAnalysisStages.push({
    $sort: preSortDate
  });

  let entityIntervalFactorsGroupingStage = {
    $group: {
      _id: {
        entity: "$" + entityGroupQueryField,
        year: {
          $year: "$" + interpretedDateTerm
        },
        month: {
          $month: "$" + interpretedDateTerm
        },
        week: {
          $week: "$" + interpretedDateTerm
        }
      },
      totalShipment: {
        $sum: 1
      },
      totalUnitPrice: {
        $sum: "$" + data.definition.fieldTerms.unit_price
      },
      totalQuantity: {
        $sum: "$" + data.definition.fieldTerms.quantity
      },
      totalPrice: {
        $sum: "$" + data.definition.fieldTerms.price
      },
      totalDuty: {
        $sum: "$" + data.definition.fieldTerms.duty
      }
    }
  };
  periodisationAnalysisStages.push(entityIntervalFactorsGroupingStage);

  let entityRecordIntermediaryTimeSort = {
    $sort: {
      "_id.year": 1,
      "_id.month": 1,
      "_id.week": 1
    }
  };
  periodisationAnalysisStages.push(entityRecordIntermediaryTimeSort);

  let entityIntervalCombinedGroupingStage = {
    $group: {
      _id: "$_id.entity",
      totalShipment: {
        $sum: "$totalShipment"
      },
      totalUnitPrice: {
        $sum: "$totalUnitPrice"
      },
      totalQuantity: {
        $sum: "$totalQuantity"
      },
      totalPrice: {
        $sum: "$totalPrice"
      },
      totalDuty: {
        $sum: "$totalDuty"
      },
      plot: {
        $push: {
          year: "$_id.year",
          month: "$_id.month",
          week: "$_id.week",
          totalShipment: "$totalShipment",
          totalUnitPrice: "$totalUnitPrice",
          totalQuantity: "$totalQuantity",
          totalPrice: "$totalPrice",
          totalDuty: "$totalDuty"
        }
      }
    }
  };
  periodisationAnalysisStages.push(entityIntervalCombinedGroupingStage);

  let entityGroupedProjectionStage = {
    $project: {
      _id: 1,
      totalShipment: 1,
      totalQuantity: 1,
      totalPrice: 1,
      totalUnitPrice: 1,
      totalDuty: 1,
      averageUnitPrice: {
        $divide: ["$totalUnitPrice", "$totalShipment"]
      },
      plot: 1
    }
  };
  periodisationAnalysisStages.push(entityGroupedProjectionStage);

  let factorSortGroupQueryField = mapQueryFieldGroupKeys(data.specification.factor);
  let resultSortStage = {
    $sort: {}
  };
  resultSortStage.$sort[factorSortGroupQueryField] = ((data.definition.order === RESULT_ORDER_TYPE_TOP) ? ORDER_DESCENDING : ORDER_ASCENDING);
  periodisationAnalysisStages.push(resultSortStage);

  let resultSkipStage = {
    $skip: parseInt(data.offset)
  };
  periodisationAnalysisStages.push(resultSkipStage);

  let resultLimitStage = {
    $limit: parseInt(data.limit)
  };
  periodisationAnalysisStages.push(resultLimitStage);


  let aggregationExpression = [{
    $match: matchClause
  },
  {
    $facet: {
      periodisationAnalysis: periodisationAnalysisStages
    }
  }
  ];

  //

  return aggregationExpression;
};

const formulateTradeFactorsFixedPeriodisationAggregationPipelineEngine = async (data) => {
  const workspaceId = data.workspaceId;
  let queryClause = formulateMatchAggregationStageEngine(data);

  let interpretedDateTerm = data.definition.fieldTerms.date;

  let entityGroupQueryField = mapQueryFieldTermsEngine(data.specification.entity, data.definition);

  let entityGroupQueryFieldKQL = entityGroupQueryField.split(".")[0];

  const sortOrder = ((data.definition.order === RESULT_ORDER_TYPE_TOP) ? ORDER_TERM_DESCENDING : ORDER_TERM_ASCENDING)

  let sortStage = [];
  let sortDate = {};
  sortDate[interpretedDateTerm] = { order: sortOrder };
  sortStage.push(sortDate);

  let sortStageFactor = [];
  let sortFactor = {};
  let factorSortGroupQueryField = mapQueryFieldGroupKeys(data.specification.factor);
  sortFactor[factorSortGroupQueryField] = { order: sortOrder };
  sortStageFactor.push(sortFactor);

  /** @type {import("./types/workspace").Workspace} */
  const workspace = await MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.workspace).findOne({ _id: workspaceId });

  let workspaceQueries = workspace?.workspace_queries;

  let queryUnions = [];
  let baseQuery = ""
  // loop through all queries and create a union
  workspaceQueries.forEach((queryObj, i) => {
    let query = ` let query_${i} = ${queryObj.query};`
    queryUnions.push(`query_${i}`);
    baseQuery += query;
  })

  const baseQueryTerm = " baseQuery "

  // create a base query with the help of unions
  baseQuery = `${baseQuery} let ${baseQueryTerm} = union ${queryUnions.join(", ")};`

  let TOTAL_SHIPMENT = `totalShipment = count_distinct(DECLARATION_NO),`;
  let TOTAL_QUANTITY = `totalQuantity = sum(${data.definition.fieldTerms.quantity.split(".")[0]}),`;
  let TOTAL_PRICE = `totalPrice = sum(${data.definition.fieldTerms.price.split(".")[0]}),`;
  let TOTAL_DUTY = `totalDuty = sum(${data.definition.fieldTerms.duty.split(".")[0]}),`;
  let TOTAL_UNIT_PRICE = `totalUnitPrice =  sum(${data.definition.fieldTerms.price.split(".")[0]}) / sum(${data.definition.fieldTerms.quantity.split(".")[0]}),`;
  let AVERAGE_UNIT_PRICE = `averageUnitPrice = (sum(${data.definition.fieldTerms.price.split(".")[0]}) / sum(${data.definition.fieldTerms.quantity.split(".")[0]})) / count_distinct(DECLARATION_NO)`;

  let sortQuery = " | order by " + entityGroupQueryFieldKQL + " " + sortOrder;
  let limitQuery = " | limit " + data.limit;

  let periodizationAnalysisAggQuery = ` ${baseQuery} ${baseQueryTerm} | summarize ${TOTAL_SHIPMENT} ${TOTAL_PRICE} ${TOTAL_QUANTITY} ${TOTAL_DUTY} ${TOTAL_UNIT_PRICE} ${AVERAGE_UNIT_PRICE} by ${entityGroupQueryFieldKQL} ${sortQuery} ${limitQuery}`;

  let periodisationAnalysisStage = {
    terms: {
      field: entityGroupQueryField,
      size: data.workspaceEntitiesCount
    },
    aggs: {
      plot: {
        date_histogram: {
          field: interpretedDateTerm,
          calendar_interval: "year",
          format: "yyyy"
        },
        aggs: {
          plot: {
            date_histogram: {
              field: interpretedDateTerm,
              calendar_interval: "month",
              format: "MM"
            },
            aggs: {
              totalShipment: {
                cardinality: {
                  field: "id" + ".keyword"
                }
              },
              totalQuantity: {
                sum: {
                  field: data.definition.fieldTerms.quantity
                }
              },
              totalPrice: {
                sum: {
                  field: data.definition.fieldTerms.price
                }
              },
              totalDuty: {
                sum: {
                  field: data.definition.fieldTerms.duty
                }
              },
              totalUnitPrice: {
                bucket_script: {
                  buckets_path: {
                    totalPrice: "totalPrice",
                    totalQuantity: "totalQuantity"
                  },
                  script: "params.totalPrice / params.totalQuantity"
                }
              },
              averageUnitPrice: {
                bucket_script: {
                  buckets_path: {
                    totalUnitPrice: "totalUnitPrice",
                    totalShipment: "totalShipment"
                  },
                  script: "params.totalUnitPrice / params.totalShipment"
                }
              },
              stats_bucket_sort: {
                bucket_sort: {
                  sort: sortStageFactor
                }
              }
            }
          }
        }
      },
      stats_bucket_sort: {
        bucket_sort: {
          from: parseInt(data.offset),
          size: parseInt(data.limit)
        }
      }
    }
  };

  let aggregationExpression = {
    size: 0,
    sort: sortStage,
    query: queryClause,
    aggs: {
      periodisationAnalysis: periodisationAnalysisStage
    }
  };

  //

  return { ...aggregationExpression, periodizationAnalysisAggQuery };
};


const constructTradeFactorsFixedPeriodisationAggregationResult = (data) => {
  let intelligentizedData = null;
  let entityPeriodisationList = [];

  let factorResultField = mapQueryFieldGroupKeys(data.specification.factor);

  if (data != null) {
    data.boundaryRange.forEach(boundary => {
      boundary.months.forEach(boundaryMonth => {
        data.periodisationAnalysis.forEach(bundle => {

          if (entityPeriodisationList.filter(entity => entity.entity === bundle._id).length === 0) {
            entityPeriodisationList.push({
              "entity": bundle._id
            });
          }

          let dataPoint = 0;
          let dataPointStepUnitPrice = 0;
          let dataPointStepShipment = 0;
          bundle.plot.forEach(plot => {
            if (plot.year === boundary.year) {
              if (plot.month === boundaryMonth) {
                if (data.specification.factor == TRADE_FACTOR_TYPE_AVERAGE_UNIT_PRICE) {
                  dataPointStepUnitPrice += Number(plot.totalUnitPrice);
                  dataPointStepShipment += Number(plot.totalShipment);
                } else {
                  dataPoint += Number(plot[factorResultField ?? ""]);
                }
              }
            }
          });

          if (data.specification.factor == TRADE_FACTOR_TYPE_AVERAGE_UNIT_PRICE && dataPointStepShipment != 0) {
            dataPoint = dataPointStepUnitPrice / dataPointStepShipment;
          }

          entityPeriodisationList.forEach(entity => {
            if (entity.entity === bundle._id) {
              entity[boundaryMonth.toString() + "-" + boundary.year.toString()] = parseFloat(dataPoint.toString()).toFixed(2);
            }
          });

        });
      });
    });
    intelligentizedData = {
      dataPoints: entityPeriodisationList
    };
  }
  return intelligentizedData;
};

const constructTradeFactorsFixedPeriodisationAggregationResultEngine = (data) => {
  let intelligentizedData = null;
  let entityPeriodisationList = [];

  let factorResultField = mapQueryFieldGroupKeys(data.specification.factor);

  if (data != null) {

    let transformedPeriodisationAnalysis = [];
    data.periodisationAnalysis.buckets.forEach(bundleCountry => {
      let countryPlots = [];
      bundleCountry.plot.buckets.forEach(bundleYear => {
        bundleYear.plot.buckets.forEach(bundleMonth => {
          let dataBundle = {
            year: parseInt(bundleYear.key_as_string),
            month: parseInt(bundleMonth.key_as_string),
            week: 0,
            totalShipment: bundleMonth.totalShipment.value,
            totalQuantity: bundleMonth.totalQuantity.value,
            totalPrice: bundleMonth.totalPrice.value,
            totalUnitPrice: bundleMonth.totalUnitPrice.value,
            totalDuty: bundleMonth.totalDuty.value
          };
          countryPlots.push(dataBundle);
        });
      });
      transformedPeriodisationAnalysis.push({
        _id: bundleCountry.key,
        plot: countryPlots
      });
    });

    data.periodisationAnalysis = transformedPeriodisationAnalysis;
    // console.log(JSON.stringify(data.boundaryRange))
    data.boundaryRange.forEach(boundary => {
      boundary.months.forEach(boundaryMonth => {
        data.periodisationAnalysis.forEach(bundle => {

          if (entityPeriodisationList.filter(entity => entity.entity === bundle._id).length === 0) {
            entityPeriodisationList.push({
              "entity": bundle._id
            });
          }

          let dataPoint = 0;
          let dataPointStepUnitPrice = 0;
          let dataPointStepShipment = 0;
          bundle.plot.forEach(plot => {
            if (plot.year === boundary.year) {
              if (plot.month === boundaryMonth) {
                if (data.specification.factor == TRADE_FACTOR_TYPE_AVERAGE_UNIT_PRICE) {
                  dataPointStepUnitPrice += Number(plot.totalUnitPrice);
                  dataPointStepShipment += Number(plot.totalShipment);
                } else {
                  dataPoint += Number(plot[factorResultField ?? ""]);
                }
              }
            }
          });

          if (data.specification.factor == TRADE_FACTOR_TYPE_AVERAGE_UNIT_PRICE && dataPointStepShipment != 0) {
            dataPoint = dataPointStepUnitPrice / dataPointStepShipment;
          }

          entityPeriodisationList.forEach(entity => {
            if (entity.entity === bundle._id) {
              entity[boundaryMonth.toString() + "-" + boundary.year.toString()] = parseFloat(dataPoint.toString()).toFixed(2);
            }
          });

        });
      });
    });
    intelligentizedData = {
      dataPoints: entityPeriodisationList
    };
  }
  // console.log(JSON.stringify(intelligentizedData))
  return intelligentizedData;
};


module.exports = {
  classifyAggregationPipelineFormulator,
  classifyAggregationResultFormulator
};
