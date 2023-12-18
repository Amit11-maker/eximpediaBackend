const TAG = "marketAnalyticsController";

const ExcelJS = require("exceljs");
const marketAnalyticsModel = require("../models/marketAnalyticsModel");
const TradeSchema = require("../schemas/tradeSchema");
const getLoggerInstance = require("../services/logger/Logger");
const { getCountryWiseMarketAnalyticsDataADX, getCountryWiseMarketAnalyticsFiltersADX, getCountryWiseCompanyAnalyticsDataADX } = require("./market-analytics-controller.adx");
const { getTradeWiseMarketAnalyticsDataADX, getTradeWiseMarketAnalyticsFiltersADX, getTradeWiseCompanyAnalyticsDataADX } = require("./market-analytics-controller.adx");
const { getProductWiseAnalyticsDataADX, mapgetProductWiseMarketAnalyticsData } = require("./market-analytics-controller.adx")


function convertToInternationalCurrencySystem(labelValue) {

  // Nine Zeroes for Billions
  return Math.abs(Number(labelValue)) >= 1.0e+9

    ? (Math.abs(Number(labelValue)) / 1.0e+9).toFixed(2) + "B"
    // Six Zeroes for Millions
    : Math.abs(Number(labelValue)) >= 1.0e+6

      ? (Math.abs(Number(labelValue)) / 1.0e+6).toFixed(2) + "M"
      // Three Zeroes for Thousands
      : Math.abs(Number(labelValue)) >= 1.0e+3

        ? (Math.abs(Number(labelValue)) / 1.0e+3).toFixed(2) + "K"

        : Math.abs(Number(labelValue));

}

function convertToYearMonthFormat(date) {
  let d = date.split("-");
  let x = d[1]

  let month = "";
  switch (x) {
    case "01":
      month = "Jan";
      break;
    case "02":
      month = "Feb";
      break;
    case "03":
      month = "Mar";
      break;
    case "04":
      month = "Apr";
      break;
    case "05":
      month = "May";
      break;
    case "06":
      month = "Jun";
      break;
    case "07":
      month = "Jul";
      break;
    case "08":
      month = "Aug";
      break;
    case "09":
      month = "Sep";
      break;
    case "10":
      month = "Oct";
      break;
    case "11":
      month = "Nov";
      break;
    case "12":
      month = "Dec";
      break;

  }
  let newDate = month + " " + d[0];
  return newDate;
}

function sortBasedOnHsCodeId(codeArray) {
  codeArray.sort((a, b) => {
    var keyA = a._id, keyB = b._id;
    // Compare the 2 dates
    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;
    return 0;
  });

  return codeArray;
}

/* Start Country vs Country market analysis */

// Find unique countries
const fetchUniqueCountries = async (req, res) => {
  try {
    const payload = req.body;
    let originCountry = payload.originCountry;
    const uniqueCountries = await marketAnalyticsModel.findAllUniqueCountries(payload);
    let uniqueCountriesList = [];
    for (let prop of uniqueCountries) {
      uniqueCountriesList.push(prop["ORIGIN_COUNTRY"]);
    }
    res.send(uniqueCountriesList);
  } catch (error) {
    res.send(error);
  }
}

// Controller functions to analyse market data of companies as per two countries
async function fetchContryWiseMarketAnalyticsData(req, res) {

  const payload = req.body;
  const originCountry = payload.originCountry.trim().toUpperCase();

  if (originCountry == "INDIA") {

    try {
      // const analyticsDataset = await getCountryWiseMarketAnalyticsData(payload, searchingColumns);
      // return res.status(200).json(analyticsDataset);
      let resultsSet = await getCountryWiseMarketAnalyticsDataADX(payload);
      res.status(200).json(resultsSet);
    }
    catch (err) {
      let { errorMessage } = getLoggerInstance(err, __filename)
      res.status(500).json({
        message: errorMessage,
      });
    }
  } else {

    res.status(202).json({
      message: "We are working for other countries reports !!",
    });
  }
}

async function getCountryWiseMarketAnalyticsData(payload, searchingColumns) {

  // Payload details to be used
  const destinationCountry = payload.destinationCountry.trim().toUpperCase();
  const matchExpressions = payload.matchExpressions ? payload.matchExpressions : null;

  const offset = payload.start != null ? payload.start : 0;
  const limit = payload.length != null ? payload.length : 10;

  const startDate = payload.dateRange.startDate ?? null;
  const endDate = payload.dateRange.endDate ?? null;
  const startDateTwo = payload.dateRange.startDateTwo ?? null;
  const endDateTwo = payload.dateRange.endDateTwo ?? null;

  const tradeType = payload.tradeType.trim().toUpperCase();
  const originCountry = payload.originCountry.trim().toUpperCase();
  const dataBucket = TradeSchema.deriveDataBucket(tradeType, originCountry);

  try {
    const tradeCompanies = await marketAnalyticsModel.findTopCompany(destinationCountry, dataBucket, startDate, endDate, searchingColumns, offset, limit, matchExpressions, false);
    analyticsDataset = {
      companies_data: []
    }
    let risonDataSet = {};
    risonDataSet.date1 = tradeCompanies[1];
    const risonDataTwo = await marketAnalyticsModel.findTopCompany(destinationCountry, dataBucket, startDateTwo, endDateTwo, searchingColumns, offset, limit, matchExpressions, true);
    risonDataSet.date2 = risonDataTwo;
    analyticsDataset.companies_count = tradeCompanies[0].COMPANIES.length;

    let companyArray = []
    for (let i = offset; i < offset + limit; i++) {
      if (i >= tradeCompanies[0].COMPANIES.length) {
        break;
      }
      if (tradeCompanies[0].COMPANIES[i]._id == '') {
        continue;
      }
      companyArray.push(tradeCompanies[0].COMPANIES[i]._id);
    }

    let tradeCompanydata = marketAnalyticsModel.findAllDataForCompany(companyArray, destinationCountry, dataBucket, startDate, endDate, searchingColumns, matchExpressions);
    let tradeCompanyLastYearData = await marketAnalyticsModel.findAllDataForCompany(companyArray, destinationCountry, dataBucket, startDateTwo, endDateTwo, searchingColumns, matchExpressions);

    tradeCompanydata = await tradeCompanydata;
    for (let i = 0; i < companyArray.length; i++) {

      let filteredTradeCompanydata = tradeCompanydata.COMPANIES.filter(bucket => bucket._id === companyArray[i]);
      let filteredTradeCompanyLastYearData = tradeCompanyLastYearData.COMPANIES.filter(bucket => bucket._id === companyArray[i]);

      if (!filteredTradeCompanydata && filteredTradeCompanydata.length <= 0) {
        let companyData = {
          _id: "",
          count: 0,
          price: 0,
          quantity: 0,
          shipments: 0,
        }

        filteredTradeCompanydata.push(companyData);

      } else if (!filteredTradeCompanyLastYearData && filteredTradeCompanyLastYearData.length <= 0) {
        let companyData = {
          _id: "",
          count: 0,
          price: 0,
          quantity: 0,
          shipments: 0,
        }

        filteredTradeCompanyLastYearData.push(companyData);
      }

      delete filteredTradeCompanydata['_id']
      delete filteredTradeCompanyLastYearData['_id']

      bundle = {
        data: []
      }
      bundle.companyName = tradeCompanies[0].COMPANIES[i]._id;
      bundle.data.push(filteredTradeCompanydata[0]);
      bundle.data.push(filteredTradeCompanyLastYearData[0]);
      analyticsDataset.companies_data.push(bundle);
    }
    analyticsDataset.risonData = risonDataSet;

    return analyticsDataset;
  } catch (error) {
    throw error;
  }
}


async function fetchContryWiseMarketAnalyticsFilters(req, res) {
  const payload = req.body;
  const originCountry = payload.originCountry.trim().toUpperCase();

  if (originCountry == "INDIA") {

    try {
      // const filtersElastic = await marketAnalyticsModel.findCompanyFilters(destinationCountry, tradeMeta, startDate, endDate, startDateTwo, endDateTwo, searchingColumns, false, matchExpressions);

      const filters = await getCountryWiseMarketAnalyticsFiltersADX(payload);
      filters.FILTER_HS_CODE = sortBasedOnHsCodeId(filters.FILTER_HS_CODE);
      const _filter = {
        filter: filters
      }
      res.status(200).json(_filter);
    }
    catch (err) {
      console.log(err);
      res.status(500).json({
        message: "Internal Server Error",
      });
    }
  } else {
    res.status(202).json({
      message: "We are working for other countries reports !!",
    });
  }
}

