const TAG = 'userModel';

const ObjectID = require('mongodb').ObjectID;
const MongoDbHandler = require('../db/mongoDbHandler');
const UserSchema = require('../schemas/userSchema');

const buildFilters = (filters) => {
  let filterClause = {};
  return filterClause;
}

const userCollection = MongoDbHandler.collections.user;
const accountLimitsCollection = MongoDbHandler.collections.account_limits;

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

}

const updateByEmail = (emailId, data, cb) => {

  let filterClause = {
    email_id: emailId
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

}

const remove = (userId, cb) => {
  // console.log(userId);
  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.activity_tracker)
    .deleteMany({
      user_id: ObjectID(userId)
    }, function (err) {
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
      'available_credits': 1,
      'available_countries': 1,
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

  let filterClause = {}
  filterClause.account_id = ObjectID(accountId);

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.user)
    .find(filterClause)
    .project({
      '_id': 1,
      'first_name': 1,
      'last_name': 1,
      'email_id': 1,
      'mobile_no': 1,
      'available_credits': 1,
      'available_countries': 1,
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
        console.log("Function ======= findByAccount ERROR ============ ", err);
        console.log("Account_ID =========2=========== ", accountId)

        cb(err);
      } else {

        cb(null, results);
      }
    });
}


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
      'role': 1,
      'scope': 1
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

const findUserPurchasePoints = async (userId) => {
  try {
    let result = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.user)
      .find({ _id: ObjectID(userId), })
      .project({
        _id: 0,
        "available_credits": 1
      })
      .toArray();

    let creditsResult = (result.length > 0) ? result[0].available_credits : 0;
    return creditsResult;
  }
  catch (error) {
    throw error;
  }
}

const updateUserPurchasePoints = (userId, consumeType, points, cb) => {
  let filterClause = {
    _id: ObjectID(userId),
  };

  let updateClause = {};

  updateClause.$inc = {
    "available_credits": (consumeType === 1 ? 1 : -1) * Number(points),
  };

  // console.log(updateClause);

  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.user)
    .updateOne(filterClause, updateClause, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
}

const findUserIdForAccount = async (accountId, filters) => {

  let filterClause = {}
  if (filters != null) {
    filterClause = filters
  }
  filterClause.account_id = ObjectID(accountId);

  try {
    const result = await MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.user)
      .find(filterClause)
      .project({
        '_id': 1
      })
      .toArray();

    let userId = (result.length > 0) ? result[0]._id : 0;
    return userId;
  } catch (error) {
    throw error;
  }
}

async function findUserDetailsByAccountID(accountId) {
  let filterClause = {
    account_id: ObjectID(accountId)
  }

  let projectClause = {
    '_id': 1,
    'first_name': 1,
    'last_name': 1,
    'email_id': 1,
    'mobile_no': 1,
    'available_credits': 1,
    'available_countries': 1,
    'created_ts': 1,
    'is_active': 1,
    'is_email_verified': 1,
    'is_account_owner': 1,
    'role': 1
  }

  try {
    let userData = await MongoDbHandler.getDbInstance().collection(userCollection)
      .find(filterClause).project(projectClause).toArray();

    return userData;
  }
  catch (error) {
    throw error;
  }
}

async function getUserCreationLimit(accountId) {

  const aggregationExpression = [
    {
      '$match': {
        'account_id': ObjectID(accountId),
        'max_users': {
          '$exists': true
        }
      }
    },
    {
      '$project': {
        'max_users': 1,
        '_id': 0
      }
    }
  ]

  try {
    let limitDetails = await MongoDbHandler.getDbInstance()
      .collection(accountLimitsCollection)
      .aggregate(aggregationExpression).toArray();

    return limitDetails[0];
  } catch (error) {
    throw error;
  }
}

async function updateUserCreationLimit(accountId, updatedUserCreationLimits) {

  const matchClause = {
    'account_id': ObjectID(accountId),
    'max_save_query': {
      '$exists': true
    }
  }

  const updateClause = {
    $set: updatedUserCreationLimits
  }

  try {
    let limitUpdationDetails = await MongoDbHandler.getDbInstance()
      .collection(accountLimitsCollection)
      .updateOne(matchClause, updateClause);

    return limitUpdationDetails;
  } catch (error) {
    throw error;
  }
}

async function findUserByAccountId(accountId) {
  try {
    let accountUser = await MongoDbHandler.getDbInstance()
      .collection(userCollection)
      .find({ account_id: ObjectID(accountId), role: "ADMINISTRATOR" }).toArray();

    return accountUser;
  } catch (error) {
    throw error;
  }
}

async function findUserById(userId) {
  try {

    let results = await MongoDbHandler.getDbInstance()
      .collection(userCollection)
      .find({ _id: ObjectID(userId) }).toArray();

    return ((results.length > 0) ? results[0] : []) ;

  } catch (error) {
    throw error;
  }
}

async function updateUserPurchasePointsById(userId, consumeType, points) {
  try {

    let filterClause = {
      _id: ObjectID(userId),
    }

    let updateClause = {};

    updateClause.$inc = {
      "available_credits": (consumeType === 1 ? 1 : -1) * Number(points),
    }

    const result = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.user)
      .updateOne(filterClause, updateClause);

    return result;
  }
  catch (error) {
    throw error;
  }
}

async function insertUserPurchase(userId, points) {
  try {

    let filterClause = {
      _id: ObjectID(userId),
    }

    let updateClause = {};

    updateClause.$set = {
      "available_credits": parseInt(points),
    }

    const result = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.user)
      .updateOne(filterClause, updateClause);

    return result;
  }
  catch (error) {
    throw error;
  }
}

module.exports = {
  add,
  update,
  updateByEmail,
  remove,
  updateEmailVerificationStatus,
  updateActivationStatus,
  find,
  findById,
  findByAccount,
  findTemplatesByAccount,
  findByEmail,
  findByEmailForAccount,
  findUserPurchasePoints,
  updateUserPurchasePoints,
  findUserIdForAccount,
  findUserDetailsByAccountID,
  getUserCreationLimit,
  updateUserCreationLimit,
  findUserByAccountId,
  findUserById,
  insertUserPurchase,
  updateUserPurchasePointsById
}
