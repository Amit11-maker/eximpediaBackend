const TAG = "workspaceController";
// const = require("moment");
const path = require("path");
// const = require("exceljs");
const WorkspaceModel = require("../models/workspaceModel");
const WorkspaceSchema = require("../schemas/workspaceSchema");
const AccountModel = require("../models/accountModel");
const UserModel = require("../models/userModel");
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

const remove = (req, res) => {
  let workspaceId = req.params.workspaceId;
  WorkspaceModel.remove(workspaceId, (error, workspaceEntry) => {
    if (error) {
      //
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      res.status(200).json({
        data: {
          msg: "Deleted Successfully!",
        },
      });
    }
  });
}

const instantiate = (workspaceId, workspace, cb) => {
  if (!workspaceId) {
    WorkspaceModel.add(workspace, (error, workspaceEntry) => {
      if (error) {
        cb(error);
      } else {
        cb(null, workspaceEntry.insertedId);
      }
    });
  } else {

    cb(null, workspaceId);
  }
}

async function checkWorkspaceRecordsConstarints (payload) {
  const workspaceId = payload.workspaceId;
  const tradeRecords = payload.tradeRecords;

  if (!workspaceId) {
    if (tradeRecords > recordsLimitPerWorkspace) {
      throw "Limit reached... Only 50k allowed per workspace.";
    }
  } else {
    const workspacerecords = await WorkspaceModel.findRecordsByID(workspaceId);

    if (tradeRecords + workspacerecords.records > recordsLimitPerWorkspace) {
      throw "Limit reached... Only 50k allowed per workspace.";
    }
  }
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

const approveRecordsPurchaseEngine = async (req, res) => {
  let payload = req.body;
  let accountId = payload.accountId ? payload.accountId.trim() : null;
  let tradeType = payload.tradeType ? payload.tradeType.trim().toUpperCase() : null;
  let country = payload.country ? payload.country.trim().toUpperCase() : null;
  let tradeRecords = payload.tradeRecords ? payload.tradeRecords : null;
  console.log("\n\n\n\n");
  console.log("AccountID =================", accountId, "Country =================", country, "Trade =================", tradeType);
  console.log("\n\n\n\n");
  const dataBucket = WorkspaceSchema.deriveDataBucket(tradeType, country);
  let aggregationParamsPack = {
    matchExpressions: payload.matchExpressions,
    recordsSelections: payload.recordsSelections,
  }

  try {
    await checkWorkspaceRecordsConstarints(payload); /* 50k records per workspace check */

    WorkspaceModel.findShipmentRecordsIdentifierAggregationEngine(aggregationParamsPack, accountId, dataBucket, (error, shipmentDataIdsPack) => {
      if (error) {
        console.log("AccountID =================", accountId, "Error ================", error);

        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        let bundle = {};
        if (!shipmentDataIdsPack) {
          console.log("AccountID =================", accountId, "Status ================", 200, "Bundle ===================", JSON.parse(bundle));
          res.status(200).json(bundle);
        } else {
          WorkspaceModel.findShipmentRecordsPurchasableCountAggregation(
            accountId,
            tradeType,
            country,
            shipmentDataIdsPack.shipmentRecordsIdentifier,
            (error, approvePurchasePack) => {
              if (error) {
                console.log("AccountID =================", accountId, "Error ================", error);
                res.status(500).json({
                  message: "Internal Server Error",
                });
              } else {
                if (!approvePurchasePack) {
                  bundle.purchasableRecords = tradeRecords;
                } else {
                  bundle.purchasableRecords =
                    approvePurchasePack.purchasable_records_count;
                }
                bundle.totalRecords = tradeRecords;

                findPurchasePointsByRole(req, (error, availableCredits) => {
                  if (error) {
                    console.log("AccountID =================", accountId, "Error ================", error);
                    res.status(500).json({
                      message: "Internal Server Error",
                    });
                  } else {
                    console.log("AccountID =================", accountId, "Status ================", 200, "Bundle ===================", JSON.stringify(bundle));
                    bundle.availableCredits = availableCredits;
                    res.status(200).json(bundle);
                  }
                });
              }
            });
        }
      }
    });
  }
  catch (error) {
    res.status(500).json({
      message: error
    });
  }
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
};

const fetchAnalyticsShipmentsRecordsPreEngineMigration = (req, res) => {
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
};

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

function defaultDownloadCase (res, payload, dataBucket) {
  WorkspaceModel.findShipmentRecordsDownloadAggregationEngine(
    dataBucket,
    0,
    recordsLimitPerWorkspace,
    payload,
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

function filteredWorkspaceCase (res, payload, dataBucket) {
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

const fetchAnalyticsShipmentRecordsFile = async (req, res) => {
  let payload = req.body;
  let workspaceBucket = payload.workspaceBucket
    ? payload.workspaceBucket
    : null;
  let downloadType = payload.type ? payload.type : null;

  const dataBucket = workspaceBucket;
  let output;
  switch (downloadType) {
    case "period":
      output = await analyticsController.fetchTradeEntitiesFactorsPeriodisation(
        req
      );
      analyseData(output, res);
      break;
    case "contribute":
      output = await analyticsController.fetchTradeEntitiesFactorsContribution(
        req
      );
      analyseData(output, res);
      break;
    case "filteredWorkspace":
      filteredWorkspaceCase(res, payload, dataBucket);
      break;
    default:
      defaultDownloadCase(res, payload, dataBucket);
  }

  //
};

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

function updatePurchasePointsByRole (req, consumeType, purchasableRecords, cb) {
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

async function findPurchasePointsByRole (req, cb) {
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

const addRecordsEngine = async (req, res) => {
  let payload = req.body;

  const workspace = WorkspaceSchema.buildWorkspace(payload);
  var workspaceElasticConfig = payload.workspaceElasticConfig;

  const dataBucket = WorkspaceSchema.deriveDataBucket(payload.tradeType, payload.country);

  instantiate(payload.workspaceId, workspace, (error, workspaceIdData) => {
    if (error) {
      res.status(500).json({
        message: error,
      });
    } else {
      let workspaceId = workspaceIdData.toString();
      if (!workspaceId) {
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        let workspaceDataBucket = WorkspaceSchema.deriveWorkspaceBucket(workspaceId);
        let aggregationParamsPack = {
          matchExpressions: payload.matchExpressions,
          recordsSelections: payload.recordsSelections,
        }

        WorkspaceModel.findShipmentRecordsIdentifierAggregationEngine(aggregationParamsPack, payload.accountId, dataBucket, (error, shipmentDataIdsPack) => {
          if (error) {
            res.status(500).json({
              message: "Internal Server Error",
            });
          } else {
            let bundle = {}
            if (!shipmentDataIdsPack) {
              // TODO: Send Result If No Records :: Add criteria at client-side
              res.status(200).json(bundle);
            } else {
              WorkspaceModel.findShipmentRecordsPurchasableAggregation(
                payload.accountId,
                payload.tradeType.toUpperCase(),
                payload.country.toUpperCase(),
                shipmentDataIdsPack.shipmentRecordsIdentifier,
                (error, purchasableRecords) => {
                  if (error) {
                    res.status(500).json({
                      message: "Internal Server Error",
                    });
                  } else {
                    if (!purchasableRecords) {
                      bundle.purchasableRecords = payload.tradeRecords;
                      bundle.purchaseRecordsList = shipmentDataIdsPack.shipmentRecordsIdentifier;
                      payload.tradePurchasedRecords = shipmentDataIdsPack.shipmentRecordsIdentifier;
                    } else {
                      if (payload.workspaceType != "NEW") {
                        // if (purchasableRecords.purchase_records.length > 0) {
                        aggregationParamsPack.recordsSelections = purchasableRecords.purchase_records;
                        aggregationParamsPack.allRecords = shipmentDataIdsPack.shipmentRecordsIdentifier;
                        // } else {
                        //   aggregationParamsPack.recordsSelections = [];
                        //   aggregationParamsPack.allRecords = shipmentDataIdsPack.shipmentRecordsIdentifier;
                        // }
                      }
                      bundle.purchasableRecords = purchasableRecords.purchasable_records_count;
                      bundle.purchaseRecordsList = purchasableRecords.purchase_records;
                      payload.tradePurchasedRecords = purchasableRecords.purchase_records;
                    }
                    bundle.totalRecords = payload.tradeRecords;

                    findPurchasePointsByRole(req, (error, availableCredits) => {
                      if (error) {
                        res.status(500).json({
                          message: "Internal Server Error",
                        });
                      } else {
                        bundle.availableCredits = availableCredits;

                        if (bundle.availableCredits >= bundle.purchasableRecords * payload.points_purchase) {
                          WorkspaceModel.addRecordsAggregationEngine(
                            payload,
                            aggregationParamsPack,
                            dataBucket,
                            workspaceDataBucket,
                            workspaceElasticConfig,
                            (error, workspaceRecordsAddition) => {
                              if (error) {
                                //
                                res.status(500).json({
                                  message: "Internal Server Error",
                                });
                              } else {
                                if (workspaceRecordsAddition.merged) {
                                  const workspacePurchase = WorkspaceSchema.buildRecordsPurchase(payload);

                                  WorkspaceModel.updatePurchaseRecordsKeeper(workspacePurchase, (error, workspacePuchaseUpdate) => {
                                    if (error) {
                                      res.status(500).json({
                                        message: "Internal Server Error",
                                      });
                                    } else {
                                      WorkspaceModel.findShipmentRecordsCountEngine(
                                        workspaceDataBucket,
                                        async (error, shipmentEstimate) => {
                                          if (error) {
                                            res.status(500).json({
                                              message:
                                                "Internal Server Error",
                                            });
                                          } else {
                                            await updateWorkspaceMetrics(res, req, payload, workspace, workspaceId, workspaceDataBucket, shipmentEstimate, bundle, workspaceRecordsAddition.s3FilePath);
                                          }
                                        }
                                      );
                                    }
                                  }
                                  );
                                } else {
                                  if (
                                    !workspaceRecordsAddition.merged &&
                                    workspaceRecordsAddition.message
                                  ) {
                                    res.status(200).json({
                                      id: null,
                                      message:
                                        workspaceRecordsAddition.message,
                                    });
                                  } else {
                                    res.status(500).json({
                                      message: "Internal Server Error",
                                    });
                                  }
                                }
                              }
                            }
                          );
                        } else {
                          res.status(400).json({
                            message: 'Insufficient points , please purchase more to use .',
                          });
                        }
                      }
                    }
                    );
                  }
                }
              );
            }
          }
        }
        );
      }
    }
  });
}

async function updateWorkspaceMetrics (res, req, payload, workspace, workspaceId, workspaceDataBucket, shipmentEstimate, bundle, s3FilePath) {
  WorkspaceModel.updateRecordMetrics(workspaceId, workspaceDataBucket, payload.tradeYear, shipmentEstimate, s3FilePath, (error) => {
    if (error) {
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      updatePurchasePointsByRole(req, WorkspaceSchema.POINTS_CONSUME_TYPE_DEBIT, bundle.purchasableRecords,
        (error, accountMetricsUpdate) => {
          if (error) {
            res
              .status(500)
              .json({
                message: "Internal Server Error",
              });
          } else {
            res
              .status(200)
              .json({
                id: accountMetricsUpdate.modifiedCount !=
                  0
                  ? workspace.name
                  : null,
              });
          }
        });
    }
  });
}

async function createWorkspace (req, res) {
  let payload = req.body;

  const workspace = WorkspaceSchema.buildWorkspace(payload);
  var workspaceElasticConfig = payload.workspaceElasticConfig;


}

module.exports = {
  create,
  remove,
  addRecordsEngine,
  approveRecordsPurchaseEngine,
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
  createWorkspace
}
