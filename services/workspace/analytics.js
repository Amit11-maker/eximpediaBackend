// @ts-check

const { logger } = require("../../config/logger");
const { SummarizeWorkspaceRecordsAdx, RetrieveAdxDataFiltersAdx } = require("./utils");
const { ObjectId } = require("mongodb");
const sendResponse = require("../SendResponse.util");
const { formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax } = require("../../models/tradeModel");
const tradeModel = require("../../models/tradeModel");
const { getADXAccessToken } = require("../../db/accessToken");
const { query: adxQueryExecuter } = require("../../db/adxDbApi");

var workspaceBaseTable = process.env.WorkspaceBaseTable;

/**
 * service to fetch the analytics shipments records
 */
class FetchAnalyseWorkspaceRecordsAndSend {

  /**
   * function to fetch the analytics shipments records
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async fetchRecords(req, res) {
    try {
      let accountId = req.body.accountId ?? null;
      let userId = req.body.userId ?? null;
      let workspaceId = req.body.workspaceId ?? null;
      let country = req.body.country ?? null;
      let trade = req.body.tradeType ?? null;

      const adxAccessToken = await getADXAccessToken();

      let recordIds = `${workspaceBaseTable}
      | where ACCOUNT_ID == '${accountId}' and USER_ID == '${userId}' and WORKSPACE_ID == '${workspaceId}' 
      | project RECORD_ID;`

      let adxBucket = getDataBucketForWorkspaces(country, trade);

      let baseRecordDataQuery = `let recordIds = ${recordIds} 
      ${adxBucket} | where  RECORD_ID  in (recordIds)`;

      let recordDataQuery = formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax(req.body, baseRecordDataQuery);

      recordDataQuery += ' | take 1000';

      let recordDataQueryResult = await adxQueryExecuter(recordDataQuery, adxAccessToken);
      recordDataQueryResult = JSON.parse(recordDataQueryResult)["Tables"][0]["Rows"].map(row => {
        const obj = {};
        JSON.parse(recordDataQueryResult)["Tables"][0]["Columns"].forEach((column, index) => {
          if (column["ColumnName"].toUpperCase() == "RECORD_ID") {
            obj["_id"] = [...row][index];
          } else {
            obj[column["ColumnName"]] = [...row][index];
          }
        });
        return obj;
      });

      let dataRecordCount = `${workspaceBaseTable}
      | where ACCOUNT_ID == '${accountId}' and USER_ID == '${userId}' and WORKSPACE_ID == '${workspaceId}' 
      | summarize RecordCount = count()`

      let dataRecordCountResult = await adxQueryExecuter(dataRecordCount, adxAccessToken);
      dataRecordCountResult = JSON.parse(dataRecordCountResult)["Tables"][0]["Rows"].map(row => {
        const obj = {};
        JSON.parse(dataRecordCountResult)["Tables"][0]["Columns"].forEach((column, index) => {
          if (column["ColumnName"].toUpperCase() == "RECORD_ID") {
            obj["_id"] = [...row][index];
          } else {
            obj[column["ColumnName"]] = [...row][index];
          }
        });
        return obj;
      });

      let bundle = {}
      bundle.data = recordDataQueryResult;

      bundle.recordsTotal = dataRecordCountResult[0]["RecordCount"];
      bundle.recordsFiltered = recordDataQueryResult.length;
      bundle.draw = req.body.draw;

      return sendResponse(res, 200, bundle);

    } catch (error) {
      return sendResponse(res, 500, { message: JSON.stringify(error) });
    }
  }

  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async fetchFilters(req, res) {
    try {
      let accountId = req.body.accountId ?? null;
      let userId = req.body.userId ?? null;
      let workspaceId = req.body.workspaceId ?? null;
      let country = req.body.country ?? null;
      let trade = req.body.tradeType ?? null;

      let workpsaceRecordIdQuery = `${workspaceBaseTable}
      | where ACCOUNT_ID == '${accountId}' and USER_ID == '${userId}' and WORKSPACE_ID == '${workspaceId}' 
      | project RECORD_ID;`


      let adxBucket = getDataBucketForWorkspaces(country, trade);

      let baseRecordDataQuery = `${adxBucket} | where  RECORD_ID  in (recordIds)`;

      let recordDataQuery = formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax(req.body, baseRecordDataQuery);

      let worskpaceFilters = await RetrieveAdxDataFiltersAdx(workpsaceRecordIdQuery, recordDataQuery, req.body);

      return sendResponse(res, 200, worskpaceFilters);
    } catch (error) {
      return sendResponse(res, 500, { message: JSON.stringify(error) });
    }
  }

  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async summarizeRecords(req, res) {

    try {
      let accountId = req.body.accountId ?? null;
      let userId = req.body.userId ?? null;
      let workspaceId = req.body.workspaceId ?? null;
      let country = req.body.country ?? null;
      let trade = req.body.tradeType ?? null;

      let workpsaceRecordIdQuery = `${workspaceBaseTable}
      | where ACCOUNT_ID == '${accountId}' and USER_ID == '${userId}' and WORKSPACE_ID == '${workspaceId}' 
      | project RECORD_ID;`

      let adxBucket = getDataBucketForWorkspaces(country, trade);

      let baseRecordDataQuery = `${adxBucket} | where  RECORD_ID  in (recordIds)`;

      let recordDataQuery = formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax(req.body, baseRecordDataQuery);

      let summary = await SummarizeWorkspaceRecordsAdx(workpsaceRecordIdQuery, recordDataQuery, req.body)

      return sendResponse(res, 200, summary);
    } catch (error) {
      return sendResponse(res, 500, { message: JSON.stringify(error) });
    }
  }

  /**
   * @param {any} payload
   * @param {any} query
   * @param {any} selectedRecords
   */
  async getApprovalRecords(payload, query, selectedRecords) {

    try {
      const adxAccessToken = await getADXAccessToken();

      let totalRecords = selectedRecords.length;
      let worspaceDataQuery = `${workspaceBaseTable} | where  ACCOUNT_ID == '${payload.accountId}' 
      and RECORD_ID  in (${selectedRecords.map(record => `'${record}'`).join(',')})
      | distinct RECORD_ID | count;`

      if (!selectedRecords || selectedRecords.length <= 0) {
        let totalRecordCount = await adxQueryExecuter(query + " | count", adxAccessToken);
        totalRecordCount = JSON.parse(totalRecordCount);
        totalRecords = totalRecordCount['Tables'][0]['Rows'][0][0];
        
        worspaceDataQuery = `let recordIds = ${query + " | project RECORD_ID;"} 
        ${workspaceBaseTable} | where  ACCOUNT_ID == '${payload.accountId}' and RECORD_ID  in (recordIds)
        | distinct RECORD_ID | count;`;
      }

      let workspaceDataQueryResult = await adxQueryExecuter(worspaceDataQuery, adxAccessToken);
      workspaceDataQueryResult = JSON.parse(workspaceDataQueryResult);
      let chargeableRecords = totalRecords - workspaceDataQueryResult['Tables'][0]['Rows'][0][0];

      return {
        total: totalRecords,
        chargeable: chargeableRecords
      }

    } catch (error) {
      throw error;
    }
  }

