const TAG = "diffAnalyticsModel";
const { searchEngine } = require("../helpers/searchHelper");
const { getSearchData, getFilterData } = require("../helpers/recordSearchHelper");
const ObjectID = require("mongodb").ObjectID;
const ElasticsearchDbQueryBuilderHelper = require('./../helpers/elasticsearchDbQueryBuilderHelper');
const MongoDbHandler = require("../db/mongoDbHandler");
const ElasticsearchDbHandler = require("../db/elasticsearchDbHandler");
const TradeSchema = require("../schemas/tradeSchema");
const TradeModel = require("./tradeModel");
const accountLimitsCollection = MongoDbHandler.collections.account_limits;

const { logger } = require('../config/logger');
const SEPARATOR_UNDERSCORE = "_";


const findTopCompany = async (searchTerm, tradeMeta, startDate, endDate, searchingColumns, offset, limit) => {
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
            term: {}
        }
        var x = searchingColumns.countryColumn + ".keyword"
        matchExpression.term = {
            [x]: searchTerm,
        }
        aggregationExpression.query.bool.filter.push({ ...matchExpression });

        let rangeQuery = {
            range: {}
        }
        rangeQuery.range[searchingColumns.dateColumn] = {
            gte: startDate,
            lte: endDate,
        }

        aggregationExpression.query.bool.must.push({ ...rangeQuery });

        summaryTopCompanyAggregation(aggregationExpression, searchingColumns, offset, limit);

        try {
            let result = await ElasticsearchDbHandler.dbClient.search({
                index: tradeMeta.indexNamePrefix,
                track_total_hits: true,
                body: aggregationExpression,
            });
            const data = getResponseDataForCompany(result);
            return data;
        } catch (error) {
            throw error;
        }
    }
    catch (err) {
        console.log(err);
    }

}

const findTopCountry = async (searchTerm, tradeMeta, startDate, endDate, searchingColumns, offset, limit) => {
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
            term: {}
        }
        var x = searchingColumns.searchField + ".keyword"
        matchExpression.term = {
            [x]: searchTerm,
        }
        aggregationExpression.query.bool.filter.push({ ...matchExpression });

        let rangeQuery = {
            range: {}
        }

        rangeQuery.range[searchingColumns.dateColumn] = {
            gte: startDate,
            lte: endDate,
        }

        aggregationExpression.query.bool.must.push({ ...rangeQuery });

        summaryTopCountryAggregation(aggregationExpression, searchingColumns,offset, limit);

        try {
            let result = await ElasticsearchDbHandler.dbClient.search({
                index: tradeMeta.indexNamePrefix,
                track_total_hits: true,
                body: aggregationExpression,
            });
            const data = getResponseDataForCompany(result);
            return data;
        } catch (error) {
            throw error;
        }
    }
    catch (err) {
        console.log(err);
    }

}

const findAllDataForCompany = async (company_name, searchTerm, tradeMeta, startDate, endDate, searchingColumns, offset, limit) => {
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
            term: {}
        }
        var x = searchingColumns.countryColumn + ".keyword"
        matchExpression.term = {
            [x]: searchTerm,
        }
        aggregationExpression.query.bool.filter.push({ ...matchExpression });


        var y = searchingColumns.searchField + ".keyword"
        matchExpression.term = {
            [y]: company_name,
        }
        aggregationExpression.query.bool.filter.push({ ...matchExpression });

        let rangeQuery = {
            range: {}
        }
        // if(i ==1){
        //     // startDate = startDate.at(3)-1;
        //     // endDate = endDate.at(3)-1;

        //     let date1 = startDate.substr(3,1)-1;
        //     startDate = startDate.substr(0,3) + date1 + startDate.substr(4);

        //     let date2 = endDate.substr(3,1)-1;
        //     endDate = endDate.substr(0,3) + date2 + endDate.substr(4);

        //     rangeQuery.range[searchingColumns.dateColumn] = {
        //         gte: startDate,
        //         lte: endDate,
        //     }
        // }
        // else{
        rangeQuery.range[searchingColumns.dateColumn] = {
            gte: startDate,
            lte: endDate,
        }
        // }

        aggregationExpression.query.bool.must.push({ ...rangeQuery });

        summaryCompanyAggregation(aggregationExpression, searchingColumns);

        // if (tradeMeta.tradeType == 'EXPORT') {
        //     summaryCompanyAggregation(aggregationExpression);
        // }
        // else {
        //     summaryCompanyAggregationImp(aggregationExpression);
        // }


        try {
            let result = await ElasticsearchDbHandler.dbClient.search({
                index: tradeMeta.indexNamePrefix,
                track_total_hits: true,
                body: aggregationExpression,
            });
            const data = getResponseDataForCompany(result);

            return data;
        } catch (error) {
            throw error;
        }
    }
    catch (err) {
        console.log(err);
    }

}


