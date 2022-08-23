const TAG = "accountModel";

const ObjectID = require("mongodb").ObjectID;

const MongoDbHandler = require("../db/mongoDbHandler");

const add = (account, cb) => {
  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.account)
    .insertOne(account, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
};

const update = (accountId, data, cb) => {
  let currentTimestamp = Date.now();
  let filterClause = {
    _id: ObjectID(accountId),
  };

  let updateClause = {
    $set: {},
  };

  if (data != null) {
    data.modified_ts = currentTimestamp
    updateClause.$set = data;
  }
  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.account)
    .updateOne(filterClause, updateClause, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result.modifiedCount);
      }
    });
};

const findPurchasePoints = (accountId, cb) => {
  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.account)
    .find({
      _id: ObjectID(accountId)
    })
    .project({
      _id: 0,
      "plan_constraints.purchase_points": 1,
    })
    .toArray(function (err, result) {
      if (err) {
        cb(err);
      } else {
        let creditsResult =
          result.length > 0 ? result[0].plan_constraints.purchase_points : 0;
        cb(null, creditsResult);
      }
    });
}

const updatePurchasePoints = (accountId, consumeType, points, cb) => {
  let filterClause = {
    _id: ObjectID(accountId)
  };

  let updateClause = {};

  updateClause.$inc = {
    "plan_constraints.purchase_points": (consumeType === 1 ? 1 : -1) * points,
  };

  // console.log(updateClause);

  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.account)
    .updateOne(filterClause, updateClause, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
}


const updateIsActiveForAccounts = (plan_constraints, cb) => {
  let filterClause = {
    _id: ObjectID(plan_constraints._id),
  };

  let updateClause = {
    $set: {},
  };

  if (plan_constraints != null) {
    updateClause.$set = { is_active: 1 };
  }
  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.account)
    .updateOne(filterClause, updateClause, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result.modifiedCount);
      }
    });
};
const findPlanConstraints = (accountId, cb) => {

  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.account)
    .findOne(
      {
        _id: ObjectID(accountId),
      },
      {
        _id: 0,
        plan_constraints: 1,
      },
      function (err, result) {
        if (err) {
          cb(err);
        } else {
          cb(null, result);
        }
      }
    );
}

const find = (filters, offset, limit, cb) => {
  let filterClause = {};

  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.account)
    .find(filterClause)
    .project({
      _id: 1,
      company: 1,
      plan_constraints: 1,
      access: 1,
      created_ts: 1,
      is_active: 1,
    })
    .sort({
      created_ts: -1,
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
}

const findById = (accountId, filters, cb) => {
  let filterClause = {
    _id: ObjectID(accountId),
  };

  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.account)
    .find(filterClause)
    .project({
      _id: 1,
      company: 1,
      plan_constraints: 1,
      access: 1,
      created_ts: 1,
      is_active: 1,
      workspacesCount: 1,
      workspaces: 1,
    })
    .toArray(function (err, results) {
      if (err) {
        cb(err);
      } else {
        cb(null, results.length > 0 ? results[0] : []);
      }
    });
}

/* 
  function to getCustomers for SP(subscription plan) and WP(web plan) 
*/
async function getAllCustomersDetails(offset, limit, planStartIndex) {
  let matchClause = {
    "scope": { $ne: "PROVIDER" },
    "plan_constraints.subscriptionType": { $regex: "^" + planStartIndex }
  }
  let sortClause = {
    created_ts: -1,
  }
  let projectClause = {
    _id: 1,
    company: 1,
    "plan_constraints.subscriptionType": 1,
    access: 1,
    created_ts: 1,
    is_active: 1
  }
  let aggregationExpression = [
    {
      $match: matchClause,
    },
    {
      $sort: sortClause,
    },
    {
      $skip: parseInt(offset),
    },
    {
      $limit: parseInt(limit),
    },
    {
      $project: projectClause,
    }
  ]
  try {
    let data = {}
    data.accountDetails = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.account)
      .aggregate(aggregationExpression).toArray();
    data.totalAccountCount = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.account)
      .countDocuments(matchClause);
    return data;
  }
  catch (error) {
    throw error;
  }

}

/* 
  function to getAccountDetails for any customer account from provider panel 
*/
async function getAccountDetailsForCustomer(accountId) {
  let matchClause = {}
  matchClause.scope = {
    $ne: "PROVIDER",
  }

  if (accountId != undefined) {
    matchClause._id = {
      $eq: ObjectID(accountId),
    };
  }

  try {
    const customerAccount = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.account)
      .find(matchClause)
      .toArray();

    return customerAccount;
  } catch (error) {
    throw error;
  }
}

