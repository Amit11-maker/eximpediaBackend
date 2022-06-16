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

const updateItemSubscriptionConstraints = (accountId, subscriptionId, subscriptionMeta, cb) => {
  console.log(accountId, subscriptionId);
  let filterClause = {
    account_id: ObjectID(accountId),
    "items._id": ObjectID(subscriptionId)
  };

  let updateClause = {
    $set: {}
  };

  updateClause.$set = {
    "items.$[].meta": subscriptionMeta
  };

  /*let arrayFiltersClause = {
    arrayFilters: [{
      "element.category": "SUBSCRIPTION"
    }]
  };*/

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.order)
    .updateOne(filterClause, updateClause,
      function (err, result) {
        if (err) {
          throw err;
          //cb(err);
        } else {
          //console.log(result);
          cb(null, result.modifiedCount);
        }
      });

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
