// @ts-check

const rison = require('rison')
const { query: adxQueryExecuter } = require("../../db/adxDbApi")
const { getADXAccessToken } = require("../../db/accessToken")
const getLoggerInstance = require('../logger/Logger')
const ElasticsearchDbHandler = require("../../db/elasticsearchDbHandler")

/**
 * @class CompaniesMarketAnalyticsService
 * #### Service => ***market analytics***
 * #### Sub service => ***companies search service***
 * - get all the methods related to market analytics companies search.
 * - methods 
 *          - _getDefaultColumnsForIndia 
 *          - _generateParamsFromPayload 
 *          - findTopCompanies
 */
class CountyAnalyticsService {
    constructor() {
        /** @type {"30m"} @private */
        this.baseQueryCacheTime = "30m"

        /** @type {"30m"} @private */
        this.companySearchQueryCacheTime = "30m"

        /**
         * @private
         * instance of query executer function
         */
        this.adxQueryExecuter = adxQueryExecuter;
    };

    /**
     * @param {Partial<import("./country.market-analytics").Payload>} payload
     * @param {any} dateTwoRisonQuery
     * @param {ReturnType<typeof this._getDefaultSearchingColumnsForIndia>} searchingColumns
     * @param {string} searchTerm
     */
    async findTopCompanies({ matchExpressions, startDate, endDate, dataBucket, ...params }, dateTwoRisonQuery, searchingColumns, searchTerm) {
        try {
            // if (dateTwoRisonQuery) {
            //     let recordSize = 0;
            //     let aggregationExpression = {
            //         size: recordSize,
            //         query: {
            //             bool: {
            //                 /** @type {*[]} */
            //                 must: [],
            //                 /** @type {*[]} */
            //                 should: [],
            //                 /** @type {*[]} */
            //                 filter: [],
            //                 /** @type {*[]} */
            //                 must_not: []
            //             },
            //         },
            //         aggs: {},
            //     }

            //     let matchExpression = {}
            //     /** @type {Record<string, any>} */
            //     matchExpression.bool = {
            //         /** @type {*[]} */
            //         should: []
            //     }
            //     matchExpression.bool.should.push({
            //         match: {
            //             [searchingColumns?.countryColumn ?? "expression"]: {
            //                 "query": searchTerm,
            //                 "operator": "and"
            //             }
            //         }
            //     });
            //     aggregationExpression.query.bool.must.push(matchExpression);

            //     let rangeQuery = {
            //         range: {}
            //     }
            //     rangeQuery.range[searchingColumns?.dateColumn] = {
            //         gte: new Date(startDate),
            //         lte: new Date(endDate)
            //     }

            //     aggregationExpression.query.bool.must.push({ ...rangeQuery });

            //     if (matchExpressions) {
            //         for (let i = 0; i < matchExpressions.length; i++) {
            //             if (matchExpressions[i].identifier == 'FILTER_HS_CODE') {
            //                 let filterMatchExpression = {}

            //                 filterMatchExpression.terms = {
            //                     [searchingColumns?.codeColumn ?? ""]: matchExpressions[i].fieldValue,
            //                 }
            //                 aggregationExpression.query.bool.must.push({ ...filterMatchExpression });
            //             } else if (matchExpressions[i].identifier == 'FILTER_FOREIGN_PORT') {
            //                 let filterMatchExpression = {}
            //                 filterMatchExpression.bool = {
            //                     /** @type {*[]} */
            //                     should: []
            //                 }
            //                 for (let j = 0; j < matchExpressions[i].fieldValue.length; j++) {
            //                     filterMatchExpression.bool.should.push({
            //                         match: {
            //                             [searchingColumns?.foreignportColumn ?? ""]: {
            //                                 "operator": "and",
            //                                 "query": matchExpressions[i].fieldValue[j]
            //                             }
            //                         }
            //                     });
            //                 }

            //                 aggregationExpression.query.bool.must.push({ ...filterMatchExpression });
            //             } else if (matchExpressions[i].identifier == 'FILTER_PORT') {
            //                 let filterMatchExpression = {}
            //                 filterMatchExpression.bool = {
            //                     /** @type {*[]} */
            //                     should: []
            //                 }
            //                 for (let j = 0; j < matchExpressions[i].fieldValue.length; j++) {
            //                     filterMatchExpression.bool.should.push({
            //                         match: {
            //                             [searchingColumns?.portColumn ?? ""]: {
            //                                 "operator": "and",
            //                                 "query": matchExpressions[i].fieldValue[j]
            //                             }
            //                         }
            //                     });
            //                 }

            //                 aggregationExpression.query.bool.must.push({ ...filterMatchExpression });
            //             }
            //         }
            //     }
            //     let risonQuery = encodeURI(rison.encode(JSON.parse(JSON.stringify({ "query": aggregationExpression.query }))).toString());
            //     return risonQuery
            // }

            /** get adx access token to run queries */
            const accessToken = await this._getAdxToken();

            /** get base query to search companies based to destination country */
            let companiesSearchBaseQuery = this._getCompanySearchBaseQuery(dataBucket ?? "", params.destinationCountry ?? "", searchingColumns?.searchField, searchingColumns?.countryColumn);

            /** fetching the companies from adx */
            let companies = await this._executeQuery(companiesSearchBaseQuery.baseQuery, accessToken)

            /** special method to map companies list */
            let mappedCompaniesResults = this._mapCompaniesList(companies.rows)

            /** create aggregation query to get stats */
            let aggregationQuery = this._createAggregationQuery(dataBucket ?? "", mappedCompaniesResults, searchingColumns?.buyerName ?? "", searchingColumns?.shipmentColumn ?? "", searchingColumns?.priceColumn ?? "", searchingColumns?.quantityColumn ?? "")

            let aggregationResults = await this._executeQuery(aggregationQuery, accessToken)

            let mappedAggregations = this._mapRowAndColumns({ columns: aggregationResults.columns, rows: aggregationResults.rows })

            let bundle = this._mapResultSet(mappedAggregations, searchingColumns).filter(dt => dt !== null)
            return {
                companies_data: bundle,
                risonQuery: {
                    "date1": "(query:(bool:(filter:!(),must:!((bool:(should:!((match:(ORIGIN_COUNTRY:(operator:and,query:ALBANIA)))))),(range:(IMP_DATE:(gte:'2023-08-01T00:00:00.000Z',lte:'2023-08-31T00:00:00.000Z')))),must_not:!(),should:!())))",
                    "date2": "(query:(bool:(filter:!(),must:!((bool:(should:!((match:(ORIGIN_COUNTRY:(operator:and,query:ALBANIA)))))),(range:(IMP_DATE:(gte:'2023-07-01T00:00:00.000Z',lte:'2023-07-31T00:00:00.000Z')))),must_not:!(),should:!())))"
                },
                companies_count: 11
            }

            let recordSize = 0;
            let aggregationExpression = {
                size: recordSize,
                query: {
                    bool: {
                        /** @type {*[]} */
                        must: [],
                        /** @type {*[]} */
                        should: [],
                        /** @type {*[]} */
                        filter: [],
                        /** @type {*[]} */
                        must_not: []
                    },
                },
                aggs: {},
            }

            let matchExpression = {};

            let rangeQuery = {
                range: {}
            }
            rangeQuery.range[searchingColumns?.dateColumn] = {
                gte: new Date(startDate ?? ""),
                lte: new Date(endDate ?? "")
            }

            aggregationExpression.query.bool.must.push({ ...rangeQuery });

            if (matchExpression) {

                for (let i = 0; i < matchExpression.length; i++) {
                    if (matchExpression[i].identifier == 'FILTER_HS_CODE') {
                        let filterMatchExpression = {}

                        filterMatchExpression.terms = {
                            [searchingColumns?.codeColumn ?? ""]: matchExpression[i].fieldValue,
                        }
                        aggregationExpression.query.bool.must.push({ ...filterMatchExpression });
                    } else if (matchExpression[i].identifier == 'FILTER_FOREIGN_PORT') {
                        let filterMatchExpression = {}
                        filterMatchExpression.bool = {
                            /** @type {*[]} */
                            should: []
                        }
                        for (let j = 0; j < matchExpression[i].fieldValue.length; j++) {
                            filterMatchExpression.bool.should.push({
                                match: {
                                    [searchingColumns?.foreignportColumn ?? ""]: {
                                        "operator": "and",
                                        "query": matchExpression[i].fieldValue[j]
                                    }
                                }
                            });
                        }

                        aggregationExpression.query.bool.must.push({ ...filterMatchExpression });
                    } else if (matchExpression[i].identifier == 'FILTER_PORT') {
                        let filterMatchExpression = {}
                        filterMatchExpression.bool = {
                            /** @type {*[]} */
                            should: []
                        }
                        for (let j = 0; j < matchExpression[i].fieldValue.length; j++) {
                            filterMatchExpression.bool.should.push({
                                match: {
                                    [searchingColumns?.portColumn ?? ""]: {
                                        "operator": "and",
                                        "query": matchExpression[i].fieldValue[j]
                                    }
                                }
                            });
                        }

                        aggregationExpression.query.bool.must.push({ ...filterMatchExpression });
                    }
                }
            }
            let risonQuery = encodeURI(rison.encode(JSON.parse(JSON.stringify({ "query": aggregationExpression.query }))).toString());

            // summaryTopCompanyAggregation(aggregationExpression, searchingColumns);

            // try {
            //     let result = await ElasticsearchDbHandler.dbClient.search({
            //         index: tradeMeta,
            //         track_total_hits: true,
            //         body: aggregationExpression,
            //     });
            //     const data = getResponseDataForCompany(result, false);

            //     return [data, risonQuery];
            // } catch (error) {
            //     throw error;
            // }
        } catch (error) {
            getLoggerInstance(error, __filename, "findTopCompanies")
            throw error;
        }
    }


