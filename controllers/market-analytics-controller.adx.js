// @ts-check
const TradeModel = require("../models/tradeModel");
const MongoDbHandler = require("../db/mongoDbHandler");


const getLoggerInstance = require("../services/logger/Logger");
const { CountyAnalyticsService } = require("../services/market-analytics/country.market-analytics.service");
const { TradeAnalyticsService } = require("../services/market-analytics/trade.market-analytics.service");
const { ProductAnalyticService } = require('../services/market-analytics/product.market-analytics.service')

/**
 * @param {{ originCountry: string; tradeType: string; }} payload
 */
async function getCountryWiseMarketAnalyticsDataADX(payload) {

  // get an instance of country analytics service
  const countyAnalyticsService = new CountyAnalyticsService();

  // Payload details to be used
  const searchingColumns = countyAnalyticsService._getDefaultAnalyticsSearchingColumns(payload.originCountry, payload.tradeType.toUpperCase())

  // @ts-ignore
  const dataBucket = TradeModel.getSearchBucket(payload.originCountry.trim().toUpperCase(), payload.tradeType.trim().toUpperCase(), payload.dateExpraession);

  let params = countyAnalyticsService._generateParamsFromPayload(payload, dataBucket);

  try {
    let companies = await countyAnalyticsService.findTopCompanies(params, searchingColumns);
    // @ts-ignore
    companies = mapgetCountryWiseMarketAnalyticsData(companies);

    return companies;
  } catch (error) {
    let { errorMessage } = getLoggerInstance(error, __filename);
    console.log(errorMessage);
    throw error;
  }
}

/**
 * @param {{ companies_count: number; companies_data: { date1Data: any; date2Data: any; }; risonQuery: { date1: string; date2: string; }; } | null} countrywiseanalyticsresults
 */
function mapgetCountryWiseMarketAnalyticsData(countrywiseanalyticsresults) {
  const countrywiseanalyticsresultsstartdate = countrywiseanalyticsresults?.companies_data?.date1Data ?? [];
  const countrywiseanalyticsresultsstartdatetwo = countrywiseanalyticsresults?.companies_data?.date2Data ?? [];
  const mappedresults = []

  for (const companyForDate1 of countrywiseanalyticsresultsstartdate) {
    let isCompanyAdded = false;
    for (const companyForDate2 of countrywiseanalyticsresultsstartdatetwo) {
      if (companyForDate1.companyName == companyForDate2.companyName) {
        mappedresults.push({
          "data": [companyForDate1.data[0], companyForDate2.data[0]],
          "companyName": companyForDate1.companyName
        })
        isCompanyAdded = true;
        break;
      }
    }
    if (!isCompanyAdded) {
      mappedresults.push({
        "data": [companyForDate1.data[0], null],
        "companyName": companyForDate1.companyName
      })
    }
  }

  mappedresults.sort((object1, object2) => {
    let data1 = object1.data[0]["price"] ?? 0;
    let data2 = object2.data[0]["price"] ?? 0;

    if (data1 > data2) {
      return -1
    }
    if (data1 < data2) {
      return 1
    }
    return 0
  });

  return { "companies_data": mappedresults, "companies_count": countrywiseanalyticsresults?.companies_count }
}

/**
 * @param {{ originCountry: string; tradeType: string; }} payload
 */
async function getCountryWiseMarketAnalyticsFiltersADX(payload) {

  const countyAnalyticsService = new CountyAnalyticsService();

  //to get the searching columns for the india
  const searchingColumns = countyAnalyticsService._getDefaultAnalyticsSearchingColumns(payload.originCountry, payload.tradeType.toUpperCase())

  // to get the table name for the different countries
  // @ts-ignore
  const dataBucket = TradeModel.getSearchBucket(payload.originCountry.trim().toUpperCase(), payload.tradeType.trim().toUpperCase(), payload.dateExpraession);

  let params = countyAnalyticsService._generateParamsFromPayload(payload, dataBucket);

  try {
    return await countyAnalyticsService._getCountryWiseMarketAnalyticsFilters(params, searchingColumns);
  } catch (err) {
    console.log(err)
  }
}

/**
 * @param {{ tradeType: any; originCountry: any; companyName: any; dateRange: any; matchExpressions?: any; start?: null; length?: null; }} payload
 */
