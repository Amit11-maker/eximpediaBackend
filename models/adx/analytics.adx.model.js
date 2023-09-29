// @ts-check
const TAG = "analyticsModel";

const MongoDbHandler = require("../../db/mongoDbHandler");
const ElasticsearchDbHandler = require("../../db/elasticsearchDbHandler");
const AnalyticsSchema = require("../../schemas/adx/analytics.adx.schema");
const { logger } = require("../../config/logger");
const { query: AdxQueryExecuter } = require("../../db/adxDbApi")
const { getADXAccessToken } = require("../../db/accessToken");
const { ObjectId } = require("mongodb");

const findTradeFactorCorrelationByTimeAggregation = (
    aggregationParams,
    dataBucket,
    cb
) => {
    let aggregationExpression =
        AnalyticsSchema.buildAggregationPipeline(aggregationParams);

    //

    MongoDbHandler.getDbInstance()
        .collection(dataBucket)
        .aggregate(
            aggregationExpression,
            {
                allowDiskUse: true,
            },
            function (err, cursor) {
                if (err) {
                    cb(err);
                } else {
                    cursor.toArray(function (err, documents) {
                        if (err) {
                            cb(err);
                        } else {
                            cb(null, documents ? documents[0] : null);
                        }
                    });
                }
            }
        );
};

const findTradeFactorCorrelationByTimeAggregationEngine = async (
    aggregationParams,
    dataBucket,
    cb
) => {
    //
    try {
        let aggregationExpression =
            AnalyticsSchema.buildAggregationPipeline(aggregationParams);
        let result = await ElasticsearchDbHandler.getDbInstance().search({
            index: dataBucket,
            track_total_hits: true,
            body: { ...aggregationExpression },
        });
        //
        if (result.statusCode == 200) {
            let mappedResult = result.body.aggregations;
            cb(null, mappedResult ? mappedResult : null);
        }
    } catch (err) {
        logger.log(JSON.stringify(err));
        cb(err);
    }
};

const findTradeEntityComparisonByTimeAggregation = (
    aggregationParams,
    dataBucket,
    cb
) => {
    let aggregationExpression =
        AnalyticsSchema.buildAggregationPipeline(aggregationParams);

    //

    MongoDbHandler.getDbInstance()
        .collection(dataBucket)
        .aggregate(
            aggregationExpression,
            {
                allowDiskUse: true,
            },
            function (err, cursor) {
                if (err) {
                    cb(err);
                } else {
                    cursor.toArray(function (err, documents) {
                        if (err) {
                            cb(err);
                        } else {
                            cb(null, documents ? documents[0] : null);
                        }
                    });
                }
            }
        );
};

const findTradeEntityComparisonByTimeAggregationEngine = async (
    aggregationParams,
    dataBucket,
    cb
) => {
    try {
        let aggregationExpression =
            AnalyticsSchema.buildAggregationPipeline(aggregationParams);
        logger.log(JSON.stringify(aggregationExpression));
        let result = await ElasticsearchDbHandler.getDbInstance().search({
            index: dataBucket,
            track_total_hits: true,
            body: { ...aggregationExpression },
        });
        //
        if (result.statusCode == 200) {
            let mappedResult = result.body.aggregations;
            cb(null, mappedResult ? mappedResult : null);
        }
    } catch (err) {
        logger.log(JSON.stringify(err));
        cb(err);
    }
};

const findTradeEntityDistributionByTimeAggregation = (
    aggregationParams,
    dataBucket,
    cb
) => {
    try {
        let aggregationExpression =
            AnalyticsSchema.buildAggregationPipeline(aggregationParams);
        MongoDbHandler.getDbInstance()
            .collection(dataBucket)
            .aggregate(
                aggregationExpression,
                {
                    allowDiskUse: true,
                },
                function (err, cursor) {
                    if (err) {
                        cb(err);
                    } else {
                        cursor.toArray(function (err, documents) {
                            if (err) {
                                cb(err);
                            } else {
                                cb(null, documents ? documents[0] : null);
                            }
                        });
                    }
                }
            );
    } catch (err) {
        logger.log(JSON.stringify(err));
        cb(err);
    }

    //
};

const findTradeEntityDistributionByTimeAggregationEngine = async (
    aggregationParams,
    dataBucket,
    cb
) => {
    try {
        let accessToken = await getADXAccessToken();
        // let aggregationExpression = AnalyticsSchema.buildAggregationPipeline(aggregationParams);
        let aggregationExpression = await AnalyticsSchema.buildAggregationPipelineADX(aggregationParams);

        const adxQuery = aggregationExpression.aggregationADX;
        let results = await AdxQueryExecuter(adxQuery, accessToken);
        results = JSON.parse(results)

        let rows = results?.Tables?.[0]?.Rows
        let columns = results?.Tables?.[0]?.Columns
        let mappedDataResult = []

        for (let row of rows) {
            let obj = {};
            row?.forEach((val, i) => {
                columns.forEach((col, j) => {
                    if (i === j) {
                        obj[col?.ColumnName] = val ?? 0;
                    }
                })
            })
            mappedDataResult.push(obj)
        }

        // logger.log(JSON.stringify(aggregationExpression))
        // let result = await ElasticsearchDbHandler.getDbInstance().search({
        //     index: dataBucket,
        //     track_total_hits: true,
        //     body: { ...aggregationExpression },
        // });
        //

        let mappedResult = mappedDataResult;
        cb(null, mappedResult ? { entityPlotPoints: mappedResult } : null);
        // if (result.statusCode == 200) {
        //     // let mappedResult = result.body.aggregations;
        //     let mappedResult = mappedDataResult;
        //     cb(null, mappedResult ? mappedResult : null);
        // }
    } catch (err) {
        logger.log(JSON.stringify(err));
        cb(err);
    }
};

