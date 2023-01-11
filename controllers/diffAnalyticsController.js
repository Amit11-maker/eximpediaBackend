const TAG = "diffAnalyticsController";

const TradeModel = require("../models/tradeModel");
const SaveQueryModel = require("../models/saveQueryModel");
const WorkspaceModel = require("../models/workspaceModel");
const TradeSchema = require("../schemas/tradeSchema");
const { logger } = require("../config/logger")
const recommendationModel = require("../models/recommendationModel");
const recommendationSchema = require("../schemas/recommendationSchema");
const DateHelper = require("../helpers/dateHelper");
const AccountModel = require("../models/accountModel");
const diffAnalyticsModel = require("../models/diffAnalyticsModel");

var CronJob = require('cron').CronJob;

const fetchCompanies = async (req, res) => {
  const payload = req.body;
  let tradeType = payload.tradeType.trim().toUpperCase();
  const originCountry = payload.originCountry.trim().toUpperCase();
  const destinationCountry = payload.destinationCountry.trim().toUpperCase();
  const blCountry = payload.blCountry;
  const startDate = payload.dateRange.startDate ?? null;
  const endDate = payload.dateRange.endDate ?? null;
  const offset = payload.start != null ? payload.start : 0;
  const limit = payload.length != null ? payload.length : 10;
  let tradeMeta = {
    tradeType: tradeType,
    countryCode: originCountry,
    indexNamePrefix: originCountry.toLocaleLowerCase() + "_" + tradeType.toLocaleLowerCase(),
    blCountry
  }
  let searchingColumns = {}
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
      shipmentColumn: "DECLARATION_NO"
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
      shipmentColumn: "DECLARATION_NO"
    }
  }

  try {
    const tradeCompanies = await diffAnalyticsModel.findTopCompany(destinationCountry, tradeMeta, startDate, endDate, searchingColumns, offset, limit);
    
    let arr = [];
    let dataRangeOne = [];
    let dataRangeTwo = [];

    data = {
    }
    for (let i = 0; i < tradeCompanies.TOP_COMPANIES.length; i++) {
      let company_name = tradeCompanies.TOP_COMPANIES[i]._id;
      if(company_name ==''){
        continue;
      }
      const tradeCompaniesdata1 = await diffAnalyticsModel.findAllDataForCompany(company_name, destinationCountry, tradeMeta, startDate, endDate, searchingColumns)
      const tradeCompaniesdata2 = await diffAnalyticsModel.findAllDataForCompany(company_name, destinationCountry, tradeMeta, covertDateYear(startDate), covertDateYear(endDate), searchingColumns)
  
      bundle = {}
      bundle.date1 = tradeCompaniesdata1
      bundle.date2 = tradeCompaniesdata2
      data[company_name] = bundle;
    }
    res.status(200).json(data);
  }
  catch (err) {
    console.log(err);
  }

}


const fetchCountries = async (req, res) => {
  const payload = req.body;
  let tradeType = payload.tradeType.trim().toUpperCase();
  const originCountry = payload.originCountry.trim().toUpperCase();
  const company_name = payload.companyName.trim().toUpperCase();;
  const blCountry = payload.blCountry;
  const startDate = payload.dateRange.startDate ?? null;
  const endDate = payload.dateRange.endDate ?? null;
  const offset = payload.start  != null ? payload.start : 0;
  const limit = payload.length != null ? payload.length : 10;
  let tradeMeta = {
    tradeType: tradeType,
    countryCode: originCountry,
    indexNamePrefix: originCountry.toLocaleLowerCase() + "_" + tradeType.toLocaleLowerCase(),
    blCountry
  }
  let searchingColumns = {}
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
      shipmentColumn: "DECLARATION_NO"
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
      shipmentColumn: "DECLARATION_NO"
    }
  }

  try {
     const tradeCountries = await diffAnalyticsModel.findTopCountry(company_name, tradeMeta, startDate, endDate, searchingColumns, offset, limit);
    data = {
    }
    for (let i = 0; i < tradeCountries.TOP_COUNTRIES.length; i++) {
      let country_name = tradeCountries.TOP_COUNTRIES[i]._id;
      const tradeCountriesdata1 = await diffAnalyticsModel.findAllDataForCountry(country_name, company_name, tradeMeta, startDate, endDate, searchingColumns);
      const tradeCountriesdata2 = await diffAnalyticsModel.findAllDataForCountry(country_name, company_name, tradeMeta, covertDateYear(startDate), covertDateYear(endDate), searchingColumns);
      bundle = {}
      bundle.date1 = tradeCountriesdata1
      bundle.date2 = tradeCountriesdata2
      data[country_name] = bundle;
    }

    res.status(200).json(data);
  }
  catch (err) {
    console.log(err);
  }

}



function covertDateYear(date) {
  array = date.split("-");
  array[0] = array[0] - 1;
  dateResult = array.join("-");
  return dateResult;
}

module.exports = {
  fetchCompanies,
  fetchCountries
}
