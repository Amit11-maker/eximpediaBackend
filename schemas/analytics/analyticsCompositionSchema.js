const TAG = 'analyticsCompositionSchema';

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

const TRADE_PATTERN_TYPE_TREE = "TREE";
const TRADE_PATTERN_TYPE_PIVOT = "PIVOT";

const QUERY_GROUP_KEY_TOTAL_SHIPMENTS = "totalShipment";
const QUERY_GROUP_KEY_TOTAL_QUANTITY = "totalQuantity";
const QUERY_GROUP_KEY_TOTAL_PRICE = "totalPrice";
const QUERY_GROUP_KEY_TOTAL_UNIT_PRICE = "totalUnitPrice";
const QUERY_GROUP_KEY_TOTAL_DUTY = "totalDuty";
const QUERY_GROUP_KEY_AVERAGE_UNIT_PRICE = "averageUnitPrice";


const classifyAggregationPipelineFormulator = (data) => {
  switch (data.specification.pattern) {
    case TRADE_PATTERN_TYPE_TREE: {
      return formulateTradeEntitiesFactorsTreeCompositionAggregationPipelineEngine(data);
    }
    case TRADE_PATTERN_TYPE_PIVOT: {
      return null;
    }
    default: {
      break;
    }
  }
};

const classifyAggregationResultFormulator = (data) => {
  switch (data.specification.pattern) {
    case TRADE_PATTERN_TYPE_TREE: {
      return constructTradeEntitiesFactorsTreeCompositionAggregationResultEngine(data);
    }
    case TRADE_PATTERN_TYPE_PIVOT: {
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


const formulateTradeEntitiesFactorsTreeCompositionAggregationPipeline = (data) => {

  let matchClause = formulateMatchAggregationStage(data);

  let compositionAnalysisStages = [];

  let primaryEntityGroupQueryField = mapQueryFieldTerms(data.specification.entity.primary, data.definition);
  let secondaryEntityGroupQueryField = mapQueryFieldTerms(data.specification.entity.secondary, data.definition);
  let tertiaryEntityGroupQueryField = mapQueryFieldTerms(data.specification.entity.tertiary, data.definition);
  let quarternaryEntityGroupQueryField = mapQueryFieldTerms(data.specification.entity.quarternary, data.definition);





  let quarternaryEntityFactorsGroupingStage = {
    $group: {
      _id: {
        primary: "$" + primaryEntityGroupQueryField,
        secondary: "$" + secondaryEntityGroupQueryField,
        tertiary: "$" + tertiaryEntityGroupQueryField,
        quarternary: "$" + quarternaryEntityGroupQueryField
      },
      totalShipment: {
        $sum: 1
      },
      totalQuantity: {
        $sum: "$" + data.definition.fieldTerms.quantity
      },
      totalPrice: {
        $sum: "$" + data.definition.fieldTerms.price
      },
      totalUnitPrice: {
        $sum: "$" + data.definition.fieldTerms.unit_price
      },
      totalDuty: {
        $sum: "$" + data.definition.fieldTerms.duty
      }
    }
  };
  compositionAnalysisStages.push(quarternaryEntityFactorsGroupingStage);

  let quarternaryEntityFactorsGroupedProjectionStage = {
    $project: {
      _id: 1,
      composedFactors: {
        totalShipment: {
          $toString: "$totalShipment"
        },
        totalQuantity: {
          $toString: "$totalQuantity"
        },
        totalPrice: {
          $toString: "$totalPrice"
        },
        totalDuty: {
          $toString: "$totalDuty"
        },
        totalUnitPrice: {
          $toString: "$totalUnitPrice"
        },
        averageUnitPrice: {
          $toString: {
            $divide: ["$totalUnitPrice", "$totalShipment"]
          }
        }
      }
    }
  };
  compositionAnalysisStages.push(quarternaryEntityFactorsGroupedProjectionStage);


  let tertiaryEntityFactorsGroupingStage = {
    $group: {
      _id: {
        primary: "$_id.primary",
        secondary: "$_id.secondary",
        tertiary: "$_id.tertiary",
      },
      totalShipment: {
        $sum: {
          $toDecimal: "$composedFactors.totalShipment"
        }
      },
      totalQuantity: {
        $sum: {
          $toDecimal: "$composedFactors.totalQuantity"
        }
      },
      totalPrice: {
        $sum: {
          $toDecimal: "$composedFactors.totalPrice"
        }
      },
      totalUnitPrice: {
        $sum: {
          $toDecimal: "$composedFactors.totalUnitPrice"
        }
      },
      totalDuty: {
        $sum: {
          $toDecimal: "$composedFactors.totalDuty"
        }
      },
      children: {
        $push: {
          entity: "$_id.quarternary",
          level: "level_4",
          composedFactors: "$composedFactors"
        }
      }
    }
  };
  compositionAnalysisStages.push(tertiaryEntityFactorsGroupingStage);

  let tertiaryEntityFactorsGroupedProjectionStage = {
    $project: {
      _id: 1,
      composedFactors: {
        totalShipment: {
          $toString: "$totalShipment"
        },
        totalQuantity: {
          $toString: "$totalQuantity"
        },
        totalPrice: {
          $toString: "$totalPrice"
        },
        totalDuty: {
          $toString: "$totalDuty"
        },
        totalUnitPrice: {
          $toString: "$totalUnitPrice"
        },
        averageUnitPrice: {
          $toString: {
            $divide: ["$totalUnitPrice", "$totalShipment"]
          }
        }
      },
      children: 1
    }
  };
  compositionAnalysisStages.push(tertiaryEntityFactorsGroupedProjectionStage);


  let secondaryEntityFactorsGroupingStage = {
    $group: {
      _id: {
        primary: "$_id.primary",
        secondary: "$_id.secondary"
      },
      totalShipment: {
        $sum: {
          $toDecimal: "$composedFactors.totalShipment"
        }
      },
      totalQuantity: {
        $sum: {
          $toDecimal: "$composedFactors.totalQuantity"
        }
      },
      totalPrice: {
        $sum: {
          $toDecimal: "$composedFactors.totalPrice"
        }
      },
      totalUnitPrice: {
        $sum: {
          $toDecimal: "$composedFactors.totalUnitPrice"
        }
      },
      totalDuty: {
        $sum: {
          $toDecimal: "$composedFactors.totalDuty"
        }
      },
      children: {
        $push: {
          entity: "$_id.tertiary",
          level: "level_3",
          composedFactors: "$composedFactors",
          children: "$children"
        }
      }
    }
  };
  compositionAnalysisStages.push(secondaryEntityFactorsGroupingStage);

  let secondaryEntityFactorsGroupedProjectionStage = {
    $project: {
      _id: 1,
      composedFactors: {
        totalShipment: {
          $toString: "$totalShipment"
        },
        totalQuantity: {
          $toString: "$totalQuantity"
        },
        totalPrice: {
          $toString: "$totalPrice"
        },
        totalDuty: {
          $toString: "$totalDuty"
        },
        totalUnitPrice: {
          $toString: "$totalUnitPrice"
        },
        averageUnitPrice: {
          $toString: {
            $divide: ["$totalUnitPrice", "$totalShipment"]
          }
        }
      },
      children: 1
    }
  };
  compositionAnalysisStages.push(secondaryEntityFactorsGroupedProjectionStage);


  let primaryEntityFactorsGroupingStage = {
    $group: {
      _id: {
        primary: "$_id.primary"
      },
      totalShipment: {
        $sum: {
          $toDecimal: "$composedFactors.totalShipment"
        }
      },
      totalQuantity: {
        $sum: {
          $toDecimal: "$composedFactors.totalQuantity"
        }
      },
      totalPrice: {
        $sum: {
          $toDecimal: "$composedFactors.totalPrice"
        }
      },
      totalUnitPrice: {
        $sum: {
          $toDecimal: "$composedFactors.totalUnitPrice"
        }
      },
      totalDuty: {
        $sum: {
          $toDecimal: "$composedFactors.totalDuty"
        }
      },
      children: {
        $push: {
          entity: "$_id.secondary",
          level: "level_2",
          composedFactors: "$composedFactors",
          children: "$children"
        }
      }
    }
  };
  compositionAnalysisStages.push(primaryEntityFactorsGroupingStage);

  let primaryEntityFactorsGroupedProjectionStage = {
    $project: {
      _id: 1,
      composedFactors: {
        totalShipment: {
          $toString: "$totalShipment"
        },
        totalQuantity: {
          $toString: "$totalQuantity"
        },
        totalPrice: {
          $toString: "$totalPrice"
        },
        totalDuty: {
          $toString: "$totalDuty"
        },
        totalUnitPrice: {
          $toString: "$totalUnitPrice"
        },
        averageUnitPrice: {
          $toString: {
            $divide: ["$totalUnitPrice", "$totalShipment"]
          }
        }
      },
      children: 1
    }
  };
  compositionAnalysisStages.push(primaryEntityFactorsGroupedProjectionStage);


  let factorSortGroupQueryField = mapQueryFieldGroupKeys(data.specification.factorSort);
  let recordIntermediaryTimeSort = {
    $sort: {}
  };
  recordIntermediaryTimeSort.$sort["composedFactors." + factorSortGroupQueryField] = ((data.definition.order === RESULT_ORDER_TYPE_TOP) ? ORDER_DESCENDING : ORDER_ASCENDING);
  compositionAnalysisStages.push(recordIntermediaryTimeSort);

  let resultSkipStage = {
    $skip: parseInt(data.offset)
  };
  compositionAnalysisStages.push(resultSkipStage);

  let resultLimitStage = {
    $limit: parseInt(data.limit)
  };
  compositionAnalysisStages.push(resultLimitStage);


  let aggregationExpression = [{
    $match: matchClause
  },
  {
    $facet: {
      entityCompositionAnalysis: compositionAnalysisStages
    }
  }
  ];



  return aggregationExpression;
};

const formulateTradeEntitiesFactorsTreeCompositionAggregationPipelineEngine = (data) => {

  let queryClause = formulateMatchAggregationStageEngine(data);

  let primaryEntityGroupQueryField = mapQueryFieldTermsEngine(data.specification.entity.primary, data.definition);
  let secondaryEntityGroupQueryField = mapQueryFieldTermsEngine(data.specification.entity.secondary, data.definition);
  let tertiaryEntityGroupQueryField = mapQueryFieldTermsEngine(data.specification.entity.tertiary, data.definition);
  let quarternaryEntityGroupQueryField = mapQueryFieldTermsEngine(data.specification.entity.quarternary, data.definition);





  let sortStage = [];
  let sortTerm = {};
  let factorSortGroupQueryField = mapQueryFieldGroupKeys(data.specification.factorSort);
  sortTerm[factorSortGroupQueryField] = {
    order: ((data.definition.order === RESULT_ORDER_TYPE_TOP) ? ORDER_TERM_DESCENDING : ORDER_TERM_ASCENDING)
  };
  sortStage.push(sortTerm);

  let compositionAnalysisStage = {
    primaryEntityCompositionAnalysis: {
      terms: {
        field: primaryEntityGroupQueryField
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
            sort: sortStage,
            from: parseInt(data.offset),
            size: parseInt(data.limit)
          }
        },
        secondaryEntityCompositionAnalysis: {
          terms: {
            field: secondaryEntityGroupQueryField
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
            tertiaryEntityCompositionAnalysis: {
              terms: {
                field: tertiaryEntityGroupQueryField
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
                quarternaryEntityCompositionAnalysis: {
                  terms: {
                    field: quarternaryEntityGroupQueryField
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
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  let aggregationExpression = {
    size: 0,
    query: queryClause,
    aggs: compositionAnalysisStage
  };
  //

  return aggregationExpression;

};


const constructTradeEntitiesFactorsTreeCompositionAggregationResult = (data) => {
  let intelligentizedData = null;
  let entityCompositionList = [];



  if (data != null) {

    data.entityCompositionAnalysis.forEach(entityComposition => {
      let entityCompositionPacket = {};
      //entityCompositionPacket.id = ObjectID();
      entityCompositionPacket.entity = entityComposition._id.primary;
      entityCompositionPacket.level = "level_1";
      entityCompositionPacket.composedFactors = entityComposition.composedFactors;
      entityCompositionPacket.children = JSON.parse(JSON.stringify(entityComposition.children));
      entityCompositionList.push(entityCompositionPacket);
    });

    intelligentizedData = {
      dataPoints: entityCompositionList,
    };
  }
  //
  return intelligentizedData;
};

const constructTradeEntitiesFactorsTreeCompositionAggregationResultEngine = (data) => {
  let intelligentizedData = null;
  let entityCompositionList = [];

  //

  if (data != null) {

    let transformedCompositionAnalysis = [];

    data.primaryEntityCompositionAnalysis.buckets.forEach(bundlePrimary => {

      let primaryChildren = [];

      let composedPrimaryFactors = {
        id: bundlePrimary.key,
        totalShipments: bundlePrimary.totalShipment.value,
        totalQuantity: bundlePrimary.totalQuantity.value,
        totalPrice: bundlePrimary.totalPrice.value,
        totalUnitPrice: bundlePrimary.totalUnitPrice.value,
        averageUnitPrice: bundlePrimary.averageUnitPrice.value,
        totalDuty: bundlePrimary.totalDuty.value
      };

      bundlePrimary.secondaryEntityCompositionAnalysis.buckets.forEach(bundleSecondary => {

        let secondaryChildren = [];

        let composedSecondaryFactors = {
          id: bundleSecondary.key,
          totalShipments: bundleSecondary.totalShipment.value,
          totalQuantity: bundleSecondary.totalQuantity.value,
          totalPrice: bundleSecondary.totalPrice.value,
          totalUnitPrice: bundleSecondary.totalUnitPrice.value,
          averageUnitPrice: bundleSecondary.averageUnitPrice.value,
          totalDuty: bundleSecondary.totalDuty.value
        };

        bundleSecondary.tertiaryEntityCompositionAnalysis.buckets.forEach(bundleTertiary => {

          let tertiaryChildren = [];

          let composedTertiaryFactors = {
            totalShipments: bundleTertiary.totalShipment.value,
            totalQuantity: bundleTertiary.totalQuantity.value,
            totalPrice: bundleTertiary.totalPrice.value,
            totalUnitPrice: bundleTertiary.totalUnitPrice.value,
            averageUnitPrice: bundleTertiary.averageUnitPrice.value,
            totalDuty: bundleTertiary.totalDuty.value
          };

          bundleTertiary.quarternaryEntityCompositionAnalysis.buckets.forEach(bundleQuartenary => {

            let composedQuarternaryFactors = {
              totalShipment: bundleQuartenary.totalShipment.value,
              totalQuantity: bundleQuartenary.totalQuantity.value,
              totalPrice: bundleQuartenary.totalPrice.value,
              totalUnitPrice: bundleQuartenary.totalUnitPrice.value,
              averageUnitPrice: bundleQuartenary.averageUnitPrice.value,
              totalDuty: bundleQuartenary.totalDuty.value
            };

            tertiaryChildren.push({
              entity: bundleQuartenary.key,
              level: "level_4",
              composedFactors: composedQuarternaryFactors
            });

          });

          secondaryChildren.push({
            entity: bundleTertiary.key,
            level: "level_3",
            composedFactors: composedTertiaryFactors,
            children: tertiaryChildren
          });

        });

        primaryChildren.push({
          entity: bundleSecondary.key,
          level: "level_2",
          composedFactors: composedSecondaryFactors,
          children: secondaryChildren
        });

      });

      transformedCompositionAnalysis.push({
        _id: {
          primary: bundlePrimary.key
        },
        composedFactors: composedPrimaryFactors,
        children: primaryChildren
      });

    });

    data.entityCompositionAnalysis = transformedCompositionAnalysis;


    data.entityCompositionAnalysis.forEach(entityComposition => {
      let entityCompositionPacket = {};
      //entityCompositionPacket.id = ObjectID();
      entityCompositionPacket.entity = entityComposition._id.primary;
      entityCompositionPacket.level = "level_1";
      entityCompositionPacket.composedFactors = entityComposition.composedFactors;
      entityCompositionPacket.children = JSON.parse(JSON.stringify(entityComposition.children));
      entityCompositionList.push(entityCompositionPacket);
    });

    intelligentizedData = {
      dataPoints: entityCompositionList,
    };
  }
  //
  return intelligentizedData;
};


module.exports = {
  classifyAggregationPipelineFormulator,
  classifyAggregationResultFormulator
};
