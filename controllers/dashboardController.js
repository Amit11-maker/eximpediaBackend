const TAG = 'dashboardController';
const DashboardModel = require('../models/dashboardModel');
const ObjectID = require('mongodb').ObjectID;
const fetchDashboardDetails = (req, res) => {
    let accountId = (req.user.account_id) ? req.user.account_id.trim() : null;
    DashboardModel.findByAccount(accountId, (error, dashboardData) => {
        if (error) {
            res.status(500).json({
                message: 'Internal Server Error',
            });
        } else {
            if (dashboardData) {
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
module.exports = {
    fetchDashboardDetails
};
