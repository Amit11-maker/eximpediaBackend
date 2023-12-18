const TAG = "accountModel";

const ObjectID = require("mongodb").ObjectID;
const randomstring = require("randomstring");
const MongoDbHandler = require("../db/mongoDbHandler");
const getLoggerInstance = require("../services/logger/Logger");

const accountCollection = MongoDbHandler.collections.account;
const accountLimitsCollection = MongoDbHandler.collections.account_limits;

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
    data.modified_ts = currentTimestamp;
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
      _id: ObjectID(accountId),
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
};

const updatePurchasePoints = (accountId, consumeType, points, cb) => {
  let filterClause = {
    _id: ObjectID(accountId),
  };

  let updateClause = {};

  updateClause.$inc = {
    "plan_constraints.purchase_points":
      (consumeType === 1 ? 1 : -1) * Number(points),
  };
  try {
    // logger.log(updateClause);

    MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.account)
      .updateOne(filterClause, updateClause, function (err, result) {
        if (err) {
          cb(err);
        } else {
          cb(null, result);
        }
      });
  } catch (error) {
    logger.log(
      `accountId --> ${accountId}; \nMethod --> updatePurchaseRecordsKeeper; \nerror --> ${JSON.stringify(
        error
      )}`
    );
    throw error;
  }
};

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
};

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
};

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
        logger.log(
          `Function ======= findById ERROR ============ ${JSON.stringify(err)}`
        );
        logger.log("Account_ID =========5=========== ", accountId);
        cb(err);
      } else {
        cb(null, results.length > 0 ? results[0] : []);
      }
    });
};

/* 
  function to getCustomers for SP(subscription plan) and WP(web plan) 
*/
async function getAllCustomersDetails(offset, limit, planStartIndex) {
  let matchClause = {
    scope: { $ne: "PROVIDER" },
    "plan_constraints.subscriptionType": { $regex: "^" + planStartIndex },
  };
  let sortClause = {
    created_ts: -1,
  };
  let projectClause = {
    _id: 1,
    company: 1,
    "plan_constraints.subscriptionType": 1,
    access: 1,
    created_ts: 1,
    is_active: 1,
  };
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
    },
  ];
  try {
    let data = {};
    data.accountDetails = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.account)
      .aggregate(aggregationExpression)
      .toArray();
    data.totalAccountCount = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.account)
      .countDocuments(matchClause);
    return data;
  } catch (error) {
    throw error;
  }
}

/* 
  function to getCustomer by EmailId 
*/
async function getCustomerDetailsByEmail(emailId) {
  let matchClause = {
    "access.email_id": emailId,
  };
  let projectClause = {
    _id: 1,
    company: 1,
    "plan_constraints.subscriptionType": 1,
    access: 1,
    created_ts: 1,
    is_active: 1,
  };
  let aggregationExpression = [
    {
      $match: matchClause,
    },
    {
      $project: projectClause,
    },
  ];
  try {
    let data = {};
    data.accountDetails = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.account)
      .aggregate(aggregationExpression)
      .toArray();

    return data;
  } catch (error) {
    throw error;
  }
}

/* */
async function getCustomerDetailsByEmailSuggestion(emailId) {
  let matchClause = {
    "access.email_id": { $regex: emailId },
  };
  let groupClause = {
    _id: "$access.email_id",
    count: { $sum: 1 },
  };

  let projectClause = {
    _id: 0,
    "access.email_id": "$_id",
  };
  let limitClause = 4;

  let aggregationExpression = [
    {
      $match: matchClause,
    },
    {
      $group: groupClause,
    },
    {
      $project: projectClause,
    },
    {
      $limit: limitClause,
    },
  ];
  try {
    let data = {};
    data.accountDetails = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.account)
      .aggregate(aggregationExpression)
      .toArray();

    return data;
  } catch (error) {
    throw error;
  }
}

