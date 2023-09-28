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

    // const tradeCompanies = await marketAnalyticsModel.findTopCompany(destinationCountry, dataBucket, startDate, endDate, searchingColumns, offset, limit, matchExpressions, false);
    const resultsSet = await countyAnalyticsService.findTopCompanies(params, false, searchingColumns, destinationCountry ?? "");
    return resultsSet;
    // let analyticsDataset = {
    //   /** @type {*[]} */
    //   companies_data: []
    // }
    // let risonDataSet = {};
    // risonDataSet.date1 = tradeCompanies[1];
    // const risonDataTwo = await marketAnalyticsModel.findTopCompany(destinationCountry, dataBucket, startDateTwo, endDateTwo, searchingColumns, offset, limit, matchExpressions, true);
    // risonDataSet.date2 = risonDataTwo;
    // analyticsDataset.companies_count = tradeCompanies[0].COMPANIES.length;

    // let companyArray = []
    // if (offset && limit) {
    //   for (let i = offset; i < offset + limit; i++) {
    //     if (i >= tradeCompanies[0].COMPANIES.length) {
    //       break;
    //     }
    //     if (tradeCompanies[0].COMPANIES[i]._id == '') {
    //       continue;
    //     }
    //     companyArray.push(tradeCompanies[0].COMPANIES[i]._id);
    //   }
    // }

    // let tradeCompanydata = await marketAnalyticsModel.findAllDataForCompany(companyArray, destinationCountry, dataBucket, startDate, endDate, searchingColumns, matchExpressions);
    // let tradeCompanyLastYearData = await marketAnalyticsModel.findAllDataForCompany(companyArray, destinationCountry, dataBucket, startDateTwo, endDateTwo, searchingColumns, matchExpressions);

    // for (let i = 0; i < companyArray.length; i++) {
    //   let filteredTradeCompanydata = tradeCompanydata.COMPANIES.filter(bucket => bucket._id === companyArray[i]);
    //   let filteredTradeCompanyLastYearData = tradeCompanyLastYearData.COMPANIES.filter(bucket => bucket._id === companyArray[i]);

    //   if (!filteredTradeCompanydata && filteredTradeCompanydata.length <= 0) {
    //     let companyData = {
    //       _id: "",
    //       count: 0,
    //       price: 0,
    //       quantity: 0,
    //       shipments: 0,
    //     }

    //     filteredTradeCompanydata.push(companyData);

    //   } else if (!filteredTradeCompanyLastYearData && filteredTradeCompanyLastYearData.length <= 0) {
    //     let companyData = {
    //       _id: "",
    //       count: 0,
    //       price: 0,
    //       quantity: 0,
    //       shipments: 0,
    //     }

    //     filteredTradeCompanyLastYearData.push(companyData);
    //   }

    //   delete filteredTradeCompanydata['_id']
    //   delete filteredTradeCompanyLastYearData['_id']

    //   /** @type {*} */
    //   let bundle = {
    //     data: []
    //   }
    //   bundle.companyName = tradeCompanies[0].COMPANIES[i]._id;
    //   bundle.data.push(filteredTradeCompanydata[0]);
    //   bundle.data.push(filteredTradeCompanyLastYearData[0]);
    //   analyticsDataset.companies_data.push(bundle);
    // }
    // analyticsDataset.risonData = risonDataSet;

    // return analyticsDataset;
  } catch (error) {
    let { errorMessage } = getLoggerInstance(error, __filename);
    console.log(errorMessage);
    throw error;
  }
}

module.exports = {
  getCountryWiseMarketAnalyticsDataADX
}