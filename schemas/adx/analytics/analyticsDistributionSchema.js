// @ts-check
const TAG = 'analyticsDistributionSchema';

const MongoDbQueryBuilderHelper = require('./../../../helpers/mongoDbQueryBuilderHelper');
const ElasticsearchDbQueryBuilderHelper = require('./../../../helpers/elasticsearchDbQueryBuilderHelper');
const TradeModel = require("../../../models/tradeModel")
const MongoDbHandler = require("../../../db/mongoDbHandler")
const { ObjectId } = require("mongodb")

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
const TRADE_FACTOR_TYPE_AVERAGE_UNIT_PRICE = "AVERAGE_UNIT_PRICE";
const TRADE_FACTOR_TYPE_SHIPMENT = "SHIPMENT";
const TRADE_FACTOR_TYPE_DUTY = "DUTY";


const classifyAggregationPipelineFormulator = (data) => {
  switch (data.specification.factor) {
    case TRADE_FACTOR_TYPE_QUANTITY: {
      return formulateEntitiesQuantityDistributionAggregationPipelineEngine(data);
    }
    case TRADE_FACTOR_TYPE_PRICE: {
      return formulateEntitiesPriceDistributionAggregationPipelineEngine(data);
    }
    case TRADE_FACTOR_TYPE_AVERAGE_UNIT_PRICE: {
      return null;
    }
    default: {
      break;
    }
  }
};