async function getCountryWiseCompanyAnalyticsDataADX(payload) {

  let tradeType = payload.tradeType.trim().toUpperCase();
  const originCountry = payload.originCountry.trim().toUpperCase();
  // @ts-ignore
  const dateExpression = payload.dateExpraession;

  // get an instance of country analytics service
  const countyAnalyticsService = new CountyAnalyticsService();

  // Payload details to be used
  const searchingColumns = countyAnalyticsService._getDefaultAnalyticsSearchingColumns(payload.originCountry, payload.tradeType.toUpperCase())

  const dataBucket = TradeModel.getSearchBucket(originCountry, tradeType, dateExpression);

  // @ts-ignore
  let params = countyAnalyticsService._generateCompanyParamsFromPayload(payload, dataBucket);

  try {
    let countries = await countyAnalyticsService.findTopCountries(params, searchingColumns);
    // @ts-ignore
    countries = mapgetCountryWiseCompanyAnalyticsData(countries)
    return countries;
  } catch (error) {
    let { errorMessage } = getLoggerInstance(error, __filename);
    console.log(errorMessage);
    throw error;
  }
}

/**
 * @param {{ countries_count: number; countries_data: { date1Data: any; date2Data: any; }; } | null} countrywiseanalyticsresults
 */
function mapgetCountryWiseCompanyAnalyticsData(countrywiseanalyticsresults) {
  const mappedCountriesData = [];
  const countriesData = countrywiseanalyticsresults?.countries_data;
  const date1DataMap = new Map(countriesData?.date1Data.map(item => [item.countryName, item]));

  for (const date2Data of countriesData?.date2Data) {
    const date1Data = date1DataMap.get(date2Data.countryName);
    if (date1Data) {
      const aggregateData = {
        date1: {
          price: date1Data.SUMMARY_TOTAL_USD_VALUE,
          quantity: date1Data.SUMMARY_QUANTITY,
          shipments: date1Data.SUMMARY_SHIPMENTS,
          _id: date1Data.countryName
        },
        date2: {
          price: date2Data.SUMMARY_TOTAL_USD_VALUE,
          quantity: date2Data.SUMMARY_QUANTITY,
          shipments: date2Data.SUMMARY_SHIPMENTS,
          _id: date2Data.countryName
        },
        hscodes: {}
      };

      const codeMap = new Map(date2Data.HS_CODES.map(code => [code.HS_CODE, code]));

      for (const code1 of date1Data.HS_CODES) {
        const code2 = codeMap.get(code1.HS_CODE);
        if (code2) {
          aggregateData.hscodes[code1.HS_CODE] = {
            date1: {
              hS_code_description: code1.hS_code_description,
              price: code1.SUMMARY_TOTAL_USD_VALUE,
              quantity: code1.SUMMARY_QUANTITY,
              shipments: code1.SUMMARY_SHIPMENTS,
              _id: code1.HS_CODE
            },
            date2: {
              hS_code_description: code2.hS_code_description,
              price: code2.SUMMARY_TOTAL_USD_VALUE,
              quantity: code2.SUMMARY_QUANTITY,
              shipments: code2.SUMMARY_SHIPMENTS,
              _id: code2.HS_CODE
            }
          };
        }
      }
      mappedCountriesData.push(aggregateData);
    }
  }

  // @ts-ignore
  countrywiseanalyticsresults.countries_data = mappedCountriesData;
  return countrywiseanalyticsresults;

}

/**
 * @param {{ originCountry: string; tradeType: string; }} payload
 */
async function getTradeWiseMarketAnalyticsDataADX(payload) {

  // get an instance of country analytics service
  const tradeAnalyticsService = new TradeAnalyticsService();

  // Payload details to be used
  const searchingColumns = tradeAnalyticsService._getDefaultAnalyticsSearchingColumns(payload.originCountry, payload.tradeType.toUpperCase())

  // @ts-ignore
  const dataBucket = TradeModel.getSearchBucket(payload.originCountry.trim().toUpperCase(), payload.tradeType.trim().toUpperCase(), payload.dateExpraession);

  let params = tradeAnalyticsService._generateParamsFromPayload(payload, dataBucket);

  try {
    let companies = await tradeAnalyticsService.findTopCompanies(params, searchingColumns);
    // @ts-ignore
    companies = mapgetTradeWiseMarketAnalyticsData(companies);

    return companies;
  } catch (error) {
    let { errorMessage } = getLoggerInstance(error, __filename);
    console.log(errorMessage);
    throw error;
  }
}

