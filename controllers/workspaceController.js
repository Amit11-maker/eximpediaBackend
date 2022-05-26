const TAG = "workspaceController";
const moment = require("moment");
const path = require("path");
const ExcelJS = require("exceljs");
const WorkspaceModel = require("../models/workspaceModel");
const WorkspaceSchema = require("../schemas/workspaceSchema");
const AccountModel = require("../models/accountModel");
const UserModel = require("../models/userModel");

const FileHelper = require("../helpers/fileHelper");

const analyticsController = require("./analyticsController");
const INDIA_EXPORT_COLUMN_NAME = {
  "BILL_NO": "SB_NO",
  "FOUR_DIGIT": "FOUR_DIGIT",
  "EXP_DATE": "DATE",
  "HS_CODE": "HS_CODE",
  "PRODUCT_DESCRIPTION": "GOODS_DESCRIPTION",
  "QUANTITY": "QUANTITY",
  "UNIT": "UNIT",
  "ITEM_RATE_INV": "ITEM_PRICE_INV",
  "CURRENCY": "CURRENCY",
  "TOTAL_AMOUNT_INV_FC": "TOTAL_PRICE_INV_FC",
  "FOB_INR": "FOB_INR",
  "ITEM_RATE_INR": "UNIT_PRICE_INR",
  "FOB_USD": "FOB_USD",
  "USD_EXCHANGE_RATE": "EXCHANGE_RATE_USD",
  "FOREIGN_PORT": "DESTINATION_PORT",
  "COUNTRY": "COUNTRY",
  "INDIAN_PORT": "INDIAN_PORT",
  "IEC": "IEC",
  "EXPORTER_NAME": "EXPORTER",
  "ADDRESS": "ADDRESS",
  "CITY": "CITY",
  "PIN": "PIN",
  "BUYER_NAME": "CONSIGNEE_NAME",
  "BUYER_ADDRESS": "CONSIGNEE_ADDRESS",
  "INVOICE_NO": "INVOICE_NO",
  "CUSH": "PORT_CODE",
  "ITEM_NO": "ITEM_NO",
  "DRAWBACK": "DRAWBACK",
  "STD_QUANTITY": "STD_QUANTITY",
  "STD_UNIT": "STD_UNIT",
  "STD_ITEM_RATE_INR": "STD_ITEM_RATE_INR",
  "STD_ITEM_RATE_INV": "STD_ITEM_RATE_USD"
}

const INDIA_IMPORT_COLUMN_NAME = {
  "HS_CODE": "HS_CODE",
  "IMP_DATE": "DATE",
  "PRODUCT_DESCRIPTION": "GOODS_DESCRIPTION",
  "TOTAL_ASSESS_USD": "TOTAL_VALUE_USD",
  "TOTAL_ASSESSABLE_VALUE_INR": "TOTAL_VALUE_INR",
  "IMPORTER_NAME": "IMPORTER",
  "SUPPLIER_NAME": "SUPPLIER",
  "UNIT": "UNIT",
  "QUANTITY": "QUANTITY",
  "ADDRESS": "ADDRESS",
  "APPRAISING_GROUP": "APPRAISING_GROUP",
  "BE_NO": "BILL OF ENTRY",
  "CHA_NAME": "CHA_NAME",
  "CHA_NO": "CHA_NO",
  "CITY": "CITY",
  "CUSH": "PORT_CODE",
  "IEC": "IEC",
  "INDIAN_PORT": "INDIAN_PORT",
  "INVOICE_CURRENCY": "INVOICE_CURRENCY",
  "INVOICE_NO": "INVOICE_NO",
  "INVOICE_UNITPRICE_FC": "INVOICE_UNITPRICE_FC",
  "ORIGIN_COUNTRY": "COUNTRY_OF_ORIGIN",
  "PORT_OF_SHIPMENT": "LOADING_PORT",
  "RECORDS_TAG": "RECORDS_TAG",
  "SUPPLIER_ADDRESS": "SUPPLIER_ADDRESS",
  "TOTAL_DUTY_PAID": "DUTY_PAID_INR",
  "TYPE": "BE_TYPE",
  "UNIT_PRICE_USD": "UNIT_PRICE_USD",
  "UNIT_VALUE_INR": "UNIT_PRICE_INR",
  "STD_QUANTITY": "STD_QUANTITY",
  "STD_UNIT": "STD_UNIT",
  "STD_UNIT_PRICE_USD": "STD_UNIT_PRICE_USD",
  "STD_UNIT_VALUE_INR": " STD_UNIT_VALUE_INR"
}
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
};

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
};

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
};

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
};

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
  let createData = req.body.workspace_data ;
  createData.user_id = req.body.shared_user_id ;

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
};

