const TAG = 'notificationController';

const EnvConfig = require('../config/envConfig');
const CronJob = require('cron').CronJob;
const NotificationModel = require('../models/notificationModel');
const { logger } = require("../config/logger");

const create = async (req, res) => {
    try {

        let payload = req.body;
        let notificationDetails = payload.notificationDetails;
        let notificationType = payload.notificationType;

        let createNotification = await NotificationModel.add(notificationDetails, notificationType)
        if (createNotification.insertedId) {
            res.status(200).json({
                id: notification.insertedId
            });
        } else {
            logger.info(createNotification);
        }

    } catch (error) {
        logger.error("NOTIFICATION CONTROLLER ==================",JSON.stringify(error));
        res.status(500).json({
            message: 'Internal Server Error',
        });
    }
};

const fetchNotification = (req, res) => {

    NotificationModel.getGeneralNotifications((error, generalNotification) => {
        if (error) {
            logger.error("NOTIFICATION CONTROLLER ==================",JSON.stringify(error));
            res.status(500).json({
                message: 'Internal Server Error',
            });
        } else {
            NotificationModel.getUserNotifications(req.user.user_id, (error, userNotification) => {
                if (error) {
                    logger.error("NOTIFICATION CONTROLLER ==================",JSON.stringify(error));
                    res.status(500).json({
                        message: 'Internal Server Error',
                    });
                } else {
                    logger.info(req.user.account_id);
                    NotificationModel.getAccountNotifications(req.user.account_id, (error, accountNotification) => {
                        if (error) {
                            logger.error("NOTIFICATION CONTROLLER ==================",JSON.stringify(error));
                            res.status(500).json({
                                message: 'Internal Server Error',
                            });
                        } else {
                            let notificationsArr = [...generalNotification, ...userNotification, ...accountNotification]
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
    let idArr = req.body.idArr;
    NotificationModel.updateNotifications(idArr);
    res.status(200).json({
        message: 'updated successfully',
    });
}

const notificationLoop = async (notifications) => {
    try {

        for (let notification of notifications) {
            if (notification) {
                let notificationType = 'general'
                let notificationData = {}
                notificationData.heading = 'Data Updation'
                notificationData.description = `We have updated new records for ${notification}.`
                let result = await NotificationModel.add(notificationData, notificationType);
            } else {
                logger.info(JSON.stringify(notification));
            }
        }
    } catch (error) {
        logger.error("NOTIFICATION CONTROLLER ==================",JSON.stringify(error));
        throw error
    }
}

const job = new CronJob({
    cronTime: ' 0 0 0 * * *', onTick: async () => {
        try {
            if (process.env.MONGODBNAME != "dev") {
                let notifications = await NotificationModel.checkDataUpdation();
                if (notifications.length === 0) {
                    logger.info("No new data updation");
                } else {
                    let dataUpdation = await notificationLoop(notifications)
                }
                
                logger.info("end of this cron job");
            }
        } catch (e) {
            logger.error("NOTIFICATION CONTROLLER ==================",JSON.stringify(e));
            throw e
        }

    }, start: false, timeZone: 'Asia/Kolkata' //'Asia/Singapore'
});
job.start();



module.exports = {
    create,
    fetchNotification,
    updateNotificationStatus
};