/**
 * @param {{ trade_count: number; trade_data: { date1Data: any; date2Data: any; }; risonQuery: { date1: string; date2: string; }; } | null} tradeWiseAnalyticsResults
 */
function mapgetTradeWiseMarketAnalyticsData(tradeWiseAnalyticsResults) {
  const tradeWiseAnalyticsResultsStartdate = tradeWiseAnalyticsResults?.trade_data?.date1Data ?? [];
  const tradeWiseanAlyticsResultsStartDateTwo = tradeWiseAnalyticsResults?.trade_data?.date2Data ?? [];
  const mappedresults = []

  for (const companyForDate1 of tradeWiseAnalyticsResultsStartdate) {
    let isCompanyAdded = false;
    for (const companyForDate2 of tradeWiseanAlyticsResultsStartDateTwo) {
      if (companyForDate1.companyName == companyForDate2.companyName) {
        mappedresults.push({
          "date1": companyForDate1.data[0],
          "date2": companyForDate2.data[0],
          "company_name": companyForDate1.companyName
        })
        isCompanyAdded = true;
        break;
      }
    }
    if (!isCompanyAdded) {
      mappedresults.push({
        "date1": companyForDate1.data[0],
        "date2": null,
        "company_name": companyForDate1.companyName
      })
    }
  }

  mappedresults.sort((object1, object2) => {
    let data1 = object1?.date1?.price;
    let data2 = object2?.date2?.price;

    if (data1 > data2) {
      return -1
    }
    if (data1 < data2) {
      return 1
    }
    return 0
  });

  return { "trade_data": mappedresults, "trade_count": tradeWiseAnalyticsResults?.trade_count }
}

/**
 * @param {{ originCountry: string; tradeType: string; }} payload
 */
async function getTradeWiseMarketAnalyticsFiltersADX(payload) {

  const tradeAnalyticsService = new TradeAnalyticsService();

  //to get the searching columns for the india
  const searchingColumns = tradeAnalyticsService._getDefaultAnalyticsSearchingColumns(payload.originCountry, payload.tradeType.toUpperCase())

  // to get the table name for the different countries
  // @ts-ignore
  const dataBucket = TradeModel.getSearchBucket(payload.originCountry.trim().toUpperCase(), payload.tradeType.trim().toUpperCase(), payload.dateExpraession);

  let params = tradeAnalyticsService._generateParamsFromPayload(payload, dataBucket);

  try {
    return await tradeAnalyticsService._getTradeWiseMarketAnalyticsFilters(params, searchingColumns);
  } catch (err) {
    console.log(err)
  }
}

/**
 * @param {{ tradeType: any; originCountry: any; companyName: any; dateRange: any; matchExpressions?: any; start?: null; length?: null; }} payload
 */
async function getTradeWiseCompanyAnalyticsDataADX(payload) {

  let tradeType = payload.tradeType.trim().toUpperCase();
  const originCountry = payload.originCountry.trim().toUpperCase();
  // const dateExpression = payload.dateExpraession;

  // get an instance of country analytics service
  const tradeAnalyticsService = new TradeAnalyticsService();

  // Payload details to be used
  const searchingColumns = tradeAnalyticsService._getDefaultAnalyticsSearchingColumns(payload.originCountry, payload.tradeType.toUpperCase())

  const dataBucket = TradeModel.getSearchBucket(originCountry, tradeType);

  // @ts-ignore
  let params = tradeAnalyticsService._generateCompanyParamsFromPayload(payload, dataBucket);

  try {
    let countries = await tradeAnalyticsService.findTopCountries(params, searchingColumns);
    // @ts-ignore
    countries = mapgetTradeWiseCompanyAnalyticsData(countries)
    return countries;
  } catch (error) {
    let { errorMessage } = getLoggerInstance(error, __filename);
    console.log(errorMessage);
    throw error;
  }
}

/**
 * @param {{ countries_count: number; countries_data: { date1Data: any; date2Data: any; }; } | null} tradeWiseanAlyticsResults
 */
