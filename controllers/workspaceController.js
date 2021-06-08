const TAG = 'workspaceController';

const path = require('path');

const WorkspaceModel = require('../models/workspaceModel');
const WorkspaceSchema = require('../schemas/workspaceSchema');

const AccountModel = require('../models/accountModel');

const FileHelper = require('../helpers/fileHelper');

const create = (req, res) => {

  let payload = req.body;
  const workspace = WorkspaceSchema.buildWorkspace(payload);
  WorkspaceModel.add(workspace, (error, workspaceEntry) => {
    if (error) {
      //console.log(error);
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        id: workspaceEntry.insertedId
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

  let workspaceId = (req.params.workspaceId) ? req.params.workspaceId.trim() : null;

  let recordsYear = (req.body.recordsYear) ? req.body.recordsYear.trim().toUpperCase() : null;
  let recordsCount = (req.body.recordsCount != null) ? req.body.recordsCount : 0;

  WorkspaceModel.updateRecordMetrics(workspaceId, null, recordsYear, recordsCount, (error, workspaceEntry) => {
    if (error) {
      //console.log(error);
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        id: (workspaceEntry.modifiedCount != 0) ? workspaceId : null
      });
    }
  });

};

const fetchByUser = (req, res) => {

  let userId = (req.params.userId) ? req.params.userId.trim() : null;

  let tradeType = (req.query.tradeType) ? req.query.tradeType.trim().toUpperCase() : null;
  let countryCode = (req.query.countryCode) ? req.query.countryCode.trim().toUpperCase() : null;
  let tradeYear = (req.query.tradeYear) ? req.query.tradeYear.trim().toUpperCase() : null;
  let filters = {
    tradeType: tradeType,
    countryCode: countryCode,
    tradeYear: tradeYear
  };

  WorkspaceModel.findByUser(userId, filters, (error, workspaces) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        data: workspaces
      });
    }
  });

};

const fetchWorkspaceTemplates = (req, res) => {

  let accountId = (req.params.accountId) ? req.params.accountId.trim() : null;
  let userId = (req.params.userId) ? req.params.userId.trim() : null;
  let tradeType = (req.query.tradeType) ? req.query.tradeType.trim().toUpperCase() : null;
  let countryCode = (req.query.countryCode) ? req.query.countryCode.trim().toUpperCase() : null;

  WorkspaceModel.findTemplates(accountId, userId, tradeType, countryCode, (error, workspaces) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        data: workspaces
      });
    }
  });

};

const verifyWorkspaceExistence = (req, res) => {

  let accountId = (req.params.accountId) ? req.params.accountId.trim() : null;
  let userId = (req.params.userId) ? req.params.userId.trim() : null;

  let workspaceName = (req.query.workspaceName) ? req.query.workspaceName.trim() : null;
  let tradeType = (req.query.tradeType) ? req.query.tradeType.trim().toUpperCase() : null;
  let countryCode = (req.query.countryCode) ? req.query.countryCode.trim().toUpperCase() : null;

  WorkspaceModel.findByName(accountId, userId, tradeType, countryCode, workspaceName, (error, workspaceData) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        data: (workspaceData) ? true : false
      });
    }
  });

};


const approveRecordsPurchase = (req, res) => {

  let payload = req.body;
  let accountId = (payload.accountId) ? payload.accountId.trim() : null;
  let tradeType = (payload.tradeType) ? payload.tradeType.trim().toUpperCase() : null;
  let countryCode = (payload.countryCode) ? payload.countryCode.trim().toUpperCase() : null;
  let tradeYear = (payload.tradeYear) ? payload.tradeYear : null;
  let tradeRecords = (payload.tradeRecords) ? payload.tradeRecords : null;

  const dataBucket = WorkspaceSchema.deriveDataBucket(tradeType, countryCode, tradeYear);
  let aggregationParamsPack = {
    matchExpressions: payload.matchExpressions,
    recordsSelections: payload.recordsSelections
  };

  WorkspaceModel.findShipmentRecordsIdentifierAggregation(aggregationParamsPack, dataBucket, (error, shipmentDataIdsPack) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      let bundle = {};
      if (!shipmentDataIdsPack) {
        res.status(200).json(bundle);
      } else {

        WorkspaceModel.findShipmentRecordsPurchasableCountAggregation(accountId, tradeType, tradeYear, countryCode,
          shipmentDataIdsPack.shipmentRecordsIdentifier, (error, approvePurchasePack) => {
            if (error) {
              res.status(500).json({
                message: 'Internal Server Error',
              });
            } else {
              //console.log(approvePurchasePack);
              if (!approvePurchasePack) {
                bundle.purchasableRecords = tradeRecords;
              } else {
                bundle.purchasableRecords = approvePurchasePack.purchasable_records_count;
              }
              bundle.totalRecords = tradeRecords;

              AccountModel.findPurchasePoints(accountId, (error, availableCredits) => {
                if (error) {
                  res.status(500).json({
                    message: 'Internal Server Error',
                  });
                } else {
                  bundle.availableCredits = availableCredits;
                  res.status(200).json(bundle);
                }
              });

            }
          });

      }
    }

  });

};