const fetchWorkspaceTemplates = (req, res) => {
  let accountId = req.params.accountId ? req.params.accountId.trim() : null;
  let userId = req.params.userId ? req.params.userId.trim() : null;
  let tradeType = req.query.tradeType
    ? req.query.tradeType.trim().toUpperCase()
    : null;
  let country = req.query.country
    ? req.query.country.trim().toUpperCase()
    : null;

  WorkspaceModel.findTemplates(
    accountId,
    userId,
    tradeType,
    country,
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
};

const verifyWorkspaceExistence = (req, res) => {
  let accountId = req.params.accountId ? req.params.accountId.trim() : null;
  let userId = req.params.userId ? req.params.userId.trim() : null;

  let workspaceName = req.query.workspaceName
    ? req.query.workspaceName.trim()
    : null;
  let tradeType = req.query.tradeType
    ? req.query.tradeType.trim().toUpperCase()
    : null;
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
};

const approveRecordsPurchase = (req, res) => {
  let payload = req.body;
  let accountId = payload.accountId ? payload.accountId.trim() : null;
  let tradeType = payload.tradeType
    ? payload.tradeType.trim().toUpperCase()
    : null;
  let countryCode = payload.countryCode
    ? payload.countryCode.trim().toUpperCase()
    : null;
  let tradeYear = payload.tradeYear ? payload.tradeYear : null;
  let tradeRecords = payload.tradeRecords ? payload.tradeRecords : null;

  const dataBucket = WorkspaceSchema.deriveDataBucket(
    tradeType,
    countryCode,
    tradeYear
  );
  let aggregationParamsPack = {
    matchExpressions: payload.matchExpressions,
    recordsSelections: payload.recordsSelections,
  };

  WorkspaceModel.findShipmentRecordsIdentifierAggregation(
    aggregationParamsPack,
    dataBucket,
    (error, shipmentDataIdsPack) => {
      if (error) {
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        let bundle = {};
        if (!shipmentDataIdsPack) {
          res.status(200).json(bundle);
        } else {
          WorkspaceModel.findShipmentRecordsPurchasableCountAggregation(
            accountId,
            tradeType,
            tradeYear,
            countryCode,
            shipmentDataIdsPack.shipmentRecordsIdentifier,
            (error, approvePurchasePack) => {
              if (error) {
                res.status(500).json({
                  message: "Internal Server Error",
                });
              } else {
                //
                if (!approvePurchasePack) {
                  bundle.purchasableRecords = tradeRecords;
                } else {
                  bundle.purchasableRecords =
                    approvePurchasePack.purchasable_records_count;
                }
                bundle.totalRecords = tradeRecords;

                findPurchasePointsByRole(req ,(error, availableCredits) => {
                    if (error) {
                      res.status(500).json({
                        message: "Internal Server Error",
                      });
                    } else {
                      bundle.availableCredits = availableCredits;
                      res.status(200).json(bundle);
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
};

const approveRecordsPurchaseEngine = (req, res) => {
  let payload = req.body;
  let accountId = payload.accountId ? payload.accountId.trim() : null;
  let tradeType = payload.tradeType
    ? payload.tradeType.trim().toUpperCase()
    : null;
  let country = payload.country ? payload.country.trim().toUpperCase() : null;
  let tradeRecords = payload.tradeRecords ? payload.tradeRecords : null;

  const dataBucket = WorkspaceSchema.deriveDataBucket(tradeType, country);
  let aggregationParamsPack = {
    matchExpressions: payload.matchExpressions,
    recordsSelections: payload.recordsSelections,
  };

  WorkspaceModel.findShipmentRecordsIdentifierAggregationEngine(
    aggregationParamsPack,
    dataBucket,
    (error, shipmentDataIdsPack) => {
      if (error) {
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        //
        let bundle = {};
        if (!shipmentDataIdsPack) {
          res.status(200).json(bundle);
        } else {
          WorkspaceModel.findShipmentRecordsPurchasableCountAggregation(
            accountId,
            tradeType,
            country,
            shipmentDataIdsPack.shipmentRecordsIdentifier,
            (error, approvePurchasePack) => {
              if (error) {
                res.status(500).json({
                  message: "Internal Server Error",
                });
              } else {
                //
                if (!approvePurchasePack) {
                  bundle.purchasableRecords = tradeRecords;
                } else {
                  bundle.purchasableRecords =
                    approvePurchasePack.purchasable_records_count;
                }
                bundle.totalRecords = tradeRecords;

                findPurchasePointsByRole(req,(error, availableCredits) => {
                    if (error) {
                      res.status(500).json({
                        message: "Internal Server Error",
                      });
                    } else {
                      bundle.availableCredits = availableCredits;
                      res.status(200).json(bundle);
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
};

const addRecords = (req, res) => {
  let payload = req.body;
  const workspace = WorkspaceSchema.buildWorkspace(payload);

  const dataBucket = WorkspaceSchema.deriveDataBucket(
    payload.tradeType,
    payload.country
  );

  instantiate(payload.workspaceId, workspace, (error, workspaceIdData) => {
    if (error) {
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      let workspaceId = workspaceIdData.toString();
      if (!workspaceId) {
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        let workspaceDataBucket =
          WorkspaceSchema.deriveWorkspaceBucket(workspaceId);
        let aggregationParamsPack = {
          matchExpressions: payload.matchExpressions,
          recordsSelections: payload.recordsSelections,
        };

        WorkspaceModel.findShipmentRecordsIdentifierAggregation(
          aggregationParamsPack,
          dataBucket,
          (error, shipmentDataIdsPack) => {
            if (error) {
              res.status(500).json({
                message: "Internal Server Error",
              });
            } else {
              let bundle = {};
              if (!shipmentDataIdsPack) {
                // TODO: Send Result IF No Records :: Add criteria at client-side
                res.status(200).json(bundle);
              } else {
                WorkspaceModel.findShipmentRecordsPurchasableAggregation(
                  payload.accountId,
                  payload.tradeType,
                  payload.tradeYear,
                  payload.countryCodeISO3,
                  shipmentDataIdsPack.shipmentRecordsIdentifier,
                  (error, purchasableRecords) => {
                    if (error) {
                      res.status(500).json({
                        message: "Internal Server Error",
                      });
                    } else {
                      if (!purchasableRecords) {
                        bundle.purchasableRecords = payload.tradeRecords;
                        bundle.purchaseRecordsList =
                          shipmentDataIdsPack.shipmentRecordsIdentifier;
                        payload.tradePurchasedRecords =
                          shipmentDataIdsPack.shipmentRecordsIdentifier;
                      } else {
                        bundle.purchasableRecords =
                          purchasableRecords.purchasable_records_count;
                        bundle.purchaseRecordsList =
                          purchasableRecords.purchase_records;
                        payload.tradePurchasedRecords =
                          purchasableRecords.purchase_records;
                      }
                      bundle.totalRecords = payload.tradeRecords;

                      findPurchasePointsByRole(req, (error, availableCredits) => {
                          if (error) {
                            res.status(500).json({
                              message: "Internal Server Error",
                            });
                          } else {
                            bundle.availableCredits = availableCredits;

                            if (
                              bundle.availableCredits >=
                              bundle.purchasableRecords * 1
                            ) {
                              //
                              WorkspaceModel.addRecordsAggregation(
                                aggregationParamsPack,
                                dataBucket,
                                workspaceDataBucket,
                                payload.indexSpecifications,
                                (error, workspaceRecordsAddition) => {
                                  if (error) {
                                    //
                                    res.status(500).json({
                                      message: "Internal Server Error",
                                    });
                                  } else {
                                    //
                                    if (workspaceRecordsAddition.merged) {
                                      const workspacePurchase =
                                        WorkspaceSchema.buildRecordsPurchase(
                                          payload
                                        );

                                      WorkspaceModel.updatePurchaseRecordsKeeper(
                                        workspacePurchase,
                                        (error, workspacePuchaseUpdate) => {
                                          if (error) {
                                            //
                                            res.status(500).json({
                                              message: "Internal Server Error",
                                            });
                                          } else {
                                            WorkspaceModel.findShipmentRecordsCount(
                                              workspaceDataBucket,
                                              (error, shipmentEstimate) => {
                                                if (error) {
                                                  //
                                                  res.status(500).json({
                                                    message:
                                                      "Internal Server Error",
                                                  });
                                                } else {
                                                  WorkspaceModel.updateRecordMetrics(
                                                    workspaceId,
                                                    workspaceDataBucket,
                                                    payload.tradeYear,
                                                    shipmentEstimate,
                                                    (
                                                      error,
                                                      workspaceRecordsMetricsUpdate
                                                    ) => {
                                                      if (error) {
                                                        //
                                                        res.status(500).json({
                                                          message:
                                                            "Internal Server Error",
                                                        });
                                                      } else {
                                                        updatePurchasePointsByRole(req,WorkspaceSchema.POINTS_CONSUME_TYPE_DEBIT,bundle.purchasableRecords,
                                                          (error, accountMetricsUpdate) => {
                                                            if (error) {
                                                              //
                                                              res
                                                                .status(500)
                                                                .json({
                                                                  message:
                                                                    "Internal Server Error",
                                                                });
                                                            } else {
                                                              res
                                                                .status(200)
                                                                .json({
                                                                  id:
                                                                    accountMetricsUpdate.modifiedCount !=
                                                                      0
                                                                      ? workspace.name
                                                                      : null,
                                                                });
                                                            }
                                                          }
                                                        );
                                                      }
                                                    }
                                                  );
                                                }
                                              }
                                            );
                                          }
                                        }
                                      );
                                    } else {
                                      res.status(500).json({
                                        message: "Internal Server Error",
                                      });
                                    }
                                  }
                                }
                              );
                            } else {
                              // TODO: Return with insufficient funds
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
};

const addRecordsEngine = (req, res) => {
  let payload = req.body;
  const workspace = WorkspaceSchema.buildWorkspace(payload);
  var workspaceElasticConfig = payload.workspaceElasticConfig;

  const dataBucket = WorkspaceSchema.deriveDataBucket(
    payload.tradeType,
    payload.country
  );

  instantiate(payload.workspaceId, workspace, (error, workspaceIdData) => {
    if (error) {
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      let workspaceId = workspaceIdData.toString();
      if (!workspaceId) {



        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        let workspaceDataBucket =
          WorkspaceSchema.deriveWorkspaceBucket(workspaceId);
        let aggregationParamsPack = {
          matchExpressions: payload.matchExpressions,
          recordsSelections: payload.recordsSelections,
        };

        WorkspaceModel.findShipmentRecordsIdentifierAggregationEngine(
          aggregationParamsPack,
          dataBucket,
          (error, shipmentDataIdsPack) => {
            if (error) {
              res.status(500).json({
                message: "Internal Server Error",
              });
            } else {
              let bundle = {};
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
                        bundle.purchaseRecordsList =
                          shipmentDataIdsPack.shipmentRecordsIdentifier;
                        payload.tradePurchasedRecords =
                          shipmentDataIdsPack.shipmentRecordsIdentifier;
                      } else {
                        if (purchasableRecords.purchase_records.length > 0) {
                          aggregationParamsPack.recordsSelections =
                            purchasableRecords.purchase_records;
                        } else {
                          aggregationParamsPack.recordsSelections = null;
                        }
                        bundle.purchasableRecords =
                          purchasableRecords.purchasable_records_count;
                        bundle.purchaseRecordsList =
                          purchasableRecords.purchase_records;
                        payload.tradePurchasedRecords =
                          purchasableRecords.purchase_records;
                      }
                      bundle.totalRecords = payload.tradeRecords;

                      findPurchasePointsByRole(req,(error, availableCredits) => {
                          if (error) {
                            res.status(500).json({
                              message: "Internal Server Error",
                            });
                          } else {
                            bundle.availableCredits = availableCredits;

                            if (
                              bundle.availableCredits >=
                              bundle.purchasableRecords * payload.points_purchase
                            ) {
                              WorkspaceModel.addRecordsAggregationEngine(
                                aggregationParamsPack,
                                payload.accountId,
                                payload.userId,
                                dataBucket,
                                workspaceDataBucket,
                                payload.indexSpecifications,
                                workspaceElasticConfig,
                                (error, workspaceRecordsAddition) => {
                                  if (error) {
                                    //
                                    res.status(500).json({
                                      message: "Internal Server Error",
                                    });
                                  } else {
                                    //
                                    if (workspaceRecordsAddition.merged) {
                                      const workspacePurchase =
                                        WorkspaceSchema.buildRecordsPurchase(
                                          payload
                                        );

                                      WorkspaceModel.updatePurchaseRecordsKeeper(
                                        workspacePurchase,
                                        (error, workspacePuchaseUpdate) => {
                                          if (error) {
                                            //
                                            res.status(500).json({
                                              message: "Internal Server Error",
                                            });
                                          } else {
                                            WorkspaceModel.findShipmentRecordsCountEngine(
                                              workspaceDataBucket,
                                              (error, shipmentEstimate) => {
                                                if (error) {
                                                  //
                                                  res.status(500).json({
                                                    message:
                                                      "Internal Server Error",
                                                  });
                                                } else {
                                                  WorkspaceModel.updateRecordMetrics(
                                                    workspaceId,
                                                    workspaceDataBucket,
                                                    payload.tradeYear,
                                                    shipmentEstimate,
                                                    (
                                                      error,
                                                      workspaceRecordsMetricsUpdate
                                                    ) => {
                                                      if (error) {
                                                        //
                                                        res.status(500).json({
                                                          message:
                                                            "Internal Server Error",
                                                        });
                                                      } else {
                                                        updatePurchasePointsByRole(req,WorkspaceSchema.POINTS_CONSUME_TYPE_DEBIT,bundle.purchasableRecords,
                                                          (error,accountMetricsUpdate) => {
                                                            if (error) {
                                                              //
                                                              res
                                                                .status(500)
                                                                .json({
                                                                  message:
                                                                    "Internal Server Error",
                                                                });
                                                            } else {
                                                              res
                                                                .status(200)
                                                                .json({
                                                                  id:
                                                                    accountMetricsUpdate.modifiedCount !=
                                                                      0
                                                                      ? workspace.name
                                                                      : null,
                                                                });
                                                            }
                                                          }
                                                        );
                                                      }
                                                    }
                                                  );
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
};

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
};

// const fetchShipmentRecordsFile = async (req, res = undefined) => {

//   let payload = req.query;
//   let workspaceBucket = (payload.workspaceBucket) ? payload.workspaceBucket : null;
//   let workspaceTaxonomyId = (payload.workspaceTaxonomyId) ? payload.workspaceTaxonomyId : null;

//   const dataBucket = workspaceBucket;

//   //
//   try {
//     var result = await WorkspaceModel.findShipmentRecordsDownloadAggregationEngine(dataBucket, 0, 50000)

//     let bundle = {};

//     bundle.data = shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_RECORDS];
//     bundle.headers = shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_FIELD_HEADERS];

//     try {
//       FileHelper.writeDataToCSVFile(path.join('./downloads/'), workspaceBucket, bundle.headers, bundle.data, () => {
//         var options = {
//           root: path.join('./downloads/'),
//           dotfiles: 'deny',
//           headers: {
//             'x-timestamp': Date.now(),
//             'x-sent': true
//           }
//         };

//         res.sendFile(workspaceBucket + '.csv', options, function (err) {
//           if (err) {
//             throw err;
//           } else {

//           }
//         });
//       });

//     } catch (err) {
//       res.status(500).json({
//         message: 'Internal Server Error',
//       });
//     }
//   }
//   catch (err) {
//     res.status(500).json({
//       message: 'Internal Server Error',
//     });
//   }

// };

function defaultDownloadCase(res, payload, dataBucket) {
  WorkspaceModel.findShipmentRecordsDownloadAggregationEngine(
    dataBucket,
    0,
    10000,
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

function analyseData(mappedResult, res, payload) {
  console.log("AnAl", payload);

  let isHeaderFieldExtracted = false;
  let shipmentDataPack = {};
  shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_RECORDS] = [];
  shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_FIELD_HEADERS] = [];

  let newArr = [...mappedResult];

  newArr = mappedResult.sort(function (a, b) {
    return new Date(a.IMP_DATE) - new Date(b.IMP_DATE);
  });

  var getFirstIMPDate = moment(newArr[0].IMP_DATE).format("DD-MMMM-YYYY");
  var getLasIMPDate = moment(newArr[newArr.length - 1].IMP_DATE).format(
    "DD-MMMM-YYYY"
  );

  newArr.forEach((hit) => {
    hit.IMP_DATE = moment(hit.IMP_DATE).format("DD-MM-YYYY");

    if (payload) {
      let row_values = [];
      for (let fields of payload.allFields) {
        if (fields.toLowerCase() == "be_no")
          continue

        else if (fields.toLowerCase() == "bill_no")
          continue
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
      var headerArr = [];
      if (payload) headerArr = payload.allFields;
      else headerArr = Object.keys(hit);

      if ((payload.country && payload.trade && payload.country.toLowerCase() == 'india' && payload.trade.toLowerCase() == 'import')
        || (payload.indexNamePrefix && payload.indexNamePrefix.includes("ind") && payload.indexNamePrefix.includes("import"))) {
        let finalHeader = []
        for (let key of headerArr) {
          if (key.toLowerCase() == "be_no")
            continue
          if (INDIA_IMPORT_COLUMN_NAME[key]) {
            finalHeader.push(INDIA_IMPORT_COLUMN_NAME[key])
          }
          else {
            finalHeader.push(key)
          }
        }
        headerArr = [...finalHeader]
      }
      else if ((payload.country && payload.trade && payload.country.toLowerCase() == 'india' && payload.trade.toLowerCase() == 'export')
        || (payload.indexNamePrefix && payload.indexNamePrefix.includes("ind") && payload.indexNamePrefix.includes("export"))) {
        let finalHeader = []
        for (let key of headerArr) {
          if (key.toLowerCase() == "bill_no")
            continue
          if (INDIA_EXPORT_COLUMN_NAME[key]) {
            finalHeader.push(INDIA_EXPORT_COLUMN_NAME[key])
          }
          else {
            finalHeader.push(key)
          }
        }
        headerArr = [...finalHeader]

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
    var text = " DATA";
    var title = "";
    var recordText = getFirstIMPDate + " to " + getLasIMPDate;
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
    // worksheet.mergeCells("C1", "E4");
    // let titleRow = worksheet.getCell("C1");
    // titleRow.value = title;
    // titleRow.font = {
    //   name: "Calibri",
    //   size: 16,
    //   underline: "single",
    //   bold: true,
    //   color: { argb: "0085A3" },
    // };
    // titleRow.alignment = { vertical: "middle", horizontal: "center" };
    Date;

    let d = new Date();
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    //Add Image
    let myLogoImage = workbook.addImage({
      filename: "./public/images/logo-new.jpg",
      extension: "jpeg",
    });
    // worksheet.mergeCells("A1:B4");
    worksheet.addImage(myLogoImage, "A1:A4");
    worksheet.add;

    // let date =
    //   d.getDate() + "-" + monthNames[d.getMonth()] + "-" + d.getFullYear();
    // let dateCell = worksheet.getCell("D1");
    // dateCell.value = date;
    // dateCell.font = {
    //   name: "Calibri",
    //   size: 12,
    //   bold: true,
    // };
    // dateCell.alignment = { vertical: "middle", horizontal: "center" };
    // worksheet.mergeCells("C1:C4");
    // worksheet.getCell("C1:C3").value = date;
    // worksheet.getCell("G1").value = "John Doe";
    // worksheet.getCell("C1", "D4").value = date;
    // worksheet.mergeCells("F1", "Z4");
    // worksheet.addRow(date, "C1");
    // worksheet.mergeCells("AA1", "AG4");

    //Blank Row

    //Adding Header Row

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
    // worksheet.getColumn(7).width = 60;
    // worksheet.getColumn(26).width = 60;
    // worksheet.getColumn(3).width = 20;
    workbook.xlsx.write(res, function () {
      res.end();
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
  // res.status(200).json(bundle);
}

function filteredWorkspaceCase(res, payload, dataBucket) {
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

  WorkspaceModel.findAnalyticsShipmentStatisticsAggregation(
    payload,
    dataBucket,
    0,
    0,
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

        res.status(200).json(bundle);
      }
    }
  );
};

const fetchAnalyticsShipmentsTradersByPattern = (req, res) => {
  let payload = req.query;
  //let tradeType = (payload.tradeType) ? payload.tradeType.trim().toUpperCase() : null;
  //let countryCode = (payload.countryCode) ? payload.countryCode.trim().toUpperCase() : null;
  //let tradeYear = (payload.tradeYear) ? payload.tradeYear : null;
  let workspaceBucket = payload.workspaceBucket
    ? payload.workspaceBucket
    : null;
  let searchTerm = payload.searchTerm ? payload.searchTerm : null;
  let searchField = payload.searchField ? payload.searchField : null;

  const dataBucket = workspaceBucket;

  //

  WorkspaceModel.findAnalyticsShipmentsTradersByPattern(
    searchTerm,
    searchField,
    dataBucket,
    (error, shipmentTraders) => {
      if (error) {
        //
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
};

const fetchAnalyticsShipmentsTradersByPatternEngine = (req, res) => {
  let payload = req.body;
  //let tradeType = (payload.tradeType) ? payload.tradeType.trim().toUpperCase() : null;
  //let countryCode = (payload.countryCode) ? payload.countryCode.trim().toUpperCase() : null;
  //let tradeYear = (payload.tradeYear) ? payload.tradeYear : null;

  //commented
  // let workspaceBucket = payload.workspaceBucket
  //   ? payload.workspaceBucket
  //   : null;
  // let searchTerm = payload.searchTerm ? payload.searchTerm : null;
  // let searchField = payload.searchField ? payload.searchField : null;

  // const dataBucket = workspaceBucket;

  //

  let tradeType = payload.tradeType
    ? payload.tradeType.trim().toUpperCase()
    : null;
  let country = payload.countryCode
    ? payload.countryCode.trim().toUpperCase()
    : null;
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
    indexNamePrefix:
      country.toLocaleLowerCase() + "_" + tradeType.toLocaleLowerCase(),
  };

  WorkspaceModel.findAnalyticsShipmentsTradersByPatternEngine(
    searchTerm,
    searchField,
    tradeMeta,
    payload.workspaceBucket,
    (error, shipmentTraders) => {
      if (error) {
        //
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
};

function updatePurchasePointsByRole(req , consumeType , purchasableRecords , cb) {
  let accountId = req.user.account_id ;
  let userId = req.user.user_id ;
  let role = req.user.role ;
  
  purchasableRecords = (req.body.country == "India") ? purchasableRecords : (purchasableRecords*5) ;

  if(role == "ADMINISTRATOR"){
    AccountModel.updatePurchasePoints(accountId ,consumeType ,purchasableRecords ,
      (error,result) => {
          if(error) {
            cb(error);
          }
      })
  }
  UserModel.updateUserPurchasePoints(userId, consumeType, purchasableRecords,
    (error, result) => {
      if (error) {
        cb(error);
      }
      else {
        cb(null, result);
      }
  })

}

async function findPurchasePointsByRole(req , cb) {
  let accountId = req.user.account_id ;
  let userId = req.user.user_id ;
  let role = req.user.role ;

  if(role == "ADMINISTRATOR"){
    AccountModel.findPurchasePoints(accountId ,
      (error,result) => {
          if(error) {
            cb(error);
          }
          else {
            cb(null , result);
          }
      })
  }
  else {
    try {
      const userPurchasePoints =await UserModel.findUserPurchasePoints(userId) ;
      cb(null , userPurchasePoints);
    }
    catch(error){
      cb(error);
    }
  }
}

module.exports = {
  create,
  remove,
  addRecords,
  addRecordsEngine,
  approveRecordsPurchaseEngine,
  updateRecordMetrics,
  fetchByUser,
  shareWorkspace,
  listWorkspace,
  fetchWorkspaceTemplates,
  verifyWorkspaceExistence,
  approveRecordsPurchase,
  fetchAnalyticsSpecification,
  fetchAnalyticsShipmentsRecords,
  // fetchShipmentRecordsFile,
  fetchAnalyticsShipmentRecordsFile,
  fetchAnalyticsShipmentsStatistics,
  fetchAnalyticsShipmentsTradersByPattern,
  fetchAnalyticsShipmentsTradersByPatternEngine,
};
