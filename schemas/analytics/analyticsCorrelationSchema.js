const TAG = 'analyticsCorrelationSchema';

const ObjectID = require('mongodb').ObjectID;

const SourceDateManipulatorUtil = require('./utils/sourceDateManipulatorUtil');
const MongoDbQueryBuilderHelper = require('./../../helpers/mongoDbQueryBuilderHelper');
const ElasticsearchDbQueryBuilderHelper = require('./../../helpers/elasticsearchDbQueryBuilderHelper');

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

const TRADE_RELATION_TYPE_ALL = "ALL";
const TRADE_RELATION_TYPE_DUO = "DUO";
const TRADE_RELATION_TYPE_TRIO = "TRIO";

const QUERY_GROUP_KEY_TOTAL_SHIPMENTS = "totalShipment";
const QUERY_GROUP_KEY_TOTAL_QUANTITY = "totalQuantity";
const QUERY_GROUP_KEY_TOTAL_PRICE = "totalPrice";
const QUERY_GROUP_KEY_TOTAL_UNIT_PRICE = "totalUnitPrice";
const QUERY_GROUP_KEY_TOTAL_DUTY = "totalDuty";
const QUERY_GROUP_KEY_AVERAGE_UNIT_PRICE = "averageUnitPrice";


const classifyAggregationPipelineFormulator = (data) => {
  switch (data.specification.relation) {
    case TRADE_RELATION_TYPE_ALL: {
      return formulateTradeFactorsAllCorrelationAggregationPipelineEngine(data);
    }
    case TRADE_RELATION_TYPE_DUO: {
      return formulateTradeFactorsDuoCorrelationAggregationPipelineEngine(data);
    }
    case TRADE_RELATION_TYPE_TRIO: {
      return null;
    }
    default: {
      break;
    }
  }
};

