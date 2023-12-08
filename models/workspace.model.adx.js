// @ts-check
const kustoClient = require("../db/adxDbHandler");
const { mapAdxRowsAndColumns } = require("./tradeModel");
const MongoDbHandler = require("../db/mongoDbHandler");
const WorkspaceSchema = require("../schemas/workspaceSchema");
const ExcelJS = require("exceljs");
const { get } = require("../routes/workspaceRoute");
const getLoggerInstance = require("../services/logger/Logger");
const axios = require('axios');
const ObjectID = require("mongodb").ObjectID;
const tradeModel = require("../models/tradeModel");
const { getADXAccessToken } = require("../db/accessToken");
const { query: adxQueryExecuter, parsedQueryResults } = require("../db/adxDbApi");

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

/**
 * calling workpsace creation azure api
 * @param {any} query
 * @param {any} payload
 * @param {any} workspaceId
 * @param {any} selectedRecords
 */
async function CreateWorkpsaceOnAdx(query, selectedRecords, payload, workspaceId) {
  try {
    let workpsaceCreationURL = process.env.WorkspaceBaseURL + "/api/create_update_workspaces";

    let worskpaceCreationPayload = {
      "account_id": payload.accountId,
      "user_id": payload.userId,
      "workspace_id": workspaceId,
      "trade_type": payload.tradeType,
      "country": payload.country,
      "record_ids": selectedRecords,
      "is_query": true,
      "query": query
    }

    if (selectedRecords.length > 0) {
      worskpaceCreationPayload["is_query"] = false;
    }

    // @ts-ignore
    const response = await axios.post(workpsaceCreationURL, worskpaceCreationPayload);

    if (response.status == 200) {
      console.log(response.data);
      return response.data;
    } else {
      throw "Workspace Creation Failed"
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Function to transform data into required worksheet for Blob storage
 * @param {any} mappedResult
 * @param {{ allFields: any[]; country: string; trade: string; indexNamePrefix: string | string[]; }} payload
 * @param {any} isNewWorkspace
 */
async function analyseDataAndCreateExcel(mappedResult, payload, isNewWorkspace) {
  let isHeaderFieldExtracted = false;
  let shipmentDataPack = {};
  shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_RECORDS] = [];
  shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_FIELD_HEADERS] = [];

  let newArr = [...mappedResult];

  newArr.forEach((hit) => {
    if (payload) {
      let row_values = [];
      for (let fields of payload.allFields) {
        if (fields.toLowerCase() == "records_tag") continue;
        else if (fields.toLowerCase() == "be_no") continue;
        else if (fields.toLowerCase() == "bill_no") continue;
        if (hit[fields] == null || hit[fields] == "NULL" || hit[fields] == "" || !hit[fields]) {
          hit[fields] = "null";
        }
        row_values.push(hit[fields]);
      }
      shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_RECORDS].push([...row_values,]);
    } else {
      shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_RECORDS].push([
        ...Object.values(hit),
      ]);
    }
    if (!isHeaderFieldExtracted) {
      var headerArr = [];
      if (payload)
        headerArr = payload.allFields.filter((columnName) => {
          return columnName.toLowerCase() != "records_tag";
        });
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
      headerArr.forEach((key) => {
        shipmentDataPack[
          WorkspaceSchema.RESULT_PORTION_TYPE_FIELD_HEADERS
        ].push(key.replace("_", " "));
      });
    }
    isHeaderFieldExtracted = true;
  });
  let bundle = {};

  bundle.data = shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_RECORDS];
  bundle.headers = shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_FIELD_HEADERS];

  try {
    var text = " DATA";
    var workbook = new ExcelJS.Workbook();
    let worksheet = workbook.addWorksheet("Trade Data");
    var getCellCountryText = worksheet.getCell("C2");
    var getCellRecordText = worksheet.getCell("C4");

    worksheet.getCell("A5").value = "";

    getCellCountryText.value = text;
    getCellCountryText.font = {
      name: "Calibri",
      size: 22,
      underline: "single",
      bold: true,
      color: { argb: "005d91" },
      // @ts-ignore
      height: "auto",
    };
    worksheet.mergeCells("C2", "E3");
    getCellRecordText.font = {
      name: "Calibri",
      size: 14,
      bold: true,
      color: { argb: "005d91" },
    };
    getCellCountryText.alignment = { vertical: "middle", horizontal: "center" };
    getCellRecordText.alignment = { vertical: "middle", horizontal: "center" };
    worksheet.mergeCells("C4", "E4");

    //Add Image
    let myLogoImage = workbook.addImage({
      filename: "./public/images/logo-new.jpg",
      extension: "jpeg",
    });

    worksheet.addImage(myLogoImage, "A1:A4");
    // @ts-ignore
    worksheet.add;
    let headerRow = worksheet.addRow(bundle.headers);

    var colLength = [];
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
      var rowValue = [];
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
        // @ts-ignore
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
    let wbOut = await workbook.xlsx.writeBuffer();
    return wbOut
  } catch (err) {
    const { errorMessage } = getLoggerInstance(err, __filename)
    console.log(errorMessage)
    throw err;
  }
}

