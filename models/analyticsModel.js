const TAG = 'analyticsModel';

const ObjectID = require('mongodb').ObjectID;

const MongoDbHandler = require('../db/mongoDbHandler');
const ElasticsearchDbHandler = require('../db/elasticsearchDbHandler');
const AnalyticsSchema = require('../schemas/analyticsSchema');


const findTradeFactorCorrelationByTimeAggregation = (aggregationParams, dataBucket, cb) => {

  let aggregationExpression = AnalyticsSchema.buildAggregationPipeline(aggregationParams);

  //

  MongoDbHandler.getDbInstance().collection(dataBucket)
    .aggregate(aggregationExpression, {
      allowDiskUse: true
    },
      function (err, cursor) {
        if (err) {
          cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              cb(err);
            } else {
              cb(null, (documents) ? documents[0] : null);
            }
          });
        }
      }
    );
};

const findTradeFactorCorrelationByTimeAggregationEngine = async (aggregationParams, dataBucket, cb) => {

  let aggregationExpression = AnalyticsSchema.buildAggregationPipeline(aggregationParams);

  //
  try {
    result = await ElasticsearchDbHandler.getDbInstance().search({
      index: dataBucket,
      track_total_hits: true,
      body: aggregationExpression
    })
    // 
    if (result.statusCode == 200) {
      let mappedResult = result.body.aggregations;
      cb(null, (mappedResult) ? mappedResult : null);
    }
  } catch (err) {
    
  }
};


const findTradeEntityComparisonByTimeAggregation = (aggregationParams, dataBucket, cb) => {

  let aggregationExpression = AnalyticsSchema.buildAggregationPipeline(aggregationParams);

  //

  MongoDbHandler.getDbInstance().collection(dataBucket)
    .aggregate(aggregationExpression, {
      allowDiskUse: true
    },
      function (err, cursor) {
        if (err) {
          cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              cb(err);
            } else {
              cb(null, (documents) ? documents[0] : null);
            }
          });
        }
      }
    );

};

const findTradeEntityComparisonByTimeAggregationEngine = async (aggregationParams, dataBucket, cb) => {

  let aggregationExpression = AnalyticsSchema.buildAggregationPipeline(aggregationParams);

  //

  try {
    result = await ElasticsearchDbHandler.getDbInstance().search({
      index: dataBucket,
      track_total_hits: true,
      body: aggregationExpression
    })
    // 
    if (result.statusCode == 200) {
      let mappedResult = result.body.aggregations;
      cb(null, (mappedResult) ? mappedResult : null);
    }
  } catch (err) {
    
  }

};


const findTradeEntityDistributionByTimeAggregation = (aggregationParams, dataBucket, cb) => {

  let aggregationExpression = AnalyticsSchema.buildAggregationPipeline(aggregationParams);

  //

  MongoDbHandler.getDbInstance().collection(dataBucket)
    .aggregate(aggregationExpression, {
      allowDiskUse: true
    },
      function (err, cursor) {
        if (err) {
          cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              cb(err);
            } else {
              cb(null, (documents) ? documents[0] : null);
            }
          });
        }
      }
    );

};

const findTradeEntityDistributionByTimeAggregationEngine = async (aggregationParams, dataBucket, cb) => {

  let aggregationExpression = AnalyticsSchema.buildAggregationPipeline(aggregationParams);

  //

  try {
    result = await ElasticsearchDbHandler.getDbInstance().search({
      index: dataBucket,
      track_total_hits: true,
      body: aggregationExpression
    })
    // 
    if (result.statusCode == 200) {
      let mappedResult = result.body.aggregations;
      cb(null, (mappedResult) ? mappedResult : null);
    }
  } catch (err) {
    
  }
};


const findTradeFactorCorrelationByEntityAggregation = (aggregationParams, dataBucket, cb) => {

  let aggregationExpression = AnalyticsSchema.buildAggregationPipeline(aggregationParams);

  //

  MongoDbHandler.getDbInstance().collection(dataBucket)
    .aggregate(aggregationExpression, {
      allowDiskUse: true
    },
      function (err, cursor) {
        if (err) {
          cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              cb(err);
            } else {
              cb(null, (documents) ? documents[0] : null);
            }
          });
        }
      }
    );

};

const findTradeFactorCorrelationByEntityAggregationEngine = async (aggregationParams, dataBucket, cb) => {

  let aggregationExpression = AnalyticsSchema.buildAggregationPipeline(aggregationParams);

  //

  try {
    result = await ElasticsearchDbHandler.getDbInstance().search({
      index: dataBucket,
      track_total_hits: true,
      body: aggregationExpression
    })
    // 
    if (result.statusCode == 200) {
      let mappedResult = result.body.aggregations;
      cb(null, (mappedResult) ? mappedResult : null);
    }
  } catch (err) {
    
  }
};


