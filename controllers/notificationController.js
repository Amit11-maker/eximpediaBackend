const TAG = 'notificationController';
const { logger } = require("../config/logger")
const EnvConfig = require('../config/envConfig');
const CronJob = require('cron').CronJob;
const NotificationModel = require('../models/notificationModel');
const MongoDbHandler = require("../db/mongoDbHandler")

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
            logger.info(JSON.stringify(createNotification));
        }

    } catch (error) {
        logger.error(`NOTIFICATION CONTROLLER ================== ${JSON.stringify(error)}`);
        res.status(500).json({
            message: 'Internal Server Error',
        });
    }
}

async function fetchNotification(req, res) {

    try {
        let generalNotifications = await NotificationModel.getGeneralNotifications();
        let accountNotifications = await NotificationModel.getAccountNotifications(req.user.account_id);
        let userNotifications = await NotificationModel.getUserNotifications(req.user.user_id);

        let notificationsArr = {}
        generalNotifications.sort((a, b) => (a.created_at < b.created_at) ? 1 : ((b.created_at < a.created_at) ? -1 : 0))
        accountNotifications.sort((a, b) => (a.created_at < b.created_at) ? 1 : ((b.created_at < a.created_at) ? -1 : 0))
        userNotifications.sort((a, b) => (a.created_at < b.created_at) ? 1 : ((b.created_at < a.created_at) ? -1 : 0))
        notificationsArr.generalNotification = generalNotifications;
        notificationsArr.userNotification = userNotifications;
        notificationsArr.accountNotification = accountNotifications;
        
        res.status(200).json(notificationsArr);
    } catch (error) {
        logger.error(`NOTIFICATION CONTROLLER ================== ${JSON.stringify(error)}`);
        res.status(500).json({
            message: 'Internal Server Error',
        });
    }

}

const updateNotificationStatus = async (req, res) => {
    try {
        let notificationArr = req.body;
        if (Object.keys(notificationArr).length > 0) {
            await NotificationModel.updateNotification(notificationArr) ;
            
            res.status(201).json({
                message : "Noifications Updated Successfully"
            });
        } else {
            res.status(201).json({
                message : "Nothing to update"
            });
        }
    } catch (error) {
        logger.error(JSON.stringify(error))
        res.status(500).json(error)
    }
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
                return result
            } else {
                logger.info(JSON.stringify(notification));
            }
        }
    } catch (error) {
        logger.error(`NOTIFICATION CONTROLLER ================== ${JSON.stringify(error)}`);
        throw error
    }
}
const fetchAccount = async () => {
    let accounts = await MongoDbHandler.getDbInstance()
        .collection(MongoDbHandler.collections.account)
        .find({
            "is_active": 1
        })
        .project({
            "_id": 1,
            "plan_constraints.access_validity_interval": 1
        })
        .toArray()

    return accounts
}

const checkExpiredAccount = async (account) => {
    if ((((new Date(account.plan_constraints.access_validity_interval.end_date) - new Date())
        / 86400000) <= 15)) {
        let notificationInfo = {}
        notificationInfo.account_id = [account._id]
        notificationInfo.heading = 'Recharge'
        notificationInfo.description = `Your plan validity is about to expire. Kindly recharge immediately .`
        let notificationType = 'account'
        let expireNotification = await NotificationModel.add(notificationInfo, notificationType)
        return expireNotification
    }
}

const job = new CronJob({
    cronTime: '0 0 0 * * *', onTick: async () => {
        try {
            if (process.env.MONGODBNAME != "dev") {
                let notifications = await NotificationModel.checkDataUpdation();
                if (notifications.length === 0) {
                    logger.info("No new data updation");
                } else {
                    let dataUpdation = await notificationLoop(notifications)
                }
                let accounts = await fetchAccount()
                if (accounts.length > 0) {
                    for (let account of accounts) {
                        let expiredAccount = await checkExpiredAccount(account)
                    }
                }
                logger.info("end of this cron job");
            }
        } catch (e) {
            logger.error(`NOTIFICATION CONTROLLER ================== ${JSON.stringify(e)}`);
            throw e
        }

    }, start: false, timeZone: 'Asia/Kolkata' //'Asia/Singapore'
});
job.start();

// job to update notifications which are more than 15 days older
const jobToUpdateNotifications = new CronJob({
    cronTime: '0 0 0 1,10,20 * *', onTick: async () => {
        try {
            if (process.env.MONGODBNAME != "dev") {
                await NotificationModel.updateNotificationsStatus();
                logger.info("end of this cron job");
            }
        } catch (e) {
            logger.error(`NOTIFICATION CONTROLLER ================== ${JSON.stringify(e)}`);
            throw e ;
        }

    }, start: false, timeZone: 'Asia/Kolkata'
});
jobToUpdateNotifications.start()

module.exports = {
    create,
    fetchNotification,
    updateNotificationStatus
}