const approveRecordsPurchaseEngine = (req, res) => {

  let payload = req.body;
  let accountId = (payload.accountId) ? payload.accountId.trim() : null;
  let tradeType = (payload.tradeType) ? payload.tradeType.trim().toUpperCase() : null;
  let countryCode = (payload.countryCode) ? payload.countryCode.trim().toUpperCase() : null;
  let tradeYear = (payload.tradeYear) ? payload.tradeYear : null;
  let tradeRecords = (payload.tradeRecords) ? payload.tradeRecords : null;

  const dataBucket = WorkspaceSchema.deriveDataBucket(tradeType, countryCode, tradeYear);
  let aggregationParamsPack = {
    matchExpressions: payload.matchExpressions,
    recordsSelections: payload.recordsSelections
  };

  WorkspaceModel.findShipmentRecordsIdentifierAggregationEngine(aggregationParamsPack, dataBucket, (error, shipmentDataIdsPack) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      let bundle = {};
      if (!shipmentDataIdsPack) {
        res.status(200).json(bundle);
      } else {
        //console.log(shipmentDataIdsPack);
        WorkspaceModel.findShipmentRecordsPurchasableCountAggregation(accountId, tradeType, tradeYear, countryCode,
          shipmentDataIdsPack.shipmentRecordsIdentifier, (error, approvePurchasePack) => {
            if (error) {
              res.status(500).json({
                message: 'Internal Server Error',
              });
            } else {
              //console.log(approvePurchasePack);
              if (!approvePurchasePack) {
                bundle.purchasableRecords = tradeRecords;
              } else {
                bundle.purchasableRecords = approvePurchasePack.purchasable_records_count;
              }
              bundle.totalRecords = tradeRecords;

              AccountModel.findPurchasePoints(accountId, (error, availableCredits) => {
                if (error) {
                  res.status(500).json({
                    message: 'Internal Server Error',
                  });
                } else {
                  bundle.availableCredits = availableCredits;
                  res.status(200).json(bundle);
                }
              });

            }
          });

      }
    }

  });

};


