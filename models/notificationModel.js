const TAG = 'notificationModel';

const ObjectID = require('mongodb').ObjectID;
const { logger } = require('../config/logger');
const MongoDbHandler = require('../db/mongoDbHandler');


const add = async (notificationDetails, notificationType) => {
    try {
        logger.info(JSON.stringify(notificationDetails, notificationType));
        if (notificationType == 'general') {
            notificationDetails.created_at = new Date().getTime()
            notificationDetails.view = false
            const result = await MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.general_notification_details)
                .insertOne(notificationDetails)
            return result
        }
        else if (notificationType == 'user') {
            let notificationArray = [];
            for (let userId of notificationDetails.user_id) {
                let notificationData = {}
                notificationData.user_id = ObjectID(userId)
                notificationData.heading = notificationDetails.heading
                notificationData.description = notificationDetails.description
                notificationData.link = notificationDetails.link
                notificationData.created_at = new Date().getTime()
                notificationData.view = false
                notificationArray.push({ ...notificationData })
            }
            let result = await MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.user_notification_details)
                .insertMany(notificationArray)
            return result
        }
        else if (notificationType == 'account') {
            let notificationArray = [];
            for (let accountId of notificationDetails.account_id) {
                // console.log(accountId);
                let notificationData = {}
                notificationData.account_id = ObjectID(accountId)
                notificationData.heading = notificationDetails.heading
                notificationData.description = notificationDetails.description
                notificationData.link = notificationDetails.link
                notificationData.created_at = new Date().getTime()
                notificationData.view = false
                notificationArray.push({ ...notificationData })
            }
            let result = await MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.account_notification_details)
                .insertMany(notificationArray)
            return result
        }
        else {
            throw { "msg": "please share correct notification type" };
        }
    } catch (error) {
        logger.error(` NOTIFICATION MODEL ================== ${JSON.stringify(error)}`);
        throw error
    }
};

const fetchAccountNotification = (accountId, timeStamp, flagValue) => {
    logger.info("in");
    if (accountId != undefined && timeStamp != undefined && flagValue != undefined) {
        return new Promise((resolve, reject) => {
            let aggregationClause = [{
                "$match": {
                    heading: "Recharge",
                    account_id: ObjectID(accountId),
                    created_at: {
                        $lt: timeStamp
                    },
                    flag: flagValue
                }
            }];

            MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.account_notification_details)
                .aggregate(aggregationClause, {
                    allowDiskUse: true
                }, function (err, cursor) {
                    if (err) logger.error(` NOTIFICATION MODEL ================== ${JSON.stringify(err)}`);
                    cursor.toArray(function (err, results) {
                        if (err) {
                            logger.error(` NOTIFICATION MODEL ================== ${JSON.stringify(err)}`);
                            console.log(err)
                        } else {
                            if (results.length > 0) {
                                // console.log(results);
                            }
                            else {
                                // console.log(results);
                                let notificationDetails = {
                                    "account_id": ObjectID(accountId),
                                    "heading": "Recharge",
                                    "description": `Your account is about to expire ${flagValue} days`,
                                    "link": "",
                                    "created_at": new Date().getTime(),
                                    flag: flagValue
                                }
                                MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.account_notification_details).insertOne(notificationDetails, function (err, result) {
                                    if (err) {
                                        logger.error(` NOTIFICATION MODEL ================== ${JSON.stringify(err)}`);
                                    } else {
                                        // console.log(result);
                                    }
                                });
                            }
                        }
                    });
                });
        });
    }
};


const getGeneralNotifications = (cb) => {
    let generalAggregationExpression = [{ $sort: { created_at: -1, view: 1 } }, {
        "$limit": 10
    }]
    MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.general_notification_details)
        .aggregate(generalAggregationExpression, {
            allowDiskUse: true
        },
            function (err, cursor) {
                if (err) {
                    logger.error(` NOTIFICATION MODEL ================== ${JSON.stringify(err)}`);
                    cb(err);
                } else {
                    cursor.toArray(function (err, results) {
                        if (err) {
                            logger.error(` NOTIFICATION MODEL ================== ${JSON.stringify(err)}`);

                            cb(err);
                        } else {
                            cb(null, results);
                        }
                    });
                }
            });
}