/* 
  function to getInformation for any customer account from provider panel 
*/
async function getInfoForCustomer(accountId, cb) {
  let matchClause = {};
  matchClause.scope = {
    $ne: "PROVIDER",
  }

  let aggregationExpression = []
  if (accountId != undefined) {
    matchClause._id = {
      $eq: ObjectID(accountId),
    };

    let sortClause = {
      created_ts: -1,
    }

    let lookupClause = {
      from: "orders",
      localField: "_id",
      foreignField: "account_id",
      as: "item_subscriptions",
    }
    let lookupWorkspaces = {
      from: "workspaces",
      localField: "_id",
      foreignField: "account_id",
      as: "workspacesArray",
    }
    let lookupActivity = {
      from: "activity_tracker",
      localField: "_id",
      foreignField: "account_id",
      as: "userActivity",
    }

    let projectClause = {
      _id: 1,
      company: 1,
      plan_constraints: 1,
      access: 1,
      created_ts: 1,
      is_active: 1,
      subscription: {
        $arrayElemAt: ["$item_subscriptions", 0],
      },
      workspaceCount: { $size: "$workspacesArray" },
      workspaces: ["$workspacesArray"],
      user_activity: "$userActivity"
    }

    aggregationExpression = [
      {
        $match: matchClause
      },
      {
        $sort: sortClause
      },
      {
        $lookup: lookupClause
      },
      {
        $lookup: lookupWorkspaces
      },
      {
        $lookup: lookupActivity
      },
      {
        $project: projectClause,
      }
    ]
  }

  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.account)
    .aggregate(
      aggregationExpression,
      {
        allowDiskUse: true,
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
}

/* 
  function to delete customer account
*/
async function removeAccount(accountId) {
  const matchClause = {
    account_id: ObjectID(accountId),
  }

  try {
    await MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.activity_tracker).deleteMany(matchClause);
    await MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.favoriteShipment).deleteMany(matchClause);
    await MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.isFavorite).deleteMany(matchClause);
    await MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.order).deleteMany(matchClause);
    await MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.purchased_records_keeper).deleteMany(matchClause);
    await MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.saveQuery).deleteMany(matchClause);
    await MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.user).deleteMany(matchClause);
    await MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.account).deleteOne({
      _id: ObjectID(accountId),
    });
  } catch (error) {
    throw error;
  }
}

async function updatePlanConstraints(accountId, planConstraints) {
  try {
    const updatedAccountResult = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.account)
      .updateOne({ _id: ObjectID(accountId) }, { $set: { plan_constraints: planConstraints } });

    return updatedAccountResult;
  }
  catch (error) {
    throw error;
  }
}

const getUserSessionFlag = async (userId) => {
  try {
    let query = {
      user_id: userId
    }
    const result = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.user_session_tracker)
      .find(query)
      .toArray();

    return result;
  }
  catch (error) {
    throw error;
  }
}

const updateSessionFlag = async (userId) => {
  try {
    let filterQuery = {
      user_id: ObjectID(userId)
    }

    let updateQuery = {
      $set: {
        islogin: true
      }
    }
    const result = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.user_session_tracker)
      .updateOne(filterQuery, updateQuery)
    return result;
  }
  catch (error) {
    throw error;
  }
}


const insertSessionFlag = async (userId) => {
  try {
    let filterQuery = {
      user_id: ObjectID(userId)
    }

    let updateQuery = {
      $set: {
        islogin: true
      }
    }

    const result = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.user_session_tracker)
      .update(filterQuery, updateQuery, { multi: true })
    return result;
  }
  catch (error) {
    throw error;
  }
}


const addUserSessionFlag = async (userId) => {
  try {
    let query = {
      user_id: ObjectID(userId)
    }

    const result = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.user_session_tracker)
      .insertOne(query)
    return result;
  }
  catch (error) {
    throw error;
  }
}


module.exports = {
  add,
  find,
  update,
  findById,
  findPurchasePoints,
  findPlanConstraints,
  updatePurchasePoints,
  updateIsActiveForAccounts,
  getAllCustomersDetails,
  getAccountDetailsForCustomer,
  getInfoForCustomer,
  removeAccount,
  updatePlanConstraints,
  getUserSessionFlag,
  updateSessionFlag,
  insertSessionFlag,
  addUserSessionFlag
}