const addRecords = (req, res) => {

  let payload = req.body;
  const workspace = WorkspaceSchema.buildWorkspace(payload);

  const dataBucket = WorkspaceSchema.deriveDataBucket(payload.tradeType, payload.countryCodeISO3, payload.tradeYear);

  instantiate(payload.workspaceId, workspace, (error, workspaceIdData) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {

      let workspaceId = workspaceIdData.toString();
      if (!workspaceId) {
        res.status(500).json({
          message: 'Internal Server Error',
        });
      } else {

        let workspaceDataBucket = WorkspaceSchema.deriveWorkspaceBucket(workspaceId);
        let aggregationParamsPack = {
          matchExpressions: payload.matchExpressions,
          recordsSelections: payload.recordsSelections
        };

        WorkspaceModel.findShipmentRecordsIdentifierAggregation(aggregationParamsPack, dataBucket, (error, shipmentDataIdsPack) => {
          if (error) {
            res.status(500).json({
              message: 'Internal Server Error',
            });
          } else {
            let bundle = {};
            if (!shipmentDataIdsPack) {
              // TODO: Send Result IF No Records :: Add criteria at client-side
              res.status(200).json(bundle);
            } else {

              WorkspaceModel.findShipmentRecordsPurchasableAggregation(payload.accountId, payload.tradeType, payload.tradeYear, payload.countryCodeISO3,
                shipmentDataIdsPack.shipmentRecordsIdentifier, (error, purchasableRecords) => {
                  if (error) {
                    res.status(500).json({
                      message: 'Internal Server Error',
                    });
                  } else {
                    if (!purchasableRecords) {
                      bundle.purchasableRecords = payload.tradeRecords;
                      bundle.purchaseRecordsList = shipmentDataIdsPack.shipmentRecordsIdentifier;
                      payload.tradePurchasedRecords = shipmentDataIdsPack.shipmentRecordsIdentifier;
                    } else {
                      bundle.purchasableRecords = purchasableRecords.purchasable_records_count;
                      bundle.purchaseRecordsList = purchasableRecords.purchase_records;
                      payload.tradePurchasedRecords = purchasableRecords.purchase_records;
                    }
                    bundle.totalRecords = payload.tradeRecords;

                    AccountModel.findPurchasePoints(payload.accountId, (error, availableCredits) => {
                      if (error) {
                        res.status(500).json({
                          message: 'Internal Server Error',
                        });
                      } else {

                        bundle.availableCredits = availableCredits;

                        if (bundle.availableCredits >= (bundle.purchasableRecords * 1)) {
                          //console.log(payload.indexSpecifications);
                          WorkspaceModel.addRecordsAggregation(aggregationParamsPack, dataBucket, workspaceDataBucket, payload.indexSpecifications, (error, workspaceRecordsAddition) => {
                            if (error) {
                              //console.log(error);
                              res.status(500).json({
                                message: 'Internal Server Error',
                              });
                            } else {
                              //console.log(workspaceRecordsAddition);
                              if (workspaceRecordsAddition.merged) {

                                const workspacePurchase = WorkspaceSchema.buildRecordsPurchase(payload);

                                WorkspaceModel.updatePurchaseRecordsKeeper(workspacePurchase, (error, workspacePuchaseUpdate) => {
                                  if (error) {
                                    //console.log(error);
                                    res.status(500).json({
                                      message: 'Internal Server Error',
                                    });
                                  } else {

                                    WorkspaceModel.findShipmentRecordsCount(workspaceDataBucket, (error, shipmentEstimate) => {
                                      if (error) {
                                        //console.log(error);
                                        res.status(500).json({
                                          message: 'Internal Server Error',
                                        });
                                      } else {

                                        WorkspaceModel.updateRecordMetrics(workspaceId, workspaceDataBucket, payload.tradeYear, shipmentEstimate, (error, workspaceRecordsMetricsUpdate) => {
                                          if (error) {
                                            //console.log(error);
                                            res.status(500).json({
                                              message: 'Internal Server Error',
                                            });
                                          } else {

                                            AccountModel.updatePurchasePoints(payload.accountId, WorkspaceSchema.POINTS_CONSUME_TYPE_DEBIT, bundle.purchasableRecords, (error, accountMetricsUpdate) => {
                                              if (error) {
                                                //console.log(error);
                                                res.status(500).json({
                                                  message: 'Internal Server Error',
                                                });
                                              } else {
                                                res.status(200).json({
                                                  id: (accountMetricsUpdate.modifiedCount != 0) ? workspace.name : null
                                                });
                                              }
                                            });

                                          }

                                        });

                                      }
                                    });

                                  }

                                });

                              } else {
                                res.status(500).json({
                                  message: 'Internal Server Error',
                                });
                              }

                            }
                          });



                        } else {
                          // TODO: Return with insufficient funds
                        }

                      }
                    });

                  }
                });

            }
          }

        });

      }

    }

  });

};

