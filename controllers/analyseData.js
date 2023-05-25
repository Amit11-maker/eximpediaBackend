const moment = require("moment");
const ExcelJS = require("exceljs");
const { logger } = require("../config/logger");
const WorkspaceSchema = require("../schemas/workspaceSchema");
const INDIA_EXPORT_COLUMN_NAME = {
  BILL_NO: "SB_NO",
  FOUR_DIGIT: "FOUR_DIGIT",
  EXP_DATE: "DATE",
  HS_CODE: "HS_CODE",
  PRODUCT_DESCRIPTION: "GOODS_DESCRIPTION",
  QUANTITY: "QUANTITY",
  UNIT: "UNIT",
  ITEM_RATE_INV: "ITEM_PRICE_INV",
  CURRENCY: "CURRENCY",
  TOTAL_AMOUNT_INV_FC: "TOTAL_PRICE_INV_FC",
  FOB_INR: "FOB_INR",
  ITEM_RATE_INR: "UNIT_PRICE_INR",
  FOB_USD: "FOB_USD",
  USD_EXCHANGE_RATE: "EXCHANGE_RATE_USD",
  FOREIGN_PORT: "DESTINATION_PORT",
  COUNTRY: "COUNTRY",
  INDIAN_PORT: "INDIAN_PORT",
  IEC: "IEC",
  EXPORTER_NAME: "EXPORTER",
  ADDRESS: "ADDRESS",
  CITY: "CITY",
  PIN: "PIN",
  BUYER_NAME: "CONSIGNEE_NAME",
  BUYER_ADDRESS: "CONSIGNEE_ADDRESS",
  INVOICE_NO: "INVOICE_NO",
  CUSH: "PORT_CODE",
  ITEM_NO: "ITEM_NO",
  DRAWBACK: "DRAWBACK",
  STD_QUANTITY: "STD_QUANTITY",
  STD_UNIT: "STD_UNIT",
  STD_ITEM_RATE_INR: "STD_ITEM_RATE_INR",
  STD_ITEM_RATE_INV: "STD_ITEM_RATE_USD",
};

const INDIA_IMPORT_COLUMN_NAME = {
  HS_CODE: "HS_CODE",
  IMP_DATE: "DATE",
  PRODUCT_DESCRIPTION: "GOODS_DESCRIPTION",
  TOTAL_ASSESS_USD: "TOTAL_VALUE_USD",
  TOTAL_ASSESSABLE_VALUE_INR: "TOTAL_VALUE_INR",
  IMPORTER_NAME: "IMPORTER",
  SUPPLIER_NAME: "SUPPLIER",
  UNIT: "UNIT",
  QUANTITY: "QUANTITY",
  ADDRESS: "ADDRESS",
  APPRAISING_GROUP: "APPRAISING_GROUP",
  BE_NO: "BILL OF ENTRY",
  CHA_NAME: "CHA_NAME",
  CHA_NO: "CHA_NO",
  CITY: "CITY",
  CUSH: "PORT_CODE",
  IEC: "IEC",
  INDIAN_PORT: "INDIAN_PORT",
  INVOICE_CURRENCY: "INVOICE_CURRENCY",
  INVOICE_NO: "INVOICE_NO",
  INVOICE_UNITPRICE_FC: "INVOICE_UNITPRICE_FC",
  ORIGIN_COUNTRY: "COUNTRY_OF_ORIGIN",
  PORT_OF_SHIPMENT: "LOADING_PORT",
  RECORDS_TAG: "RECORDS_TAG",
  SUPPLIER_ADDRESS: "SUPPLIER_ADDRESS",
  TOTAL_DUTY_PAID: "DUTY_PAID_INR",
  TYPE: "BE_TYPE",
  UNIT_PRICE_USD: "UNIT_PRICE_USD",
  UNIT_VALUE_INR: "UNIT_PRICE_INR",
  STD_QUANTITY: "STD_QUANTITY",
  STD_UNIT: "STD_UNIT",
  STD_UNIT_PRICE_USD: "STD_UNIT_PRICE_USD",
  STD_UNIT_VALUE_INR: " STD_UNIT_VALUE_INR",
};

