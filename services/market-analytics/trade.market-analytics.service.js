// @ts-check
const { query: adxQueryExecuter } = require("../../db/adxDbApi");
const { getADXAccessToken } = require("../../db/accessToken");
const getLoggerInstance = require('../logger/Logger');
// @ts-ignore
const MongoDbHandler = require("../../db/mongoDbHandler");


class TradeAnalyticsService {
    constructor() {
        /** @type {"30m"} @private */
        this.baseQueryCacheTime = "30m"

        /** @type {"30m"} @private */
        this.tradeSearchQueryCacheTime = "30m"

        /**
         * @private
         * instance of query executer function
         */
        this.adxQueryExecuter = adxQueryExecuter;
    };

    /**
     * @description This method is used to get the default columns for the country and trade
     * @param {String} country
     * @param {string} tradeType
     */
    _getDefaultAnalyticsSearchingColumns(country, tradeType) {
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

    /** @returns {Promise<string>} @private */
    async _getAdxToken() {
        return getADXAccessToken();
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
            getLoggerInstance(error, __filename, "ADXQueryExecutor")
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

    /**
     * @description This method is used to generate the search parameters
     *              using passed request body
     * @param {*} payload
     * @param {any} dataBucket
     */
    _generateParamsFromPayload(payload, dataBucket) {
        let params = {
            matchExpressions: payload.fiterAppied ?? [],
            offset: payload.start != null ? payload.start : 0,
            limit: payload.length != null ? payload.length : 10,
            startDate: payload.dateRange.startDate ?? null,
            endDate: payload.dateRange.endDate ?? null,
            startDateTwo: payload.dateRange.startDateTwo ?? null,
            endDateTwo: payload.dateRange.endDateTwo ?? null,
            tradeType: payload.tradeType.trim().toUpperCase(),
            originCountry: payload.originCountry.trim().toUpperCase(),
            valueFilterRangeFlag: payload.valueFilterRangeFlag ?? false,
            valueFilterRangeArr: payload.valueFilterRangeArr ?? [],
            shipmentFilterRangeFlag: payload.shipmentFilterRangeFlag ?? false,
            shipmentFilterRangeArr: payload.shipmentFilterRangeArr ?? [],
            dataBucket: dataBucket,
        }
        return params;
    }


    /**
     * @param {{ offset: any; limit: any; startDate: any; endDate: any; startDateTwo: any; endDateTwo: any; destinationCountry?: any; matchExpressions?: any; tradeType?: any; originCountry?: any; dataBucket?: any; }} params
     * @param {{ searchField: string; dateColumn: string; unitColumn: string; priceColumn: string; quantityColumn: string; portColumn: string; countryColumn: string; sellerName: string; buyerName: string; codeColumn: string; shipmentColumn: string; foreignportColumn: string; iec: string; } | null} searchingColumns
     */
    async findTopCompanies(params, searchingColumns) {
        try {
            /** get adx access token to run queries */
            const accessToken = await this._getAdxToken();

            /** get base query to search companies based to destination country */
            // @ts-ignore
            let companiesSearchBaseQuery = this._getCompanySearchBaseQuery(params, searchingColumns);

            /** fetching the companies from adx */
            let companies = await this._executeQuery(companiesSearchBaseQuery, accessToken)

            /** special method to map companies list */
            let mappedCompaniesResults = this._mapCompaniesList(companies.rows)

            const companies_count = mappedCompaniesResults.length;

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

            // @ts-ignore
            if (mappedCompaniesResults && mappedCompaniesResults.length > 0) {
                const [date1Data, date2Data] = await Promise.all([
                    this.getMappedCompaniesAnalyticsData.call(this, params, searchingColumns, mappedCompaniesResults, params.startDate, params.endDate, accessToken),
                    this.getMappedCompaniesAnalyticsData.call(this, params, searchingColumns, mappedCompaniesResults, params.startDateTwo, params.endDateTwo, accessToken)
                ]);
                return {
                    trade_count: companies_count,
                    trade_data: { date1Data, date2Data },
                    risonQuery: {
                        "date1": "(query:(bool:(filter:!(),must:!((bool:(should:!((match:(ORIGIN_COUNTRY:(operator:and,query:ALBANIA)))))),(range:(IMP_DATE:(gte:'2023-08-01T00:00:00.000Z',lte:'2023-08-31T00:00:00.000Z')))),must_not:!(),should:!())))",
                        "date2": "(query:(bool:(filter:!(),must:!((bool:(should:!((match:(ORIGIN_COUNTRY:(operator:and,query:ALBANIA)))))),(range:(IMP_DATE:(gte:'2023-07-01T00:00:00.000Z',lte:'2023-07-31T00:00:00.000Z')))),must_not:!(),should:!())))"
                    },
                }
            } else {
                return null;
            }

        } catch (error) {
            getLoggerInstance(error, __filename, "findTopCompanies")
            throw error;
        }
    }

    /**
     * @param {{ offset?: any; limit?: any; startDate: any; endDate: any; startDateTwo?: any; endDateTwo?: any; destinationCountry?: any; matchExpressions: any; tradeType?: any; originCountry?: any; dataBucket: any; valueFilterRangeFlag?: any; valueFilterRangeArr?: any; shipmentFilterRangeFlag?: any; shipmentFilterRangeArr?: any; }} params
     * @param {{ searchField: string; dateColumn: string; unitColumn: string; priceColumn: string; quantityColumn: string; portColumn: string; countryColumn: string; sellerName: string; buyerName: string; codeColumn: string; shipmentColumn: string; foreignportColumn: string; iec: string; } | null} searchingColumns
     */
    _getCompanySearchBaseQuery(params, searchingColumns) {
        let baseQuery = '';

        /** @type {"COMPANIES"} */
        let baseCompanyQuery = "COMPANIES";
        baseQuery += `set query_results_cache_max_age = time(${this.baseQueryCacheTime});
                let Country = materialize(${params.dataBucket}
                | where ${searchingColumns?.dateColumn} between (datetime(${params.startDate}).. datetime(${params.endDate}))`;

        for (let expression of params.matchExpressions) {
            if (expression.identifier == 'FILTER_HS_CODE') {
                let appliedHSCodes = expression.fieldValue.map(hsCode => `"${hsCode}"`).join(", ")
                baseQuery += ` | where ${expression.fieldTerm} in (${appliedHSCodes}) `
            }
        }

        baseQuery += ");"

        baseQuery += `set query_results_cache_max_age = time(${this.tradeSearchQueryCacheTime});
                let ${baseCompanyQuery} = Country`

        if (params.valueFilterRangeFlag && params.shipmentFilterRangeFlag) {
            baseQuery += ` | summarize shipmentCount = count_distinct(${searchingColumns?.shipmentColumn}),
            priceCount = sum(${searchingColumns?.priceColumn}) by ${searchingColumns?.searchField}
            | where priceCount between (${params?.valueFilterRangeArr[0]["from"]} .. ${params?.valueFilterRangeArr[0]["to"]}) 
            | where shipmentCount between (${params?.shipmentFilterRangeArr[0]["from"]} .. ${params?.shipmentFilterRangeArr[0]["to"]}) `
        }
        else if (params.valueFilterRangeFlag) {
            baseQuery += ` | summarize priceCount = sum(${searchingColumns?.priceColumn}) by ${searchingColumns?.searchField}
            | where priceCount between (${params?.valueFilterRangeArr[0]["from"]} .. ${params?.valueFilterRangeArr[0]["to"]}) `
        }
        else if (params.shipmentFilterRangeFlag) {
            baseQuery += ` | summarize shipmentCount = count_distinct(${searchingColumns?.shipmentColumn}) by ${searchingColumns?.searchField}
            | where shipmentCount between (${params?.shipmentFilterRangeArr[0]["from"]} .. ${params?.shipmentFilterRangeArr[0]["to"]}) `
        }

        baseQuery += `| distinct ${searchingColumns?.searchField} = ${searchingColumns?.searchField};
        union ${baseCompanyQuery}`

        return baseQuery;
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
     * @param {string[]} companiesResults
     * @param {string} accessToken
     * @param {any} params
     * @param {{searchField: string;dateColumn: string;unitColumn: string;priceColumn: string;quantityColumn: string;portColumn: string;countryColumn: string;sellerName: string;buyerName: string;codeColumn: string;shipmentColumn: string;foreignportColumn: string;iec: string;} | null} searchingColumns
     * @param {any} startDate
     * @param {any} endDate
     */
    async getMappedCompaniesAnalyticsData(params, searchingColumns, companiesResults, startDate, endDate, accessToken) {
        const query = this._createCompanyAggregationQuery(params, searchingColumns, companiesResults, startDate, endDate);
        const results = await this._executeQuery(query, accessToken);
        const mappedAggregations = this._mapRowAndColumns({ columns: results.columns, rows: results.rows });
        return this._mapCompaniesResultSet(mappedAggregations, searchingColumns).filter(dt => dt !== null);
    }

    /**
     * @param {{ dataBucket: any; matchExpressions: any; valueFilterRangeFlag: any; valueFilterRangeArr: { [x: string]: any; }[]; shipmentFilterRangeFlag: any; shipmentFilterRangeArr: { [x: string]: any; }[]; }} params
     * @param {{ searchField: string; dateColumn: string; unitColumn: string; priceColumn: string; quantityColumn: string; portColumn: string; countryColumn: string; sellerName: string; buyerName: string; codeColumn: string; shipmentColumn: string; foreignportColumn: string; iec: string; } | null} searchingColumns
     * @param {any[]} companies
     * @param {any} startDate
     * @param {any} endDate
     */
    _createCompanyAggregationQuery(params, searchingColumns, companies, startDate, endDate) {
        let jointCompanies = companies.map(company => `"${company}"`).join(", ")
        let baseFilterVariableName = "FILTER_COMPANIES"
        let query = `let ${baseFilterVariableName} = materialize(${params.dataBucket} | where ${searchingColumns?.searchField} in (${jointCompanies}) 
                     | where ${searchingColumns?.dateColumn} between (datetime(${startDate}).. datetime(${endDate}))`

        for (let expression of params.matchExpressions) {
            if (expression.identifier == 'FILTER_HS_CODE') {
                let appliedHSCodes = expression.fieldValue.map(hsCode => `"${hsCode}"`).join(", ")
                query += ` | where ${expression.fieldTerm} in (${appliedHSCodes}) `
            }
        }

        query += ");";

        query += `
            let AGGREGATED_VALUES = ${baseFilterVariableName}
            | summarize SUMMARY_TOTAL_USD_VALUE = sum(${searchingColumns?.priceColumn}) ,
            SUMMARY_SHIPMENTS = count_distinct(${searchingColumns?.shipmentColumn}) ,
            SUMMARY_QUANTITY = sum(${searchingColumns?.quantityColumn}) by ${searchingColumns?.searchField}`

        if (params.valueFilterRangeFlag) {
            query += ` | where SUMMARY_TOTAL_USD_VALUE between (${params?.valueFilterRangeArr[0]["from"]} .. ${params?.valueFilterRangeArr[0]["to"]}) `
        }

        if (params.shipmentFilterRangeFlag) {
            query += ` | where SUMMARY_SHIPMENTS between (${params?.shipmentFilterRangeArr[0]["from"]} .. ${params?.shipmentFilterRangeArr[0]["to"]}) `
        }

        query += `; union AGGREGATED_VALUES`
        return query
    }

    /**
     * @param {string | any[]} mappedAggregations
     * @param {ReturnType<typeof this._getDefaultAnalyticsSearchingColumns>} searchingColumns
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
     * @param {{ matchExpressions: any; offset: any; limit: any; startDate: any; endDate: any; startDateTwo: any; endDateTwo: any; tradeType: any; originCountry: any; valueFilterRangeFlag: any; valueFilterRangeArr: any; shipmentFilterRangeFlag: any; shipmentFilterRangeArr: any; dataBucket: any; destinationCountry?: any; }} params
     * @param {{ searchField: string; dateColumn: string; unitColumn: string; priceColumn: string; quantityColumn: string; portColumn: string; countryColumn: string; sellerName: string; buyerName: string; codeColumn: string; shipmentColumn: string; foreignportColumn: string; iec: string; } | null} searchingColumns
     */
    async _getTradeWiseMarketAnalyticsFilters(params, searchingColumns) {

        const accessToken = await this._getAdxToken();

        /**  get query for filters */
        let companiesSearchfiltereQuery = this._getTradeWiseMarketAnalyticsFiltersQuery(params, searchingColumns);

        let results = await this.adxQueryExecuter(companiesSearchfiltereQuery, accessToken);
        results = JSON.parse(results)

        let mappedResult = this._mapCountryWiseMarketAnalyticsFilters(results.Tables[0].Columns, results.Tables[0].Rows)
        return mappedResult;
    }

    /**
     * @param {{ matchExpressions: any; offset?: any; limit?: any; startDate?: any; endDate: any; startDateTwo: any; endDateTwo?: any; tradeType?: any; originCountry?: any; valueFilterRangeFlag: any; valueFilterRangeArr: any; shipmentFilterRangeFlag: any; shipmentFilterRangeArr: any; dataBucket: any; destinationCountry?: any; }} params
     * @param {{ searchField: string; dateColumn: string; unitColumn: string; priceColumn: string; quantityColumn: string; portColumn: string; countryColumn: string; sellerName: string; buyerName: string; codeColumn: string; shipmentColumn: string; foreignportColumn: string; iec: string; } | null} searchingColumns
     */
    _getTradeWiseMarketAnalyticsFiltersQuery(params, searchingColumns) {

        let baseFilterVariableName = "filter_data"
        let query = `let ${baseFilterVariableName} = materialize(${params.dataBucket} | where ${searchingColumns?.dateColumn}
                          between (datetime(${params.startDateTwo}).. datetime(${params.endDate}))`

        for (let expression of params.matchExpressions) {
            if (expression.identifier == 'FILTER_HS_CODE') {
                let appliedHSCodes = expression.fieldValue.map(hsCode => `"${hsCode}"`).join(", ")
                query += ` | where ${expression.fieldTerm} in (${appliedHSCodes}) `
            }
        }

        query += ");";

        query += `let hs_code = ${baseFilterVariableName}
            | summarize price = sum(${searchingColumns?.priceColumn}), company= count_distinct(${searchingColumns?.searchField}),
            quantity= sum(${searchingColumns?.quantityColumn}) , shipment = count_distinct(${searchingColumns?.shipmentColumn}) by ${searchingColumns?.codeColumn}`

        if (params.valueFilterRangeFlag) {
            query += ` | where price between (${params?.valueFilterRangeArr[0]["from"]} .. ${params?.valueFilterRangeArr[0]["to"]})`
        }

        if (params.shipmentFilterRangeFlag) {
            query += ` | where shipment between (${params?.shipmentFilterRangeArr[0]["from"]} .. ${params?.shipmentFilterRangeArr[0]["to"]})`
        }

        query += `; union hs_code`
        return query
    }

    /**
     * @param {any[]} cols
     * @param {any[]} rows
     */
    _mapCountryWiseMarketAnalyticsFilters(cols, rows) {
        let columnsObj = {
            HS_CODE: []
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
            'FILTER_HS_CODE': columnsObj['HS_CODE']
        }

        return columnsObj;
    }

    /**
     * @param {{ companyName: string; matchExpressions: any; start: null; length: null; dateRange: { startDate: any; endDate: any; startDateTwo: any; endDateTwo: any; }; tradeType: string; originCountry: string; }} payload
     * @param {string} dataBucket
     */
    _generateCompanyParamsFromPayload(payload, dataBucket) {
        let params = {
            companyName: payload.companyName.trim().toUpperCase(),
            matchExpressions: payload.matchExpressions ? payload.matchExpressions : [],
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

    /**
     * @param {{ companyName: any; matchExpressions?: any; offset: any; limit: any; startDate?: any; endDate?: any; startDateTwo?: any; endDateTwo?: any; tradeType?: string; originCountry?: string; dataBucket?: string; }} params
     * @param {{ searchField: string; dateColumn: string; unitColumn: string; priceColumn: string; quantityColumn: string; portColumn: string; countryColumn: string; sellerName: string; buyerName: string; codeColumn: string; shipmentColumn: string; foreignportColumn: string; iec: string; } | null} searchingColumns
     */
    async findTopCountries(params, searchingColumns) {
        try {
            /** get adx access token to run queries */
            const accessToken = await this._getAdxToken();

            /** get base query to search companies based to destination country */
            let countriesSearchBaseQuery = this._getCountrySearchBaseQuery(params, searchingColumns);

            /** fetching the companies from adx */
            let companies = await this._executeQuery(countriesSearchBaseQuery, accessToken)

            /** special method to map companies list */
            let mappedCountriesResults = this._mapCountriesList(companies.rows)

            let countries_count = mappedCountriesResults.length;

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

            if (mappedCountriesResults && mappedCountriesResults.length > 0) {

                const date1Data = await this.getMappedCountriesAnalyticsData.call(this, params, searchingColumns, mappedCountriesResults, params.startDate, params.endDate, accessToken);
                const date2Data = await this.getMappedCountriesAnalyticsData.call(this, params, searchingColumns, mappedCountriesResults, params.startDateTwo, params.endDateTwo, accessToken, date1Data.hs_codes);

                return {
                    countries_count: countries_count,
                    countries_data: { date1Data: date1Data?.countries_data, date2Data: date2Data?.countries_data }
                }
            } else {
                return null;
            }

        } catch (error) {
            getLoggerInstance(error, __filename, "findTopCompanies")
            throw error;
        }
    }

    /**
     * @param {any} params
     * @param {any} searchingColumns
     */
    _getCountrySearchBaseQuery(params, searchingColumns) {
        let baseQuery = '';

        /** @type {"COUNTRIES"} */
        let baseCountryQuery = "COUNTRIES";
        baseQuery += `set query_results_cache_max_age = time(${this.baseQueryCacheTime});
            let Company = materialize(${params.dataBucket}
            | where ${searchingColumns?.searchField} == '${params.companyName}'
            | where ${searchingColumns?.dateColumn} between (datetime(${params.startDate}).. datetime(${params.endDate}))`;

        for (let expression of params.matchExpressions) {
            if (expression.identifier == 'FILTER_HS_CODE') {
                let appliedHSCodes = expression.fieldValue.map(hsCode => `"${hsCode}"`).join(", ")
                baseQuery += ` | where ${expression.fieldTerm} in (${appliedHSCodes}) `
            }

            if (expression.identifier == 'FILTER_FOREIGN_PORT') {
                let appliedForeignPorts = expression.fieldValue.map(foreignPort => `"${foreignPort}"`).join(", ")
                baseQuery += ` | where ${expression.fieldTerm} in (${appliedForeignPorts}) `
            }

            if (expression.identifier == 'FILTER_PORT') {
                let appliedPorts = expression.fieldValue.map(port => `"${port}"`).join(", ")
                baseQuery += ` | where ${expression.fieldTerm} in (${appliedPorts}) `
            }
        }

        baseQuery += ");";

        baseQuery += `set query_results_cache_max_age = time(${this.tradeSearchQueryCacheTime});
            let ${baseCountryQuery} = Company
            | distinct ${searchingColumns?.countryColumn} = ${searchingColumns?.countryColumn};
            union ${baseCountryQuery}`

        return baseQuery
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
     * @param {any} params
     * @param {{ searchField: string; dateColumn: string; unitColumn: string; priceColumn: string; quantityColumn: string; portColumn: string; countryColumn: string; sellerName: string; buyerName: string; codeColumn: string; shipmentColumn: string; foreignportColumn: string; iec: string; } | null} searchingColumns
     * @param {any[]} countriesResults
     * @param {any} startDate
     * @param {any} endDate
     * @param {string} accessToken
     */
    async getMappedCountriesAnalyticsData(params, searchingColumns, countriesResults, startDate, endDate, accessToken, hs_codes = []) {
        const query = this._createCountryAggregationQuery(params, searchingColumns, countriesResults, startDate, endDate, hs_codes);
        const results = await this._executeQuery(query, accessToken);
        const mappedAggregations = this._mapRowAndColumns({ columns: results.columns, rows: results.rows });
        return this._mapCountriesResultSet(mappedAggregations);
    }

    /**
     * @param {{ dataBucket: any; matchExpressions: any; }} params
     * @param {{ searchField: string; dateColumn: string; unitColumn: string; priceColumn: string; quantityColumn: string; portColumn: string; countryColumn: string; sellerName: string; buyerName: string; codeColumn: string; shipmentColumn: string; foreignportColumn: string; iec: string; } | null} searchingColumns
     * @param {any[]} countries
     * @param {any} startDate
     * @param {any} endDate
     */
    _createCountryAggregationQuery(params, searchingColumns, countries, startDate, endDate, hs_codes = []) {
        let jointCountries = countries.map(country => `"${country}"`).join(", ")
        let baseFilterVariableName = "FILTER_COUNTRIES";
        let query = `let ${baseFilterVariableName} = materialize(${params.dataBucket} | where ${searchingColumns?.countryColumn} in (${jointCountries}) 
        | where ${searchingColumns?.dateColumn} between (datetime(${startDate}).. datetime(${endDate}))`

        hs_codes = [...hs_codes];
        if (hs_codes && hs_codes.length > 0) {
            let jointCodes = hs_codes.map(code => `"${code}"`).join(", ");
            query += ` | where ${searchingColumns?.codeColumn} in (${jointCodes})`
        }

        for (let expression of params.matchExpressions) {
            if (expression.identifier == 'FILTER_HS_CODE') {
                let appliedHSCodes = expression.fieldValue.map(hsCode => `"${hsCode}"`).join(", ")
                query += ` | where ${expression.fieldTerm} in (${appliedHSCodes}) `
            }

            if (expression.identifier == 'FILTER_FOREIGN_PORT') {
                let appliedForeignPorts = expression.fieldValue.map(foreignPort => `"${foreignPort}"`).join(", ")
                query += ` | where ${expression.fieldTerm} in (${appliedForeignPorts}) `
            }

            if (expression.identifier == 'FILTER_PORT') {
                let appliedPorts = expression.fieldValue.map(port => `"${port}"`).join(", ")
                query += ` | where ${expression.fieldTerm} in (${appliedPorts}) `
            }
        }

        query += ");";

        query += `
            let SUMMARY_COUNTRIES = ${baseFilterVariableName}
            | summarize SUMMARY_TOTAL_USD_VALUE = sum(${searchingColumns?.priceColumn}),
            SUMMARY_SHIPMENTS = count_distinct(${searchingColumns?.shipmentColumn}),
            SUMMARY_QUANTITY = sum(${searchingColumns?.quantityColumn}) by ${searchingColumns?.countryColumn};
            
            let SUMMARY_COUNTRIES_HS_CODE = ${baseFilterVariableName}
            | summarize SUMMARY_TOTAL_USD_VALUE = sum(${searchingColumns?.priceColumn}), 
            SUMMARY_SHIPMENTS = count_distinct(${searchingColumns?.shipmentColumn}),
            SUMMARY_QUANTITY = sum(${searchingColumns?.quantityColumn}) 
            by ${searchingColumns?.countryColumn}, ${searchingColumns?.codeColumn};
            
            union SUMMARY_COUNTRIES, SUMMARY_COUNTRIES_HS_CODE`;

        return query;
    }


    /**
     * @param {string | any[]} mappedAggregations
     */
    async _mapCountriesResultSet(mappedAggregations) {
        let countries_data = []
        let hs_codes = new Set()

        for (let i = 0; i < mappedAggregations.length; i++) {
            let result = mappedAggregations[i];

            let hsDescription = "";
            if (result.HS_CODE != '') {
                hs_codes.add(result.HS_CODE);
                if (result.HS_CODE.length == 7 || result.HS_CODE.length == 9 || result.HS_CODE.length == 11) {
                    result.HS_CODE = "0" + result.HS_CODE;
                }

                // @ts-ignore
                hsDescription = await MongoDbHandler.getDbInstance()
                    .collection(MongoDbHandler.collections.hs_code_description_mapping)
                    .find({ "hs_code": result.HS_CODE })
                    .project({
                        'description': 1
                    }).toArray();

                // @ts-ignore
                hsDescription = hsDescription[0]?.description ?? "";
            }

            const existingCountry = countries_data.find((country) => country.countryName === result.ORIGIN_COUNTRY);

            if (existingCountry) {
                if (existingCountry.HS_CODES.length >= 10) {
                    break;
                }

                if (result.HS_CODE === '') {
                    // Update values specific to the country
                    existingCountry.SUMMARY_TOTAL_USD_VALUE = result.SUMMARY_TOTAL_USD_VALUE;
                    existingCountry.SUMMARY_SHIPMENTS = result.SUMMARY_SHIPMENTS;
                    existingCountry.SUMMARY_QUANTITY = result.SUMMARY_QUANTITY;
                } else {
                    // Add the HS_CODE data to the existing country
                    // @ts-ignore
                    existingCountry.HS_CODES.push({
                        "HS_CODE": result.HS_CODE,
                        "hS_code_description": hsDescription,
                        "SUMMARY_TOTAL_USD_VALUE": result.SUMMARY_TOTAL_USD_VALUE,
                        "SUMMARY_SHIPMENTS": result.SUMMARY_SHIPMENTS,
                        "SUMMARY_QUANTITY": result.SUMMARY_QUANTITY,
                    });
                }
            }
            else {
                const newCountry = {
                    countryName: result.ORIGIN_COUNTRY,
                    HS_CODES: []
                };

                if (result.HS_CODE === '') {
                    // Set values specific to the new country
                    newCountry.SUMMARY_TOTAL_USD_VALUE = result.SUMMARY_TOTAL_USD_VALUE;
                    newCountry.SUMMARY_SHIPMENTS = result.SUMMARY_SHIPMENTS;
                    newCountry.SUMMARY_QUANTITY = result.SUMMARY_QUANTITY;
                } else {
                    // Add the HS_CODE data to the new country
                    // @ts-ignore
                    newCountry.HS_CODES.push({
                        "HS_CODE": result.HS_CODE,
                        "hS_code_description": hsDescription,
                        "SUMMARY_TOTAL_USD_VALUE": result.SUMMARY_TOTAL_USD_VALUE,
                        "SUMMARY_SHIPMENTS": result.SUMMARY_SHIPMENTS,
                        "SUMMARY_QUANTITY": result.SUMMARY_QUANTITY,
                    });
                }
                countries_data.push(newCountry);
            }
        }
        return ({
            "countries_data": countries_data,
            "hs_codes": hs_codes
        });
    }
}

module.exports = { TradeAnalyticsService };