async function downloadContryWiseMarketAnalyticsData(req, res) {

  const payload = req.body;
  let tradeType = payload.tradeType.trim().toUpperCase();
  const originCountry = payload.originCountry.trim().toUpperCase();

  const startDate = payload.dateRange.startDate ?? null;
  const endDate = payload.dateRange.endDate ?? null;
  const startDateTwo = payload.dateRange.startDateTwo ?? null;
  const endDateTwo = payload.dateRange.endDateTwo ?? null;


  let tradeMeta = TradeSchema.deriveDataBucket(tradeType, originCountry);

  let searchingColumns = {}
  if (originCountry == "INDIA") {
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
        foreignportColumn: "PORT_OF_SHIPMENT"
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
      const analyticsDataset = await getCountryWiseMarketAnalyticsDataADX(payload, searchingColumns);

      let workbook = new ExcelJS.Workbook();
      let worksheet = workbook.addWorksheet("Comapany analytics Data");

      let getCellCountryText = worksheet.getCell("B2");

      worksheet.getCell("A5").value = "";

      getCellCountryText.value = "DATA";
      getCellCountryText.font = {
        name: "Calibri",
        size: 22,
        underline: "single",
        bold: true,
        color: { argb: "005d91" },
        height: "auto",
      }

      worksheet.mergeCells("B2", "D3");
      getCellCountryText.alignment = { vertical: "middle", horizontal: "center" }

      //Add Image
      let myLogoImage = workbook.addImage({
        filename: "./public/images/logo-new.jpg",
        extension: "jpeg",
      });

      worksheet.addImage(myLogoImage, "A1:A4");
      worksheet.add;

      let headerRow = worksheet.addRow(["Company Name", "Compared Date", "Shipments", "Price", "Quantity"]);
      let colLength = [];
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "005d91" },
          bgColor: { argb: "" },
        };
        cell.font = {
          bold: true,
          color: { argb: "FFFFFF" },
          size: 12,
        };
        colLength.push(cell.value ? cell.value.toString().length : 10);
      });

      worksheet.columns.forEach(function (column, i) {
        if (colLength[i] < 10) {
          colLength[i] = 10;
        }
        column.width = colLength[i] * 2;
      });

      let rowCount = 0
      let cellCount = 7;
      while (rowCount < analyticsDataset.companies_data.length) {
        let analyticsData = analyticsDataset.companies_data[rowCount];

        let startCell = "A" + cellCount;
        let endCell = "A" + (cellCount + 2);

        let companyCell = worksheet.getCell(startCell);
        companyCell.value = analyticsData.companyName;
        worksheet.mergeCells(startCell, endCell);
        companyCell.alignment = { vertical: "middle", horizontal: "left" }

        let data = analyticsData.data;
        for (let i = 0; i < data.length + 1; i++) {
          let dateCell = worksheet.getCell("B" + cellCount);
          let shipmentCell = worksheet.getCell("C" + cellCount);
          let priceCell = worksheet.getCell("D" + cellCount);
          let quantityCell = worksheet.getCell("E" + cellCount);
          if (i < data.length) {
            if (i == 0) {
              dateCell.value = startDate + "-" + endDate;
            } else {
              dateCell.value = startDateTwo + "-" + endDateTwo;
            }
            dateCell.alignment = { vertical: "middle", horizontal: "center" }

            shipmentCell.value = data[i]?.shipments ? convertToInternationalCurrencySystem(data[i].shipments.toFixed(2)) : 0;
            shipmentCell.alignment = { vertical: "middle", horizontal: "right" }

            priceCell.value = data[i]?.price ? convertToInternationalCurrencySystem(data[i].price.toFixed(2)) : 0;
            priceCell.alignment = { vertical: "middle", horizontal: "right" }

            quantityCell.value = data[i]?.quantity ? convertToInternationalCurrencySystem(data[i].quantity.toFixed(2)) : 0;
            quantityCell.alignment = { vertical: "middle", horizontal: "right" }
          }
          else {
            dateCell.value = "Growth(%)";
            dateCell.alignment = { vertical: "middle", horizontal: "center" }
            dateCell.font = { bold: true }

            let shipmentCurrentYearData = data[0]?.shipments ? data[0].shipments : 0;
            let shipmentLastYearData = data[1]?.shipments ? data[1].shipments : 0;
            let shipmentCellValue = (shipmentCurrentYearData - shipmentLastYearData) / (shipmentCurrentYearData + shipmentLastYearData);
            shipmentCell.value = parseFloat(shipmentCellValue * 100).toFixed(2) + "%";
            shipmentCell.alignment = { vertical: "middle", horizontal: "right" }
            let shipmentColor = shipmentCellValue > 0 ? "008000" : "FF0000";
            shipmentCell.font = { color: { argb: shipmentColor }, bold: true }

            let priceCurrentYearData = data[0]?.price ? data[0].price : 0;
            let priceLastYearData = data[1]?.price ? data[1].price : 0;
            let priceCellValue = (priceCurrentYearData - priceLastYearData) / (priceCurrentYearData + priceLastYearData);
            priceCell.value = parseFloat(priceCellValue * 100).toFixed(2) + "%";
            priceCell.alignment = { vertical: "middle", horizontal: "right" }
            let priceColor = priceCellValue > 0 ? "008000" : "FF0000";
            priceCell.font = { color: { argb: priceColor }, bold: true }

            let quantityCurrentYearData = data[0]?.quantity ? data[0].quantity : 0;
            let quantityLastYearData = data[1]?.quantity ? data[1].quantity : 0;
            let quantityCellValue = (quantityCurrentYearData - quantityLastYearData) / (quantityCurrentYearData + quantityLastYearData);
            quantityCell.value = parseFloat(quantityCellValue * 100).toFixed(2) + "%";
            quantityCell.alignment = { vertical: "middle", horizontal: "right" }
            let quantityColor = quantityCellValue > 0 ? "008000" : "FF0000";
            quantityCell.font = { color: { argb: quantityColor }, bold: true }
          }
          cellCount++;
        }
        rowCount++;
      }


      workbook.xlsx.write(res, function () {
        res.end();
      });

    } catch (error) {
      res.status(500).json({
        message: "Internal Server Error",
      });
    }
  } else {
    res.status(202).json({
      message: "We are working for other countries reports !!",
    });
  }
}

// Controller functions to analyse country vs country market data as per the company
async function fetchContryWiseCompanyAnalyticsData(req, res) {
  const payload = req.body;

  try {
    // const analyticsData = await getContryWiseCompanyAnalyticsData(company_name, tradeMeta, startDate, endDate, startDateTwo, endDateTwo, searchingColumns);
    // res.status(200).json(analyticsData);
    let resultsSet = await getCountryWiseCompanyAnalyticsDataADX(payload);
    const mappedProducts = mapgetProductWiseMarketAnalyticsData(resultsSet)
    res.status(200).json(mappedProducts);

  }
  catch (err) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }

}
async function fetchContryWiseTradeAnalyticsData(req, res) {
  const payload = req.body;

  try {
    // const analyticsData = await getContryWiseTradeAnalyticsData(payload);
    // res.status(200).json(analyticsData);

    let resultsSet = await getTradeWiseCompanyAnalyticsDataADX(payload);
    res.status(200).json(resultsSet);
  }
  catch (err) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }

}

