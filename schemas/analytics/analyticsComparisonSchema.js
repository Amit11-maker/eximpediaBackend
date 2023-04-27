const TAG = 'analyticsComparisonSchema';

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
const TRADE_FACTOR_TYPE_AVERAGE_UNIT_PRICE = "AVERAGE_UNIT_PRICE";
const TRADE_FACTOR_TYPE_SHIPMENT = "SHIPMENT";
const TRADE_FACTOR_TYPE_DUTY = "DUTY";


const classifyAggregationPipelineFormulator = (data) => {
  switch (data.specification.factor) {
    case TRADE_FACTOR_TYPE_QUANTITY: {
      return formulateEntitiesQuantityComparisonAggregationPipelineEngine(data);
    }
    case TRADE_FACTOR_TYPE_PRICE: {
      return formulateEntitiesPriceComparisonAggregationPipelineEngine(data);
    }
    case TRADE_FACTOR_TYPE_AVERAGE_UNIT_PRICE: {
      return formulateEntitiesAverageUnitPriceComparisonAggregationPipelineEngine(data);
    }
    default: {
      break;
    }
  }
};

const classifyAggregationResultFormulator = (data) => {
  switch (data.specification.factor) {
    case TRADE_FACTOR_TYPE_QUANTITY: {
      return constructEntitiesByQuantityComparisonAggregationResultEngine(data);
    }
    case TRADE_FACTOR_TYPE_PRICE: {
      return constructEntitiesByPriceComparisonAggregationResultEngine(data);
    }
    case TRADE_FACTOR_TYPE_AVERAGE_UNIT_PRICE: {
      return constructEntitiesByAverageUnitPriceComparisonAggregationResultEngine(data);
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


const formulateEntitiesQuantityComparisonAggregationPipeline = (data) => {

  let matchClause = formulateMatchAggregationStage(data);

  let comparisonAnalysisStages = [];
  let interpretedDateTerm = null;

  let entityGroupQueryField = mapQueryFieldTerms(data.specification.entity, data.definition);


  if (MUST_INTERPRET_CUSTOM_SOURCE_DATA_FORMATTING) {
    interpretedDateTerm = QUERY_FIELD_TERM_TRADE_DATE;
    let additionalProjectionExpressions = {};
    additionalProjectionExpressions[entityGroupQueryField] = 1;
    additionalProjectionExpressions[data.definition.fieldTerms.unit_price] = 1;
    additionalProjectionExpressions[data.definition.fieldTerms.quantity] = 1;
    additionalProjectionExpressions[data.definition.fieldTerms.price] = 1;
    comparisonAnalysisStages = SourceDateManipulatorUtil.formulateSourceDateManipulationStages(data.definition.fieldTerms.date, additionalProjectionExpressions);
  } else {
    interpretedDateTerm = data.definition.fieldTerms.date;
  }

  let preSortDate = {};
  preSortDate[interpretedDateTerm] = ((data.definition.order === RESULT_ORDER_TYPE_TOP) ? ORDER_DESCENDING : ORDER_ASCENDING);
  comparisonAnalysisStages.push({
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
      }
    }
  };
  comparisonAnalysisStages.push(entityIntervalFactorsGroupingStage);


  let entityRecordIntermediaryTimeSort = {
    $sort: {
      "_id.year": 1,
      "_id.month": 1,
      "_id.week": 1
    }
  };
  comparisonAnalysisStages.push(entityRecordIntermediaryTimeSort);

  let entityIntervalCombinedGroupingStage = {
    $group: {
      _id: "$_id.entity",
      sortTotalQuantity: {
        $sum: "$totalQuantity"
      },
      plot: {
        $push: {
          year: "$_id.year",
          month: "$_id.month",
          week: "$_id.week",
          totalShipments: "$totalShipment",
          totalUnitPrice: "$totalUnitPrice",
          totalQuantity: "$totalQuantity",
          totalPrice: "$totalPrice"
        }
      }
    }
  };
  comparisonAnalysisStages.push(entityIntervalCombinedGroupingStage);

  let entityGroupedProjectionStage = {
    $project: {
      _id: 1,
      sortTotalQuantity: 1,
      plot: 1
    }
  };
  comparisonAnalysisStages.push(entityGroupedProjectionStage);

  let resultSortStage = {
    $sort: {
      "sortTotalQuantity": ((data.definition.order === RESULT_ORDER_TYPE_TOP) ? ORDER_DESCENDING : ORDER_ASCENDING)
    }
  };
  comparisonAnalysisStages.push(resultSortStage);

  let resultLimitStage = {
    $limit: parseInt(data.definition.limit)
  };
  comparisonAnalysisStages.push(resultLimitStage);

  let aggregationExpression = [{
    $match: matchClause
  },
  {
    $facet: {
      comparisonAnalysis: comparisonAnalysisStages
    }
  }
  ];

  //

  return aggregationExpression;
};

const formulateEntitiesQuantityComparisonAggregationPipelineEngine = (data) => {

  let queryClause = formulateMatchAggregationStageEngine(data);

  let interpretedDateTerm = data.definition.fieldTerms.date;

  let entityGroupQueryField = mapQueryFieldTermsEngine(data.specification.entity, data.definition);


  let sortStage = [];
  let sortDate = {};
  sortDate[interpretedDateTerm] = {
    order: ((data.definition.order === RESULT_ORDER_TYPE_TOP) ? ORDER_TERM_DESCENDING : ORDER_TERM_ASCENDING)
  };
  sortStage.push(sortDate);

  let comparisonAnalysisStage = {
    terms: {
      field: entityGroupQueryField
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
              }
            }
          }
        }
      },
      stats_bucket_sort: {
        bucket_sort: {
          from: 0,
          size: parseInt(data.definition.limit)

        }
      }
    }
  };

  let aggregationExpression = {
    size: 0,
    sort: sortStage,
    query: queryClause,
    aggs: {
      comparisonAnalysis: comparisonAnalysisStage
    }
  };

  //

  return aggregationExpression;

};


