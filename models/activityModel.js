const TAG = "activityModel";
const ObjectID = require("mongodb").ObjectID;
const MongoDbHandler = require("../db/mongoDbHandler");


/* Add activity for a user */
async function addActivity(activityDetails) {
  try {
    const addActivityResult = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.activity_tracker)
      .insertOne(activityDetails);

    return addActivityResult;
  }
  catch (error) {
    throw error;
  }
}

/* fetch activity data for a account */
async function fetchAccountActivityData(accountId) {
  let aggregationExpression = [{
    $match: {
      account_id: ObjectID(accountId)
    }
  },
  {
    $lookup: {
      from: 'users',
      localField: 'account_id',
      foreignField: 'account_id',
      as: 'usersArray'
    }
  },
  {
    $project: {
      _id: 0,
      role: "$usersArray.role",
      email_id: "$usersArray.email_id",
      account_id: 1,
      user_id: 1,
      tradeType: 1,
      country: 1,
      query: 1,
      queryResponseTime: 1,
      queryCreatedAt: "$created_ts",
      workspaceCreationQuery : "$isWorkspaceQuery"
    }
  }]

  try {
    const accountActivityResult = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.activity_tracker)
      .aggregate(aggregationExpression, { allowDiskUse: true }).toArray();

    return accountActivityResult;
  }
  catch (error) {
    throw error;
  }
}

/* fetch activity data for a user */
async function fetchUserActivityData(userId) {
  let aggregationExpression = [{
    $match: {
      user_id: ObjectID(userId)
    }
  },
  {
    $lookup: {
      from: 'users',
      localField: 'user_id',
      foreignField: '_id',
      as: 'usersArray'
    }
  },
  {
    $project: {
      _id: 0,
      role: "$usersArray.role",
      email_id: "$usersArray.email_id",
      account_id: 1,
      user_id: 1,
      tradeType: 1,
      country: 1,
      query: 1,
      queryResponseTime: 1,
      queryCreatedAt: "$created_ts",
      workspaceCreationQuery : "$isWorkspaceQuery"
    }
  }]

  try {
    const userActivityResult = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.activity_tracker)
      .aggregate(aggregationExpression, { allowDiskUse: true }).toArray();

    return userActivityResult;
  }
  catch (error) {
    throw error;
  }
}

/* fetch activity data for a user */
async function fetchUserActivityDataByEmailId(emailId) {
  try {
    const userId = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.user)
      .find({email_id : emailId}).project({'_id': 1}).toArray();

    const userActivityResult = await fetchUserActivityData(userId[0]._id);

    return userActivityResult;
  }
  catch (error) {
    throw error;
  }
}

module.exports = {
  addActivity,
  fetchAccountActivityData,
  fetchUserActivityData,
  fetchUserActivityDataByEmailId
}
