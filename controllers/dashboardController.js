const TAG = 'dashboardController';
const DashboardModel = require('../models/dashboardModel');
const ObjectID = require('mongodb').ObjectID;
const fetchConsumersDashboardDetails = (req, res) => {
    let accountId = (req.user.account_id) ? req.user.account_id.trim() : null;
    DashboardModel.findConsumerByAccount(accountId, (error, dashboardData) => {
        if (error) {
            console.log(error);
            res.status(500).json({
                message: 'Internal Server Error',
            });
        } else {
            if (dashboardData) {
                dashboardData[0].countryArray = new Set(dashboardData[0].countryArray).size
                var count = 0
                if (dashboardData[0].recordPurchased.length > 0) {
                    for (let countryRecord of dashboardData[0].recordPurchased) {
                        count += countryRecord.records.length
                    }
                }
                dashboardData[0].recordPurchased = count
                res.status(200).json({
                    data: dashboardData
                });
            } else {
                res.status(404).json({
                    data: {
                        type: 'MISSING',
                        msg: 'Details Unavailable',
                        desc: 'Details Not Found'
                    }
                });
            }
        }
    });
};
const fetchProvidersDashboardDetails = (req, res) => {
    DashboardModel.findProviderByAccount((error, customersCount) => {
        if (error) {
            res.status(500).json({
                message: 'Internal Server Error',
            });
        } else {
            if (customersCount) {
                DashboardModel.fetchWorkspaceCount((error, workspaceCount) => {
                    if (error) {
                        console.log(error);
                        res.status(500).json({
                            message: 'Internal Server Error',
                        });
                    } else {
                        if (workspaceCount) {
                            DashboardModel.fetchUplodedCountries((error, uploadedCountries) => {
                                if (error) {
                                    res.status(500).json({
                                        message: 'Internal Server Error',
                                    });
                                } else {
                                        DashboardModel.fetchRecordCount((error, record) => {
                                            if (error) {
                                                res.status(500).json({
                                                    message: 'Internal Server Error',
                                                });
                                            } else {
                                                if (record) {
                                                    res.status(200).json({
                                                        data: {
                                                            "totalCustomers": customersCount[0].totalCustomers,
                                                            "workspaceCount": workspaceCount[0].totalWorkspaceCount,
                                                            "uploadedCountries": uploadedCountries[0].totalUplodedCountries,
                                                            "totalRecords": record[0].totalRecords
                                                        }
                                                    });
                                                }
                                            }
                                        })
                                    }
                                }
                            )
                        }
                    }
                })
            } else {
                res.status(404).json({
                    data: {
                        type: 'MISSING',
                        msg: 'Details Unavailable',
                        desc: 'Details Not Found'
                    }
                });
            }
        }
    });
};
module.exports = {
    fetchConsumersDashboardDetails,
    fetchProvidersDashboardDetails,
};