const addRecordsEngine = (req, res) => {

  let payload = req.body;
  const workspace = WorkspaceSchema.buildWorkspace(payload);

  const dataBucket = WorkspaceSchema.deriveDataBucket(payload.tradeType, payload.countryCodeISO3, payload.tradeYear);

  instantiate(payload.workspaceId, workspace, (error, workspaceIdData) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {

      let workspaceId = workspaceIdData.toString();
      if (!workspaceId) {
        res.status(500).json({
          message: 'Internal Server Error',
        });
      } else {

        let workspaceDataBucket = WorkspaceSchema.deriveWorkspaceBucket(workspaceId);
        let aggregationParamsPack = {
          matchExpressions: payload.matchExpressions,
          recordsSelections: payload.recordsSelections
        };

        WorkspaceModel.findShipmentRecordsIdentifierAggregationEngine(aggregationParamsPack, dataBucket, (error, shipmentDataIdsPack) => {
          if (error) {
            res.status(500).json({
              message: 'Internal Server Error',
            });
          } else {
            let bundle = {};
            if (!shipmentDataIdsPack) {
              // TODO: Send Result If No Records :: Add criteria at client-side
              res.status(200).json(bundle);
            } else {

              WorkspaceModel.findShipmentRecordsPurchasableAggregation(payload.accountId, payload.tradeType, payload.tradeYear, payload.countryCodeISO3,
                shipmentDataIdsPack.shipmentRecordsIdentifier, (error, purchasableRecords) => {
                  if (error) {
                    res.status(500).json({
                      message: 'Internal Server Error',
                    });
                  } else {
                    if (!purchasableRecords) {
                      bundle.purchasableRecords = payload.tradeRecords;
                      bundle.purchaseRecordsList = shipmentDataIdsPack.shipmentRecordsIdentifier;
                      payload.tradePurchasedRecords = shipmentDataIdsPack.shipmentRecordsIdentifier;
                    } else {
                      bundle.purchasableRecords = purchasableRecords.purchasable_records_count;
                      bundle.purchaseRecordsList = purchasableRecords.purchase_records;
                      payload.tradePurchasedRecords = purchasableRecords.purchase_records;
                    }
                    bundle.totalRecords = payload.tradeRecords;

                    AccountModel.findPurchasePoints(payload.accountId, (error, availableCredits) => {
                      if (error) {
                        res.status(500).json({
                          message: 'Internal Server Error',
                        });
                      } else {

                        bundle.availableCredits = availableCredits;

                        if (bundle.availableCredits >= (bundle.purchasableRecords * 1)) {

                          //console.log(payload.indexSpecifications);
                          WorkspaceModel.addRecordsAggregationEngine(aggregationParamsPack, dataBucket, workspaceDataBucket, payload.indexSpecifications, (error, workspaceRecordsAddition) => {
                            if (error) {
                              //console.log(error);
                              res.status(500).json({
                                message: 'Internal Server Error',
                              });
                            } else {
                              //console.log(workspaceRecordsAddition);
                              if (workspaceRecordsAddition.merged) {

                                const workspacePurchase = WorkspaceSchema.buildRecordsPurchase(payload);

                                WorkspaceModel.updatePurchaseRecordsKeeper(workspacePurchase, (error, workspacePuchaseUpdate) => {
                                  if (error) {
                                    //console.log(error);
                                    res.status(500).json({
                                      message: 'Internal Server Error',
                                    });
                                  } else {

                                    WorkspaceModel.findShipmentRecordsCountEngine(workspaceDataBucket, (error, shipmentEstimate) => {
                                      if (error) {
                                        //console.log(error);
                                        res.status(500).json({
                                          message: 'Internal Server Error',
                                        });
                                      } else {

                                        WorkspaceModel.updateRecordMetrics(workspaceId, workspaceDataBucket, payload.tradeYear, shipmentEstimate, (error, workspaceRecordsMetricsUpdate) => {
                                          if (error) {
                                            //console.log(error);
                                            res.status(500).json({
                                              message: 'Internal Server Error',
                                            });
                                          } else {

                                            AccountModel.updatePurchasePoints(payload.accountId, WorkspaceSchema.POINTS_CONSUME_TYPE_DEBIT, bundle.purchasableRecords, (error, accountMetricsUpdate) => {
                                              if (error) {
                                                //console.log(error);
                                                res.status(500).json({
                                                  message: 'Internal Server Error',
                                                });
                                              } else {
                                                res.status(200).json({
                                                  id: (accountMetricsUpdate.modifiedCount != 0) ? workspace.name : null
                                                });
                                              }
                                            });

                                          }

                                        });

                                      }
                                    });

                                  }

                                });

                              } else {
                                res.status(500).json({
                                  message: 'Internal Server Error',
                                });
                              }

                            }
                          });

                        } else {
                          // TODO: Return with insufficient funds
                        }

                      }
                    });

                  }
                });

            }
          }

        });

      }

    }

  });

};


const fetchAnalyticsSpecification = (req, res) => {
  let userId = (req.params.userId) ? req.params.userId.trim() : null;
  let workspaceId = (req.params.workspaceId) ? req.params.workspaceId.trim() : null;

  WorkspaceModel.findAnalyticsSpecificationByUser(userId, workspaceId, (error, workspace) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        data: workspace
      });
    }
  });
};

