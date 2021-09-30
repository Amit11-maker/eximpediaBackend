const TAG = 'notificationModel';

const ObjectID = require('mongodb').ObjectID;

const MongoDbHandler = require('../db/mongoDbHandler');


const add = (notificationDetails, notificationType, cb) => {
    if (notificationType == 'general') {
        MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.general_notification_details).insertOne(notificationDetails, function (err, result) {
            if (err) {
                cb(err);
            } else {
                cb(null, result);
            }
        });
    }
    else if (notificationType == 'user') {
        MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.user_notification_details).insertOne(notificationDetails, function (err, result) {
            if (err) {
                cb(err);
            } else {
                cb(null, result);
            }
        });
    }
    else if (notificationType == 'account') {
        MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.account_notification_details).insertOne(notificationDetails, function (err, result) {
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

// const update = (accountId, userId, data) => {

//     let filterClause = {
//         account_id: ObjectID(accountId),
//         userId: ObjectID(userId)
//     };

//     let updateClause = {
//         $set: {}
//     };

//     if (data != null) {
//         updateClause.$set = data;
//     }

//     MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.activity_tracker)
//         .updateOne(filterClause, updateClause);

// };


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
    getGeneralNotifications,
    getUserNotifications,
    getAccountNotifications
};
