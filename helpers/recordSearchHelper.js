const TAG = "tradeModel";

const RecordQueryHelper = require("../helpers/recordQueryHelper")
const ObjectID = require("mongodb").ObjectID;
const ElasticsearchDbQueryBuilderHelper = require('./../helpers/elasticsearchDbQueryBuilderHelper');
const ElasticsearchDbHandler = require("../db/elasticsearchDbHandler");
const TradeSchema = require("../schemas/tradeSchema");
const ActivityModel = require("../models/activityModel");

var rison = require('rison');

const SEPARATOR_UNDERSCORE = "_";
const recordLimit = 400000;

const TRADE_SHIPMENT_RESULT_TYPE_RECORDS = "SEARCH_RECORDS";
const TRADE_SHIPMENT_RESULT_TYPE_PAGINATED_RECORDS = "PAGINATED_RECORDS";
const TRADE_SHIPMENT_RESULT_TYPE_FILTER_RECORDS = "FILTER_RECORDS";

const getQueryCount = async (query, dataBucket) => {
    try {
        const countQuery = { query: query.query }
        let result = await ElasticsearchDbHandler.dbClient.count({
            index: dataBucket,
            body: countQuery,
        });

        return result.body.count
    } catch (error) {
        throw error
    }
}

async function addQueryToActivityTrackerForUser(aggregationParams, accountId, userId, tradeType, country, queryResponseTime) {

    var explore_search_query_input = {
        query: JSON.stringify(aggregationParams.matchExpressions),
        account_id: ObjectID(accountId),
        user_id: ObjectID(userId),
        tradeType: tradeType,
        country: country,
        queryResponseTime: queryResponseTime,
        isWorkspaceQuery: false,
        created_ts: Date.now(),
        modified_ts: Date.now()
    }

    try {
        await ActivityModel.addActivity(explore_search_query_input);
    }
    catch (error) {
        throw error;
    }
}

const getSearchData = async (payload) => {
    try {
        let count = 0;
        const startQueryTime = new Date();
        payload = await ElasticsearchDbQueryBuilderHelper.addAnalyzer(payload, payload.dataBucket)
        let clause = TradeSchema.formulateShipmentRecordsAggregationPipelineEngine(payload);
        if (Object.keys(clause.query).length === 0) {
            delete clause.query
        }
        let isCount = false;
        let resultArr = [];
        if (payload.tradeRecordSearch) {
            let aggregationExpressionArr = [];
            let aggregationExpression = {
                from: clause.offset,
                size: clause.limit,
                sort: clause.sort,
                query: clause.query,
                aggs: {}
            }
            aggregationExpressionArr.push({ ...aggregationExpression });
            aggregationExpression = {
                from: clause.offset,
                size: 0,
                sort: clause.sort,
                query: clause.query,
                aggs: {}
            }
            for (let agg in clause.aggregation) {
                count += 1;
                aggregationExpression.aggs[agg] = clause.aggregation[agg];

                aggregationExpressionArr.push({ ...aggregationExpression });
                aggregationExpression = {
                    from: clause.offset,
                    size: 0,
                    sort: clause.sort,
                    query: clause.query,
                    aggs: {},
                }
            }


            for (let query of aggregationExpressionArr) {
                // if (Object.keys(query.aggs).length === 0) {
                //     const queryCount = await getQueryCount(query, payload.dataBucket);
                //     if (queryCount >= recordLimit) {
                //         resultArr.push({ message: "More than 4Lakhs records , please optimize your search." })
                //         isCount = true;
                //         break;
                //     }
                // }
                // ? this is the function 
                resultArr.push(
                    ElasticsearchDbHandler.dbClient.search({
                        index: payload.dataBucket,
                        track_total_hits: true,
                        body: query,
                    })
                );
            }
        } else {

            let aggregationExpression = {
                from: clause.offset,
                size: clause.limit,
                sort: clause.sort,
                query: clause.query,
                aggs: clause.aggregation,
            };
            //

            resultArr.push(
                ElasticsearchDbHandler.getDbInstance().search({
                    index: payload.dataBucket,
                    track_total_hits: true,
                    body: aggregationExpression,
                })
            )
        }
        if (isCount) {
            return resultArr
        } else {
            let mappedResult = {};
            let idArr = [];

            for (let idx = 0; idx < resultArr.length; idx++) {
                let result = await resultArr[idx];
                if (idx == 0) {
                    mappedResult[TradeSchema.RESULT_PORTION_TYPE_SUMMARY] = [
                        {
                            _id: null,
                            count: result.body.hits.total.value,
                        },
                    ];
                    mappedResult[TradeSchema.RESULT_PORTION_TYPE_RECORDS] = [];
                    result.body.hits.hits.forEach((hit) => {
                        let buyerData = hit._source;
                        buyerData._id = hit._id;
                        idArr.push(hit._id);
                        mappedResult[TradeSchema.RESULT_PORTION_TYPE_RECORDS].push(
                            buyerData
                        );
                    });
                }
                for (const prop in result.body.aggregations) {
                    if (result.body.aggregations.hasOwnProperty(prop)) {

                        if (prop.indexOf("SUMMARY") === 0 && result.body.aggregations[prop].value) {
                            mappedResult[prop] = result.body.aggregations[prop].value;
                        }

                    }
                }
            }
            mappedResult["idArr"] = idArr;

            if (payload.tradeRecordSearch) {
                mappedResult["risonQuery"] = encodeURI(rison.encode(JSON.parse(JSON.stringify({ "query": clause.query }))).toString());
                const endQueryTime = new Date();

                const queryTimeResponse = (endQueryTime.getTime() - startQueryTime.getTime()) / 1000;
                if (payload.aggregationParams.resultType === TRADE_SHIPMENT_RESULT_TYPE_RECORDS) {
                    await addQueryToActivityTrackerForUser(payload.aggregationParams, payload.accountId, payload.userId, payload.tradeType, payload.country, queryTimeResponse);
                }
            }

            return mappedResult ? mappedResult : null;
        }
    } catch (err) {
        throw err;
    }

}