const fetchAnalyticsShipmentsRecordsPreEngineMigration = (req, res) => {

  let payload = req.body;
  //let tradeType = (payload.tradeType) ? payload.tradeType.trim().toUpperCase() : null;
  //let countryCode = (payload.countryCode) ? payload.countryCode.trim().toUpperCase() : null;
  //let tradeYear = (payload.tradeYear) ? payload.tradeYear : null;
  let workspaceBucket = (payload.workspaceBucket) ? payload.workspaceBucket : null;
  let workspaceTotalRecords = (payload.workspaceTotalRecords) ? payload.workspaceTotalRecords : null;

  let pageKey = (payload.draw && payload.draw != 0) ? payload.draw : null;
  let offset = null;
  let limit = null;
  //Datatable JS Mode
  if (pageKey != null) {
    offset = (payload.start != null) ? payload.start : 0;
    limit = (payload.length != null) ? payload.length : 10;
  } else {
    offset = (payload.offset != null) ? payload.offset : 0;
    limit = (payload.limit != null) ? payload.limit : 10;
  }

  const dataBucket = workspaceBucket;

  //console.log(dataBucket);

  WorkspaceModel.findAnalyticsShipmentRecordsAggregation(payload, dataBucket, offset, limit, (error, shipmentDataPack) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      let bundle = {};

      if (!shipmentDataPack) {
        bundle.recordsTotal = 0;
        bundle.recordsFiltered = 0;
        bundle.error = "Unrecognised Shipments Response"; //Show if to be interpreted as error on client-side
      } else {
        let recordsTotal = (shipmentDataPack.SUMMARY_RECORDS.length > 0) ? shipmentDataPack.SUMMARY_RECORDS[0].count : 0;
        bundle.recordsTotal = (workspaceTotalRecords != null) ? workspaceTotalRecords : recordsTotal;
        bundle.recordsFiltered = recordsTotal;

        bundle.summary = {};
        bundle.filter = {};
        for (const prop in shipmentDataPack) {
          if (shipmentDataPack.hasOwnProperty(prop)) {
            if (prop.indexOf('SUMMARY') === 0) {
              if (prop === 'SUMMARY_RECORDS') {
                bundle.summary[prop] = recordsTotal;
              } else {
                bundle.summary[prop] = shipmentDataPack[prop];
              }
            }
            if (prop.indexOf('FILTER') === 0) {
              bundle.filter[prop] = shipmentDataPack[prop];
            }
            //console.log(`shipmentDataPack.${prop} = ${shipmentDataPack[prop]}`);
          }
        }
      }

      if (pageKey) {
        bundle.draw = pageKey;
      }
      bundle.data = shipmentDataPack.RECORD_SET;
      res.status(200).json(bundle);
    }
  });
};

