// @ts-check

const WorkspaceModel = require("../../models/workspaceModel");
const { logger } = require("../../config/logger");
const WorkspaceSchema = require("../../schemas/workspaceSchema");
const { RetrieveWorkspaceRecordsAdx, SummarizeWorkspaceRecordsAdx, RetrieveAdxDataFiltersAdx } = require("./utils");
const { ObjectId } = require("mongodb");
const getLoggerInstance = require("../logger/Logger");
const sendResponse = require("../SendResponse.util");
const MongoDbHandler = require("../../db/mongoDbHandler");
const { RetrieveAdxDataFilters } = require("../../models/tradeModel");
const ObjectID = require("mongodb").ObjectID;
const tradeModel = require("../../models/tradeModel");
const { getADXAccessToken } = require("../../db/accessToken");
const { query: adxQueryExecuter, parsedQueryResults } = require("../../db/adxDbApi");

var workspaceBaseTable = process.env.WorkspaceBaseTable; // WorkSpaceTable | | union database("Workspaces").

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

      let recordDataQuery = `let recordIds = ${recordIds} 
      ${adxBucket} | where  RECORD_ID  in (recordIds) | take 100`;

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

      let recordDataQuery = `${adxBucket} | where  RECORD_ID  in (recordIds)`;

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

      let recordDataQuery = `${adxBucket} | where  RECORD_ID  in (recordIds)`;

      let summary = await SummarizeWorkspaceRecordsAdx(workpsaceRecordIdQuery, recordDataQuery, req.body)

      return sendResponse(res, 200, summary);
    } catch (error) {
      return sendResponse(res, 500, { message: JSON.stringify(error) });
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
      adxBucket += ' | union IndiaImportHot | union IndiaExtraImport';
    }

    else if (trade.toUpperCase() == "EXPORT") {
      adxBucket += ' | union IndiaExportHot | union IndiaExtraExport';
    }
  }

  return adxBucket;
}
async function getQueryWorkspace(payload){
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
      }catch(err){
        return {"Response": "Error making query"}
      }
  }

module.exports = {
  FetchAnalyseWorkspaceRecordsAndSend: FetchAnalyseWorkspaceRecordsAndSend,
  getQueryWorkspace
};
