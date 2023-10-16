// @ts-check
const TradeModel = require("../models/tradeModel");

const getLoggerInstance = require("../services/logger/Logger");
const { CountyAnalyticsService } = require("../services/market-analytics/country.market-analytics.service");

/**
 * @param {{ originCountry: string; tradeType: string; }} payload
 */
async function getCountryWiseMarketAnalyticsDataADX(payload) {

  // get an instance of country analytics service
  const countyAnalyticsService = new CountyAnalyticsService();

  // Payload details to be used
  const searchingColumns = countyAnalyticsService._getDefaultSearchingColumnsForIndia(payload.originCountry, payload.tradeType.toUpperCase())

  const dataBucket = TradeModel.getSearchBucket(payload.originCountry.trim().toUpperCase(), payload.tradeType.trim().toUpperCase());

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
  return { "companies_data": mappedresults, "companies_count": countrywiseanalyticsresults?.companies_count }
}

/**
 * @param {{ originCountry: string; tradeType: string; }} payload
 */
async function getCountryWiseMarketAnalyticsFiltersADX(payload) {

  const countyAnalyticsService = new CountyAnalyticsService();

  //to get the searching columns for the india
  const searchingColumns = countyAnalyticsService._getDefaultSearchingColumnsForIndia(payload.originCountry, payload.tradeType.toUpperCase())

  // to get the table name for the different countries
  const dataBucket = TradeModel.getSearchBucket(payload.originCountry.trim().toUpperCase(), payload.tradeType.trim().toUpperCase());

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

  // get an instance of country analytics service
  const countyAnalyticsService = new CountyAnalyticsService();

  // Payload details to be used
  const searchingColumns = countyAnalyticsService._getDefaultSearchingColumnsForIndia(payload.originCountry, payload.tradeType.toUpperCase())

  const dataBucket = TradeModel.getSearchBucket(originCountry, tradeType);

  // @ts-ignore
  let params = countyAnalyticsService._generateCompanyParamsFromPayload(payload, dataBucket);

  try {
    let countries = await countyAnalyticsService.findTopCountries(params, false, searchingColumns, params.companyName ?? "");
    // @ts-ignore
    countries = mapgetCountryWiseCompanyAnalyticsData(countries)

    return countries;
  } catch (error) {
    let { errorMessage } = getLoggerInstance(error, __filename);
    console.log(errorMessage);
    throw error;
  }
}



function mapgetCountryWiseCompanyAnalyticsData(countrywiseanalyticsresults) {
  const countrywiseanalyticsresultsstartdate = countrywiseanalyticsresults?.countries_data?.bundle ?? [];
  const countrywiseanalyticsresultsstartdatetwo = countrywiseanalyticsresults?.countries_data?.bundle1 ?? [];
  const mappedresults = []
  let country_count = 0;

  for (const countryForDate1 of countrywiseanalyticsresultsstartdate) {
    let isCountryAdded = false;
    for (const countryForDate2 of countrywiseanalyticsresultsstartdatetwo) {
      if (countryForDate1.countryName == countryForDate2.countryName) {
        mappedresults.push({
          "data": [countryForDate1.data[0], countryForDate2.data[0]],
          "companyName": countryForDate1.countryName
        })
        isCountryAdded = true;
        break;
      }
    }

    if (!isCountryAdded) {
      mappedresults.push({
        "data": [countryForDate1.data[0], null],
        "companyName": countryForDate1.countryName
      })
    }
    country_count++;
  }
  return { "countries_data": mappedresults, "countries_count": country_count };
}

module.exports = {
  getCountryWiseMarketAnalyticsDataADX,
  getCountryWiseCompanyAnalyticsDataADX,
  getCountryWiseMarketAnalyticsFiltersADX
}