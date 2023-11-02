const { query: adxQueryExecuter } = require("../../db/adxDbApi")
const { getADXAccessToken } = require("../../db/accessToken")
const getLoggerInstance = require('../logger/Logger');
const MongoDbHandler = require("../../db/mongoDbHandler");
const { off } = require("process");

class ProductAnalyticService{
    constructor(){
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
 * @param {String} tradeType
 */
    _getDefaultAnalyticsSearchingColumns(country,tradeType) {
        if ( country.toLowerCase() !== "india"){
            throw new Error("We are working for other countries reports!!!")
        }
        let searchingColumns = null;
        if(tradeType ==  "IMPORT"){
            searchingColumns = {
                searchField: "IMPORTER_NAME",
                dateColumn: "IMP_DATE",
                unitColumn: "STD_UNIT",
                priceColumn: "TOTAL_ASSESS_USD",
                qunatityColumn: "STD_QUANTITY",
                portColumn: "INDIAN_PORT",
                countryColumn: "ORIGIN_COUNTRY",
                sellerName: "SUPPLIER_NAME",
                buyerName: "IMPORTER_NAME",
                codeColumn: "HS_CODE",
                codeColumn2: "HS_CODE_2",
                codeColumn4: "HS_CODE_4",
                shipmentColumn: "DECLARATION_NO",
                forgeinportColumn: "PORT_OF_SHIPMENT",
                iec: "IEC",
                product : "PRODUCT_DESCRIPTION"
            }
        }
        else if(tradeType == "EXPORT"){
            searchingColumns = {
                searchField: "EXPORTER_NAME",
                dateColumn: "EXP_DATE",
                unitColumn: "STD_UNIT",
                priceColumn: "FOB_USD",
                qunatityColumn: "STD_QUANTITY",
                portColumn: "INDIAN_PORT",
                countryColumn: "COUNTRY",
                sellerName: "BUYER_NAME",
                buyerName: "EXPORTER_NAME",
                codeColumn: "HS_CODE",
                codeColumn2: "HS_CODE_2",
                codeColumn4: "HS_CODE_4",
                forgeinportColumn: "FOREIGN_PORT",
                shipmentColumn: "DECLARATION_NO",
                iec: "IEC",
                product: "PRODUCT_DESCRIPTION"
            }
        }
        return searchingColumns;
    }
    /** @returns {Promise<string>} @private */
    async _getAdxToken(){
        return getADXAccessToken();
    }

    /**
     * execute adx query
     * @private
     * @param {string} query
     * @param {string} accessToken
     * @param {boolean} getOriginal
     * @param {Promise<{rows: any[], columns: any[], original?: any}>}
     */
    async _executeQuery(query, accessToken, getOriginal= false){
        try {
            let results = await this.adxQueryExecuter(query,accessToken);
            results = JSON.parse(results)
            if (getOriginal) {
                return {
                    rows: results.Tables[0].Rows,
                    columns: results.Tables[0].columns,
                    original: results,
                }
            } else {
                return {
                    rows: results.Tables[0].Rows,
                    columns: results.Tables[0].Columns
                }
            }
        }catch (err){
            getLoggerInstance(err, __filename, "ADXQueryExecutor")
            throw err
        }
    }

    /**
     * map rows and columns
     * @private 
     * @param {{rows: any[], columns: any[]}} params
     */
    _mapRowsandColumns({ columns, rows }){
        let mappedResult = [];
        for(let row of rows){
            let obj = {};
            for(let i = 0; i < row.length; i++) {
                let val = row[i];
                for(let j =0 ;j < columns.length; j++){
                    let column = columns[j].ColumnName;
                    if(i == j){
                        obj[column] = val;
                        continue;
                    }
                }
            }
            mappedResult.push(obj);
        }
        return mappedResult;
    }
    /**
     * @description This method is used to search parameters using passed request body
     * @param {*} payload
     * @param {any} dataBucket
     */
    _generateParamsFromPayload(payload,dataBucket){
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
            bindByCountry : payload.bindByCountry ?? null,
            bindByPort : payload.bindByPort ?? null,
            hsCodeType : payload.hsCodeType
        }
        return params;
    }

