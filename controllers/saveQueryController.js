const queryModal = require("../models/saveQueryModel");
const querySchema = require("../schemas/saveQuerySchema");
const WorkspaceModel = require("../models/workspaceModel");
const { logger } = require("../config/logger");

const deleteUserQuery = (req, res) => {
  let userId = req.params.id;
  queryModal.deleteQueryModal(userId, (error, userEntry) => {
    if (error) {
      logger.error("SAVE QUERY CONTROLLER ==================",JSON.stringify(error));
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

const updateUserEntry = (req, res) => {
  let userId = req.params.id;
  let payload = req.body;
  queryModal.updateQueryModal(userId, payload, (data) => {
    if (data) {
      res.status(200).json({
        data: data,
      });
    } else {
      logger.error("SAVE QUERY CONTROLLER ==================","NO DATA");
      res.status(500).json({
        message: "Internal Server Error",
      });
    }
  });
};

const saveUserQuery = async (req, res) => {
  let payload = req.body;

  const resultType = payload.resultType ? payload.resultType.trim() : null;
  const accountId = payload.accountId ? payload.accountId.trim() : null;
  const userId = payload.userId ? payload.userId.trim() : null;

  const tradeType = payload.tradeType
    ? payload.tradeType.trim().toUpperCase()
    : null;
  const countryCode = payload.countryCode
    ? payload.countryCode.trim().toUpperCase()
    : null;
  const tradeYear = payload.tradeYear ? payload.tradeYear : null;
  const tradeTotalRecords = payload.tradeTotalRecords
    ? payload.tradeTotalRecords
    : null;

  const pageKey = payload.draw && payload.draw != 0 ? payload.draw : null;
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
  let country = payload.country ? payload.country.trim().toUpperCase() : null;

  const dataBucket = querySchema.deriveDataBucket(tradeType, country);
  // const dataBucket = "india_import"
  //

  const recordPurchaseKeeperParams = {
    tradeType: tradeType,
    countryCode: countryCode,
    tradeYear: tradeYear,
  };

  //findTradeShipmentRecordsAggregation findTradeShipmentRecordsAggregationEngine
  if (!payload.isEngine) {
    queryModal.findTradeShipmentRecordsAggregation(
      payload,
      dataBucket,
      accountId,
      recordPurchaseKeeperParams,
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
              shipmentDataPack[querySchema.RESULT_PORTION_TYPE_SUMMARY].length >
              0
                ? shipmentDataPack[querySchema.RESULT_PORTION_TYPE_SUMMARY][0]
                    .count
                : 0;
            bundle.recordsTotal =
              tradeTotalRecords != null ? tradeTotalRecords : recordsTotal;
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

            //

            // TODO: Taxonomy Mapping
            if (countryCode == "IND") {
              shipmentDataPack[querySchema.RESULT_PORTION_TYPE_RECORDS].forEach(
                (shipmentElement) => {
                  if (tradeType == "IMPORT") {
                    if (shipmentElement.purchased.length == 0) {
                      shipmentElement.BE_NO = "********";
                      shipmentElement.IEC = "********";
                      shipmentElement.IMPORTER_NAME = "********";
                      shipmentElement.ADDRESS = "********";
                      shipmentElement.CITY = "********";
                      shipmentElement.SUPPLIER_NAME = "********";
                      shipmentElement.SUPPLIER_ADDRESS = "********";
                    }
                  } else if (tradeType == "EXPORT") {
                    if (shipmentElement.purchased.length == 0) {
                      shipmentElement.BILL_NO = "********";
                      shipmentElement.IEC = "********";
                      shipmentElement.EXPORTER_NAME = "********";
                      shipmentElement.ADDRESS = "********";
                      shipmentElement.CITY = "********";
                      shipmentElement.BUYER_NAME = "********";
                      shipmentElement.BUYER_ADDRESS = "********";
                    }
                  }
                }
              );
            }
          }

          if (pageKey) {
            bundle.draw = pageKey;
          }

          bundle.data =
            shipmentDataPack[querySchema.RESULT_PORTION_TYPE_RECORDS];
          res.status(200).json(bundle);
        }
      }
    );
  } else {
    queryModal.findTradeShipmentRecordsAggregationEngine(
      payload,
      tradeType,
      country,
      dataBucket,
      userId,
      accountId,
      recordPurchaseKeeperParams,
      offset,
      limit,
      (error, shipmentDataPack) => {
        if (error) {
          logger.error("SAVE QUERY CONTROLLER ==================",JSON.stringify(error));
          res.status(500).json({
            message: "Internal Server Error",
          });
        } else {
          let bundle = {};
          let alteredRecords = [];

          if (!shipmentDataPack) {
            bundle.recordsTotal = 0;
            bundle.recordsFiltered = 0;
            bundle.error = "Unrecognised Shipments Response"; //Show if to be interpreted as error on client-side
            if (pageKey) {
              bundle.draw = pageKey;
            }
            res.status(200).json(bundle);
          } else {
            let recordsTotal =
              shipmentDataPack[querySchema.RESULT_PORTION_TYPE_SUMMARY].length >
              0
                ? shipmentDataPack[querySchema.RESULT_PORTION_TYPE_SUMMARY][0]
                    .count
                : 0;
            bundle.recordsTotal =
              tradeTotalRecords != null ? tradeTotalRecords : recordsTotal;
            bundle.recordsFiltered = recordsTotal;

            bundle.summary = {};
            bundle.filter = {};
            bundle.data = {};
            bundle.id = {};
            for (const prop in shipmentDataPack) {
              if (shipmentDataPack.hasOwnProperty(prop)) {
                if (prop.indexOf("SUMMARY") === 0) {
                  if (prop === "SUMMARY_RECORDS") {
                    bundle.summary[prop] = recordsTotal;
                  } else {
                    // console.log(prop, country)
                    if (
                      prop.toLowerCase() == "summary_shipments" &&
                      country.toLowerCase() == "indonesia"
                    ) {
                      bundle.summary[prop] = recordsTotal;
                    } else {
                      bundle.summary[prop] = shipmentDataPack[prop];
                    }
                  }
                }
                if (prop.indexOf("FILTER") === 0) {
                  bundle.filter[prop] = shipmentDataPack[prop];
                }
              }
            }
            if (req?.plan?.is_hidden) {
              WorkspaceModel.findShipmentRecordsPurchasableAggregation(
                payload.accountId,
                payload.tradeType.toUpperCase(),
                payload.country.toUpperCase(),
                shipmentDataPack.idArr,
                (error, purchasableRecords) => {
                  if (error) {
                    logger.error("SAVE QUERY CONTROLLER ==================",JSON.stringify(error));
                    res.status(500).json({
                      message: "Internal Server Error",
                    });
                  } else {

                    if (payload.tableColumnData !== undefined) {
                      if (payload.tableColumnData.length) {
                        for (let shipmentElement of shipmentDataPack[
                          querySchema.RESULT_PORTION_TYPE_RECORDS
                        ]) {
                          shipmentElement.isFavorite = false;
                          payload.tableColumnData.map((e) => {
                            if (e === shipmentElement.IMPORTER_NAME) {
                              console.log(e.isFavorite);
                              shipmentElement.isFavorite = e.isFavorite;
                            }
                          });
                        }
                      }
                    }


                    for (let shipmentElement of shipmentDataPack[
                      querySchema.RESULT_PORTION_TYPE_RECORDS
                    ]) {
                  
                      if (
                        purchasableRecords == undefined ||
                        purchasableRecords.purchase_records.includes(
                          shipmentElement._id
                        )
                      ) {
                        for (let columnName of payload.purchasable) {
                          shipmentElement[columnName] = "********";
                        }
                      }
                      alteredRecords.push({ ...shipmentElement });
                    }
                    if (pageKey) {
                      bundle.draw = pageKey;
                    }
                    if (alteredRecords.length > 0) {
                      shipmentDataPack[
                        querySchema.RESULT_PORTION_TYPE_RECORDS
                      ] = [...alteredRecords];
                    }

                    bundle.data = [
                      ...shipmentDataPack[
                        querySchema.RESULT_PORTION_TYPE_RECORDS
                      ],
                    ];
                    res.status(200).json(bundle);
                  }
                }
              );
            } else {
              if (pageKey) {
                bundle.draw = pageKey;
              }

              if (payload.tableColumnData !== undefined) {
                if (payload.tableColumnData.length) {
                  for (let shipmentElement of shipmentDataPack[
                    querySchema.RESULT_PORTION_TYPE_RECORDS
                  ]) {
                    shipmentElement.isFavorite = false;
                    payload.tableColumnData.map((e) => {
                      if (e === shipmentElement.IMPORTER_NAME) {
                        console.log(e.isFavorite);
                        shipmentElement.isFavorite = e.isFavorite;
                      }
                    });
                  }
                }
              }

              bundle.data = [
                ...shipmentDataPack[querySchema.RESULT_PORTION_TYPE_RECORDS],
              ];
              bundle.id = shipmentDataPack.id;
              res.status(200).json(bundle);
            }
          }
        }
      }
    );
  }
};

const getQuery = async (req, res) => {
  const account_id = req.params.id;
  queryModal.findSaveQuery(account_id, (error, query) => {
    if (error) {
      logger.error("SAVE QUERY CONTROLLER ==================",JSON.stringify(error));
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      res.status(200).json({
        data: query,
      });
    }
  });
};

module.exports = { deleteUserQuery, updateUserEntry, saveUserQuery, getQuery };
