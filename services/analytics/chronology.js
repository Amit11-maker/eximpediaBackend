// @ts-check

const kustoClient = require("../../db/adxDbHandler");
const AnalyticsModel = require("../../models/analyticsModel");
const { mapAdxRowsAndColumns } = require("../../models/tradeModel");
const AnalyticsSchema = require("../../schemas/analyticsSchema");
const sendResponse = require("../SendResponse.util");
const getLoggerInstance = require("../logger/Logger");
const { WORKSPACE_ID } = require("../workspace/constants");


const fetchChronologicalTradeFactorsCorrelation = async (req, res) => {
    try {
        let payload = req.body;
        let workspaceBucket = payload.workspaceBucket ? payload.workspaceBucket : null;
        let analyticsTimeBoundary = payload.timeBoundaryRange ? payload.timeBoundaryRange : null;

        const dataBucket = workspaceBucket;

        let aggregationExpression = AnalyticsSchema.buildAggregationPipeline(payload);

        let query = convertElasticsearchToADX_KQL(aggregationExpression)

        if (query != "") {
            query = `indiaExport2023WP | summarize ${query}`

            let factorPlotPoints = []
            let results = await kustoClient.execute(String(process.env.AdxDbName), query);
            let data = mapAdxRowsAndColumns(results.primaryResults[0]._rows, results.primaryResults[0].columns);
            console.log(data);
            Object.keys(data[0]).forEach((key) => {
                let plot = {
                    factor: "QUANTITY",
                    plotPoints: [data[0][key]]
                }
                factorPlotPoints.push(plot)
            })

            return sendResponse(res, 200, { data: { factorPlotPoints } })

        }


        AnalyticsModel.findTradeFactorCorrelationByTimeAggregationEngine(
            payload,
            "india_export_2023",
            (error, analyticsData) => {
                if (error) {
                    res.status(500).json({
                        message: error,
                    });
                } else {
                    analyticsData.boundaryRange = analyticsTimeBoundary; //boundaryRange
                    analyticsData.chart = payload.chart;
                    analyticsData.specification = payload.specification;
                    let analyticsDataPack = AnalyticsSchema.processAggregationResult(analyticsData);

                    res.status(200).json({
                        data: analyticsDataPack,
                    });
                }
            }
        );
    } catch (error) {
        let { errorMessage } = getLoggerInstance(error, __filename);
        console.log(errorMessage);
    }
};

function convertElasticsearchToADX_KQL(elasticsearchQuery) {
    // Start building the ADX KQL query
    let adxKqlQuery = '';

    if (elasticsearchQuery?.aggs?.correlationAnalysis?.aggs?.plot?.aggs) {
        adxKqlQuery += buildAggregationExpression(elasticsearchQuery?.aggs?.correlationAnalysis?.aggs?.plot?.aggs)
    } else if (elasticsearchQuery?.aggs?.comparisonAnalysis?.aggs?.plot?.aggs) {
        adxKqlQuery += buildAggregationExpression(elasticsearchQuery?.aggs?.comparisonAnalysis?.aggs?.plot?.aggs)
    }

    return adxKqlQuery;
}

function buildAggregationExpression(aggObject) {
    let finalQuery = ""
    let isLast = false;
    let index = 0;
    for (let key of Object.keys(aggObject)) {
        const aggType = Object.keys(aggObject[key])[0];
        let aggField = aggObject[key][aggType].field?.split(".")[0];

        if (aggField == "id") {
            aggField = WORKSPACE_ID
        }

        if (index == Object.keys(aggObject).length - 1) {
            isLast = true;
        }

        switch (aggType) {
            case 'sum':

                if (!isLast && index > 0 && finalQuery !== '') {
                    finalQuery += ",";
                }
                finalQuery += `${key}= sum(${aggField}) `;
                index++;

                continue;
            case 'avg':
                if (!isLast && index > 0 && finalQuery !== '') {
                    finalQuery += ",";
                }

                finalQuery += `${key}= avg(${aggField}) `;
                index++;

                continue;
            case 'cardinality':
                if (!isLast && index > 0 && finalQuery !== '') {
                    finalQuery += ",";
                }
                finalQuery += `${key}= count_distinct(${aggField}) `;
                index++;

                continue;
            case 'bucket_script':
            // const bucketsPath = aggObject[key][aggType]?.buckets_path;
            // const script = aggObject[key][aggType]?.script;
            // finalQuery += `(${buildAggregationExpression(bucketsPath?.totalPrice)}) / (${buildAggregationExpression(
            //     bucketsPath.totalQuantity
            // )}) * ${script},`;
            // Add more aggregation types as needed
        }
    }
    return finalQuery;
}


module.exports = {
    fetchChronologicalTradeFactorsCorrelationAdx: fetchChronologicalTradeFactorsCorrelation
}
