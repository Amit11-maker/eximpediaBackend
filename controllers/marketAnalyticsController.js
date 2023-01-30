const TAG = "marketAnalyticsController";

const ExcelJS = require("exceljs");
const marketAnalyticsModel = require("../models/marketAnalyticsModel");


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

function covertDateYear(date) {
  array = date.split("-");
  array[0] = array[0] - 1;
  dateResult = array.join("-");
  return dateResult;
}

// Controller functions to analyse market data of companies as per two countries
async function fetchContryWiseMarketAnalyticsData(req, res) {
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
      const analyticsDataset = await getCountryWiseMarketAnalyticsData(destinationCountry, tradeMeta, startDate, endDate, searchingColumns, offset, limit, matchExpressions);
      res.status(200).json(analyticsDataset);
    }
    catch (err) {
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

const fetchContryWiseMarketAnalyticsFilters = async (req, res) => {

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
      const filters = await marketAnalyticsModel.findCompanyFilters(destinationCountry, tradeMeta, startDate, endDate, searchingColumns, false, matchExpressions);

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

async function downloadContryWiseMarketAnalyticsData(req, res) {

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
      const analyticsDataset = await getCountryWiseMarketAnalyticsData(destinationCountry, tradeMeta, startDate, endDate, searchingColumns, offset, limit, matchExpressions);

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

async function getCountryWiseMarketAnalyticsData(destinationCountry, tradeMeta, startDate, endDate, searchingColumns, offset, limit, matchExpressions) {
  try {
    const tradeCompanies = await marketAnalyticsModel.findTopCompany(destinationCountry, tradeMeta, startDate, endDate, searchingColumns, offset, limit, matchExpressions);
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
      const tradeCompanydata = await marketAnalyticsModel.findAllDataForCompany(company, destinationCountry, tradeMeta, startDate, endDate, searchingColumns, matchExpressions);
      const tradeCompanyLastYearData = await marketAnalyticsModel.findAllDataForCompany(company, destinationCountry, tradeMeta, covertDateYear(startDate), covertDateYear(endDate), searchingColumns, matchExpressions);

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


// Controller functions to analyse country vs country market data as per the company
async function fetchContryWiseCompanyAnalyticsData(req, res) {
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
    const analyticsData = await getContryWiseCompanyAnalyticsData(company_name, tradeMeta, startDate, endDate, searchingColumns, offset, limit);
    res.status(200).json(analyticsData);
  }
  catch (err) {
    res.status(500).json({
      message: "Internal Server Error",
    });
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

    const analyticsData = await getContryWiseCompanyAnalyticsData(company_name, tradeMeta, startDate, endDate, searchingColumns, offset, limit);
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
    let d1 = covertDateYear(startDate);
    let d2 = covertDateYear(endDate);
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

async function getContryWiseCompanyAnalyticsData(company_name, tradeMeta, startDate, endDate, searchingColumns, offset, limit) {
  try {
    const tradeCountries = await marketAnalyticsModel.findTopCountry(company_name, tradeMeta, startDate, endDate, searchingColumns, offset, limit);

    data = {
      countries_data: []
    }

    data.contries_count = tradeCountries.COUNTRY_COUNT[0];
    for (let i = 0; i < tradeCountries.COUNTRIES.length; i++) {
      let country_name = tradeCountries.COUNTRIES[i]._id;
      const tradeCountriesdata1 = await marketAnalyticsModel.findAllDataForCountry(country_name, company_name, tradeMeta, startDate, endDate, searchingColumns, true);

      const tradeCountriesdata2 = await marketAnalyticsModel.findAllDataForCountry(country_name, company_name, tradeMeta, covertDateYear(startDate), covertDateYear(endDate), searchingColumns, true);
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
    return data;
  } catch (err) {
    throw error;
  }
}


// Controller functions to analyse country vs product market data 
async function fetchProductWiseMarketAnalyticsData(req, res) {
  try {
    const ProductWiseMarketAnalyticsData = await getProductWiseMarketAnalyticsData(req);
    res.send(ProductWiseMarketAnalyticsData);
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
    let ProductWiseMarketAnalyticsData = await marketAnalyticsModel.ProductWiseMarketAnalytics(payload, startDate, endDate);
    let ProductWiseMarketAnalyticsDataLastYear = await marketAnalyticsModel.ProductWiseMarketAnalytics(payload, covertDateYear(startDate), covertDateYear(endDate));

    let hs_codes = []
    for (let prop in ProductWiseMarketAnalyticsData.body.aggregations) {
      if (ProductWiseMarketAnalyticsData.body.aggregations.hasOwnProperty(prop)) {
        if (ProductWiseMarketAnalyticsData.body.aggregations[prop].buckets) {
          for (let bucket of ProductWiseMarketAnalyticsData.body.aggregations.HS_CODES.buckets) {
            let code = {}
            code.hs_code_data = {};
            code.hs_code_data.date1 = {};
            code.port_data = [];
            code.country_data = [];
            if (bucket.doc_count != null && bucket.doc_count != undefined) {
              code.hs_code = bucket.key
              code.hsCodeDescription = bucket.hS_code_description
              if (bucket.COUNTRIES) {
                for (let buckett of bucket.COUNTRIES.buckets) {
                  let countries = {};
                  countries.date1 = {};
                  if (buckett.doc_count != null && buckett.doc_count != undefined) {
                    countries.country = buckett.key;
                    segregateSummaryData(countries.date1, buckett)
                    code.country_data.push(countries)
                  }
                }
              }
              if (bucket.PORTS) {
                for (let buckett of bucket.PORTS.buckets) {
                  let ports = {};
                  ports.date1 = {};
                  if (buckett.doc_count != null && buckett.doc_count != undefined) {
                    ports.port = buckett.key;
                    segregateSummaryData(ports.date1, buckett)
                  }
                  code.port_data.push(ports)
                }
              }
              segregateSummaryData(code.hs_code_data.date1, bucket)
            }
            hs_codes.push(code);
          }

        }
      }
    }

    for (let prop in ProductWiseMarketAnalyticsDataLastYear.body.aggregations) {
      if (ProductWiseMarketAnalyticsDataLastYear.body.aggregations.hasOwnProperty(prop)) {
        if (ProductWiseMarketAnalyticsDataLastYear.body.aggregations[prop].buckets) {
          for (let bucket of ProductWiseMarketAnalyticsDataLastYear.body.aggregations.HS_CODES.buckets) {
            if (hs_codes.find(object => object.hs_code === bucket.key)) {
              let x = hs_codes.findIndex(object => object.hs_code === bucket.key);
              let date2 = {}
              if (bucket.doc_count != null && bucket.doc_count != undefined) {
                if (bucket.COUNTRIES) {
                  for (let buckett of bucket.COUNTRIES.buckets) {
                    if (hs_codes[x].country_data.find(object => object.country === buckett.key)) {
                      let date2 = {};
                      if (buckett.doc_count != null && buckett.doc_count != undefined) {
                        segregateSummaryData(date2, buckett)
                      }
                      let obj = hs_codes[x].country_data.find(object => object.country === buckett.key)
                      obj.date2 = date2;
                    }
                  }
                }
                if (bucket.PORTS) {
                  for (let buckett of bucket.PORTS.buckets) {
                    if (hs_codes[x].port_data.find(object => object.port === buckett.key)) {
                      let date2 = {};
                      if (buckett.doc_count != null && buckett.doc_count != undefined) {
                        segregateSummaryData(date2, buckett)
                      }
                      let obj = hs_codes[x].port_data.find(object => object.port === buckett.key)
                      obj.date2 = date2;
                    }
                  }
                }
                segregateSummaryData(date2, bucket)
              }
              let obj = hs_codes.find(object => object.hs_code === bucket.key)
              obj.hs_code_data.date2 = date2;
            }
          }
        }
      }
    }

    
    return {
      product_count : 100000,
      product_data : hs_codes
    };
  } catch (error) {
    JSON.stringify(error);
  }
}


async function fetchProductWiseMarketAnalyticsFilters(req, res) {
  try {

  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

async function downloadProductWiseMarketAnalyticsData(req, res) {
  try {

  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}



// Controller functions to analyse country vs importer/exporter market data
async function fetchTradeWiseMarketAnalyticsData(req, res) {
  try {
    let TradeWiseMarketAnalyticsData = await getTradeWiseMarketAnalyticsData(req)
    res.send(TradeWiseMarketAnalyticsData);
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

async function fetchTradeWiseMarketAnalyticsFilters(req, res) {
  try {

  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

async function downloadTradeWiseMarketAnalyticsData(req, res) {
  try {
    let payload = req.body;
    const startDate = payload.dateRange.startDate ?? null;
    const endDate = payload.dateRange.endDate ?? null;
    let analyticsDataset = await getTradeWiseMarketAnalyticsData(req);

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

    let rowCount = 1
    let cellCount = 7;
    let analyticsDatasetLength = analyticsDataset.length - 1;
    while (rowCount < analyticsDatasetLength ) {
      let analyticsData = analyticsDataset[rowCount];

      let startCell = "A" + cellCount;
      let endCell = "A" + (cellCount + 2);

      let companyCell = worksheet.getCell(startCell);
      companyCell.value = analyticsData.company_name;
      worksheet.mergeCells(startCell, endCell);
      companyCell.alignment = { vertical: "middle", horizontal: "left" }

      let data = [analyticsData.company_data.date1, analyticsData.company_data.date2];
      for (let i = 0; i < data.length+1; i++) {
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

    // workbook.xlsx.write(res, function () {
    //   res.end();
    // })
    // res.writeFile('C:\Users\Kunal\OneDrive\Desktop\data.xlsx');
    workbook.xlsx.writeFile("C:\\Users\\Kunal\\OneDrive\\Desktop\\data.xlsx");
    res.end();

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
    let TradeWiseMarketAnalyticsData = await marketAnalyticsModel.TradeWiseMarketAnalytics(payload, startDate, endDate);
    let TradeWiseMarketAnalyticsDataLastYear = await marketAnalyticsModel.TradeWiseMarketAnalytics(payload, covertDateYear(startDate), covertDateYear(endDate));
    let companies = {
      trade_data : []
    }
    for (let prop in TradeWiseMarketAnalyticsData.body.aggregations) {
      if (TradeWiseMarketAnalyticsData.body.aggregations.hasOwnProperty(prop)) {
        if (TradeWiseMarketAnalyticsData.body.aggregations[prop].buckets) {
          for (let bucket of TradeWiseMarketAnalyticsData.body.aggregations.COMPANIES.buckets) {
            let company = {};
            company.company_data = {};
            company.company_data.date1 = {};
            if (bucket.doc_count != null && bucket.doc_count != undefined) {
              company.company_name = bucket.key
              segregateSummaryData(company.company_data.date1, bucket)
            }
            companies.trade_data.push(company);
          }
        } else {
          let companiesCount = TradeWiseMarketAnalyticsData.body.aggregations.COMPANIES_COUNT.value;
          companies.trade_count = companiesCount;
        }
      }
    }
    for (let prop in TradeWiseMarketAnalyticsDataLastYear.body.aggregations) {
      if (TradeWiseMarketAnalyticsDataLastYear.body.aggregations.hasOwnProperty(prop)) {
        if (TradeWiseMarketAnalyticsDataLastYear.body.aggregations[prop].buckets) {
          for (let bucket of TradeWiseMarketAnalyticsDataLastYear.body.aggregations.COMPANIES.buckets) {
            if (companies.trade_data.find(object => object.company_name === bucket.key)) {
              let date2 = {}
              if (bucket.doc_count != null && bucket.doc_count != undefined) {
                segregateSummaryData(date2, bucket)
              }
              let obj = companies.trade_data.find(object => object.company_name === bucket.key)
              obj.company_data.date2 = date2;
            }
          }
        }
      }
    }
    return companies;
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

//////////segregate Data func///////
function segregateSummaryData(groupedElement, bucket) {

  if (bucket.hasOwnProperty("SHIPMENTS")) {
    groupedElement.shipments = bucket['SHIPMENTS'].value;
  }
  if (bucket.hasOwnProperty("QUANTITY")) {
    groupedElement.quantity = bucket['QUANTITY'].value;
  }
  if (bucket.hasOwnProperty("PRICE")) {
    groupedElement.price = bucket['PRICE'].value;
  }

}
///////

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
  getTradeWiseMarketAnalyticsData
}