const findTradeFactorContributionByEntityAggregation = (aggregationParams, dataBucket, cb) => {

  let aggregationExpression = AnalyticsSchema.buildAggregationPipeline(aggregationParams);

  //

  MongoDbHandler.getDbInstance().collection(dataBucket)
    .aggregate(aggregationExpression, {
      allowDiskUse: true
    },
      function (err, cursor) {
        if (err) {
          cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              cb(err);
            } else {
              cb(null, (documents) ? documents[0] : null);
            }
          });
        }
      }
    );

};

const findTradeFactorContributionByEntityAggregationEngine = async (aggregationParams, dataBucket, cb) => {

  let aggregationExpression = AnalyticsSchema.buildAggregationPipeline(aggregationParams);

  //

  try {
    result = await ElasticsearchDbHandler.getDbInstance().search({
      index: dataBucket,
      track_total_hits: true,
      body: aggregationExpression
    })
    // 
    if (result.statusCode == 200) {
      let mappedResult = result.body.aggregations;
      cb(null, (mappedResult) ? mappedResult : null);
    }
  } catch (err) {
    
  }

};



const findTradeEntityFactorPerioidsationByTimeAggregation = (aggregationParams, dataBucket, cb) => {

  let aggregationExpression = AnalyticsSchema.buildAggregationPipeline(aggregationParams);

  //

  MongoDbHandler.getDbInstance().collection(dataBucket)
    .aggregate(aggregationExpression, {
      allowDiskUse: true
    },
      function (err, cursor) {
        if (err) {
          cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              cb(err);
            } else {
              cb(null, (documents) ? documents[0] : null);
            }
          });
        }
      }
    );

};

const findTradeEntityFactorPerioidsationByTimeAggregationEngine = async (aggregationParams, dataBucket, cb) => {

  let aggregationExpression = AnalyticsSchema.buildAggregationPipeline(aggregationParams);
  
  //

  try {
    result = await ElasticsearchDbHandler.getDbInstance().search({
      index: dataBucket,
      track_total_hits: true,
      body: aggregationExpression
    })
    // 
    if (result.statusCode == 200) {
      let mappedResult = result.body.aggregations;
      cb(null, (mappedResult) ? mappedResult : null);
    }
  } catch (err) {
    
  }

};


const findTradeFactorCompositionByEntityAggregation = (aggregationParams, dataBucket, cb) => {

  let aggregationExpression = AnalyticsSchema.buildAggregationPipeline(aggregationParams);

  //

  MongoDbHandler.getDbInstance().collection(dataBucket)
    .aggregate(aggregationExpression, {
      allowDiskUse: true
    },
      function (err, cursor) {
        if (err) {
          cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              cb(err);
            } else {
              cb(null, (documents) ? documents[0] : null);
            }
          });
        }
      }
    );

};

const findTradeFactorCompositionByEntityAggregationEngine = async (aggregationParams, dataBucket, cb) => {

  let aggregationExpression = AnalyticsSchema.buildAggregationPipeline(aggregationParams);

  //

  try {
    result = await ElasticsearchDbHandler.getDbInstance().search({
      index: dataBucket,
      track_total_hits: true,
      body: aggregationExpression
    })
    // 
    if (result.statusCode == 200) {
      let mappedResult = result.body.aggregations;
      cb(null, (mappedResult) ? mappedResult : null);
    }
  } catch (err) {
    
  }

};


module.exports = {
  findTradeFactorCorrelationByTimeAggregation,
  findTradeFactorCorrelationByTimeAggregationEngine,
  findTradeEntityComparisonByTimeAggregation,
  findTradeEntityComparisonByTimeAggregationEngine,
  findTradeEntityDistributionByTimeAggregation,
  findTradeEntityDistributionByTimeAggregationEngine,
  findTradeFactorCorrelationByEntityAggregation,
  findTradeFactorCorrelationByEntityAggregationEngine,
  findTradeFactorContributionByEntityAggregation,
  findTradeFactorContributionByEntityAggregationEngine,
  findTradeEntityFactorPerioidsationByTimeAggregation,
  findTradeEntityFactorPerioidsationByTimeAggregationEngine,
  findTradeFactorCompositionByEntityAggregation,
  findTradeFactorCompositionByEntityAggregationEngine,
};
