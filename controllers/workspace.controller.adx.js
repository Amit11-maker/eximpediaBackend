// @ts-check
// const TAG = "workspaceController.ADX"
// const workspaceModelADX = require("../models/workspace.model.adx");

// const WorkspaceModel = require("../models/workspaceModel");
// const WorkspaceSchema = require("../schemas/workspaceSchema");
// const AccountModel = require("../models/accountModel");
// const UserModel = require("../models/userModel");
// const NotificationModel = require("../models/notificationModel");
// const { logger } = require("../config/logger");

// let recordsLimitPerWorkspace = 50000; //default workspace record limit

// /** Controller function to create workspace
//  * @param {import("express").Response} res
//  * @param {import("express").Request & {user: *}} req
//  */
// const createWorkspace = async (req, res) => {
//     logger.log(
//         req.user.user_id,
//         `Method = createWorkspace , Entry , userId = ${req.user.user_id}`
//     );
//     const payload = req.body;
//     setTimeout(createUserWorkspace, 3000, payload, req);
//     res.status(202).json({
//         message: "Workspace Creation Started...We will notify you once done !",
//     });
//     logger.log(
//         req.user.user_id,
//         `Method = createWorkspace , Exit , userId = ${req.user.user_id}`
//     );
// };

// /**
//  * @param {*} payload
//  * @param {import("express").Request & {user: *}} req
//  */
// async function createUserWorkspace(payload, req) {
//     payload.accountId = req.user.account_id;
//     try {
//         let workspaceCreationLimits = await WorkspaceModel.getWorkspaceCreationLimits(payload.accountId);
//         if (payload.workspaceType.toUpperCase() != "EXISTING" && workspaceCreationLimits?.max_workspace_count?.remaining_limit <= 0) {
//             let errorMessage = "Max-Workspace-Creation-Limit reached... Please contact administrator for further assistance.";
//             workspaceCreationErrorNotification(payload, errorMessage);
//             console.log(req.user.user_id, "WKS LIMIT REACHED ======================");
//         } else {
//             console.log("WKS CREATION STARTED ============================");
//             payload.aggregationParams = {
//                 matchExpressions: payload.matchExpressions,
//                 recordsSelections: payload.recordsSelections,
//             };

//             let workspaceCreated = false;
//             let purchaseRecordPointsUpdated = false;
//             let workspaceCreationLimitUpdated = false;

//             if (!payload.recordsSelections || payload.recordsSelections.length == 0) {
//                 payload.aggregationParams.recordsSelections = await workspaceModelADX.findShipmentRecordsIdentifierAggregationEngineADX(payload);
//                 console.log(
//                     "findShipmentRecordsIdentifierAggregationEngineADX =============",
//                     payload.aggregationParams.recordsSelections?.length
//                 );
//             }

//             const purchasableRecordsData = await workspaceModelADX.findPurchasableRecordsForWorkspaceADX(payload, payload.aggregationParams.recordsSelections);
//             console.log("purchasableRecordsData================================", purchasableRecordsData.purchasable_records_count);
//             findPurchasePointsByRole(req, async (error, availableCredits) => {
//                 if (error) {
//                     logger.log(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
//                     let errorMessage = "Internal server error.";
//                     workspaceCreationErrorNotification(payload, errorMessage);
//                 } else {
//                     console.log("findPurchasePointsByRole==============", availableCredits);
//                     let recordCount = Number(purchasableRecordsData.purchasable_records_count);
//                     let pointsPurchased = payload.points_purchase;
//                     if (recordCount != undefined && typeof recordCount == "number") {
//                         if (availableCredits >= recordCount * pointsPurchased) {
//                             let workspaceId = "";
//                             try {
//                                 const recordsAdditionResult = await workspaceModelADX.addRecordsToWorkspaceBucketADX(payload);
//                                 workspaceCreated = true;
//                                 console.log("recordsAdditionResult ==", payload.accountId, recordsAdditionResult);
//                                 workspaceId = recordsAdditionResult.workspaceId;
//                                 if (recordsAdditionResult.merged) {
//                                     await workspaceModelADX.updatePurchaseRecordsKeeperADX(
//                                         payload,
//                                         purchasableRecordsData
//                                     );