const classifyAggregationResultFormulator = (data) => {
  switch (data.specification.factor) {
    case TRADE_FACTOR_TYPE_QUANTITY: {
      return constructEntitiesByQuantityDistributionAggregationResultEngine(data);
    }
    case TRADE_FACTOR_TYPE_PRICE: {
      return constructEntitiesByPriceDistributionAggregationResultEngine(data);
    }
    case TRADE_FACTOR_TYPE_AVERAGE_UNIT_PRICE: {
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

  let kqlQuery = TradeModel.formulateAdxRawSearchRecordsQueries({ ...data, country: "India", tradeType: "Export" })

  return (queryClause.bool.must != 0) ? { ...queryClause, kqlQuery: kqlQuery } : {};

};


const mapQueryFieldTerms = (term, fieldDefinitions) => {
  let queryField = null;
  switch (term) {
    case TRADE_ENTITY_TYPE_COUNTRY: {
      queryField = fieldDefinitions.fieldTerms.country;
      break;
    }
    case TRADE_ENTITY_TYPE_PORT: {
      queryField = fieldDefinitions.fieldTerms.port;
      break;
    }
    case TRADE_ENTITY_TYPE_HSCODE: {
      queryField = fieldDefinitions.fieldTerms.hs_code;
      break;
    }
    case TRADE_ENTITY_TYPE_IMPORTER: {
      queryField = fieldDefinitions.fieldTerms.importer;
      break;
    }
    case TRADE_ENTITY_TYPE_EXPORTER: {
      queryField = fieldDefinitions.fieldTerms.exporter;
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
    case TRADE_ENTITY_TYPE_COUNTRY: {
      queryField = fieldDefinitions.fieldTerms.country;
      break;
    }
    case TRADE_ENTITY_TYPE_PORT: {
      queryField = fieldDefinitions.fieldTerms.port;
      break;
    }
    case TRADE_ENTITY_TYPE_HSCODE: {
      queryField = fieldDefinitions.fieldTerms.hs_code;
      break;
    }
    case TRADE_ENTITY_TYPE_IMPORTER: {
      queryField = fieldDefinitions.fieldTerms.importer;
      break;
    }
    case TRADE_ENTITY_TYPE_EXPORTER: {
      queryField = fieldDefinitions.fieldTerms.exporter;
      break;
    }
    default: {
      break;
    }
  }
  return queryField;
};


const formulateEntitiesQuantityDistributionAggregationPipeline = (data) => {

  let matchClause = formulateMatchAggregationStage(data);

  let distributionAnalysisStages = [];

  let entityGroupQueryField = mapQueryFieldTerms(data.specification.entity, data.definition);


  let entityGroupingStage = {
    $group: {
      _id: "$" + entityGroupQueryField,
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
      }
    }
  };
  distributionAnalysisStages.push(entityGroupingStage);

  let entityGroupedProjectionStage = {
    $project: {
      _id: "$_id",
      totalShipment: "$totalShipment",
      totalQuantity: "$totalQuantity",
      totalPrice: "$totalPrice",
      totalUnitPrice: "$totalUnitPrice"
    }
  };
  distributionAnalysisStages.push(entityGroupedProjectionStage);

  let resultSortStage = {
    $sort: {
      "totalQuantity": ((data.definition.order === RESULT_ORDER_TYPE_TOP) ? ORDER_DESCENDING : ORDER_ASCENDING)
    }
  };
  distributionAnalysisStages.push(resultSortStage);

  let resultLimitStage = {
    $limit: parseInt(data.definition.limit)
  };
  distributionAnalysisStages.push(resultLimitStage);

  let aggregationExpression = [{
    $match: matchClause
  },
  {
    $facet: {
      distributionAnalysis: distributionAnalysisStages
    }
  }
  ];

  //

  return aggregationExpression;
};

const formulateEntitiesQuantityDistributionAggregationPipelineEngine = async (data) => {

  let workspaceId = new ObjectId("65153764f262dd104446df82")

  let baseQuery = await MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.workspace).findOne({ _id: workspaceId })


  let queryClause = formulateMatchAggregationStageEngine(data);

  let entityGroupQueryField = mapQueryFieldTermsEngine(data.specification.entity, data.definition);


  let sortStage = [];
  let sortTerm = {};
  sortTerm["totalQuantity"] = {
    order: ((data.definition.order === RESULT_ORDER_TYPE_TOP) ? ORDER_TERM_DESCENDING : ORDER_TERM_ASCENDING)
  };
  sortStage.push(sortTerm);


  let kqlBaseQueryVariable = " baseQuery "

  const sortingOrder = (data.definition.order === RESULT_ORDER_TYPE_TOP) ? ORDER_TERM_DESCENDING : ORDER_TERM_ASCENDING

  const fieldTerm = entityGroupQueryField?.split(".")?.[0]
  const quantityTerm = data.definition.fieldTerms.quantity?.split(".")?.[0]
  const priceTerm = data.definition.fieldTerms.price?.split(".")?.[0]

  let kqlQueryClause = `let ${kqlBaseQueryVariable} = ${baseQuery?.workspace_queries?.[0]?.query} | distinct ${fieldTerm}, DECLARATION_NO, ${quantityTerm}, ${priceTerm}; `
  kqlQueryClause = `set query_results_cache_max_age = time("30min");` + kqlQueryClause;

  let aggregationUnion = [];

  let TOTAL_SHIPMENTS = ` let totalShipments = ${kqlBaseQueryVariable} | summarize totalShipments = count_distinct(DECLARATION_NO) by ${fieldTerm};`
  aggregationUnion.push("totalShipments")
  let TOTAL_QUANTITY = ` let totalQuantity = ${kqlBaseQueryVariable} | summarize totalQuantity = sum(${quantityTerm}) by ${fieldTerm};`
  aggregationUnion.push("totalQuantity")
  let TOTAL_PRICE = ` let totalPrice = ${kqlBaseQueryVariable} | summarize totalPrice = count_distinct(${priceTerm}) by ${fieldTerm};`
  aggregationUnion.push("totalPrice")
  let TOTAL_UNIT_PRICE = ` | extend totalUnitPrice = totalPrice / totalQuantity `

  kqlQueryClause += TOTAL_SHIPMENTS + TOTAL_QUANTITY + TOTAL_PRICE;
  kqlQueryClause += " union " + aggregationUnion.join(", ")
  kqlQueryClause += TOTAL_UNIT_PRICE;

  // query results filtration
  let filtration = `| order by totalQuantity ${sortingOrder} | take ${data.definition.limit ?? 3}`

  kqlQueryClause += filtration;

  let distributionAnalysisStage = {
    terms: {
      field: entityGroupQueryField
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
      distributionAnalysis: distributionAnalysisStage
    }
  };


  return { ...aggregationExpression, aggregationADX: kqlQueryClause };

};


const formulateEntitiesPriceDistributionAggregationPipeline = (data) => {

  let matchClause = formulateMatchAggregationStage(data);

  let distributionAnalysisStages = [];

  let entityGroupQueryField = mapQueryFieldTerms(data.specification.entity, data.definition);


  let entityGroupingStage = {
    $group: {
      _id: "$" + entityGroupQueryField,
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
      }
    }
  };
  distributionAnalysisStages.push(entityGroupingStage);

  let entityGroupedProjectionStage = {
    $project: {
      _id: "$_id",
      totalShipment: "$totalShipment",
      totalQuantity: "$totalQuantity",
      totalPrice: "$totalPrice",
      totalUnitPrice: "$totalUnitPrice"
    }
  };
  distributionAnalysisStages.push(entityGroupedProjectionStage);

  let resultSortStage = {
    $sort: {
      "totalPrice": ((data.definition.order === RESULT_ORDER_TYPE_TOP) ? ORDER_DESCENDING : ORDER_ASCENDING)
    }
  };
  distributionAnalysisStages.push(resultSortStage);

  let resultLimitStage = {
    $limit: parseInt(data.definition.limit)
  };
  distributionAnalysisStages.push(resultLimitStage);

  let aggregationExpression = [{
    $match: matchClause
  },
  {
    $facet: {
      distributionAnalysis: distributionAnalysisStages
    }
  }
  ];

  //

  return aggregationExpression;
};

