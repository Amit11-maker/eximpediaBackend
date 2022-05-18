const TAG = "dashboardController";
const DashboardModel = require("../models/dashboardModel");
const ObjectID = require("mongodb").ObjectID;


const fetchConsumersDashboardDetails = async (req, res) => {
  let accountId = req.user.account_id ? req.user.account_id.trim() : null;
  let userId = req.user.user_id ? req.user.user_id.trim() : null;
  let getCountryCount = "";
  if (req.user.role == "ADMINISTRATOR") {
    const dashboardData = await fetchConsumersDashboardByAccount(accountId, res);
    res.status(200).json({
      data: dashboardData,
    })
  }
  else {
    const dashboardData =   await fetchConsumersDashboardByUser(accountId , userId , res);
    res.status(200).json({
      data: dashboardData,
    })
  }
}


const fetchProvidersDashboardDetails = (req, res) => {
  DashboardModel.findProviderByAccount((error, customersCount) => {
    if (error) {
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      if (customersCount) {
        DashboardModel.fetchWorkspaceCount((error, workspaceCount) => {
          if (error) {
            console.log(error);
            res.status(500).json({
              message: "Internal Server Error",
            });
          } else {
            if (workspaceCount) {
              DashboardModel.fetchUplodedCountries(
                (error, uploadedCountries) => {
                  if (error) {
                    res.status(500).json({
                      message: "Internal Server Error",
                    });
                  } else {
                    DashboardModel.fetchRecordCount((error, record) => {
                      if (error) {
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

async function fetchConsumersDashboardByAccount(accountId, res) {
  try {
    const consumerDetails = await DashboardModel.findConsumerByAccount(accountId);
    if (consumerDetails) {
      consumerDetails[0].countryArray = consumerDetails[0].countryArray.length;
      var count = 0;

      if (consumerDetails[0].recordPurchased.length > 0) {
        for (let countryRecord of consumerDetails[0].recordPurchased) {
          count += countryRecord.records.length;
        }
      }
      consumerDetails[0].recordPurchased = count;
      return consumerDetails;
    } else {
      res.status(404).json({
        data: {
          type: "MISSING",
          msg: "Details Unavailable",
          desc: "Details Not Found",
        },
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

async function fetchConsumersDashboardByUser(accountId, userId ,res) {
  try {
    const consumerDetails = await DashboardModel.findConsumerByUser(userId);
    if (consumerDetails) {
      consumerDetails[0].countryArray = consumerDetails[0].countryArray.length;
      // var count = 0;

      // if (consumerDetails[0].recordPurchased.length > 0) {
      //   for (let countryRecord of consumerDetails[0].recordPurchased) {
      //     count += countryRecord.records.length;
      //   }
      // }
      // consumerDetails[0].recordPurchased = count;
      return consumerDetails;
    } else {
      res.status(404).json({
        data: {
          type: "MISSING",
          msg: "Details Unavailable",
          desc: "Details Not Found",
        },
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

module.exports = {
  fetchConsumersDashboardDetails,
  fetchProvidersDashboardDetails,
}