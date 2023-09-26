// @ts-check

const tradeSchema = require(".././schemas/tradeSchema")
const GlobalSearchSchema = require(".././schemas/globalSearchSchema")
const { getDateRange } = require("../models/globalSearchModel")
const ElasticsearchDbHandler = require("../db/elasticsearchDbHandler")
const { formulateAdxRawSearchRecordsQueries, formulateAdxGlobalSearchQueries, getSearchBucket } = require("../models/tradeModel")
const getLoggerInstance = require("./logger/Logger")
const { error } = require("winston")
const MongoDbHandler = require("../db/mongoDbHandler")
const { getADXAccessToken } = require("../db/accessToken")
const { query: adxQueryExecuter } = require("../db/adxDbApi");
const { json } = require("body-parser")
const MongodbQueryService = require("./mongodb/run-query.service")


/**
 * @param {{ bl_output: {}[]; output: {}[]; }} res
 * @param {*} payload
 */
async function getDataADX(res, payload) {
    try {
        // const startQueryTime = new Date();
        let dataBucket
        let matchExpressions
        payload.aggregationParams = {}
        payload.aggregationParams.offset = 0;
        payload.aggregationParams.limit = 0;
        payload.aggregationParams.matchExpressions = [];
        payload.aggregationParams.groupExpressions = [];


        let Arr1 = [...payload.taxonomy.fields.explore_aggregation.matchExpressions.concat()]
        if (payload.filter_hs_code && payload.filter_hs_code.length > 0) {
            matchExpressions = Arr1.filter((Arr) => Arr.identifier === payload.column || Arr.identifier === "SEARCH_MONTH_RANGE" || Arr.identifier === "FILTER_HS_CODE");
        } else {
            matchExpressions = Arr1.filter((Arr) => Arr.identifier === payload.column || Arr.identifier === "SEARCH_MONTH_RANGE");
        }

        let buyerSellerArr = Arr1.filter((Arr) => Arr.identifier === "SEARCH_BUYER" || Arr.identifier === "SEARCH_SELLER");

        let Arr2 = [...payload.taxonomy.fields.explore_aggregation.groupExpressions.concat()]
        let groupExpressions = Arr2.filter((Arr) => Arr.identifier === "FILTER_HS_CODE" || Arr.identifier === "FILTER_COUNTRY" || Arr.identifier.startsWith('SUMMARY'));

        let matchExpArr = []
        if (matchExpressions && matchExpressions.length > 0) {
            for (let matchExpression of matchExpressions) {
                if (matchExpression.identifier === payload.column) {
                    if (payload.column.toLowerCase() == "search_hs_code") {
                        for (let val of payload.value) {
                            let clone = JSON.parse(JSON.stringify(matchExpression))
                            if (/^[0-9]+$/.test(val)) {
                                let leftValue = val
                                let rightValue = val
                                let digitsCount = val.length;
                                for (let index = digitsCount + 1; index <= payload.taxonomy.hs_code_digit_classification; index++) {
                                    leftValue += 0;
                                    rightValue += 9;
                                }
                                clone.fieldValueLeft = leftValue
                                clone.fieldValueRight = rightValue
                                matchExpArr.push(clone)
                                clone = null;
                            } else {
                                throw new Error("Value should be number")
                            }
                        }
                    } else {
                        matchExpression.fieldValue = payload.value
                        matchExpArr.push(matchExpression)
                    }

                } else if (matchExpression.identifier === "SEARCH_MONTH_RANGE") {
                    matchExpression.fieldValueLeft = payload.startDate
                    matchExpression.fieldValueRight = payload.endDate
                    matchExpArr.push(matchExpression)

                } else if (matchExpression.identifier === "FILTER_HS_CODE") {
                    matchExpression.fieldValue.push(...payload.filter_hs_code)
                    matchExpArr.push(matchExpression)

                } else {
                    continue;
                }
            }
        }

        if (payload.taxonomy.bl_flag === false) {
            dataBucket = tradeSchema.deriveDataBucket(payload.taxonomy.trade, payload.taxonomy.country);
        } else {
            dataBucket = payload.taxonomy.bucket ? payload.taxonomy.bucket + '*' : 'bl' + payload.taxonomy.trade + '*';
            let countryMatchExpression = {
                "identifier": "SEARCH_COUNTRY",
                "alias": "COUNTRY",
                "clause": "MATCH",
                "expressionType": 202,
                "relation": "and",
                "fieldTerm": "COUNTRY_DATA",
                "fieldValue": [''],
                "fieldTermTypeSuffix": ""
            }
            countryMatchExpression.fieldValue = [payload.taxonomy.country.toUpperCase()]
            matchExpArr.push({ ...countryMatchExpression })
        }


        payload.aggregationParams.matchExpressions = matchExpArr ? matchExpArr : []
        payload.aggregationParams.groupExpressions = groupExpressions ? groupExpressions : []

        let clause = GlobalSearchSchema.formulateShipmentRecordsAggregationPipelineEngine(payload);

        let query = formulateAdxGlobalSearchQueries(payload)
        console.log('\n query \n', JSON.stringify(query))
        let count = 0
        let aggregationExpressionArr = [];
        for (let agg in clause.aggregation) {
            let aggregationExpression = {
                sort: clause.sort,
                query: clause.query,
                aggs: {}
            };
            count += 1;
            aggregationExpression.aggs[agg] = clause.aggregation[agg]

            aggregationExpressionArr.push({ ...aggregationExpression })
            aggregationExpression = {
                size: 0,
                sort: clause.sort,
                query: clause.query,
                aggs: {}
            };

        }


        let resultArr = []
        for (let query of aggregationExpressionArr) {
            resultArr.push(ElasticsearchDbHandler.dbClient.search({
                index: dataBucket,
                track_total_hits: true,
                body: query
            }))
        }


        let mappedResult = {};
        let idArr = [];

        for (let idx = 0; idx < resultArr.length; idx++) {
            let result = await resultArr[idx];
            if (idx == 0) {
                mappedResult[GlobalSearchSchema.RESULT_PORTION_TYPE_SUMMARY] = [{
                    _id: null,
                    count: result.body.hits.total.value
                }];
                mappedResult[GlobalSearchSchema.RESULT_PORTION_TYPE_RECORDS] = [];
                result.body.hits.hits.forEach((hit) => {
                    let buyerData = hit._source;
                    buyerData._id = hit._id;
                    idArr.push(hit._id);
                    mappedResult[GlobalSearchSchema.RESULT_PORTION_TYPE_RECORDS].push(
                        buyerData
                    );
                });
            }

            for (const prop in result.body.aggregations) {
                if (result.body.aggregations.hasOwnProperty(prop)) {
                    if (prop.indexOf('SUMMARY') === 0 && result.body.aggregations[prop].value) {
                        mappedResult[prop] = result.body.aggregations[prop].value;
                    } else if (prop.indexOf('FILTER') === 0) {
                        let mappingGroups = [];
                        //let mappingGroupTermCount = 0;
                        //finding prop from grp expression aggs params(only filter one)
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

                                        };
                                        if (bucket.totalSum) {
                                            groupedElement.totalSum = bucket?.totalSum?.value
                                        }
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
            }
        }

        let mainObject = {}
        // mappedResult["idArr"] = idArr;
        let country = payload.taxonomy.country;
        let endDate = await getDateRange(payload.taxonomy._id);

        mainObject[country] = {
            ...mappedResult, type: payload.taxonomy.trade.toLowerCase(), "flag_uri": payload.taxonomy.flag_uri,
            buyerSellerArr,
            "dateRange": {
                "startDate": payload.startDate,
                "endDate": endDate
            }
        }
        // const endQueryTime = new Date();
        // const queryTimeResponse = (endQueryTime.getTime() - startQueryTime.getTime()) / 1000;
        // if (payload.aggregationParams.resultType === TRADE_SHIPMENT_RESULT_TYPE_RECORDS) {
        //   await addQueryToActivityTrackerForUser(payload.aggregationParams, payload.accountId, payload.userId, payload.tradeType, payload.country, queryTimeResponse);
        // }
        if (payload.taxonomy.bl_flag) {
            res.bl_output.push({ ...mainObject })
        } else {
            res.output.push({ ...mainObject })
        }

    } catch (err) {
        throw err;
    }
}


/**
 * get global search data
 */
class GetGlobalSearchData {
    constructor() {
        /**
         * @private
         */
        this.buyerSellerArr = [
            {
                "identifier": "SEARCH_BUYER",
                "alias": "BUYER",
                "clause": "MATCH",
                "expressionType": 102,
                "fieldTerm": "IMPORTER_NAME",
                "fieldValue": [],
                "fieldTermTypeSuffix": ".keyword"
            },
            {
                "identifier": "SEARCH_SELLER",
                "alias": "SELLER",
                "clause": "MATCH",
                "expressionType": 102,
                "fieldTerm": "EXPORTER_NAME_AND_ADDRESS",
                "fieldValue": [],
                "fieldTermTypeSuffix": ".keyword"
            }
        ]

        /** @private */
        this.mongoService = new MongodbQueryService();

        // (async () => {
        //     /** 
        //      * @description get adx access token to execute adx query
        //      * @private
        //      *  */
        //     this.adxAccessToken = await getADXAccessToken();
        // })();
    }


    /**
     * capitalize first letter
     * @param {string} letter 
     * @returns 
     * @private
     */
    capitalizeFirstLetter(letter) {
        return letter.charAt(0).toUpperCase() + letter.slice(1);
    }

    /**
     * @param {*} payload
     * @returns {Promise<{output: any[]; bl_output: any[]; countryNames: any[]}>}
     */
    async getDataADX(payload) {
        let result = {
            /** @type {{}[]} */
            output: [],
            bl_output: [],
            /** @type {{}[]} */
            countryNames: []
        }

        try {
            // extract search constraints from payload
            let searchConstraints = {
                key: payload.key,
                // startDate: payload.startDate,
                // endDate: payload.endDate,
                startDate: '2023-01-01',
                endDate: '2023-01-31',
                tradeType: payload.tradeType,
                searchTerm: payload.value,
            }

            // filter clause
            let filterClause = { bl_flag: false, trade: searchConstraints.tradeType.toUpperCase() }
            // project fields
            let projection = {
                _id: 0,
                country: 1,
                code_iso_3: 1,
                "fields.explore_aggregation.matchExpressions": 1,
                flag_uri: 1
            }

            // retrieve countries
            let countries = await this.mongoService.findAllWithProjection(MongoDbHandler.collections.taxonomy, filterClause, projection)

            result.countryNames = countries;

            let { filterQuery, filterUnion, query, summarizeQuery, summarizeUnions, unions } = this.queryBuilder({ countries, searchConstraints })

            // join unions
            let union = unions.join(", ")

            // append union to query
            query += " union " + union;

            this.adxAccessToken = await getADXAccessToken();
            let adxQueryResult = await adxQueryExecuter(query, this.adxAccessToken);
            adxQueryResult = JSON.parse(adxQueryResult);
            summarizeQuery += " union " + summarizeUnions.join(", ");

            let summarizedADXQueryResult = await adxQueryExecuter(summarizeQuery, this.adxAccessToken);
            summarizedADXQueryResult = JSON.parse(summarizedADXQueryResult);

            filterQuery += " union " + filterUnion.join(", ")

            let adxFilters = await adxQueryExecuter(filterQuery, this.adxAccessToken)
            adxFilters = JSON.parse(adxFilters)

            let mappedFilterResults = this.mapSummaryRowAndColumns({ columns: adxFilters.Tables[0].Columns, rows: adxFilters.Tables[0].Rows });
            mappedFilterResults;
            let mappedSummarizedResults = this.mapSummaryRowAndColumns({ columns: summarizedADXQueryResult.Tables[0].Columns, rows: summarizedADXQueryResult.Tables[0].Rows });
            let mappedResults = this.mapRowAndColumns(adxQueryResult.Tables[0].Columns, adxQueryResult.Tables[0].Rows, countries, searchConstraints['startDate'], searchConstraints['endDate'], searchConstraints['tradeType'], mappedSummarizedResults, mappedFilterResults)
            result.output = mappedResults;

            return result;

        } catch (err) {
            const { errorMessage } = getLoggerInstance(err, __filename)
            console.log(errorMessage)
            throw err
        }
    }

    /**
     * @private
     * map row and columns
     * @param {any[]} columns
     * @param {any[]} rows
     * @param {any[]} countries
     * @param {any} startDate
     * @param {any} endDate
     * @param {any} tradeType
     * @param {any[]} summaries
     * @param {any[]} mappedFilterResults
     */
    mapRowAndColumns(columns, rows, countries, startDate, endDate, tradeType, summaries, mappedFilterResults) {
        let mappedResults = {};
        let columnNames = columns.map((column) => column.ColumnName);

        for (let row of rows) {
            let Obj = {};
            row.forEach((val, index) => {
                columnNames.forEach((cName, i) => {
                    if (i === index) {
                        if (val !== null && val !== "NULL" && val !== '') {
                            Obj[cName] = val
                        }
                    }
                })
            })

            if (Obj?.countryName) {
                if (!mappedResults[Obj.countryName]) {
                    mappedResults[Obj.countryName] = {}
                }
                if (mappedResults[Obj.countryName]['RECORD_SET']) {
                    mappedResults[Obj.countryName]['RECORD_SET'].push(Obj)
                } else {
                    mappedResults[Obj.countryName]['RECORD_SET'] = [Obj]
                }
            }

        }

        let mappedArr = [];

        for (let country of Object.keys(mappedResults)) {
            let flag_uri = countries.find(info => {
                return info.country === country
            }).flag_uri

            let summaryResults = summaries.filter(summary => {
                return summary.country === country
            })

            mappedResults[country]['SUMMARY_RECORDS'] = [{
                _id: null,
                count: summaryResults?.find(summary => summary.FILTER === 'SUMMARY_RECORDS')?.count ?? 0
            }]


            let FILTER_COUNTRY = mappedFilterResults.filter(filter => {
                if (filter.country === country && filter.FilterType === "FILTER_COUNTRY") {
                    return filter;
                }
            }).map(filter => ({
                _id: filter?._id,
                count: filter?.count
            }))


            mappedResults[country]['FILTER_COUNTRY'] = FILTER_COUNTRY;

            let FILTER_HS_CODE = mappedFilterResults.filter(filter => {
                if (filter.country === country && filter.FilterType === "HS_CODE") {
                    return {
                        _id: filter?._id,
                        count: filter?.count
                    }
                }
            })

            mappedResults[country]['FILTER_HS_CODE'] = FILTER_HS_CODE;
            mappedResults[country]['SUMMARY_BUYERS'] = summaryResults?.find(summary => summary.FILTER === 'SUMMARY_BUYERS')?.count ?? 0;
            mappedResults[country]['SUMMARY_SELLERS'] = summaryResults?.find(summary => summary.FILTER === 'SUMMARY_SELLERS')?.count ?? 0;
            mappedResults[country]['SUMMARY_SHIPMENTS'] = 2;
            mappedResults[country]['buyerSellerArr'] = [this.buyerSellerArr];
            mappedResults[country]['dateRange'] = { startDate, endDate }
            mappedResults[country]['type'] = tradeType;
            mappedResults[country]['flag_uri'] = flag_uri ?? "flag_ind.png";

            mappedArr.push({ [country]: mappedResults[country] })
        }
        return mappedArr;
    }


    /**
     * @private
     */
    mapSummaryRowAndColumns({ columns, rows }) {
        let columnNames = columns?.map((column) => column.ColumnName);
        let mappedResults = []

        for (let row of rows) {
            let Obj = {};
            row.forEach((row, i) => {
                columnNames.forEach((cName, index) => {
                    if (i === index) {
                        Obj[cName] = row
                        // if (row !== null && row !== "NULL" && row !== '') {
                        // }
                    }
                })
            })
            mappedResults.push(Obj)
        }
        return mappedResults;
    }

    /**
     * @private
     * @param {{countries: any[], searchConstraints: any}} param0
     * @description query builder
     * @returns {{query: string, unions: string[], summarizeQuery: string, summarizeUnions: string[], filterQuery: string, filterUnion: string[]}}}
     */
    queryBuilder({ countries, searchConstraints, }) {
        let query = ''
        let unions = [];
        let summarizeQuery = '';
        let summarizeUnions = [];
        let index = 0;
        let filterQuery = '';
        let filterUnion = [];
        for (let countryInfo of countries) {
            let countryName = countryInfo.country;

            if (countryName?.toLowerCase() !== 'india' && countryName?.toLowerCase() !== 'vietnam_2022') {
                index++;
                continue;
            }

            let searchBucket = ""

            if (countryName?.toLowerCase() === 'india') {
                searchBucket = getSearchBucket(countryName, searchConstraints['tradeType'])
            } else if (countryName?.toLowerCase() === 'vietnam_2022') {
                searchBucket = countryName.split("_").join(this.capitalizeFirstLetter(searchConstraints.tradeType.toLowerCase()))
                searchBucket = this.capitalizeFirstLetter(searchBucket)
            }

            if (!searchBucket && searchBucket === '') {
                index++;
                continue;
            }

            let dateType = '';

            for (let matchExpression of countryInfo?.fields.explore_aggregation?.matchExpressions) {
                if (matchExpression.identifier === 'SEARCH_MONTH_RANGE') {
                    dateType = matchExpression.fieldTerm
                    break;
                }
            }
            let databaseName = '';
            if (countryName.toLowerCase() === "india") {
                databaseName = "India_Exp";
            } else if (countryName.toLowerCase() === "vietnam_2022") {
                databaseName = "Vietnam";
            }

            let dbSelectionQuery = "let " + countryName + " = database('" + databaseName + "')." + searchBucket + " | where " + dateType + " between (todatetime('" + searchConstraints["startDate"] + "') .. todatetime('" + searchConstraints["endDate"] + "')) ";
            query += dbSelectionQuery;
            filterQuery += dbSelectionQuery;
            summarizeQuery += dbSelectionQuery;

            if (searchConstraints['key'] === 'SEARCH_HS_CODE') {
                let hsCodeQuery = " | where HS_CODE " + ' startswith ' + "'" + searchConstraints['searchTerm']?.[0] + "' "
                query += hsCodeQuery;
                summarizeQuery += hsCodeQuery + " ;";
                filterQuery += hsCodeQuery + "; ";
            }

            if (searchConstraints['key'] === 'SEARCH_PRODUCT_DESCRIPTION') {
                let regexPattern = "strcat('(?i).*\\\\b', replace_string('" + searchConstraints['searchTerm']?.[0] + "', ' ', '\\\\b.*\\\\b'), '\\\\b.*')";
                query += "| where PRODUCT_DESCRIPTION matches regex " + regexPattern
                filterQuery += "| where PRODUCT_DESCRIPTION matches regex " + regexPattern + "; ";
                summarizeQuery += "| where PRODUCT_DESCRIPTION matches regex " + regexPattern + "; ";
            }

            query += " | extend " + "countryName = '" + countryName + "' | limit 10;";

            let buyerTerm = countryInfo.fields.explore_aggregation.matchExpressions.find((expression) => expression.identifier === "SEARCH_BUYER");
            let sellerTerm = countryInfo.fields.explore_aggregation.matchExpressions.find((expression) => expression.identifier === "SEARCH_SELLER");

            let SUMMARY_RECORDS = ` let SUMMARY_RECORDS__${countryName} = ${countryName} | summarize count = count() | extend FILTER = 'SUMMARY_RECORDS' | extend country = '${countryName}'; `

            let SUMMARY_BUYERS = ` let SUMMARY_BUYERS__${countryName} = ${countryName} | summarize count = count_distinct(${buyerTerm?.fieldTerm}) | extend FILTER = 'SUMMARY_BUYERS' | extend country = '${countryName}'; `
            let SUMMARY_SELLERS = ` let SUMMARY_SELLERS__${countryName} = ${countryName}| summarize count = count_distinct(${sellerTerm?.fieldTerm}) | extend FILTER = 'SUMMARY_SELLERS' | extend country = '${countryName}'; `

            summarizeQuery += SUMMARY_RECORDS + SUMMARY_BUYERS + SUMMARY_SELLERS;
            summarizeUnions.push(`SUMMARY_RECORDS__${countryName}`, `SUMMARY_BUYERS__${countryName}`, `SUMMARY_SELLERS__${countryName}`)

            if (countries.length > index) {
                unions.push(countryName)
            }

            // let filterCountryTerm = countryInfo.fields.explore_aggregation.matchExpressions.find((expression) => expression.identifier === "SEARCH_ORIGIN_COUNTRY")?.fieldTerm;

            let hsCodeFilter = `let HS_CODE__${countryName} = ` + countryName + " | summarize count = count() by _id = HS_CODE | extend country = '" + countryName + "' | extend FilterType = 'HS_CODE' ; "
            let countryFilter = `let COUNTRY__${countryName} =  ${countryName} | summarize count = count() by _id = ORIGIN_COUNTRY | extend country = '${countryName}' | extend FilterType = 'FILTER_COUNTRY' ; `

            filterQuery += hsCodeFilter + countryFilter;

            filterUnion.push(`HS_CODE__${countryName}`, `COUNTRY__${countryName}`)

            index++;
        }

        return { query, unions, summarizeQuery, summarizeUnions, filterQuery, filterUnion }

    }

}

module.exports = {
    getDataADX,
    GetGlobalSearchData
}