const formulateEntitiesPriceDistributionAggregationPipelineEngine = async (data) => {

  let workspaceId = new ObjectId("65153764f262dd104446df82")

  let baseQuery = await MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.workspace).findOne({ _id: workspaceId })


  let queryClause = formulateMatchAggregationStageEngine(data);

  let entityGroupQueryField = mapQueryFieldTermsEngine(data.specification.entity, data.definition);


  let sortStage = [];
  let sortTerm = {};
  sortTerm["totalPrice"] = {
    order: ((data.definition.order === RESULT_ORDER_TYPE_TOP) ? ORDER_TERM_DESCENDING : ORDER_TERM_ASCENDING)
  };
  sortStage.push(sortTerm);


  let kqlBaseQueryVariable = " baseQuery "

  const sortingOrder = (data.definition.order === RESULT_ORDER_TYPE_TOP) ? ORDER_TERM_DESCENDING : ORDER_TERM_ASCENDING

  const fieldTerm = entityGroupQueryField?.split(".")?.[0]
  const quantityTerm = data.definition.fieldTerms.quantity?.split(".")?.[0]
  const priceTerm = data.definition.fieldTerms.price?.split(".")?.[0]


  let kqlQueryClause = `let ${kqlBaseQueryVariable} = ${baseQuery.workspace_queries?.[0]?.query};`
  kqlQueryClause = `set query_results_cache_max_age = time("30min");` + kqlQueryClause;

  let aggregationUnion = [];

  let TOTAL_SHIPMENTS = ` let totalShipments = ${kqlBaseQueryVariable} | summarize totalShipments = count_distinct(DECLARATION_NO) by ${fieldTerm};`
  aggregationUnion.push("totalShipments")
  let TOTAL_QUANTITY = ` let totalQuantity = ${kqlBaseQueryVariable} | summarize totalQuantity = sum(${quantityTerm}) by ${fieldTerm};`
  aggregationUnion.push("totalQuantity")
  let TOTAL_PRICE = ` let totalPrice = ${kqlBaseQueryVariable} | summarize totalPrice = count_distinct(${priceTerm}) by ${fieldTerm};`
  aggregationUnion.push("totalPrice")
  let TOTAL_UNIT_PRICE = ` | extend totalUnitPrice = totalPrice / totalQuantity `

  kqlQueryClause += TOTAL_SHIPMENTS + TOTAL_QUANTITY + TOTAL_PRICE;
  kqlQueryClause += " union " + aggregationUnion.join(", ")
  kqlQueryClause += TOTAL_UNIT_PRICE;

  // query results filtration
  let filtration = `| order by totalQuantity ${sortingOrder} | take ${data.definition.limit ?? 3}`

  kqlQueryClause += filtration;

  let distributionAnalysisStage = {
    terms: {
      field: entityGroupQueryField
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
      distributionAnalysis: distributionAnalysisStage
    }
  };
  //

  return { ...aggregationExpression, aggregationADX: kqlQueryClause };
};