    /**
     * create base query from the given columns, with materializing queries
     * you can change cache time from the constructor function.
     * @private
     * @param {string} dataBucket
     * @param {string} destinationCountry
     * @param {string=} searchField
     * @param {string=} countryColumn
     * @param {boolean} materialize weather you want to cache results or not.
     * @returns {{baseQuery: string, baseCompanyQuery: "COMPANIES"}}
     */
    _getCompanySearchBaseQuery(dataBucket, destinationCountry, searchField, countryColumn, materialize = true, limit = 10, offset = 0) {
        let baseQuery = '';

        /** @type {"COMPANIES"} */
        let baseCompanyQuery = "COMPANIES";
        if (materialize) {
            baseQuery += `set query_results_cache_max_age = time(${this.baseQueryCacheTime});
                let Country = materialize(${dataBucket}
                | where ${countryColumn} == '${destinationCountry}');
                set query_results_cache_max_age = time(${this.companySearchQueryCacheTime});
                let ${baseCompanyQuery} = Country
                | distinct ${searchField} = ${searchField};
                union ${baseCompanyQuery}
                | serialize index = row_number() | where index between (${offset + 1} .. ${limit + offset})
            `
        } else {
            baseQuery += `
            let Country = materialize(${dataBucket}
            | where ${countryColumn} == '${destinationCountry}');
            let COMPANIES = Country
            | distinct ${searchField} = ${searchField};
            union COMPANIES
        `
        }
        return { baseQuery, baseCompanyQuery };
    }


