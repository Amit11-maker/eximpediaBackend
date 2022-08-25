const TAG = 'accountModel';

const ObjectID = require('mongodb').ObjectID;

const MongoDbHandler = require('../db/mongoDbHandler');

const SubscriptionSchema = require('../schemas/subscriptionSchema');

const add = (order, cb) => {
  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.order).insertOne(order, function (err, result) {
    if (err) {
      cb(err);
    } else {
      cb(null, result);
    }
  });
}

const update = (orderId, data, cb) => {

  let filterClause = {
    _id: ObjectID(orderId)
  };

  let updateClause = {
    $set: {}
  };

  if (data != null) {
    updateClause.$set = data;
  }

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.order)
    .updateOne(filterClause, updateClause,
      function (err, result) {
        if (err) {
          cb(err);
        } else {
          cb(null, result.modifiedCount);
        }
      });

}

async function updateItemSubscriptionConstraints(accountId, constraints) {
  let currentTimestamp = Date.now();
  let filterClause = {
    account_id: ObjectID(accountId)
  }

  let updateClause = {
    $set: {
      "items.$[].meta": constraints,
      "modified_ts" : currentTimestamp
    }
  }
  try {
    const updateAccountOrder = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.order)
      .updateOne(filterClause, updateClause);

    return updateAccountOrder.modifiedCount;
  }
  catch (error) {
    throw error;
  }
}

const getOrderDetails = async (accountID) => {
  try {
    const result = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.order)
      .find({ account_id: ObjectID(accountID) })
      .toArray();

    return result;
  }
  catch(error){
    throw error;
  }
}

module.exports = {
  add,
  update,
  updateItemSubscriptionConstraints,
  getOrderDetails
}