async function getContryWiseCompanyAnalyticsData(company_name, tradeMeta, startDate, endDate, startDateTwo, endDateTwo, searchingColumns) {
  try {
    const tradeCountries = await marketAnalyticsModel.findTopCountry(company_name, tradeMeta, startDate, endDate, searchingColumns);

    data = {
      countries_data: [],
      company_address: tradeCountries.companyAddress
    }

    data.countries_count = tradeCountries.COUNTRIES.length;

    for (let i = 0; i < tradeCountries.COUNTRIES.length; i++) {
      let country_name = tradeCountries.COUNTRIES[i]._id;
      let tradeCountriesdata1 = marketAnalyticsModel.findAllDataForCountry(country_name, company_name, tradeMeta, startDate, endDate, searchingColumns, true);

      let tradeCountriesdata2 = await marketAnalyticsModel.findAllDataForCountry(country_name, company_name, tradeMeta, startDateTwo, endDateTwo, searchingColumns, true);
      bundle = {}
      tradeCountriesdata1 = await tradeCountriesdata1;
      bundle.date1 = tradeCountriesdata1.TOP_COUNTRIES[0]
      bundle.date2 = tradeCountriesdata2.TOP_COUNTRIES[0]

      hs = {}

      for (let hs_Codes = 0; hs_Codes < tradeCountriesdata1.TOP_HS_CODE.length; hs_Codes++) {
        hs_code = {};
        hs_code.date1 = tradeCountriesdata1.TOP_HS_CODE[hs_Codes];
        let index = tradeCountriesdata2.TOP_HS_CODE.findIndex(CountriesdataIndex => CountriesdataIndex._id == hs_code.date1._id);
        if (index != -1) {
          hs_code.date2 = tradeCountriesdata2.TOP_HS_CODE[index];
          hs[hs_code.date1._id] = hs_code;
        }

      }
      bundle.hscodes = hs;
      data.countries_data.push(bundle);

    }
    return data;
  } catch (err) {
    throw error;
  }
}

async function getContryWiseTradeAnalyticsData(payload) {
  try {
    const startDate = payload.dateRange.startDate ?? null;
    const endDate = payload.dateRange.endDate ?? null;
    const startDateTwo = payload.dateRange.startDateTwo ?? null;
    const endDateTwo = payload.dateRange.endDateTwo ?? null;
    const tradeCountries = await marketAnalyticsModel.findTopCountryForTrade(payload);
    if (tradeCountries == "please select appropriate range") {
      return tradeCountries;
    } else {
      let countryArr = [];
      for (let i = 0; i < tradeCountries.COUNTRIES.length; i++) {
        countryArr.push(tradeCountries.COUNTRIES[i]._id)
      }

      let tradeCountriesdata1 = await marketAnalyticsModel.findAllDataForTradeCountry(payload, countryArr, startDate, endDate, true);
      payload.countryTradeData = tradeCountriesdata1;
      let tradeCountriesdata2 = await marketAnalyticsModel.findAllDataForTradeCountry(payload, countryArr, startDateTwo, endDateTwo, false);

      return tradeCountriesdata2;
    }
  } catch (err) {
    throw error;
  }
}

async function downloadContryWiseCompanyAnalyticsData(req, res) {
  const payload = req.body;
  let tradeType = payload.tradeType.trim().toUpperCase();
  const originCountry = payload.originCountry.trim().toUpperCase();
  const company_name = payload.companyName.trim().toUpperCase();;
  const blCountry = payload.blCountry;
  const startDate = payload.dateRange.startDate ?? null;
  const endDate = payload.dateRange.endDate ?? null;
  const startDateTwo = payload.dateRange.startDateTwo ?? null;
  const endDateTwo = payload.dateRange.endDateTwo ?? null;
  const offset = payload.start != null ? payload.start : 0;
  const limit = payload.length != null ? payload.length : 10;

  let tradeMeta = TradeSchema.deriveDataBucket(tradeType, originCountry);
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
      shipmentColumn: "DECLARATION_NO",
      codeColumn4: "HS_CODE_4",
      address: "SUPPLIER_ADDRESS"
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
      codeColumn4: "HS_CODE_4",
      address: "BUYER_ADDRESS"
    }
  }

  try {
    const analyticsDataADX = await getCountryWiseCompanyAnalyticsDataADX(company_name, tradeMeta, startDate, endDate, startDateTwo, endDateTwo, searchingColumns, offset, limit);
    const analyticsData = mapgetProductWiseMarketAnalyticsData(analyticsDataADX)
    let workbook = new ExcelJS.Workbook();
    let worksheet = workbook.addWorksheet("Country analytics Data");

    let getCellCountryText = worksheet.getCell("C2");

    worksheet.getCell("A5").value = "";

    getCellCountryText.value = "DATA";
    getCellCountryText.font = {
      name: "Calibri",
      size: 22,
      underline: "single",
      bold: true,
      color: { argb: "005d91" },
      height: "auto",
    }

    worksheet.mergeCells("C2", "E3");
    getCellCountryText.alignment = { vertical: "middle", horizontal: "center" }

    //Add Image
    let myLogoImage = workbook.addImage({
      filename: "./public/images/logo-new.jpg",
      extension: "jpeg",
    });

    worksheet.addImage(myLogoImage, "A1:A4");
    worksheet.add;

    let headerRow = worksheet.addRow(["HS code 4", "HS code description", "Quantity", "", "", "Price", "", "", "Shipments", "", ""]);
    worksheet.mergeCells('C6:E6');
    worksheet.mergeCells('F6:H6');
    worksheet.mergeCells('I6:K6');
    let startDate1 = convertToYearMonthFormat(startDate);
    let endDate1 = convertToYearMonthFormat(endDate);
    let d1 = startDateTwo;
    let d2 = endDateTwo;
    let startDate2 = convertToYearMonthFormat(d1);
    let endDate2 = convertToYearMonthFormat(d2);
    let headerRow1 = worksheet.addRow(["", "", startDate1 + "-" + endDate1, startDate2 + "-" + endDate2, "Growth", startDate1 + "-" + endDate1, startDate2 + "-" + endDate2, "Growth", startDate1 + "-" + endDate1, startDate2 + "-" + endDate2, "Growth"]);
    worksheet.mergeCells('A6:A7');
    worksheet.mergeCells('B6:B7');
    let colLength = [];
    headerRow.eachCell((cell) => {
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle'
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "005d91" },
        bgColor: { argb: "" },
      };
      cell.font = {
        bold: true,
        color: { argb: "FFFFFF" },
        size: 12,
      };
      colLength.push(cell.value ? cell.value.toString().length : 10);
    });

    headerRow1.eachCell((cell) => {
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle'
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "005d91" },
        bgColor: { argb: "" },
      };
      cell.font = {
        bold: true,
        color: { argb: "FFFFFF" },
        size: 12,
      };
      colLength.push(cell.value ? cell.value.toString().length : 10);
    });

    worksheet.columns.forEach(function (column, i) {
      if (colLength[i] < 10) {
        colLength[i] = 10;
      }
      column.width = colLength[i] * 2;
    });

    let rowCount = 0
    let cellCount = 8;
    worksheet.mergeCells("A5", "K5")
    let companyCell = worksheet.getCell("A5");
    companyCell.value = company_name;
    companyCell.alignment = {
      horizontal: 'center'
    };
    companyCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "ADD8E6" },
      bgColor: { argb: "" },
    };
    companyCell.font = {
      bold: true,
      size: 12,
    };
    for (let s = 0; s < analyticsData.countries_data.length; s++) {
      let ctry = analyticsData.countries_data[s];
      for (let c in ctry) {
        if (Object.keys(ctry[c].hscodes).length == 0) { continue; }
        let startCell = "A" + cellCount;
        let endCell = "K" + cellCount;

        let countryCell = worksheet.getCell(startCell);
        countryCell.value = ctry[c].date1[0]._id;

        worksheet.mergeCells(startCell, endCell);
        countryCell.font = {
          bold: true,
          size: 12
        };
        cellCount++;
        let insidedata = ctry[c].hscodes
        for (let data in insidedata) {
          let hsCodeCell = worksheet.getCell("A" + cellCount);
          let hsDescriptionCell = worksheet.getCell("B" + cellCount);
          let priceCurrentYearData = worksheet.getCell("C" + cellCount);
          let priceLastYearData = worksheet.getCell("D" + cellCount);
          let priceCell = worksheet.getCell("E" + cellCount);
          let quantityCurrentYearData = worksheet.getCell("F" + cellCount);
          let quantityLastYearData = worksheet.getCell("G" + cellCount);
          let quantityCell = worksheet.getCell("H" + cellCount);
          let shipmentCurrentYearData = worksheet.getCell("I" + cellCount);
          let shipmentLastYearData = worksheet.getCell("J" + cellCount);
          let shipmentCell = worksheet.getCell("K" + cellCount);

          hsCodeCell.value = data;
          let val = insidedata[data];
          hsDescriptionCell.value = val.date1.hS_code_description;
          priceCurrentYearData.value = val.date1.price ? convertToInternationalCurrencySystem(val.date1.price) : 0;
          priceLastYearData.value = val.date2.price ? convertToInternationalCurrencySystem(val.date2.price) : 0;
          quantityCurrentYearData.value = val.date1.quantity ? convertToInternationalCurrencySystem(val.date1.quantity) : 0;
          quantityLastYearData.value = val.date2.quantity ? convertToInternationalCurrencySystem(val.date2.quantity) : 0;
          shipmentCurrentYearData.value = val.date1.shipments
          shipmentLastYearData.value = val.date2.shipments

          let shipmentCellValue = (val.date1.shipments - val.date2.shipments) / (val.date1.shipments + val.date2.shipments);
          shipmentCell.value = convertToInternationalCurrencySystem((shipmentCellValue * 100).toFixed(2)) + "%";
          shipmentCurrentYearData.alignment = { vertical: "middle", horizontal: "right" }
          shipmentLastYearData.alignment = { vertical: "middle", horizontal: "right" }
          shipmentCell.alignment = { vertical: "middle", horizontal: "right" }
          let shipmentColor = shipmentCellValue > 0 ? "008000" : "FF0000";
          shipmentCell.font = { color: { argb: shipmentColor }, bold: true }

          let priceCellValue = (val.date1.price - val.date2.price) / (val.date1.price + val.date2.price);
          priceCell.value = convertToInternationalCurrencySystem((priceCellValue * 100).toFixed(2)) + "%";
          priceCell.alignment = { vertical: "middle", horizontal: "right" }
          priceCurrentYearData.alignment = { vertical: "middle", horizontal: "right" }
          priceLastYearData.alignment = { vertical: "middle", horizontal: "right" }
          let priceColor = priceCellValue > 0 ? "008000" : "FF0000";
          priceCell.font = { color: { argb: priceColor }, bold: true }

          let quantityCellValue = (val.date1.quantity - val.date2.quantity) / (val.date1.quantity + val.date2.quantity);
          quantityCell.value = convertToInternationalCurrencySystem((quantityCellValue * 100).toFixed(2)) + "%";
          quantityCell.alignment = { vertical: "middle", horizontal: "right" }
          quantityCurrentYearData.alignment = { vertical: "middle", horizontal: "right" }
          quantityLastYearData.alignment = { vertical: "middle", horizontal: "right" }
          let quantityColor = quantityCellValue > 0 ? "008000" : "FF0000";
          quantityCell.font = { color: { argb: quantityColor }, bold: true }
          cellCount++
        }
      }
    }
    // workbook.xlsx.writeFile("C:\\Users\\kaush\\OneDrive\\Desktop\\data.xlsx");
    workbook.xlsx.write(res, function () {
      res.end();
    });

  } catch (err) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

