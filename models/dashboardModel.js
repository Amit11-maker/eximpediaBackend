const TAG = 'dashboardModel';
const ObjectID = require('mongodb').ObjectID;
const MongoDbHandler = require('../db/mongoDbHandler');
const findConsumerByAccount = (accountId, cb) => {
    let aggregationExpression = [{
        $match: {
            _id: ObjectID(`${accountId}`)
        }
    },
    {
        $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: 'account_id',
            as: 'usersArray'
        }
    },
    {
        $lookup: {
            from: 'taxonomies',
            localField: 'plan_constraints.countries_available',
            foreignField: 'code_iso_3',
            as: 'countryArray'
        }
    },
    {
        $lookup: {
            from: 'workspaces',
            localField: '_id',
            foreignField: 'account_id',
            as: 'workspacesArray'
        }
    },
    {
        $lookup: {
            from: 'purchased_records_keeper',
            localField: '_id',
            foreignField: 'account_id',
            as: 'recordKeeperArray'
        }
    },
    {
        $project: {
            userCount: { $size: "$usersArray" },
            countryArray: "$countryArray.country",
            availableDataRange: "$plan_constraints.data_availability_interval",
            workspaceCount: { $size: "$workspacesArray" },
            recordPurchased:"$recordKeeperArray",
            availableCredist: "$plan_constraints.purchase_points",
            planType: "$plan_constraints.subscriptionType",
            validity: "$plan_constraints.access_validity_interval"
        }
    }
    ];
    MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.account)
        .aggregate(aggregationExpression, {
            allowDiskUse: true
        },
            function (err, cursor) {
                if (err) {
                    throw err; //cb(err);
                } else {
                    cursor.toArray(function (err, documents) {
                        if (err) {
                            cb(err);
                        } else {
                            // console.log(documents);
                            cb(null, documents);
                        }
                    });
                }
            }
        );
};
const findProviderByAccount = (cb) => {
    let aggregationExpression = [{
        $match: {
            "scope": "CONSUMER"
        }
    },
    {
        $group: {
            "_id": "_id",
            "count":
                { "$sum": 1 }
        }
    },
    {
        $project: {
            "totalCustomers": "$count",
        }
    }
    ];
    MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.account)
        .aggregate(aggregationExpression, {
            allowDiskUse: true
        },
            function (err, cursor) {
                if (err) {
                    throw err; //cb(err);
                } else {
                    cursor.toArray(function (err, documents) {
                        if (err) {
                            cb(err);
                        } else {
                            cb(null, documents);
                        }
                    });
                }
            }
        );
};
const fetchWorkspaceCount = (cb) => {
    let aggregationExpression = [
        {
            $group: {
                "_id": "_id",
                "count":
                    { "$sum": 1 }
            }
        },
        {
            $project: {
                "totalWorkspaceCount": "$count",
            }
        }
    ];
    MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.workspace)
        .aggregate(aggregationExpression, {
            allowDiskUse: true
        },
            function (err, cursor) {
                if (err) {
                    throw err; //cb(err);
                } else {
                    cursor.toArray(function (err, documents) {
                        if (err) {
                            cb(err);
                        } else {
                            cb(null, documents);
                        }
                    });
                }
            }
        );
};
const fetchUplodedCountries = (cb) => {
    let aggregationExpression = [
        {
            $group: {
                "_id": "$country",
                "count":
                    { "$sum": 1 }
            }
        },
        {
            $group: {
                "_id": null,
                "count": {
                    "$sum": 1
                }
            }
        },
        {
            $project: {
                "totalUplodedCountries": "$count",
            }
        }
    ];
    MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.ledger)
        .aggregate(aggregationExpression, {
            allowDiskUse: true
        },
            function (err, cursor) {
                if (err) {
                    throw err; //cb(err);
                } else {
                    cursor.toArray(function (err, documents) {
                        if (err) {
                            cb(err);
                        } else {
                            cb(null, documents);
                        }
                    });
                }
            }
        );
};
const fetchRecordCount = (cb) => {
    let aggregationExpression = [
        {
            $project: {
                "count": { "$size": "$records" }
            }
        },
        {
            $group: {
                "_id": null,
                "count": {
                    "$sum": "$count"
                }
            }
        },
        {
            $project: {
                "totalRecords": "$count",
            }
        }
    ];
    MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.purchased_records_keeper)
        .aggregate(aggregationExpression, {
            allowDiskUse: true
        },
            function (err, cursor) {
                if (err) {
                    throw err; //cb(err);
                } else {
                    cursor.toArray(function (err, documents) {
                        if (err) {
                            cb(err);
                        } else {
                            cb(null, documents);
                        }
                    });
                }
            }
        );
};
module.exports = {
    findConsumerByAccount,
    findProviderByAccount,
    fetchWorkspaceCount,
    fetchUplodedCountries,
    fetchRecordCount
};
