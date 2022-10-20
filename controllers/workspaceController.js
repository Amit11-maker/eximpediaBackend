const TAG = "workspaceController";

const WorkspaceModel = require("../models/workspaceModel");
const WorkspaceSchema = require("../schemas/workspaceSchema");
const AccountModel = require("../models/accountModel");
const UserModel = require("../models/userModel");
const NotificationModel = require('../models/notificationModel');
const analyticsController = require("./analyticsController");
const { analyseData } = require("./analyseData");
const { logger } = require("../config/logger")

let recordsLimitPerWorkspace = 50000; //default workspace record limit

const create = (req, res) => {
  let payload = req.body;
  const workspace = WorkspaceSchema.buildWorkspace(payload);
  WorkspaceModel.add(workspace, (error, workspaceEntry) => {
    if (error) {
      logger.error(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      res.status(200).json({
        id: workspaceEntry.insertedId,
      });
    }
  });
}

const updateRecordMetrics = (req, res) => {
  let workspaceId = req.params.workspaceId
    ? req.params.workspaceId.trim()
    : null;

  let recordsYear = req.body.recordsYear
    ? req.body.recordsYear.trim().toUpperCase()
    : null;
  let recordsCount = req.body.recordsCount != null ? req.body.recordsCount : 0;

  WorkspaceModel.updateRecordMetrics(
    workspaceId,
    null,
    recordsYear,
    recordsCount,
    (error, workspaceEntry) => {
      if (error) {
        logger.error(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        res.status(200).json({
          id: workspaceEntry.modifiedCount != 0 ? workspaceId : null,
        });
      }
    }
  );
}

const fetchByUser = (req, res) => {
  let userId = req.params.userId ? req.params.userId.trim() : null;

  let tradeType = req.query.tradeType
    ? req.query.tradeType.trim().toUpperCase()
    : null;
  let countryCode = req.query.countryCode
    ? req.query.countryCode.trim().toUpperCase()
    : null;
  // let tradeYear = (req.query.tradeYear) ? req.query.tradeYear.trim().toUpperCase() : null;
  let filters = {
    tradeType: tradeType,
    countryCode: countryCode,
    // tradeYear: tradeYear
  };

  WorkspaceModel.findByUser(userId, filters, async (error, workspaces) => {
    if (error) {
      logger.error(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      for (var i = 0; i < workspaces.length; i++) {
        if (!(workspaces[i].start_date && workspaces[i].end_date)) {
          const data = await WorkspaceModel.getDatesByIndices(
            workspaces[i].data_bucket,
            workspaces[i]._id,
            workspaces[i].trade === "IMPORT" ? "IMP_DATE" : "EXP_DATE"
          );
          if (data) {
            workspaces[i].start_date = data.start_date;
            workspaces[i].end_date = data.end_date;
          }
        }
      }
      res.status(200).json({
        data: workspaces,
      });
    }
  });
}

const listWorkspace = (req, res) => {
  let userId = req.params.userId ? req.params.userId.trim() : null;

  let filters = {
  };

  WorkspaceModel.findByUser(userId, filters, async (error, workspaces) => {
    if (error) {
      logger.error(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      // Date manipulation according to data for workspace
      for (var i = 0; i < workspaces.length; i++) {
        if (!(workspaces[i].start_date && workspaces[i].end_date)) {
          const data = await WorkspaceModel.getDatesByIndices(
            workspaces[i].data_bucket,
            workspaces[i]._id,
            workspaces[i].trade === "IMPORT" ? "IMP_DATE" : "EXP_DATE"
          );
          if (data) {
            workspaces[i].start_date = (new Date(data.start_date)).toISOString().split('T')[0];
            workspaces[i].end_date = (new Date(data.end_date)).toISOString().split('T')[0];
          }
        }
        else {
          workspaces[i].start_date = (new Date(workspaces[i].start_date)).toISOString().split('T')[0];
          workspaces[i].end_date = (new Date(workspaces[i].end_date)).toISOString().split('T')[0];
        }
      }

      let workspaceDeletionLimit = await WorkspaceModel.getWorkspaceDeletionLimit(req.user.account_id);

      res.status(200).json({
        data: workspaces,
        consumedLimit: workspaceDeletionLimit.max_workspace_delete_count.alloted_limit - workspaceDeletionLimit.max_workspace_delete_count.remaining_limit,
        allotedLimit: workspaceDeletionLimit.max_workspace_delete_count.alloted_limit
      });
    }
  });
}

const shareWorkspace = (req, res) => {
  let createData = req.body.workspace_data;
  createData.user_id = req.body.shared_user_id;

  const workspace = WorkspaceSchema.buildWorkspace(createData);
  WorkspaceModel.add(workspace, (error, workspaceEntry) => {
    if (error) {
      logger.error(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      res.status(200).json({
        id: workspaceEntry.insertedId,
      });
    }
  });
}

const fetchWorkspaceTemplates = (req, res) => {
  let accountId = req.params.accountId ? req.params.accountId.trim() : null;
  let userId = req.params.userId ? req.params.userId.trim() : null;
  let tradeType = req.query.tradeType ? req.query.tradeType.trim().toUpperCase() : null;
  let country = req.query.country ? req.query.country.trim().toUpperCase() : null;

  WorkspaceModel.findTemplates(accountId, userId, tradeType, country, async (error, workspaces) => {
    if (error) {
      logger.error(`Function = fetchWorkspaceTemplates . ERROR =  ${JSON.stringify(error)}`);
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      let workspaceCreationLimits = await WorkspaceModel.getWorkspaceCreationLimits(accountId);
      let output = {
        data: workspaces,
        alloted_limit: workspaceCreationLimits?.max_workspace_count?.alloted_limit,
        remaining_limit: workspaceCreationLimits?.max_workspace_count?.remaining_limit
      }
      res.status(200).json(output);
    }
  });
}

const verifyWorkspaceExistence = (req, res) => {
  let accountId = req.params.accountId ? req.params.accountId.trim() : null;
  let userId = req.params.userId ? req.params.userId.trim() : null;

  let workspaceName = req.query.workspaceName ? req.query.workspaceName.trim() : null;
  let tradeType = req.query.tradeType ? req.query.tradeType.trim().toUpperCase() : null;
  let countryCode = req.query.countryCode ? req.query.countryCode.trim().toUpperCase() : null;

  WorkspaceModel.findByName(
    accountId,
    userId,
    tradeType,
    countryCode,
    workspaceName,
    (error, workspaceData) => {
      if (error) {
        logger.error(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        res.status(200).json({
          data: workspaceData ? true : false,
        });
      }
    });
}

const fetchAnalyticsSpecification = (req, res) => {
  let userId = req.params.userId ? req.params.userId.trim() : null;
  let workspaceId = req.params.workspaceId
    ? req.params.workspaceId.trim()
    : null;

  WorkspaceModel.findAnalyticsSpecificationByUser(
    userId,
    workspaceId,
    (error, workspace) => {
      if (error) {
        logger.error(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        res.status(200).json({
          data: workspace,
        });
      }
    }
  );
}

const fetchAnalyticsShipmentsRecords = (req, res) => {
  let payload = req.body;
  let workspaceBucket = payload.workspaceBucket ? payload.workspaceBucket : null;
  let workspaceTotalRecords = payload.workspaceTotalRecords ? payload.workspaceTotalRecords : null;

  let pageKey = payload.draw && payload.draw != 0 ? payload.draw : null;
  let offset = null;
  let limit = null;

  //Datatable JS Mode
  if (pageKey != null) {
    offset = payload.start != null ? payload.start : 0;
    limit = payload.length != null ? payload.length : 10;
  } else {
    offset = payload.offset != null ? payload.offset : 0;
    limit = payload.limit != null ? payload.limit : 10;
  }
  const dataBucket = workspaceBucket;
  WorkspaceModel.findAnalyticsShipmentRecordsAggregationEngine(
    payload,
    dataBucket,
    offset,
    limit,
    (error, shipmentDataPack) => {
      if (error) {
        logger.error(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        let bundle = {};

        if (!shipmentDataPack) {
          bundle.recordsTotal = 0;
          bundle.recordsFiltered = 0;
          bundle.error = "Unrecognised Shipments Response"; //Show if to be interpreted as error on client-side
        } else {
          let recordsTotal =
            shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_SUMMARY].length > 0 ? shipmentDataPack[
              WorkspaceSchema.RESULT_PORTION_TYPE_SUMMARY][0].count : 0;
          bundle.recordsTotal =
            workspaceTotalRecords != null
              ? workspaceTotalRecords
              : recordsTotal;
          bundle.recordsFiltered = recordsTotal;

          bundle.summary = {};
          bundle.filter = {};
          for (const prop in shipmentDataPack) {
            if (shipmentDataPack.hasOwnProperty(prop)) {
              if (prop.indexOf("SUMMARY") === 0) {
                if (prop === "SUMMARY_RECORDS") {
                  bundle.summary[prop] = recordsTotal;
                } else {
                  bundle.summary[prop] = shipmentDataPack[prop];
                }
              }
              if (prop.indexOf("FILTER") === 0) {
                bundle.filter[prop] = shipmentDataPack[prop];
              }
            }
          }
        }

        if (pageKey) {
          bundle.draw = pageKey;
        }

        bundle.data =
          shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_RECORDS];
        res.status(200).json(bundle);
      }
    }
  );
}


const fetchAnalyticsShipmentsStatistics = (req, res) => {
  let payload = req.body;
  //let tradeType = (payload.tradeType) ? payload.tradeType.trim().toUpperCase() : null;
  //let countryCode = (payload.countryCode) ? payload.countryCode.trim().toUpperCase() : null;
  //let tradeYear = (payload.tradeYear) ? payload.tradeYear : null;
  let workspaceBucket = payload.workspaceBucket
    ? payload.workspaceBucket
    : null;
  let workspaceTotalRecords = payload.workspaceTotalRecords
    ? payload.workspaceTotalRecords
    : null;

  const dataBucket = workspaceBucket;

  //

  WorkspaceModel.findAnalyticsShipmentStatisticsAggregation(payload, dataBucket, 0, 0, (error, shipmentDataPack) => {
    if (error) {
      logger.error(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      let bundle = {}

      if (!shipmentDataPack) {
        bundle.recordsTotal = 0;
        bundle.recordsFiltered = 0;
        bundle.error = "Unrecognised Shipments Response"; //Show if to be interpreted as error on client-side
      } else {
        let recordsTotal = shipmentDataPack.SUMMARY_RECORDS.length > 0 ? shipmentDataPack.SUMMARY_RECORDS[0].count : 0;
        bundle.recordsTotal = workspaceTotalRecords != null ? workspaceTotalRecords : recordsTotal;
        bundle.recordsFiltered = recordsTotal;

        bundle.summary = {};
        bundle.filter = {};
        for (const prop in shipmentDataPack) {
          if (shipmentDataPack.hasOwnProperty(prop)) {
            if (prop.indexOf("SUMMARY") === 0) {
              if (prop === "SUMMARY_RECORDS") {
                bundle.summary[prop] = recordsTotal;
              } else {
                bundle.summary[prop] = shipmentDataPack[prop];
              }
            }
            if (prop.indexOf("FILTER") === 0) {
              bundle.filter[prop] = shipmentDataPack[prop];
            }
            //
          }
        }
      }

      res.status(200).json(bundle);
    }
  }
  );
}

const fetchAnalyticsShipmentsTradersByPattern = (req, res) => {
  let payload = req.query;
  let workspaceBucket = payload.workspaceBucket ? payload.workspaceBucket : null;
  let searchTerm = payload.searchTerm ? payload.searchTerm : null;
  let searchField = payload.searchField ? payload.searchField : null;

  const dataBucket = workspaceBucket;

  WorkspaceModel.findAnalyticsShipmentsTradersByPattern(
    searchTerm,
    searchField,
    dataBucket,
    (error, shipmentTraders) => {
      if (error) {
        logger.error(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        res.status(200).json({
          data: shipmentTraders,
        });
      }
    }
  );
}

const fetchAnalyticsShipmentsTradersByPatternEngine = (req, res) => {
  let payload = {};

  payload.tradeType = req.body.tradeType ? req.body.tradeType.trim().toUpperCase() : null;
  payload.country = req.body.countryCode ? req.body.countryCode.trim().toUpperCase() : null;
  payload.dateField = req.body.dateField ? req.body.dateField : null;
  payload.searchTerm = req.body.searchTerm ? req.body.searchTerm : null;
  payload.searchField = req.body.searchField ? req.body.searchField : null;
  payload.startDate   = req.body.startDate   ? req.body.startDate : null;
  payload.endDate     = req.body.endDate     ? req.body.endDate : null;
  payload.indexNamePrefix = req.body.workspaceBucket;
 
  WorkspaceModel.findAnalyticsShipmentsTradersByPatternEngine(
    payload,
    (error, shipmentTraders) => {
      if (error) {
        logger.error(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        res.status(200).json({
          data: shipmentTraders,
        });
      }
    });
}

/** Controller function for the records approval for workspace  */
async function approveRecordsPurchaseEngine(req, res) {
  logger.info(`Method = approveRecordsPurchaseEngine , Entry , userId = ${req.user.user_id}`);
  let payload = {};
  payload.tradeRecords = req.body.tradeRecords ? req.body.tradeRecords : null;
  payload.sortTerm = req.body.sortTerm ? req.body.sortTerm : null;
  payload.accountId = req.body.accountId ? req.body.accountId.trim() : null;
  payload.tradeType = req.body.tradeType ? req.body.tradeType.trim().toUpperCase() : null;
  payload.country = req.body.country ? req.body.country.trim().toUpperCase() : null;
  payload.matchExpressions = req.body.matchExpressions
  payload.recordsSelections = req.body.recordsSelections
  payload.aggregationParams = {
    matchExpressions: payload.matchExpressions,
    recordsSelections: payload.recordsSelections,
  }

  let bundle = {}

  // aggregationParams = await ElasticsearchDbQueryBuilderHelper.addAnalyzer(aggregationParams);
  try {
    let workspaceRecordsLimit = await WorkspaceModel.getWorkspaceRecordLimit(payload.accountId);
    await checkWorkspaceRecordsConstarints(payload, workspaceRecordsLimit); /* 50k records per workspace check */

    if (!payload.aggregationParams.recordsSelections || payload.aggregationParams.recordsSelections.length == 0) {
      payload.aggregationParams.recordsSelections = await WorkspaceModel.findShipmentRecordsIdentifierAggregationEngine(payload);
    }


    let purchasableRecords = await WorkspaceModel.findPurchasableRecordsForWorkspace(payload, payload.aggregationParams.recordsSelections);
    if (typeof (purchasableRecords) === 'undefined' || !purchasableRecords) {
      bundle.purchasableRecords = payload.tradeRecords;
    } else {
      bundle.purchasableRecords = purchasableRecords.purchasable_records_count;
    }
    bundle.totalRecords = payload.tradeRecords;

    //condition to deductr points by country
    if (payload.country != "INDIA") {
      bundle.purchasableRecords = (bundle.purchasableRecords) * 5;
    }

    findPurchasePointsByRole(req, async (error, availableCredits) => {
      if (error) {
        logger.info(`Method = approveRecordsPurchaseEngine , Error = ${error}`);
        logger.error(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);

        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        let workspaceCreationLimits = await WorkspaceModel.getWorkspaceCreationLimits(payload.accountId);
        bundle.availableCredits = availableCredits;
        bundle.consumedLimit = workspaceCreationLimits.max_workspace_count.alloted_limit - workspaceCreationLimits.max_workspace_count.remaining_limit,
          bundle.allotedLimit = workspaceCreationLimits.max_workspace_count.alloted_limit
        logger.info(`Method = approveRecordsPurchaseEngine , Bundle =  ${JSON.stringify(bundle)}`);
        res.status(200).json(bundle);
      }
    });
  }
  catch (error) {
    if (error.startsWith("Limit reached...")) {
      logger.error(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
      res.status(409).json({
        message: error
      });
    }
    else {
      logger.info("Method = approveRecordsPurchaseEngine , Error = ", error);
      logger.error(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);

      res.status(500).json({
        message: error
      });
    }
  }
  finally {
    logger.info(`Method = approveRecordsPurchaseEngine , Exit , userId =  ${req.user.user_id}`);
  }
}

async function checkWorkspaceRecordsConstarints(payload, workspaceRecordsLimit) {
  logger.info("Method = checkWorkspaceRecordsConstarints , Entry");
  try {
    let workspaceId = payload.workspaceId;
    let tradeRecords = payload.tradeRecords;

    if (workspaceRecordsLimit?.max_workspace_record_count?.alloted_limit) {
      recordsLimitPerWorkspace = workspaceRecordsLimit?.max_workspace_record_count?.alloted_limit;
    }

    if (!workspaceId) {
      if (tradeRecords > recordsLimitPerWorkspace) {
        throw "Limit reached... Only " + workspaceRecordsLimit?.max_workspace_record_count?.alloted_limit + " records allowed per workspace.";
      }
    } else {
      let workspacerecords = await WorkspaceModel.findRecordsByID(workspaceId);

      if (tradeRecords + workspacerecords.records > recordsLimitPerWorkspace) {
        throw "Limit reached... Only " + workspaceRecordsLimit?.max_workspace_record_count?.alloted_limit + " records allowed per workspace.";
      }
    }

  }
  catch (error) {
    logger.error(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
    logger.info(`Method = checkWorkspaceRecordsConstarints , Error = ${error}`);
    throw error;
  }
  finally {
    logger.info("Method = checkWorkspaceRecordsConstarints , Exit");
  }
}

/** Controller function to create workspace */
const createWorkspace = async (req, res) => {
  logger.info(`Method = createWorkspace , Entry , userId = ${req.user.user_id}`);
  const payload = req.body;
  try {
  let workspaceCreationLimits = await WorkspaceModel.getWorkspaceCreationLimits(payload.accountId);

  if (workspaceCreationLimits?.max_workspace_count?.remaining_limit > 0) {
    payload.aggregationParams = {
      matchExpressions: payload.matchExpressions,
      recordsSelections: payload.recordsSelections
    };

    if (!payload.recordsSelections || payload.recordsSelections.length == 0) {
      payload.aggregationParams.recordsSelections = await WorkspaceModel.findShipmentRecordsIdentifierAggregationEngine(payload);
    }

    const purchasableRecordsData = await WorkspaceModel.findPurchasableRecordsForWorkspace(payload, payload.aggregationParams.recordsSelections);
    findPurchasePointsByRole(req, async (error, availableCredits) => {
      if (error) {
        logger.error(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        let recordCount = purchasableRecordsData.purchasable_records_count;
        let pointsPurchased = payload.points_purchase;
        if (recordCount != undefined) {
          if (availableCredits >= recordCount * pointsPurchased) {
            let workspaceId = '';
            try {
              const recordsAdditionResult = await WorkspaceModel.addRecordsToWorkspaceBucket(payload);
              workspaceId = recordsAdditionResult.workspaceId;
              if (recordsAdditionResult.merged) {
                payload.tradePurchasedRecords = purchasableRecordsData.purchase_records;
                const workspacePurchase = WorkspaceSchema.buildRecordsPurchase(payload);
                await WorkspaceModel.updatePurchaseRecordsKeeper(workspacePurchase);

                const updateWorkSpaceResult = await updateWorkspaceMetrics(payload, payload.aggregationParams, recordsAdditionResult);
                const consumeType = WorkspaceSchema.POINTS_CONSUME_TYPE_DEBIT;
                updatePurchasePointsByRole(req, consumeType, recordCount, async (error) => {
                  if (error) {
                    logger.error(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
                    res.status(500).json({
                      message: "Internal Server Error",
                    });
                  } else {
                    await addWorkspaceCreationNotification(payload);
                    workspaceCreationLimits.max_workspace_count.remaining_limit = (workspaceCreationLimits?.max_workspace_count?.remaining_limit - 1);
                    await WorkspaceModel.updateWorkspaceCreationLimits(payload.accountId, workspaceCreationLimits);
                    res.status(200).json({
                      id: (updateWorkSpaceResult != 0) ? payload.workspaceName : null,
                        remaining_limit : workspaceCreationLimits.max_workspace_count.alloted_limit - workspaceCreationLimits.max_workspace_count.remaining_limit,
                        alloted_limit : workspaceCreationLimits.max_workspace_count.alloted_limit
                    });
                  }
                });
              } else {
                if (!recordsAdditionResult.merged && recordsAdditionResult.message) {
                  res.status(409).json({
                    message: recordsAdditionResult.message,
                  });
                } else {
                  logger.error(`WORKSPACE CONTROLLER ==`, JSON.stringify(recordsAdditionResult.message));
                  res.status(500).json({
                    message: "Internal Server Error",
                  });
                }
              }
            }
            catch (error) {
              if (payload.workspaceType == "NEW" && workspaceId.length > 0) {
                await WorkspaceModel.deleteWorkspace(workspaceId);
              }
              logger.error(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);

              res.status(500).json({
                message: "Internal Server Error",
              });
            }
            finally {
              logger.info(`Method = createWorkspace , Exit , userId = ${req.user.user_id}`);
            }
          } else {
            logger.info(`Method = createWorkspace , Exit , userId = ${req.user.user_id}`);
            res.status(409).json({
              message: 'Insufficient points , please purchase more to use .',
            });
          }
        } else {
          logger.info(`Method = createWorkspace , Exit , userId = ${req.user.user_id}`);
          res.status(409).json({
            message: 'Something Went wrong in workspace creation , please try again .',
          });
        }
      }
    });
  }
  else {
    res.status(409).json({
      message: "Max-Workspace-Creation-Limit reached... Please contact administrator for further assistance."
    });
  }
}
  catch (error) {
    logger.error(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

async function addWorkspaceCreationNotification(payload) {
  let notificationInfo = {};
  notificationInfo.user_id = [payload.userId];
  if (payload.workspaceType === 'NEW') {

    notificationInfo.heading = 'Workspace creation';
    notificationInfo.description = `${payload.workspaceName} has been succesfully created.`;

  } else {
    notificationInfo.heading = 'Workspace updation';
    notificationInfo.description = `${payload.workspaceName} has been succesfully updated.`;
  }
  let notificationType = 'user';
  await NotificationModel.add(notificationInfo, notificationType);
}

async function addPointDeductionNotification(payload, purchasableRecords) {
  let notificationInfo = {};
  notificationInfo.user_id = [payload.userId];
  notificationInfo.heading = 'Credit point deduction';
  notificationInfo.description = `${purchasableRecords} points has been consumed by you.`;
  let notificationType = 'user';
  await NotificationModel.add(notificationInfo, notificationType);
}

/** Function to update workspace with corresponding values. */
async function updateWorkspaceMetrics(payload, aggregationParamsPack, currentWorkspaceData) {
  logger.info("Method = updateWorkspaceMetrics , Entry");
  try {
    payload.workspaceId = currentWorkspaceData.workspaceId;
    payload.workspaceDataBucket = currentWorkspaceData.workspaceDataBucket;
    payload.s3FilePath = currentWorkspaceData.s3FilePath;
    payload.recordsCount = await WorkspaceModel.findShipmentRecordsCountEngine(currentWorkspaceData.workspaceDataBucket);

    const dateData = await getStartAndEndDateForWorkspace(currentWorkspaceData, aggregationParamsPack);
    payload.start_date = (new Date(dateData.start_date)).toISOString().split('T')[0];
    payload.end_date = (new Date(dateData.end_date)).toISOString().split('T')[0];

    const workspace = WorkspaceSchema.buildWorkspace(payload);
    const updateWorkspaceResult = await WorkspaceModel.updateWorkspaceDataRecords(currentWorkspaceData.workspaceId, workspace);
    return updateWorkspaceResult.modifiedCount;
  }
  catch (error) {
    logger.error(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
    throw error;
  }
  finally {
    logger.info("Method = updateWorkspaceMetrics , Exit");
  }
}

async function getStartAndEndDateForWorkspace(currentWorkspaceData, aggregationParamsPack) {
  try {
    const dbWorkspaceData = await WorkspaceModel.findWorkspaceById(currentWorkspaceData.workspaceId);
    let workspaceDataStartDate = new Date(dbWorkspaceData.start_date);
    let workspaceDataEndDate = new Date(dbWorkspaceData.end_date);
    let currentStartDate = '';
    let currentEndDate = '';

    aggregationParamsPack.matchExpressions.forEach(hit => {
      if (hit.identifier == "SEARCH_MONTH_RANGE") {
        currentStartDate = new Date(hit.fieldValueLeft);
        currentEndDate = new Date(hit.fieldValueRight);
      }
    });

    let dateData = {
      start_date: (currentStartDate.getTime() > workspaceDataStartDate.getTime()) ? workspaceDataStartDate.getTime() : currentStartDate.getTime(),
      end_date: (currentEndDate.getTime() < workspaceDataEndDate.getTime()) ? workspaceDataEndDate.getTime() : currentEndDate.getTime()
    }

    return dateData;
  }
  catch (error) {
    logger.error(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
    throw error;
  }
}

async function findPurchasePointsByRole(req, cb) {
  let accountId = req.user.account_id;
  let userId = req.user.user_id;
  let role = req.user.role;

  if (role == "ADMINISTRATOR") {
    AccountModel.findPurchasePoints(accountId,
      (error, result) => {
        if (error) {
          logger.error(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
          cb(error);
        }
        else {
          cb(null, result);
        }
      })
  }
  else {
    try {
      const userPurchasePoints = await UserModel.findUserPurchasePoints(userId);
      cb(null, userPurchasePoints);
    }
    catch (error) {
      logger.error(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
      cb(error);
    }
  }
}

function updatePurchasePointsByRole(req, consumeType, purchasableRecords, cb) {
  let accountId = req.user.account_id;
  let userId = req.user.user_id;
  let role = req.user.role;
  if (purchasableRecords) {
    AccountModel.findPurchasePoints(accountId, (error, purchasePoints) => {
      if (error) {
        logger.error(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
        cb(error);
      }
      else {
        UserModel.findById(userId, null, (error, user) => {
          if (error) {
            logger.error(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
            cb(error);
          }
          else {
            if (role == "ADMINISTRATOR" || (user?.available_credits && user?.available_credits == purchasePoints)) {
              AccountModel.updatePurchasePoints(accountId, consumeType, purchasableRecords, async (error) => {
                if (error) {
                  logger.error(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
                  cb(error);
                }
                else {
                  await addPointDeductionNotification(req.body, purchasableRecords);
                  UserModel.findByAccount(accountId, null, (error, users) => {
                    if (error) {
                      logger.error(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
                      cb(error);
                    }
                    else {
                      let modifiedCount = 0;
                      users.forEach(user => {
                        if (user.available_credits == purchasePoints) {
                          UserModel.updateUserPurchasePoints(user._id, consumeType, purchasableRecords, (error) => {
                            if (error) {
                              logger.error(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
                              cb(error);
                            }
                            else {
                              modifiedCount++;
                            }
                          });
                        }
                      });
                      cb(null, modifiedCount);
                    }
                  });
                }
              });
            }
            else {
              UserModel.updateUserPurchasePoints(userId, consumeType, purchasableRecords, (error, result) => {
                if (error) {
                  logger.error(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
                  cb(error);
                }
                else {
                  cb(null, result);
                }
              });
            }
          }
        });
      }
    });
  }
}

/** Controller function to delete workspace */
async function deleteWorkspace(req, res) {
  let workspaceId = req.params.workspaceId;
  try {
    let workspaceDeletionLimit = await WorkspaceModel.getWorkspaceDeletionLimit(req.user.account_id);

    if (workspaceDeletionLimit?.max_workspace_delete_count?.remaining_limit > 0) {
      let workspace = await WorkspaceModel.findWorkspaceById(workspaceId);
      await WorkspaceModel.deleteWorkspace(workspaceId);
      await addDeleteWorkspaceNotification(req, workspace);

      workspaceDeletionLimit.max_workspace_delete_count.remaining_limit = (workspaceDeletionLimit?.max_workspace_delete_count?.remaining_limit - 1);
      await WorkspaceModel.updateWorkspaceDeletionLimit(req.user.account_id, workspaceDeletionLimit);

      // increase workspace creation limit if user delete a workspace
      let workspaceCreationLimits = await WorkspaceModel.getWorkspaceCreationLimits(req.user.account_id);
      workspaceCreationLimits.max_workspace_count.remaining_limit = (workspaceCreationLimits?.max_workspace_count?.remaining_limit + 1);
      await WorkspaceModel.updateWorkspaceCreationLimits(req.user.account_id, workspaceCreationLimits);

      res.status(200).json({
        data: {
          msg: "Deleted Successfully!",
          consumedLimit: workspaceDeletionLimit.max_workspace_delete_count.alloted_limit - workspaceDeletionLimit.max_workspace_delete_count.remaining_limit,
          allotedLimit: workspaceDeletionLimit.max_workspace_delete_count.alloted_limit
        },
      });
    }
    else {
      res.status(409).json({
        message: "Max-Delete-Workspace-Limit reached... Please contact administrator for further assistance."
      });
    }
  }
  catch (error) {
    logger.error(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

/** Controller function to download workspace */
const fetchAnalyticsShipmentRecordsFile = async (req, res) => {
  let payload = req.body;
  let downloadType = payload.type ?? null;

  switch (downloadType) {
    case "period":
      let output = await analyticsController.fetchTradeEntitiesFactorsPeriodisation(req);
      analyseData(output, res);
      break;
    case "contribute":
      let result = await analyticsController.fetchTradeEntitiesFactorsContribution(req);
      analyseData(result, res);
      break;
    case "filteredWorkspace":
      filteredWorkspaceCase(res, payload);
      break;
    default:
      defaultDownloadCase(res, payload);
  }
}

async function addDeleteWorkspaceNotification(req, workspace) {
  let notificationInfo = {};
  notificationInfo.user_id = [req.user.user_id];
  notificationInfo.heading = 'Workspace deletion';
  notificationInfo.description = `${workspace.name} has been succesfully removed.`;
  let notificationType = 'user';
  await NotificationModel.add(notificationInfo, notificationType);
}

function defaultDownloadCase(res, payload) {
  const dataBucket = payload.workspaceBucket;
  WorkspaceModel.findShipmentRecordsDownloadAggregationEngine(dataBucket,
    0, recordsLimitPerWorkspace, payload, (error, shipmentDataPack) => {
      if (error) {
        logger.error(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        analyseData(shipmentDataPack, res, payload);
      }
    });
}

function filteredWorkspaceCase(res, payload) {
  const dataBucket = payload.workspaceBucket;
  WorkspaceModel.findAnalyticsShipmentRecordsDownloadAggregationEngine(
    payload,
    dataBucket,
    (error, shipmentDataPack) => {
      if (error) {
        logger.error(` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`);
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        analyseData(shipmentDataPack, res, payload);
      }
    }
  );
}

module.exports = {
  create,
  updateRecordMetrics,
  fetchByUser,
  shareWorkspace,
  listWorkspace,
  fetchWorkspaceTemplates,
  verifyWorkspaceExistence,
  fetchAnalyticsSpecification,
  fetchAnalyticsShipmentsRecords,
  fetchAnalyticsShipmentRecordsFile,
  fetchAnalyticsShipmentsStatistics,
  fetchAnalyticsShipmentsTradersByPattern,
  fetchAnalyticsShipmentsTradersByPatternEngine,
  approveRecordsPurchaseEngine,
  createWorkspace,
  deleteWorkspace
}
