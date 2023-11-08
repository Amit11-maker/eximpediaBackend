// @ts-check

const WorkspaceModel = require("../models/workspaceModel");

const getLoggerInstance = require("../services/logger/Logger");
const CreateWorkspace = require("../services/workspace/createWorkspace");
const { findPurchasePointsByRole, checkWorkspaceRecordsConstarints } = require("./workspaceController");
const workspaceUtils = require("../services/workspace/utils");
const { FetchAnalyzeWorkspaceRecordsAndSend: FetchAnalyzeWorkspaceRecordsAndSend } = require("../services/workspace/analytics");
const { default: axios } = require("axios");
const { azureFunctionRoutes } = require("../services/workspace/constants");
const { formulateAdxRawSearchRecordsQueries, formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax } = require("../models/tradeModel");

/** Controller function to create workspace
 * @param {import("express").Response} res
 * @param {import("express").Request & {user?: *}} req
 */
const createWorkspace = (req, res) => {
  try {
    setTimeout(createUserWorkspace, 3000, req);
    // createUserWorkspace(req.body)
    res.status(202).json({
      message: "Workspace Creation Started...We will notify you once done !"
    });
  } catch (error) {
    console.error(error);
    let { errorMessage } = getLoggerInstance(error, __filename)
    return res.status(500).json({
      message: errorMessage,
      status: 500,
    })
  }
};

/**
 * @param {import ("express").Request & {user: any}} req
 */
const createUserWorkspace = async (req) => {
  try {
    const workspaceService = new CreateWorkspace();
    const success = await workspaceService.execute(req);
    console.log(success);
  } catch (error) {
    const { errorMessage } = getLoggerInstance(error, __filename)
    console.error((error));
  }
};


/**
 * Controller function for the records approval for workspace
 * @param {import("express").Request & {user?: { account_id?: string; user_id?: string }} } req
 * @param {import("express").Response} res
 */
async function ApproveRecordsPurchase(req, res) {
  let payload = {};
  payload.tradeRecords = req.body.tradeRecords ? req.body.tradeRecords : null;
  payload.sortTerm = req.body.sortTerm ? req.body.sortTerm : null;
  payload.accountId = req?.user?.account_id ? req?.user?.account_id.trim() : null;
  payload.tradeType = req.body.tradeType ? req.body.tradeType.trim().toUpperCase() : null;
  payload.workspaceId = req.body.workspaceId ? req.body.workspaceId.trim() : null;
  payload.country = req.body.country ? req.body.country.trim().toUpperCase() : null;
  payload.matchExpressions = req.body.matchExpressions;
  payload.recordsSelections = req.body.recordsSelections;
  payload.aggregationParams = {
    matchExpressions: payload.matchExpressions,
    recordsSelections: payload.recordsSelections,
  };

  let bundle = {};
  try {
    let query = "";
    const country = req.body.country[0].toUpperCase() + req.body.country.slice(1).toLowerCase();
    const tradeType = req.body.tradeType[0].toUpperCase() + req.body.tradeType.slice(1).toLowerCase();
    if (payload.recordsSelections?.length === 0) {
      query = formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax(payload, country + tradeType);
    }

    /**
     * @type {import('axios').AxiosResponse<{ total : number, chargeable : number, "non-chargeable" : number }>}
     */
    const workspaceRecordsLimitADX = await axios.post(azureFunctionRoutes.approval, {
      account_id: req.user?.account_id,
      "user_id": req.user?.user_id,
      "record_ids": payload.recordsSelections,
      "is_query": payload.recordsSelections?.length === 0 ? true : false,
      "query": query
    })
    let workspaceRecordsLimit = await WorkspaceModel.getWorkspaceRecordLimit(payload.accountId);
    await checkWorkspaceRecordsConstarints(payload, workspaceRecordsLimit); /* 50k records per workspace check */

    if (!payload.aggregationParams.recordsSelections || payload.aggregationParams.recordsSelections.length == 0) {
      // find records from adx
      // payload.aggregationParams.recordsSelections = await workspaceUtils.findShipmentRecordsIdentifierAdx(payload);
      payload.aggregationParams.recordsSelections = await workspaceUtils.findShipmentRecordsIdentifierAdx(payload);
    }

    let purchasableRecords = await WorkspaceModel.findPurchasableRecordsForWorkspace(payload, payload.aggregationParams.recordsSelections, true);
    if (typeof workspaceRecordsLimitADX.data?.chargeable === "number") {
      // bundle.purchasableRecords = payload.tradeRecords;
      bundle.purchasableRecords = workspaceRecordsLimitADX.data.chargeable
    } else {
      bundle.purchasableRecords = purchasableRecords.purchasable_records_count;
    }
    // bundle.totalRecords = payload.tradeRecords;
    bundle.totalRecords = workspaceRecordsLimitADX.data.total;

    //condition to deduct points by country
    if (payload.country != "INDIA") {
      bundle.purchasableRecords = bundle.purchasableRecords * 5;
    }

    findPurchasePointsByRole(req, async (error, availableCredits) => {
      if (error) {

        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        let workspaceCreationLimits = await WorkspaceModel.getWorkspaceCreationLimits(payload.accountId);
        bundle.availableCredits = availableCredits;
        // bundle.consumedLimit = workspaceCreationLimits.max_workspace_count.alloted_limit - workspaceCreationLimits.max_workspace_count.remaining_limit
        bundle.consumedLimit = workspaceRecordsLimitADX.data["non-chargeable"]
        bundle.allotedLimit = workspaceCreationLimits.max_workspace_count.alloted_limit
        return res.status(200).json(bundle);
      }
    });
  } catch (error) {
    const { errorMessage } = getLoggerInstance(error, __filename)
    if (error?.message?.startsWith("Limit reached...")) {
      res.status(409).json({
        message: errorMessage,
      });
    } else {
      res.status(500).json({
        message: errorMessage,
      });
    }
  }
}

/**
 * fetch analytics shipments records
 * @param {import("express").Request & {user?: any}} req 
 * @param {import("express").Response} res 
 */
async function fetchAnalyticsShipmentsRecords(req, res) {
  try {
    let analyseService = new FetchAnalyzeWorkspaceRecordsAndSend()
    analyseService.fetchRecords(req, res)
  } catch (error) {
    const { errorMessage } = getLoggerInstance(error, __filename)
    console.log(errorMessage);
  }
}


/**
 * fetch analytics shipments records
 * @param {import("express").Request & {user?: any}} req 
 * @param {import("express").Response} res 
 */
async function fetchAnalyticsShipmentsFilters(req, res) {
  try {
    let analyseService = new FetchAnalyzeWorkspaceRecordsAndSend()
    analyseService.fetchFilters(req, res)
    // analyseService.fetchRecords(req, res)
  } catch (error) {
    const { errorMessage } = getLoggerInstance(error, __filename)
    console.log(errorMessage);
  }
}


const workspaceControllerADX = {
  createWorkspaceADX: createWorkspace,
  ApproveRecordsPurchaseADX: ApproveRecordsPurchase,
  fetchAnalyticsShipmentsRecordsAdx: fetchAnalyticsShipmentsRecords,
  fetchAnalyticsShipmentsFiltersAdx: fetchAnalyticsShipmentsFilters
};

module.exports = workspaceControllerADX;
