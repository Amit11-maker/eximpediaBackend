const TAG = "marketAnalyticsModel";
const MongoDbHandler = require("../db/mongoDbHandler");
const ElasticsearchDbHandler = require("../db/elasticsearchDbHandler");
const TradeSchema = require("../schemas/tradeSchema");
const rison = require('rison');

function searchingColumns(tradeType) {
    let searchingColumns = {}
    if (tradeType == "IMPORT") {
        searchingColumns = {
            searchField: "IMPORTER_NAME",
            dateColumn: "IMP_DATE",
            unitColumn: "STD_UNIT",
            priceColumn: "TOTAL_ASSESS_USD",
            quantityColumn: "STD_QUANTITY",
            portColumn: "INDIAN_PORT",
            countryColumn: "ORIGIN_COUNTRY",
            sellerName: "SUPPLIER_NAME",
            buyerName: "IMPORTER_NAME",
            codeColumn: "HS_CODE",
            shipmentColumn: "DECLARATION_NO",
            codeColumn4: "HS_CODE_4",
            iec: "IEC"
        }
    }
    else if (tradeType == "EXPORT") {
        searchingColumns = {
            searchField: "EXPORTER_NAME",
            dateColumn: "EXP_DATE",
            unitColumn: "STD_UNIT",
            priceColumn: "FOB_USD",
            quantityColumn: "STD_QUANTITY",
            portColumn: "INDIAN_PORT",
            countryColumn: "COUNTRY",
            sellerName: "BUYER_NAME",
            buyerName: "EXPORTER_NAME",
            codeColumn: "HS_CODE",
            foreignportColumn: "FOREIGN_PORT",
            shipmentColumn: "DECLARATION_NO",
            codeColumn4: "HS_CODE_4",
            iec: "IEC"
        }
    }
    return searchingColumns;
}

const tradeMetaFunction = (tradeType, originCountry) => {
    
    let tradeMeta = TradeSchema.deriveDataBucket(tradeType,originCountry);
    return tradeMeta
}

async function getHsCodeDescription(filterClause) {
    let description = await MongoDbHandler.getDbInstance()
        .collection(MongoDbHandler.collections.hs_code_description_mapping)
        .find({ "hs_code": filterClause })
        .project({
            'description': 1
        }).toArray();
    return description;
}

