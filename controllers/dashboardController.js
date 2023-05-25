const TAG = "dashboardController";
const DashboardModel = require("../models/dashboardModel");
const ObjectID = require("mongodb").ObjectID;
const { logger } = require("../config/logger");

const fetchConsumersDashboardDetails = async (req, res) => {
  let accountId = req.user.account_id ? req.user.account_id.trim() : null;
  let userId = req.user.user_id ? req.user.user_id.trim() : null;
  let getCountryCount = "";
  if (req.user.role == "ADMINISTRATOR") {
    try {
      const dashboardData = await fetchConsumersDashboardByAccount(accountId);
      res.status(200).json({
        data: dashboardData,
        role: req.user.role,
      });
    } catch (error) {
      if (error == "Data missing") {
        res.status(404).json({
          data: {
            type: "MISSING",
            msg: "Details Unavailable",
            desc: "Details Not Found",
          },
        });
      } else {
        logger.log(` DASHBOARD CONTROLLER == ${JSON.stringify(error)}`);
        res.status(500).json({
          message: "Internal Server Error",
        });
      }
    }
  } else {
    try {
      const dashboardData = await fetchConsumersDashboardByUser(userId);
      res.status(200).json({
        data: dashboardData,
        role: req.user.role,
      });
    } catch (error) {
      if (error == "Data missing") {
        res.status(404).json({
          data: {
            type: "MISSING",
            msg: "Details Unavailable",
            desc: "Details Not Found",
          },
        });
      } else {
        logger.log(` DASHBOARD CONTROLLER == ${JSON.stringify(error)}`);
        res.status(500).json({
          message: "Internal Server Error",
        });
      }
    }
  }
};

async function fetchConsumersDashboardByAccount(accountId) {
  try {
    const consumerDetails = await DashboardModel.findConsumerByAccount(
      accountId
    );
    if (consumerDetails) {
      const lower = consumerDetails[0].countryArray.map((element) => {
        return element.toLowerCase();
      });
      const uniqueCount = new Set(lower).size;
      consumerDetails[0].countryArray = uniqueCount;

      return consumerDetails;
    } else {
      throw "Data missing";
    }
  } catch (error) {
    throw error;
  }
}

async function fetchConsumersDashboardByUser(userId) {
  try {
    const consumerDetails = await DashboardModel.findConsumerByUser(userId);
    if (consumerDetails) {
      const lower = consumerDetails[0].countryArray.map((element) => {
        return element.toLowerCase();
      });
      const uniqueCount = new Set(lower).size;
      consumerDetails[0].countryArray = uniqueCount;
      return consumerDetails;
    } else {
      throw "Data missing";
    }
  } catch (error) {
    throw error;
  }
}

const fetchProvidersDashboardDetails = (req, res) => {
  DashboardModel.findProviderByAccount((error, customersCount) => {
    if (error) {
      logger.log(
        ` DASHBOARD CONTROLLER================== ${JSON.stringify(error)}`
      );
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      if (customersCount) {
        DashboardModel.fetchWorkspaceCount((error, workspaceCount) => {
          if (error) {
            logger.log(
              ` DASHBOARD CONTROLLER================== ${JSON.stringify(error)}`
            );
            res.status(500).json({
              message: "Internal Server Error",
            });
          } else {
            if (workspaceCount) {
              DashboardModel.fetchUplodedCountries(
                (error, uploadedCountries) => {
                  if (error) {
                    logger.log(
                      ` DASHBOARD CONTROLLER================== ${JSON.stringify(
                        error
                      )}`
                    );
                    res.status(500).json({
                      message: "Internal Server Error",
                    });
                  } else {
                    DashboardModel.fetchRecordCount((error, record) => {
                      if (error) {
                        logger.log(
                          ` DASHBOARD CONTROLLER================== ${JSON.stringify(
                            error
                          )}`
                        );
                        res.status(500).json({
                          message: "Internal Server Error",
                        });
                      } else {
                        if (record) {
                          res.status(200).json({
                            data: {
                              totalCustomers: customersCount[0].totalCustomers,
                              workspaceCount:
                                workspaceCount[0].totalWorkspaceCount,
                              uploadedCountries:
                                uploadedCountries[0].totalUplodedCountries,
                              totalRecords: record[0].totalRecords,
                            },
                          });
                        }
                      }
                    });
                  }
                }
              );
            }
          }
        });
      } else {
        res.status(404).json({
          data: {
            type: "MISSING",
            msg: "Details Unavailable",
            desc: "Details Not Found",
          },
        });
      }
    }
  });
};

module.exports = {
  fetchConsumersDashboardDetails,
  fetchProvidersDashboardDetails,
};
