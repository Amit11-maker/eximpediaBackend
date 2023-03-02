const TAG = "marketAnalyticsModel";
const MongoDbHandler = require("../db/mongoDbHandler");
const ElasticsearchDbHandler = require("../db/elasticsearchDbHandler");
const TradeSchema = require("../schemas/tradeSchema");
const rison = require('rison');
const { monthsShort } = require("moment/moment");
const ObjectID = require("mongodb").ObjectID;

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

const deriveDataBucket = (tradeType, originCountry) => {

    let tradeMeta = TradeSchema.deriveDataBucket(tradeType, originCountry);
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
            gte: new Date(startDate),
            lte: new Date(endDate)
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

        summaryTopCompanyAggregation(aggregationExpression, searchingColumns);

        try {
            let result = await ElasticsearchDbHandler.dbClient.search({
                index: tradeMeta,
                track_total_hits: true,
                body: aggregationExpression,
            });
            const data = getResponseDataForCompany(result, false);

            return [data, risonQuery];
        } catch (error) {
            throw error;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }

}

const findTopCountry = async (searchTerm, tradeMeta, startDate, endDate, searchingColumns) => {
    try {

        let aggregationExpression = {
            size: 1,
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
            gte: new Date(startDate),
            lte: new Date(endDate)
        }

        aggregationExpression.query.bool.must.push({ ...rangeQuery });

        summaryTopCountryAggregation(aggregationExpression, searchingColumns);

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
    let tradeMeta = deriveDataBucket(tradeType, originCountry);
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
            gte: new Date(startDate),
            lte: new Date(endDate)
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
            const data = getResponseDataForCompany(result, false);

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
            gte: new Date(startDate),
            lte: new Date(endDate)
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
    
    let tradeMeta = deriveDataBucket(tradeType, originCountry);
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
            gte: new Date(startDate),
            lte: new Date(endDate)
        }

        aggregationExpression.query.bool.must.push({ ...rangeQuery });
        //Condition for HScode Filter
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

        aggregationResultForCountryVSProduct(aggregationExpression, searchingColumn, codeColumn);
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
                        "value_count": {
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
                        "value_count": {
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
        if (isCurrentDate) {

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

            // Condition to calculate total number of buckets for company count
            aggregationExpression.aggs["HS_CODES_COUNT"] = {
                "stats_bucket": {
                    "buckets_path": "HS_CODES._count"
                }
            }
            try {
                let result = await ElasticsearchDbHandler.dbClient.search({
                    index: tradeMeta,
                    track_total_hits: true,
                    body: aggregationExpression,
                });
                let risonQuery = encodeURI(rison.encode(JSON.parse(JSON.stringify({ "query": aggregationExpression.query }))).toString());

                let res = result.body.aggregations.HS_CODES.buckets;
                for (let c = 0; c < res.length; c++) {
                    let filterClause = res[c].key;
                    let description = await getHsCodeDescription(filterClause);
                    res[c].hS_code_description = description[0]?.description ? description[0].description : "";
                }
                let product_count = result.body.aggregations.HS_CODES_COUNT.count
                let hsCodesDataForDateRange1 = {};
                hsCodesDataForDateRange1.product_data = sortAndPaginateProductWiseDataForDateRange1(result, limit, offset);
                // return result;
                hsCodesDataForDateRange1.risonQuery = risonQuery;
                hsCodesDataForDateRange1.product_count = product_count;

                return hsCodesDataForDateRange1;


            } catch (error) {
                throw error;
            }
        } else {
            let hsCodes_array = [];
            // Condition to get array of importers from first date range data
            for (let data of payload.dateRange1Data.product_data) {
                hsCodes_array.push(data.hs_code);
            }

            let hsCodeExpression = {}
            hsCodeExpression.terms = {
                [codeColumn + ".keyword"]: hsCodes_array
            }
            aggregationExpression.query.bool.must.push({ ...hsCodeExpression });

            try {
                let result = await ElasticsearchDbHandler.dbClient.search({
                    index: tradeMeta,
                    track_total_hits: true,
                    body: aggregationExpression,
                });

                let finalHsCodeData = formulateProductWiseFinalData(result, payload.dateRange1Data);

                return finalHsCodeData;

            } catch (error) {
                throw error;
            }
        }
    } catch (error) {
        JSON.stringify(error);
        throw error
    }

}

 function sortAndPaginateProductWiseDataForDateRange1(productDataResult, limit, offset) {
    productDataResult.body.aggregations.HS_CODES.buckets.sort((object1, object2) => {
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



    
    let hs_codes = []
    for (let prop in productDataResult.body.aggregations) {
        if (productDataResult.body.aggregations.hasOwnProperty(prop)) {
            if (productDataResult.body.aggregations[prop].buckets) {
                for (let i = offset; i < limit + offset; i++) {
                    if (i >= productDataResult.body.aggregations[prop].buckets.length) {
                        break;
                    }
                let bucket = productDataResult.body.aggregations[prop].buckets[i];

                // let filterClause = bucket.key;
                //     let description = await getHsCodeDescription(filterClause);
                //     res[c].hS_code_description = description[0]?.description ? description[0].description : "";
                   
                        let code = {}
                        code.hs_code_data = {};
                        code.hs_code_data.date1 = {};
                        code.port_data = [];
                        code.country_data = [];
                        if (bucket.doc_count != null && bucket.doc_count != undefined) {
                            code.hs_code = bucket.key
                            code.hs_Code_Description = bucket.hS_code_description
                            if (bucket.COUNTRIES) {
                                for (let buckett of bucket.COUNTRIES.buckets) {
                                    let countries = {};
                                    countries.date1 = {};
                                    if (buckett.doc_count != null && buckett.doc_count != undefined) {
                                        countries.country = buckett.key;
                                        segregateAggregationData(countries.date1, buckett)
                                        code.country_data.push(countries)
                                    }
                                }
                            }
                            if (bucket.PORTS) {
                                for (let buckett of bucket.PORTS.buckets) {
                                    let ports = {};
                                    ports.date1 = {};
                                    if (buckett.doc_count != null && buckett.doc_count != undefined) {
                                        ports.port = buckett.key;
                                        segregateAggregationData(ports.date1, buckett)
                                    }
                                    code.port_data.push(ports)
                                }
                            }
                            segregateAggregationData(code.hs_code_data.date1, bucket)
                        }
                        hs_codes.push(code);
                }
                
            }
        }
    }
    return hs_codes;
}


function formulateProductWiseFinalData(productDataResult, dateRange1ProductData) {

    let finalHsCodeData = {
        
    }

    finalHsCodeData.product_count = dateRange1ProductData.product_count;
    finalHsCodeData.risonQuery = dateRange1ProductData.risonQuery;


    // for (let data of dateRange1ProductData.product_data) {
    //     let hsCode_number = data.hsCode_number;
    //     for (let prop in productDataResult.body.aggregations) {
    //         if (productDataResult.body.aggregations.hasOwnProperty(prop)) {
    //             if (productDataResult.body.aggregations[prop].buckets) {
    //                 let filteredBucket = productDataResult.body.aggregations[prop].buckets.filter(bucket => bucket.key === hsCode_number);
    //                 if (filteredBucket && filteredBucket.length > 0) {
    //                     let hsCode = {};
    //                     hsCode.hsCode_data = {};
    //                     hsCode.hsCode_data.date2 = {};
    //                     hsCode.port_data = [];
    //                     hsCode.country_data = [];
    //                     if (filteredBucket[0].doc_count != null && filteredBucket[0].doc_count != undefined) {
    //                         hsCode.hsCode_number = filteredBucket[0].key
    //                         if (filteredBucket[0].COUNTRIES) {

    //                             for (let buckett of filteredBucket[0].COUNTRIES.buckets) {
    //                               let foundCounrty = data.country_data.find(object => object.country === buckett.key);
    //                               if (foundCounrty) {
    //                                 let date2 = {};
    //                                 if (buckett.doc_count != null && buckett.doc_count != undefined) {
    //                                   segregateSummaryData(date2, buckett)
    //                                 }
    //                                 filteredBucket[0].COUNTRIES = date2;
    //                               }
    //                             }
    //                           }
    //                           if (bucket.PORTS) {
    //                             for (let buckett of bucket.PORTS.buckets) {
    //                               let foundPort = foundCode.port_data.find(object => object.port === buckett.key);
    //                               if (foundPort) {
    //                                 let date2 = {};
    //                                 if (buckett.doc_count != null && buckett.doc_count != undefined) {
    //                                   segregateSummaryData(date2, buckett)
    //                                 }
    //                                 foundPort.date2 = date2;
    //                               }
    //                             }
    //                           }
    //                         segregateAggregationData(hsCode.hsCode_data.date2, filteredBucket[0])
    //                     }
    //                     data.hsCode_data.date2 = hsCode.hsCode_data.date2;
    //                 } else {
    //                     let hsCode = {};
    //                     hsCode.hsCode_data = {};
    //                     hsCode.hsCode_data.date2 = {
    //                         count:0,
    //                         price:0,
    //                         shipments:0,
    //                         quantity:0
    //                     }

    //                     data.company_data.date2 = company.company_data.date2;
    //                 }
    //             }
    //         }
    //     }

    //     finalHsCodeData.hsCode_data.push(data);
    // }
    /////////
    for (let prop in productDataResult.body.aggregations) {
        if (productDataResult.body.aggregations.hasOwnProperty(prop)) {
            if (productDataResult.body.aggregations[prop].buckets) {
                for (let bucket of productDataResult.body.aggregations.HS_CODES.buckets) {
                    let foundCode = dateRange1ProductData.product_data.find(object => object.hs_code === bucket.key);
                    if (foundCode) {
                        let date2 = {}
                        if (bucket.doc_count != null && bucket.doc_count != undefined) {
                            if (bucket.COUNTRIES) {
                                for (let buckett of bucket.COUNTRIES.buckets) {
                                    let foundCounrty = foundCode.country_data.find(object => object.country === buckett.key);
                                    if (foundCounrty) {
                                        let date2 = {};
                                        if (buckett.doc_count != null && buckett.doc_count != undefined) {
                                            segregateAggregationData(date2, buckett)
                                        }
                                        foundCounrty.date2 = date2;
                                    }
                                }
                            }
                            if (bucket.PORTS) {
                                for (let buckett of bucket.PORTS.buckets) {
                                    let foundPort = foundCode.port_data.find(object => object.port === buckett.key);
                                    if (foundPort) {
                                        let date2 = {};
                                        if (buckett.doc_count != null && buckett.doc_count != undefined) {
                                            segregateAggregationData(date2, buckett)
                                        }
                                        foundPort.date2 = date2;
                                    }
                                }
                            }
                            segregateAggregationData(date2, bucket)
                        }
                        foundCode.hs_code_data.date2 = date2;
                    }
                }
            }
        }
    }
    finalHsCodeData.product_data = dateRange1ProductData.product_data;

    return finalHsCodeData;
    /////////


}


const fetchProductMarketAnalyticsFilters = async (payload) => {
    let tradeType = payload.tradeType.trim().toUpperCase();
    const originCountry = payload.originCountry.trim().toUpperCase();
    const valueFilterRangeFlag = payload.valueFilterRangeFlag ?? false;
    const valueFilterRangeFrom = payload.valueFilterRangeFrom ?? 0;
    const valueFilterRangeTo = payload.valueFilterRangeTo ?? 0;
    const fiterAppied = payload.fiterAppied ?? null;
    const shipmentFilterRangeFlag = payload.shipmentFilterRangeFlag ?? false;
    const shipmentFilterRangeFrom = payload.shipmentFilterRangeFrom ?? 0;
    const shipmentFilterRangeTo = payload.shipmentFilterRangeTo ?? 0;
    const startDate = payload.dateRange.startDate ?? null;
    const endDate = payload.dateRange.endDate ?? null;
    const startDateTwo = payload.dateRange.startDateTwo ?? null;
    const endDateTwo = payload.dateRange.endDateTwo ?? null;
    let tradeMeta = deriveDataBucket(tradeType, originCountry);
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
            gte: new Date(startDate),
            lte: new Date(endDate),
        }

        aggregationExpression.query.bool.should.push({ ...rangeQuery });

        rangeQuery.range[searchingColumn.dateColumn] = {
            gte: new Date(startDateTwo),
            lte: new Date(endDateTwo),
        }

        aggregationExpression.query.bool.should.push({ ...rangeQuery });
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

function aggregationResultForCountryVSProduct(aggregationExpression, searchingColumn, codeColumn) {

    aggregationExpression.aggs["HS_CODES"] = {
        "terms": {
            "field": codeColumn + ".keyword",
            "size": 65535
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

function aggregationResultForRecordsCountProduct(aggregationExpression) {
    aggregationExpression.aggs["bucketcount"] = {
        "stats_bucket": {
            "buckets_path": "HS_CODES._count"
        }
    }
}

function aggregationResultForCountryVSProductShipment(aggregationExpression, searchingColumn, limit, codeColumn, offset) {
    aggregationExpression.aggs.HS_CODES.aggs.bucket_s =
    {
        "bucket_sort": {
            "from": offset,
            "size": limit,
            "sort": [
                {
                    "PRICE": {
                        "order": "desc"
                    }
                }
            ]
        }
    },
        aggregationExpression.aggs.HS_CODES.aggs.SHIPMENTS =
        {
            "value_count": {
                "field": searchingColumn.shipmentColumn + ".keyword"
            }
        }

}

function aggregationResultForRecordsCountProduct(aggregationExpression, searchingColumn) {
    aggregationExpression.aggs.HS_CODES.aggs.SHIPMENTS =
    {
        "value_count": {
            "field": searchingColumn.shipmentColumn + ".keyword"
        }
    }
    aggregationExpression.aggs["bucketcount"] = {
        "stats_bucket": {
            "buckets_path": "HS_CODES._count"
        }
    }
}

function aggregationResultForCountryVSProductQuantity(aggregationExpression, searchingColumn) {
    aggregationExpression.aggs.HS_CODES.aggs.QUANTITY =
    {
        "sum": {
            "field": searchingColumn.quantityColumn + ".double"
        }
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

function summaryTopCompanyAggregation(aggregationExpression, searchingColumns) {
    aggregationExpression.aggs["COMPANIES"] = {
        "terms": {
            "field": searchingColumns.searchField + ".keyword",
            "size": 65535,
            "order": {
                "PRICE": "desc"
            }
        },
        "aggs": {
            "PRICE": {
                "sum": {
                    "field": searchingColumns.priceColumn + ".double"
                }
            }
        }
    }
}

function summaryTopCountryAggregation(aggregationExpression, searchingColumns, offset, limit) {
    aggregationExpression.aggs["COUNTRIES"] = {
        "terms": {
            "field": searchingColumns.countryColumn + ".keyword",
            "size": 65535,
            "order": {
                "PRICE": "desc"
            }
        },
        "aggs": {
            "PRICE": {
                "sum": {
                    "field": searchingColumns.priceColumn + ".double"
                }
            }
        }
    }
}

function summaryCompanyAggregation(aggregationExpression, searchingColumns) {
    aggregationExpression.aggs["COMPANIES"] = {
        "terms": {
            "field": searchingColumns.searchField + ".keyword",
            "size" : 65535
        },
        "aggs": {
            "SUMMARY_TOTAL_USD_VALUE": {
                "sum": {
                    "field": searchingColumns.priceColumn + ".double"
                }
            },
            "SUMMARY_SHIPMENTS": {
                "value_count": {
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
            "size": 25
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
            "size": 25
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

const findCompanyFilters = async (searchTerm, tradeMeta, startDate, endDate, startDateTwo, endDateTwo, searchingColumns, isrecommendationDataRequest, Expression) => {
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
        gte: new Date(startDate),
        lte: new Date(endDate)
    }
    aggregationExpression.query.bool.should.push({ ...rangeQuery });
    rangeQuery.range[searchingColumns.dateColumn] = {
        gte: new Date(startDateTwo),
        lte: new Date(endDateTwo)
    }
    aggregationExpression.query.bool.should.push({ ...rangeQuery });

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
            "size": 65535
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
                for (let i = offset; i < limit + offset; i++) {
                    if (i >= tradeDataResult.body.aggregations[prop].buckets.length) {
                        break;
                    }
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
                            count: 0,
                            price: 0,
                            shipments: 0,
                            quantity: 0
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

module.exports = {
    findAllUniqueCountries,
    findTopCompany,
    findCompanyFilters,
    findAllDataForCompany,
    findTopCountry,
    findAllDataForCountry,
    ProductWiseMarketAnalytics,
    fetchProductMarketAnalyticsFilters,
    tradeWiseMarketAnalytics,
    fetchTradeMarketAnalyticsFilters
}