//                                     await workspaceModelADX.updatePurchaseRecordsKeeperADX(
//                                         payload,
//                                         purchasableRecordsData
//                                     );

//                                     await updateWorkspaceMetrics(
//                                         payload,
//                                         payload.aggregationParams,
//                                         recordsAdditionResult
//                                     );
//                                     const consumeType = WorkspaceSchema.POINTS_CONSUME_TYPE_DEBIT;
//                                     console.log(
//                                         "updateWorkspaceMetrics completed ========================",
//                                         consumeType
//                                     );
//                                     updatePurchasePointsByRole(
//                                         req,
//                                         consumeType,
//                                         recordCount,
//                                         async (error) => {
//                                             if (error) {
//                                                 logger.log(
//                                                     ` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`
//                                                 );
//                                                 let errorMessage = "Internal server error.";
//                                                 workspaceCreationErrorNotification(
//                                                     payload,
//                                                     errorMessage
//                                                 );
//                                             } else {
//                                                 purchaseRecordPointsUpdated = true;
//                                                 console.log(
//                                                     "updatePurchasePointsByRole===============================>"
//                                                 );
//                                                 if (payload.workspaceType.toUpperCase() != "EXISTING") {
//                                                     workspaceCreationLimits.max_workspace_count.remaining_limit =
//                                                         workspaceCreationLimits?.max_workspace_count
//                                                             ?.remaining_limit - 1;
//                                                     await WorkspaceModel.updateWorkspaceCreationLimits(
//                                                         payload.accountId,
//                                                         workspaceCreationLimits
//                                                     );
//                                                     workspaceCreationLimitUpdated = true;
//                                                     addWorkspaceCreationNotification(payload);
//                                                 }
//                                             }
//                                         }
//                                     );
//                                 } else {
//                                     console.log(
//                                         "Record Failed merged in workspace ======================================="
//                                     );
//                                     if (
//                                         !recordsAdditionResult.merged &&
//                                         recordsAdditionResult.message
//                                     ) {
//                                         let errorMessage = recordsAdditionResult.message;
//                                         workspaceCreationErrorNotification(payload, errorMessage);
//                                     } else {
//                                         logger.log("Workspace Controller , userId = " + "userID" + ", Error = ");
//                                         logger.log(
//                                             `WORKSPACE CONTROLLER ==`,
//                                             JSON.stringify(recordsAdditionResult.message)
//                                         );
//                                         let errorMessage = "Internal server error.";
//                                         workspaceCreationErrorNotification(payload, errorMessage);
//                                     }
//                                 }
//                             } catch (error) {
//                                 if (payload.workspaceType == "NEW" && workspaceId.length > 0) {
//                                     if (workspaceCreated) {
//                                         await WorkspaceModel.deleteWorkspace(workspaceId);
//                                         workspaceCreated = false;
//                                     }

//                                     if (purchaseRecordPointsUpdated) {
//                                         const consumeTypeIncrement =
//                                             WorkspaceSchema.POINTS_CONSUME_TYPE_CREDIT;
//                                         updatePurchasePointsByRole(
//                                             req,
//                                             consumeTypeIncrement,
//                                             recordCount
//                                         );
//                                         purchaseRecordPointsUpdated = false;
//                                     }