const formulateEntitiesPriceComparisonAggregationPipeline = (data) => {

  let matchClause = formulateMatchAggregationStage(data);

  let comparisonAnalysisStages = [];
  let interpretedDateTerm = null;

  let entityGroupQueryField = mapQueryFieldTerms(data.specification.entity, data.definition);


  if (MUST_INTERPRET_CUSTOM_SOURCE_DATA_FORMATTING) {
    interpretedDateTerm = QUERY_FIELD_TERM_TRADE_DATE;
    let additionalProjectionExpressions = {};
    additionalProjectionExpressions[entityGroupQueryField] = 1;
    additionalProjectionExpressions[data.definition.fieldTerms.unit_price] = 1;
    additionalProjectionExpressions[data.definition.fieldTerms.quantity] = 1;
    additionalProjectionExpressions[data.definition.fieldTerms.price] = 1;
    comparisonAnalysisStages = SourceDateManipulatorUtil.formulateSourceDateManipulationStages(data.definition.fieldTerms.date, additionalProjectionExpressions);
  } else {
    interpretedDateTerm = data.definition.fieldTerms.date;
  }

  let preSortDate = {};
  preSortDate[interpretedDateTerm] = ((data.definition.order === RESULT_ORDER_TYPE_TOP) ? ORDER_DESCENDING : ORDER_ASCENDING);
  comparisonAnalysisStages.push({
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
      }
    }
  };
  comparisonAnalysisStages.push(entityIntervalFactorsGroupingStage);


  let entityRecordIntermediaryTimeSort = {
    $sort: {
      "_id.year": 1,
      "_id.month": 1,
      "_id.week": 1
    }
  };
  comparisonAnalysisStages.push(entityRecordIntermediaryTimeSort);


  let entityIntervalCombinedGroupingStage = {
    $group: {
      _id: "$_id.entity",
      sortTotalPrice: {
        $sum: "$totalPrice"
      },
      plot: {
        $push: {
          year: "$_id.year",
          month: "$_id.month",
          week: "$_id.week",
          totalShipments: "$totalShipment",
          totalUnitPrice: "$totalUnitPrice",
          totalQuantity: "$totalQuantity",
          totalPrice: "$totalPrice"
        }
      }
    }
  };
  comparisonAnalysisStages.push(entityIntervalCombinedGroupingStage);

  let entityGroupedProjectionStage = {
    $project: {
      _id: 1,
      sortTotalPrice: 1,
      plot: 1
    }
  };
  comparisonAnalysisStages.push(entityGroupedProjectionStage);

  let resultSortStage = {
    $sort: {
      "totalPrice": ((data.definition.order === RESULT_ORDER_TYPE_TOP) ? ORDER_DESCENDING : ORDER_ASCENDING)
    }
  };
  comparisonAnalysisStages.push(resultSortStage);

  let resultLimitStage = {
    $limit: parseInt(data.definition.limit)
  };
  comparisonAnalysisStages.push(resultLimitStage);

  let aggregationExpression = [{
    $match: matchClause
  },
  {
    $facet: {
      comparisonAnalysis: comparisonAnalysisStages
    }
  }
  ];

  //

  return aggregationExpression;
};


