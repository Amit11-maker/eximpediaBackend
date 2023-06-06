const TAG = 'subscriptionModel';

const ObjectID = require('mongodb').ObjectID;

const MongoDbHandler = require('../db/mongoDbHandler');

const SubscriptionSchema = require('../schemas/subscriptionSchema');
const OrderSchema = require('../schemas/orderSchema');

const findByAccount = (accountId, filters, offset, limit, cb) => {
  // console.log("Account_ID ==========9========== ", accountId)

  let matchClause = {};
  matchClause.account_id = ObjectID(accountId);
  matchClause["items.category"] = SubscriptionSchema.ITEM_CATEGORY_SUBCRIPTION;
  matchClause.status = {
    $nin: [OrderSchema.PROCESS_STATUS_INITIATING, OrderSchema.PROCESS_STATUS_INITIATED]
  };

  let sortClause = {
    "created_ts": -1
  };

  let recordSetClause = [];
  let recordSummaryClause = [];

  recordSetClause.push({
    $skip: offset
  });
  recordSetClause.push({
    $limit: limit
  });
  recordSetClause.push({
    $addFields: {
      'subscription': {
        $arrayElemAt: ["$items", 0]
      }
    }
  });
  recordSetClause.push({
    $project: {
      '_id': 1,
      'account_id': 1,
      'user_id': 1,
      'receipt_uid': 1,
      'subscription': 1,
      'created_ts': 1
    }
  });

  // // console.log(JSON.stringify(recordSetClause));

  recordSummaryClause.push({
    "$group": {
      "_id": null,
      "count": {
        "$sum": 1
      }
    }
  });

  let facetClause = {};
  facetClause[SubscriptionSchema.RESULT_PORTION_TYPE_RECORDS] = recordSetClause;
  facetClause[SubscriptionSchema.RESULT_PORTION_TYPE_SUMMARY] = recordSummaryClause;

  let projectClause = {};
  projectClause[SubscriptionSchema.RESULT_PORTION_TYPE_RECORDS] = 1;
  projectClause[SubscriptionSchema.RESULT_PORTION_TYPE_SUMMARY] = 1;

  let aggregationExpression = [{
    $match: matchClause
  },
  {
    $sort: sortClause
  },
  {
    $facet: facetClause
  },
  {
    $project: projectClause
  }
  ];

  //// console.log(JSON.stringify(aggregationExpression));

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.order)
    .aggregate(aggregationExpression, {
      allowDiskUse: true
    },
      function (err, cursor) {
        if (err) {
          // console.log("Function ======= findByAccount ERROR ============ ", err);
          // console.log("Account_ID =========9=========== ", accountId)
          
          throw err; //cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              cb(err);
            } else {
              cb(null, (documents) ? documents[0] : null);
            }
          });
        }
      }
    );

};

const findByOrderId = (orderId, filters, cb) => {

  let matchClause = {};
  matchClause._id = ObjectID(orderId);
  matchClause["items.category"] = SubscriptionSchema.ITEM_CATEGORY_SUBCRIPTION;

  let sortClause = {
    "created_ts": -1
  };

  let addFieldsClause = {
    'subscription': {
      $arrayElemAt: ["$items", 0]
    }
  };

  let projectClause = {
    '_id': 1,
    'account_id': 1,
    'user_id': 1,
    'receipt_uid': 1,
    'subscription': 1,
    'created_ts': 1
  };

  let aggregationExpression = [{
    $match: matchClause
  },
  {
    $sort: sortClause
  },
  {
    $addFields: addFieldsClause
  },
  {
    $project: projectClause
  }
  ];

  //// console.log(JSON.stringify(aggregationExpression));

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.order)
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
              cb(null, (documents && documents.length > 0) ? documents[0] : null);
            }
          });
        }
      }
    );

};

module.exports = {
  findByAccount,
  findByOrderId
};