async function downloadTradeWiseCompanyAnalyticsData(req, res) {
  const payload = req.body;
  let tradeType = payload.tradeType.trim().toUpperCase();
  const originCountry = payload.originCountry.trim().toUpperCase();
  const company_name = payload.company_name.trim().toUpperCase();;
  const startDate = payload.dateRange.startDate ?? null;
  const endDate = payload.dateRange.endDate ?? null;
  const startDateTwo = payload.dateRange.startDateTwo ?? null;
  const endDateTwo = payload.dateRange.endDateTwo ?? null;
  const offset = payload.start != null ? payload.start : 0;
  const limit = payload.length != null ? payload.length : 10;


  try {

    const analyticsData = await getContryWiseTradeAnalyticsData(payload);
    let workbook = new ExcelJS.Workbook();
    let worksheet = workbook.addWorksheet("Country analytics Data");

    let getCellCountryText = worksheet.getCell("C2");

    worksheet.getCell("A5").value = "";

    getCellCountryText.value = "DATA";
    getCellCountryText.font = {
      name: "Calibri",
      size: 22,
      underline: "single",
      bold: true,
      color: { argb: "005d91" },
      height: "auto",
    }

    worksheet.mergeCells("C2", "E3");
    getCellCountryText.alignment = { vertical: "middle", horizontal: "center" }

    //Add Image
    let myLogoImage = workbook.addImage({
      filename: "./public/images/logo-new.jpg",
      extension: "jpeg",
    });

    worksheet.addImage(myLogoImage, "A1:A4");
    worksheet.add;

    let headerRow = worksheet.addRow(["HS code 4", "HS code description", "Quantity", "", "", "Price", "", "", "Shipments", "", ""]);
    worksheet.mergeCells('C6:E6');
    worksheet.mergeCells('F6:H6');
    worksheet.mergeCells('I6:K6');
    let startDate1 = convertToYearMonthFormat(startDate);
    let endDate1 = convertToYearMonthFormat(endDate);
    let d1 = startDateTwo;
    let d2 = endDateTwo;
    let startDate2 = convertToYearMonthFormat(d1);
    let endDate2 = convertToYearMonthFormat(d2);
    let headerRow1 = worksheet.addRow(["", "", startDate1 + "-" + endDate1, startDate2 + "-" + endDate2, "Growth", startDate1 + "-" + endDate1, startDate2 + "-" + endDate2, "Growth", startDate1 + "-" + endDate1, startDate2 + "-" + endDate2, "Growth"]);
    worksheet.mergeCells('A6:A7');
    worksheet.mergeCells('B6:B7');
    let colLength = [];
    headerRow.eachCell((cell) => {
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle'
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "005d91" },
        bgColor: { argb: "" },
      };
      cell.font = {
        bold: true,
        color: { argb: "FFFFFF" },
        size: 12,
      };
      colLength.push(cell.value ? cell.value.toString().length : 10);
    });

    headerRow1.eachCell((cell) => {
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle'
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "005d91" },
        bgColor: { argb: "" },
      };
      cell.font = {
        bold: true,
        color: { argb: "FFFFFF" },
        size: 12,
      };
      colLength.push(cell.value ? cell.value.toString().length : 10);
    });

    worksheet.columns.forEach(function (column, i) {
      if (colLength[i] < 10) {
        colLength[i] = 10;
      }
      column.width = colLength[i] * 2;
    });

    let rowCount = 0
    let cellCount = 8;
    worksheet.mergeCells("A5", "K5")
    let companyCell = worksheet.getCell("A5");
    companyCell.value = company_name;
    companyCell.alignment = {
      horizontal: 'center'
    };
    companyCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "ADD8E6" },
      bgColor: { argb: "" },
    };
    companyCell.font = {
      bold: true,
      size: 12,
    };
    for (let s = 0; s < analyticsData.tradeCountryData.length; s++) {
      let ctry = analyticsData.tradeCountryData[s];


      let startCell = "A" + cellCount;
      let endCell = "K" + cellCount;

      let countryCell = worksheet.getCell(startCell);
      countryCell.value = ctry.countryName;

      worksheet.mergeCells(startCell, endCell);
      countryCell.font = {
        bold: true,
        size: 12
      };
      cellCount++;
      let insidedata = ctry.hs_code_data
      for (let data of insidedata) {
        let hsCodeCell = worksheet.getCell("A" + cellCount);
        let hsDescriptionCell = worksheet.getCell("B" + cellCount);
        let priceCurrentYearData = worksheet.getCell("C" + cellCount);
        let priceLastYearData = worksheet.getCell("D" + cellCount);
        let priceCell = worksheet.getCell("E" + cellCount);
        let quantityCurrentYearData = worksheet.getCell("F" + cellCount);
        let quantityLastYearData = worksheet.getCell("G" + cellCount);
        let quantityCell = worksheet.getCell("H" + cellCount);
        let shipmentCurrentYearData = worksheet.getCell("I" + cellCount);
        let shipmentLastYearData = worksheet.getCell("J" + cellCount);
        let shipmentCell = worksheet.getCell("K" + cellCount);

        hsCodeCell.value = data.name;
        hsDescriptionCell.value = data.hS_code_description ?? "";
        let price1 = 0, price2 = 0, shipment1 = 0, shipment2 = 0, quantity1 = 0, quantity2 = 0;
        if (data.date2 != undefined) {
          priceLastYearData.value = data.date2.price ? convertToInternationalCurrencySystem(data.date2.price) : 0;
          price2 = data.date2.price;
          quantityLastYearData.value = data.date2.quantity ? convertToInternationalCurrencySystem(data.date2.quantity) : 0;
          quantity2 = data.date2.quantity;
          shipmentLastYearData.value = data.date2.shipments;
          shipment2 = data.date2.shipments;

        } else {
          priceLastYearData.value = 0;
          price2 = 0;
          quantityLastYearData.value = 0;
          quantity2 = 0;
          shipmentLastYearData.value = 0;
          shipment2 = 0;
        }
        priceCurrentYearData.value = data.date1.price ? convertToInternationalCurrencySystem(data.date1.price) : 0;
        price1 = data.date1.price;
        quantityCurrentYearData.value = data.date1.quantity ? convertToInternationalCurrencySystem(data.date1.quantity) : 0;
        quantity1 = data.date1.quantity;
        shipmentCurrentYearData.value = data.date1.shipments;
        shipment1 = data.date1.shipments;

        let shipmentCellValue = (shipment1 - shipment2) / (shipment1 + shipment2);
        shipmentCell.value = convertToInternationalCurrencySystem((shipmentCellValue * 100).toFixed(2)) + "%";
        shipmentCurrentYearData.alignment = { vertical: "middle", horizontal: "right" }
        shipmentLastYearData.alignment = { vertical: "middle", horizontal: "right" }
        shipmentCell.alignment = { vertical: "middle", horizontal: "right" }
        let shipmentColor = shipmentCellValue > 0 ? "008000" : "FF0000";
        shipmentCell.font = { color: { argb: shipmentColor }, bold: true }

        let priceCellValue = (price1 - price2) / (price1 + price2);
        priceCell.value = convertToInternationalCurrencySystem((priceCellValue * 100).toFixed(2)) + "%";
        priceCell.alignment = { vertical: "middle", horizontal: "right" }
        priceCurrentYearData.alignment = { vertical: "middle", horizontal: "right" }
        priceLastYearData.alignment = { vertical: "middle", horizontal: "right" }
        let priceColor = priceCellValue > 0 ? "008000" : "FF0000";
        priceCell.font = { color: { argb: priceColor }, bold: true }

        let quantityCellValue = (quantity1 - quantity2) / (quantity1 + quantity2);
        quantityCell.value = convertToInternationalCurrencySystem((quantityCellValue * 100).toFixed(2)) + "%";
        quantityCell.alignment = { vertical: "middle", horizontal: "right" }
        quantityCurrentYearData.alignment = { vertical: "middle", horizontal: "right" }
        quantityLastYearData.alignment = { vertical: "middle", horizontal: "right" }
        let quantityColor = quantityCellValue > 0 ? "008000" : "FF0000";
        quantityCell.font = { color: { argb: quantityColor }, bold: true }
        cellCount++
      }

    }
    // workbook.xlsx.writeFile("C:\\Users\\kunal\\OneDrive\\Desktop\\datasss.xlsx");
    workbook.xlsx.write(res, function () {
      res.end();
    });

  } catch (err) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

