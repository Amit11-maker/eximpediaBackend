// @ts-check
const TAG = "analyticsModel";

const MongoDbHandler = require("../../db/mongoDbHandler");
const ElasticsearchDbHandler = require("../../db/elasticsearchDbHandler");
const AnalyticsSchema = require("../../schemas/adx/analytics.adx.schema");
const { logger } = require("../../config/logger");
const { query: AdxQueryExecuter } = require("../../db/adxDbApi")
const { getADXAccessToken } = require("../../db/accessToken");
const { ObjectId } = require("mongodb");
const { mapAdxRowsAndColumns } = require("../tradeModel");
const getLoggerInstance = require("../../services/logger/Logger");

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
    aggregationParams, // request body
    dataBucket,
    cb
) => {
    //
    try {
        let aggregationExpression = await AnalyticsSchema.buildAggregationPipeline(aggregationParams);
        let aggregationADX = aggregationExpression?.aggregationADX;

        let accessToken = await getADXAccessToken();
        let aggregationADXResults = await AdxQueryExecuter(aggregationADX, accessToken);
        aggregationADXResults = JSON.parse(aggregationADXResults);

        aggregationADXResults = mapAdxRowsAndColumns(aggregationADXResults.Tables[0].Rows, aggregationADXResults.Tables[0].Columns);

        // let result = await ElasticsearchDbHandler.getDbInstance().search({
        //     index: "india_export*",
        //     track_total_hits: true,
        //     body: { ...aggregationExpression },
        // });

        let mappedDataResult = aggregationADXResults.map((item) => {
            let obj = {}
            Object.keys(item).forEach((key) => {
                if (key === "BUYER_NAME") {
                    obj["key"] = item[key]
                } else if (key === "doc_count") {
                    obj["doc_count"] = item[key]
                } else {
                    obj[key] = { value: item[key] }
                }
            })
            return obj;
        })

        // if (result.statusCode == 200) {
        //     // let mappedResult = result.body.aggregations;

        // }
        let mappedResult = {
            correlationAnalysis: {
                doc_count_error_upper_bound: 372214,
                sum_other_doc_count: 244461573,
                buckets: mappedDataResult,
            },
        };
        cb(null, mappedResult ? mappedResult : null);
    } catch (err) {
        logger.log(JSON.stringify(err));
        getLoggerInstance(err, __filename, "findTradeFactorCorrelationByEntityAggregationEngine");
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
    aggregationParams, // request body
    dataBucket
) => {
    try {
        /**
         * @type {any}
         */
        let aggregationExpression = await AnalyticsSchema.buildAggregationPipeline(aggregationParams);
        let entityContributionAnalysis = aggregationExpression?.entityContributionAnalysis;
        let summarizeAggregationQuery = aggregationExpression?.summarizeAggregationQuery;

        let accessToken = await getADXAccessToken();
        let summarizeAggregationQueryResults = await AdxQueryExecuter(summarizeAggregationQuery, accessToken);
        summarizeAggregationQueryResults = JSON.parse(summarizeAggregationQueryResults);

        let entityContributionAnalysisResults = await AdxQueryExecuter(entityContributionAnalysis, accessToken);
        entityContributionAnalysisResults = JSON.parse(entityContributionAnalysisResults);

        entityContributionAnalysisResults = mapAdxRowsAndColumns(entityContributionAnalysisResults.Tables[0].Rows, entityContributionAnalysisResults.Tables[0].Columns);
        summarizeAggregationQueryResults = mapAdxRowsAndColumns(summarizeAggregationQueryResults.Tables[0].Rows, summarizeAggregationQueryResults.Tables[0].Columns);


        let baseAggregationResults = {};
        Object.keys(summarizeAggregationQueryResults[0]).forEach(key => {
            if (key === "doc_count") {
                baseAggregationResults["doc_count"] = summarizeAggregationQueryResults[0][key];
            } else {
                baseAggregationResults[key] = {
                    value: summarizeAggregationQueryResults[0][key]
                };
            }
        });


        let entityContributionAnalysisResultsMapped = entityContributionAnalysisResults.map(item => {
            let obj = {};
            Object.keys(item).forEach(key => {
                if (key === "BUYER_NAME") {
                    obj["key"] = item[key];
                } else if (key === "doc_count") {
                    obj["doc_count"] = item[key];
                } else {
                    obj[key] = {
                        value: item[key]
                    };
                }
                obj['averageUnitPrice'] = {
                    value: null
                }
            })
            return obj;
        })

        delete aggregationExpression?.entityContributionAnalysis;
        delete aggregationExpression?.summarizeAggregationQuery;
        let result = await ElasticsearchDbHandler.getDbInstance().search({
            index: "india_export*",
            track_total_hits: true,
            body: { ...aggregationExpression },
        });

        let mappedResult = result.body.aggregations;
        let mappedResultADX = {
            all_matching_docs: {
                buckets: {
                    all: {
                        ...baseAggregationResults,
                        entityContributionAnalysis: {
                            buckets: entityContributionAnalysisResultsMapped,
                            doc_count_error_upper_bound: 69555,
                            sum_other_doc_count: 220642358
                        }
                    }
                }
            }
        }
        return mappedResultADX;
    } catch (err) {
        logger.log(JSON.stringify(err));
        throw err;
    }
};

const findTradeEntityFactorPerioidsationByTimeAggregationEngine = async (
    aggregationParams, // request body
    dataBucket
) => {
    try {
        let aggregationExpression = await AnalyticsSchema.buildAggregationPipeline(aggregationParams);

        let periodizationAnalysisAggQuery = aggregationExpression?.periodizationAnalysisAggQuery

        let accessToken = await getADXAccessToken();
        let periodizationAnalysisAggQueryResults = await AdxQueryExecuter(periodizationAnalysisAggQuery, accessToken);
        periodizationAnalysisAggQueryResults = JSON.parse(periodizationAnalysisAggQueryResults);

        periodizationAnalysisAggQueryResults = mapAdxRowsAndColumns(periodizationAnalysisAggQueryResults.Tables[0].Rows, periodizationAnalysisAggQueryResults.Tables[0].Columns);

        let periodizationAnalysisAggQueryResultsMapped = periodizationAnalysisAggQueryResults.map(item => {
            let obj = {};
            Object.keys(item).forEach(key => {
                if (key === "BUYER_NAME") {
                    obj["key"] = item[key];
                } else if (key === "doc_count") {
                    obj["doc_count"] = item[key];
                } else {
                    obj[key] = {
                        value: item[key]
                    };
                }
            })
            return obj;
        })


        delete aggregationExpression?.periodizationAnalysisAggQuery;
        let result = await ElasticsearchDbHandler.getDbInstance().search({
            index: "india_export*",
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
        let aggregationExpression = AnalyticsSchema.buildAggregationPipeline(aggregationParams);
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
