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
    $sort: {
      created_ts: -1
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
      workspaceCreationQuery: "$isWorkspaceQuery"
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
    $sort: {
      created_ts: -1
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
      workspaceCreationQuery: "$isWorkspaceQuery"
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
      .find({ email_id: emailId }).project({ '_id': 1 }).toArray();

    const userActivityResult = await fetchUserActivityData(userId[0]._id);

    return userActivityResult;
  }
  catch (error) {
    throw error;
  }
}

/* 
  function to get all Accounts for activity tracking
*/
async function getAllAccountsDetails(offset, limit) {
  let aggregationExpression = [
    {
      $match: {
        "scope": { $ne: "PROVIDER" }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: 'account_id',
        as: 'usersArray'
      }
    },
    // We can use pipeline to get count but its slow
    // Can be used for refrence in future
    // {
    //   $lookup: {
    //     from: 'activity_tracker',
    //     let: {
    //       account_id: "$_id"
    //     },
    //     pipeline : [
    //       {
    //         $match: {
    //           $expr: {  $eq: [ "$account_id", "$$account_id" ] },
    //           created_ts: { $gte: new Date(new Date().toISOString().split("T")[0]).getTime() },
    //           isWorkspaceQuery: false
    //         }
    //       }
    //     ],
    //     as: 'activity'
    //   }
    // },
    {
      $lookup: {
        from: 'activity_tracker',
        localField: '_id',
        foreignField: 'account_id',
        as: 'activityArray'
      }
    },
    {
      $sort: {
        created_ts: -1
      }
    },
    {
      $skip: parseInt(offset),
    },
    {
      $limit: parseInt(limit),
    },
    {
      $project: {
        _id: 0,
        email_id: "$access.email_id",
        userData: {
          $filter: {
            input: '$usersArray',
            as: 'user',
            cond: { $eq: ["$$user.role", "ADMINISTRATOR"] }
          }
        }
      }
    }
  ]
  try {
    let data = {}
    data.accountDetails = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.account)
      .aggregate(aggregationExpression).toArray();
    data.totalAccountCount = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.account)
      .countDocuments({ "scope": { $ne: "PROVIDER" } });
    return data;
  }
  catch (error) {
    throw error;
  }
}

/* 
  function to get all Account Users for activity tracking
*/
async function getAllAccountUsersDetails(accountId) {
  let matchClause = {
    "account_id": ObjectID(accountId)
  }
  let projectClause = {
    _id: 0,
    user_id: "$_id",
    email_id: 1,
    role: 1,
    first_name: 1,
    last_name: 1
  }
  let aggregationExpression = [
    {
      $match: matchClause,
    },
    {
      $sort: {
        created_ts: -1
      }
    },
    {
      $project: projectClause,
    }
  ]
  try {
    const userDetails = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.user)
      .aggregate(aggregationExpression).toArray();
    return userDetails;
  }
  catch (error) {
    throw error;
  }
}

/** function to search day activity a user */
async function findActivitySearchQueryCount(id , isUser) {
  try {
    var matchClause = {
      created_ts: { $gte: new Date(new Date().toISOString().split("T")[0]).getTime() },
      isWorkspaceQuery: false
    }
    if(isUser){
      matchClause.user_id = ObjectID(id) ;
    }
    else {
      matchClause.account_id = ObjectID(id)
    }
    var aggregationExpression = [{
      $match: matchClause
    }]
    var daySearchResult = await MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.activity_tracker)
      .aggregate(aggregationExpression, { allowDiskUse: true }).toArray();

    return daySearchResult.length;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  addActivity,
  fetchAccountActivityData,
  fetchUserActivityData,
  fetchUserActivityDataByEmailId,
  getAllAccountsDetails,
  getAllAccountUsersDetails,
  findActivitySearchQueryCount
}