/* End Country vs Country market analysis */


/* Start Country vs Trade market analysis */

// Controller functions to analyse country vs importer/exporter market data
async function fetchTradeWiseMarketAnalyticsData(req, res) {
  try {
    let payload = req.body;
    let resultsSet = await getTradeWiseMarketAnalyticsDataADX(payload);
    res.status(200).json(resultsSet);
    // Parameters to be passed
    // let finaltradeWiseMarketAnalyticsData = await getTradeWiseMarketAnalyticsData(req);
    // res.send(finaltradeWiseMarketAnalyticsData);

  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

async function getTradeWiseMarketAnalyticsData(req) {
  try {

    let payload = req.body;
    const startDate = payload.dateRange.startDate ?? null;
    const endDate = payload.dateRange.endDate ?? null;
    const startDateTwo = payload.dateRange.startDateTwo ?? null;
    const endDateTwo = payload.dateRange.endDateTwo ?? null;

    let tradeWiseMarketAnalyticsDataForDateRange1 = await marketAnalyticsModel.tradeWiseMarketAnalytics(payload, startDate, endDate, isCurrentDate = true);

    payload.dateRange1Data = tradeWiseMarketAnalyticsDataForDateRange1;
    if (payload.dateRange1Data == "please select appropriate range") {
      return payload.dateRange1Data;
    } else {
      let finaltradeWiseMarketAnalyticsData = await marketAnalyticsModel.tradeWiseMarketAnalytics(payload, startDateTwo, endDateTwo, isCurrentDate = false);
      return finaltradeWiseMarketAnalyticsData;
    }
  } catch (error) {
    throw error;
  }
}

async function fetchTradeWiseMarketAnalyticsFilters(req, res) {
  try {

    let payload = req.body;

    const filters = await getTradeWiseMarketAnalyticsFiltersADX(payload);
    filters.FILTER_HS_CODE = sortBasedOnHsCodeId(filters.FILTER_HS_CODE);
    const _filter = {
      filter: filters
    }
    res.status(200).json(_filter);
    // res.send(hs_codes);
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

function segregateAggregationData(groupedElement, bucket) {

  if (bucket.hasOwnProperty("SHIPMENTS")) {
    groupedElement.shipments = bucket['SHIPMENTS'].value;
  }
  if (bucket.hasOwnProperty("QUANTITY")) {
    groupedElement.quantity = bucket['QUANTITY'].value;
  }
  if (bucket.hasOwnProperty("PRICE")) {
    groupedElement.price = bucket['PRICE'].value;
  }
  // if (bucket.hasOwnProperty("COMPANIES")) {
  //   groupedElement.companies = bucket['COMPANIES'].value;
  // }

}

async function downloadTradeWiseMarketAnalyticsData(req, res) {

  const payload = req.body;
  let tradeType = payload.tradeType.trim().toUpperCase();
  const originCountry = payload.originCountry.trim().toUpperCase();

  const startDate = payload.dateRange.startDate ?? null;
  const endDate = payload.dateRange.endDate ?? null;
  const startDateTwo = payload.dateRange.startDateTwo ?? null;
  const endDateTwo = payload.dateRange.endDateTwo ?? null;


  let tradeMeta = TradeSchema.deriveDataBucket(tradeType, originCountry);

  let searchingColumns = {}
  if (originCountry == "INDIA") {
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
        foreignportColumn: "PORT_OF_SHIPMENT"
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
  }
  try {
    let analyticsDataset = await getTradeWiseMarketAnalyticsDataADX(payload, searchingColumns)
    let workbook = new ExcelJS.Workbook();
    let worksheet = workbook.addWorksheet("Trade analytics Data");

    let getCellCountryText = worksheet.getCell("B2");

    worksheet.getCell("A5").value = "";

    getCellCountryText.value = "DATA";
    getCellCountryText.font = {
      name: "Calibri",
      size: 22,
      underline: "single",
      bold: true,
      color: { argb: "005d91" },
      height: "auto",
    }

    worksheet.mergeCells("B2", "D3");
    getCellCountryText.alignment = { vertical: "middle", horizontal: "center" }

    //Add Image
    let myLogoImage = workbook.addImage({
      filename: "./public/images/logo-new.jpg",
      extension: "jpeg",
    });

    worksheet.addImage(myLogoImage, "A1:A4");
    worksheet.add;

    let headerRow = worksheet.addRow(["Company Name", "Compared Date", "Shipments", "Price", "Quantity"]);
    let colLength = [];
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "005d91" },
        bgColor: { argb: "" },
      };
      cell.font = {
        bold: true,
        color: { argb: "FFFFFF" },
        size: 12,
      };
      colLength.push(cell.value ? cell.value.toString().length : 10);
    });

    worksheet.columns.forEach(function (column, i) {
      if (colLength[i] < 10) {
        colLength[i] = 10;
      }
      column.width = colLength[i] * 2;
    });

    let rowCount = 0;
    let cellCount = 7;
    let analyticsDatasetLength = analyticsDataset.trade_data.length;
    while (rowCount < analyticsDatasetLength) {
      let analyticsData = analyticsDataset.trade_data[rowCount];

      let startCell = "A" + cellCount;
      let endCell = "A" + (cellCount + 2);

      let companyCell = worksheet.getCell(startCell);
      companyCell.value = analyticsData.company_name;
      worksheet.mergeCells(startCell, endCell);
      companyCell.alignment = { vertical: "middle", horizontal: "left" }

      let data = [analyticsData.date1, analyticsData.date2];
      for (let i = 0; i < data.length + 1; i++) {
        let dateCell = worksheet.getCell("B" + cellCount);
        let shipmentCell = worksheet.getCell("C" + cellCount);
        let priceCell = worksheet.getCell("D" + cellCount);
        let quantityCell = worksheet.getCell("E" + cellCount);
        if (i < data.length) {
          if (i == 0) {
            dateCell.value = startDate + "-" + endDate;
          } else {
            dateCell.value = startDateTwo + "-" + endDateTwo;
          }
          dateCell.alignment = { vertical: "middle", horizontal: "center" }

          shipmentCell.value = data[i]?.shipments ? convertToInternationalCurrencySystem(data[i].shipments.toFixed(2)) : 0;
          shipmentCell.alignment = { vertical: "middle", horizontal: "right" }

          priceCell.value = data[i]?.price ? convertToInternationalCurrencySystem(data[i].price.toFixed(2)) : 0;
          priceCell.alignment = { vertical: "middle", horizontal: "right" }

          quantityCell.value = data[i]?.quantity ? convertToInternationalCurrencySystem(data[i].quantity.toFixed(2)) : 0;
          quantityCell.alignment = { vertical: "middle", horizontal: "right" }
        }
        else {
          dateCell.value = "Growth(%)";
          dateCell.alignment = { vertical: "middle", horizontal: "center" }
          dateCell.font = { bold: true }

          let shipmentCurrentYearData = data[0]?.shipments ? data[0].shipments : 0;
          let shipmentLastYearData = data[1]?.shipments ? data[1].shipments : 0;
          let shipmentCellValue = (shipmentCurrentYearData - shipmentLastYearData) / (shipmentCurrentYearData + shipmentLastYearData);
          shipmentCell.value = parseFloat(shipmentCellValue * 100).toFixed(2) + "%";
          shipmentCell.alignment = { vertical: "middle", horizontal: "right" }
          let shipmentColor = shipmentCellValue > 0 ? "008000" : "FF0000";
          shipmentCell.font = { color: { argb: shipmentColor }, bold: true }

          let priceCurrentYearData = data[0]?.price ? data[0].price : 0;
          let priceLastYearData = data[1]?.price ? data[1].price : 0;
          let priceCellValue = (priceCurrentYearData - priceLastYearData) / (priceCurrentYearData + priceLastYearData);
          priceCell.value = parseFloat(priceCellValue * 100).toFixed(2) + "%";
          priceCell.alignment = { vertical: "middle", horizontal: "right" }
          let priceColor = priceCellValue > 0 ? "008000" : "FF0000";
          priceCell.font = { color: { argb: priceColor }, bold: true }

          let quantityCurrentYearData = data[0]?.quantity ? data[0].quantity : 0;
          let quantityLastYearData = data[1]?.quantity ? data[1].quantity : 0;
          let quantityCellValue = (quantityCurrentYearData - quantityLastYearData) / (quantityCurrentYearData + quantityLastYearData);
          quantityCell.value = parseFloat(quantityCellValue * 100).toFixed(2) + "%";
          quantityCell.alignment = { vertical: "middle", horizontal: "right" }
          let quantityColor = quantityCellValue > 0 ? "008000" : "FF0000";
          quantityCell.font = { color: { argb: quantityColor }, bold: true }
        }
        cellCount++;
      }
      rowCount++;
    }
    workbook.xlsx.write(res, function () {
      res.end();
    })
    // workbook.xlsx.writeFile("C:\\Users\\kaush\\Downloads\\datacompany.xlsx");

  } catch (error) {
    JSON.stringify(error);
  }
}

