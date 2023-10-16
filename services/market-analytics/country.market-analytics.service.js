// @ts-check

const rison = require('rison')
const { query: adxQueryExecuter } = require("../../db/adxDbApi")
const { getADXAccessToken } = require("../../db/accessToken")
const getLoggerInstance = require('../logger/Logger')
// @ts-ignore
const ElasticsearchDbHandler = require("../../db/elasticsearchDbHandler")
// @ts-ignore
const { date } = require('azure-storage')
// @ts-ignore
const { DataExchange } = require('aws-sdk')
const { RESULT_PORTION_TYPE_SUMMARY } = require('../../schemas/workspaceSchema')

/**
 * @class CompaniesMarketAnalyticsService
 * #### Service => ***market analytics***
 * #### Sub service => ***companies search service***
 * ### Sub service => *** filters service ****
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
                const query = this._createCompanyAggregationQuery(bucket, companiesResults, buyerName, shipmentColumn, priceColumn, quantityColumn, dateColumn, startDate, endDate);
                const results = await this._executeQuery(query, accessToken);
                const mappedAggregations = this._mapRowAndColumns({ columns: results.columns, rows: results.rows });
                return this._mapCompaniesResultSet(mappedAggregations, searchingColumns).filter(dt => dt !== null);
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

    async findTopCountries({ matchExpressions, startDate, endDate, startDateTwo, endDateTwo, dataBucket, ...params }, dateTwoRisonQuery, searchingColumns, searchTerm) {
        try {
            /** get adx access token to run queries */
            const accessToken = await this._getAdxToken();

            /** get base query to search companies based to destination country */
            // @ts-ignore
            let countriesSearchBaseQuery = this._getCountrySearchBaseQuery(dataBucket ?? "", params.companyName ?? "", searchingColumns?.searchField ?? "", searchingColumns?.countryColumn ?? "", searchingColumns?.dateColumn ?? "", startDate, endDate);

            /** fetching the companies from adx */
            let companies = await this._executeQuery(countriesSearchBaseQuery.baseQuery, accessToken)

            /** special method to map companies list */
            let mappedCountriesResults = this._mapCountriesList(companies.rows)

            let countryArray = []
            let offset = params.offset ?? 0;
            let limit = params.limit ?? 25;
            for (let i = offset; i < offset + limit; i++) {
                if (i >= mappedCountriesResults.length) {
                    break;
                }
                countryArray.push(mappedCountriesResults[i]);
            }

            mappedCountriesResults = countryArray;
            /** create aggregation query to get stats */
            // for first date
            // @ts-ignore
            async function executeSingleQuery(bucket, countriesResults, buyerName, shipmentColumn, priceColumn, quantityColumn, dateColumn, codeColumn, startDate, endDate, accessToken) {
                const query = this._createCountryAggregationQuery(bucket, countriesResults, buyerName, shipmentColumn, priceColumn, quantityColumn, dateColumn, startDate, endDate);
                const results = await this._executeQuery(query, accessToken);
                const queryHSCode = this._createCountryAggregationQuery(bucket, countriesResults, buyerName, shipmentColumn, priceColumn, quantityColumn, dateColumn, codeColumn, startDate, endDate);
                const resultsHSCode = await this._executeQuery(queryHSCode, accessToken);
                const mappedAggregations = this._mapRowAndColumns({ columns: results.columns, rows: results.rows });
                return this._mapCountriesResultSet(mappedAggregations, searchingColumns).filter(dt => dt !== null);
            }

            // @ts-ignore
            if (mappedCountriesResults && mappedCountriesResults.length > 0) {
                const [bundle, bundle1] = await Promise.all([
                    executeSingleQuery.call(this, dataBucket, mappedCountriesResults, searchingColumns?.countryColumn ?? "", searchingColumns?.shipmentColumn ?? "", searchingColumns?.priceColumn ?? "", searchingColumns?.quantityColumn ?? "", searchingColumns?.dateColumn ?? "", searchingColumns?.codeColumn ?? "", startDate, endDate, accessToken),
                    executeSingleQuery.call(this, dataBucket, mappedCountriesResults, searchingColumns?.countryColumn ?? "", searchingColumns?.shipmentColumn ?? "", searchingColumns?.priceColumn ?? "", searchingColumns?.quantityColumn ?? "", searchingColumns?.dateColumn ?? "", searchingColumns?.codeColumn ?? "", startDateTwo, endDateTwo, accessToken)
                ]);
                return {
                    countries_data: { bundle, bundle1 }
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
     * @param {any} dataBucket
     * @param {any} companyName
     * @param {any} searchField
     * @param {any} countryColumn
     * @param {any} dateColumn
     * @param {any} startDate
     * @param {any} endDate
    */
    // @ts-ignore
    _getCountrySearchBaseQuery(dataBucket, companyName, searchField, countryColumn, dateColumn, startDate, endDate, materialize = true) {
        let baseQuery = '';

        /** @type {"COUNTRIES"} */
        let baseCountryQuery = "COUNTRIES";
        if (materialize) {
            baseQuery += `set query_results_cache_max_age = time(${this.baseQueryCacheTime});
                let Company = materialize(${dataBucket}
                | where ${searchField} == '${companyName}'
                | where ${dateColumn} between (datetime(${startDate}).. datetime(${endDate})));
                set query_results_cache_max_age = time(${this.companySearchQueryCacheTime});
                let ${baseCountryQuery} = Company
                | distinct ${countryColumn} = ${countryColumn};
                union ${baseCountryQuery}`

        } else {
            baseQuery += `
            let Company = materialize(${dataBucket}
            | where ${searchField} == '${companyName}');
            let COMPANIES = Company
            | distinct ${countryColumn} = ${countryColumn};
            union COMPANIES
        `
        }
        return { baseQuery, baseCountryQuery };
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
    // @ts-ignore
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
    _createCompanyAggregationQuery(table, companies, columnName, shipmentCountColumn, priceColumn, quantityColumn, dateColumn, startDate, endDate) {
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
     * @param {any} table
     * @param {any[]} countries
     * @param {any} columnName
     * @param {any} shipmentCountColumn
     * @param {any} priceColumn
     * @param {any} quantityColumn
     * @param {any} dateColumn
     * @param {any} startDate
     * @param {any} endDate
     */
    _createCountryAggregationQuery(table, countries, columnName, shipmentCountColumn, priceColumn, quantityColumn, dateColumn, startDate, endDate) {
        let jointCountries = countries.map(country => `"${country}"`).join(", ")
        let baseFilterVariableName = "FILTER_COUNTRIES"
        let query = `let ${baseFilterVariableName} = materialize(${table} | where ${columnName} in (${jointCountries}) 
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
     * @param {any} table
     * @param {any[]} countries
     * @param {any} columnName
     * @param {any} shipmentCountColumn
     * @param {any} priceColumn
     * @param {any} quantityColumn
     * @param {any} dateColumn
     * @param {any} codeColumn
     * @param {any} startDate
     * @param {any} endDate
     */
    _createCountryHSNestedAggregationQuery(table, countries, columnName, shipmentCountColumn, priceColumn, quantityColumn, dateColumn, codeColumn, startDate, endDate) {
        let jointCountries = countries.map(country => `"${country}"`).join(", ")
        let baseFilterVariableName = "FILTER_COUNTRIES"
        let query = `let ${baseFilterVariableName} = materialize(${table} | where ${columnName} in (${jointCountries}) 
                     | where ${dateColumn} between (datetime(${startDate}).. datetime(${endDate})));`
        query += `
            let SUMMARY_TOTAL_USD_VALUE = ${baseFilterVariableName}
            | summarize SUMMARY_TOTAL_USD_VALUE = sum(${priceColumn}) by ${columnName}, ${codeColumn};
            let SUMMARY_SHIPMENTS = ${baseFilterVariableName}
            | summarize SUMMARY_SHIPMENTS = count_distinct(${shipmentCountColumn}) by ${columnName}, ${codeColumn};
            let SUMMARY_QUANTITY = ${baseFilterVariableName}
            | summarize SUMMARY_QUANTITY = sum(${quantityColumn}) by ${columnName}, ${codeColumn};
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
     * @param {any} countryRows
     */
    _mapCountriesList(countryRows) {
        /** @type {string[]} */
        let countries = [];
        for (let row of countryRows) {
            let country = row[0];
            if (country !== "") {
                countries.push(country)
            }
        }

        return countries;
    }

    /**
     * @param {string | any[]} mappedAggregations
     * @param {ReturnType<typeof this._getDefaultSearchingColumnsForIndia>} searchingColumns
     * @private
     */
    _mapCompaniesResultSet(mappedAggregations, searchingColumns) {
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
     * @param {string | any[]} mappedAggregations
     * @param {ReturnType<typeof this._getDefaultSearchingColumnsForIndia>} searchingColumns
     * @private
     */
    _mapCountriesResultSet(mappedAggregations, searchingColumns) {
        let countries_data = []
        for (let i = 0; i < mappedAggregations.length; i++) {
            let result = mappedAggregations[i];

            let existIndex = null;
            let isExist = countries_data.find((data, dataIndex) => {
                if (data.countryName == result[searchingColumns?.countryColumn ?? ""]) {
                    existIndex = dataIndex;
                    return data
                }
            })

            if (isExist && existIndex !== null) {
                if (!countries_data[existIndex]['data'][0]?.price) countries_data[existIndex]['data'][0].price = result['SUMMARY_TOTAL_USD_VALUE'];
                if (!countries_data[existIndex]['data'][0]?.quantity) countries_data[existIndex]['data'][0].quantity = result['SUMMARY_QUANTITY'];
                if (!countries_data[existIndex]['data'][0]?.shipments) countries_data[existIndex]['data'][0].shipments = result['SUMMARY_SHIPMENTS'];
                continue;
            } else {
                if (!countries_data[i]) {
                    countries_data[i] = {
                        countryName: result[searchingColumns?.countryColumn ?? ""],
                        data: [
                            {
                                price: result['SUMMARY_TOTAL_USD_VALUE'] ?? 0,
                                quantity: result['SUMMARY_QUANTITY'] ?? 0,
                                shipments: result['SUMMARY_SHIPMENTS'] ?? 0,
                                _id: result[searchingColumns?.countryColumn ?? ""] ?? "",
                            }
                        ]
                    }
                }
            }
        }

        return countries_data
    }

    /**
     * @description This method is used to get the default columns for the country
     * @param {String} country
     * @param {string} tradeType
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
     */
    _generateParamsFromPayload(payload, dataBucket) {
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
    // @ts-ignore
    async _getfiltersformarketanalyticsquery({ matchExpressions, startDate, endDate, startDateTwo, endDateTwo, dataBucket, ...params }, dateTwoRisonQuery, searchingColumns, searchTerm) {

        const accessToken = await this._getAdxToken();
        /**  get query for filters */
        let companiesSearchfiltereQuery = this._getfiltersquery(dataBucket ?? "", params.destinationCountry ?? "", searchingColumns?.countryColumn, startDateTwo, endDate, searchingColumns?.priceColumn, searchingColumns?.searchField, searchingColumns?.quantityColumn, searchingColumns?.portColumn, searchingColumns?.codeColumn, searchingColumns?.foreignportColumn, searchingColumns?.dateColumn);
        // execute the query
        console.log(companiesSearchfiltereQuery)
        let results = await this.adxQueryExecuter(companiesSearchfiltereQuery, accessToken);
        results = JSON.parse(results)
        let mappedResult = this._mapadxfilters(results.Tables[0].Columns, results.Tables[0].Rows)
        return mappedResult;
    }

    /**
     * @param {any} table
     * @param {any} destinationCountry
     * @param {any} columnName
     * @param {any} startdate
     * @param {any} enddate
     * @param {any} priceColumn
     * @param {any} searchField
     * @param {any} quantityColumn
     * @param {any} portColumn
     * @param {any} codeColumn
     * @param {any} foreignportColumn
     * @param {any} dateColumn
     */
    _getfiltersquery(table, destinationCountry, columnName, startdate, enddate, priceColumn, searchField, quantityColumn, portColumn, codeColumn, foreignportColumn, dateColumn) {

        let baseFilterVariableName = "filter_data"
        let query = `let ${baseFilterVariableName} = materialize(${table} | where ${dateColumn}
                          between (datetime(${startdate}).. datetime(${enddate})) | where ${columnName} == "${destinationCountry}");`
        query += `
            let appliedports = ${baseFilterVariableName}
            | summarize price = sum(${priceColumn}), company= count_distinct(${searchField}),quantity= sum(${quantityColumn}) by ${portColumn};
            let hs_code = ${baseFilterVariableName}
            | summarize price = sum(${priceColumn}), company= count_distinct(${searchField}),quantity= sum(${quantityColumn}) by ${codeColumn};
            let filterport = ${baseFilterVariableName}
            | summarize price = sum(${priceColumn}), company= count_distinct(${searchField}),quantity= sum(${quantityColumn}) by ${foreignportColumn};
            union appliedports, hs_code, filterport
        `
        return query
    }

    /**
     * @param {any[]} cols
     * @param {any[]} rows
     */
    _mapadxfilters(cols, rows) {
        let columnsObj = {
            PORT_OF_SHIPMENT: [],
            HS_CODE: [],
            INDIAN_PORT: [],
        }
        let priceIndex = 0;
        let quantityIndex = 0;
        let companyIndex = 0;

        cols.map((col, i) => {
            if (col.ColumnName == "price") {
                priceIndex = i;
            }
            if (col.ColumnName == "quantity") {
                quantityIndex = i;
            }
            if (col.ColumnName == "company") {
                companyIndex = i
            }
        })
        cols?.map((col, i) => {
            rows?.forEach((row) => {
                if (!(col.ColumnName == "price" || col.ColumnName == "quantity" || col.ColumnName == "company")) {
                    if (row[i] != '') {
                        let obj = {
                            _id: row[i],
                            price: row[priceIndex],
                            quantity: row[quantityIndex],
                            companies: row[companyIndex]
                        }
                        columnsObj?.[col?.ColumnName]?.push(obj)
                    }
                }
            })
        })
        // @ts-ignore
        columnsObj = {
            'FILTER_PORT': columnsObj['INDIAN_PORT'],
            'FILTER_HS_CODE': columnsObj['HS_CODE'],
            'FILTER_FOREIGN_PORT': columnsObj['PORT_OF_SHIPMENT'],
        };
        return columnsObj;
    }

    /**
     * @param {{ companyName: string; matchExpressions: any; start: null; length: null; dateRange: { startDate: any; endDate: any; startDateTwo: any; endDateTwo: any; }; tradeType: string; originCountry: string; }} payload
     * @param {string} dataBucket
     */
    _generateCompanyParamsFromPayload(payload, dataBucket) {
        let params = {
            companyName: payload.companyName.trim().toUpperCase(),
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