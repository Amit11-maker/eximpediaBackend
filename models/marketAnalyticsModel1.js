const TAG = "MarketAnalyticsModel";

const MongoDbHandler = require("../db/mongoDbHandler");
const ElasticsearchDbHandler = require("../db/elasticsearchDbHandler");
const TradeSchema = require("../schemas/tradeSchema");
const rison = require('rison');


function deriveDataBucket(tradeType, originCountry) {

    let dataBucket = TradeSchema.deriveDataBucket(tradeType, originCountry);
    return dataBucket;
}

// Hardcoding the searchingColumns[INDIA] for now 
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

//TradeWiseMarketAnalytics
async function tradeWiseMarketAnalytics(payload, startDate, endDate, isCurrentDate) {

    // payload details to be used
    const tradeType = payload.tradeType.trim().toUpperCase();
    const originCountry = payload.originCountry.trim().toUpperCase();

    const filterAppied = payload.fiterAppied ?? null;
    const valueFilterRangeFlag = payload.valueFilterRangeFlag ?? false;
    const valueFilterRangeFrom = payload.valueFilterRangeFrom ?? 0;
    const valueFilterRangeTo = payload.valueFilterRangeTo ?? 0;
    const shipmentFilterRangeFlag = payload.shipmentFilterRangeFlag ?? false;
    const shipmentFilterRangeFrom = payload.shipmentFilterRangeFrom ?? 0;
    const shipmentFilterRangeTo = payload.shipmentFilterRangeTo ?? 0;

    const dataBucket = deriveDataBucket(tradeType, originCountry);
    const searchingColumn = searchingColumns(tradeType);

    // For Pagination
    const offset = payload.start != null ? payload.start : 0;
    const limit = payload.length != null ? payload.length : 10;

    try {

        let aggregationExpression = {
            size: 0,
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

        // Adding date range in the query
        let rangeQuery = {
            range: {}
        }
        rangeQuery.range[searchingColumn.dateColumn] = {
            gte: new Date(startDate),
            lte: new Date(endDate)
        }
        aggregationExpression.query.bool.must.push({ ...rangeQuery });

        // Condition for HScode Filter
        if (filterAppied) {
            for (let i = 0; i < filterAppied.length; i++) {
                if (filterAppied[i].identifier == 'FILTER_HS_CODE') {
                    let filterMatchExpression = {}

                    filterMatchExpression.terms = {
                        [searchingColumn.codeColumn]: filterAppied[i].fieldValue,
                    }
                    aggregationExpression.query.bool.must.push({ ...filterMatchExpression });
                }
            }
        }

        // creating aggregation query for price , quantity and shipment
        aggregationQueryForTradeWiseMarketAnalysis(aggregationExpression, searchingColumn)

        if (isCurrentDate) {

            // Condition to add value range limit
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

            // Condition to add shipment range limit
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

            // Condition to calculate total number of buckets for company count
            aggregationExpression.aggs["COMPANIES_COUNT"] = {
                "stats_bucket": {
                    "buckets_path": "COMPANIES._count"
                }
            }

            try {
                let result = await ElasticsearchDbHandler.dbClient.search({
                    index: dataBucket,
                    track_total_hits: true,
                    body: aggregationExpression,
                });

                // Creating rison query for the elastic dashboard
                let risonQuery = encodeURI(rison.encode(JSON.parse(JSON.stringify({ "query": aggregationExpression.query }))).toString());

                let companiesDataForDateRange1 = sortAndPaginateTradeWiseDataForDateRange1(result, limit, offset);

                companiesDataForDateRange1.risonQuery = risonQuery;

                return companiesDataForDateRange1;

            } catch (error) {
                throw error;
            }

        } else {

            let company_array = [];
            // Condition to get array of importers from first date range data
            for (let data of payload.dateRange1Data.trade_data) {
                company_array.push(data.company_name);
            }

            let companyExpression = {}
            companyExpression.terms = {
                [searchingColumn.searchField + ".keyword"]: company_array
            }
            aggregationExpression.query.bool.must.push({ ...companyExpression });

            try {
                let result = await ElasticsearchDbHandler.dbClient.search({
                    index: dataBucket,
                    track_total_hits: true,
                    body: aggregationExpression,
                });

                let finalCompaniesData = formulateTradeWiseFinalData(result, payload.dateRange1Data);

                return finalCompaniesData;

            } catch (error) {
                throw error;
            }
        }

    } catch (error) {
        JSON.stringify(error);
        throw error
    }

}

function aggregationQueryForTradeWiseMarketAnalysis(aggregationExpression, searchingColumn) {
    aggregationExpression.aggs["COMPANIES"] = {
        "terms": {
            "field": searchingColumn.searchField + ".keyword",
            "size": 65536
        },
        "aggs": {
            "PRICE": {
                "sum": {
                    "field": searchingColumn.priceColumn + ".double"
                }
            },
            "QUANTITY": {
                "sum": {
                    "field": searchingColumn.quantityColumn + ".double"
                }
            },
            "SHIPMENTS": {
                "value_count": {
                    "field": searchingColumn.shipmentColumn + ".keyword"
                }
            }
        }
    }
}

function sortAndPaginateTradeWiseDataForDateRange1(tradeDataResult, limit, offset) {
    tradeDataResult.body.aggregations.COMPANIES.buckets.sort((object1, object2) => {
        let data1 = object1.PRICE.value;
        let data2 = object2.PRICE.value;

        if (data1 > data2) {
            return -1
        }
        if (data1 < data2) {
            return 1
        }
        return 0
    });

    let companies_data = {
        trade_data: []
    }

    for (let prop in tradeDataResult.body.aggregations) {
        if (tradeDataResult.body.aggregations.hasOwnProperty(prop)) {
            if (tradeDataResult.body.aggregations[prop].buckets) {
                for (let i = offset; i < limit; i++) {
                    let bucket = tradeDataResult.body.aggregations[prop].buckets[i];
                    let company = {};
                    company.company_data = {};
                    company.company_data.date1 = {};
                    if (bucket.doc_count != null && bucket.doc_count != undefined) {
                        company.company_name = bucket.key
                        segregateAggregationData(company.company_data.date1, bucket)
                    }
                    companies_data.trade_data.push(company);
                }
            } else {
                let companiesCount = tradeDataResult.body.aggregations.COMPANIES_COUNT.count;
                companies_data.trade_count = companiesCount;
            }
        }
    }

    return companies_data;
}

function segregateAggregationData(groupedElement, bucket) {

    if (bucket.hasOwnProperty("SHIPMENTS")) {
        groupedElement.shipments = bucket['SHIPMENTS'].value;
    }
    if (bucket.hasOwnProperty("QUANTITY")) {
        groupedElement.quantity = bucket['QUANTITY'].value;
    }
    if (bucket.hasOwnProperty("PRICE")) {
        groupedElement.price = bucket['PRICE'].value;
    }
    if (bucket.hasOwnProperty("doc_count")) {
        groupedElement.count = bucket['doc_count'];
    }

}

function formulateTradeWiseFinalData(tradeDataResult, dateRange1TradeData) {

    let finalTradeData = {
        trade_data: []
    }

    finalTradeData.trade_count = dateRange1TradeData.trade_count;
    finalTradeData.risonQuery = dateRange1TradeData.risonQuery;

    for (let data of dateRange1TradeData.trade_data) {
        let company_name = data.company_name;
        for (let prop in tradeDataResult.body.aggregations) {
            if (tradeDataResult.body.aggregations.hasOwnProperty(prop)) {
                if (tradeDataResult.body.aggregations[prop].buckets) {
                    let filteredBucket = tradeDataResult.body.aggregations[prop].buckets.filter(bucket => bucket.key === company_name);
                    if (filteredBucket && filteredBucket.length > 0) {
                        let company = {};
                        company.company_data = {};
                        company.company_data.date2 = {};
                        if (filteredBucket[0].doc_count != null && filteredBucket[0].doc_count != undefined) {
                            company.company_name = filteredBucket[0].key
                            segregateAggregationData(company.company_data.date2, filteredBucket[0])
                        }
                        data.company_data.date2 = company.company_data.date2;
                    } else {
                        let company = {};
                        company.company_data = {};
                        company.company_data.date2 = {
                            count:0,
                            price:0,
                            shipments:0,
                            quantity:0
                        }

                        data.company_data.date2 = company.company_data.date2;
                    }
                }
            }
        }

        finalTradeData.trade_data.push(data);
    }

    return finalTradeData;
}

const fetchTradeMarketAnalyticsFilters = async (payload) => {
    
    // payload details to be used
    const tradeType = payload.tradeType.trim().toUpperCase();
    const originCountry = payload.originCountry.trim().toUpperCase();

    const filterAppied = payload.fiterAppied ?? null;
    const valueFilterRangeFlag = payload.valueFilterRangeFlag ?? false;
    const valueFilterRangeFrom = payload.valueFilterRangeFrom ?? 0;
    const valueFilterRangeTo = payload.valueFilterRangeTo ?? 0;
    const shipmentFilterRangeFlag = payload.shipmentFilterRangeFlag ?? false;
    const shipmentFilterRangeFrom = payload.shipmentFilterRangeFrom ?? 0;
    const shipmentFilterRangeTo = payload.shipmentFilterRangeTo ?? 0;

    const dataBucket = deriveDataBucket(tradeType, originCountry);
    const searchingColumn = searchingColumns(tradeType);

    const startDate = payload.dateRange.startDate ?? null;
    const endDate = payload.dateRange.endDate ?? null;
    const startDateTwo = payload.dateRange.startDateTwo ?? null;
    const endDateTwo = payload.dateRange.endDateTwo ?? null;

    try {
        
        let aggregationExpression = {
            size: 0,
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

        // Adding date range in the query
        let rangeQuery = {
            range: {},

        }
        rangeQuery.range[searchingColumn.dateColumn] = {
            gte: new Date(startDate),
            lte: new Date(endDate)
        }
        aggregationExpression.query.bool.should.push({ ...rangeQuery });
        rangeQuery.range[searchingColumn.dateColumn] = {
            gte: new Date(startDateTwo),
            lte: new Date(endDateTwo)
        }
        aggregationExpression.query.bool.should.push({ ...rangeQuery });

        if (filterAppied) {
            for (let i = 0; i < filterAppied.length; i++) {
                if (filterAppied[i].identifier == 'FILTER_HS_CODE') {
                    let filterMatchExpression = {}

                    filterMatchExpression.terms = {
                        [searchingColumn.codeColumn]: filterAppied[i].fieldValue,
                    }
                    aggregationExpression.query.bool.must.push({ ...filterMatchExpression });
                }
            }
        }

        aggregationHsCodeFilters(aggregationExpression, searchingColumn);

        if (valueFilterRangeFlag) {
            aggregationExpression.aggs.FILTER_HS_CODE_PRICE_QUANTITY.aggs.PRICE = {
                "sum": {
                    "field": searchingColumn.priceColumn + ".double"
                }
            }
            
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
            aggregationExpression.aggs.FILTER_HS_CODE_PRICE_QUANTITY.aggs.SHIPMENTS = {
                "value_count": {
                    "field": searchingColumn.shipmentColumn + ".keyword"
                }
            }
            
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
                index: dataBucket,
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
                "COMPANIES": "desc"
            }
        },
        "aggs": {
            "COMPANIES" : {
                "cardinality" : {
                    "field" : searchingColumn.searchField + ".keyword"
                }
            }
        }
    }
}

module.exports = {
    tradeWiseMarketAnalytics,
    fetchTradeMarketAnalyticsFilters
}