const findAllDataForCountry = async (country_name, searchTerm, tradeMeta, startDate, endDate, searchingColumns, offset, limit) => {
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
            term: {}
        }
        var x = searchingColumns.searchField + ".keyword"
        matchExpression.term = {
            [x]: searchTerm,
        }
        aggregationExpression.query.bool.filter.push({ ...matchExpression });


        var y = searchingColumns.countryColumn + ".keyword"
        matchExpression.term = {
            [y]: country_name,
        }
        aggregationExpression.query.bool.filter.push({ ...matchExpression });

        let rangeQuery = {
            range: {}
        }
        rangeQuery.range[searchingColumns.dateColumn] = {
            gte: startDate,
            lte: endDate,
        }

        aggregationExpression.query.bool.must.push({ ...rangeQuery });

        summaryCountryAggregation(aggregationExpression, searchingColumns);
        try {
            let result = await ElasticsearchDbHandler.dbClient.search({
                index: tradeMeta.indexNamePrefix,
                track_total_hits: true,
                body: aggregationExpression,
            });
            const data = getResponseDataForCompany(result);

            return data;
        } catch (error) {
            throw error;
        }
    }
    catch (err) {
        console.log(err);
    }

}

function summaryTopCompanyAggregation(aggregationExpression, searchingColumns, offset, limit) {
    aggregationExpression.aggs["TOP_COMPANIES"] = {
        "terms": {
            "field": searchingColumns.searchField + ".keyword",
        },
        "aggs": {
            "bucket_sort": {
                "bucket_sort": {
                    "sort": [
                        {
                            "_key": {
                                "order": "desc"
                            }
                        }
                    ],
                    "from": offset,
                    "size": limit
                }
            }
        }
    }
}

function summaryTopCountryAggregation(aggregationExpression, searchingColumns, offset, limit) {
    aggregationExpression.aggs["TOP_COUNTRIES"] = {
        "terms": {
            "field": searchingColumns.countryColumn + ".keyword",
        },
        "aggs": {
            "bucket_sort": {
                "bucket_sort": {
                    "sort": [
                        {
                            "_key": {
                                "order": "desc"
                            }
                        }
                    ],
                    "from": offset,
                    "size": limit
                }
            }
        }
    }
}
// "terms": {
//     "field": searchingColumns.searchField + ".keyword",
// },

function summaryCompanyAggregation(aggregationExpression, searchingColumns) {
    aggregationExpression.aggs["TOP_COMPANIES"] = {
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
                    "field": +searchingColumns.quantityColumn + ".double"
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
                    "field": +searchingColumns.quantityColumn + ".double"
                }
            }
        }
    }
}


function summaryCompanyAggregationImp(aggregationExpression) {
    aggregationExpression.aggs["TOP_IMPORTERS"] = {
        "terms": {
            "field": "IMPORTER_NAME" + ".keyword",
        },
        "aggs": {
            "SUMMARY_TOTAL_USD_VALUE": {
                "sum": {
                    "field": "FOB_USD.double"
                }
            },
            "SUMMARY_SHIPMENTS": {
                "cardinality": {
                    "field": "DECLARATION_NO.keyword"
                }
            }
        }
    }
}