/* End Country vs Trade market analysis */


/* Start Country vs Product market analysis */

// Controller functions to analyse country vs product market data
async function fetchProductWiseMarketAnalyticsData(req, res) {
  const payload = req.body;
  try {
    // const ProductWiseMarketAnalyticsData = await getProductWiseMarketAnalyticsData(req);
    // const ProductWiseMarketAnalyticsData = await getProductWiseMarketAnalyticsData(req)
    const ProductWiseMarketAnalyticsData = await getProductWiseAnalyticsDataADX(payload);
    const productwiseanalyticsdata = await mapgetProductWiseMarketAnalyticsData(ProductWiseMarketAnalyticsData)
    res.send(productwiseanalyticsdata);
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

// Controller functions to analyse country vs product market data (TEST)
async function getProductWiseMarketAnalyticsData(req) {
  try {
    let payload = req.body;
    const startDate = payload.dateRange.startDate ?? null;
    const endDate = payload.dateRange.endDate ?? null;
    const startDateTwo = payload.dateRange.startDateTwo ?? null;
    const endDateTwo = payload.dateRange.endDateTwo ?? null;

    let ProductWiseMarketAnalyticsDataForDateRange1 = await marketAnalyticsModel.ProductWiseMarketAnalytics(payload, startDate, endDate, isCurrentDate = true);
    payload.dateRange1Data = ProductWiseMarketAnalyticsDataForDateRange1;
    if (payload.dateRange1Data != "please select appropriate range") {
      let finalProductWiseMarketAnalyticsData = await marketAnalyticsModel.ProductWiseMarketAnalytics(payload, startDateTwo, endDateTwo, isCurrentDate = false);
      return finalProductWiseMarketAnalyticsData;
    }
    return ProductWiseMarketAnalyticsDataForDateRange1
  }


  catch (error) {
    JSON.stringify(error);
  }
}

async function fetchProductWiseMarketAnalyticsFilters(req, res) {
  try {
    // let payload = req.body;
    // const ProductWiseMarketAnalyticsFilters = await marketAnalyticsModel.fetchProductMarketAnalyticsFilters(payload);
    // if (ProductWiseMarketAnalyticsFilters == "please select appropriate range") {
    //   res.send(ProductWiseMarketAnalyticsFilters);
    // } else {
    //   let resultFilter = [];
    //   let filter = {};
    //   for (let prop in ProductWiseMarketAnalyticsFilters.body.aggregations) {
    //     if (ProductWiseMarketAnalyticsFilters.body.aggregations.hasOwnProperty(prop)) {
    //       let hs_Code = [];
    //       if (ProductWiseMarketAnalyticsFilters.body.aggregations[prop].buckets) {
    //         for (let bucket of ProductWiseMarketAnalyticsFilters.body.aggregations.FILTER_HS_CODE.buckets) {
    //           if (bucket.doc_count != null && bucket.doc_count != undefined) {
    //             let hsCode = {};
    //             hsCode._id = bucket.key

    //             segregateAggregationData(hsCode, bucket)
    //             hs_Code.push(hsCode);
    //           }
    //         }
    //       }
    //       filter[prop] = hs_Code;
    //     }
    //   }

    //   filter.FILTER_HS_CODE = sortBasedOnHsCodeId(filter.FILTER_HS_CODE);
    // const _filter = {
    //   filter: filter
    // }
    const _filter = {

    }
    // resultFilter.push(filter);
    res.send(_filter);
    // }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

function getExcelSheet(startDate, endDate, startDateTwo, endDateTwo, analyticsDataset, bindByPort, bindByCountry) {
  try {
    let workbook = new ExcelJS.Workbook();
    let worksheet = workbook.addWorksheet("Product analytics Data");

    let getCellCountryText = worksheet.getCell("B2");

    worksheet.getCell("A5").value = "";

    getCellCountryText.value = "DATA";
    getCellCountryText.font = {
      name: "Calibri",
      size: 22,
      underline: "single",
      bold: true,
      color: { argb: "005d91" },
      height: "auto",
    }

    worksheet.mergeCells("B2", "D3");
    getCellCountryText.alignment = { vertical: "middle", horizontal: "center" }

    //Add Image
    let myLogoImage = workbook.addImage({
      filename: "./public/images/logo-new.jpg",
      extension: "jpeg",
    });

    worksheet.addImage(myLogoImage, "A1:A4");
    worksheet.add;
    let hrow = "";
    if (bindByPort) {
      hrow = "Port"
    } else {
      hrow = "Country"
    }
    let headerRow = worksheet.addRow([hrow, "", "Compared Date", "Shipments", "Price", "Quantity"]);
    let colLength = [];
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "005d91" },
        bgColor: { argb: "" },
      };
      cell.font = {
        bold: true,
        color: { argb: "FFFFFF" },
        size: 12,
      };
      colLength.push(cell.value ? cell.value.toString().length : 10);
    });

    worksheet.columns.forEach(function (column, i) {
      if (colLength[i] < 10) {
        colLength[i] = 10;
      }
      column.width = colLength[i] * 2;
    });

    let rowCount = 0
    let cellCount = 7;
    let analyticsDatasetLength = analyticsDataset.product_data.length;
    while (rowCount < analyticsDatasetLength) {
      let analyticsData = analyticsDataset.product_data[rowCount];
      let headerRowCode = worksheet.addRow(["HS Code", "Description", "", "", "", ""]);
      let colLengthCode = [];
      headerRowCode.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "7393B3" },
          bgColor: { argb: "" },
        };
        cell.font = {
          bold: true,
          color: { argb: "FFFFFF" },
          size: 12,
        };
        colLengthCode.push(cell.value ? cell.value.toString().length : 10);
      });
      worksheet.columns.forEach(function (column, i) {
        if (colLength[i] < 10) {
          colLength[i] = 10;
        }
        column.width = colLengthCode[i] * 2;
      });

      cellCount++;
      let CodeCellStart = "A" + cellCount;
      let CodeCellDesc = "B" + cellCount;

      let codeCell = worksheet.getCell(CodeCellStart);
      codeCell.value = analyticsData.hs_code;
      worksheet.mergeCells(CodeCellStart, "A" + (cellCount + 2));
      codeCell.alignment = { vertical: "middle", horizontal: "left" }

      let codeCell2 = worksheet.getCell(CodeCellDesc);
      codeCell2.value = analyticsData.hs_Code_Description;
      worksheet.mergeCells(CodeCellDesc, "B" + (cellCount + 2));
      codeCell2.alignment = { vertical: "middle", horizontal: "left" }

      // let borderCell  = "F"+(cellCount+2);
      // borderCell.border = {
      //   // top: { style: 'medium' },
      //   // left: { style: 'medium' },
      //   bottom: { style: 'Thick' }
      //   // right: { style: 'medium' },
      // }

      let data = [analyticsData.hs_code_data.date1, analyticsData.hs_code_data.date2];
      for (let i = 0; i < data.length + 1; i++) {
        let dateCell = worksheet.getCell("C" + cellCount);
        let shipmentCell = worksheet.getCell("D" + cellCount);
        let priceCell = worksheet.getCell("E" + cellCount);
        let quantityCell = worksheet.getCell("F" + cellCount);
        if (i < data.length) {
          if (i == 0) {
            dateCell.value = startDate + "-" + endDate;
          } else {
            dateCell.value = startDateTwo + "-" + endDateTwo;
          }
          dateCell.alignment = { vertical: "middle", horizontal: "center" }

          shipmentCell.value = data[i]?.shipments ? convertToInternationalCurrencySystem(data[i].shipments.toFixed(2)) : 0;
          shipmentCell.alignment = { vertical: "middle", horizontal: "right" }

          priceCell.value = data[i]?.price ? convertToInternationalCurrencySystem(data[i].price.toFixed(2)) : 0;
          priceCell.alignment = { vertical: "middle", horizontal: "right" }

          quantityCell.value = data[i]?.quantity ? convertToInternationalCurrencySystem(data[i].quantity.toFixed(2)) : 0;
          quantityCell.alignment = { vertical: "middle", horizontal: "right" }
        }
        else {
          dateCell.value = "Growth(%)";
          dateCell.alignment = { vertical: "middle", horizontal: "center" }
          dateCell.font = { bold: true }

          let shipmentCurrentYearData = data[0]?.shipments ? data[0].shipments : 0;
          let shipmentLastYearData = data[1]?.shipments ? data[1].shipments : 0;
          let shipmentCellValue = (shipmentCurrentYearData - shipmentLastYearData) / (shipmentCurrentYearData + shipmentLastYearData);
          shipmentCell.value = parseFloat(shipmentCellValue * 100).toFixed(2) + "%";
          shipmentCell.alignment = { vertical: "middle", horizontal: "right" }
          let shipmentColor = shipmentCellValue > 0 ? "008000" : "FF0000";
          shipmentCell.font = { color: { argb: shipmentColor }, bold: true }

          let priceCurrentYearData = data[0]?.price ? data[0].price : 0;
          let priceLastYearData = data[1]?.price ? data[1].price : 0;
          let priceCellValue = (priceCurrentYearData - priceLastYearData) / (priceCurrentYearData + priceLastYearData);
          priceCell.value = parseFloat(priceCellValue * 100).toFixed(2) + "%";
          priceCell.alignment = { vertical: "middle", horizontal: "right" }
          let priceColor = priceCellValue > 0 ? "008000" : "FF0000";
          priceCell.font = { color: { argb: priceColor }, bold: true }

          let quantityCurrentYearData = data[0]?.quantity ? data[0].quantity : 0;
          let quantityLastYearData = data[1]?.quantity ? data[1].quantity : 0;
          let quantityCellValue = (quantityCurrentYearData - quantityLastYearData) / (quantityCurrentYearData + quantityLastYearData);
          quantityCell.value = parseFloat(quantityCellValue * 100).toFixed(2) + "%";
          quantityCell.alignment = { vertical: "middle", horizontal: "right" }
          let quantityColor = quantityCellValue > 0 ? "008000" : "FF0000";
          quantityCell.font = { color: { argb: quantityColor }, bold: true }
        }
        cellCount++;
      }

      let dataLength;
      if (bindByPort) {
        dataLength = analyticsData.port_data.length
      }
      else {
        dataLength = analyticsData.country_data.length
      }

      for (let p = 0; p < dataLength; p++) {
        let startCell = "A" + cellCount;
        let endCell = "A" + (cellCount + 2);
        let companyCell = worksheet.getCell(startCell);
        if (bindByPort) {
          companyCell.value = analyticsData.port_data[p].port;
        }
        else {
          companyCell.value = analyticsData.country_data[p].country;
        }

        worksheet.mergeCells(startCell, endCell);
        companyCell.alignment = { vertical: "middle", horizontal: "left" }
        let data;
        if (bindByPort) {
          data = [analyticsData.port_data[p].date1, analyticsData.port_data[p].date2];
        } else {
          data = [analyticsData.country_data[p].date1, analyticsData.country_data[p].date2];
        }
        for (let i = 0; i < data.length + 1; i++) {
          let dateCell = worksheet.getCell("C" + cellCount);
          let shipmentCell = worksheet.getCell("D" + cellCount);
          let priceCell = worksheet.getCell("E" + cellCount);
          let quantityCell = worksheet.getCell("F" + cellCount);
          if (i < data.length) {
            if (i == 0) {
              dateCell.value = startDate + "-" + endDate;
            } else {
              dateCell.value = startDateTwo + "-" + endDateTwo;
            }
            dateCell.alignment = { vertical: "middle", horizontal: "center" }

            shipmentCell.value = data[i]?.shipments ? convertToInternationalCurrencySystem(data[i].shipments.toFixed(2)) : 0;
            shipmentCell.alignment = { vertical: "middle", horizontal: "right" }

            priceCell.value = data[i]?.price ? convertToInternationalCurrencySystem(data[i].price.toFixed(2)) : 0;
            priceCell.alignment = { vertical: "middle", horizontal: "right" }

            quantityCell.value = data[i]?.quantity ? convertToInternationalCurrencySystem(data[i].quantity.toFixed(2)) : 0;
            quantityCell.alignment = { vertical: "middle", horizontal: "right" }
          }
          else {
            dateCell.value = "Growth(%)";
            dateCell.alignment = { vertical: "middle", horizontal: "center" }
            dateCell.font = { bold: true }

            let shipmentCurrentYearData = data[0]?.shipments ? data[0].shipments : 0;
            let shipmentLastYearData = data[1]?.shipments ? data[1].shipments : 0;
            let shipmentCellValue = (shipmentCurrentYearData - shipmentLastYearData) / (shipmentCurrentYearData + shipmentLastYearData);
            shipmentCell.value = parseFloat(shipmentCellValue * 100).toFixed(2) + "%";
            shipmentCell.alignment = { vertical: "middle", horizontal: "right" }
            let shipmentColor = shipmentCellValue > 0 ? "008000" : "FF0000";
            shipmentCell.font = { color: { argb: shipmentColor }, bold: true }

            let priceCurrentYearData = data[0]?.price ? data[0].price : 0;
            let priceLastYearData = data[1]?.price ? data[1].price : 0;
            let priceCellValue = (priceCurrentYearData - priceLastYearData) / (priceCurrentYearData + priceLastYearData);
            priceCell.value = parseFloat(priceCellValue * 100).toFixed(2) + "%";
            priceCell.alignment = { vertical: "middle", horizontal: "right" }
            let priceColor = priceCellValue > 0 ? "008000" : "FF0000";
            priceCell.font = { color: { argb: priceColor }, bold: true }

            let quantityCurrentYearData = data[0]?.quantity ? data[0].quantity : 0;
            let quantityLastYearData = data[1]?.quantity ? data[1].quantity : 0;
            let quantityCellValue = (quantityCurrentYearData - quantityLastYearData) / (quantityCurrentYearData + quantityLastYearData);
            quantityCell.value = parseFloat(quantityCellValue * 100).toFixed(2) + "%";
            quantityCell.alignment = { vertical: "middle", horizontal: "right" }
            let quantityColor = quantityCellValue > 0 ? "008000" : "FF0000";
            quantityCell.font = { color: { argb: quantityColor }, bold: true }
          }
          cellCount++;
        }
      }
      rowCount++;
    }
    return workbook.xlsx;
  }
  catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