/**
 * @param {any} accountId
 */
async function getWorkspaceRecordLimit(accountId) {
  const aggregationExpression = [
    {
      $match: {
        account_id: new ObjectID(accountId),
        max_workspace_record_count: {
          $exists: true,
        },
      },
    },
    {
      $project: {
        max_workspace_record_count: 1,
        _id: 0,
      },
    },
  ];

  try {
    let limitDetails = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.account_limits)
      .aggregate(aggregationExpression)
      .toArray();

    return limitDetails[0];
  } catch (error) {
    throw error;
  }
}

/**
 * @param {any} workspaceId
 */
async function findRecordsByID(workspaceId) {
  try {
    const aggregationExpression = [
      {
        $match: {
          _id: new ObjectID(workspaceId),
        },
      },
      {
        $project: {
          _id: 0,
          records: 1,
        },
      },
    ];

    const workspaceRecords = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.workspace)
      .aggregate(aggregationExpression)
      .toArray();

    return workspaceRecords[0];
  } catch (error) {
    throw error;
  }
}

/**
 * @param {any} query
 * @param {any} selectedRecords
 * @param {any} accountId
 */
async function GetApprovalWorkspaceDataOnAdx(query, selectedRecords, accountId) {
  try {
    let workpsaceCreationURL = process.env.WorkspaceBaseURL + "/api/deduplicate";

    let worskpaceCreationPayload = {
      "account_id": accountId,
      "record_ids": selectedRecords,
      "is_query": true,
      "query": query
    }

    if (selectedRecords.length > 0) {
      worskpaceCreationPayload["is_query"] = false;
    }

    // @ts-ignore
    const response = await axios.post(workpsaceCreationURL, worskpaceCreationPayload);

    if (response.status == 200) {
      console.log(response.data);
      return response.data;
    } else {
      throw "Workspace Approval Failed"
    }
  } catch (error) {
    throw error;
  }
}

/**
 * @param {any} accountId
 */
async function getWorkspaceCreationLimits(accountId) {
  const aggregationExpression = [
    {
      $match: {
        account_id: new ObjectID(accountId),
        max_workspace_count: {
          $exists: true,
        },
      },
    },
    {
      $project: {
        max_workspace_count: 1,
        _id: 0,
      },
    },
  ];

  try {
    let limitDetails = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.account_limits)
      .aggregate(aggregationExpression)
      .toArray();

    return limitDetails[0];
  } catch (error) {
    console.log(
      `accountID --> ${accountId}; \nMethod --> getWorkspaceCreationLimits(); \nerror --> ${JSON.stringify(
        error
      )}`
    );
    throw error;
  }
}

