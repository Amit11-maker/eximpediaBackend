// @ts-check

const AnalyticsModel = require("../../models/adx/analytics.adx.model");
const AnalyticsSchema = require("../../schemas/adx/analytics.adx.schema");
const { logger } = require("../../config/logger");
const getLoggerInstance = require("../../services/logger/Logger");
const sendResponse = require("../../services/SendResponse.util");
const { ObjectID } = require("mongodb");

const fetchChronologicalTradeFactorsCorrelation = (req, res) => {
    let payload = req.body;
    let workspaceBucket = payload.workspaceBucket
        ? payload.workspaceBucket
        : null;
    let analyticsTimeBoundary = payload.timeboundaryRange
        ? payload.timeboundaryRange
        : null;

    const dataBucket = workspaceBucket;

    let boundaryRange = [
        {
            year: 2018,
            months: [10, 11, 12],
        },
        {
            year: 2019,
            months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        },
        {
            year: 2020,
            months: [1, 2, 3],
        },
    ];

    //

    AnalyticsModel.findTradeFactorCorrelationByTimeAggregationEngine(
        payload,
        dataBucket,
        (error, analyticsData) => {
            if (error) {
                logger.log(
                    ` ANALYTICS CONTROLLER ================== ${JSON.stringify(error)}`
                );
                res.status(500).json({
                    message: error,
                });
            } else {
                analyticsData.boundaryRange = analyticsTimeBoundary; //boundaryRange
                analyticsData.chart = payload.chart;
                analyticsData.specification = payload.specification;
                let analyticsDataPack =
                    AnalyticsSchema.processAggregationResult(analyticsData);

                res.status(200).json({
                    data: analyticsDataPack,
                });
            }
        }
    );
};

const fetchChronologicalTradeEntitiesComparison = (req, res) => {
    let payload = req.body;
    let workspaceBucket = payload.workspaceBucket
        ? payload.workspaceBucket
        : null;
    let analyticsTimeBoundary = payload.timeboundaryRange
        ? payload.timeboundaryRange
        : null;

    const dataBucket = workspaceBucket;

    let boundaryRange = [
        {
            year: 2018,
            months: [10, 11, 12],
        },
        {
            year: 2019,
            months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        },
        {
            year: 2020,
            months: [1, 2, 3],
        },
    ];

    AnalyticsModel.findTradeEntityComparisonByTimeAggregationEngine(
        payload,
        dataBucket,
        (error, analyticsData) => {
            if (error) {
                logger.log(
                    ` ANALYTICS CONTROLLER ================== ${JSON.stringify(error)}`
                );
                res.status(500).json({
                    message: error,
                });
            } else {
                analyticsData.boundaryRange = analyticsTimeBoundary; //boundaryRange
                analyticsData.chart = payload.chart;
                analyticsData.specification = payload.specification;
                let analyticsDataPack =
                    AnalyticsSchema.processAggregationResult(analyticsData);
                res.status(200).json({
                    data: analyticsDataPack,
                });
            }
        }
    );
};

/**
 * 
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 */
const fetchChronologicalTradeEntitiesDistribution = (req, res) => {
    let payload = req.body;
    let workspaceBucket = payload.workspaceBucket
        ? payload.workspaceBucket
        : null;

    const dataBucket = workspaceBucket;

    AnalyticsModel.findTradeEntityDistributionByTimeAggregationEngine(
        payload,
        dataBucket,
        (error, analyticsData) => {
            if (error) {
                logger.log(
                    ` ANALYTICS CONTROLLER ================== ${JSON.stringify(error)}`
                );
                res.status(500).json({
                    message: error,
                });
            } else {
                analyticsData.chart = payload.chart;
                analyticsData.specification = payload.specification;
                // let analyticsDataPack =
                //     AnalyticsSchema.processAggregationResult(analyticsData);
                res.status(200).json({
                    data: analyticsData,
                });
            }
        }
    );
};

