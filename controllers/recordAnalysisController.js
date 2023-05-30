const TAG = "recordAnalysisController";
const RecordAnalysisModel = require('../models/recordAnalysisModel');
const { logger } = require("../config/logger");


async function getRecordAnalysis(req, res) {
  let payload = req.body;
  delete payload.groupExpressions;
  payload.accountId = req.user.account_id;
  try {

    let shipmentRecords = await RecordAnalysisModel.findAnalysisRecords(payload);

    res.status(200).json({
      "data": shipmentRecords.RECORD_SET
    })

  } catch (error) {
    logger.error("TRADE CONTROLLER : ", JSON.stringify(error));
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

module.exports = {
  getRecordAnalysis
}