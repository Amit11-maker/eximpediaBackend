// @ts-check
const TradeModel = require("../models/tradeModel");

const getLoggerInstance = require("../services/logger/Logger");
const { CountyAnalyticsService } = require("../services/market-analytics/country.market-analytics.service");

async function getCountryWiseMarketAnalyticsDataADX(payload) {

  // get an instance of country analytics service
  const countyAnalyticsService = new CountyAnalyticsService();

  // Payload details to be used
  const searchingColumns = countyAnalyticsService._getDefaultSearchingColumnsForIndia(payload.originCountry, payload.tradeType.toUpperCase())

  const dataBucket = TradeModel.getSearchBucket(payload.originCountry.trim().toUpperCase(), payload.tradeType.trim().toUpperCase());

  let params = countyAnalyticsService._generateParamsFromPayload(payload, dataBucket);
  let { destinationCountry, startDate, endDate, offset, limit, matchExpressions, startDateTwo, endDateTwo } = params;

  try {
    return await countyAnalyticsService.findTopCompanies(params, false, searchingColumns, destinationCountry ?? "");
  } catch (error) {
    let { errorMessage } = getLoggerInstance(error, __filename);
    console.log(errorMessage);
    throw error;
  }
}


/**
 * @param {{ companies_data: { bundle: any; bundle1: any; }; length: number; }} countrywiseanalyticsresults
 */
function mapgetCountryWiseMarketAnalyticsData(countrywiseanalyticsresults) {
  const countrywiseanalyticsresultsstartdate = countrywiseanalyticsresults?.companies_data?.bundle ?? [];
  const countrywiseanalyticsresultsstartdatetwo = countrywiseanalyticsresults?.companies_data?.bundle1 ?? [];
  const mappedresults = []
  let company_count = 0;
  
  for (const companyForDate1 of countrywiseanalyticsresultsstartdate) {
    for (const companyForDate2 of countrywiseanalyticsresultsstartdatetwo) {
      if (companyForDate1.companyName == companyForDate2.companyName) {
        mappedresults.push({
          "data": [companyForDate1.data[0], companyForDate2.data[0]],
          "companyName": companyForDate1.companyName
        })

        break;
      }
      else {
        mappedresults.push({
          "data": [companyForDate1.data[0], null],
          "companyName": companyForDate1.companyName
        })

        break;
      }
    }
    company_count++;
  }
  return { "companies_data": mappedresults, "companies_count": company_count };
}
module.exports = {
  getCountryWiseMarketAnalyticsDataADX,
  mapgetCountryWiseMarketAnalyticsData
}