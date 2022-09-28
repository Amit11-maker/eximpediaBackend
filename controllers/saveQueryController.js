const queryModal = require("../models/saveQueryModel");
const querySchema = require("../schemas/saveQuerySchema");
const WorkspaceModel = require("../models/workspaceModel");
const { logger } = require("../config/logger");

const deleteUserQuery = async (req, res) => {
  try {
    let saveQueryLimits = await queryModal.getSaveQueryLimit(payload.accountId);

    let userId = req.params.id;
    queryModal.deleteQueryModal(userId, async (error, userEntry) => {
      if (error) {
        logger.error(` SAVE QUERY CONTROLLER ================== ${JSON.stringify(error)}`);
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        saveQueryLimits.max_save_query.consumed_limit = (saveQueryLimits?.max_save_query?.consumed_limit + 1);
        await queryModal.updateSaveQueryLimit(payload.accountId, saveQueryLimits);
        res.status(200).json({
          data: {
            msg: "Deleted Successfully!",
          },
        });
      }
    });
  } catch (error) {

  }
}

const updateUserEntry = (req, res) => {
  let userId = req.params.id;
  let payload = req.body;
  queryModal.updateQueryModal(userId, payload, (data) => {
    if (data) {
      res.status(200).json({
        data: data,
      });
    } else {
      logger.error("SAVE QUERY CONTROLLER ================== NO DATA");
      res.status(500).json({
        message: "Internal Server Error",
      });
    }
  });
}

const saveUserQuery = async (req, res) => {
  let payload = req.body;

  try {
    let saveQueryLimits = await queryModal.getSaveQueryLimit(payload.accountId);

    if (saveQueryLimits?.max_save_query?.consumed_limit > 0) {
      let tradeTotalRecords = payload.tradeTotalRecords ? payload.tradeTotalRecords : null;
      queryModal.findTradeShipmentRecordsAggregationEngine(payload, async (error, shipmentDataPack) => {
        if (error) {
          logger.error(` SAVE QUERY CONTROLLER ================== ${JSON.stringify(error)}`);
          res.status(500).json({
            message: "Internal Server Error",
            error: error
          });
        } else {
          let bundle = {}
          let alteredRecords = []
          bundle.consumedSaveQueryLimit = "";

          if (!shipmentDataPack) {
            bundle.recordsTotal = 0;
            bundle.recordsFiltered = 0;
            bundle.error = "Unrecognised Shipments Response"; //Show if to be interpreted as error on client-side
            if (payload.draw) {
              bundle.draw = payload.draw;
            }
            res.status(200).json(bundle);
          } else {
            let recordsTotal = (shipmentDataPack[querySchema.RESULT_PORTION_TYPE_SUMMARY].length > 0)
              ? shipmentDataPack[querySchema.RESULT_PORTION_TYPE_SUMMARY][0].count : 0;

            bundle.recordsTotal = (tradeTotalRecords != null) ? tradeTotalRecords : recordsTotal;
            bundle.recordsFiltered = recordsTotal;

            bundle.summary = {}
            bundle.filter = {}
            bundle.data = {}
            bundle.id = {}
            for (const prop in shipmentDataPack) {
              if (shipmentDataPack.hasOwnProperty(prop)) {
                if (prop.indexOf("SUMMARY") === 0) {
                  if (prop === "SUMMARY_RECORDS") {
                    bundle.summary[prop] = recordsTotal;
                  } else {
                    if (prop.toLowerCase() == "summary_shipments" && payload.country.toLowerCase() == "indonesia") {
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
                    logger.error(` SAVE QUERY CONTROLLER ================== ${JSON.stringify(error)}`);
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
                              logger.info(e.isFavorite);
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
                    if (payload.draw) {
                      bundle.draw = payload.draw;
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
                });
            } else {
              if (payload.draw) {
                bundle.draw = payload.draw;
              }

              if (payload.tableColumnData !== undefined) {
                if (payload.tableColumnData.length) {
                  for (let shipmentElement of shipmentDataPack[
                    querySchema.RESULT_PORTION_TYPE_RECORDS
                  ]) {
                    shipmentElement.isFavorite = false;
                    payload.tableColumnData.map((e) => {
                      if (e === shipmentElement.IMPORTER_NAME) {
                        logger.info(e.isFavorite);
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
              saveQueryLimits.max_save_query.consumed_limit = (saveQueryLimits?.max_save_query?.consumed_limit - 1);
              await queryModal.updateSaveQueryLimit(payload.accountId, saveQueryLimits);
              res.status(200).json(bundle);
            }
          }
        }
      });
    }
    else {
      res.status(409).json({
        message: "Max-Save-Query-Limit reached... Please contact administrator for further assistance."
      });
    }
  } catch (error) {
    logger.error(` SAVE QUERY CONTROLLER == ${JSON.stringify(error)}`);
    res.status(500).json({
      message: "Internal Server Error",
      error: error
    });
  }
}

const getQuery = async (req, res) => {
  const account_id = req.params.id;
  queryModal.findSaveQuery(account_id, (error, query) => {
    if (error) {
      logger.error(` SAVE QUERY CONTROLLER ================== ${JSON.stringify(error)}`);
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