const constructEntitiesByQuantityDistributionAggregationResult = (data) => {
  let intelligentizedData = null;
  let entityList = [];
  if (data != null) {
    //
    data.distributionAnalysis.forEach(bundle => {
      entityList.push({
        "name": bundle._id,
        "total_shipment": Number(bundle.totalShipment),
        "y": Number(bundle.totalQuantity),
        "total_price": Number(bundle.totalPrice),
        "total_unit_price": Number(bundle.totalUnitPrice)
      });
    });

    intelligentizedData = {
      entityPlotPoints: entityList
    };
  }
  //
  return intelligentizedData;
};

const constructEntitiesByQuantityDistributionAggregationResultEngine = (data) => {
  let intelligentizedData = null;
  let entityList = [];

  if (data != null) {

    let transformedDistributionAnalysis = [];
    data.distributionAnalysis?.buckets.forEach(bundleCountry => {
      let dataBundle = {
        _id: bundleCountry.key,
        totalShipments: bundleCountry.totalShipments.value,
        totalQuantity: bundleCountry.totalQuantity.value,
        totalPrice: bundleCountry.totalPrice.value,
        totalUnitPrice: bundleCountry.totalUnitPrice.value,
        totalDuty: bundleCountry?.totalDuty?.value
      };
      transformedDistributionAnalysis.push(dataBundle);
    });

    data.distributionAnalysis = transformedDistributionAnalysis;


    //
    data.distributionAnalysis.forEach(bundle => {
      entityList.push({
        "name": bundle._id,
        "total_shipment": Number(bundle.totalShipment),
        "y": Number(bundle.totalQuantity),
        "total_price": Number(bundle.totalPrice),
        "total_unit_price": Number(bundle.totalUnitPrice)
      });
    });

    intelligentizedData = {
      entityPlotPoints: entityList
    };
  }
  //
  return intelligentizedData;
};


const constructEntitiesByPriceDistributionAggregationResult = (data) => {
  let intelligentizedData = null;
  let entityList = [];
  if (data != null) {

    data.distributionAnalysis.forEach(bundle => {
      entityList.push({
        "name": bundle._id,
        "total_shipment": Number(bundle.totalShipment),
        "total_quantity": Number(bundle.totalQuantity),
        "y": Number(bundle.totalPrice),
        "total_unit_price": Number(bundle.totalUnitPrice)
      });
    });

    intelligentizedData = {
      entityPlotPoints: entityList
    };
  }
  //
  return intelligentizedData;
};

const constructEntitiesByPriceDistributionAggregationResultEngine = (data) => {
  let intelligentizedData = null;
  let entityList = [];
  if (data != null) {

    let transformedDistributionAnalysis = [];
    data.distributionAnalysis.buckets.forEach(bundleCountry => {
      let dataBundle = {
        _id: bundleCountry.key,
        totalShipments: bundleCountry.totalShipments.value,
        totalQuantity: bundleCountry.totalQuantity.value,
        totalPrice: bundleCountry.totalPrice.value,
        totalUnitPrice: bundleCountry.totalUnitPrice.value,
        totalDuty: bundleCountry?.totalDuty?.value
      };
      transformedDistributionAnalysis.push(dataBundle);
    });

    data.distributionAnalysis = transformedDistributionAnalysis;


    data.distributionAnalysis.forEach(bundle => {
      entityList.push({
        "name": bundle._id,
        "total_shipment": Number(bundle.totalShipment),
        "total_quantity": Number(bundle.totalQuantity),
        "y": Number(bundle.totalPrice),
        "total_unit_price": Number(bundle.totalUnitPrice)
      });
    });

    intelligentizedData = {
      entityPlotPoints: entityList
    };
  }
  //
  return intelligentizedData;
};


module.exports = {
  classifyAggregationPipelineFormulator,
  classifyAggregationResultFormulator
};