const classifyAggregationResultFormulator = (data) => {
  switch (data.specification.relation) {
    case TRADE_RELATION_TYPE_ALL: {
      return constructTradeFactorsAllCorrelationAggregationResultEngine(data);
    }
    case TRADE_RELATION_TYPE_DUO: {
      return constructTradeFactorsDuoCorrelationAggregationResultEngine(data);
    }
    case TRADE_RELATION_TYPE_TRIO: {
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


const formulateTradeFactorsAllCorrelationAggregationPipeline = (data) => {

  let matchClause = formulateMatchAggregationStage(data);

  let correlationAnalysisStages = [];
  let interpretedDateTerm = null;

  if (MUST_INTERPRET_CUSTOM_SOURCE_DATA_FORMATTING) {
    interpretedDateTerm = QUERY_FIELD_TERM_TRADE_DATE;
    let additionalProjectionExpressions = {};
    additionalProjectionExpressions[data.definition.fieldTerms.duty] = 1;
    additionalProjectionExpressions[data.definition.fieldTerms.unit_price] = 1;
    additionalProjectionExpressions[data.definition.fieldTerms.quantity] = 1;
    additionalProjectionExpressions[data.definition.fieldTerms.price] = 1;
    correlationAnalysisStages = SourceDateManipulatorUtil.formulateSourceDateManipulationStages(data.definition.fieldTerms.date, additionalProjectionExpressions);
  } else {
    interpretedDateTerm = data.definition.fieldTerms.date;
  }

  let preSortDate = {};
  preSortDate[interpretedDateTerm] = ((data.definition.order === RESULT_ORDER_TYPE_TOP) ? ORDER_DESCENDING : ORDER_ASCENDING);
  correlationAnalysisStages.push({
    $sort: preSortDate
  });

  let itervalFactorsGroupingStage = {
    $group: {
      _id: {
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
      totalDuty: {
        $sum: "$" + data.definition.fieldTerms.duty
      },
      totalUnitPrice: {
        $sum: "$" + data.definition.fieldTerms.unit_price
      },
      totalQuantity: {
        $sum: "$" + data.definition.fieldTerms.quantity
      },
      totalPrice: {
        $sum: "$" + data.definition.fieldTerms.price
      }
    }
  };
  correlationAnalysisStages.push(itervalFactorsGroupingStage);

  let recordIntermediaryTimeSort = {
    $sort: {
      "_id.year": 1,
      "_id.month": 1,
      "_id.week": 1
    }
  };
  correlationAnalysisStages.push(recordIntermediaryTimeSort);

  let intervalCombinedGroupingStage = {
    $group: {
      _id: null,
      plot: {
        $push: {
          year: "$_id.year",
          month: "$_id.month",
          week: "$_id.week",
          totalShipments: "$totalShipment",
          totalDuty: "$totalDuty",
          totalUnitPrice: "$totalUnitPrice",
          totalQuantity: "$totalQuantity",
          totalPrice: "$totalPrice"
        }
      }
    }
  };
  correlationAnalysisStages.push(intervalCombinedGroupingStage);

  let groupedProjectionStage = {
    $project: {
      _id: 0,
      plot: 1
    }
  };
  correlationAnalysisStages.push(groupedProjectionStage);

  let aggregationExpression = [{
    $match: matchClause
  },
  {
    $facet: {
      correlationAnalysis: correlationAnalysisStages
    }
  }
  ];

  //

  return aggregationExpression;
};

const formulateTradeFactorsAllCorrelationAggregationPipelineEngine = (data) => {

  let queryClause = formulateMatchAggregationStageEngine(data);

  let interpretedDateTerm = data.definition.fieldTerms.date;

  let sortStage = [];
  let sortDate = {};
  sortDate[interpretedDateTerm] = {
    order: ((data.definition.order === RESULT_ORDER_TYPE_TOP) ? ORDER_TERM_DESCENDING : ORDER_TERM_ASCENDING)
  };
  sortStage.push(sortDate);

  let correlationAnalysisStage = {
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
          totalShipments: {
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
          }
        }
      }
    }
  };

  let aggregationExpression = {
    size: 0,
    sort: sortStage,
    query: queryClause,
    aggs: {
      correlationAnalysis: correlationAnalysisStage
    }
  };
  // console.log(JSON.stringify(aggregationExpression))


  return aggregationExpression;
};


const formulateTradeFactorsDuoCorrelationAggregationPipeline = (data) => {

  let matchClause = formulateMatchAggregationStage(data);

  let correlationAnalysisStages = [];

  let entityGroupQueryField = mapQueryFieldTerms(data.specification.domain, data.definition);


  let entityFactorsGroupingStage = {
    $group: {
      _id: "$" + entityGroupQueryField,
      totalShipment: {
        $sum: 1
      },
      totalDuty: {
        $sum: "$" + data.definition.fieldTerms.duty
      },
      totalUnitPrice: {
        $sum: "$" + data.definition.fieldTerms.unit_price
      },
      totalQuantity: {
        $sum: "$" + data.definition.fieldTerms.quantity
      },
      totalPrice: {
        $sum: "$" + data.definition.fieldTerms.price
      }
    }
  };
  correlationAnalysisStages.push(entityFactorsGroupingStage);

  let groupedProjectionStage = {
    $project: {
      _id: 1,
      totalShipment: 1,
      totalQuantity: 1,
      totalPrice: 1,
      totalDuty: 1,
      totalUnitPrice: 1,
      averageUnitPrice: {
        $divide: ["$totalUnitPrice", "$totalShipment"]
      }
    }
  };
  correlationAnalysisStages.push(groupedProjectionStage);

  let factorFirstGroupQueryField = mapQueryFieldGroupKeys(data.specification.factorFirst);
  let factorSecondGroupQueryField = mapQueryFieldGroupKeys(data.specification.factorSecond);

  let recordIntermediaryTimeSort = {
    $sort: {}
  };
  recordIntermediaryTimeSort.$sort[factorFirstGroupQueryField] = ((data.definition.order === RESULT_ORDER_TYPE_TOP) ? ORDER_DESCENDING : ORDER_ASCENDING);
  recordIntermediaryTimeSort.$sort[factorSecondGroupQueryField] = ((data.definition.order === RESULT_ORDER_TYPE_TOP) ? ORDER_DESCENDING : ORDER_ASCENDING);
  correlationAnalysisStages.push(recordIntermediaryTimeSort);

  let resultLimitStage = {
    $limit: parseInt(data.definition.limit)
  };
  correlationAnalysisStages.push(resultLimitStage);

  let extractProjectionStage = {
    $project: {
      _id: 1,
      factorFirst: "$" + factorFirstGroupQueryField,
      factorSecond: "$" + factorSecondGroupQueryField
    }
  };
  correlationAnalysisStages.push(extractProjectionStage);


  let aggregationExpression = [{
    $match: matchClause
  },
  {
    $facet: {
      correlationAnalysis: correlationAnalysisStages
    }
  }
  ];



  return aggregationExpression;
};

const formulateTradeFactorsDuoCorrelationAggregationPipelineEngine = (data) => {

  let queryClause = formulateMatchAggregationStageEngine(data);

  let entityGroupQueryField = mapQueryFieldTermsEngine(data.specification.domain, data.definition);


  let sortStage = [];
  let sortFirstFactor = {};
  let sortSecondFactor = {};
  let factorFirstGroupQueryField = mapQueryFieldGroupKeys(data.specification.factorFirst);
  let factorSecondGroupQueryField = mapQueryFieldGroupKeys(data.specification.factorSecond);
  sortFirstFactor[factorFirstGroupQueryField] = {
    order: ((data.definition.order === RESULT_ORDER_TYPE_TOP) ? ORDER_TERM_DESCENDING : ORDER_TERM_ASCENDING)
  };
  sortSecondFactor[factorSecondGroupQueryField] = {
    order: ((data.definition.order === RESULT_ORDER_TYPE_TOP) ? ORDER_TERM_DESCENDING : ORDER_TERM_ASCENDING)
  };
  sortStage.push(sortFirstFactor);
  sortStage.push(sortSecondFactor);

  let correlationAnalysisStage = {
    terms: {
      field: entityGroupQueryField
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
      stats_bucket_sort: {
        bucket_sort: {
          sort: sortStage,
          size: parseInt(data.definition.limit)
        }
      }
    }
  };

  let aggregationExpression = {
    size: 0,
    query: queryClause,
    aggs: {
      correlationAnalysis: correlationAnalysisStage
    }
  };
  //

  return aggregationExpression;



};


const constructTradeFactorsAllCorrelationAggregationResult = (data) => {
  let intelligentizedData = null;
  let quantityList = [];
  let priceList = [];
  let unitPriceList = [];
  let dutyList = [];
  let shipmentList = [];
  let averageUnitPriceList = [];
  if (data != null) {
    data.boundaryRange.forEach(boundary => {
      boundary.months.forEach(boundaryMonth => {
        data.correlationAnalysis.forEach(bundle => {

          let dataPointQuantity = 0;
          let dataPointPrice = 0;
          let dataPointUnitPrice = 0;
          let dataPointDuty = 0;
          let dataPointShipment = 0;
          let dataPointAverageUnitPrice = 0;
          bundle.plot.forEach(plot => {
            if (plot.year === boundary.year) {
              if (plot.month === boundaryMonth) {
                dataPointQuantity += Number(plot.totalQuantity);
                dataPointPrice += Number(plot.totalPrice);
                dataPointUnitPrice += Number(plot.totalUnitPrice);
                dataPointDuty += Number(plot.totalDuty);
                dataPointShipment += Number(plot.totalShipments);
              }
            }
          });
          dataPointAverageUnitPrice = dataPointUnitPrice / dataPointShipment;

          quantityList.push(dataPointQuantity);
          priceList.push(dataPointPrice);
          unitPriceList.push(dataPointUnitPrice);
          dutyList.push(dataPointDuty);
          shipmentList.push(dataPointShipment);
          averageUnitPriceList.push(dataPointAverageUnitPrice);

        });
      });
    });
    intelligentizedData = {
      factorPlotPoints: [{
        factor: TRADE_FACTOR_TYPE_QUANTITY,
        plotPoints: quantityList
      },
      {
        factor: TRADE_FACTOR_TYPE_PRICE,
        plotPoints: priceList
      },
      {
        factor: TRADE_FACTOR_TYPE_UNIT_PRICE,
        plotPoints: unitPriceList
      },
      {
        factor: TRADE_FACTOR_TYPE_DUTY,
        plotPoints: dutyList
      },
      {
        factor: TRADE_FACTOR_TYPE_SHIPMENT,
        plotPoints: shipmentList
      },
      {
        factor: TRADE_FACTOR_TYPE_AVERAGE_UNIT_PRICE,
        plotPoints: averageUnitPriceList
      }
      ]
    };
  }
  //
  return intelligentizedData;
};

const constructTradeFactorsAllCorrelationAggregationResultEngine = (data) => {
  let intelligentizedData = null;
  let quantityList = [];
  let priceList = [];
  let unitPriceList = [];
  let dutyList = [];
  let shipmentList = [];
  let averageUnitPriceList = [];
  if (data != null) {

    let transformedCorrelationAnalysis = [];
    data.correlationAnalysis.buckets.forEach(bundleYear => {
      bundleYear.plot.buckets.forEach(bundleMonth => {
        let dataBundle = {
          year: parseInt(bundleYear.key_as_string),
          month: parseInt(bundleMonth.key_as_string),
          week: 0,
          totalShipments: bundleMonth.totalShipments.value,
          totalQuantity: bundleMonth.totalQuantity.value,
          totalPrice: bundleMonth.totalPrice.value,
          totalUnitPrice: bundleMonth.totalUnitPrice.value,
          totalDuty: bundleMonth.totalDuty.value
        };
        transformedCorrelationAnalysis.push(dataBundle);
      });
    });

    data.correlationAnalysis = [{
      plot: transformedCorrelationAnalysis
    }];

    data.boundaryRange.forEach(boundary => {
      boundary.months.forEach(boundaryMonth => {
        data.correlationAnalysis.forEach(bundle => {

          let dataPointQuantity = 0;
          let dataPointPrice = 0;
          let dataPointUnitPrice = 0;
          let dataPointDuty = 0;
          let dataPointShipment = 0;
          let dataPointAverageUnitPrice = 0;
          bundle.plot.forEach(plot => {
            if (plot.year === boundary.year) {
              if (plot.month === boundaryMonth) {
                dataPointQuantity += Number(plot.totalQuantity);
                dataPointPrice += Number(plot.totalPrice);
                dataPointUnitPrice += Number(plot.totalUnitPrice);
                dataPointDuty += Number(plot.totalDuty);
                dataPointShipment += Number(plot.totalShipments);
              }
            }
          });
          dataPointAverageUnitPrice = dataPointUnitPrice / dataPointShipment;

          quantityList.push(dataPointQuantity);
          priceList.push(dataPointPrice);
          unitPriceList.push(dataPointUnitPrice);
          dutyList.push(dataPointDuty);
          shipmentList.push(dataPointShipment);
          averageUnitPriceList.push(dataPointAverageUnitPrice);

        });
      });
    });
    intelligentizedData = {
      factorPlotPoints: [{
        factor: TRADE_FACTOR_TYPE_QUANTITY,
        plotPoints: quantityList
      },
      {
        factor: TRADE_FACTOR_TYPE_PRICE,
        plotPoints: priceList
      },
      {
        factor: TRADE_FACTOR_TYPE_UNIT_PRICE,
        plotPoints: unitPriceList
      },
      {
        factor: TRADE_FACTOR_TYPE_DUTY,
        plotPoints: dutyList
      },
      {
        factor: TRADE_FACTOR_TYPE_SHIPMENT,
        plotPoints: shipmentList
      },
      {
        factor: TRADE_FACTOR_TYPE_AVERAGE_UNIT_PRICE,
        plotPoints: averageUnitPriceList
      }
      ]
    };
  }
  //
  return intelligentizedData;
};


const constructTradeFactorsDuoCorrelationAggregationResult = (data) => {
  let intelligentizedData = null;
  let domainList = [];
  let factorFirstList = [];
  let factorSecondList = [];
  if (data != null) {

    data.correlationAnalysis.forEach(bundle => {
      domainList.push(bundle._id);
      factorFirstList.push(Number(bundle.factorFirst));
      factorSecondList.push(Number(bundle.factorSecond));
    });

    intelligentizedData = {
      domainPlotPoints: domainList,
      factorPlotPoints: {
        first: factorFirstList,
        second: factorSecondList
      }
    };
  }
  //
  return intelligentizedData;
};

const constructTradeFactorsDuoCorrelationAggregationResultEngine = (data) => {
  let intelligentizedData = null;
  let domainList = [];
  let factorFirstList = [];
  let factorSecondList = [];
  if (data != null) {

    let transformedCorrelationAnalysis = [];

    let factorFirstGroupQueryField = mapQueryFieldGroupKeys(data.specification.factorFirst);
    let factorSecondGroupQueryField = mapQueryFieldGroupKeys(data.specification.factorSecond);

    data.correlationAnalysis.buckets.forEach(bundleTerm => {
      let dataBundle = {
        _id: bundleTerm.key,
        factorFirst: bundleTerm[factorFirstGroupQueryField].value,
        factorSecond: bundleTerm[factorSecondGroupQueryField].value,
      };
      transformedCorrelationAnalysis.push(dataBundle);
    });

    data.correlationAnalysis = transformedCorrelationAnalysis;

    data.correlationAnalysis.forEach(bundle => {
      domainList.push(bundle._id);
      factorFirstList.push(Number(bundle.factorFirst));
      factorSecondList.push(Number(bundle.factorSecond));
    });

    intelligentizedData = {
      domainPlotPoints: domainList,
      factorPlotPoints: {
        first: factorFirstList,
        second: factorSecondList
      }
    };
  }
  //
  return intelligentizedData;
};


module.exports = {
  classifyAggregationPipelineFormulator,
  classifyAggregationResultFormulator
};