const getFilterData = async (payload) => {
    try {
        let count = 0;

        payload = await ElasticsearchDbQueryBuilderHelper.addAnalyzer(payload, payload.dataBucket)
        let clause = TradeSchema.formulateShipmentFiltersAggregationPipelineEngine(payload);
        if (Object.keys(clause.query).length === 0) {
            delete clause.query
        }
        let isCount = false;
        let resultArr = [];
        if (payload.tradeRecordSearch) {
            let aggregationExpressionArr = [];
            let aggregationExpression = {
                size: clause.limit,
                sort: clause.sort,
                query: clause.query,
                aggs: {}
            }
            aggregationExpressionArr.push({ ...aggregationExpression });
            aggregationExpression = {
                size: 0,
                sort: clause.sort,
                query: clause.query,
                aggs: {}
            }
            for (let agg in clause.aggregation) {
                count += 1;
                aggregationExpression.aggs[agg] = clause.aggregation[agg];

                aggregationExpressionArr.push({ ...aggregationExpression });
                aggregationExpression = {
                    size: 0,
                    sort: clause.sort,
                    query: clause.query,
                    aggs: {},
                }
            }


            for (let query of aggregationExpressionArr) {
                if (Object.keys(query.aggs).length === 0) {
                    const queryCount = await getQueryCount(query, payload.dataBucket);
                    if (queryCount >= recordLimit) {
                        resultArr.push({ message: "More than 4Lakhs records , please optimize your search." })
                        isCount = true;
                        break;
                    }
                }
                resultArr.push(
                    ElasticsearchDbHandler.dbClient.search({
                        index: payload.dataBucket,
                        track_total_hits: true,
                        body: query,
                    })
                );
            }
        } else {

            let aggregationExpression = {
                size: clause.limit,
                sort: clause.sort,
                query: clause.query,
                aggs: clause.aggregation,
            };
            //

            resultArr.push(
                ElasticsearchDbHandler.getDbInstance().search({
                    index: payload.dataBucket,
                    track_total_hits: true,
                    body: aggregationExpression,
                })
            )
        }
        if (isCount) {
            return resultArr
        } else {
            let mappedResult = {};

            for (let idx = 0; idx < resultArr.length; idx++) {
                let result = await resultArr[idx];
                for (const prop in result.body.aggregations) {
                    if (result.body.aggregations.hasOwnProperty(prop)) {
                        if (prop.indexOf("FILTER") === 0) {
                            let mappingGroups = [];
                            //let mappingGroupTermCount = 0;
                            let groupExpression = payload.aggregationParams.groupExpressions.filter(
                                (expression) => expression.identifier == prop
                            )[0];

                            if (groupExpression.isFilter) {
                                if (result.body.aggregations[prop].buckets) {
                                    result.body.aggregations[prop].buckets.forEach((bucket) => {
                                        if (
                                            bucket.doc_count != null &&
                                            bucket.doc_count != undefined
                                        ) {
                                            let groupedElement = {
                                                _id:
                                                    bucket.key_as_string != null &&
                                                        bucket.key_as_string != undefined
                                                        ? bucket.key_as_string
                                                        : bucket.key,
                                                count: bucket.doc_count,
                                                totalSum: bucket?.totalSum?.value
                                            };

                                            if (
                                                bucket.minRange != null &&
                                                bucket.minRange != undefined &&
                                                bucket.maxRange != null &&
                                                bucket.maxRange != undefined
                                            ) {
                                                groupedElement.minRange = bucket.minRange.value;
                                                groupedElement.maxRange = bucket.maxRange.value;
                                            }

                                            mappingGroups.push(groupedElement);
                                        }
                                    });
                                }

                                let propElement = result.body.aggregations[prop];
                                if (
                                    propElement.min != null &&
                                    propElement.min != undefined &&
                                    propElement.max != null &&
                                    propElement.max != undefined
                                ) {
                                    let groupedElement = {};
                                    if (propElement.meta != null && propElement.meta != undefined) {
                                        groupedElement = propElement.meta;
                                    }
                                    groupedElement._id = null;
                                    groupedElement.minRange = propElement.min;
                                    groupedElement.maxRange = propElement.max;
                                    groupedElement.totalSum = propElement.sum
                                    mappingGroups.push(groupedElement);
                                }
                                mappedResult[prop] = mappingGroups;
                            }
                        }
                    }

                    // Temporary condition for foreign port empty field removal ,
                    // will change as per use-case in furture
                    if (prop === "FILTER_FOREIGN_PORT") {
                        for (let result of mappedResult[prop]) {
                            if (result._id === "") {
                                let index = mappedResult[prop].indexOf(result);
                                if (index > -1) {
                                    mappedResult[prop].splice(index, 1);
                                }
                            }
                        }
                    }
                }
            }

            return mappedResult ? mappedResult : null;
        }
    } catch (err) {
        throw err;
    }

}
const getRecommendationDataByValue = async (payload) => {
    try {
        payload = await ElasticsearchDbQueryBuilderHelper.addAnalyzer(payload, payload.dataBucket);
        let clause = RecordQueryHelper.queryRecommendationByValueCreator(payload);

        let resultArr = [];

        let aggregationExpressionArr = [];
        let aggregationExpression = {
            size: clause.limit,
            sort: clause.sort,
            query: clause.query
        }

        aggregationExpressionArr.push({ ...aggregationExpression });

        for (let query of aggregationExpressionArr) {
            resultArr.push(
                ElasticsearchDbHandler.dbClient.search({
                    index: payload.dataBucket,
                    track_total_hits: true,
                    body: query,
                })
            );
        }

        let mappedResult = {}

        for (let idx = 0; idx < resultArr.length; idx++) {
            let result = await resultArr[idx];
            mappedResult[TradeSchema.RESULT_PORTION_TYPE_RECORDS] = [];
            const dataObj = []
            result.body.hits.hits.forEach((hit) => {
                let buyerData = hit._source[(payload?.aggregationParams?.groupExpressions?.find(o => (o.alias === 'BUYER')))?.fieldTerm];
                let buyerFieldTerm = payload?.aggregationParams?.groupExpressions?.find(o => (o.alias === 'BUYER'))?.fieldTerm;
                if (dataObj?.length <= 6 && !dataObj.includes(buyerFieldTerm + " ##$$## " + buyerData) && buyerData?.length > 0) {
                    dataObj.push(buyerFieldTerm + " ##$$## " + buyerData);
                }

                let sellerData = hit._source[(payload?.aggregationParams?.groupExpressions?.find(o => (o.alias === 'SELLER')))?.fieldTerm];
                let sellerFieldTerm = payload?.aggregationParams?.groupExpressions.find(o => (o.alias === 'SELLER'))?.fieldTerm;

                if (dataObj?.length <= 6 && !dataObj.includes(sellerFieldTerm + " ##$$## " + sellerData) && sellerData?.length > 0) {
                    dataObj.push(sellerFieldTerm + " ##$$## " + sellerData);
                }

            });
            mappedResult[TradeSchema.RESULT_PORTION_TYPE_RECORDS].push(
                dataObj
            );
        }

        return mappedResult ? mappedResult : null;

    } catch (err) {
        throw err;
    }

}

module.exports = {
    getSearchData,
    getFilterData,
    getRecommendationDataByValue,
    addQueryToActivityTrackerForUser
}
