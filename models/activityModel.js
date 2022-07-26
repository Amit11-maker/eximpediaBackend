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
  try {
    const accountActivityResult = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.activity_tracker)
      .find({account_id : accountId}).toArray();

    return accountActivityResult;
  }
  catch (error) {
    throw error;
  }
}

/* fetch activity data for a user */
async function fetchUserActivityData(accountId) {
  try {
    const userActivityResult = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.activity_tracker)
      .find({user_id : userId}).toArray();

    return userActivityResult[0];
  }
  catch (error) {
    throw error;
  }
}

const update = (accountId, userId, data) => {
  let filterClause = {
    account_id: ObjectID(accountId),
    userId: ObjectID(userId),
  };

  let updateClause = {
    $set: {},
  };

  if (data != null) {
    updateClause.$set = data;
  }

  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.activity_tracker)
    .updateOne(filterClause, updateClause);
}

module.exports = {
  addActivity,
  fetchAccountActivityData,
  fetchUserActivityData
}