//                                     if (workspaceCreationLimitUpdated) {
//                                         workspaceCreationLimits.max_workspace_count.remaining_limit =
//                                             workspaceCreationLimits?.max_workspace_count
//                                                 ?.remaining_limit + 1;
//                                         await WorkspaceModel.updateWorkspaceCreationLimits(
//                                             payload.accountId,
//                                             workspaceCreationLimits
//                                         );
//                                         workspaceCreationLimitUpdated = false;
//                                     }
//                                 }
//                                 logger.log(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
//                                 logger.log(
//                                     `accountId --> ${payload.accountId
//                                     }; \nMethod --> updatePurchaseRecordsKeeper; \nerror --> ${JSON.stringify(
//                                         error
//                                     )}`
//                                 );
//                                 let errorMessage = "Internal server error";
//                                 workspaceCreationErrorNotification(payload, errorMessage);
//                             } finally {
//                                 logger.log(
//                                     `Method = createWorkspace , Exit , userId = ${req.user.user_id}`
//                                 );
//                             }
//                         } else {
//                             logger.log(
//                                 `Method = createWorkspace , Exit , userId = ${req.user.user_id}`
//                             );
//                             let errorMessage =
//                                 "Insufficient points , please purchase more to use .";
//                             workspaceCreationErrorNotification(payload, errorMessage);
//                         }
//                     } else {
//                         if (payload.workspaceType == "NEW" && workspaceId.length > 0) {
//                             await WorkspaceModel.deleteWorkspace(workspaceId);
//                         }
//                         logger.log(
//                             `Method = createWorkspace , Exit , userId = ${req.user.user_id}`
//                         );
//                         let errorMessage = "Something went wrong while deducting points.";
//                         workspaceCreationErrorNotification(payload, errorMessage);
//                     }
//                 }
//             });
//         }
//     } catch (error) {
//         logger.log(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
//         let errorMessage = "Internal server error.";
//         workspaceCreationErrorNotification(payload, errorMessage);
//     }
// }

// async function workspaceCreationErrorNotification(payload, error) {
//     try {
//         let notificationInfo = {};
//         notificationInfo.user_id = [payload.userId];
//         notificationInfo.heading = "Workspace Creation Failed";
//         notificationInfo.description =
//             "Workspace " +
//             payload.workspaceName.toUpperCase() +
//             " creation failed !! . Reason = " +
//             error;
//         let notificationType = "user";
//         await NotificationModel.add(notificationInfo, notificationType);
//     } catch (error) {
//         logger.log(
//             `userId --> ${payload.userId
//             }; \nfunction --> workspaceCreationErrorNotification(); \nerror --> ${JSON.stringify(
//                 error
//             )}`
//         );
//         throw error;
//     }
// }

// function updatePurchasePointsByRole(req, consumeType, purchasableRecords, cb) {
//     let accountId = req.user.account_id;
//     let userId = req.user.user_id;
//     let role = req.user.role;
//     if (purchasableRecords) {
//         AccountModel.findPurchasePoints(accountId, (error, purchasePoints) => {
//             if (error) {
//                 logger.log(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
//                 cb(error);
//             } else {
//                 UserModel.findById(userId, null, (error, user) => {
//                     if (error) {
//                         logger.log(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
//                         cb(error);
//                     } else {
//                         if (
//                             role == "ADMINISTRATOR" ||
//                             (user?.available_credits &&
//                                 user?.available_credits == purchasePoints)
//                         ) {
//                             AccountModel.updatePurchasePoints(
//                                 accountId,
//                                 consumeType,
//                                 purchasableRecords,
//                                 async (error) => {
//                                     if (error) {
//                                         logger.log(
//                                             ` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`
//                                         );
//                                         cb(error);
//                                     } else {
//                                         await addPointDeductionNotification(
//                                             req.body,
//                                             purchasableRecords
//                                         );
//                                         UserModel.findByAccount(accountId, null, (error, users) => {
//                                             if (error) {
//                                                 logger.log(
//                                                     ` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`
//                                                 );
//                                                 cb(error);
//                                             } else {
//                                                 let modifiedCount = 0;
//                                                 users.forEach((user) => {
//                                                     if (user.available_credits == purchasePoints) {
//                                                         UserModel.updateUserPurchasePoints(
//                                                             user._id,
//                                                             consumeType,
//                                                             purchasableRecords,
//                                                             (error) => {
//                                                                 if (error) {
//                                                                     logger.log(
//                                                                         ` WORKSPACE CONTROLLER == ${JSON.stringify(
//                                                                             error
//                                                                         )}`
//                                                                     );
//                                                                     cb(error);
//                                                                 } else {
//                                                                     modifiedCount++;
//                                                                 }
//                                                             }
//                                                         );
//                                                     }
//                                                 });
//                                                 cb(null, modifiedCount);
//                                             }
//                                         });
//                                     }
//                                 }
//                             );
//                         } else {
//                             UserModel.updateUserPurchasePoints(
//                                 userId,
//                                 consumeType,
//                                 purchasableRecords,
//                                 (error, result) => {
//                                     if (error) {
//                                         logger.log(
//                                             ` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`
//                                         );
//                                         cb(error);
//                                     } else {
//                                         cb(null, result);
//                                     }
//                                 }
//                             );
//                         }
//                     }
//                 });
//             }
//         });
//     }
// }

