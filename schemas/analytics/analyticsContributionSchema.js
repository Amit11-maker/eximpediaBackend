const TAG = 'analyticsContributionSchema';

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

const TRADE_CONTRAST_TYPE_NEUTRAL = "NEUTRAL";
const TRADE_CONTRAST_TYPE_DIFFERENTIAL = "DIFFERENTIAL";

const QUERY_GROUP_KEY_TOTAL_SHIPMENTS = "totalShipment";
const QUERY_GROUP_KEY_TOTAL_QUANTITY = "totalQuantity";
const QUERY_GROUP_KEY_TOTAL_PRICE = "totalPrice";
const QUERY_GROUP_KEY_TOTAL_UNIT_PRICE = "totalUnitPrice";
const QUERY_GROUP_KEY_TOTAL_DUTY = "totalDuty";
const QUERY_GROUP_KEY_AVERAGE_UNIT_PRICE = "averageUnitPrice";


const classifyAggregationPipelineFormulator = (data) => {
  switch (data.specification.contrast) {
    case TRADE_CONTRAST_TYPE_NEUTRAL: {
      return null;
    }
    case TRADE_CONTRAST_TYPE_DIFFERENTIAL: {
      return formulateTradeFactorsDifferentialContributionAggregationPipelineEngine(data);
    }
    default: {
      break;
    }
  }
};

