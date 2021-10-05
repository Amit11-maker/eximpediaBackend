const TAG = 'activityController';

const EnvConfig = require('../config/envConfig');

const NotificationModel = require('../models/notificationModel');

const create = (req, res) => {

    let payload = req.body;
    let notificationDetails = payload.notificationDetails;
    let notificationType = payload.notificationType;

    NotificationModel.add(notificationDetails, notificationType, (error, notification) => {
        if (error) {
            console.log(error);
            res.status(500).json({
                message: 'Internal Server Error',
            });
        } else {
            res.status(200).json({

                id: notification.insertedId
            });
        }
    });
};

const fetchNotification = (req, res) => {


    NotificationModel.getGeneralNotifications((error, generalNotification) => {
        if (error) {
            console.log(error);
            res.status(500).json({
                message: 'Internal Server Error',
            });
        } else {
            NotificationModel.getUserNotifications(req.user.user_id, (error, userNotification) => {

                if (error) {
                    console.log(error);
                    res.status(500).json({
                        message: 'Internal Server Error',
                    });
                } else {
                    NotificationModel.getAccountNotifications(req.user.account_id, (error, accountNotification) => {


                        if (error) {
                            console.log(error);
                            res.status(500).json({
                                message: 'Internal Server Error',
                            });
                        } else {
                            res.status(200).json({
                                generalNotification,
                                userNotification,
                                accountNotification
                            });
                        }
                    });
                }
            });
        }
    });
}

module.exports = {
    create,
    fetchNotification
};