/* 
  function to getAccountDetails for any customer account from provider panel 
*/
async function getAccountDetailsForCustomer(accountId) {
  let matchClause = {};
  matchClause.scope = {
    $ne: "PROVIDER",
  };

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
  };

  let aggregationExpression = [];
  if (accountId != undefined) {
    matchClause._id = {
      $eq: ObjectID(accountId),
    };

    let sortClause = {
      created_ts: -1,
    };

    let lookupClause = {
      from: "orders",
      localField: "_id",
      foreignField: "account_id",
      as: "item_subscriptions",
    };
    let lookupWorkspaces = {
      from: "workspaces",
      localField: "_id",
      foreignField: "account_id",
      as: "workspacesArray",
    };
    let lookupActivity = {
      from: "activity_tracker",
      localField: "_id",
      foreignField: "account_id",
      as: "userActivity",
    };

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
      user_activity: "$userActivity",
    };

    aggregationExpression = [
      {
        $match: matchClause,
      },
      {
        $sort: sortClause,
      },
      {
        $lookup: lookupClause,
      },
      {
        $lookup: lookupWorkspaces,
      },
      {
        $lookup: lookupActivity,
      },
      {
        $project: projectClause,
      },
    ];
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
  };

  try {
    await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.activity_tracker)
      .deleteMany(matchClause);
    await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.favoriteShipment)
      .deleteMany(matchClause);
    await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.isFavorite)
      .deleteMany(matchClause);
    await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.order)
      .deleteMany(matchClause);
    await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.purchased_records_keeper)
      .deleteMany(matchClause);
    await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.saveQuery)
      .deleteMany(matchClause);
    await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.user)
      .deleteMany(matchClause);
    await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.account_limits)
      .deleteOne(matchClause);
    await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.account)
      .deleteOne({
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
      .updateOne(
        { _id: ObjectID(accountId) },
        { $set: { plan_constraints: planConstraints } }
      );

    return updatedAccountResult;
  } catch (error) {
    throw error;
  }
}

const getUserSessionFlag = async (userId) => {
  try {
    let query = {
      user_id: ObjectID(userId),
    };
    const result = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.user_session_tracker)
      .find(query)
      .toArray();

    return result;
  } catch (error) {
    getLoggerInstance(error, __filename, "getUserSessionFlag");
    throw error;
  }
};

const updateSessionFlag = async (userId) => {
  try {
    let filterQuery = {
      user_id: ObjectID(userId),
    };

    let updateQuery = {
      $set: {
        islogin: true,
      },
    };
    const result = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.user_session_tracker)
      .updateOne(filterQuery, updateQuery);

    return result;
  } catch (error) {
    throw error;
  }
};

const insertSessionFlag = async (userId) => {
  try {
    let filterQuery = {
      user_id: ObjectID(userId),
    };

    let updateQuery = {
      $set: {
        islogin: true,
      },
    };

    const result = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.user_session_tracker)
      .update(filterQuery, updateQuery, { multi: true });
    return result;
  } catch (error) {
    throw error;
  }
};

const addUserSessionFlag = async (userId, login = true) => {
  try {
    loginFlag = "";

    if (login) {
      loginFlag = randomstring.generate(8);
    }

    let query = {
      user_id: ObjectID(userId),
    };

    let updateQuery = {
      $set: {
        isLoginFlag: loginFlag,
      },
    };

    await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.user_session_tracker)
      .updateOne(query, updateQuery, { upsert: true });

    return loginFlag;
  } catch (error) {
    throw error;
  }
};

async function findAccountDetailsByID(accountId) {
  let filterClause = {
    _id: ObjectID(accountId),
  };

  let projectClause = {
    _id: 1,
    company: 1,
    plan_constraints: 1,
    access: 1,
    created_ts: 1,
    is_active: 1,
    workspacesCount: 1,
    workspaces: 1,
  };

  try {
    let account = await MongoDbHandler.getDbInstance()
      .collection(accountCollection)
      .find(filterClause)
      .project(projectClause)
      .toArray();

    return account[0];
  } catch (error) {
    throw error;
  }
}