    /**
     * @param {{ offset: any; limit: any; startDate: any; endDate: any; startDateTwo: any; endDateTwo: any; destinationCountry?: any; matchExpressions?: any; tradeType?: any; originCountry?: any; dataBucket?: any; bindByCountry?: boolean ; bindByPort?: boolean, hsCodeType?: any }} params
     * @param {{ searchField: string; dateColumn: string; unitColumn: string; priceColumn: string; quantityColumn: string; portColumn: string; countryColumn: string; sellerName: string; buyerName: string; codeColumn: string; shipmentColumn: string; foreignportColumn: string; iec: string; } | null} searchingColumns
     */
    async  findTopProducts(params, searchingColumns){
        try {
            /** get adx token to run queries */
            const accessToken = await this._getAdxToken();

            /**get base query to search products based on hscode (2 digit, 4 digit and 8 digit) */
            let productSearchBaseQuery = this._getProductSearchBaseQuery(params, searchingColumns);

            /** fetching the product from adx */
            let product = await this._executeQuery(productSearchBaseQuery, accessToken);

            /** special method to map product list */
            let mappedProductResults = this._mapproductList(product.rows);

            const product_count = mappedProductResults.length;

            let productArray = []
            let offset = 0;
            let limit = 400 ;
            for(let i = offset; i < offset+limit ;i++) {
                if( i >= mappedProductResults.length) {
                    break;
                }
                productArray.push(mappedProductResults[i])
            }
            mappedProductResults = productArray;

            if(mappedProductResults && mappedProductResults.length > 0 ){
                const [date1Data, date2Data] = await Promise.all([
                    this.getmappedProductdata.call(this, params, searchingColumns, mappedProductResults, params.startDate, params.endDate, accessToken),
                    this.getmappedProductdata.call(this, params, searchingColumns, mappedProductResults, params.startDateTwo, params.endDateTwo, accessToken)
                ]);
                return {
                    product_count: product_count,
                    product_data: {date1Data, date2Data},
                    risionQuery: {
                        "date1": "(query:(bool:(filter:!(),must:!((bool:(should:!((match:(ORIGIN_COUNTRY:(operator:and,query:ALBANIA)))))),(range:(IMP_DATE:(gte:'2023-08-01T00:00:00.000Z',lte:'2023-08-31T00:00:00.000Z')))),must_not:!(),should:!())))",
                        "date2": "(query:(bool:(filter:!(),must:!((bool:(should:!((match:(ORIGIN_COUNTRY:(operator:and,query:ALBANIA)))))),(range:(IMP_DATE:(gte:'2023-07-01T00:00:00.000Z',lte:'2023-07-31T00:00:00.000Z')))),must_not:!(),should:!())))"
                    },
                }
            } else {
                return null;
            }
        }catch(err){
            getLoggerInstance(err, __filename, "findTopProducts")
            throw error;
        }
    }

    /**
     * @param {{ offset: any; limit: any; startDate: any; endDate: any; startDateTwo: any; endDateTwo: any; destinationCountry?: any; matchExpressions?: any; tradeType?: any; originCountry?: any; dataBucket?: any; bindByCountry?: boolean ; bindByPort?: boolean, hsCodeType?: any }} params
     * @param {{ searchField: string; dateColumn: string; unitColumn: string; priceColumn: string; quantityColumn: string; portColumn: string; countryColumn: string; sellerName: string; buyerName: string; codeColumn: string; shipmentColumn: string; foreignportColumn: string; iec: string; }} searchingColumns
     */
    _getProductSearchBaseQuery(params, searchingColumns) {
        let baseQuery = '';
        /** @type {"PRODUCT"} */
        let baseProductQuery = "PRODUCT";
        let baseProductCountry = "Country";
        baseQuery += `set query_result_cache_max_age = time(${this.baseQueryCacheTime});
                      let ${baseProductCountry} = materialize(${params.dataBucket}
                      | where ${searchingColumns?.dateColumn} between (datetime(${params.startDate}).. datetime(${params.endDate})));
                      set query_result_cache_max_age = time(${this.baseQueryCacheTime});`
        baseQuery+= `let ${baseProductQuery} = ${baseProductCountry} `
        
        
        if (params.valueFilterRangeFlag && params.shipmentFilterRangeFlag) {
            baseQuery += ` | summarize shipment = count_distinct(${searchingColumns?.shipmentColumn}),
            price = sum(${searchingColumns?.priceColumn}) by ${searchingColumns?.product}
            | where price between (${params?.valueFilterRangeArr[0]["from"]} .. ${params?.valueFilterRangeArr[0]["to"]}) 
            | where shipment between (${params?.shipmentFilterRangeArr[0]["from"]} .. ${params?.shipmentFilterRangeArr[0]["to"]}) `
        }
        else if (params.valueFilterRangeFlag) {
            baseQuery += ` | summarize price = sum(${searchingColumns?.priceColumn}) by ${searchingColumns?.product}
            | where price between (${params?.valueFilterRangeArr[0]["from"]} .. ${params?.valueFilterRangeArr[0]["to"]}) `
        }

        else if (params.valueFilterRangeFlag) {
            baseQuery += ` | summarize price = sum(${searchingColumns?.priceColumn}) by ${searchingColumns?.product}
            | where price between (${params?.valueFilterRangeArr[0]["from"]} .. ${params?.valueFilterRangeArr[0]["to"]}) `
        }
        else {
            baseQuery+= ` | summarize price = sum(${searchingColumns?.priceColumn}) by ${searchingColumns?.product}`
        }
        baseQuery += ` | order by price | project ${searchingColumns?.product};
                        union ${baseProductQuery}`
        console.log(baseQuery)
        return baseQuery;  
    }
    /**get the product description  
     * get the list of the products
    */
    _mapproductList(productrows){
        let products = [];
        for(let row of productrows){
            let product = row[0];
            if(product !== ""){
                products.push(product)
            }
        }
        return products;
    }

