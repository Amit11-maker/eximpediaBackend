const { queryCreator } = require("../helpers/recordQueryHelper");
const { logger } = require("../config/logger");
const ElasticsearchDbQueryBuilderHelper = require("./../helpers/elasticsearchDbQueryBuilderHelper");
const ElasticsearchDbHandler = require("../db/elasticsearchDbHandler");
const TradeSchema = require('../schemas/tradeSchema');

async function findAnalysisRecords(payload) {
    try {
        let aggregationParams = payload;

        const tradeType = payload.tradeType
            ? payload.tradeType.trim().toUpperCase()
            : null;

        let country = payload.country
            ? payload.country.trim().toUpperCase()
            : null;

        const dataBucket = TradeSchema.deriveDataBucket(tradeType, country);
        const userId = payload.userId ? payload.userId.trim() : null;
        const accountId = payload.accountId ? payload.accountId.trim() : null;
        const totalRecordCount = payload.length ? payload.length : null;
        const offset = payload.start ;

        const countryCode = payload.countryCode
            ? payload.countryCode.trim().toUpperCase()
            : null;

        const tradeYear = payload.tradeYear ? payload.tradeYear : null;

        const recordPurchasedParams = {
            tradeType: tradeType,
            countryCode: countryCode,
            tradeYear: tradeYear,
        }

        payload = {
            aggregationParams,
            tradeType,
            country,
            dataBucket,
            userId,
            accountId,
            recordPurchasedParams,
            tradeRecordSearch: true,
            offset
        }

        let batchSize = 25000;

        const allRecords = []

        payload.limit = batchSize;
        for (let i = 0; i < totalRecordCount; i += batchSize) {
            payload.offset = payload.offset + i;
            let resultArr = await getAnalysisSearchData(payload);
            allRecords.push(resultArr[0]);
        }

        const results = await Promise.all(allRecords);
        let mappedResult = {
            RECORD_SET: []
        };
        let idArr = [];

        for (let idx = 0; idx < results.length; idx++) {
            let result = results[idx];
            result?.body?.hits?.hits.forEach((hit) => {
                mappedResult.RECORD_SET.push(
                    hit._source
                );
            });
        }
        mappedResult["idArr"] = idArr;

        return mappedResult ? mappedResult : null;
    } catch (error) {
        logger.log(`TRADE MODEL == ${JSON.stringify(error)}`);
        throw error;
    }
}

const getAnalysisSearchData = async (payload) => {
    try {
        payload = await ElasticsearchDbQueryBuilderHelper.addAnalyzer(payload, payload.dataBucket);
        let clause = queryCreator(payload);
        if (Object.keys(clause.query).length === 0) {
            delete clause.query
        }

        let resultArr = [];
        let aggregationExpression = {
            from: clause.offset,
            size: clause.limit,
            query: clause.query
        }

        resultArr.push(
            ElasticsearchDbHandler.dbClient.search({
                index: payload.dataBucket,
                track_total_hits: true,
                body: aggregationExpression
            })
        );

        return resultArr;
    } catch (err) {
        throw err;
    }
}

module.exports = {
    findAnalysisRecords
}