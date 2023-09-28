// @ts-check
const TAG = 'analyticsSchema';


const AnalyticsCorrelationSchema = require('./analytics/analyticsCorrelationSchema');
const AnalyticsDistributionSchema = require('./analytics/analyticsDistributionSchema');
const AnalyticsComparisonSchema = require('./analytics/analyticsComparisonSchema');
const AnalyticsContributionSchema = require('./analytics/analyticsContributionSchema');
const AnalyticsPeriodisationSchema = require('./analytics/analyticsPeriodisationSchema');
const AnalyticsCompositionSchema = require('./analytics/analyticsCompositionSchema');

const ANALYTICS_SPECIFICATION_TYPE_SUMMARY = "ANALYTICS_SUMMARY";
const ANALYTICS_SPECIFICATION_TYPE_CORRELATION = "ANALYTICS_CORRELATION";
const ANALYTICS_SPECIFICATION_TYPE_DISTRIBUTION = "ANALYTICS_DISTRIBUTION";
const ANALYTICS_SPECIFICATION_TYPE_COMPARISON = "ANALYTICS_COMPARISON";
const ANALYTICS_SPECIFICATION_TYPE_CONTRIBUTION = "ANALYTICS_CONTRIBUTION";
const ANALYTICS_SPECIFICATION_TYPE_PERIODISATION = "ANALYTICS_PERIODISATION";
const ANALYTICS_SPECIFICATION_TYPE_COMPOSITION = "ANALYTICS_COMPOSITION";

const buildAggregationPipeline = (data) => {

    let aggregationExpression = null;
    switch (data.specification.type) {
        case ANALYTICS_SPECIFICATION_TYPE_SUMMARY: {
            break;
        }
        case ANALYTICS_SPECIFICATION_TYPE_CORRELATION: {
            aggregationExpression = AnalyticsCorrelationSchema.classifyAggregationPipelineFormulator(data);
            break;
        }
        case ANALYTICS_SPECIFICATION_TYPE_DISTRIBUTION: {
            aggregationExpression = AnalyticsDistributionSchema.classifyAggregationPipelineFormulator(data);
            break;
        }
        case ANALYTICS_SPECIFICATION_TYPE_COMPARISON: {
            aggregationExpression = AnalyticsComparisonSchema.classifyAggregationPipelineFormulator(data);
            break;
        }
        case ANALYTICS_SPECIFICATION_TYPE_CONTRIBUTION: {
            aggregationExpression = AnalyticsContributionSchema.classifyAggregationPipelineFormulator(data);
            break;
        }
        case ANALYTICS_SPECIFICATION_TYPE_PERIODISATION: {
            aggregationExpression = AnalyticsPeriodisationSchema.classifyAggregationPipelineFormulator(data);
            break;
        }
        case ANALYTICS_SPECIFICATION_TYPE_COMPOSITION: {
            aggregationExpression = AnalyticsCompositionSchema.classifyAggregationPipelineFormulator(data);
            break;
        }
        default: {
            break;
        }
    }
    //
    return aggregationExpression;
};



/**
 * 
 * @param {*} data --> request body
 * @returns 
 */
const buildAggregationPipelineADX = (data) => {
    let aggregationExpression = null;
    switch (data.specification.type) {
        case ANALYTICS_SPECIFICATION_TYPE_SUMMARY: {
            break;
        }
        case ANALYTICS_SPECIFICATION_TYPE_CORRELATION: {
            aggregationExpression = AnalyticsCorrelationSchema.classifyAggregationPipelineFormulator(data);
            break;
        }
        case ANALYTICS_SPECIFICATION_TYPE_DISTRIBUTION: {
            aggregationExpression = AnalyticsDistributionSchema.classifyAggregationPipelineFormulator(data);
            break;
        }
        case ANALYTICS_SPECIFICATION_TYPE_COMPARISON: {
            aggregationExpression = AnalyticsComparisonSchema.classifyAggregationPipelineFormulator(data);
            break;
        }
        case ANALYTICS_SPECIFICATION_TYPE_CONTRIBUTION: {
            aggregationExpression = AnalyticsContributionSchema.classifyAggregationPipelineFormulator(data);
            break;
        }
        case ANALYTICS_SPECIFICATION_TYPE_PERIODISATION: {
            aggregationExpression = AnalyticsPeriodisationSchema.classifyAggregationPipelineFormulator(data);
            break;
        }
        case ANALYTICS_SPECIFICATION_TYPE_COMPOSITION: {
            aggregationExpression = AnalyticsCompositionSchema.classifyAggregationPipelineFormulator(data);
            break;
        }
        default: {
            break;
        }
    }
    //
    return aggregationExpression;
};



const processAggregationResult = (data) => {

    let aggregationProcessedResult = null;
    switch (data.specification.type) {
        case ANALYTICS_SPECIFICATION_TYPE_SUMMARY: {
            break;
        }
        case ANALYTICS_SPECIFICATION_TYPE_CORRELATION: {
            aggregationProcessedResult = AnalyticsCorrelationSchema.classifyAggregationResultFormulator(data);
            break;
        }
        case ANALYTICS_SPECIFICATION_TYPE_DISTRIBUTION: {
            aggregationProcessedResult = AnalyticsDistributionSchema.classifyAggregationResultFormulator(data);
            break;
        }
        case ANALYTICS_SPECIFICATION_TYPE_COMPARISON: {
            aggregationProcessedResult = AnalyticsComparisonSchema.classifyAggregationResultFormulator(data);
            break;
        }
        case ANALYTICS_SPECIFICATION_TYPE_CONTRIBUTION: {
            aggregationProcessedResult = AnalyticsContributionSchema.classifyAggregationResultFormulator(data);
            break;
        }
        case ANALYTICS_SPECIFICATION_TYPE_PERIODISATION: {
            aggregationProcessedResult = AnalyticsPeriodisationSchema.classifyAggregationResultFormulator(data);
            break;
        }
        case ANALYTICS_SPECIFICATION_TYPE_COMPOSITION: {
            aggregationProcessedResult = AnalyticsCompositionSchema.classifyAggregationResultFormulator(data);
            break;
        }
        default: {
            break;
        }
    }
    return aggregationProcessedResult;
};

module.exports = {
    buildAggregationPipeline,
    processAggregationResult,
    buildAggregationPipelineADX
};
