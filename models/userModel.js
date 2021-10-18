const TAG = 'userModel';

const ObjectID = require('mongodb').ObjectID;
const MongoDbHandler = require('../db/mongoDbHandler');
const UserSchema = require('../schemas/userSchema');

const buildFilters = (filters) => {
  let filterClause = {};
  return filterClause;
};

const add = (user, cb) => {
  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.user).insertOne(user, function (err, result) {
    if (err) {
      cb(err);
    } else {
      cb(null, result);
    }
  });
};

const update = (userId, data, cb) => {

  let filterClause = {
    _id: ObjectID(userId)
  };

  let updateClause = {
    $set: {}
  };

  if (data != null) {
    updateClause.$set = data;
  }

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.user)
    .updateOne(filterClause, updateClause,
      function (err, result) {
        if (err) {
          cb(err);
        } else {
          cb(null, result.modifiedCount);
        }
      });

};

const remove = (userId, cb) => {
  // console.log(userId);
  MongoDbHandler.getDbInstance().collection("activity_tracker")
    .deleteOne({
      "userId": ObjectID(userId)
    }, function (err, result) {
      if (err) {
        cb(err);
      } else {
      }
    });

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.user)
    .deleteOne({
      "_id": ObjectID(userId)
    }, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });

};

const updateEmailVerificationStatus = (emailId, status, cb) => {

  let filterClause = {
    email_id: emailId
  };

  let updateClause = {
    $set: {
      is_email_verified: status,
      is_active: status,
    }
  };

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.user)
    .updateOne(filterClause, updateClause,
      function (err, result) {
        if (err) {
          cb(err);
        } else {
          cb(null, result.modifiedCount);
        }
      });

};

const updateActivationStatus = (userId, status, cb) => {

  let filterClause = {
    _id: ObjectID(userId)
  };

  let updateClause = {
    $set: {
      is_active: status
    }
  };

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.user)
    .updateOne(filterClause, updateClause,
      function (err, result) {
        if (err) {
          cb(err);
        } else {
          cb(null, result.modifiedCount);
        }
      });

};

const find = (filters, offset, limit, cb) => {

  let filterClause = {};

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.user)
    .find(filterClause)
    .project({
      '_id': 1,
      'first_name': 1,
      'last_name': 1,
      'email_id': 1,
      'mobile_no': 1,
      'created_ts': 1,
      'is_active': 1,
      'is_email_verified': 1,
      'is_account_owner': 1,
      'role': 1
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

const findById = (userId, filters, cb) => {

  let filterClause = {};
  filterClause._id = ObjectID(userId);

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.user)
    .find(filterClause)
    .project({
      '_id': 1,
      'first_name': 1,
      'last_name': 1,
      'email_id': 1,
      'mobile_no': 1,
      'created_ts': 1,
      'is_active': 1,
      'is_email_verified': 1,
      'is_account_owner': 1,
      'role': 1
    })
    .toArray(function (err, results) {
      if (err) {
        cb(err);
      } else {
        cb(null, (results.length > 0) ? results[0] : []);
      }
    });

};

const findByAccount = (accountId, filters, cb) => {

  let filterClause = {};
  filterClause.account_id = ObjectID(accountId);

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.user)
    .find(filterClause)
    .project({
      '_id': 1,
      'first_name': 1,
      'last_name': 1,
      'email_id': 1,
      'mobile_no': 1,
      'created_ts': 1,
      'is_active': 1,
      'is_email_verified': 1,
      'is_account_owner': 1,
      'role': 1
    })
    .sort({
      'role': 1
    })
    .toArray(function (err, results) {
      if (err) {
        cb(err);
      } else {

        cb(null, results);
      }
    });
};


const findTemplatesByAccount = (accountId, filters, cb) => {

  let filterClause = {};
  filterClause.account_id = ObjectID(accountId);

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.user)
    .find(filterClause)
    .project({
      '_id': 1,
      'first_name': 1,
      'last_name': 1
    })
    .sort({
      'created_ts': -1
    })
    .toArray(function (err, results) {
      if (err) {
        cb(err);
      } else {

        cb(null, results);
      }
    });
};

const findByEmail = (emailId, filters, cb) => {

  let filterClause = {};
  if (emailId) filterClause.email_id = emailId;
  if (filters && filters.scope) filterClause.scope = filters.scope;

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.user)
    .findOne(filterClause, {
      '_id': 1,
      'first_name': 1,
      'last_name': 1,
      'email_id': 1,
      'mobile_no': 1,
      'created_ts': 1,
      'is_active': 1,
      'is_email_verified': 1,
      'is_account_owner': 1,
      'role': 1
    }, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });

};

const findByEmailForAccount = (accountId, emailId, filters, cb) => {

  let filterClause = {};
  if (accountId) filterClause.account_id = ObjectID(accountId);
  if (emailId) filterClause.email_id = emailId;

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.user)
    .findOne(filterClause, {
      '_id': 1,
      'first_name': 1,
      'last_name': 1,
      'email_id': 1,
      'mobile_no': 1,
      'created_ts': 1,
      'is_active': 1,
      'is_email_verified': 1,
      'is_account_owner': 1,
      'role': 1
    }, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }

    });

};

module.exports = {
  add,
  update,
  remove,
  updateEmailVerificationStatus,
  updateActivationStatus,
  find,
  findById,
  findByAccount,
  findTemplatesByAccount,
  findByEmail,
  findByEmailForAccount
};