function mapgetTradeWiseCompanyAnalyticsData(tradeWiseanAlyticsResults) {
  const mappedCountriesData = [];
  const countriesData = tradeWiseanAlyticsResults?.countries_data;
  const date1DataMap = new Map(countriesData?.date1Data.map(item => [item.countryName, item]));

  for (const date2Data of countriesData?.date2Data) {
    const date1Data = date1DataMap.get(date2Data.countryName);
    if (date1Data) {
      const aggregateData = {
        countryName: date1Data.countryName,
        country_data: {
          date1: {
            price: date1Data.SUMMARY_TOTAL_USD_VALUE,
            quantity: date1Data.SUMMARY_QUANTITY,
            shipments: date1Data.SUMMARY_SHIPMENTS,
            _id: date1Data.countryName
          },
          date2: {
            price: date2Data.SUMMARY_TOTAL_USD_VALUE,
            quantity: date2Data.SUMMARY_QUANTITY,
            shipments: date2Data.SUMMARY_SHIPMENTS,
            _id: date2Data.countryName
          }
        },
        hs_code_data: []
      }

      const codeMap = new Map(date2Data.HS_CODES.map(code => [code.HS_CODE, code]));

      for (const code1 of date1Data.HS_CODES) {
        const code2 = codeMap.get(code1.HS_CODE);
        if (code2) {
          // @ts-ignore
          aggregateData.hs_code_data.push({
            name: code1.HS_CODE,
            hS_code_description: code1.hS_code_description,
            date1: {
              price: code1.SUMMARY_TOTAL_USD_VALUE,
              quantity: code1.SUMMARY_QUANTITY,
              shipments: code1.SUMMARY_SHIPMENTS
            },
            date2: {
              price: code2.SUMMARY_TOTAL_USD_VALUE,
              quantity: code2.SUMMARY_QUANTITY,
              shipments: code2.SUMMARY_SHIPMENTS
            }
          });
        }
      }
      mappedCountriesData.push(aggregateData);
    }
  }

  return {
    tradeCountryData: mappedCountriesData
  }
}
/**
 * @param {{ originCountry: string; tradeType: string; }} payload
 */
async function getProductWiseAnalyticsDataADX(payload) {
  // get an instance of product analytic service
  const productAnalyticService = new ProductAnalyticService()

  // // get the searching colums from the product analytic class
  const searchingColumns = productAnalyticService._getDefaultAnalyticsSearchingColumns(payload.originCountry, payload.tradeType.toUpperCase());

  // @ts-ignore
  const dataBucket = TradeModel.getSearchBucket(payload.originCountry.trim().toUpperCase(), payload.tradeType.trim().toUpperCase(), payload.dateExpraession);

  let params = productAnalyticService._generateParamsFromPayload(payload, dataBucket);


  try {
    // @ts-ignore
    let product = await productAnalyticService.findTopProducts(params, searchingColumns);
    return product;

    // @ts-ignore
  } catch (error) {
    let { errorMessage } = getLoggerInstance(error, __filename);
    console.log(errorMessage);
    throw error;
  }
}
/**
 * @param {any} productwiseanalyticsdata
 * @param {any} payload
 */
async function mapgetProductWiseMarketAnalyticsData(payload, productwiseanalyticsdata) {
  const productwiseanalyticsdataresultsstartdate = productwiseanalyticsdata?.product_data?.date1Data ?? [];
  const productwiseanalyticsdataresultsstartdatetwo = productwiseanalyticsdata?.product_data?.date2Data ?? [];

  let mappedresults = []
  for (const productForDate1 of productwiseanalyticsdataresultsstartdate) {
    for (const productForDate2 of productwiseanalyticsdataresultsstartdatetwo) {
      if (productForDate1.hs_code == productForDate2.hs_code) {
        let country_data = [];
        let port_data = [];

        if (payload.bindByCountry) {
          for (const date1 of productForDate1.country_data) {
            for (const date2 of productForDate2.country_data) {
              if (date1.country.toLowerCase() == date2.country.toLowerCase()) {
                country_data.push({
                  "date1": {
                    count: date1.count,
                    price: date1.price,
                    quantity: date1.quantity,
                    shipments: date1.shipments
                  },
                  "date2": {
                    count: date2.count,
                    price: date2.price,
                    quantity: date2.quantity,
                    shipments: date2.shipments
                  },
                  "country": date2.country
                });
              }
            }
          }
        }
        else if (payload.bindByPort) {
          for (const date1 of productForDate1.port_data) {
            for (const date2 of productForDate2.port_data) {
              if (date1.port.toLowerCase() == date2.port.toLowerCase()) {
                port_data.push({
                  "date1": {
                    count: date1.count,
                    price: date1.price,
                    quantity: date1.quantity,
                    shipments: date1.shipments
                  },
                  "date2": {
                    count: date2.count,
                    price: date2.price,
                    quantity: date2.quantity,
                    shipments: date2.shipments
                  },
                  "country": date2.port
                });
              }
            }
          }
        }

        mappedresults.push({
          "hs_code_data": {
            "date1": productForDate1.hs_code_data,
            "date2": productForDate2.hs_code_data
          },
          "hs_Code_Description": await getHsCodeDescription(productForDate1.hs_code),
          "hs_code": productForDate1.hs_code,
          "country_data": country_data,
          "port_data": port_data
        });

        break;
      }
    }
  }

  mappedresults = mappedresults.sort((a, b) => a.hs_code.localeCompare(b.hs_code));

  return { "product_data": mappedresults, "product_count": productwiseanalyticsdata?.product_count }
}

