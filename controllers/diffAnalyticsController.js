const TAG = "diffAnalyticsController";

const ExcelJS = require("exceljs");
const diffAnalyticsModel = require("../models/diffAnalyticsModel");

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
  const matchExpressions = payload.matchExpressions ? payload.matchExpressions : null;

  let tradeMeta = {
    tradeType: tradeType,
    countryCode: originCountry,
    indexNamePrefix: originCountry.toLocaleLowerCase() + "_" + tradeType.toLocaleLowerCase(),
    blCountry
  }
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
      const analyticsDataset = await getCompaniesAnalyticsData(destinationCountry, tradeMeta, startDate, endDate, searchingColumns, offset, limit, matchExpressions);
      res.status(200).json(analyticsDataset);
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


const fetchCountries = async (req, res) => {
  const payload = req.body;
  let tradeType = payload.tradeType.trim().toUpperCase();
  const originCountry = payload.originCountry.trim().toUpperCase();
  const company_name = payload.companyName.trim().toUpperCase();;
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
      shipmentColumn: "DECLARATION_NO",
      codeColumn4: "HS_CODE_4"
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
      codeColumn4: "HS_CODE_4"
    }
  }

  try {
    const tradeCountries = await diffAnalyticsModel.findTopCountry(company_name, tradeMeta, startDate, endDate, searchingColumns, offset, limit);

    data = {
      countries_data: []
    }

    data.contries_count = tradeCountries.COUNTRY_COUNT[0];
    for (let i = 0; i < tradeCountries.COUNTRIES.length; i++) {
      let country_name = tradeCountries.COUNTRIES[i]._id;
      const tradeCountriesdata1 = await diffAnalyticsModel.findAllDataForCountry(country_name, company_name, tradeMeta, startDate, endDate, searchingColumns, true);

      const tradeCountriesdata2 = await diffAnalyticsModel.findAllDataForCountry(country_name, company_name, tradeMeta, covertDateYear(startDate), covertDateYear(endDate), searchingColumns, true);
      bundle = {}
      bundle.date1 = tradeCountriesdata1.TOP_COUNTRIES
      bundle.date2 = tradeCountriesdata2.TOP_COUNTRIES

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
      data.countries_data.push({ country_name: bundle });

    }
    res.status(200).json(data);
  }
  catch (err) {
    console.log(err);
  }

}