const fetchAnalyticsShipmentsRecords = (req, res) => {


  let payload = req.body;
  let workspaceBucket = (payload.workspaceBucket) ? payload.workspaceBucket : null;
  let workspaceTotalRecords = (payload.workspaceTotalRecords) ? payload.workspaceTotalRecords : null;

  let pageKey = (payload.draw && payload.draw != 0) ? payload.draw : null;
  let offset = null;
  let limit = null;

  //Datatable JS Mode
  if (pageKey != null) {
    offset = (payload.start != null) ? payload.start : 0;
    limit = (payload.length != null) ? payload.length : 10;
  } else {
    offset = (payload.offset != null) ? payload.offset : 0;
    limit = (payload.limit != null) ? payload.limit : 10;
  }

  const dataBucket = workspaceBucket;

  //console.log(dataBucket);

  if (!payload.isEngine) {
    WorkspaceModel.findAnalyticsShipmentRecordsAggregation(payload, dataBucket, offset, limit, (error, shipmentDataPack) => {
      if (error) {
        res.status(500).json({
          message: 'Internal Server Error',
        });
      } else {
        let bundle = {};

        if (!shipmentDataPack) {
          bundle.recordsTotal = 0;
          bundle.recordsFiltered = 0;
          bundle.error = "Unrecognised Shipments Response"; //Show if to be interpreted as error on client-side
        } else {
          let recordsTotal = (shipmentDataPack.SUMMARY_RECORDS.length > 0) ? shipmentDataPack.SUMMARY_RECORDS[0].count : 0;
          bundle.recordsTotal = (workspaceTotalRecords != null) ? workspaceTotalRecords : recordsTotal;
          bundle.recordsFiltered = recordsTotal;

          bundle.summary = {};
          bundle.filter = {};
          for (const prop in shipmentDataPack) {
            if (shipmentDataPack.hasOwnProperty(prop)) {
              if (prop.indexOf('SUMMARY') === 0) {
                if (prop === 'SUMMARY_RECORDS') {
                  bundle.summary[prop] = recordsTotal;
                } else {
                  bundle.summary[prop] = shipmentDataPack[prop];
                }
              }
              if (prop.indexOf('FILTER') === 0) {
                bundle.filter[prop] = shipmentDataPack[prop];
              }
              //console.log(`shipmentDataPack.${prop} = ${shipmentDataPack[prop]}`);
            }
          }
        }

        if (pageKey) {
          bundle.draw = pageKey;
        }
        bundle.data = shipmentDataPack.RECORD_SET;
        res.status(200).json(bundle);
      }
    });
  } else {
    WorkspaceModel.findAnalyticsShipmentRecordsAggregationEngine(payload, dataBucket, offset, limit, (error, shipmentDataPack) => {
      if (error) {
        res.status(500).json({
          message: 'Internal Server Error',
        });
      } else {
        let bundle = {};

        if (!shipmentDataPack) {
          bundle.recordsTotal = 0;
          bundle.recordsFiltered = 0;
          bundle.error = "Unrecognised Shipments Response"; //Show if to be interpreted as error on client-side
        } else {
          let recordsTotal = (shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_SUMMARY].length > 0) ? shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_SUMMARY][0].count : 0;
          bundle.recordsTotal = (workspaceTotalRecords != null) ? workspaceTotalRecords : recordsTotal;
          bundle.recordsFiltered = recordsTotal;

          bundle.summary = {};
          bundle.filter = {};
          for (const prop in shipmentDataPack) {
            if (shipmentDataPack.hasOwnProperty(prop)) {
              if (prop.indexOf('SUMMARY') === 0) {
                if (prop === 'SUMMARY_RECORDS') {
                  bundle.summary[prop] = recordsTotal;
                } else {
                  bundle.summary[prop] = shipmentDataPack[prop];
                }
              }
              if (prop.indexOf('FILTER') === 0) {
                bundle.filter[prop] = shipmentDataPack[prop];
              }
            }
          }

        }

        if (pageKey) {
          bundle.draw = pageKey;
        }

        bundle.data = shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_RECORDS];
        res.status(200).json(bundle);
      }
    });
  }

};


const fetchShipmentRecordsFile = (req, res) => {

  let payload = req.query;
  let workspaceBucket = (payload.workspaceBucket) ? payload.workspaceBucket : null;
  let workspaceTaxonomyId = (payload.workspaceTaxonomyId) ? payload.workspaceTaxonomyId : null;

  const dataBucket = workspaceBucket;

  //console.log(dataBucket);

  WorkspaceModel.findShipmentRecordsDownloadAggregationEngine(dataBucket, 0, 10000, (error, shipmentDataPack) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      let bundle = {};

      bundle.data = shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_RECORDS];
      bundle.headers = shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_FIELD_HEADERS];

      try {
        FileHelper.writeDataToCSVFile(path.join('./downloads/'), workspaceBucket, bundle.headers, bundle.data, () => {
          var options = {
            root: path.join('./downloads/'),
            dotfiles: 'deny',
            headers: {
              'x-timestamp': Date.now(),
              'x-sent': true
            }
          };

          res.sendFile(workspaceBucket + '.csv', options, function (err) {
            if (err) {
              throw err;
            } else {
              console.log('Sent:', workspaceBucket);
            }
          });
        });

      } catch (err) {
        res.status(500).json({
          message: 'Internal Server Error',
        });
      }

    }
  });

};

const fetchAnalyticsShipmentRecordsFile = (req, res) => {

  let payload = req.query;
  let workspaceBucket = (payload.workspaceBucket) ? payload.workspaceBucket : null;

  const dataBucket = workspaceBucket;

  //console.log(dataBucket);

  WorkspaceModel.findAnalyticsShipmentRecordsDownloadAggregationEngine(payload, dataBucket, offset, limit, (error, shipmentDataPack) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      let bundle = {};

      bundle.data = shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_RECORDS];
      res.status(200).json(bundle);
    }
  });

};

