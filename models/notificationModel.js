const TAG = 'notificationModel';

const ObjectID = require('mongodb').ObjectID;

const MongoDbHandler = require('../db/mongoDbHandler');


const add = (notificationDetails, notificationType, cb) => {
    if (notificationType == 'general') {
        notificationDetails.created_at = new Date().getTime()
        MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.general_notification_details)
            .insertOne(notificationDetails, function (err, result) {
                if (err) {
                    cb(err);
                } else {
                    cb(null, result);
                }
            });
    }
    else if (notificationType == 'user') {
        let count = 0
        var cb_call = console.log
        for (let userId in notificationDetails.user_id) {
            count += 1
            let notificationData = {}
            notificationData.user_id = ObjectID(userId)
            notificationData.heading = notificationDetails.heading
            notificationData.description = notificationDetails.description
            notificationData.link = notificationDetails.link
            notificationData.created_at = new Date().getTime()
            if (count == notificationDetails.user_id.length) {
                cb_call = cb
            }
            MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.user_notification_details)
                .insertOne(notificationData, function (err, result) {
                    if (err) {
                        cb_call(err);
                    } else {
                        cb_call(null, result);
                    }
                });
        }
    }
    else if (notificationType == 'account') {
        let count = 0
        var cb_call = console.log
        for (let accountId in notificationDetails.account_id) {
            count += 1
            let notificationData = {}
            notificationData.account_id = ObjectID(accountId)
            notificationData.heading = notificationDetails.heading
            notificationData.description = notificationDetails.description
            notificationData.link = notificationDetails.link
            notificationData.created_at = new Date().getTime()
            if (count == notificationDetails.account_id.length) {
                cb_call = cb
            }
            MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.account_notification_details)
                .insertOne(notificationData, function (err, result) {
                    if (err) {
                        cb_call(err);
                    } else {
                        cb_call(null, result);
                    }
                });
        }
    }
    else {
        cb({ "msg": "please share correct notification type" });
    }
};

const fetchAccountNotification = (accountId, timeStamp, flagValue) => {
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
                if (err) console.log(err);
                cursor.toArray(function (err, results) {
                    if (err) {
                        console.log(err)
                    } else {
                        if (results.length > 0) {
                            console.log(results);
                        }
                        else {
                            console.log(results);
                            let notificationDetails = {
                                "account_id": ObjectID("60027241e4d9084b97bcd394"),
                                "heading": "Recharge",
                                "description": `Your account is about to expire ${flagValue} days`,
                                "link": "",
                                "created_at": new Date().getTime(),
                                flag: flagValue
                            }
                            MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.account_notification_details).insertOne(notificationDetails, function (err, result) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log(result);
                                }
                            });
                        }
                    }
                });
            });
    });
};


const getGeneralNotifications = (cb) => {
    var generalAggregationExpression = [{
        "$limit": 10
    }]
    MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.general_notification_details)
        .aggregate(generalAggregationExpression, {
            allowDiskUse: true
        },
            function (err, cursor) {
                if (err) cb(err);
                cursor.toArray(function (err, results) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, results);
                    }
                });
            }
        );
}

const getUserNotifications = (userId, cb) => {
    var userAggregationExpression = [{
        "$match": {
            user_id: ObjectID(userId)
        }
    },
    {
        "$limit": 10
    }]
    MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.user_notification_details)
        .aggregate(userAggregationExpression, {
            allowDiskUse: true
        },
            function (err, cursor) {
                if (err) cb(err);
                cursor.toArray(function (err, results) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, results);
                    }
                });
            }
        );
}

const getAccountNotifications = (accountId, cb) => {
    var accountAggregationExpression = [{
        "$match": {
            account_id: ObjectID(accountId)
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
                if (err) cb(err);
                cursor.toArray(function (err, results) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, results);
                    }
                });
            }
        );
}

module.exports = {
    add,
    fetchAccountNotification,
    getGeneralNotifications,
    getUserNotifications,
    getAccountNotifications
};