const formulateEntitiesPriceComparisonAggregationPipelineEngine = (data) => {

  let queryClause = formulateMatchAggregationStageEngine(data);

  let interpretedDateTerm = data.definition.fieldTerms.date;

  let entityGroupQueryField = mapQueryFieldTermsEngine(data.specification.entity, data.definition);


  let sortStage = [];
  let sortDate = {};
  sortDate[interpretedDateTerm] = {
    order: ((data.definition.order === RESULT_ORDER_TYPE_TOP) ? ORDER_TERM_DESCENDING : ORDER_TERM_ASCENDING)
  };
  sortStage.push(sortDate);

  let comparisonAnalysisStage = {
    terms: {
      field: entityGroupQueryField
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
              }
            }
          }
        }
      },
      stats_bucket_sort: {
        bucket_sort: {
          from: 0,
          size: parseInt(data.definition.limit)

        }
      }
    }
  };

  let aggregationExpression = {
    size: 0,
    sort: sortStage,
    query: queryClause,
    aggs: {
      comparisonAnalysis: comparisonAnalysisStage
    }
  };

  //

  return aggregationExpression;
};


const formulateEntitiesAverageUnitPriceComparisonAggregationPipeline = (data) => {

  let matchClause = formulateMatchAggregationStage(data);

  let comparisonAnalysisStages = [];
  let interpretedDateTerm = null;

  let entityGroupQueryField = mapQueryFieldTerms(data.specification.entity, data.definition);


  if (MUST_INTERPRET_CUSTOM_SOURCE_DATA_FORMATTING) {
    interpretedDateTerm = QUERY_FIELD_TERM_TRADE_DATE;
    let additionalProjectionExpressions = {};
    additionalProjectionExpressions[entityGroupQueryField] = 1;
    additionalProjectionExpressions[data.definition.fieldTerms.unit_price] = 1;
    additionalProjectionExpressions[data.definition.fieldTerms.quantity] = 1;
    additionalProjectionExpressions[data.definition.fieldTerms.price] = 1;
    comparisonAnalysisStages = SourceDateManipulatorUtil.formulateSourceDateManipulationStages(data.definition.fieldTerms.date, additionalProjectionExpressions);
  } else {
    interpretedDateTerm = data.definition.fieldTerms.date;
  }

  let preSortDate = {};
  preSortDate[interpretedDateTerm] = ((data.definition.order === RESULT_ORDER_TYPE_TOP) ? ORDER_DESCENDING : ORDER_ASCENDING);
  comparisonAnalysisStages.push({
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
      }
    }
  };
  comparisonAnalysisStages.push(entityIntervalFactorsGroupingStage);


  let entityRecordIntermediaryTimeSort = {
    $sort: {
      "_id.year": 1,
      "_id.month": 1,
      "_id.week": 1
    }
  };
  comparisonAnalysisStages.push(entityRecordIntermediaryTimeSort);


  let entityIntervalCombinedGroupingStage = {
    $group: {
      _id: "$_id.entity",
      sortTotalUnitPrice: {
        $sum: "$totalUnitPrice"
      },
      sortTotalShipment: {
        $sum: "$totalShipment"
      },
      plot: {
        $push: {
          year: "$_id.year",
          month: "$_id.month",
          week: "$_id.week",
          totalShipments: "$totalShipment",
          totalUnitPrice: "$totalUnitPrice",
          totalQuantity: "$totalQuantity",
          totalPrice: "$totalPrice"
        }
      }
    }
  };
  comparisonAnalysisStages.push(entityIntervalCombinedGroupingStage);

  let entityGroupedProjectionStage = {
    $project: {
      _id: 1,
      averageUnitPrice: {
        $divide: ["$sortTotalUnitPrice", "$sortTotalShipment"]
      },
      plot: 1
    }
  };
  comparisonAnalysisStages.push(entityGroupedProjectionStage);

  let resultSortStage = {
    $sort: {
      "averageUnitPrice": ((data.definition.order === RESULT_ORDER_TYPE_TOP) ? ORDER_DESCENDING : ORDER_ASCENDING)
    }
  };
  comparisonAnalysisStages.push(resultSortStage);

  let resultLimitStage = {
    $limit: parseInt(data.definition.limit)
  };
  comparisonAnalysisStages.push(resultLimitStage);

  let aggregationExpression = [{
    $match: matchClause
  },
  {
    $facet: {
      comparisonAnalysis: comparisonAnalysisStages
    }
  }
  ];

  //

  return aggregationExpression;
};


