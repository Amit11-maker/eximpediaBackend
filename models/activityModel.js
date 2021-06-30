const TAG = 'activityModel';

const ObjectID = require('mongodb').ObjectID;

const MongoDbHandler = require('../db/mongoDbHandler');


const add = (account, cb) => {
  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.account).insertOne(account, function (err, result) {
    if (err) {
      cb(err);
    } else {
      cb(null, result);
    }
  });
};

const update = (accountId, data, cb) => {

  let filterClause = {
    _id: ObjectID(accountId)
  };

  let updateClause = {
    $set: {}
  };

  if (data != null) {
    updateClause.$set = data;
  }

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.account)
    .updateOne(filterClause, updateClause,
      function (err, result) {
        if (err) {
          cb(err);
        } else {
          cb(null, result.modifiedCount);
        }
      });

};


const findPurchasePoints = (accountId, cb) => {
  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.account)
    .find({
      '_id': ObjectID(accountId),
    })
    .project({
      '_id': 0,
      'plan_constraints.purchase_points': 1
    })
    .toArray(function (err, result) {
      if (err) {
        cb(err);
      } else {
        let creditsResult = (result.length > 0) ? result[0].plan_constraints.purchase_points : 0;
        cb(null, creditsResult);
      }
    });
};

const updatePurchasePoints = (accountId, consumeType, points, cb) => {
  let filterClause = {
    _id: ObjectID(accountId)
  };

  let updateClause = {};

  updateClause.$inc = {
    "plan_constraints.purchase_points": ((consumeType === 1) ? 1 : -1) * points
  };

  console.log(updateClause);

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.account)
    .updateOne(filterClause, updateClause,
      function (err, result) {
        if (err) {
          cb(err);
        } else {
          cb(null, result);
        }
      });
};

const findPlanConstraints = (accountId, cb) => {

  let filterClause = {
    _id: ObjectID(accountId)
  };

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.account)
    .findOne({
      '_id': ObjectID(accountId),
    }, {
      '_id': 0,
      'plan_constraints': 1
    }, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
};


const findProviderActivity = (filters, offset, limit, cb) => {

  let filterClause = {};

  MongoDbHandler.getDbInstance().collection("activity_tracker")
    .aggregate([{
      $group: {
        _id: "$account_id",
        users: { $push: "$$ROOT" }
      }
    }])
    .sort({
      'role': 1
    })
    .skip(parseInt(offset))
    .limit(parseInt(limit))
    .toArray(function (err, results) {
      if (err) {
        cb(err);
      } else {
        cb(null, results);
      }
    });
};

const findConsumerActivity = (filters, accountId, offset, limit, cb) => {

  let filterClause = {};
  console.log("HELLO", accountId)
  MongoDbHandler.getDbInstance().collection("activity_tracker")
    .aggregate([
      {
        $match: {
          scope: 'CONSUMER',
          account_id: ObjectID(accountId)
        }
      },
      {
        $group: {
          _id: "$account_id",
          users: { $push: "$$ROOT" }
        }
      }])
    .sort({
      'role': 1
    })
    .skip(parseInt(offset))
    .limit(parseInt(limit))
    .toArray(function (err, results) {
      if (err) {
        cb(err);
      } else {
        cb(null, results);
      }
    });
};

const findCustomersX = (filters, offset, limit, cb) => {

  let filterClause = {
    scope: {
      $ne: 'PROVIDER'
    }
  };

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.account)
    .find(filterClause)
    .project({
      '_id': 1,
      'company': 1,
      'plan_constraints': 1,
      'access': 1,
      'created_ts': 1,
      'is_active': 1
    })
    .sort({
      'created_ts': -1
    })
    .skip(parseInt(offset))
    .limit(parseInt(limit))
    .toArray(function (err, results) {
      if (err) {
        cb(err);
      } else {
        cb(null, results);
      }
    });
};

const findCustomers = (filters, offset, limit, cb) => {

  let matchClause = {};
  matchClause.scope = {
    $ne: 'PROVIDER'
  };

  let sortClause = {
    "created_ts": -1
  };

  let lookupClause = {
    from: "orders",
    let: {
      orderItemSubscriptionId: "$plan_constraints.order_item_subscription_id"
    },
    pipeline: [{
      $unwind: "$items"
    },
    {
      $match: {
        $expr: {
          $eq: ["$items._id", "$$orderItemSubscriptionId"]
        }
      }
    }
    ],
    as: "item_subscriptions"
  };

  let projectClause = {
    '_id': 1,
    'company': 1,
    'plan_constraints': 1,
    'access': 1,
    'created_ts': 1,
    'is_active': 1,
    'subscription': {
      $arrayElemAt: ["$item_subscriptions", 0]
    }
  };

  let aggregationExpression = [{
    $match: matchClause
  },
  {
    $sort: sortClause
  },
  {
    $skip: parseInt(offset)
  },
  {
    $limit: parseInt(limit)
  },
  {
    $lookup: lookupClause
  },
  {
    $project: projectClause
  }
  ];

  console.log(JSON.stringify(aggregationExpression));

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

const findById = (accountId, filters, cb) => {

  let filterClause = {
    _id: ObjectID(accountId)
  };

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.account)
    .find(filterClause)
    .project({
      '_id': 1,
      'company': 1,
      'plan_constraints': 1,
      'access': 1,
      'created_ts': 1,
      'is_active': 1
    })
    .toArray(function (err, results) {
      if (err) {
        cb(err);
      } else {
        cb(null, (results.length > 0) ? results[0] : []);
      }
    });

};

module.exports = {
  add,
  update,
  findPurchasePoints,
  updatePurchasePoints,
  findPlanConstraints,
  findProviderActivity,
  findConsumerActivity,
  findCustomers,
  findById
};
