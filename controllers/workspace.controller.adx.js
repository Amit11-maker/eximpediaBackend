// @ts-check
const AccountModel = require("../models/accountModel");
const UserModel = require("../models/userModel");
const WorkspaceModelADX = require("../models/workspace.model.adx");
const { formulateAdxRawSearchRecordsQueries } = require("../models/tradeModel");
const CreateWorkspace = require("../services/workspace/createWorkspace");
const workspaceUtils = require("../services/workspace/utils");
const { FetchAnalyseWorkspaceRecordsAndSend } = require("../services/workspace/analytics");

/** Controller function to create workspace
 * @param {import("express").Response} res
 * @param {import("express").Request & {user?: *}} req
 */
const createWorkspaceADX = (req, res) => {
  try {
    setTimeout(createUserWorkspace, 3000, req);
    // createUserWorkspace(req.body)
    res.status(202).json({
      message: "Workspace Creation Started...We will notify you once done !"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: JSON.stringify(error),
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

    // create a workspace
    await workspaceService.execute(req);

    console.log("success");
  } catch (error) {
    console.error((error));
  }
}


/**
 * Controller function for the records approval for workspace
 * @param {import("express").Request & {user?: { account_id?: string; }} } req
 * @param {import("express").Response} res
 */
async function ApproveRecordsPurchaseADX(req, res) {
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
    let workspaceRecordsLimit = await WorkspaceModelADX.getWorkspaceRecordLimit(payload.accountId);
    await checkWorkspaceRecordsConstarints(payload, workspaceRecordsLimit ?? 50000); /* 50k records per workspace check */

    let query = "";
    let selectedRecords = payload.aggregationParams.recordsSelections;
    if (!selectedRecords || selectedRecords.length <= 0) {
      query = formulateAdxRawSearchRecordsQueries(payload);
    }

    // calling approve record api for workspace
    let approvalResult = await WorkspaceModelADX.GetApprovalWorkspaceDataOnAdx(query, selectedRecords, payload.accountId);

    bundle.purchasableRecords = approvalResult.chargeable;
    bundle.totalRecords = approvalResult.total;

    //condition to deduct points by country
    if (payload.country.toUpperCase() != "INDIA") {
      bundle.purchasableRecords = bundle.purchasableRecords * 5;
    }

    findPurchasePointsByRole(req, async (error, availableCredits) => {
      if (error) {
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        let workspaceCreationLimits = await WorkspaceModelADX.getWorkspaceCreationLimits(payload.accountId);
        bundle.availableCredits = availableCredits;
        bundle.consumedLimit = workspaceCreationLimits.max_workspace_count.alloted_limit - workspaceCreationLimits.max_workspace_count.remaining_limit
        bundle.allotedLimit = workspaceCreationLimits.max_workspace_count.alloted_limit
        return res.status(200).json(bundle);
      }
    });
  } catch (error) {
    if (error?.message?.startsWith("Limit reached...")) {
      res.status(409).json({
        message: JSON.stringify(error),
      });
    } else {
      res.status(500).json({
        message: JSON.stringify(error),
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
    let analyseService = new FetchAnalyseWorkspaceRecordsAndSend()
    analyseService.fetchRecords(req, res)
  } catch (error) {
    console.log(error);
  }
}

/**
 * fetch analytics shipments records
 * @param {import("express").Request & {user?: any}} req 
 * @param {import("express").Response} res 
 */
async function fetchAnalyticsShipmentsFilters(req, res) {
  try {
    let analyseService = new FetchAnalyseWorkspaceRecordsAndSend()
    analyseService.fetchFilters(req, res)
    // analyseService.fetchRecords(req, res)
  } catch (error) {
    console.log(error);
  }
}

/**
 * @param {any} payload
 * @param {any} workspaceRecordsLimit
 */
async function checkWorkspaceRecordsConstarints(
  payload,
  workspaceRecordsLimit
) {
  console.log("Method = checkWorkspaceRecordsConstarints , Entry");
  try {
    let workspaceId = payload.workspaceId;
    let tradeRecords = payload.tradeRecords;
    let recordsLimitPerWorkspace = 0;

    if (workspaceRecordsLimit?.max_workspace_record_count?.alloted_limit) {
      recordsLimitPerWorkspace = workspaceRecordsLimit?.max_workspace_record_count?.alloted_limit;
    }

    if (!workspaceId) {
      if (tradeRecords > recordsLimitPerWorkspace) {
        throw (
          "Limit reached... Only " +
          workspaceRecordsLimit?.max_workspace_record_count?.alloted_limit +
          " records allowed per workspace."
        );
      }
    } else {
      let workspacerecords = await WorkspaceModelADX.findRecordsByID(workspaceId);

      if (tradeRecords + workspacerecords.records > recordsLimitPerWorkspace) {
        throw (
          "Limit reached... Only " +
          workspaceRecordsLimit?.max_workspace_record_count?.alloted_limit +
          " records allowed per workspace."
        );
      }
    }
  } catch (error) {
    console.log(`Method = checkWorkspaceRecordsConstarints , Error = ${error}`);
    throw error;
  } finally {
    console.log("Method = checkWorkspaceRecordsConstarints , Exit");
  }
}

/**
 * @param {any} req
 * @param {any} cb
 */
async function findPurchasePointsByRole(req, cb) {
  let accountId = req.user.account_id;
  let userId = req.user.user_id;
  let role = req.user.role;

  if (role == "ADMINISTRATOR") {
    AccountModel.findPurchasePoints(accountId, (error, result) => {
      if (error) {
        console.log(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
        cb(error);
      } else {
        cb(null, result);
      }
    });
  } else {
    try {
      const userPurchasePoints = await UserModel.findUserPurchasePoints(userId);
      cb(null, userPurchasePoints);
    } catch (error) {
      console.log(
        `accountID --> ${accountId}; \nMethod --> getWorkspaceCreationLimits(); \nerror --> ${JSON.stringify(
          error
        )}`
      );
      cb(error);
      throw error;
    }
  }
}

const workspaceControllerADX = {
  createWorkspaceADX: createWorkspaceADX,
  ApproveRecordsPurchaseADX: ApproveRecordsPurchaseADX,
  fetchAnalyticsShipmentsRecordsAdx: fetchAnalyticsShipmentsRecords,
  fetchAnalyticsShipmentsFiltersAdx: fetchAnalyticsShipmentsFilters
};

module.exports = workspaceControllerADX;
