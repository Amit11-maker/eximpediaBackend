const TAG = 'analyticsModel';

const ObjectID = require('mongodb').ObjectID;

const MongoDbHandler = require('../db/mongoDbHandler');
const ElasticsearchDbHandler = require('../db/elasticsearchDbHandler');
const AnalyticsSchema = require('../schemas/analyticsSchema');


const findTradeFactorCorrelationByTimeAggregation = (aggregationParams, dataBucket, cb) => {

  let aggregationExpression = AnalyticsSchema.buildAggregationPipeline(aggregationParams);

  //console.log(JSON.stringify(aggregationExpression));

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

const findTradeFactorCorrelationByTimeAggregationEngine = (aggregationParams, dataBucket, cb) => {

  let aggregationExpression = AnalyticsSchema.buildAggregationPipeline(aggregationParams);

  //console.log(JSON.stringify(aggregationExpression));

  ElasticsearchDbHandler.getDbInstance().search({
    index: dataBucket,
    track_total_hits: true,
    body: aggregationExpression
  }, (err, result) => {
    if (err) {
      cb(err);
    } else {

      let mappedResult = result.body.aggregations;
      //console.log(mappedResult);
      cb(null, (mappedResult) ? mappedResult : null);

    }

  });

};


const findTradeEntityComparisonByTimeAggregation = (aggregationParams, dataBucket, cb) => {

  let aggregationExpression = AnalyticsSchema.buildAggregationPipeline(aggregationParams);

  //console.log(JSON.stringify(aggregationExpression));

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

const findTradeEntityComparisonByTimeAggregationEngine = (aggregationParams, dataBucket, cb) => {

  let aggregationExpression = AnalyticsSchema.buildAggregationPipeline(aggregationParams);

  //console.log(JSON.stringify(aggregationExpression));

  ElasticsearchDbHandler.getDbInstance().search({
    index: dataBucket,
    track_total_hits: true,
    body: aggregationExpression
  }, (err, result) => {
    if (err) {
      cb(err);
    } else {

      let mappedResult = result.body.aggregations;
      //console.log(mappedResult);
      cb(null, (mappedResult) ? mappedResult : null);

    }

  });

};


const findTradeEntityDistributionByTimeAggregation = (aggregationParams, dataBucket, cb) => {

  let aggregationExpression = AnalyticsSchema.buildAggregationPipeline(aggregationParams);

  //console.log(JSON.stringify(aggregationExpression));

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

const findTradeEntityDistributionByTimeAggregationEngine = (aggregationParams, dataBucket, cb) => {

  let aggregationExpression = AnalyticsSchema.buildAggregationPipeline(aggregationParams);

  //console.log(JSON.stringify(aggregationExpression));

  ElasticsearchDbHandler.getDbInstance().search({
    index: dataBucket,
    track_total_hits: true,
    body: aggregationExpression
  }, (err, result) => {
    if (err) {
      cb(err);
    } else {

      let mappedResult = result.body.aggregations;
      //console.log(mappedResult);
      cb(null, (mappedResult) ? mappedResult : null);

    }

  });

};


const findTradeFactorCorrelationByEntityAggregation = (aggregationParams, dataBucket, cb) => {

  let aggregationExpression = AnalyticsSchema.buildAggregationPipeline(aggregationParams);

  //console.log(JSON.stringify(aggregationExpression));

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

const findTradeFactorCorrelationByEntityAggregationEngine = (aggregationParams, dataBucket, cb) => {

  let aggregationExpression = AnalyticsSchema.buildAggregationPipeline(aggregationParams);

  //console.log(JSON.stringify(aggregationExpression));

  ElasticsearchDbHandler.getDbInstance().search({
    index: dataBucket,
    track_total_hits: true,
    body: aggregationExpression
  }, (err, result) => {
    if (err) {
      cb(err);
    } else {

      let mappedResult = result.body.aggregations;
      //console.log(mappedResult);
      cb(null, (mappedResult) ? mappedResult : null);

    }

  });

};


const findTradeFactorContributionByEntityAggregation = (aggregationParams, dataBucket, cb) => {

  let aggregationExpression = AnalyticsSchema.buildAggregationPipeline(aggregationParams);

  //console.log(JSON.stringify(aggregationExpression));

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

const findTradeFactorContributionByEntityAggregationEngine = (aggregationParams, dataBucket, cb) => {

  let aggregationExpression = AnalyticsSchema.buildAggregationPipeline(aggregationParams);

  //console.log(JSON.stringify(aggregationExpression));

  ElasticsearchDbHandler.getDbInstance().search({
    index: dataBucket,
    track_total_hits: true,
    body: aggregationExpression
  }, (err, result) => {
    if (err) {
      cb(err);
    } else {

      let mappedResult = result.body.aggregations;
      //console.log(mappedResult);
      cb(null, (mappedResult) ? mappedResult : null);

    }

  });

};



const findTradeEntityFactorPerioidsationByTimeAggregation = (aggregationParams, dataBucket, cb) => {

  let aggregationExpression = AnalyticsSchema.buildAggregationPipeline(aggregationParams);

  //console.log(JSON.stringify(aggregationExpression));

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

const findTradeEntityFactorPerioidsationByTimeAggregationEngine = (aggregationParams, dataBucket, cb) => {

  let aggregationExpression = AnalyticsSchema.buildAggregationPipeline(aggregationParams);

  //console.log(JSON.stringify(aggregationExpression));

  ElasticsearchDbHandler.getDbInstance().search({
    index: dataBucket,
    track_total_hits: true,
    body: aggregationExpression
  }, (err, result) => {
    if (err) {
      cb(err);
    } else {

      let mappedResult = result.body.aggregations;
      //console.log(mappedResult);
      cb(null, (mappedResult) ? mappedResult : null);

    }

  });

};


const findTradeFactorCompositionByEntityAggregation = (aggregationParams, dataBucket, cb) => {

  let aggregationExpression = AnalyticsSchema.buildAggregationPipeline(aggregationParams);

  //console.log(JSON.stringify(aggregationExpression));

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

const findTradeFactorCompositionByEntityAggregationEngine = (aggregationParams, dataBucket, cb) => {

  let aggregationExpression = AnalyticsSchema.buildAggregationPipeline(aggregationParams);

  //console.log(JSON.stringify(aggregationExpression));

  ElasticsearchDbHandler.getDbInstance().search({
    index: dataBucket,
    track_total_hits: true,
    body: aggregationExpression
  }, (err, result) => {
    if (err) {
      cb(err);
    } else {

      let mappedResult = result.body.aggregations;
      //console.log(mappedResult);
      cb(null, (mappedResult) ? mappedResult : null);

    }

  });

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
