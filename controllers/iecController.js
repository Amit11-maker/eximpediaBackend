const TAG = "iecController";
const IECModel = require("../models/iecModel");
const { logger } = require("../config/logger");

const fetchIECDetails = async (req, res) => {
  let iecNumber = req.params.iecNumber;
  try {
    const iecData = await IECModel.fetchIECDetails(iecNumber);
    if (iecData && iecData.length > 0) {
      res.status(200).json({
        data: iecData,
      });
    } else {
      res.status(200).json({
        data: "No data is present for this respective IEC.",
      });
    }
  } catch (error) {
    logger.log(`IEC CONTROLLER ================== ${JSON.stringify(error)}`);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  fetchIECDetails,
};