const findTopCompany = async (searchTerm, tradeMeta, startDate, endDate, searchingColumns, offset, limit, Expression) => {
    try {
        let recordSize = 0;
        let aggregationExpression = {
            // setting size as one to get address of the company
            size: recordSize,
            query: {
                bool: {
                    must: [],
                    should: [],
                    filter: [],
                    must_not: []
                },
            },
            aggs: {},
        }

        let matchExpression = {}
        matchExpression.bool = {
            should: []
        }
        matchExpression.bool.should.push({
            match: {
                [searchingColumns.countryColumn]: {
                    "query": searchTerm,
                    "operator": "and"
                }
            }
        });
        aggregationExpression.query.bool.must.push({ ...matchExpression });

        let rangeQuery = {
            range: {}
        }
        rangeQuery.range[searchingColumns.dateColumn] = {
            gte: startDate,
            lte: endDate,
        }

        aggregationExpression.query.bool.must.push({ ...rangeQuery });

        if (Expression) {

            for (let i = 0; i < Expression.length; i++) {
                if (Expression[i].identifier == 'FILTER_HS_CODE') {
                    let filterMatchExpression = {}

                    filterMatchExpression.terms = {
                        [searchingColumns.codeColumn]: Expression[i].fieldValue,
                    }
                    aggregationExpression.query.bool.must.push({ ...filterMatchExpression });
                } else if (Expression[i].identifier == 'FILTER_FOREIGN_PORT') {
                    let filterMatchExpression = {}
                    filterMatchExpression.bool = {
                        should: []
                    }
                    for (let j = 0; j < Expression[i].fieldValue.length; j++) {
                        filterMatchExpression.bool.should.push({
                            match: {
                                [searchingColumns.foreignportColumn]: {
                                    "operator": "and",
                                    "query": Expression[i].fieldValue[j]
                                }
                            }
                        });
                    }

                    aggregationExpression.query.bool.must.push({ ...filterMatchExpression });
                } else if (Expression[i].identifier == 'FILTER_PORT') {
                    let filterMatchExpression = {}
                    filterMatchExpression.bool = {
                        should: []
                    }
                    for (let j = 0; j < Expression[i].fieldValue.length; j++) {
                        filterMatchExpression.bool.should.push({
                            match: {
                                [searchingColumns.portColumn]: {
                                    "operator": "and",
                                    "query": Expression[i].fieldValue[j]
                                }
                            }
                        });
                    }

                    aggregationExpression.query.bool.must.push({ ...filterMatchExpression });
                }
            }
        }
        let risonQuery = encodeURI(rison.encode(JSON.parse(JSON.stringify({ "query": aggregationExpression.query }))).toString());

        summaryTopCompanyAggregation(aggregationExpression, searchingColumns, offset, limit);

        try {
            let result = await ElasticsearchDbHandler.dbClient.search({
                index: tradeMeta,
                track_total_hits: true,
                body: aggregationExpression,
            });
            const data = getResponseDataForCompany(result, false);

            return [data,risonQuery];
        } catch (error) {
            throw error;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }

}

const findTopCountry = async (searchTerm, tradeMeta, startDate, endDate, searchingColumns, offset, limit) => {
    try {
        let recordSize = 1;
        let aggregationExpression = {
            // setting size as one to get address of the company
            size: recordSize,
            _source: [searchingColumns.address],
            query: {
                bool: {
                    must: [],
                    should: [],
                    filter: [],
                    must_not: []
                },
            },
            aggs: {},
        }

        let companyExpression = {}
        let companyName = []
        companyName.push(searchTerm);
        companyExpression.terms = {
            [searchingColumns.searchField + ".keyword"]: companyName,
        }
        aggregationExpression.query.bool.must.push({ ...companyExpression });

        let rangeQuery = {
            range: {}
        }

        rangeQuery.range[searchingColumns.dateColumn] = {
            gte: startDate,
            lte: endDate,
        }

        aggregationExpression.query.bool.must.push({ ...rangeQuery });

        summaryTopCountryAggregation(aggregationExpression, searchingColumns, offset, limit);

        try {
            let result = await ElasticsearchDbHandler.dbClient.search({
                index: tradeMeta,
                track_total_hits: true,
                body: aggregationExpression,
            });
            const data = getResponseDataForCompany(result);
            let company_address = "";
            if (tradeMeta.tradeType == "IMPORT") {
                company_address = result.body.hits.hits[0]._source.SUPPLIER_ADDRESS
            } else {
                company_address = result.body.hits.hits[0]._source.BUYER_ADDRESS
            }
            data.companyAddress = company_address;
            return data;
        } catch (error) {
            throw error;
        }
    }
    catch (error) {
        console.log(error);
        throw error;
    }

}

const findAllUniqueCountries = async (payload) => {
    let tradeType = payload.tradeType.trim().toUpperCase();
    const originCountry = payload.originCountry.trim().toUpperCase();
    let tradeMeta = tradeMetaFunction(tradeType, originCountry);
    let searchingColumn = searchingColumns(tradeType);
    try {
        let recordSize = 0;
        let aggregationExpression = {
            // setting size as one to get address of the company
            size: recordSize,
            query: {
                bool: {
                    must: [],
                    should: [],
                    filter: [],
                    must_not: []
                },
            },
            aggs: {},
        }
        findUniqueCountryAggregations(aggregationExpression, searchingColumn);
        try {
            let result = await ElasticsearchDbHandler.dbClient.search({
                index: tradeMeta,
                track_total_hits: true,
                body: aggregationExpression,
            });
            return result;
        } catch (error) {
            throw error;
        }
    } catch (error) {
        JSON.stringify(error);
    }

}

function findUniqueCountryAggregations(aggregationExpression, searchingColumn) {
    aggregationExpression.aggs["UNIQUE_COUNTRIES"] = {
        "terms": {
            "field": searchingColumn.countryColumn + ".keyword",
            "size": 500
        }
    }
}

const findAllDataForCompany = async (company_name, searchTerm, tradeMeta, startDate, endDate, searchingColumns, Expression) => {
    try {
        let recordSize = 0;
        let aggregationExpression = {
            // setting size as one to get address of the company
            size: recordSize,
            query: {
                bool: {
                    must: [],
                    should: [],
                    filter: [],
                    must_not: []
                },
            },
            aggs: {},
        }

        let matchExpression = {
            bool: {
                should: []
            }
        }
        matchExpression.bool.should.push({
            match: {
                [searchingColumns.countryColumn]: {
                    "query": searchTerm,
                    "operator": "and"
                }
            }
        });
        aggregationExpression.query.bool.must.push({ ...matchExpression });


        let companyExpression = {}
        companyExpression.terms = {
            [searchingColumns.searchField + ".keyword"]: company_name,
        }
        aggregationExpression.query.bool.must.push({ ...companyExpression });

        let rangeQuery = {
            range: {}
        }
        rangeQuery.range[searchingColumns.dateColumn] = {
            gte: startDate,
            lte: endDate,
        }

        aggregationExpression.query.bool.must.push({ ...rangeQuery });

        if (Expression) {

            for (let i = 0; i < Expression.length; i++) {
                if (Expression[i].identifier == 'FILTER_HS_CODE') {
                    let filterMatchExpression = {}

                    filterMatchExpression.terms = {
                        [searchingColumns.codeColumn]: Expression[i].fieldValue,
                    }
                    aggregationExpression.query.bool.must.push({ ...filterMatchExpression });
                } else if (Expression[i].identifier == 'FILTER_FOREIGN_PORT') {
                    let filterMatchExpression = {}
                    filterMatchExpression.bool = {
                        should: []
                    }
                    for (let j = 0; j < Expression[i].fieldValue.length; j++) {
                        filterMatchExpression.bool.should.push({
                            match: {
                                [searchingColumns.foreignportColumn]: {
                                    "operator": "and",
                                    "query": Expression[i].fieldValue[j]
                                }
                            }
                        });
                    }

                    aggregationExpression.query.bool.must.push({ ...filterMatchExpression });
                } else if (Expression[i].identifier == 'FILTER_PORT') {
                    let filterMatchExpression = {}
                    filterMatchExpression.bool = {
                        should: []
                    }
                    for (let j = 0; j < Expression[i].fieldValue.length; j++) {
                        filterMatchExpression.bool.should.push({
                            match: {
                                [searchingColumns.portColumn]: {
                                    "operator": "and",
                                    "query": Expression[i].fieldValue[j]
                                }
                            }
                        });
                    }

                    aggregationExpression.query.bool.must.push({ ...filterMatchExpression });
                }
            }
        }

        summaryCompanyAggregation(aggregationExpression, searchingColumns);
        try {
            let result = await ElasticsearchDbHandler.dbClient.search({
                index: tradeMeta,
                track_total_hits: true,
                body: aggregationExpression,
            });
            const data = getResponseDataForCompany(result, true);

            return data;
        } catch (error) {
            throw error;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }

}


const findAllDataForCountry = async (country_name, searchTerm, tradeMeta, startDate, endDate, searchingColumns, hsCode) => {
    try {
        let recordSize = 0;
        let aggregationExpression = {
            // setting size as one to get address of the company
            size: recordSize,
            query: {
                bool: {
                    must: [],
                    should: [],
                    filter: [],
                    must_not: []
                },
            },
            aggs: {},
        }

        let matchExpression = {
            bool: {
                should: []
            }
        }
        matchExpression.bool.should.push({
            match: {
                [searchingColumns.countryColumn]: {
                    "query": country_name,
                    "operator": "and"
                }
            }
        });
        aggregationExpression.query.bool.must.push({ ...matchExpression });


        let companyExpression = {}
        let companyName = []
        companyName.push(searchTerm);
        companyExpression.terms = {
            [searchingColumns.searchField + ".keyword"]: companyName,
        }
        aggregationExpression.query.bool.must.push({ ...companyExpression });

        let rangeQuery = {
            range: {}
        }
        rangeQuery.range[searchingColumns.dateColumn] = {
            gte: startDate,
            lte: endDate,
        }

        aggregationExpression.query.bool.must.push({ ...rangeQuery });

        summaryCountryAggregation(aggregationExpression, searchingColumns);
        if (hsCode) {
            summaryCountryjAggregation(aggregationExpression, searchingColumns);
        }

        try {
            let result = await ElasticsearchDbHandler.dbClient.search({
                index: tradeMeta,
                track_total_hits: true,
                body: aggregationExpression,
            });
            const data = getResponseDataForCompany(result);

            for (let c = 0; c < data.TOP_HS_CODE.length; c++) {
                let filterClause = data.TOP_HS_CODE[c]._id;
                let description = await MongoDbHandler.getDbInstance()
                    .collection(MongoDbHandler.collections.hs_code_description_mapping)
                    .find({ "hs_code": filterClause })
                    .project({
                        'description': 1
                    }).toArray();

                data.TOP_HS_CODE[c].hS_code_description = description[0]?.description ? description[0].description : "";
            }

            return data;
        } catch (error) {
            throw error;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }

}

////ProductWiseMarketAnalytics/////
const ProductWiseMarketAnalytics = async (payload, startDate, endDate) => {
    let tradeType = payload.tradeType.trim().toUpperCase();
    const originCountry = payload.originCountry.trim().toUpperCase();
    const hsCodeType = payload.hsCodeType ?? 4;
    const bindByCountry = payload.bindByCountry ?? false;
    const bindByPort = payload.bindByPort ?? false;
    const valueFilterRangeFlag = payload.valueFilterRangeFlag ?? false;
    const valueFilterRangeFrom = payload.valueFilterRangeFrom ?? 0;
    const valueFilterRangeTo = payload.valueFilterRangeTo ?? 0;
    const offset = payload.start != null ? payload.start : 0;
    const limit = payload.length != null ? payload.length : 10;
    const fiterAppied = payload.fiterAppied ?? null;
    const shipmentFilterRangeFlag = payload.shipmentFilterRangeFlag ?? false;
    const shipmentFilterRangeFrom = payload.shipmentFilterRangeFrom ?? 0;
    const shipmentFilterRangeTo = payload.shipmentFilterRangeTo ?? 0;
    let tradeMeta = tradeMetaFunction(tradeType, originCountry);
    let searchingColumn = searchingColumns(tradeType);
    try {
        let recordSize = 0;
        let aggregationExpression = {
            // setting size as one to get address of the company
            size: recordSize,
            query: {
                bool: {
                    must: [],
                    should: [],
                    filter: [],
                    must_not: []
                },
            },
            aggs: {},
        }
        let rangeQuery = {
            range: {}
        }
        rangeQuery.range[searchingColumn.dateColumn] = {
            gte: startDate,
            lte: endDate,
        }

        aggregationExpression.query.bool.must.push({ ...rangeQuery });

        if (fiterAppied) {
            for (let i = 0; i < fiterAppied.length; i++) {
                if (fiterAppied[i].identifier == 'FILTER_HS_CODE') {
                    let filterMatchExpression = {}

                    filterMatchExpression.terms = {
                        [searchingColumn.codeColumn]: fiterAppied[i].fieldValue,
                    }
                    aggregationExpression.query.bool.must.push({ ...filterMatchExpression });
                }
            }
        }

        let codeColumn = "";
        if (hsCodeType == 2)
            codeColumn = "HS_CODE_2"
        else if (hsCodeType == 4)
            codeColumn = "HS_CODE_4"
        else {
            codeColumn = "HS_CODE"
        }

        let risonQuery = encodeURI(rison.encode(JSON.parse(JSON.stringify({ "query": aggregationExpression.query }))).toString());

        aggregationResultForCountryVSProduct(aggregationExpression, searchingColumn, limit, codeColumn, offset);

        if (valueFilterRangeFlag) {
            aggregationExpression.aggs.HS_CODES.aggs.PRICE_CONDITION =
            {
                "bucket_selector": {
                    "buckets_path": {
                        "price_field": "PRICE"
                    },
                    "script": `params.price_field < ${valueFilterRangeTo}L && params.price_field > ${valueFilterRangeFrom}L`
                }
            }
        }
        if (bindByCountry) {
            aggregationExpression.aggs.HS_CODES.aggs.COUNTRIES =
            {
                "terms": {
                    "field": searchingColumn.countryColumn + ".keyword"
                },
                "aggs": {
                    "PRICE": {
                        "sum": {
                            "field": searchingColumn.priceColumn + ".double"
                        }
                    },
                    "SHIPMENTS": {
                        "cardinality": {
                            "field": searchingColumn.shipmentColumn + ".keyword"
                        }
                    },
                    "QUANTITY": {
                        "sum": {
                            "field": searchingColumn.quantityColumn + ".double"
                        }
                    }
                }
            }
        }
        if (bindByPort) {
            aggregationExpression.aggs.HS_CODES.aggs.PORTS =
            {
                "terms": {
                    "field": searchingColumn.portColumn + ".keyword"
                },
                "aggs": {
                    "PRICE": {
                        "sum": {
                            "field": searchingColumn.priceColumn + ".double"
                        }
                    },
                    "SHIPMENTS": {
                        "cardinality": {
                            "field": searchingColumn.shipmentColumn + ".keyword"
                        }
                    },
                    "QUANTITY": {
                        "sum": {
                            "field": searchingColumn.quantityColumn + ".double"
                        }
                    }
                }
            }
        }

        if (shipmentFilterRangeFlag) {
            aggregationExpression.aggs.HS_CODES.aggs.SHIPMENT_CONDITION =
            {
                "bucket_selector": {
                    "buckets_path": {
                        "shipment_field": "SHIPMENTS"
                    },
                    "script": `params.shipment_field < ${shipmentFilterRangeTo} && params.shipment_field > ${shipmentFilterRangeFrom}`
                }
            }
        }

        try {
            let result = await ElasticsearchDbHandler.dbClient.search({
                index: tradeMeta,
                track_total_hits: true,
                body: aggregationExpression,
            });
            let res = result.body.aggregations.HS_CODES.buckets;
            for (let c = 0; c < res.length; c++) {
                let filterClause = res[c].key;
                let description = await getHsCodeDescription(filterClause);
                res[c].hS_code_description = description[0]?.description ? description[0].description : "";
            }
            return [result,risonQuery];
        } catch (error) {
            throw error;
        }
    } catch (error) {
        JSON.stringify(error);
        throw error
    }

}

const fetchProductMarketAnalyticsFilters = async (payload, startDate, endDate) => {
    let tradeType = payload.tradeType.trim().toUpperCase();
    const originCountry = payload.originCountry.trim().toUpperCase();
    const valueFilterRangeFlag = payload.valueFilterRangeFlag ?? false;
    const valueFilterRangeFrom = payload.valueFilterRangeFrom ?? 0;
    const valueFilterRangeTo = payload.valueFilterRangeTo ?? 0;
    const fiterAppied = payload.fiterAppied ?? null;
    const shipmentFilterRangeFlag = payload.shipmentFilterRangeFlag ?? false;
    const shipmentFilterRangeFrom = payload.shipmentFilterRangeFrom ?? 0;
    const shipmentFilterRangeTo = payload.shipmentFilterRangeTo ?? 0;
    let tradeMeta = tradeMetaFunction(tradeType, originCountry);
    let searchingColumn = searchingColumns(tradeType);
    try {
        let recordSize = 0;
        let aggregationExpression = {
            // setting size as one to get address of the company
            size: recordSize,
            query: {
                bool: {
                    must: [],
                    should: [],
                    filter: [],
                    must_not: []
                },
            },
            aggs: {},
        }
        let rangeQuery = {
            range: {}
        }
        rangeQuery.range[searchingColumn.dateColumn] = {
            gte: startDate,
            lte: endDate,
        }

        aggregationExpression.query.bool.must.push({ ...rangeQuery });
        if (fiterAppied) {
            for (let i = 0; i < fiterAppied.length; i++) {
                if (fiterAppied[i].identifier == 'FILTER_HS_CODE') {
                    let filterMatchExpression = {}

                    filterMatchExpression.terms = {
                        [searchingColumn.codeColumn]: fiterAppied[i].fieldValue,
                    }
                    aggregationExpression.query.bool.must.push({ ...filterMatchExpression });
                }
            }
        }
        aggregationHsCodeFilters(aggregationExpression, searchingColumn);

        if (valueFilterRangeFlag) {
            aggregationExpression.aggs.FILTER_HS_CODE_PRICE_QUANTITY.aggs.PRICE_CONDITION =
            {
                "bucket_selector": {
                    "buckets_path": {
                        "price_field": "PRICE"
                    },
                    "script": `params.price_field < ${valueFilterRangeTo}L && params.price_field > ${valueFilterRangeFrom}L`
                }
            }
        }

        if (shipmentFilterRangeFlag) {
            aggregationExpression.aggs.FILTER_HS_CODE_PRICE_QUANTITY.aggs.SHIPMENT_CONDITION =
            {
                "bucket_selector": {
                    "buckets_path": {
                        "shipment_field": "SHIPMENTS"
                    },
                    "script": `params.shipment_field < ${shipmentFilterRangeTo} && params.shipment_field > ${shipmentFilterRangeFrom}`
                }
            }
        }

        try {
            let result = await ElasticsearchDbHandler.dbClient.search({
                index: tradeMeta,
                track_total_hits: true,
                body: aggregationExpression,
            });

            return result;
        } catch (error) {
            throw error;
        }
    } catch (error) {
        JSON.stringify(error);
    }

}

function aggregationResultForCountryVSProduct(aggregationExpression, searchingColumn, limit, codeColumn, offset) {

    aggregationExpression.aggs["HS_CODES"] = {
        "terms": {
            "field": codeColumn + ".keyword",
            "order": {
                "PRICE": "desc"
            },
            "size": limit + offset
        },
        "aggs": {
            "PRICE": {
                "sum": {
                    "field": searchingColumn.priceColumn + ".double"
                }
            },
            "SHIPMENTS": {
                "cardinality": {
                    "field": searchingColumn.shipmentColumn + ".keyword"
                }
            },
            "QUANTITY": {
                "sum": {
                    "field": searchingColumn.quantityColumn + ".double"
                }
            },
            "bucket_s": {
                "bucket_sort": {
                    "from": offset,
                    "size": limit
                }
            }
        }
    }
}
//TradeWiseMarketAnalytics
const TradeWiseMarketAnalytics = async (payload, startDate, endDate) => {
    let tradeType = payload.tradeType.trim().toUpperCase();
    const originCountry = payload.originCountry.trim().toUpperCase();
    const valueFilterRangeFlag = payload.valueFilterRangeFlag ?? false;
    const valueFilterRangeFrom = payload.valueFilterRangeFrom ?? 0;
    const valueFilterRangeTo = payload.valueFilterRangeTo ?? 0;
    const offset = payload.start != null ? payload.start : 0;
    const limit = payload.length != null ? payload.length : 10;
    const fiterAppied = payload.fiterAppied ?? null;
    const shipmentFilterRangeFlag = payload.shipmentFilterRangeFlag ?? false;
    const shipmentFilterRangeFrom = payload.shipmentFilterRangeFrom ?? 0;
    const shipmentFilterRangeTo = payload.shipmentFilterRangeTo ?? 0;

    let tradeMeta = tradeMetaFunction(tradeType, originCountry);
    let searchingColumn = searchingColumns(tradeType);
    try {
        let recordSize = 0;
        let aggregationExpression = {
            // setting size as one to get address of the company
            size: recordSize,
            query: {
                bool: {
                    must: [],
                    should: [],
                    filter: [],
                    must_not: []
                },
            },
            aggs: {},
        }
        let rangeQuery = {
            range: {}
        }
        rangeQuery.range[searchingColumn.dateColumn] = {
            gte: startDate,
            lte: endDate,
        }

        if (fiterAppied) {
            for (let i = 0; i < fiterAppied.length; i++) {
                if (fiterAppied[i].identifier == 'FILTER_HS_CODE') {
                    let filterMatchExpression = {}

                    filterMatchExpression.terms = {
                        [searchingColumn.codeColumn]: fiterAppied[i].fieldValue,
                    }
                    aggregationExpression.query.bool.must.push({ ...filterMatchExpression });
                }
            }
        }

        aggregationExpression.query.bool.must.push({ ...rangeQuery });

        let risonQuery = encodeURI(rison.encode(JSON.parse(JSON.stringify({ "query": aggregationExpression.query }))).toString());

        aggregationResultForCountryDataImpExp(aggregationExpression, searchingColumn, limit, offset)



        if (valueFilterRangeFlag) {
            aggregationExpression.aggs.COMPANIES.aggs.PRICE_CONDITION =
            {
                "bucket_selector": {
                    "buckets_path": {
                        "price_field": "PRICE"
                    },
                    "script": `params.price_field < ${valueFilterRangeTo}L && params.price_field > ${valueFilterRangeFrom}L`
                }
            }
        }
        if (shipmentFilterRangeFlag) {
            aggregationExpression.aggs.COMPANIES.aggs.SHIPMENT_CONDITION =
            {
                "bucket_selector": {
                    "buckets_path": {
                        "shipment_field": "SHIPMENTS"
                    },
                    "script": `params.shipment_field < ${shipmentFilterRangeTo} && params.shipment_field > ${shipmentFilterRangeFrom}`
                }
            }
        }

        try {
            let result = await ElasticsearchDbHandler.dbClient.search({
                index: tradeMeta,
                track_total_hits: true,
                body: aggregationExpression,
            });
            return [result,risonQuery];
        } catch (error) {
            throw error;
        }
    } catch (error) {
        JSON.stringify(error);
        throw error
    }

}
//TradeWiseMarketAnalyticsFilters
const fetchTradeMarketAnalyticsFilters = async (payload, startDate, endDate) => {
    let tradeType = payload.tradeType.trim().toUpperCase();
    const originCountry = payload.originCountry.trim().toUpperCase();
    const valueFilterRangeFlag = payload.valueFilterRangeFlag ?? false;
    const valueFilterRangeFrom = payload.valueFilterRangeFrom ?? 0;
    const valueFilterRangeTo = payload.valueFilterRangeTo ?? 0;
    const shipmentFilterRangeFlag = payload.shipmentFilterRangeFlag ?? false;
    const shipmentFilterRangeFrom = payload.shipmentFilterRangeFrom ?? 0;
    const shipmentFilterRangeTo = payload.shipmentFilterRangeTo ?? 0;
    let tradeMeta = tradeMetaFunction(tradeType, originCountry);
    let searchingColumn = searchingColumns(tradeType);
    let fiterAppied = payload.fiterAppied ?? null;

    try {
        let recordSize = 0;
        let aggregationExpression = {
            // setting size as one to get address of the company
            size: recordSize,
            query: {
                bool: {
                    must: [],
                    should: [],
                    filter: [],
                    must_not: []
                },
            },
            aggs: {},
        }
        let rangeQuery = {
            range: {}
        }
        rangeQuery.range[searchingColumn.dateColumn] = {
            gte: startDate,
            lte: endDate,
        }

        if (fiterAppied) {
            for (let i = 0; i < fiterAppied.length; i++) {
                if (fiterAppied[i].identifier == 'FILTER_HS_CODE') {
                    let filterMatchExpression = {}

                    filterMatchExpression.terms = {
                        [searchingColumn.codeColumn]: fiterAppied[i].fieldValue,
                    }
                    aggregationExpression.query.bool.must.push({ ...filterMatchExpression });
                }
            }
        }


        aggregationExpression.query.bool.must.push({ ...rangeQuery });
        aggregationHsCodeFilters(aggregationExpression, searchingColumn);

        if (valueFilterRangeFlag) {
            aggregationExpression.aggs.FILTER_HS_CODE_PRICE_QUANTITY.aggs.PRICE_CONDITION =
            {
                "bucket_selector": {
                    "buckets_path": {
                        "price_field": "PRICE"
                    },
                    "script": `params.price_field < ${valueFilterRangeTo}L && params.price_field > ${valueFilterRangeFrom}L`
                }
            }
        }

        if (shipmentFilterRangeFlag) {
            aggregationExpression.aggs.FILTER_HS_CODE_PRICE_QUANTITY.aggs.SHIPMENT_CONDITION =
            {
                "bucket_selector": {
                    "buckets_path": {
                        "shipment_field": "SHIPMENTS"
                    },
                    "script": `params.shipment_field < ${shipmentFilterRangeTo} && params.shipment_field > ${shipmentFilterRangeFrom}`
                }
            }
        }

        try {
            let result = await ElasticsearchDbHandler.dbClient.search({
                index: tradeMeta,
                track_total_hits: true,
                body: aggregationExpression,
            });
            return result;
        } catch (error) {
            throw error;
        }
    } catch (error) {
        JSON.stringify(error);
        throw error
    }
}

function aggregationHsCodeFilters(aggregationExpression, searchingColumn) {
    aggregationExpression.aggs["FILTER_HS_CODE_PRICE_QUANTITY"] = {
        "terms": {
            "field": searchingColumn.codeColumn + ".keyword",
            "size": 1000,
            "order": {
                "PRICE": "desc"
            }
        },
        "aggs": {
            "PRICE": {
                "sum": {
                    "field": searchingColumn.priceColumn + ".double"
                }
            },
            "SHIPMENTS": {
                "cardinality": {
                    "field": searchingColumn.shipmentColumn + ".keyword"
                }
            }
        }
    }
}
function aggregationShipmentsFilters(aggregationExpression, searchingColumn) {
    aggregationExpression.aggs["SHIPMENTS"] = {
        "terms": {
            "field": searchingColumn.shipmentColumn + ".keyword",
            "size": 1000
        }
    }
}

function aggregationResultForCountryDataImpExp(aggregationExpression, searchingColumns, limit, offset) {
    aggregationExpression.aggs["COMPANIES"] = {
        "terms": {
            "field": searchingColumns.searchField + ".keyword",
            "size": limit + offset,
            "order": {
                "PRICE": "desc"
            }
        },
        "aggs": {
            "PRICE": {
                "sum": {
                    "field": searchingColumns.priceColumn + ".double"
                }
            },
            "SHIPMENTS": {
                "cardinality": {
                    "field": searchingColumns.shipmentColumn + ".keyword"
                }
            },
            "QUANTITY": {
                "sum": {
                    "field": searchingColumns.quantityColumn + ".double"
                }
            },
            "bucket_s": {
                "bucket_sort": {
                    "from": offset,
                    "size": limit
                }
            }
        }
    }
    aggregationExpression.aggs["COMPANIES_COUNT"] = {
        "cardinality": {
            "field": searchingColumns.iec + ".keyword"
        }
    }
}

function summaryTopCompanyAggregation(aggregationExpression, searchingColumns, offset, limit) {
    aggregationExpression.aggs["COMPANIES"] = {
        "terms": {
            "field": searchingColumns.searchField + ".keyword",
            "size": limit + offset,
            "order": {
                "sum_price": "desc"
            }
        },
        "aggs": {
            "sum_price": {
                "sum": {
                    "field": searchingColumns.priceColumn + ".double"
                }
            },
            "bucket_s": {
                "bucket_sort": {
                    "from": offset,
                    "size": limit
                }
            }
        }
    }
    aggregationExpression.aggs["COMPANIES_COUNT"] = {
        "cardinality": {
            "field": searchingColumns.iec + ".keyword"
        }
    }
}

function summaryTopCountryAggregation(aggregationExpression, searchingColumns, offset, limit) {
    aggregationExpression.aggs["COUNTRIES"] = {
        "terms": {
            "field": searchingColumns.countryColumn + ".keyword",
            "size": limit,
            "order": {
                "sum_price": "desc"
            }
        },
        "aggs": {
            "sum_price": {
                "sum": {
                    "field": searchingColumns.priceColumn + ".double"
                }
            }
        }
    }
    aggregationExpression.aggs["COUNTRY_COUNT"] = {
        "cardinality": {
            "field": searchingColumns.countryColumn + ".keyword",
        }
    }
}


function summaryCompanyAggregation(aggregationExpression, searchingColumns) {
    aggregationExpression.aggs["COMPANIES"] = {
        "terms": {
            "field": searchingColumns.searchField + ".keyword",
        },
        "aggs": {
            "SUMMARY_TOTAL_USD_VALUE": {
                "sum": {
                    "field": searchingColumns.priceColumn + ".double"
                }
            },
            "SUMMARY_SHIPMENTS": {
                "cardinality": {
                    "field": searchingColumns.shipmentColumn + ".keyword"
                }
            },
            "SUMMARY_QUANTITY": {
                "sum": {
                    "field": searchingColumns.quantityColumn + ".double"
                }
            }
        }
    }
}

function summaryCountryAggregation(aggregationExpression, searchingColumns) {
    aggregationExpression.aggs["TOP_COUNTRIES"] = {
        "terms": {
            "field": searchingColumns.countryColumn + ".keyword",
        },
        "aggs": {
            "SUMMARY_TOTAL_USD_VALUE": {
                "sum": {
                    "field": searchingColumns.priceColumn + ".double"
                }
            },
            "SUMMARY_SHIPMENTS": {
                "cardinality": {
                    "field": searchingColumns.shipmentColumn + ".keyword"
                }
            },
            "SUMMARY_QUANTITY": {
                "sum": {
                    "field": searchingColumns.quantityColumn + ".double"
                }
            }
        }
    }
}

function summaryCountryjAggregation(aggregationExpression, searchingColumns) {
    aggregationExpression.aggs["TOP_HS_CODE"] = {
        "terms": {
            "field": searchingColumns.codeColumn4 + ".keyword",
        },
        "aggs": {
            "SUMMARY_TOTAL_USD_VALUE": {
                "sum": {
                    "field": searchingColumns.priceColumn + ".double"
                }
            },
            "SUMMARY_SHIPMENTS": {
                "cardinality": {
                    "field": searchingColumns.shipmentColumn + ".keyword"
                }
            },
            "SUMMARY_QUANTITY": {
                "sum": {
                    "field": searchingColumns.quantityColumn + ".double"
                }
            }
        }
    }
}

const findCompanyFilters = async (searchTerm, tradeMeta, startDate, endDate, searchingColumns, isrecommendationDataRequest, Expression) => {
    let recordSize = 0;
    if (isrecommendationDataRequest) {
        recordSize = 0;
    }
    let aggregationExpression = {
        // setting size as one to get address of the company
        size: recordSize,
        query: {
            bool: {
                must: [],
                should: [],
                filter: [],
                must_not: []
            },
        },
        aggs: {},
    }

    let matchExpression = {}
    matchExpression.bool = {
        should: []
    }
    matchExpression.bool.should.push({
        match: {
            [searchingColumns.countryColumn]: {
                "query": searchTerm,
                "operator": "and"
            }
        }
    });
    aggregationExpression.query.bool.must.push({ ...matchExpression });

    let rangeQuery = {
        range: {}
    }
    rangeQuery.range[searchingColumns.dateColumn] = {
        gte: startDate,
        lte: endDate,
    }
    aggregationExpression.query.bool.must.push({ ...rangeQuery });

    quantityPortAggregation(aggregationExpression, searchingColumns);
    hsCodePriceQuantityAggregation(aggregationExpression, searchingColumns);
    quantityIndianPortAggregation(aggregationExpression, searchingColumns);

    if (Expression) {
        for (let i = 0; i < Expression.length; i++) {
            if (Expression[i].identifier == 'FILTER_HS_CODE') {
                let filterMatchExpression = {}

                filterMatchExpression.terms = {
                    [searchingColumns.codeColumn]: Expression[i].fieldValue,
                }
                aggregationExpression.query.bool.must.push({ ...filterMatchExpression });
            } else if (Expression[i].identifier == 'FILTER_FOREIGN_PORT') {
                let filterMatchExpression = {}
                filterMatchExpression.bool = {
                    should: []
                }
                for (let j = 0; j < Expression[i].fieldValue.length; j++) {
                    filterMatchExpression.bool.should.push({
                        match: {
                            [searchingColumns.foreignportColumn]: {
                                "operator": "and",
                                "query": Expression[i].fieldValue[j]
                            }
                        }
                    });
                }

                aggregationExpression.query.bool.must.push({ ...filterMatchExpression });
            } else if (Expression[i].identifier == 'FILTER_PORT') {
                let filterMatchExpression = {}
                filterMatchExpression.bool = {
                    should: []
                }
                for (let j = 0; j < Expression[i].fieldValue.length; j++) {
                    filterMatchExpression.bool.should.push({
                        match: {
                            [searchingColumns.portColumn]: {
                                "operator": "and",
                                "query": Expression[i].fieldValue[j]
                            }
                        }
                    });
                }

                aggregationExpression.query.bool.must.push({ ...filterMatchExpression });
            }
        }
    }

    try {
        let result = await ElasticsearchDbHandler.dbClient.search({
            index: tradeMeta,
            track_total_hits: true,
            body: aggregationExpression,
        });
        const data = getResponseDataForCompany(result, true, true);
        return data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

function quantityPortAggregation(aggregationExpression, searchingColumns) {
    aggregationExpression.aggs["FILTER_FOREIGN_PORT_QUANTITY"] = {
        "terms": {
            "field": searchingColumns.foreignportColumn + ".keyword",
            "size": 1000
        },
        "aggs": {
            "FOREIGN_PORT_QUANTITY": {
                "sum": {
                    "field": searchingColumns.quantityColumn + ".double"
                }
            },
            "FOREIGN_PORT_PRICE": {
                "sum": {
                    "field": searchingColumns.priceColumn + ".double"
                }
            },
            "FOREIGN_PORT_COMPANIES": {
                "cardinality": {
                    "field": searchingColumns.searchField + ".keyword"
                }
            }
        }
    }
}

function quantityIndianPortAggregation(aggregationExpression, searchingColumns) {
    aggregationExpression.aggs["FILTER_INDIAN_PORT_QUANTITY"] = {
        "terms": {
            "field": searchingColumns.portColumn + ".keyword",
            "size": 1000
        },
        "aggs": {
            "PORT_QUANTITY": {
                "sum": {
                    "field": searchingColumns.quantityColumn + ".double"
                }
            },
            "PORT_PRICE": {
                "sum": {
                    "field": searchingColumns.priceColumn + ".double"
                }
            },
            "PORT_COMPANIES": {
                "cardinality": {
                    "field": searchingColumns.searchField + ".keyword"
                }
            }
        }
    }
}

function hsCodePriceQuantityAggregation(aggregationExpression, searchingColumns) {
    aggregationExpression.aggs["FILTER_HS_CODE_PRICE_QUANTITY"] = {
        "terms": {
            "field": searchingColumns.codeColumn + ".keyword",
            "size": 1000
        },
        "aggs": {
            "CODE_QUANTITY": {
                "sum": {
                    "field": searchingColumns.quantityColumn + ".double"
                }
            },
            "CODE_PRICE": {
                "sum": {
                    "field": searchingColumns.priceColumn + ".double"
                }
            },
            "CODE_COMPANIES": {
                "cardinality": {
                    "field": searchingColumns.searchField + ".keyword"
                }
            }
        }
    }
}

function getResponseDataForCompany(result, isAggregation, isFilters = false) {
    let mappedResult = {};
    for (let prop in result.body.aggregations) {
        if (result.body.aggregations.hasOwnProperty(prop)) {
            // if (prop.indexOf("FILTER") === 0) {
            let mappingGroups = []
            if (result.body.aggregations[prop].buckets) {
                result.body.aggregations[prop].buckets.forEach((bucket) => {
                    if (bucket.doc_count != null && bucket.doc_count != undefined) {
                        let groupedElement = {}
                        if (!isFilters) {
                            if (!isAggregation) {
                                groupedElement._id = (bucket.key_as_string != null && bucket.key_as_string != undefined) ? bucket.key_as_string : bucket.key;
                            }
                            segregateSummaryData(bucket, groupedElement);
                        }
                        else {
                            groupedElement._id = (bucket.key_as_string != null && bucket.key_as_string != undefined) ? bucket.key_as_string : bucket.key;
                            segregateSummaryData(bucket, groupedElement);
                        }

                        mappingGroups.push(groupedElement);
                    }
                });
            }

            let propElement = result.body.aggregations[prop];

            if (propElement.value) {
                mappingGroups.push(propElement.value)
            }
            mappedResult[prop] = mappingGroups;
        }

        // Temporary condition for foreign port empty field removal ,
        // will change as per use-case in furture
        if (prop === "FILTER_FOREIGN_PORT_QUANTITY") {
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
    return mappedResult;
}

function segregateSummaryData(bucket, groupedElement) {

    if (bucket.hasOwnProperty("SUMMARY_SHIPMENTS")) {
        groupedElement.shipments = bucket['SUMMARY_SHIPMENTS'].value;
    }
    if (bucket.hasOwnProperty("SUMMARY_TOTAL_USD_VALUE")) {
        groupedElement.price = bucket['SUMMARY_TOTAL_USD_VALUE'].value;
    }
    if (bucket.hasOwnProperty("SUMMARY_QUANTITY")) {
        groupedElement.quantity = bucket['SUMMARY_QUANTITY'].value;
    }
    if (bucket.hasOwnProperty("CODE_PRICE")) {
        groupedElement.price = bucket['CODE_PRICE'].value;
    }
    if (bucket.hasOwnProperty("CODE_QUANTITY")) {
        groupedElement.quantity = bucket['CODE_QUANTITY'].value;
    }
    if (bucket.hasOwnProperty("CODE_COMPANIES")) {
        groupedElement.companies = bucket['CODE_COMPANIES'].value;
    }
    if (bucket.hasOwnProperty("PORT_PRICE")) {
        groupedElement.price = bucket['PORT_PRICE'].value;
    }
    if (bucket.hasOwnProperty("PORT_QUANTITY")) {
        groupedElement.quantity = bucket['PORT_QUANTITY'].value;
    }
    if (bucket.hasOwnProperty("PORT_COMPANIES")) {
        groupedElement.companies = bucket['PORT_COMPANIES'].value;
    }
    if (bucket.hasOwnProperty("FOREIGN_PORT_PRICE")) {
        groupedElement.price = bucket['FOREIGN_PORT_PRICE'].value;
    }
    if (bucket.hasOwnProperty("FOREIGN_PORT_QUANTITY")) {
        groupedElement.quantity = bucket['FOREIGN_PORT_QUANTITY'].value;
    }
    if (bucket.hasOwnProperty("FOREIGN_PORT_COMPANIES")) {
        groupedElement.companies = bucket['FOREIGN_PORT_COMPANIES'].value;
    }
    if (bucket.hasOwnProperty("doc_count")) {
        groupedElement.count = bucket['doc_count'];
    }
}

module.exports = {
    findTopCompany,
    findCompanyFilters,
    findAllDataForCompany,
    findTopCountry,
    findAllDataForCountry,
    ProductWiseMarketAnalytics,
    TradeWiseMarketAnalytics,
    fetchTradeMarketAnalyticsFilters,
    fetchProductMarketAnalyticsFilters,
    findAllUniqueCountries
}
