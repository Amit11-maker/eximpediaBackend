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
        saveQueryLimits.max_save_query.remaining_limit = (saveQueryLimits?.max_save_query?.remaining_limit + 1);
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
  try {
    let payload = req.body;
    let saveQueryLimits = await queryModal.getSaveQueryLimit(payload.accountId);

    if (saveQueryLimits?.max_save_query?.remaining_limit > 0) {
      queryModal.findTradeShipmentRecordsAggregationEngine(payload, async (error, shipmentDataPack) => {
        if (error) {
          logger.error(` SAVE QUERY CONTROLLER ================== ${JSON.stringify(error)}`);
          res.status(500).json({
            message: "Internal Server Error",
            error: error
          });
        } else{
          res.status(200).json({
            data: shipmentDataPack,
          });
        }
      });

    }else {
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