const formulateEntitiesAverageUnitPriceComparisonAggregationPipelineEngine = (data) => {

  let queryClause = formulateMatchAggregationStageEngine(data);

  let interpretedDateTerm = data.definition.fieldTerms.date;

  let entityGroupQueryField = mapQueryFieldTermsEngine(data.specification.entity, data.definition);


  let sortStage = [];
  let sortDate = {};
  sortDate[interpretedDateTerm] = {
    order: ((data.definition.order === RESULT_ORDER_TYPE_TOP) ? ORDER_TERM_DESCENDING : ORDER_TERM_ASCENDING)
  };
  sortStage.push(sortDate);

  let comparisonAnalysisStage = {
    terms: {
      field: entityGroupQueryField
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
              }
            }
          }
        }
      },
      stats_bucket_sort: {
        bucket_sort: {
          from: 0,
          size: parseInt(data.definition.limit)

        }
      }
    }
  };

  let aggregationExpression = {
    size: 0,
    sort: sortStage,
    query: queryClause,
    aggs: {
      comparisonAnalysis: comparisonAnalysisStage
    }
  };

  //

  return aggregationExpression;
};


const constructEntitiesByQuantityComparisonAggregationResult = (data) => {
  let intelligentizedData = null;
  let entityList = [];
  if (data != null) {
    data.boundaryRange.forEach(boundary => {
      boundary.months.forEach(boundaryMonth => {
        data.comparisonAnalysis.forEach(bundle => {

          if (entityList.filter(entity => entity.name === bundle._id).length === 0) {
            entityList.push({
              "name": bundle._id,
              "data": []
            });
          }

          let dataPoint = 0;
          bundle.plot.forEach(plot => {
            if (plot.year === boundary.year) {
              if (plot.month === boundaryMonth) {
                dataPoint += Number(plot.totalQuantity);
              }
            }
          });

          entityList.forEach(entity => {
            if (entity.name === bundle._id) {
              entity.data.push(dataPoint);
            }
          });

        });
      });
    });
    intelligentizedData = {
      entityPlotPoints: entityList
    };
  }
  return intelligentizedData;
};

