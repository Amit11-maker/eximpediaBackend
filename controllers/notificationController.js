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
                    console.log(req.user.account_id);
                    NotificationModel.getAccountNotifications(req.user.account_id, (error, accountNotification) => {
                        if (error) {
                            console.log(error);
                            res.status(500).json({
                                message: 'Internal Server Error',
                            });
                        } else {
                            var notificationsArr = [...generalNotification, ...userNotification, ...accountNotification]
                            notificationsArr.sort((a, b) => (a.created_at < b.created_at) ? 1 : ((b.created_at < a.created_at) ? -1 : 0))
                            // notificationsArr.sort((a, b) => (a.view === b.view) ? 0 : b.view ? -1 : 1)
                            res.status(200).json(notificationsArr)
                        }
                    });
                }
            });
        }
    });
}

const updateNotificationStatus = (req, res) => {
    var idArr = req.body.idArr;
    NotificationModel.updateNotifications(idArr);
    res.status(200).json({
        message: 'updated successfully',
    });
}

module.exports = {
    create,
    fetchNotification,
    updateNotificationStatus
};