// async function addPointDeductionNotification(payload, purchasableRecords) {
//     try {
//         let notificationInfo = {};
//         notificationInfo.user_id = [payload.userId];
//         notificationInfo.heading = "Credit point deduction";
//         notificationInfo.description =
//             purchasableRecords +
//             " points has been consumed by you for " +
//             payload.workspaceName.toUpperCase() +
//             " workspace creation.";
//         let notificationType = "user";
//         await NotificationModel.add(notificationInfo, notificationType);
//     } catch (error) {
//         logger.log(
//             `userId --> ${payload.userId
//             }; \nMethod --> addPointDeductionNotification; \nerror --> ${JSON.stringify(
//                 error
//             )}`
//         );
//         throw error;
//     }
// }

// async function addWorkspaceCreationNotification(payload) {
//     let notificationInfo = {};
//     notificationInfo.user_id = [payload.userId];
//     if (payload.workspaceType === "NEW") {
//         notificationInfo.heading = "Workspace creation";
//         notificationInfo.description =
//             "Workspace " +
//             payload.workspaceName.toUpperCase() +
//             " has been succesfully created.";
//     } else {
//         notificationInfo.heading = "Workspace updation";
//         notificationInfo.description =
//             "Workspace " +
//             payload.workspaceName.toUpperCase() +
//             " has been succesfully updated.";
//     }
//     let notificationType = "user";
//     await NotificationModel.add(notificationInfo, notificationType);
// }

// /** Function to update workspace with corresponding values. */
// async function updateWorkspaceMetrics(payload, aggregationParamsPack, currentWorkspaceData) {
//     logger.log("Method = updateWorkspaceMetrics , Entry");
//     try {
//         payload.workspaceId = currentWorkspaceData.workspaceId;
//         payload.workspaceDataBucket = currentWorkspaceData.workspaceDataBucket;
//         payload.s3FilePath = currentWorkspaceData.s3FilePath;
//         payload.recordsCount = await WorkspaceModel.findShipmentRecordsCountEngine(
//             currentWorkspaceData.workspaceDataBucket
//         );

//         const dateData = await getStartAndEndDateForWorkspace(
//             currentWorkspaceData,
//             aggregationParamsPack
//         );
//         payload.start_date = new Date(dateData.start_date)
//             .toISOString()
//             .split("T")[0];
//         payload.end_date = new Date(dateData.end_date).toISOString().split("T")[0];

//         const workspace = WorkspaceSchema.buildWorkspace(payload);
//         const updateWorkspaceResult = await WorkspaceModel.updateWorkspaceDataRecords(currentWorkspaceData.workspaceId, workspace);
//         return updateWorkspaceResult.modifiedCount;
//     } catch (error) {
//         logger.log(`Method --> updateWorkspaceMetrics; \nerror --> ${JSON.stringify(error)}`);
//         throw error;
//     } finally {
//         logger.log("Method = updateWorkspaceMetrics , Exit");
//     }
// }