    /**
     * @param {string[]} product result
     * @param {string} accessToken
     * @param {any} params
     * @param {{searchField: string;dateColumn: string;unitColumn: string;priceColumn: string;quantityColumn: string;portColumn: string;countryColumn: string;sellerName: string;buyerName: string;codeColumn: string;shipmentColumn: string;foreignportColumn: string;iec: string; product: string} | null} searchingColumns
     * @param {any} startDate
     * @param {any} endDate
     */

    async getmappedProductdata(params, searchingColumns, productResults, startDate, endDate, accessToken){
        const query = this._createproductaggergationQuery(params, searchingColumns, productResults, startDate, endDate);
        const results = await this._executeQuery(query, accessToken);
        const mappedAggregations = this._mapRowsandColumns({ columns: results.columns, rows: results.rows });
        return this._mapProductResultSet(mappedAggregations, searchingColumns).filter(dt => dt !== null);
    }

    _createproductaggergationQuery(params, searchingColumns, products, startDate, endDate){
        console.log(products.length)
        let jointProduct = products.map(product => `"${product}"`).join(",")
        let baseFilterproduct = "FILTER_PRODUCT"
        let  hs_code_type= this._verifyhscodetype(params.hsCodeType,searchingColumns);
        let  group_by= "" ;
        if(params.bindByCountry){
            group_by = searchingColumns?.countryColumn;
        }
        else if (params.bindByPort){
            group_by = searchingColumns?.portColumn;
        }

        let query = `let ${baseFilterproduct} = materialize(${params.dataBucket} 
            | where ${searchingColumns?.dateColumn} between (datetime(${startDate}).. datetime(${endDate}))
            | where ${searchingColumns?.product} in (${jointProduct})); `

            if(params.bindByPort || params.bindByCountry){
                query+= `let AGGREGATED_VALUES = ${baseFilterproduct} | summarize SUMMARY_TOTAL_USD_VALUE = sum(${searchingColumns?.priceColumn}),
                SUMMARY_SHIPMENTS = count_distinct(${searchingColumns?.shipmentColumn}), SUMMARY_QUANTITY = sum(${searchingColumns?.qunatityColumn}) by ${group_by}`
            }

            if(params.bindByPort && params.valueFilterRangeFlag || params.bindByCountry && params.valueFilterRangeFlag) {
                query+= `| where SUMMARY_TOTAL_USD_VALUE between (${params?.valueFilterRangeArr[0]["from"]} .. ${params?.valueFilterRangeArr[0]["to"]});`;
            }
            if(params.bindByPort && params.shipmentFilterRangeFlag || params.bindByCountry && params.shipmentFilterRangeFlag) {
                query+= `| where SUMMARY_TOTAL_USD_VALUE between (${params?.shipmentFilterRangeArr[0]["from"]} .. ${params?.shipmentFilterRangeArr[0]["to"]});`;
            }

            query+= `let HSCODE_VALUES = ${baseFilterproduct} | summarize SUMMARY_TOTAL_USD_VALUE_HS_CODE = sum(${searchingColumns?.priceColumn}),
                SUMMARY_SHIPMENTS_HS_CODE = count_distinct(${searchingColumns?.shipmentColumn}), SUMMARY_QUANTITY_HS_CODE = sum(${searchingColumns?.qunatityColumn}) by ${hs_code_type} `
            if(params.valueFilterRangeFlag === false  ){
                query+=  `;`
            }
            if(params.valueFilterRangeFlag) {
            query+= `| where SUMMARY_TOTAL_USD_VALUE_HS_CODE between (${params?.valueFilterRangeArr[0]["from"]} .. ${params?.valueFilterRangeArr[0]["to"]});`;
            }
            if(params.shipmentFilterRangeFlag){
                query+= `| where SUMMARY_TOTAL_USD_VALUE_HS_CODE between (${params?.shipmentFilterRangeArr[0]["from"]} .. ${params?.shipmentFilterRangeArr[0]["to"]});`;      
            }
            if(params.bindByPort || params.bindByCountry){
                query+= `${baseFilterproduct} | project ${group_by}, ${hs_code_type},${searchingColumns?.product}
                | distinct ${group_by},${hs_code_type} , ${searchingColumns?.product}`
            }
            else{
            query+= `${baseFilterproduct} | project ${hs_code_type},${searchingColumns?.product}
                      | distinct ${hs_code_type} , ${searchingColumns?.product}`
            }
            if(params.bindByPort || params.bindByCountry){
                query+= `| join kind = inner (AGGREGATED_VALUES) on ${group_by}`
            }

            query+= `| join kind = inner(HSCODE_VALUES) on ${hs_code_type}`

            if(params.bindByCountry || params.bindByCountry){
                query+= `| project ${group_by}, ${hs_code_type}, ${searchingColumns?.product},SUMMARY_TOTAL_USD_VALUE, SUMMARY_QUANTITY, SUMMARY_SHIPMENTS,SUMMARY_TOTAL_USD_VALUE_HS_CODE,SUMMARY_SHIPMENTS_HS_CODE,SUMMARY_QUANTITY_HS_CODE`
            }
            else{
                query+= `| project  ${hs_code_type}, ${searchingColumns?.product},SUMMARY_TOTAL_USD_VALUE_HS_CODE,SUMMARY_SHIPMENTS_HS_CODE,SUMMARY_QUANTITY_HS_CODE`
            }
            console.log(query)
            return query;
    }
    _verifyhscodetype(hscodetype,searchingColumns) {
        if(hscodetype == 2){
            return searchingColumns.codeColumn2;
        }
        else if(hscodetype == 4){
            return searchingColumns.codeColumn4;
        }
        else{
            return searchingColumns.codeColumn;
        }
    }
    _mapProductResultSet(mappedAggregations, searchingColumns) {
        /**
         * @type {{product_description: string, data: {_id: string, price: number, quantity: number, shipments: number}[]}[]}
         */

        let product_data = []
        for (let i = 0; i < mappedAggregations.length; i++) {
            let result = mappedAggregations[i];

            let existIndex = null;
            let isExist = product_data.find((data, dataIndex) => {
                if (data.producrname == result[searchingColumns?.product ?? ""]) {
                    existIndex = dataIndex;
                    return data
                }
            })

            if (isExist && existIndex !== null) {
                if (!product_data[existIndex]['data'][0]?.price) product_data[existIndex]['data'][0].price = result['SUMMARY_TOTAL_USD_VALUE_HS_CODE'];
                if (!product_data[existIndex]['data'][0]?.quantity) product_data[existIndex]['data'][0].quantity = result['SUMMARY_QUANTITY_HS_CODE'];
                if (!product_data[existIndex]['data'][0]?.shipments) product_data[existIndex]['data'][0].shipments = result['SUMMARY_SHIPMENTS_HS_CODE'];
                continue;
            } else {
                if (!product_data[i]) {
                    product_data[i] = {
                        hs_Code_Description: result[searchingColumns?.product ?? ""],
                        hs_code: result[
                            searchingColumns?.codeColumn2 ||
                            (searchingColumns?.codeColumn4 && result[searchingColumns.codeColumn4]) ||
                            (searchingColumns?.codeColumn8 && result[searchingColumns.codeColumn8]) ||
                            ""
                        ],
                        data: [
                            {   shipments: result['SUMMARY_SHIPMENTS_HS_CODE'] ?? 0,
                                quantity: result['SUMMARY_QUANTITY_HS_CODE'] ?? 0,
                                price: result['SUMMARY_TOTAL_USD_VALUE_HS_CODE'] ?? 0,
                                count:  result['SUMMARY_SHIPMENTS_HS_CODE'] ?? 0,
                            }
                        ]   
                    }
                    
                }
                
            }

        }
        console.log(product_data)
      
        return product_data
    }
}
module.exports =  { ProductAnalyticService }