function getResponseDataForCompany(result) {
    let mappedResult = {};
    for (let prop in result.body.aggregations) {
        if (result.body.aggregations.hasOwnProperty(prop)) {
            // if (prop.indexOf("FILTER") === 0) {
            let mappingGroups = []
            if (result.body.aggregations[prop].buckets) {
                result.body.aggregations[prop].buckets.forEach((bucket) => {
                    if (bucket.doc_count != null && bucket.doc_count != undefined) {
                        let groupedElement = {
                            _id: (bucket.key_as_string != null && bucket.key_as_string != undefined) ? bucket.key_as_string : bucket.key,
                        }
                        segregateSummaryData(bucket, groupedElement);

                        if (bucket.minRange != null && bucket.minRange != undefined && bucket.maxRange != null && bucket.maxRange != undefined) {
                            groupedElement.minRange = bucket.minRange.value;
                            groupedElement.maxRange = bucket.maxRange.value;
                        }

                        mappingGroups.push(groupedElement);
                    }
                });
            }
            let propElement = result.body.aggregations[prop];
            if (propElement.min != null && propElement.min != undefined && propElement.max != null && propElement.max != undefined) {
                let groupedElement = {};
                if (propElement.meta != null && propElement.meta != undefined) {
                    groupedElement = propElement.meta;
                }
                groupedElement._id = null;
                groupedElement.minRange = propElement.min;
                groupedElement.maxRange = propElement.max;
                mappingGroups.push(groupedElement);
            }
            if (propElement.value) {
                mappingGroups.push(propElement.value)
            }
            mappedResult[prop] = mappingGroups;
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
    if (bucket.hasOwnProperty("SUMMARY_SHIPMENTS")) {
        groupedElement.quantity = bucket['SUMMARY_SHIPMENTS'].value;
    }
}



// const findCompanyDetailsByPatternEngine = async (searchTerm, tradeMeta, startDate, endDate, searchingColumns, isrecommendationDataRequest) => {
//     let recordSize = 0;
//     if (isrecommendationDataRequest) {
//         recordSize = 0;
//     }
//     let aggregationExpression = {
//         // setting size as one to get address of the company
//         size: recordSize,
//         query: {
//             bool: {
//                 must: [],
//                 should: [],
//                 filter: [],
//                 must_not: []
//             },
//         },
//         aggs: {},
//     }

//     let matchExpression = {
//         match: {}
//     }

//     matchExpression.match[searchingColumns.searchField] = {
//         query: searchTerm,
//         operator: "and",
//         fuzziness: "auto",
//     }
//     aggregationExpression.query.bool.must.push({ ...matchExpression });

//     let rangeQuery = {
//         range: {}
//     }
//     rangeQuery.range[searchingColumns.dateColumn] = {
//         gte: startDate,
//         lte: endDate,
//     }
//     aggregationExpression.query.bool.must.push({ ...rangeQuery });

//     if (tradeMeta.blCountry) {
//         var blMatchExpressions = { match: {} };
//         blMatchExpressions.match["COUNTRY_DATA"] = tradeMeta.blCountry;
//         aggregationExpression.query.bool.must.push({ ...blMatchExpressions });
//         buyerSellerAggregationExpression.query.bool.must.push({ ...blMatchExpressions });
//     }

//     if (!isrecommendationDataRequest) {
//         summaryCountAggregation(aggregationExpression, searchingColumns);
//         quantityPriceAggregation(aggregationExpression, searchingColumns);
//         quantityPortAggregation(aggregationExpression, searchingColumns);
//         hsCodePriceQuantityAggregation(aggregationExpression, searchingColumns);
//     }

//     try {
//         let result = await ElasticsearchDbHandler.dbClient.search({
//             index: tradeMeta.indexNamePrefix,
//             track_total_hits: true,
//             body: aggregationExpression,
//         });
//         const data = getResponseDataForCompany(result);
//         return data;
//     } catch (error) {
//         throw error;
//     }
// }


// function summaryCountAggregation(aggregationExpression, searchingColumns) {
//     aggregationExpression.aggs["SUMMARY_TOTAL_SUPPLIER"] = {
//         "cardinality": {
//             "field": searchingColumns.sellerName + ".keyword"
//         }
//     }

//     aggregationExpression.aggs["SUMMARY_TOTAL_USD_VALUE"] = {
//         "sum": {
//             "field": searchingColumns.priceColumn + ".double"
//         }
//     }
// }

// function quantityPortAggregation(aggregationExpression, searchingColumns) {
//     aggregationExpression.aggs["FILTER_FOREIGN_PORT_QUANTITY"] = {
//         "terms": {
//             "field": searchingColumns.foreignportColumn + ".keyword",
//             "size": 10
//         },
//         "aggs": {
//             "PORT_QUANTITY": {
//                 "sum": {
//                     "field": searchingColumns.quantityColumn + ".double"
//                 }
//             }
//         }
//     }
// }

// function countryPriceQuantityAggregation(aggregationExpression, searchingColumns) {
//     aggregationExpression.aggs["FILTER_COUNTRY_PRICE_QUANTITY"] = {
//         "terms": {
//             "field": searchingColumns.countryColumn + ".keyword"
//         },
//         "aggs": {
//             "COUNTRY_QUANTITY": {
//                 "sum": {
//                     "field": searchingColumns.quantityColumn + ".double"
//                 }
//             },
//             "COUNTRY_PRICE": {
//                 "sum": {
//                     "field": searchingColumns.priceColumn + ".double"
//                 }
//             }
//         }
//     }
// }

// function hsCodePriceQuantityAggregation(aggregationExpression, searchingColumns) {
//     aggregationExpression.aggs["FILTER_HSCODE_PRICE_QUANTITY"] = {
//         "terms": {
//             "field": searchingColumns.codeColumn + ".keyword"
//         },
//         "aggs": {
//             "CODE_QUANTITY": {
//                 "sum": {
//                     "field": searchingColumns.quantityColumn + ".double"
//                 }
//             },
//             "CODE_PRICE": {
//                 "sum": {
//                     "field": searchingColumns.priceColumn + ".double"
//                 }
//             }
//         }
//     }
// }

// function quantityPriceAggregation(aggregationExpression, searchingColumns) {
//     aggregationExpression.aggs["FILTER_PRICE_QUANTITY"] = {
//         "date_histogram": {
//             "field": searchingColumns.dateColumn,
//             "calendar_interval": "month"
//         },
//         "aggs": {
//             "MONTH_PRICE": {
//                 "sum": {
//                     "field": searchingColumns.priceColumn + ".double"
//                 }
//             },
//             "MONTH_QUANTITY": {
//                 "sum": {
//                     "field": searchingColumns.quantityColumn + ".double"
//                 }
//             }
//         }
//     }
// }




module.exports = {
    findTopCompany,
    // findCompanyDetailsByPatternEngine,
    findAllDataForCompany,
    findTopCountry,
    findAllDataForCountry
}
