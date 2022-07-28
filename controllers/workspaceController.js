const TAG = "workspaceController";

const WorkspaceModel = require("../models/workspaceModel");
const WorkspaceSchema = require("../schemas/workspaceSchema");
const AccountModel = require("../models/accountModel");
const UserModel = require("../models/userModel");
const ElasticsearchDbQueryBuilderHelper = require('./../helpers/elasticsearchDbQueryBuilderHelper');
const recordsLimitPerWorkspace = 50000;

const analyticsController = require("./analyticsController");
const { analyseData } = require("./analyseData");

const create = (req, res) => {
  let payload = req.body;
  const workspace = WorkspaceSchema.buildWorkspace(payload);
  WorkspaceModel.add(workspace, (error, workspaceEntry) => {
    if (error) {
      //
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
        //
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

const shareWorkspace = (req, res) => {
  let createData = req.body.workspace_data;
  createData.user_id = req.body.shared_user_id;

  const workspace = WorkspaceSchema.buildWorkspace(createData);
  WorkspaceModel.add(workspace, (error, workspaceEntry) => {
    if (error) {
      //
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
  let tradeType = req.query.tradeType
    ? req.query.tradeType.trim().toUpperCase()
    : null;
  let country = req.query.country
    ? req.query.country.trim().toUpperCase()
    : null;
  console.log("dddddddddddddddddddddddddddddddddddddddddddddddddddddd");
  WorkspaceModel.findTemplates(accountId, userId, tradeType, country,
    (error, workspaces) => {
      if (error) {
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        let output = {
          data: workspaces,
          limit: false,
          errorMessage: ""
        }
        if (req.plan.max_workspace_count <= workspaces.length) {
          output.limit = true
          output.errorMessage = "Max limit reached you cannot create a new workspace please delete some existing one"
        }
        res.status(200).json(output);
      }
    }
  );
}

const verifyWorkspaceExistence = (req, res) => {
  let accountId = req.params.accountId ? req.params.accountId.trim() : null;
  let userId = req.params.userId ? req.params.userId.trim() : null;

  let workspaceName = req.query.workspaceName ? req.query.workspaceName.trim() : null;
  let tradeType = req.query.tradeType ? req.query.tradeType.trim().toUpperCase() : null;
  let countryCode = req.query.countryCode
    ? req.query.countryCode.trim().toUpperCase()
    : null;

  WorkspaceModel.findByName(
    accountId,
    userId,
    tradeType,
    countryCode,
    workspaceName,
    (error, workspaceData) => {
      if (error) {
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        res.status(200).json({
          data: workspaceData ? true : false,
        });
      }
    }
  );
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
  let workspaceBucket = payload.workspaceBucket
    ? payload.workspaceBucket
    : null;
  let workspaceTotalRecords = payload.workspaceTotalRecords
    ? payload.workspaceTotalRecords
    : null;

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

  //

  if (!payload.isEngine) {
    WorkspaceModel.findAnalyticsShipmentRecordsAggregation(
      payload,
      dataBucket,
      offset,
      limit,
      (error, shipmentDataPack) => {
        if (error) {
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
              shipmentDataPack.SUMMARY_RECORDS.length > 0
                ? shipmentDataPack.SUMMARY_RECORDS[0].count
                : 0;
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
                //
              }
            }
          }

          if (pageKey) {
            bundle.draw = pageKey;
          }
          bundle.data = shipmentDataPack.RECORD_SET;
          res.status(200).json(bundle);
        }
      }
    );
  } else {
    WorkspaceModel.findAnalyticsShipmentRecordsAggregationEngine(
      payload,
      dataBucket,
      offset,
      limit,
      (error, shipmentDataPack) => {
        if (error) {
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
              shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_SUMMARY]
                .length > 0
                ? shipmentDataPack[
                  WorkspaceSchema.RESULT_PORTION_TYPE_SUMMARY
                ][0].count
                : 0;
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
  let payload = req.body;

  let tradeType = payload.tradeType ? payload.tradeType.trim().toUpperCase() : null;
  let country = payload.countryCode ? payload.countryCode.trim().toUpperCase() : null;
  let dateField = payload.dateField ? payload.dateField : null;
  let searchTerm = payload.searchTerm ? payload.searchTerm : null;
  let searchField = payload.searchField ? payload.searchField : null;
  let startDate = payload.startDate ? payload.startDate : null;
  let endDate = payload.endDate ? payload.endDate : null;

  let tradeMeta = {
    tradeType: tradeType,
    countryCode: country,
    startDate,
    endDate,
    dateField,
    indexNamePrefix: country.toLocaleLowerCase() + "_" + tradeType.toLocaleLowerCase(),
  }

  WorkspaceModel.findAnalyticsShipmentsTradersByPatternEngine(
    searchTerm,
    searchField,
    tradeMeta,
    payload.workspaceBucket,
    (error, shipmentTraders) => {
      if (error) {
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
  console.log("Method = approveRecordsPurchaseEngine , Entry , userId = ", req.user.user_id);
  let payload = req.body;
  let tradeRecords = payload.tradeRecords ? payload.tradeRecords : null;
  let bundle = {}
  let aggregationParamsPack = {
    matchExpressions: payload.matchExpressions,
    recordsSelections: payload.recordsSelections,
  }
  aggregationParamsPack = await ElasticsearchDbQueryBuilderHelper.addAnalyzer(aggregationParamsPack);
  try {
    await checkWorkspaceRecordsConstarints(payload); /* 50k records per workspace check */

    const purchasableRecords = await WorkspaceModel.findPurchasableRecordsForWorkspace(payload, aggregationParamsPack.recordsSelections);
    if (typeof (purchasableRecords) === 'undefined' || !purchasableRecords) {
      bundle.purchasableRecords = tradeRecords;
    } else {
      bundle.purchasableRecords = purchasableRecords.purchasable_records_count;
    }
    bundle.totalRecords = tradeRecords;

    findPurchasePointsByRole(req, (error, availableCredits) => {
      if (error) {
        console.log("Method = approveRecordsPurchaseEngine , Error = ", error);
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        bundle.availableCredits = availableCredits;
        console.log("Method = approveRecordsPurchaseEngine , Bundle = ", JSON.stringify(bundle));
        res.status(200).json(bundle);
      }
    });
  }
  catch (error) {
    if (error == "Limit reached... Only 50k records allowed per workspace.") {
      res.status(409).json({
        message: error
      });
    }
    else {
      console.log("Method = approveRecordsPurchaseEngine , Error = ", error);
      res.status(500).json({
        message: error
      });
    }
  }
  finally {
    console.log("Method = approveRecordsPurchaseEngine , Exit , userId = ", req.user.user_id);
  }
}

async function checkWorkspaceRecordsConstarints(payload) {
  console.log("Method = checkWorkspaceRecordsConstarints , Entry");
  try {
    const workspaceId = payload.workspaceId;
    const tradeRecords = payload.tradeRecords;

    if (!workspaceId) {
      if (tradeRecords > recordsLimitPerWorkspace) {
        throw "Limit reached... Only 50k records allowed per workspace.";
      }
    } else {
      const workspacerecords = await WorkspaceModel.findRecordsByID(workspaceId);

      if (tradeRecords + workspacerecords.records > recordsLimitPerWorkspace) {
        throw "Limit reached... Only 50k records allowed per workspace.";
      }
    }
  }
  catch (error) {
    console.log("Method = checkWorkspaceRecordsConstarints , Error = ", error);
    throw error;
  }
  finally {
    console.log("Method = checkWorkspaceRecordsConstarints , Exit");
  }
}

/** Controller function to create workspace */
const createWorkspace = async (req, res) => {
  console.log("Method = createWorkspace , Entry , userId = ", req.user.user_id);
  const payload = req.body;

  let aggregationParamsPack = {
    matchExpressions: payload.matchExpressions,
    recordsSelections: payload.recordsSelections
  }

  const purchasableRecordsData = await WorkspaceModel.findPurchasableRecordsForWorkspace(payload, aggregationParamsPack.recordsSelections);
  findPurchasePointsByRole(req, async (error, availableCredits) => {
    if (error) {
      console.log("Method = createWorkspace , Error = ", error);
      console.log("Method = createWorkspace , Exit");
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      const recordCount = purchasableRecordsData.purchasable_records_count;
      const pointsPurchased = payload.points_purchase;
      if (availableCredits >= recordCount * pointsPurchased) {
        let workspaceId = '';
        try {
          const recordsAdditionResult = await WorkspaceModel.addRecordsToWorkspaceBucket(payload, aggregationParamsPack);
          workspaceId = recordsAdditionResult.workspaceId ;
          if (recordsAdditionResult.merged) {
            payload.tradePurchasedRecords = purchasableRecordsData.purchase_records;
            const workspacePurchase = WorkspaceSchema.buildRecordsPurchase(payload);
            await WorkspaceModel.updatePurchaseRecordsKeeper(workspacePurchase);

            const updateWorkSpaceResult = await updateWorkspaceMetrics(payload, aggregationParamsPack, recordsAdditionResult);
            const consumeType = WorkspaceSchema.POINTS_CONSUME_TYPE_DEBIT;
            updatePurchasePointsByRole(req, consumeType, recordCount, (error) => {
              if (error) {
                res.status(500).json({
                  message: "Internal Server Error",
                });
              } else {
                res.status(200).json({
                  id: (updateWorkSpaceResult != 0) ? payload.workspaceName : null,
                });
              }
            });
          } else {
            if (!recordsAdditionResult.merged && recordsAdditionResult.message) {
              res.status(409).json({
                message: recordsAdditionResult.message,
              });
            } else {
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
          console.log("Method = createWorkspace , Error = ", error);
          res.status(500).json({
            message: "Internal Server Error",
          });
        }
        finally {
          console.log("Method = createWorkspace , Exit , userId = ", req.user.user_id);
        }
      } else {
        console.log("Method = createWorkspace , Exit , userId = ", req.user.user_id);
        res.status(409).json({
          message: 'Insufficient points , please purchase more to use .',
        });
      }
    }
  });
}

/** Function to update workspace with corresponding values. */
async function updateWorkspaceMetrics(payload, aggregationParamsPack, currentWorkspaceData) {
  console.log("Method = updateWorkspaceMetrics , Entry");
  try {
    payload.workspaceId = currentWorkspaceData.workspaceId;
    payload.workspaceDataBucket = currentWorkspaceData.workspaceDataBucket;
    payload.s3FilePath = currentWorkspaceData.s3FilePath;
    payload.recordsCount = await WorkspaceModel.findShipmentRecordsCountEngine(currentWorkspaceData.workspaceDataBucket);

    const dateData = await getStartAndEndDateForWorkspace(currentWorkspaceData, aggregationParamsPack);
    payload.start_date = dateData.start_date;
    payload.end_date = dateData.end_date;

    const workspace = WorkspaceSchema.buildWorkspace(payload);
    const updateWorkspaceResult = await WorkspaceModel.updateWorkspaceDataRecords(currentWorkspaceData.workspaceId ,workspace);
    return updateWorkspaceResult.modifiedCount;
  }
  catch (error) {
    console.log("Method = updateWorkspaceMetrics , Error = ", error);
    throw error;
  }
  finally {
    console.log("Method = updateWorkspaceMetrics , Exit");
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
      cb(error);
    }
  }
}

function updatePurchasePointsByRole(req, consumeType, purchasableRecords, cb) {
  let accountId = req.user.account_id;
  let userId = req.user.user_id;
  let role = req.user.role;

  purchasableRecords = (req.body.country == "India") ? purchasableRecords : (purchasableRecords * 5);

  AccountModel.findPurchasePoints(accountId, (error, purchasePoints) => {
    if (error) {
      cb(error);
    }
    else {
      UserModel.findById(userId, null, (error, user) => {
        if (error) {
          cb(error);
        }
        else {
          if (role == "ADMINISTRATOR" || user.available_credits == purchasePoints) {
            AccountModel.updatePurchasePoints(accountId, consumeType, purchasableRecords, (error) => {
              if (error) {
                cb(error);
              }
              else {
                UserModel.findByAccount(accountId, null, (error, users) => {
                  if (error) {
                    cb(error);
                  }
                  else {
                    let modifiedCount = 0;
                    users.forEach(user => {
                      if (user.available_credits == purchasePoints) {
                        UserModel.updateUserPurchasePoints(user._id, consumeType, purchasableRecords, (error) => {
                          if (error) {
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

/** Controller function to delete workspace */
async function deleteWorkspace(req, res) {
  let workspaceId = req.params.workspaceId;
  try {
    await WorkspaceModel.deleteWorkspace(workspaceId);
    res.status(200).json({
      data: {
        msg: "Deleted Successfully!",
      },
    });
  }
  catch(error){
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

function defaultDownloadCase(res, payload) {
  const dataBucket = payload.workspaceBucket;
  WorkspaceModel.findShipmentRecordsDownloadAggregationEngine(dataBucket,
    0, recordsLimitPerWorkspace, payload, (error, shipmentDataPack) => {
      if (error) {
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