const fetchTradeEntitiesFactorsCorrelation = (req, res) => {
    let payload = req.body;
    payload.workspaceId = new ObjectID("65153764f262dd104446df82");
    let workspaceBucket = payload.workspaceBucket
        ? payload.workspaceBucket
        : null;

    const dataBucket = workspaceBucket;

    AnalyticsModel.findTradeFactorCorrelationByEntityAggregationEngine(
        payload,
        dataBucket,
        (error, analyticsData) => {
            if (error) {
                logger.log(
                    ` ANALYTICS CONTROLLER ================== ${JSON.stringify(error)}`
                );
                res.status(500).json({
                    message: error,
                });
            } else {
                analyticsData.chart = payload.chart;
                analyticsData.specification = payload.specification;
                let analyticsDataPack =
                    AnalyticsSchema.processAggregationResult(analyticsData);
                res.status(200).json({
                    data: analyticsDataPack,
                });
            }
        }
    );
};

const fetchTradeEntitiesFactorsContribution = async (req, res) => {
    let payload = req.body;
    let workspaceBucket = payload.workspaceBucket
        ? payload.workspaceBucket
        : null;
    let workspaceEntitiesCount = payload.workspaceEntitiesCount
        ? payload.workspaceEntitiesCount
        : null;

    let pageKey = payload.draw && payload.draw != 0 ? payload.draw : null;
    let offset = null;
    let limit = null;
    //Data Table JS Mode
    if (pageKey != null) {
        offset = payload.start != null ? payload.start : 0;
        limit = payload.length != null ? payload.length : 10;
    } else {
        offset = payload.offset != null ? payload.offset : 0;
        limit = payload.limit != null ? payload.limit : 10;
    }
    payload.offset = offset;
    payload.limit = limit;
    payload.workspaceId = new ObjectID("65153764f262dd104446df82");
    const dataBucket = workspaceBucket;

    try {
        let analyticsData =
            await AnalyticsModel.findTradeFactorContributionByEntityAggregationEngine(
                payload,
                dataBucket
            );
        analyticsData.chart = payload.chart;
        analyticsData.specification = payload.specification;
        let analyticsDataPack =
            AnalyticsSchema.processAggregationResult(analyticsData);

        let bundle = {};

        if (!analyticsDataPack?.dataPoints) {
            bundle.recordsTotal = 0;
            bundle.recordsFiltered = 0;
            bundle.error = "Unrecognized Shipments Response"; //Show if to be interpreted as error on client-side
        } else {
            let recordsFiltered = analyticsDataPack?.dataPoints?.length;
            bundle.recordsTotal =
                workspaceEntitiesCount != null
                    ? workspaceEntitiesCount
                    : recordsFiltered;
            bundle.recordsFiltered =
                workspaceEntitiesCount != null
                    ? workspaceEntitiesCount
                    : recordsFiltered;
        }

        if (pageKey) {
            bundle.draw = pageKey;
        }
        bundle.data = analyticsDataPack?.dataPoints;
        if (res) {
            res.status(200).json(bundle);
        } else return sendResponse(res, 200, bundle);
    } catch (error) {
        const { errorMessage } = getLoggerInstance(error, __filename);
        return sendResponse(res, 500, {}, errorMessage)
    }
};

const fetchTradeEntitiesFactorsPeriodization = async (req, res) => {
    let payload = req.body;
    let workspaceBucket = payload.workspaceBucket
        ? payload.workspaceBucket
        : null;
    let workspaceEntitiesCount = payload.workspaceEntitiesCount
        ? payload.workspaceEntitiesCount
        : null;
    let analyticsTimeBoundary = payload.timeboundaryRange
        ? payload.timeboundaryRange
        : null;

    let pageKey = payload.draw && payload.draw != 0 ? payload.draw : null;
    let offset = null;
    let limit = null;
    //Datatable JS Mode
    if (pageKey != null) {
        offset = payload.start != null ? payload.start : 0;
        limit = payload.length != null ? payload.length : 10;
    } else {
        offset = payload.offset != null ? payload.offset : 0;
        limit = payload.limit != null ? payload.limit : 10;
    }
    payload.offset = offset;
    payload.limit = limit;
    const dataBucket = workspaceBucket;
    payload.workspaceId = new ObjectID("65153764f262dd104446df82");

    try {
        let analyticsData = await AnalyticsModel.findTradeEntityFactorPerioidsationByTimeAggregationEngine(payload, dataBucket);

        analyticsData.boundaryRange = analyticsTimeBoundary; //boundaryRange
        analyticsData.chart = payload.chart;
        analyticsData.specification = payload.specification;
        let analyticsDataPack =
            AnalyticsSchema.processAggregationResult(analyticsData);
        let bundle = {};

        if (!analyticsDataPack?.dataPoints) {
            bundle.recordsTotal = 0;
            bundle.recordsFiltered = 0;
            bundle.error = "Unrecognised Shipments Response"; //Show if to be interpreted as error on client-side
        } else {
            let recordsFiltered = analyticsDataPack?.dataPoints.length;
            bundle.recordsTotal =
                workspaceEntitiesCount != null
                    ? workspaceEntitiesCount
                    : recordsFiltered;
            bundle.recordsFiltered =
                workspaceEntitiesCount != null
                    ? workspaceEntitiesCount
                    : recordsFiltered;
        }

        if (pageKey) {
            bundle.draw = pageKey;
        }
        bundle.data = analyticsDataPack?.dataPoints;
        if (res) {
            res.status(200).json(bundle);
        } else return bundle.data;
    } catch (err) {
        logger.log(
            ` ANALYTICS CONTROLLER ================== ${JSON.stringify(err)}`
        );
        if (res)
            res.status(500).json({
                message: err,
            });
        else throw err;
    }
};