  /**
   * function to fetch the analytics shipments records
   * @param {any} payload
   * @param {any} workspaceId
   */
  async fetchExcelRecords(payload, workspaceId) {
    try {
      let accountId = payload.accountId ?? null;
      let userId = payload.userId ?? null;
      let country = payload.country ?? null;
      let trade = payload.tradeType ?? null;

      const adxAccessToken = await getADXAccessToken();

      let recordIds = `${workspaceBaseTable}
      | where ACCOUNT_ID == '${accountId}' and USER_ID == '${userId}' and WORKSPACE_ID == '${workspaceId}' 
      | project RECORD_ID;`

      let adxBucket = getDataBucketForWorkspaces(country, trade);

      let baseRecordDataQuery = `let recordIds = ${recordIds} 
      ${adxBucket} | where  RECORD_ID  in (recordIds)`;

      // let recordDataQuery = formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax(payload, baseRecordDataQuery);

      let recordDataQueryResult = await adxQueryExecuter(baseRecordDataQuery, adxAccessToken);
      recordDataQueryResult = JSON.parse(recordDataQueryResult)["Tables"][0]["Rows"].map(row => {
        const obj = {};
        JSON.parse(recordDataQueryResult)["Tables"][0]["Columns"].forEach((column, index) => {
          if (column["ColumnName"].toUpperCase() == "RECORD_ID") {
            obj["_id"] = [...row][index];
          } else {
            obj[column["ColumnName"]] = [...row][index];
          }
        });
        return obj;
      });

      return recordDataQueryResult;

    } catch (error) {
      throw error;
    }
  }

}

/**
   * @param {string} country
   * @param {string} trade
   */
function getDataBucketForWorkspaces(country, trade) {
  let adxBucket = tradeModel.getSearchBucket(country, trade);
  if (country.toUpperCase() == "INDIA") {
    if (trade.toUpperCase() == "IMPORT") {
      adxBucket += ' | union IndiaExtraImport';
    }

    else if (trade.toUpperCase() == "EXPORT") {
      adxBucket += ' | union IndiaExtraExport';
    }
  }

  return adxBucket;
}

/**
 * @param {any} payload
 */
async function getQueryWorkspace(payload) {
  try {
    let accountId = payload.accountId ?? null;
    let userId = payload.userId ?? null;
    let workspaceId = payload.workspaceId ?? null;
    let country = payload.country ?? null;
    let trade = payload.tradeType ?? null;

    let recordIds = `${workspaceBaseTable}
      | where ACCOUNT_ID == '${accountId}' and USER_ID == '${userId}' and WORKSPACE_ID == '${workspaceId}' 
      | project RECORD_ID;`

    let adxBucket = getDataBucketForWorkspaces(country, trade);

    let recordDataQuery = `let recordIds = ${recordIds} 
      ${adxBucket} | where  RECORD_ID  in (recordIds)`;
    return recordDataQuery;
  } catch (err) {
    return { "Response": "Error making query" }
  }
}

module.exports = {
  FetchAnalyseWorkspaceRecordsAndSend: FetchAnalyseWorkspaceRecordsAndSend,
  getQueryWorkspace
};