function analyseData(mappedResult, res, payload) {
  let isHeaderFieldExtracted = false;
  let shipmentDataPack = {};
  shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_RECORDS] = [];
  shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_FIELD_HEADERS] = [];

  let newArr = [...mappedResult];

  newArr = mappedResult.sort(function (a, b) {
    return new Date(a.IMP_DATE) - new Date(b.IMP_DATE);
  });

  let getFirstIMPDate = moment(newArr[0].IMP_DATE).format("DD-MMMM-YYYY");
  let getLasIMPDate = moment(newArr[newArr.length - 1].IMP_DATE).format(
    "DD-MMMM-YYYY"
  );

  newArr.forEach((hit) => {
    hit.IMP_DATE = moment(hit.IMP_DATE).format("DD-MM-YYYY");

    if (payload) {
      let row_values = [];
      for (let fields of payload.allFields) {
        if (fields.toLowerCase() == "be_no") continue;
        else if (fields.toLowerCase() == "bill_no") continue;
        if (hit[fields] == null || hit[fields] == "NULL" || hit[fields] == "") {
          hit[fields] = "null";
        }
        row_values.push(hit[fields]);
      }
      shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_RECORDS].push([
        ...row_values,
      ]);
    } else
      shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_RECORDS].push([
        ...Object.values(hit),
      ]);
    if (!isHeaderFieldExtracted) {
      let headerArr = [];
      if (payload) headerArr = payload.allFields;
      else headerArr = Object.keys(hit);

      if (
        (payload.country &&
          payload.trade &&
          payload.country.toLowerCase() == "india" &&
          payload.trade.toLowerCase() == "import") ||
        (payload.indexNamePrefix &&
          payload.indexNamePrefix.includes("ind") &&
          payload.indexNamePrefix.includes("import"))
      ) {
        let finalHeader = [];
        for (let key of headerArr) {
          if (key.toLowerCase() == "be_no") continue;
          if (INDIA_IMPORT_COLUMN_NAME[key]) {
            finalHeader.push(INDIA_IMPORT_COLUMN_NAME[key]);
          } else {
            finalHeader.push(key);
          }
        }
        headerArr = [...finalHeader];
      } else if (
        (payload.country &&
          payload.trade &&
          payload.country.toLowerCase() == "india" &&
          payload.trade.toLowerCase() == "export") ||
        (payload.indexNamePrefix &&
          payload.indexNamePrefix.includes("ind") &&
          payload.indexNamePrefix.includes("export"))
      ) {
        let finalHeader = [];
        for (let key of headerArr) {
          if (key.toLowerCase() == "bill_no") continue;
          if (INDIA_EXPORT_COLUMN_NAME[key]) {
            finalHeader.push(INDIA_EXPORT_COLUMN_NAME[key]);
          } else {
            finalHeader.push(key);
          }
        }
        headerArr = [...finalHeader];
      }
      headerArr.forEach((key, index) => {
        //
        shipmentDataPack[
          WorkspaceSchema.RESULT_PORTION_TYPE_FIELD_HEADERS
        ].push(key.replace("_", " "));
      });
    }
    isHeaderFieldExtracted = true;
  });
  let bundle = {};

  bundle.data = shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_RECORDS];
  bundle.headers =
    shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_FIELD_HEADERS];

  try {
    let text = " DATA";
    let title = "";
    let recordText = getFirstIMPDate + " to " + getLasIMPDate;
    let workbook = new ExcelJS.Workbook();
    let worksheet = workbook.addWorksheet("Trade Data");
    let getCellCountryText = worksheet.getCell("C2");
    let getCellRecordText = worksheet.getCell("C4");

    worksheet.getCell("A5").value = "";

    getCellCountryText.value = text;
    getCellCountryText.font = {
      name: "Calibri",
      size: 22,
      underline: "single",
      bold: true,
      color: { argb: "005d91" },
      height: "auto",
    };

    worksheet.mergeCells("C2", "E3");

    getCellRecordText.value = recordText;
    getCellRecordText.font = {
      name: "Calibri",
      size: 14,
      bold: true,
      color: { argb: "005d91" },
    };
    getCellCountryText.alignment = { vertical: "middle", horizontal: "center" };
    getCellRecordText.alignment = { vertical: "middle", horizontal: "center" };
    worksheet.mergeCells("C4", "E4");
    Date;

    //Add Image
    let myLogoImage = workbook.addImage({
      filename: "./public/images/logo-new.jpg",
      extension: "jpeg",
    });
    // worksheet.mergeCells("A1:B4");
    worksheet.addImage(myLogoImage, "A1:A4");
    worksheet.add;
    let headerRow = worksheet.addRow(bundle.headers);

    let colLength = [];
    let highlightCell = 0;
    headerRow.eachCell((cell, number) => {
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
      if (cell.value == "HS CODE") {
        highlightCell = number;
      }
      colLength.push(cell.value ? cell.value.toString().length : 10);
    });
    worksheet.columns.forEach(function (column, i) {
      if (colLength[i] < 10) {
        colLength[i] = 10;
      }
      column.width = colLength[i] * 2;
    });

    // Adding Data with Conditional Formatting
    bundle.data.forEach((d) => {
      let rowValue = [];
      for (let value of d) {
        if (typeof value == "string" || typeof value == "number")
          rowValue.push(value);
        else if (
          !Array.isArray(value) &&
          typeof value == "object" &&
          value.hasOwnProperty("value")
        )
          rowValue.push(value.value);
      }
      let row = worksheet.addRow(rowValue);
      if (highlightCell != 0) {
        let color = "FF99FF99";
        let sales = row.getCell(highlightCell);
        if (+sales.value < 200000) {
          color = "FF9999";
        }

        sales.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: color },
        };
      }
    });

    worksheet.getColumn(1).width = 35;
    workbook.xlsx.write(res, function () {
      res.end();
    });
  } catch (err) {
    logger.log(` ANALYSEDATA ================== ${JSON.stringify(err)}`);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}
exports.analyseData = analyseData;