/**
 * 
 * @param {*} req 
 * @param {import("express").Response} res 
 */
const fetchTradeEntitiesFactorsComposition = (req, res) => {
    let payload = req.body;
    let workspaceBucket = payload.workspaceBucket
        ? payload.workspaceBucket
        : null;
    let workspaceEntitiesCount = payload.workspaceEntitiesCount
        ? payload.workspaceEntitiesCount
        : null;

    let pageKey = payload.draw && payload.draw != 0 ? payload.draw : null;
    let offset = null;
    let limit = null;
    //Datatable JS Mode
    if (pageKey != null) {
        offset = payload.start != null ? payload.start : 0;
        limit = payload.length != null ? payload.length : 10;
    } else {
        offset = payload.offset != null ? payload.offset : 0;
        limit = payload.limit != null ? payload.limit : 10;
    }
    payload.offset = offset;
    payload.limit = limit;
    const dataBucket = workspaceBucket;

    AnalyticsModel.findTradeFactorCompositionByEntityAggregationEngine(
        payload,
        dataBucket,
        (error, analyticsData) => {
            if (error) {
                logger.log(
                    ` ANALYTICS CONTROLLER ================== ${JSON.stringify(error)}`
                );
                res.status(500).json({
                    message: error,
                });
            } else {
                analyticsData.chart = payload.chart;
                analyticsData.specification = payload.specification;
                let analyticsDataPack = AnalyticsSchema.processAggregationResult(analyticsData);

                let bundle = {};

                if (!analyticsDataPack?.dataPoints) {
                    bundle.recordsTotal = 0;
                    bundle.recordsFiltered = 0;
                    bundle.error = "Unrecognised Shipments Response"; //Show if to be interpreted as error on client-side
                } else {
                    let recordsFiltered = analyticsDataPack?.dataPoints?.length;
                    bundle.recordsTotal =
                        workspaceEntitiesCount != null
                            ? workspaceEntitiesCount
                            : recordsFiltered;
                    bundle.recordsFiltered =
                        workspaceEntitiesCount != null
                            ? workspaceEntitiesCount
                            : recordsFiltered;
                }

                if (pageKey) {
                    bundle.draw = pageKey;
                }
                bundle.data = analyticsDataPack.dataPoints;
                res.status(200).json(bundle);
            }
        }
    );
};

const workspaceAnalyticsADX = {
    fetchChronologicalTradeFactorsCorrelation_ADX: fetchChronologicalTradeFactorsCorrelation,
    fetchChronologicalTradeEntitiesComparison_ADX: fetchChronologicalTradeEntitiesComparison,
    fetchChronologicalTradeEntitiesDistribution_ADX: fetchChronologicalTradeEntitiesDistribution,
    fetchTradeEntitiesFactorsCorrelation_ADX: fetchTradeEntitiesFactorsCorrelation,
    fetchTradeEntitiesFactorsContribution_ADX: fetchTradeEntitiesFactorsContribution,
    fetchTradeEntitiesFactorsPeriodization_ADX: fetchTradeEntitiesFactorsPeriodization,
    fetchTradeEntitiesFactorsComposition_ADX: fetchTradeEntitiesFactorsComposition,
}

module.exports = workspaceAnalyticsADX;