/**
 * @param {any} userId
 * @param {any} filters
 */
async function findByUsersWorkspace(userId, filters) {
  try {
    let filterClause = {};

    if (filters.tradeType != null) {
      filterClause.trade = filters.tradeType;
    }

    if (filters.countryCode != null) {
      filterClause.code_iso_3 = filters.countryCode;
    }


    filterClause = {
      $or: [
        { user_id: new ObjectID(userId) },
        { shared_with: { $elemMatch: { $eq: userId } } },
      ]
    }

    const results = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.workspace)
      .find(filterClause, { projection: { start_date: 0, end_date: 0, } }).toArray();

    return results
  } catch (error) {
    console.log(__filename, error)
    throw error;
  }
}

/**
 * @param {any} accountId
 * @param {any} userId
 * @param {any} workspaceId
 * @param {any} country
 * @param {any} trade
 * @param {any} dateColumn
 */
async function getDatesByIndices(accountId, userId, workspaceId, country, trade, dateColumn) {
  try {
    const adxAccessToken = await getADXAccessToken();

    let recordIds = `database("Workspaces").WorkSpaceTableTest 
    | where ACCOUNT_ID == '${accountId}' and USER_ID == '${userId}' and WORKSPACE_ID == '${workspaceId}'  
    | project RECORD_ID;`

    let adxBucket = tradeModel.getSearchBucket(country, trade);
    if (country.toUpperCase() == "INDIA") {
      if (trade.toUpperCase() == "IMPORT") {
        adxBucket = 'database("Eximpedia").IndiaExport| union database("Eximpedia").IndiaExtraExport';
      }

      else if (trade.toUpperCase() == "EXPORT") {
        adxBucket = 'database("Eximpedia").IndiaImport| union database("Eximpedia").IndiaExtraImport';
      }
    }

    let recordDataQuery = `let recordIds = ${recordIds} 
    ${adxBucket} | where  RECORD_ID  in (recordIds)
    | summarize Min_date = min(${dateColumn}), Max_date = max(${dateColumn})`;

    let recordDataQueryResult = await adxQueryExecuter(recordDataQuery, adxAccessToken);
    recordDataQueryResult = JSON.parse(recordDataQueryResult)["Tables"][0]["Rows"].map(row => {
      const obj = {};
      JSON.parse(recordDataQueryResult)["Tables"][0]["Columns"].forEach((column, index) => {
        obj[column["ColumnName"]] = [...row][index];
      });
      return obj;
    });

    const end_date = recordDataQueryResult[0]["Max_date"];
    const start_date = recordDataQueryResult[0]["Min_date"];

    MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.workspace)
      .updateOne(
        {
          _id: workspaceId,
        },
        {
          $set: {
            start_date: start_date,
            end_date: end_date,
          },
        },
        function (err) {
          if (err) {
          } else {
          }
        }
      );
    return { start_date, end_date };
  } catch (err) {
    console.log(JSON.stringify(err));
    return null;
  }
}

/**
 * @param {any} accountId
 */
async function getWorkspaceDeletionLimit(accountId) {
  const aggregationExpression = [
    {
      $match: {
        account_id: new ObjectID(accountId),
        max_workspace_delete_count: {
          $exists: true,
        },
      },
    },
    {
      $project: {
        max_workspace_delete_count: 1,
        _id: 0,
      },
    },
  ];

  try {
    let limitDetails = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.account_limits)
      .aggregate(aggregationExpression)
      .toArray();

    return limitDetails[0];
  } catch (error) {
    throw error;
  }
}

module.exports = {
  CreateWorkpsaceOnAdx,
  analyseDataAndCreateExcel,
  getWorkspaceRecordLimit,
  findRecordsByID,
  GetApprovalWorkspaceDataOnAdx,
  getWorkspaceCreationLimits,
  findByUsersWorkspace,
  getDatesByIndices,
  getWorkspaceDeletionLimit
}