const getUserNotifications = (userId, cb) => {
    let userAggregationExpression = [{
        "$match": {
            user_id: ObjectID(userId)
        }
    }, {
        $sort: {
            created_at: -1, view: 1
        }
    }
        ,
    {
        "$limit": 10
    }]
    MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.user_notification_details)
        .aggregate(userAggregationExpression, {
            allowDiskUse: true
        },
            function (err, cursor) {
                if (err) {
                    logger.error(` NOTIFICATION MODEL ================== ${JSON.stringify(err)}`);
                    cb(err);
                } else {

                    cursor.toArray(function (err, results) {
                        if (err) {
                            logger.error(` NOTIFICATION MODEL ================== ${JSON.stringify(err)}`);
                            cb(err);
                        } else {
                            cb(null, results);
                        }
                    });
                }
            }
        );
}

const getAccountNotifications = (accountId, cb) => {
    let accountAggregationExpression = [{
        "$match": {
            account_id: ObjectID(accountId)
        }
    }, {
        $sort: {
            created_at: -1, view: 1
        }
    },
    {
        "$limit": 10
    }]
    MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.account_notification_details)
        .aggregate(accountAggregationExpression, {
            allowDiskUse: true
        },
            function (err, cursor) {
                if (err) {
                    logger.error(` NOTIFICATION MODEL ================== ${JSON.stringify(err)}`);
                    cb(err);
                } else {
                    cursor.toArray(function (err, results) {
                        if (err) {
                            logger.error(` NOTIFICATION MODEL ================== ${JSON.stringify(err)}`);
                            cb(err);
                        } else {
                            cb(null, results);
                        }
                    });
                }
            }
        );
}

const updateNotifications = (notificationIdArr) => {
    let notificationArr = []
    for (let id of notificationIdArr) {
        notificationArr.push(ObjectID(id))
    }

    let updateClause = {
        $set: {}
    };


    updateClause.$set = { view: true };


    MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.general_notification_details)
        .updateMany({ _id: { $in: notificationArr } }, updateClause

        )

    MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.user_notification_details)
        .updateMany({ _id: { $in: notificationArr } }, updateClause);

    MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.account_notification_details)
        .updateMany({ _id: { $in: notificationArr } }, updateClause);
}


const checkDataUpdation = async () => {
    try {
        let todayDate = new Date();
        let lte_ts = todayDate.getTime()
        let gte_ts = todayDate.setDate(todayDate.getDate() - 1);

        let query = {
            created_ts: { $gte: gte_ts, $lte: lte_ts }
        }
        let result = await MongoDbHandler.getDbInstance()
            .collection(MongoDbHandler.collections.ledger)
            .distinct('country', query)

        return result
    } catch (error) {
        logger.error(` NOTIFICATION MODEL ================== ${JSON.stringify(error)}`);
        throw error
    }

}



const checkFavoriteCompanyUpdation = async () => {
    let todayDate = new Date();
    let lte_ts = todayDate.getTime()
    let gte_ts = todayDate.setDate(todayDate.getDate() - 1);

    let query = {
        createdAt: { $gte: gte_ts, $lte: lte_ts }
    }
    let result = await MongoDbHandler.getDbInstance()
        .collection(MongoDbHandler.collections.favoriteShipment)
        .find(query)
        .toArray();

    return result

}

module.exports = {
    add,
    fetchAccountNotification,
    getGeneralNotifications,
    getUserNotifications,
    getAccountNotifications,
    updateNotifications,
    checkDataUpdation,
    checkFavoriteCompanyUpdation
};