const fetchFilters = async (req, res) => {
  const payload = req.body;
  let tradeType = payload.tradeType.trim().toUpperCase();
  const originCountry = payload.originCountry.trim().toUpperCase();
  const destinationCountry = payload.destinationCountry.trim().toUpperCase();
  const blCountry = payload.blCountry;
  const startDate = payload.dateRange.startDate ?? null;
  const endDate = payload.dateRange.endDate ?? null;
  const matchExpressions = payload.matchExpressions ? payload.matchExpressions : null;

  let tradeMeta = {
    tradeType: tradeType,
    countryCode: originCountry,
    indexNamePrefix: originCountry.toLocaleLowerCase() + "_" + tradeType.toLocaleLowerCase(),
    blCountry
  }
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
      const filters = await diffAnalyticsModel.findCompanyFilters(destinationCountry, tradeMeta, startDate, endDate, searchingColumns, false, matchExpressions);

      filter = [];
      filter.push(filters);
      res.status(200).json(filter);
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

async function getCompaniesAnalyticsData(destinationCountry, tradeMeta, startDate, endDate, searchingColumns, offset, limit, matchExpressions) {
  try {
    const tradeCompanies = await diffAnalyticsModel.findTopCompany(destinationCountry, tradeMeta, startDate, endDate, searchingColumns, offset, limit, matchExpressions);
    analyticsDataset = {
      companies_data: []
    };

    analyticsDataset.companies_count = tradeCompanies.COMPANIES_COUNT[0];
    for (let i = 0; i < tradeCompanies.COMPANIES.length; i++) {
      let company = [];
      let company_name = tradeCompanies.COMPANIES[i]._id;
      if (company_name == '') {
        continue;
      }
      company.push(company_name);
      const tradeCompanydata = await diffAnalyticsModel.findAllDataForCompany(company, destinationCountry, tradeMeta, startDate, endDate, searchingColumns, matchExpressions);
      const tradeCompanyLastYearData = await diffAnalyticsModel.findAllDataForCompany(company, destinationCountry, tradeMeta, covertDateYear(startDate), covertDateYear(endDate), searchingColumns, matchExpressions);

      bundle = {
        data: []
      };
      bundle.companyName = company_name;
      bundle.data.push(tradeCompanydata.COMPANIES[0]);
      bundle.data.push(tradeCompanyLastYearData.COMPANIES[0]);
      analyticsDataset.companies_data.push(bundle);
    }

    return analyticsDataset;
  } catch (error) {
    throw error;
  }
}
async function findTopCountryanalytics(company_name, tradeMeta, startDate, endDate, searchingColumns, offset, limit) {
  try {
    const tradeCountries = await diffAnalyticsModel.findTopCountry(company_name, tradeMeta, startDate, endDate, searchingColumns, offset, limit);

    data = {
      countries_data: []
    }

    data.contries_count = tradeCountries.COUNTRY_COUNT[0];
    for (let i = 0; i < tradeCountries.COUNTRIES.length; i++) {
      let country_name = tradeCountries.COUNTRIES[i]._id;
      const tradeCountriesdata1 = await diffAnalyticsModel.findAllDataForCountry(country_name, company_name, tradeMeta, startDate, endDate, searchingColumns, true);

      const tradeCountriesdata2 = await diffAnalyticsModel.findAllDataForCountry(country_name, company_name, tradeMeta, covertDateYear(startDate), covertDateYear(endDate), searchingColumns, true);
      bundle = {}
      bundle.date1 = tradeCountriesdata1.TOP_COUNTRIES
      bundle.date2 = tradeCountriesdata2.TOP_COUNTRIES

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
      data.countries_data.push({ [country_name]: bundle });

    }
    return data;
  } catch (err) {

  }
}
function covertDateYear(date) {
  array = date.split("-");
  array[0] = array[0] - 1;
  dateResult = array.join("-");
  return dateResult;
}

/** Controller function to download companies data */
async function downloadCompaniesData(req, res) {

  const payload = req.body;
  let tradeType = payload.tradeType.trim().toUpperCase();
  const originCountry = payload.originCountry.trim().toUpperCase();
  const destinationCountry = payload.destinationCountry.trim().toUpperCase();
  const blCountry = payload.blCountry;
  const startDate = payload.dateRange.startDate ?? null;
  const endDate = payload.dateRange.endDate ?? null;
  const offset = payload.start != null ? payload.start : 0;
  const limit = payload.length != null ? payload.length : 10;
  const matchExpressions = payload.matchExpressions ? payload.matchExpressions : null;

  let tradeMeta = {
    tradeType: tradeType,
    countryCode: originCountry,
    indexNamePrefix: originCountry.toLocaleLowerCase() + "_" + tradeType.toLocaleLowerCase(),
    blCountry
  }

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
      const analyticsDataset = await getCompaniesAnalyticsData(destinationCountry, tradeMeta, startDate, endDate, searchingColumns, offset, limit, matchExpressions);

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
            dateCell.value = startDate + "-" + endDate;
            dateCell.alignment = { vertical: "middle", horizontal: "center" }

            shipmentCell.value = data[i]?.shipments ? convertToInternationalCurrencySystem(data[i].shipments.toFixed(2)) : 0;
            shipmentCell.alignment = { vertical: "middle", horizontal: "right" }

            priceCell.value = data[i]?.price ? convertToInternationalCurrencySystem(data[i].price.toFixed(2)) : 0;
            priceCell.alignment = { vertical: "middle", horizontal: "right" }

            quantityCell.value = data[i]?.quantity ? convertToInternationalCurrencySystem(data[i].quantity.toFixed(2)) : 0;
            quantityCell.alignment = { vertical: "middle", horizontal: "right" }
          }
          else {
            dateCell.value = "Difference(%)";
            dateCell.alignment = { vertical: "middle", horizontal: "center" }
            dateCell.font = { bold: true }

            let shipmentCurrentYearData = data[0]?.shipments ? data[0].shipments : 0;
            let shipmentLastYearData = data[1]?.shipments ? data[1].shipments : 0;
            let shipmentCellValue = (shipmentCurrentYearData - shipmentLastYearData) / (shipmentCurrentYearData + shipmentLastYearData);
            shipmentCell.value = parseFloat(shipmentCellValue).toFixed(2) + "%";
            shipmentCell.alignment = { vertical: "middle", horizontal: "right" }
            let shipmentColor = shipmentCellValue > 0 ? "008000" : "FF0000";
            shipmentCell.font = { color: { argb: shipmentColor }, bold: true }

            let priceCurrentYearData = data[0]?.price ? data[0].price : 0;
            let priceLastYearData = data[1]?.price ? data[1].price : 0;
            let priceCellValue = (priceCurrentYearData - priceLastYearData) / (priceCurrentYearData + priceLastYearData);
            priceCell.value = parseFloat(priceCellValue).toFixed(2) + "%";
            priceCell.alignment = { vertical: "middle", horizontal: "right" }
            let priceColor = priceCellValue > 0 ? "008000" : "FF0000";
            priceCell.font = { color: { argb: priceColor }, bold: true }

            let quantityCurrentYearData = data[0]?.quantity ? data[0].quantity : 0;
            let quantityLastYearData = data[1]?.quantity ? data[1].quantity : 0;
            let quantityCellValue = (quantityCurrentYearData - quantityLastYearData) / (quantityCurrentYearData + quantityLastYearData);
            quantityCell.value = parseFloat(quantityCellValue).toFixed(2) + "%";
            quantityCell.alignment = { vertical: "middle", horizontal: "right" }
            let quantityColor = quantityCellValue > 0 ? "008000" : "FF0000";
            quantityCell.font = { color: { argb: quantityColor }, bold: true }
          }
          cellCount++;
        }
        rowCount++;
      }

      workbook.xlsx.writeFile("C:\\Users\\Kunal\\OneDrive\\Desktop\\data.xlsx");

      console.log("success");
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