const constructEntitiesByQuantityComparisonAggregationResultEngine = (data) => {
  let intelligentizedData = null;
  let entityList = [];

  if (data != null) {

    let transformedComparisonAnalysis = [];
    data.comparisonAnalysis.buckets.forEach(bundleCountry => {
      let countryPlots = [];
      bundleCountry.plot.buckets.forEach(bundleYear => {
        bundleYear.plot.buckets.forEach(bundleMonth => {
          let dataBundle = {
            year: parseInt(bundleYear.key_as_string),
            month: parseInt(bundleMonth.key_as_string),
            week: 0,
            totalShipments: bundleMonth.totalShipments.value,
            totalQuantity: bundleMonth.totalQuantity.value,
            totalPrice: bundleMonth.totalPrice.value,
            totalUnitPrice: bundleMonth.totalUnitPrice.value,
            totalDuty: bundleMonth?.totalDuty?.value
          };
          countryPlots.push(dataBundle);
        });
      });
      transformedComparisonAnalysis.push({
        _id: bundleCountry.key,
        plot: countryPlots
      });
    });

    data.comparisonAnalysis = transformedComparisonAnalysis;

    data.boundaryRange.forEach(boundary => {
      boundary.months.forEach(boundaryMonth => {
        data.comparisonAnalysis.forEach(bundle => {

          if (entityList.filter(entity => entity.name === bundle._id).length === 0) {
            entityList.push({
              "name": bundle._id,
              "data": []
            });
          }

          let dataPoint = 0;
          bundle.plot.forEach(plot => {
            if (plot.year === boundary.year) {
              if (plot.month === boundaryMonth) {
                dataPoint += Number(plot.totalQuantity);
              }
            }
          });

          entityList.forEach(entity => {
            if (entity.name === bundle._id) {
              entity.data.push(dataPoint);
            }
          });

        });
      });
    });
    intelligentizedData = {
      entityPlotPoints: entityList
    };
  }
  return intelligentizedData;
};


const constructEntitiesByPriceComparisonAggregationResult = (data) => {
  let intelligentizedData = null;
  let entityList = [];
  if (data != null) {
    data.boundaryRange.forEach(boundary => {
      boundary.months.forEach(boundaryMonth => {
        data.comparisonAnalysis.forEach(bundle => {

          if (entityList.filter(entity => entity.name === bundle._id).length === 0) {
            entityList.push({
              "name": bundle._id,
              "data": []
            });
          }

          let dataPoint = 0;
          bundle.plot.forEach(plot => {
            if (plot.year === boundary.year) {
              if (plot.month === boundaryMonth) {
                dataPoint += Number(plot.totalPrice);
              }
            }
          });

          entityList.forEach(entity => {
            if (entity.name === bundle._id) {
              entity.data.push(dataPoint);
            }
          });

        });
      });
    });
    intelligentizedData = {
      entityPlotPoints: entityList
    };
  }
  //
  return intelligentizedData;
};

const constructEntitiesByPriceComparisonAggregationResultEngine = (data) => {
  let intelligentizedData = null;
  let entityList = [];

  if (data != null) {

    let transformedComparisonAnalysis = [];
    data.comparisonAnalysis.buckets.forEach(bundleCountry => {
      let countryPlots = [];
      bundleCountry.plot.buckets.forEach(bundleYear => {
        bundleYear.plot.buckets.forEach(bundleMonth => {
          let dataBundle = {
            year: parseInt(bundleYear.key_as_string),
            month: parseInt(bundleMonth.key_as_string),
            week: 0,
            totalShipments: bundleMonth.totalShipments.value,
            totalQuantity: bundleMonth.totalQuantity.value,
            totalPrice: bundleMonth.totalPrice.value,
            totalUnitPrice: bundleMonth.totalUnitPrice.value,
            totalDuty: bundleMonth?.totalDuty?.value
          };
          countryPlots.push(dataBundle);
        });
      });
      transformedComparisonAnalysis.push({
        _id: bundleCountry.key,
        plot: countryPlots
      });
    });

    data.comparisonAnalysis = transformedComparisonAnalysis;

    data.boundaryRange.forEach(boundary => {
      boundary.months.forEach(boundaryMonth => {
        data.comparisonAnalysis.forEach(bundle => {

          if (entityList.filter(entity => entity.name === bundle._id).length === 0) {
            entityList.push({
              "name": bundle._id,
              "data": []
            });
          }

          let dataPoint = 0;
          bundle.plot.forEach(plot => {
            if (plot.year === boundary.year) {
              if (plot.month === boundaryMonth) {
                dataPoint += Number(plot.totalPrice);
              }
            }
          });

          entityList.forEach(entity => {
            if (entity.name === bundle._id) {
              entity.data.push(dataPoint);
            }
          });

        });
      });
    });
    intelligentizedData = {
      entityPlotPoints: entityList
    };
  }
  //
  return intelligentizedData;
};