    /**
     * execute adx queries
     * @private
     * @param {string} query
     * @param {string} accessToken
     * @param {boolean} getOriginal
     * @returns {Promise<{rows: any[], columns: any[], original?: any }>}
     */
    async _executeQuery(query, accessToken, getOriginal = false) {
        try {
            let results = await this.adxQueryExecuter(query, accessToken)
            results = JSON.parse(results)
            if (getOriginal) {
                return {
                    rows: results.Tables[0].Rows,
                    columns: results.Tables[0].Columns,
                    original: results,
                }
            } else {
                return {
                    rows: results.Tables[0].Rows,
                    columns: results.Tables[0].Columns,
                }
            }
        } catch (error) {
            getLoggerInstance(error, __filename, "_findCompanies")
            throw error
        }
    }

    /** 
     * map rows and columns
     * @private
     * @param {{rows: any[], columns: any[]}} params
     */
    _mapRowAndColumns({ columns, rows }) {
        let mappedResults = [];
        for (let row of rows) {
            let obj = {};
            for (let i = 0; i < row.length; i++) {
                let val = row[i];
                for (let j = 0; j < columns.length; j++) {
                    let column = columns[j].ColumnName;
                    if (i == j) {
                        obj[column] = val;
                        continue
                    }
                }
            }
            mappedResults.push(obj)
        }
        return mappedResults;
    }


    /** @returns {Promise<string>} @private */
    async _getAdxToken() {
        return getADXAccessToken();
    }

    /**
     * creating aggregation query for the companies.
     * @private
     * @param {string} table
     * @param {string[]} companies
     * @param {string} columnName
     * @param {string} shipmentCountColumn
     * @param {string} priceColumn
     * @param {string} quantityColumn
     * @returns {string}
     */
    _createAggregationQuery(table, companies, columnName, shipmentCountColumn, priceColumn, quantityColumn) {
        let jointCompanies = companies.map(company => `"${company}"`).join(", ")
        let baseFilterVariableName = "FILTER_COMPANIES"
        let query = `let ${baseFilterVariableName} = materialize(${table} | where ${columnName} in (${jointCompanies}) );`
        query += `
            let SUMMARY_TOTAL_USD_VALUE = ${baseFilterVariableName}
            | summarize SUMMARY_TOTAL_USD_VALUE = sum(${priceColumn}) by ${columnName};
            let SUMMARY_SHIPMENTS = ${baseFilterVariableName}
            | summarize SUMMARY_SHIPMENTS = count_distinct(${shipmentCountColumn}) by ${columnName};
            let SUMMARY_QUANTITY = ${baseFilterVariableName}
            | summarize SUMMARY_QUANTITY = sum(${quantityColumn}) by ${columnName};
            union SUMMARY_TOTAL_USD_VALUE, SUMMARY_SHIPMENTS, SUMMARY_QUANTITY
        `
        return query
    }