const findTradeFactorCorrelationByEntityAggregation = (
    aggregationParams,
    dataBucket,
    cb
) => {
    let aggregationExpression =
        AnalyticsSchema.buildAggregationPipeline(aggregationParams);

    //

    MongoDbHandler.getDbInstance()
        .collection(dataBucket)
        .aggregate(
            aggregationExpression,
            {
                allowDiskUse: true,
            },
            function (err, cursor) {
                if (err) {
                    cb(err);
                } else {
                    cursor.toArray(function (err, documents) {
                        if (err) {
                            cb(err);
                        } else {
                            cb(null, documents ? documents[0] : null);
                        }
                    });
                }
            }
        );
};

const findTradeFactorCorrelationByEntityAggregationEngine = async (
    aggregationParams,
    dataBucket,
    cb
) => {
    //

    try {
        let aggregationExpression =
            AnalyticsSchema.buildAggregationPipeline(aggregationParams);
        let result = await ElasticsearchDbHandler.getDbInstance().search({
            index: dataBucket,
            track_total_hits: true,
            body: { ...aggregationExpression },
        });
        //
        if (result.statusCode == 200) {
            let mappedResult = result.body.aggregations;
            cb(null, mappedResult ? mappedResult : null);
        }
    } catch (err) {
        logger.log(JSON.stringify(err));
        cb(err);
    }
};

const findTradeFactorContributionByEntityAggregation = (
    aggregationParams,
    dataBucket,
    cb
) => {
    let aggregationExpression =
        AnalyticsSchema.buildAggregationPipeline(aggregationParams);

    //

    MongoDbHandler.getDbInstance()
        .collection(dataBucket)
        .aggregate(
            aggregationExpression,
            {
                allowDiskUse: true,
            },
            function (err, cursor) {
                if (err) {
                    cb(err);
                } else {
                    cursor.toArray(function (err, documents) {
                        if (err) {
                            cb(err);
                        } else {
                            cb(null, documents ? documents[0] : null);
                        }
                    });
                }
            }
        );
};

const findTradeFactorContributionByEntityAggregationEngine = async (
    aggregationParams,
    dataBucket
) => {
    try {
        let aggregationExpression =
            AnalyticsSchema.buildAggregationPipeline(aggregationParams);
        let result = await ElasticsearchDbHandler.getDbInstance().search({
            index: dataBucket,
            track_total_hits: true,
            body: { ...aggregationExpression },
        });
        //
        if (result.statusCode == 200) {
            let mappedResult = result.body.aggregations;
            return mappedResult;
        }
    } catch (err) {
        logger.log(JSON.stringify(err));
        throw err;
    }
};

const findTradeEntityFactorPerioidsationByTimeAggregationEngine = async (
    aggregationParams,
    dataBucket
) => {
    try {
        let aggregationExpression =
            AnalyticsSchema.buildAggregationPipeline(aggregationParams);
        let result = await ElasticsearchDbHandler.getDbInstance().search({
            index: dataBucket,
            track_total_hits: true,
            body: { ...aggregationExpression },
        });
        //
        if (result.statusCode == 200) {
            let mappedResult = result.body.aggregations;
            return mappedResult;
        }
    } catch (err) {
        logger.log(JSON.stringify(err));
        throw err;
    }
};

const findTradeFactorCompositionByEntityAggregation = (
    aggregationParams,
    dataBucket,
    cb
) => {
    let aggregationExpression =
        AnalyticsSchema.buildAggregationPipeline(aggregationParams);

    //

    MongoDbHandler.getDbInstance()
        .collection(dataBucket)
        .aggregate(
            aggregationExpression,
            {
                allowDiskUse: true,
            },
            function (err, cursor) {
                if (err) {
                    cb(err);
                } else {
                    cursor.toArray(function (err, documents) {
                        if (err) {
                            cb(err);
                        } else {
                            cb(null, documents ? documents[0] : null);
                        }
                    });
                }
            }
        );
};

const findTradeFactorCompositionByEntityAggregationEngine = async (
    aggregationParams,
    dataBucket,
    cb
) => {
    try {
        let aggregationExpression =
            AnalyticsSchema.buildAggregationPipeline(aggregationParams);
        logger.log(JSON.stringify(aggregationExpression));
        let result = await ElasticsearchDbHandler.getDbInstance().search({
            index: dataBucket,
            track_total_hits: true,
            body: { ...aggregationExpression },
        });
        //
        if (result.statusCode == 200) {
            let mappedResult = result.body.aggregations;
            cb(null, mappedResult ? mappedResult : null);
        }
    } catch (err) {
        logger.log(JSON.stringify(err));
        cb(err);
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
    findTradeEntityFactorPerioidsationByTimeAggregationEngine,
    findTradeFactorCompositionByEntityAggregation,
    findTradeFactorCompositionByEntityAggregationEngine,
};
