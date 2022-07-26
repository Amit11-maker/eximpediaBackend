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
      .find({account_id : ObjectID(accountId)}).toArray();

    return accountActivityResult;
  }
  catch (error) {
    throw error;
  }
}

/* fetch activity data for a user */
async function fetchUserActivityData(userId) {
  try {
    const userActivityResult = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.activity_tracker)
      .find({user_id : ObjectID(userId)}).toArray();

    return userActivityResult;
  }
  catch (error) {
    throw error;
  }
}

module.exports = {
  addActivity,
  fetchAccountActivityData,
  fetchUserActivityData
}