/** Controller function to download countries data */
async function downloadCountriesData(req, res) {

  const payload = req.body;
  let tradeType = payload.tradeType.trim().toUpperCase();
  const originCountry = payload.originCountry.trim().toUpperCase();
  const company_name = payload.companyName.trim().toUpperCase();;
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
      shipmentColumn: "DECLARATION_NO",
      codeColumn4: "HS_CODE_4"
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
      codeColumn4: "HS_CODE_4"
    }
  }

  const tradeCountriesanalytics = await findTopCountryanalytics(company_name, tradeMeta, startDate, endDate, searchingColumns, offset, limit);

  try {
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

    let headerRow = worksheet.addRow(["HS code 4", "HS code description", "Shipments", "", "", "Price", "", "", "Quantity", "", ""]);
    worksheet.mergeCells('C6:E6');
    worksheet.mergeCells('F6:H6');
    worksheet.mergeCells('I6:K6');
    let startDate1 = convertToYearMonthFormat(startDate);
    let endDate1 = convertToYearMonthFormat(endDate);
    let d1 = covertDateYear(startDate);
    let d2 = covertDateYear(endDate);
    let startDate2 = convertToYearMonthFormat(d1);
    let endDate2 = convertToYearMonthFormat(d2);
    let headerRow1 = worksheet.addRow(["", "", startDate1 + "-" + endDate1, startDate2 + "-" + endDate2, "Difference", startDate1 + "-" + endDate1, startDate2 + "-" + endDate2, "Difference", startDate1 + "-" + endDate1, startDate2 + "-" + endDate2, "Difference"]);
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
    for (let s = 0; s < tradeCountriesanalytics.countries_data.length; s++) {
      let ctry = tradeCountriesanalytics.countries_data[s];
      for (let c in ctry) {
        if (Object.keys(ctry[c].hscodes).length == 0) { continue; }
        let startCell = "A" + cellCount;
        let endCell = "K" + cellCount;

        let countryCell = worksheet.getCell(startCell);
        countryCell.value = c;

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
          hsDescriptionCell.value = val.date1.hS_code_description
          priceCurrentYearData.value = val.date1.price
          priceLastYearData.value = val.date2.price
          quantityCurrentYearData.value = val.date1.quantity
          quantityLastYearData.value = val.date2.quantity
          shipmentCurrentYearData.value = val.date1.shipments
          shipmentLastYearData.value = val.date2.shipments

          let shipmentCellValue = (val.date1.shipments - val.date2.shipments) / (val.date1.shipments + val.date2.shipments);
          shipmentCell.value = parseFloat(shipmentCellValue).toFixed(2) + "%";
          shipmentCell.alignment = { vertical: "middle", horizontal: "right" }
          let shipmentColor = shipmentCellValue > 0 ? "008000" : "FF0000";
          shipmentCell.font = { color: { argb: shipmentColor }, bold: true }

          let priceCellValue = (val.date1.price - val.date2.price) / (val.date1.price + val.date2.price);
          priceCell.value = parseFloat(priceCellValue).toFixed(2) + "%";
          priceCell.alignment = { vertical: "middle", horizontal: "right" }
          let priceColor = priceCellValue > 0 ? "008000" : "FF0000";
          priceCell.font = { color: { argb: priceColor }, bold: true }

          let quantityCellValue = (val.date1.quantity - val.date2.quantity) / (val.date1.quantity + val.date2.quantity);
          quantityCell.value = parseFloat(quantityCellValue).toFixed(2) + "%";
          quantityCell.alignment = { vertical: "middle", horizontal: "right" }
          let quantityColor = quantityCellValue > 0 ? "008000" : "FF0000";
          quantityCell.font = { color: { argb: quantityColor }, bold: true }
          cellCount++
        }
      }
    }

    workbook.xlsx.writeFile("C:\\Users\\Kunal\\OneDrive\\Desktop\\data.xlsx");
    res.send("done");
  } catch (err) {
    JSON.stringify(err);
  }
}

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
};

module.exports = {
  fetchCompanies,
  fetchCountries,
  fetchFilters,
  downloadCompaniesData,
  downloadCountriesData
}