// async function getStartAndEndDateForWorkspace(currentWorkspaceData, aggregationParamsPack) {
//     try {
//         const dbWorkspaceData = await WorkspaceModel.findWorkspaceById(
//             currentWorkspaceData.workspaceId
//         );
//         let workspaceDataStartDate = new Date(dbWorkspaceData.start_date);
//         let workspaceDataEndDate = new Date(dbWorkspaceData.end_date);

//         /** @type {Date} currentStartDate */
//         let currentStartDate = undefined;

//         /** @type {Date!} currentEndDate */
//         let currentEndDate = undefined;

//         aggregationParamsPack.matchExpressions.forEach((hit) => {
//             if (hit.identifier == "SEARCH_MONTH_RANGE") {
//                 currentStartDate = new Date(hit.fieldValueLeft);
//                 currentEndDate = new Date(hit.fieldValueRight);
//             }
//         });

//         let dateData = {
//             start_date:
//                 currentStartDate?.getTime() > workspaceDataStartDate.getTime()
//                     ? workspaceDataStartDate.getTime()
//                     : currentStartDate?.getTime(),
//             end_date:
//                 currentEndDate?.getTime() < workspaceDataEndDate.getTime()
//                     ? workspaceDataEndDate.getTime()
//                     : currentEndDate?.getTime(),
//         };

//         return dateData;
//     } catch (error) {
//         logger.log(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
//         throw error;
//     }
// }

// async function findPurchasePointsByRole(req, cb) {
//     let accountId = req.user.account_id;
//     let userId = req.user.user_id;
//     let role = req.user.role;

//     if (role == "ADMINISTRATOR") {
//         AccountModel.findPurchasePoints(accountId, (error, result) => {
//             if (error) {
//                 logger.log(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
//                 cb(error);
//             } else {
//                 cb(null, result);
//             }
//         });
//     } else {
//         try {
//             const userPurchasePoints = await UserModel.findUserPurchasePoints(userId);
//             cb(null, userPurchasePoints);
//         } catch (error) {
//             logger.log(
//                 `accountID --> ${accountId}; \nMethod --> getWorkspaceCreationLimits(); \nerror --> ${JSON.stringify(
//                     error
//                 )}`
//             );
//             cb(error);
//             throw error;
//         }
//     }
// }

const { ObjectId } = require("mongodb");
const { blobContainerClient } = require("../config/azure/blob");
const MongoDbHandler = require("../db/mongoDbHandler");
const { find } = require("../models/accountModel");
const { formulateAdxRawSearchRecordsQueries } = require("../models/tradeModel");
const {
  RetrieveAdxRecordsForWorkspace,
  analyseDataAndCreateExcel,
} = require("../models/workspace.model.adx");
const {
  createAdxWorkspaceSchema,
  createWorkspaceBlobName,
} = require("../schemas/workspace.schema");
const { fetchAdxData } = require("./tradeController");
const WorkspaceRecordKeeper = require("../services/workspace/recordKeeper");
const getLoggerInstance = require("../services/logger/Logger");
const { sendWorkspaceErrorNotification, sendWorkspaceCreatedNotification } = require("../services/workspace/notification");
const CreateWorkspace = require("../services/workspace/createWorkspace");

/** Controller function to create workspace
 * @param {import("express").Response} res
 * @param {import("express").Request & {user: *}} req
 */
const createWorkspace = (req, res) => {
  try {
    setTimeout(createUserWorkspace, 3000, req);
    // createUserWorkspace(req.body)
    return res.status(200).json({
      message: "workspace creation started!",
      status: 200,
    });
  } catch (error) {
    console.error(error);
  }
};

/**
 * @param {import ("express").Request & {user: any}} req
 */
const createUserWorkspace = async (req) => {
  try {
    // create a workspace
    const success = new CreateWorkspace().execute(req);
    console.log(success);
  } catch (error) {
    const { errorMessage } = getLoggerInstance(error, __filename)
    throw error
  }
};

const workspaceControllerADX = {
  createWorkspaceADX: createWorkspace,
};

module.exports = workspaceControllerADX;