const fetchAnalyticsShipmentsStatistics = (req, res) => {

  let payload = req.body;
  //let tradeType = (payload.tradeType) ? payload.tradeType.trim().toUpperCase() : null;
  //let countryCode = (payload.countryCode) ? payload.countryCode.trim().toUpperCase() : null;
  //let tradeYear = (payload.tradeYear) ? payload.tradeYear : null;
  let workspaceBucket = (payload.workspaceBucket) ? payload.workspaceBucket : null;
  let workspaceTotalRecords = (payload.workspaceTotalRecords) ? payload.workspaceTotalRecords : null;

  const dataBucket = workspaceBucket;

  //console.log(dataBucket);

  WorkspaceModel.findAnalyticsShipmentStatisticsAggregation(payload, dataBucket, 0, 0, (error, shipmentDataPack) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      let bundle = {};

      if (!shipmentDataPack) {
        bundle.recordsTotal = 0;
        bundle.recordsFiltered = 0;
        bundle.error = "Unrecognised Shipments Response"; //Show if to be interpreted as error on client-side
      } else {
        let recordsTotal = (shipmentDataPack.SUMMARY_RECORDS.length > 0) ? shipmentDataPack.SUMMARY_RECORDS[0].count : 0;
        bundle.recordsTotal = (workspaceTotalRecords != null) ? workspaceTotalRecords : recordsTotal;
        bundle.recordsFiltered = recordsTotal;

        bundle.summary = {};
        bundle.filter = {};
        for (const prop in shipmentDataPack) {
          if (shipmentDataPack.hasOwnProperty(prop)) {
            if (prop.indexOf('SUMMARY') === 0) {
              if (prop === 'SUMMARY_RECORDS') {
                bundle.summary[prop] = recordsTotal;
              } else {
                bundle.summary[prop] = shipmentDataPack[prop];
              }
            }
            if (prop.indexOf('FILTER') === 0) {
              bundle.filter[prop] = shipmentDataPack[prop];
            }
            //console.log(`shipmentDataPack.${prop} = ${shipmentDataPack[prop]}`);
          }
        }
      }

      res.status(200).json(bundle);
    }
  });
};


const fetchAnalyticsShipmentsTradersByPattern = (req, res) => {

  let payload = req.query;
  //let tradeType = (payload.tradeType) ? payload.tradeType.trim().toUpperCase() : null;
  //let countryCode = (payload.countryCode) ? payload.countryCode.trim().toUpperCase() : null;
  //let tradeYear = (payload.tradeYear) ? payload.tradeYear : null;
  let workspaceBucket = (payload.workspaceBucket) ? payload.workspaceBucket : null;
  let searchTerm = (payload.searchTerm) ? payload.searchTerm : null;
  let searchField = (payload.searchField) ? payload.searchField : null;

  const dataBucket = workspaceBucket;

  //console.log(dataBucket);

  WorkspaceModel.findAnalyticsShipmentsTradersByPattern(searchTerm, searchField, dataBucket, (error, shipmentTraders) => {
    if (error) {
      //console.log(error);
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        data: shipmentTraders
      });
    }
  });
};

const fetchAnalyticsShipmentsTradersByPatternEngine = (req, res) => {

  let payload = req.query;
  //let tradeType = (payload.tradeType) ? payload.tradeType.trim().toUpperCase() : null;
  //let countryCode = (payload.countryCode) ? payload.countryCode.trim().toUpperCase() : null;
  //let tradeYear = (payload.tradeYear) ? payload.tradeYear : null;
  let workspaceBucket = (payload.workspaceBucket) ? payload.workspaceBucket : null;
  let searchTerm = (payload.searchTerm) ? payload.searchTerm : null;
  let searchField = (payload.searchField) ? payload.searchField : null;

  const dataBucket = workspaceBucket;

  //console.log(dataBucket);

  WorkspaceModel.findAnalyticsShipmentsTradersByPatternEngine(searchTerm, searchField, dataBucket, (error, shipmentTraders) => {
    if (error) {
      //console.log(error);
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        data: shipmentTraders
      });
    }
  });
};



module.exports = {
  create,
  addRecords,
  addRecordsEngine,
  approveRecordsPurchaseEngine,
  updateRecordMetrics,
  fetchByUser,
  fetchWorkspaceTemplates,
  verifyWorkspaceExistence,
  approveRecordsPurchase,
  fetchAnalyticsSpecification,
  fetchAnalyticsShipmentsRecords,
  fetchShipmentRecordsFile,
  fetchAnalyticsShipmentRecordsFile,
  fetchAnalyticsShipmentsStatistics,
  fetchAnalyticsShipmentsTradersByPattern,
  fetchAnalyticsShipmentsTradersByPatternEngine
};
