const TAG = 'accountModel';

const ObjectID = require('mongodb').ObjectID;

const MongoDbHandler = require('../db/mongoDbHandler');

const addForOrder = (orderId, order_ref_id, orderStatus, subscriptionMeta, payment, cb) => {
  let filterClause = {
    _id: ObjectID(orderId),
    payment_order_ref_id: order_ref_id,
    "items.category": "SUBSCRIPTION"
  };

  let updateClause = {
    $set: {},
    $push: {}
  };

  // console.log(payment);

  if (payment != null) {
    updateClause.$set = {
      "status": orderStatus,
      "items.$[element].meta": subscriptionMeta
    };
    updateClause.$push = {
      "payments": payment
    };
  }

  let arrayFiltersClause = {
    arrayFilters: [{
      "element.category": "SUBSCRIPTION"
    }]
  };

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.order)
    .updateOne(filterClause, updateClause, arrayFiltersClause,
      function (err, result) {
        if (err) {
          cb(err);
        } else {
          cb(null, result.modifiedCount);
        }
      });
};

module.exports = {
  addForOrder
};