    /**
     * map companies rows and return companies list
     * 
     * ‼ ‼ use only when you want to get list of companies
     * @private
     * @param {string[][]} companyRows
     * @returns {string[]}
     */
    _mapCompaniesList(companyRows) {
        /** @type {string[]} */
        let companies = [];
        for (let row of companyRows) {
            let company = row[0];
            if (company !== "") {
                companies.push(company)
            }
        }

        return companies;
    }

    /**
     * @param {string | any[]} mappedAggregations
     * @param {ReturnType<typeof this._getDefaultSearchingColumnsForIndia>} searchingColumns
     * @private
     */
    _mapResultSet(mappedAggregations, searchingColumns) {
        /**
         * @type {{companyName: string, data: {_id: string, price: number, quantity: number, shipments: number}[]}[]}
         */
        let companies_data = []
        for (let i = 0; i < mappedAggregations.length; i++) {
            let result = mappedAggregations[i];

            let existIndex = null;
            let isExist = companies_data.find((data, dataIndex) => {
                if (data.companyName == result[searchingColumns?.searchField ?? ""]) {
                    existIndex = dataIndex;
                    return data
                }
            })

            if (isExist && existIndex !== null) {
                if (!companies_data[existIndex]['data'][0]?.price) companies_data[existIndex]['data'][0].price = result['SUMMARY_TOTAL_USD_VALUE'];
                if (!companies_data[existIndex]['data'][0]?.quantity) companies_data[existIndex]['data'][0].quantity = result['SUMMARY_QUANTITY'];
                if (!companies_data[existIndex]['data'][0]?.shipments) companies_data[existIndex]['data'][0].shipments = result['SUMMARY_SHIPMENTS'];
                continue;
            } else {
                if (!companies_data[i]) {
                    companies_data[i] = {
                        companyName: result[searchingColumns?.searchField ?? ""],
                        data: [
                            {
                                price: result['SUMMARY_TOTAL_USD_VALUE'] ?? 0,
                                quantity: result['SUMMARY_QUANTITY'] ?? 0,
                                shipments: result['SUMMARY_SHIPMENTS'] ?? 0,
                                _id: result[searchingColumns?.searchField ?? ""] ?? "",
                            }
                        ]
                    }
                }
            }
        }

        return companies_data
    }

    /**
     * @description This method is used to get the default columns for the country
     * @param {String} country
     * @param {import("./country.market-analytics").Payload['tradeType']} tradeType
     */
    _getDefaultSearchingColumnsForIndia(country, tradeType) {
        if (country.toLowerCase() !== "india") {
            throw new Error("We are working for other countries reports !!")
        }
        let searchingColumns = null;
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
                foreignportColumn: "PORT_OF_SHIPMENT",
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
                iec: "IEC"
            }
        }
        return searchingColumns;
    }


    /**
     * @description This method is used to get the default columns for the country
     * @param {*} payload
     * @param {any} dataBucket
     * @returns {Partial<import("./country.market-analytics").Payload>}
     */
    _generateParamsFromPayload(payload, dataBucket) {
        /**
         * @type {Partial<import("./country.market-analytics").Payload>}
         */
        let params = {
            destinationCountry: payload.destinationCountry.trim().toUpperCase(),
            matchExpressions: payload.matchExpressions ? payload.matchExpressions : null,
            offset: payload.start != null ? payload.start : 0,
            limit: payload.length != null ? payload.length : 10,
            startDate: payload.dateRange.startDate ?? null,
            endDate: payload.dateRange.endDate ?? null,
            startDateTwo: payload.dateRange.startDateTwo ?? null,
            endDateTwo: payload.dateRange.endDateTwo ?? null,
            tradeType: payload.tradeType.trim().toUpperCase(),
            originCountry: payload.originCountry.trim().toUpperCase(),
            dataBucket: dataBucket,
        }
        return params;
    }
}

module.exports = { CountyAnalyticsService };