async function getHsCodeDescription(hs_code) {
  try {
    const descriptionArray = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.hs_code_description_mapping)
      .find({ "hs_code": hs_code })
      .project({
        'description': 1
      }).toArray();

    return descriptionArray[0]?.description || "";
  } catch (error) {
    console.error("Error fetching HS code description:", error);
    return "";
  }
}
/// also use to different set of hs_code in marketplace of product
//   function mapgetProductWiseMarketAnalyticsData(productwiseanalyticsdata) {
//     console.log(productwiseanalyticsdata);
//     const productwiseanalyticsdataresultsstartdate = productwiseanalyticsdata?.product_data?.date1Data ?? [];
//     const productwiseanalyticsdataresultsstartdatetwo = productwiseanalyticsdata?.product_data?.date2Data ?? [];
//     const mappedresults = [];

//     // Create a set to keep track of added HS codes
//     const addedHSCodes = new Set();

//     for (const productForDate1 of productwiseanalyticsdataresultsstartdate) {
//         if (!addedHSCodes.has(productForDate1.hs_code)) {
//             let isHsCodeAdded = false;
//             for (const productForDate2 of productwiseanalyticsdataresultsstartdatetwo) {
//                 if (productForDate1.hs_code === productForDate2.hs_code) {
//                     mappedresults.push({
//                         "hs_code_data": {
//                           "date1":productForDate1.data.shipments,
//                           "date2":productForDate2.data.shipments
//                         //     "date1": {
//                         //     "shipments": productForDate1.data.shipments,
//                         //     "quantity": productForDate1.data.quantity,
//                         //     "price": productForDate1.data.price,
//                         //     "count": productForDate1.data.shipments,
//                         //     },
//                         //     "date2":{
//                         //       "shipments": productForDate2.data.shipments,
//                         //       "quantity": productForDate2.data.quantity,
//                         //       "price": productForDate2.data.price,
//                         //       "count": productForDate2.data.shipments,
//                         //     }
//                         },
//                         "hs_Code_Description": productForDate1.hs_Code_Description,
//                         "hs_code": productForDate1.hs_code,
//                     });
//                     isHsCodeAdded = true;
//                     addedHSCodes.add(productForDate1.hs_code);
//                     break;
//                 }
//             }
//             if (!isHsCodeAdded) {
//                 mappedresults.push({
//                     "hs_code_data": {
//                         "date1": productForDate1,
//                         "date2": null,
//                     },
//                     "hs_Code_Description": productForDate1.hs_Code_Description,
//                     "hs_code": productForDate1.hs_code,
//                 });
//                 addedHSCodes.add(productForDate1.hs_code); 
//             }
//         }
//     }

//     console.log(mappedresults);


//     mappedresults.sort((object1, object2) => {
//         let data1 = object1.hs_code_data.date1?.price ?? 0;
//         let data2 = object2.hs_code_data.date1?.price ?? 0;

//         if (data1 > data2) {
//             return -1;
//         }
//         if (data1 < data2) {
//             return 1;
//         }
//         return 0;
//     });

//     return {
//         "product_data": mappedresults,
//         "product_count": productwiseanalyticsdata?.product_count,
//     };
// }

module.exports = {
  getCountryWiseMarketAnalyticsDataADX,
  getCountryWiseMarketAnalyticsFiltersADX,
  getCountryWiseCompanyAnalyticsDataADX,
  getTradeWiseMarketAnalyticsDataADX,
  getTradeWiseMarketAnalyticsFiltersADX,
  getTradeWiseCompanyAnalyticsDataADX,
  getProductWiseAnalyticsDataADX,
  mapgetProductWiseMarketAnalyticsData
}