async function getDbAccountLimits(accountId) {
  try {
    let dbAccountLimits = await MongoDbHandler.getDbInstance()
      .collection(accountLimitsCollection)
      .find({ account_id: ObjectID(accountId) })
      .project({ _id: 0, account_id: 0 })
      .toArray();

    return dbAccountLimits[0];
  } catch (error) {
    throw error;
  }
}

async function getAllUserAccounts() {
  try {
    let userAccounts = await MongoDbHandler.getDbInstance()
      .collection(accountCollection)
      .find()
      .project({ _id: 1 })
      .toArray();

    return userAccounts;
  } catch (error) {
    throw error;
  }
}

async function updateAccountLimits(accountId, updatedAccountLimits) {
  let filterClause = {
    account_id: ObjectID(accountId),
  };

  let updateClause = {
    $set: updatedAccountLimits,
  };

  try {
    let updatedLimitResult = await MongoDbHandler.getDbInstance()
      .collection(accountLimitsCollection)
      .updateOne(filterClause, updateClause);

    return updatedLimitResult;
  } catch (error) {
    throw error;
  }
}

async function addAccountLimits(accountLimits) {
  try {
    let addedLimitResult = await MongoDbHandler.getDbInstance()
      .collection(accountLimitsCollection)
      .insertOne(accountLimits);

    return addedLimitResult;
  } catch (error) {
    throw error;
  }
}

async function findPurchasePointsByAccountId(accountId) {
  try {
    const result = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.account)
      .find({ _id: ObjectID(accountId) })
      .project({ _id: 0, "plan_constraints.purchase_points": 1 })
      .toArray();

    return result.length > 0 ? result[0].plan_constraints.purchase_points : 0;
  } catch (error) {
    throw error;
  }
}

async function updatePurchasePointsByAccountId(accountId, consumeType, points) {
  try {
    let filterClause = {
      _id: ObjectID(accountId),
    };

    let updateClause = {};

    updateClause.$inc = {
      "plan_constraints.purchase_points":
        (consumeType === 1 ? 1 : -1) * Number(points),
    };

    const result = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.account)
      .updateOne(filterClause, updateClause);

    return result;
  } catch (error) {
    throw error;
  }
}

async function getAccountLimitDetails(Id) {
  let matchClause = {
    "account_id": ObjectID(Id) 
  };

  let aggregationExpression = [
    {
      $match: matchClause
    }
  ];
  try {
    console.log(matchClause);
    let data = {};
    data.accountLimitsDetails = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.account_limits)
      .aggregate(aggregationExpression)
      .toArray();

    return data;
  } catch (error) {
    throw error;
  }
}

async function updatAccountLimitDetails(Id,updateData) {
  filter = {
    "account_id": ObjectID(Id) 
  };

  try {
    let data = {};
    data = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.account_limits)
      .updateOne(filter,{$set:updateData } );

    return data;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getAccountLimitDetails,
  updatAccountLimitDetails,
  add,
  find,
  update,
  findById,
  findPurchasePoints,
  findPlanConstraints,
  updatePurchasePoints,
  updateIsActiveForAccounts,
  getAllCustomersDetails,
  getCustomerDetailsByEmail,
  getCustomerDetailsByEmailSuggestion,
  getAccountDetailsForCustomer,
  getInfoForCustomer,
  removeAccount,
  updatePlanConstraints,
  getUserSessionFlag,
  updateSessionFlag,
  insertSessionFlag,
  addUserSessionFlag,
  findAccountDetailsByID,
  getDbAccountLimits,
  updateAccountLimits,
  getAllUserAccounts,
  addAccountLimits,
  findPurchasePointsByAccountId,
  updatePurchasePointsByAccountId,
};
