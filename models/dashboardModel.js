const TAG = 'dashboardModel';
const ObjectID = require('mongodb').ObjectID;
const MongoDbHandler = require('../db/mongoDbHandler');
const findByAccount = (accountId, cb) => {
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
        $set: {
            "recordKeeperArray": { "$first": "$recordKeeperArray.records" }
        }
    },
    {
        $project: {
            userCount: { $size: "$usersArray" },
            countryArray: { $size: "$countryArray.country" },
            availableDataRange: "$plan_constraints.data_availability_interval",
            workspaceCount: { $size: "$workspacesArray" },
            recordPurchased: { $size: "$recordKeeperArray" },
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
                            cb(null, documents);
                        }
                    });
                }
            }
        );
};
module.exports = {
    findByAccount,
};
