const TAG = 'notificationModel';

const ObjectID = require('mongodb').ObjectID;

const MongoDbHandler = require('../db/mongoDbHandler');


const add = (notificationDetails, notificationType, cb) => {
    console.log(notificationDetails, notificationType);
    if (notificationType == 'general') {
        notificationDetails.created_at = new Date().getTime()
        notificationDetails.view = false
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
        var notificationArray = [];
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
        MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.user_notification_details)
            .insertMany(notificationArray, function (err, result) {
                if (err) {
                    cb(err);
                } else {
                    cb(null, result);
                }
            });
    }
    else if (notificationType == 'account') {
        var notificationArray = [];
        console.log(notificationDetails);
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
        MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.account_notification_details)
            .insertMany(notificationArray, function (err, result) {
                if (err) {
                    cb(err);
                } else {
                    cb(null, result);
                }
            });
    }
    else {
        cb({ "msg": "please share correct notification type" });
    }
};

const fetchAccountNotification = (accountId, timeStamp, flagValue) => {
    console.log("in");
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
                    if (err) console.log(err);
                    cursor.toArray(function (err, results) {
                        if (err) {
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
                                        console.log(err);
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
    var generalAggregationExpression = [{ $sort: { created_at: -1, view: 1 } }, {
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

const updateNotifications = (notificationIdArr) => {
    var notificationArr = []
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

module.exports = {
    add,
    fetchAccountNotification,
    getGeneralNotifications,
    getUserNotifications,
    getAccountNotifications,
    updateNotifications
};
