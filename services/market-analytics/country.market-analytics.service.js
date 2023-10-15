// @ts-check

const rison = require('rison')
const { query: adxQueryExecuter } = require("../../db/adxDbApi")
const { getADXAccessToken } = require("../../db/accessToken")
const getLoggerInstance = require('../logger/Logger')
const ElasticsearchDbHandler = require("../../db/elasticsearchDbHandler")
const { date } = require('azure-storage')
const { DataExchange } = require('aws-sdk')

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
    async findTopCompanies({ matchExpressions, startDate, endDate, startDateTwo, endDateTwo, dataBucket, ...params }, dateTwoRisonQuery, searchingColumns, searchTerm) {
        try {
            /** get adx access token to run queries */
            const accessToken = await this._getAdxToken();

            /** get base query to search companies based to destination country */
            // @ts-ignore
            let companiesSearchBaseQuery = this._getCompanySearchBaseQuery(dataBucket ?? "", params.destinationCountry ?? "", searchingColumns?.searchField ?? "", searchingColumns?.countryColumn ?? "", searchingColumns?.dateColumn ?? "", startDate, endDate);

            /** fetching the companies from adx */
            let companies = await this._executeQuery(companiesSearchBaseQuery.baseQuery, accessToken)

            /** special method to map companies list */
            let mappedCompaniesResults = this._mapCompaniesList(companies.rows)

            let companyArray = []
            let offset = params.offset ?? 0;
            let limit = params.limit ?? 25;
            for (let i = offset; i < offset + limit; i++) {
                if (i >= mappedCompaniesResults.length) {
                    break;
                }
                companyArray.push(mappedCompaniesResults[i]);
            }

            mappedCompaniesResults = companyArray;
            /** create aggregation query to get stats */
            // @ts-ignore
            // for first date
            async function executeSingleQuery(bucket, companiesResults, buyerName, shipmentColumn, priceColumn, quantityColumn, dateColumn, startDate, endDate, accessToken) {
                const query = this._createAggregationQuery(bucket, companiesResults, buyerName, shipmentColumn, priceColumn, quantityColumn, dateColumn, startDate, endDate);
                const results = await this._executeQuery(query, accessToken);
                const mappedAggregations = this._mapRowAndColumns({ columns: results.columns, rows: results.rows });
                return this._mapResultSet(mappedAggregations, searchingColumns).filter(dt => dt !== null);
            }

            // @ts-ignore
            if (mappedCompaniesResults && mappedCompaniesResults.length > 0) {
                const [bundle, bundle1] = await Promise.all([
                    executeSingleQuery.call(this, dataBucket, mappedCompaniesResults, searchingColumns?.buyerName ?? "", searchingColumns?.shipmentColumn ?? "", searchingColumns?.priceColumn ?? "", searchingColumns?.quantityColumn ?? "", searchingColumns?.dateColumn ?? "", startDate, endDate, accessToken),
                    executeSingleQuery.call(this, dataBucket, mappedCompaniesResults, searchingColumns?.buyerName ?? "", searchingColumns?.shipmentColumn ?? "", searchingColumns?.priceColumn ?? "", searchingColumns?.quantityColumn ?? "", searchingColumns?.dateColumn ?? "", startDateTwo, endDateTwo, accessToken)
                ]);
                return {
                    companies_data: { bundle, bundle1 },
                    risonQuery: {
                        "date1": "(query:(bool:(filter:!(),must:!((bool:(should:!((match:(ORIGIN_COUNTRY:(operator:and,query:ALBANIA)))))),(range:(IMP_DATE:(gte:'2023-08-01T00:00:00.000Z',lte:'2023-08-31T00:00:00.000Z')))),must_not:!(),should:!())))",
                        "date2": "(query:(bool:(filter:!(),must:!((bool:(should:!((match:(ORIGIN_COUNTRY:(operator:and,query:ALBANIA)))))),(range:(IMP_DATE:(gte:'2023-07-01T00:00:00.000Z',lte:'2023-07-31T00:00:00.000Z')))),must_not:!(),should:!())))"
                    },
                }
            } else {
                return null
            }

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
     * @param {string} dateColumn
     * @param {string} startDate
     * @param {string} endDate
     * @param {boolean} materialize weather you want to cache results or not.
     * @returns {{baseQuery: string, baseCompanyQuery: "COMPANIES"}}
     */
    // @ts-ignore
    _getCompanySearchBaseQuery(dataBucket, destinationCountry, searchField, countryColumn, dateColumn, startDate, endDate, materialize = true) {
        let baseQuery = '';

        /** @type {"COMPANIES"} */
        let baseCompanyQuery = "COMPANIES";
        if (materialize) {
            baseQuery += `set query_results_cache_max_age = time(${this.baseQueryCacheTime});
                let Country = materialize(${dataBucket}
                | where ${countryColumn} == '${destinationCountry}'
                | where ${dateColumn} between (datetime(${startDate}).. datetime(${endDate})));
                set query_results_cache_max_age = time(${this.companySearchQueryCacheTime});
                let ${baseCompanyQuery} = Country
                | distinct ${searchField} = ${searchField};
                union ${baseCompanyQuery}`
            // | serialize index = row_number() | where index between (${offset + 1} .. ${limit + offset})

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
     * @param {string} dateColumn
     * @param {string} startDate
     * @param {string} endDate
     * @returns {string}
     */
    _createAggregationQuery(table, companies, columnName, shipmentCountColumn, priceColumn, quantityColumn, dateColumn, startDate, endDate) {
        let jointCompanies = companies.map(company => `"${company}"`).join(", ")
        let baseFilterVariableName = "FILTER_COMPANIES"
        let query = `let ${baseFilterVariableName} = materialize(${table} | where ${columnName} in (${jointCompanies}) 
                     | where ${dateColumn} between (datetime(${startDate}).. datetime(${endDate})));`
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