const classifyAggregationResultFormulator = (data) => {
  switch (data.specification.contrast) {
    case TRADE_CONTRAST_TYPE_NEUTRAL: {
      return null;
    }
    case TRADE_CONTRAST_TYPE_DIFFERENTIAL: {
      return constructTradeFactorsDifferentialContributionAggregationResultEngine(data);
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
  queryClause.bool.must = [];
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
      queryClause.bool.must.push(builtQueryClause);
    }

  });
  //console.log(queryClause);

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
      queryField = fieldDefinitions.fieldTerms.importer + ".keyword";
      break;
    }
    case TRADE_ENTITY_TYPE_EXPORTER: {
      queryField = fieldDefinitions.fieldTerms.exporter + ".keyword";
      break;
    }
    case TRADE_ENTITY_TYPE_HSCODE: {
      queryField = fieldDefinitions.fieldTerms.hs_code + ".number";
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


const formulateTradeFactorsDifferentialContributionAggregationPipeline = (data) => {

  let matchClause = formulateMatchAggregationStage(data);

  let grossContributionAnalysisStages = [];

  let grossFactorsGroupingStage = {
    $group: {
      _id: null,
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
  grossContributionAnalysisStages.push(grossFactorsGroupingStage);

  let grossFactorsGroupedProjectionStage = {
    $project: {
      _id: 0,
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
  grossContributionAnalysisStages.push(grossFactorsGroupedProjectionStage);


  let entityContributionAnalysisStages = [];

  let entityGroupQueryField = mapQueryFieldTerms(data.specification.entity, data.definition);
  console.log(entityGroupQueryField);

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
  entityContributionAnalysisStages.push(entityFactorsGroupingStage);

  let entityFactorsGroupedProjectionStage = {
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
  entityContributionAnalysisStages.push(entityFactorsGroupedProjectionStage);

  let factorSortGroupQueryField = mapQueryFieldGroupKeys(data.specification.factorSort);
  let recordIntermediaryTimeSort = {
    $sort: {}
  };
  recordIntermediaryTimeSort.$sort[factorSortGroupQueryField] = ((data.definition.order === RESULT_ORDER_TYPE_TOP) ? ORDER_DESCENDING : ORDER_ASCENDING);
  entityContributionAnalysisStages.push(recordIntermediaryTimeSort);

  let resultSkipStage = {
    $skip: parseInt(data.offset)
  };
  entityContributionAnalysisStages.push(resultSkipStage);

  let resultLimitStage = {
    $limit: parseInt(data.limit)
  };
  entityContributionAnalysisStages.push(resultLimitStage);

  let aggregationExpression = [{
      $match: matchClause
    },
    {
      $facet: {
        grossContributionAnalysis: grossContributionAnalysisStages,
        entityContributionAnalysis: entityContributionAnalysisStages
      }
    }
  ];

  //console.log(JSON.stringify(aggregationExpression));

  return aggregationExpression;
};

const formulateTradeFactorsDifferentialContributionAggregationPipelineEngine = (data) => {

  let queryClause = formulateMatchAggregationStageEngine(data);

  let entityGroupQueryField = mapQueryFieldTermsEngine(data.specification.entity, data.definition);
  console.log(entityGroupQueryField);

  let sortStage = [];
  let sortTerm = {};
  let factorSortGroupQueryField = mapQueryFieldGroupKeys(data.specification.factorSort);
  sortTerm[factorSortGroupQueryField] = {
    order: ((data.definition.order === RESULT_ORDER_TYPE_TOP) ? ORDER_TERM_DESCENDING : ORDER_TERM_ASCENDING)
  };
  sortStage.push(sortTerm);

  let contributionAnalysisStage = {
    totalShipment: {
      cardinality: {
        field: "id"
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
        field: data.definition.fieldTerms.price
      }
    },
    totalUnitPrice: {
      sum: {
        field: data.definition.fieldTerms.price
      }
    },
    entityContributionAnalysis: {
      terms: {
        field: entityGroupQueryField
      },
      aggs: {
        totalShipment: {
          cardinality: {
            field: "id"
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
            field: data.definition.fieldTerms.price
          }
        },
        totalUnitPrice: {
          sum: {
            field: data.definition.fieldTerms.price
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
            sort: sortStage,
            from: parseInt(data.offset),
            size: parseInt(data.limit)
          }
        }
      }
    }
  };

  let aggregationExpression = {
    size: 0,
    query: queryClause,
    aggs: contributionAnalysisStage
  };
  //console.log(JSON.stringify(aggregationExpression));

  return aggregationExpression;
};


const constructTradeFactorsDifferentialContributionAggregationResult = (data) => {
  let intelligentizedData = null;
  let grossContributionReference = data.grossContributionAnalysis[0];
  let entityContributionList = [];
  if (data != null) {

    data.entityContributionAnalysis.forEach(entityContribution => {
      let entityContributionPacket = {};
      entityContributionPacket.entity = entityContribution._id;
      entityContributionPacket.price = {
        value: parseFloat(entityContribution.totalPrice).toFixed(2),
        percentile: parseFloat(entityContribution.totalPrice / grossContributionReference.totalPrice * 100).toFixed(2)
      };
      entityContributionPacket.unitPrice = {
        value: parseFloat(entityContribution.totalUnitPrice).toFixed(2),
        percentile: parseFloat(entityContribution.totalUnitPrice / grossContributionReference.totalUnitPrice * 100).toFixed(2)
      };
      entityContributionPacket.averageUnitPrice = {
        value: parseFloat(entityContribution.averageUnitPrice).toFixed(2),
        percentile: 0
      };
      entityContributionPacket.quantity = {
        value: parseFloat(entityContribution.totalQuantity).toFixed(2),
        percentile: parseFloat(entityContribution.totalQuantity / grossContributionReference.totalQuantity * 100).toFixed(2)
      };
      entityContributionPacket.shipment = {
        value: parseFloat(entityContribution.totalShipment).toFixed(2),
        percentile: parseFloat(entityContribution.totalShipment / grossContributionReference.totalShipment * 100).toFixed(2)
      };
      entityContributionPacket.duty = {
        value: parseFloat(entityContribution.totalDuty).toFixed(2),
        percentile: parseFloat(entityContribution.totalDuty / grossContributionReference.totalDuty * 100).toFixed(2)
      };
      entityContributionList.push(entityContributionPacket);
    });

    intelligentizedData = {
      dataPoints: entityContributionList,
    };
  }
  //console.log(JSON.stringify(intelligentizedData));
  return intelligentizedData;
};

const constructTradeFactorsDifferentialContributionAggregationResultEngine = (data) => {

  let intelligentizedData = null;

  let entityContributionList = [];
  if (data != null) {

    let grossContributionReference = {};

    grossContributionReference.totalQuantity = data.totalQuantity.value;
    grossContributionReference.totalShipment = data.totalShipment.value;
    grossContributionReference.totalPrice = data.totalPrice.value;
    grossContributionReference.totalUnitPrice = data.totalUnitPrice.value;
    grossContributionReference.totalDuty = data.totalDuty.value;
    grossContributionReference.averageUnitPrice = data.totalUnitPrice.value / data.totalShipment.value;

    let transformedContributionAnalysis = [];
    data.entityContributionAnalysis.buckets.forEach(bundleEntity => {
      let dataBundle = {
        _id: bundleEntity.key,
        totalShipments: bundleEntity.totalShipment.value,
        totalQuantity: bundleEntity.totalQuantity.value,
        totalPrice: bundleEntity.totalPrice.value,
        totalUnitPrice: bundleEntity.totalUnitPrice.value,
        totalDuty: bundleEntity.totalDuty.value,
        averageUnitPrice: bundleEntity.averageUnitPrice.value
      };
      transformedContributionAnalysis.push(dataBundle);
    });

    data.entityContributionAnalysis = transformedContributionAnalysis;

    data.entityContributionAnalysis.forEach(entityContribution => {
      let entityContributionPacket = {};
      entityContributionPacket.entity = entityContribution._id;
      entityContributionPacket.price = {
        value: parseFloat(entityContribution.totalPrice).toFixed(2),
        percentile: parseFloat(entityContribution.totalPrice / grossContributionReference.totalPrice * 100).toFixed(2)
      };
      entityContributionPacket.unitPrice = {
        value: parseFloat(entityContribution.totalUnitPrice).toFixed(2),
        percentile: parseFloat(entityContribution.totalUnitPrice / grossContributionReference.totalUnitPrice * 100).toFixed(2)
      };
      entityContributionPacket.averageUnitPrice = {
        value: parseFloat(entityContribution.averageUnitPrice).toFixed(2),
        percentile: 0
      };
      entityContributionPacket.quantity = {
        value: parseFloat(entityContribution.totalQuantity).toFixed(2),
        percentile: parseFloat(entityContribution.totalQuantity / grossContributionReference.totalQuantity * 100).toFixed(2)
      };
      entityContributionPacket.shipment = {
        value: parseFloat(entityContribution.totalShipment).toFixed(2),
        percentile: parseFloat(entityContribution.totalShipment / grossContributionReference.totalShipment * 100).toFixed(2)
      };
      entityContributionPacket.duty = {
        value: parseFloat(entityContribution.totalDuty).toFixed(2),
        percentile: parseFloat(entityContribution.totalDuty / grossContributionReference.totalDuty * 100).toFixed(2)
      };
      entityContributionList.push(entityContributionPacket);
    });

    intelligentizedData = {
      dataPoints: entityContributionList,
    };
  }
  //console.log(JSON.stringify(intelligentizedData));
  return intelligentizedData;
};


module.exports = {
  classifyAggregationPipelineFormulator,
  classifyAggregationResultFormulator
};