const constructEntitiesByAverageUnitPriceComparisonAggregationResult = (data) => {
  let intelligentizedData = null;
  let entityList = [];
  if (data != null) {
    data.boundaryRange.forEach(boundary => {
      boundary.months.forEach(boundaryMonth => {
        data.comparisonAnalysis.forEach(bundle => {

          if (entityList.filter(entity => entity.name === bundle._id).length === 0) {
            entityList.push({
              "name": bundle._id,
              "data": []
            });
          }

          let dataPointStepUnitPrice = 0;
          let dataPointStepShipment = 0;
          bundle.plot.forEach(plot => {
            if (plot.year === boundary.year) {
              if (plot.month === boundaryMonth) {
                dataPointStepUnitPrice += Number(plot.totalUnitPrice);
                dataPointStepShipment += Number(plot.totalShipments);
              }
            }
          });

          let dataPoint = 0;
          if (dataPointStepShipment != 0) {
            dataPoint = dataPointStepUnitPrice / dataPointStepShipment;
          }

          entityList.forEach(entity => {
            if (entity.name === bundle._id) {
              entity.data.push(dataPoint);
            }
          });

        });
      });
    });
    intelligentizedData = {
      entityPlotPoints: entityList
    };
  }
  //
  return intelligentizedData;
};

const constructEntitiesByAverageUnitPriceComparisonAggregationResultEngine = (data) => {
  let intelligentizedData = null;
  let entityList = [];

  if (data != null) {

    let transformedComparisonAnalysis = [];
    data.comparisonAnalysis.buckets.forEach(bundleCountry => {
      let countryPlots = [];
      bundleCountry.plot.buckets.forEach(bundleYear => {
        bundleYear.plot.buckets.forEach(bundleMonth => {
          let dataBundle = {
            year: parseInt(bundleYear.key_as_string),
            month: parseInt(bundleMonth.key_as_string),
            week: 0,
            totalShipments: bundleMonth.totalShipments.value,
            totalQuantity: bundleMonth.totalQuantity.value,
            totalPrice: bundleMonth.totalPrice.value,
            totalUnitPrice: bundleMonth.totalUnitPrice.value,
            totalDuty: bundleMonth?.totalDuty?.value
          };
          countryPlots.push(dataBundle);
        });
      });
      transformedComparisonAnalysis.push({
        _id: bundleCountry.key,
        plot: countryPlots
      });
    });

    data.comparisonAnalysis = transformedComparisonAnalysis;


    data.boundaryRange.forEach(boundary => {
      boundary.months.forEach(boundaryMonth => {
        data.comparisonAnalysis.forEach(bundle => {

          if (entityList.filter(entity => entity.name === bundle._id).length === 0) {
            entityList.push({
              "name": bundle._id,
              "data": []
            });
          }

          let dataPointStepUnitPrice = 0;
          let dataPointStepShipment = 0;
          bundle.plot.forEach(plot => {
            if (plot.year === boundary.year) {
              if (plot.month === boundaryMonth) {
                dataPointStepUnitPrice += Number(plot.totalUnitPrice);
                dataPointStepShipment += Number(plot.totalShipments);
              }
            }
          });

          let dataPoint = 0;
          if (dataPointStepShipment != 0) {
            dataPoint = dataPointStepUnitPrice / dataPointStepShipment;
          }

          entityList.forEach(entity => {
            if (entity.name === bundle._id) {
              entity.data.push(dataPoint);
            }
          });

        });
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