async function downloadProductWiseMarketAnalyticsData(req, res) {
  try {
    let payload = req.body;
    const startDate = payload.dateRange.startDate ?? null;
    const endDate = payload.dateRange.endDate ?? null;
    const startDateTwo = payload.dateRange.startDateTwo ?? null;
    const endDateTwo = payload.dateRange.endDateTwo ?? null;
    const ProductWiseMarketAnalyticsData = await getProductWiseAnalyticsDataADX(payload);
    let analyticsDataset= await mapgetProductWiseMarketAnalyticsData(ProductWiseMarketAnalyticsData);

    if (payload.bindByPort || payload.bindByCountry) {
      getExcelSheet(startDate, endDate, startDateTwo, endDateTwo, analyticsDataset, payload.bindByPort, payload.bindByCountry).write(res, function () {
        res.end();
      })
      // workbook.xlsx.writeFile("C:\\Users\\Kunal\\OneDrive\\Desktop\\data2.xlsx");
    }
    else {

      let workbook = new ExcelJS.Workbook();
      let worksheet = workbook.addWorksheet("Product analytics Data");

      let getCellCountryText = worksheet.getCell("B2");

      worksheet.getCell("A5").value = "";

      getCellCountryText.value = "DATA";
      getCellCountryText.font = {
        name: "Calibri",
        size: 22,
        underline: "single",
        bold: true,
        color: { argb: "005d91" },
        height: "auto",
      }

      worksheet.mergeCells("B2", "D3");
      getCellCountryText.alignment = { vertical: "middle", horizontal: "center" }

      //Add Image
      let myLogoImage = workbook.addImage({
        filename: "./public/images/logo-new.jpg",
        extension: "jpeg",
      });

      worksheet.addImage(myLogoImage, "A1:A4");
      worksheet.add;

      let headerRow = worksheet.addRow(["HS Code", "HS Code Description", "Compared Date", "Shipments", "Price", "Quantity"]);
      let colLength = [];
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "005d91" },
          bgColor: { argb: "" },
        };
        cell.font = {
          bold: true,
          color: { argb: "FFFFFF" },
          size: 12,
        };
        colLength.push(cell.value ? cell.value.toString().length : 10);
      });

      worksheet.columns.forEach(function (column, i) {
        if (colLength[i] < 10) {
          colLength[i] = 10;
        }
        column.width = colLength[i] * 2;
      });

      let rowCount = 0
      let cellCount = 7;
      let analyticsDatasetLength = analyticsDataset.product_data.length;
      while (rowCount < analyticsDatasetLength) {
        let analyticsData = analyticsDataset.product_data[rowCount];
        let startCell = "A" + cellCount;
        let endCell = "A" + (cellCount + 2);
        let hsCodeCell = worksheet.getCell(startCell);

        hsCodeCell.value = analyticsData.hs_code;

        let startCell1 = "B" + cellCount;
        let endCell1 = "B" + (cellCount + 2);

        let descriptionCell = worksheet.getCell(startCell1);
        descriptionCell.value = analyticsData.hs_Code_Description;

        worksheet.mergeCells(startCell, endCell);
        hsCodeCell.alignment = { vertical: "middle", horizontal: "left" }

        worksheet.mergeCells(startCell1, endCell1);
        descriptionCell.alignment = { vertical: "middle", horizontal: "left" }

        let data = [analyticsData.hs_code_data.date1, analyticsData.hs_code_data.date2];

        for (let i = 0; i < data.length + 1; i++) {
          let dateCell = worksheet.getCell("C" + cellCount);
          let shipmentCell = worksheet.getCell("D" + cellCount);
          let priceCell = worksheet.getCell("E" + cellCount);
          let quantityCell = worksheet.getCell("F" + cellCount);
          if (i < data.length) {
            if (i == 0) {
              dateCell.value = startDate + "-" + endDate;
            } else {
              dateCell.value = startDateTwo + "-" + endDateTwo;
            }
            dateCell.alignment = { vertical: "middle", horizontal: "center" }

            shipmentCell.value = data[i]?.shipments ? convertToInternationalCurrencySystem(data[i].shipments.toFixed(2)) : 0;
            shipmentCell.alignment = { vertical: "middle", horizontal: "right" }

            priceCell.value = data[i]?.price ? convertToInternationalCurrencySystem(data[i].price.toFixed(2)) : 0;
            priceCell.alignment = { vertical: "middle", horizontal: "right" }

            quantityCell.value = data[i]?.quantity ? convertToInternationalCurrencySystem(data[i].quantity.toFixed(2)) : 0;
            quantityCell.alignment = { vertical: "middle", horizontal: "right" }
          }
          else {
            dateCell.value = "Growth(%)";
            dateCell.alignment = { vertical: "middle", horizontal: "center" }
            dateCell.font = { bold: true }

            let shipmentCurrentYearData = data[0]?.shipments ? data[0].shipments : 0;
            let shipmentLastYearData = data[1]?.shipments ? data[1].shipments : 0;
            let shipmentCellValue = (shipmentCurrentYearData - shipmentLastYearData) / (shipmentCurrentYearData + shipmentLastYearData);
            shipmentCell.value = parseFloat(shipmentCellValue * 100).toFixed(2) + "%";
            shipmentCell.alignment = { vertical: "middle", horizontal: "right" }
            let shipmentColor = shipmentCellValue > 0 ? "008000" : "FF0000";
            shipmentCell.font = { color: { argb: shipmentColor }, bold: true }

            let priceCurrentYearData = data[0]?.price ? data[0].price : 0;
            let priceLastYearData = data[1]?.price ? data[1].price : 0;
            let priceCellValue = (priceCurrentYearData - priceLastYearData) / (priceCurrentYearData + priceLastYearData);
            priceCell.value = parseFloat(priceCellValue * 100).toFixed(2) + "%";
            priceCell.alignment = { vertical: "middle", horizontal: "right" }
            let priceColor = priceCellValue > 0 ? "008000" : "FF0000";
            priceCell.font = { color: { argb: priceColor }, bold: true }

            let quantityCurrentYearData = data[0]?.quantity ? data[0].quantity : 0;
            let quantityLastYearData = data[1]?.quantity ? data[1].quantity : 0;
            let quantityCellValue = (quantityCurrentYearData - quantityLastYearData) / (quantityCurrentYearData + quantityLastYearData);
            quantityCell.value = parseFloat(quantityCellValue * 100).toFixed(2) + "%";
            quantityCell.alignment = { vertical: "middle", horizontal: "right" }
            let quantityColor = quantityCellValue > 0 ? "008000" : "FF0000";
            quantityCell.font = { color: { argb: quantityColor }, bold: true }
          }
          cellCount++;
        }
        rowCount++;
      }

      workbook.xlsx.write(res, function () {
        res.end();
      })
      // workbook.xlsx.writeFile("C:\\Users\\Kunal\\OneDrive\\Desktop\\data2.xlsx");
    }

  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

/* End Country vs Product market analysis */

// Export Statement
module.exports = {
  fetchContryWiseMarketAnalyticsData,
  fetchContryWiseMarketAnalyticsFilters,
  downloadContryWiseMarketAnalyticsData,
  fetchContryWiseCompanyAnalyticsData,
  downloadContryWiseCompanyAnalyticsData,
  fetchProductWiseMarketAnalyticsData,
  fetchProductWiseMarketAnalyticsFilters,
  downloadProductWiseMarketAnalyticsData,
  fetchTradeWiseMarketAnalyticsData,
  fetchTradeWiseMarketAnalyticsFilters,
  downloadTradeWiseMarketAnalyticsData,
  getProductWiseMarketAnalyticsData,
  getTradeWiseMarketAnalyticsData,
  fetchUniqueCountries,
  fetchContryWiseTradeAnalyticsData,
  downloadTradeWiseCompanyAnalyticsData
}
