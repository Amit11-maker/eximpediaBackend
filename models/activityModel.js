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
  } catch (error) {
    logger.error(`Method --> addActivity; \nerror --> ${JSON.stringify(error)}`)
    throw error;
  }
}

/* fetch activity data for a account */
async function fetchAccountActivityData(accountId , dateFrom = null , dateTo = null) {

  dateTo = dateTo + 'T23:59:59';
  let aggregationExpression = [
    {
      $match: {
        account_id: ObjectID(accountId),
      },
    },
    {
      $match: {
        created_ts: {
          $gte: dateFrom
            ? new Date(dateFrom).getTime()
            : new Date(new Date().toISOString().split("T")[0]).getTime(),
          $lte: dateTo ? new Date(dateTo).getTime() : new Date().getTime(),
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "account_id",
        foreignField: "account_id",
        as: "usersArray",
      },
    },
    {
      $sort: {
        created_ts: -1,
      },
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
        workspaceCreationQuery: "$isWorkspaceQuery",
      },
    },
  ];

  try {
    const accountActivityResult = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.activity_tracker)
      .aggregate(aggregationExpression, { allowDiskUse: true })
      .toArray();

    return accountActivityResult;
  } catch (error) {
    throw error;
  }
}

/* fetch activity data for a user */
async function fetchUserActivityData(userId, dateFrom = null, dateTo = null) {
  dateTo = dateTo + 'T23:59:59';
  let aggregationExpression = [
    {
      $match: {
        user_id: ObjectID(userId),
      },
    },
    {
      $match: {
        created_ts: {
          $gte: dateFrom
            ? new Date(dateFrom).getTime()
            : new Date(new Date().toISOString().split("T")[0]).getTime(),
          $lte: dateTo ? new Date(dateTo).getTime() : new Date().getTime(),
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "usersArray",
      },
    },
    {
      $sort: {
        created_ts: -1,
      },
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
        workspaceCreationQuery: "$isWorkspaceQuery",
      },
    },
  ];

  try {
    const userActivityResult = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.activity_tracker)
      .aggregate(aggregationExpression, { allowDiskUse: true })
      .toArray();

    return userActivityResult;
  } catch (error) {
    throw error;
  }
}

/* fetch activity data for a user */
async function fetchUserActivityDataByEmailId(emailId) {
  try {
    const userId = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.user)
      .find({ email_id: emailId })
      .project({ _id: 1 })
      .toArray();

    const userActivityResult = await fetchUserActivityData(userId[0]._id);

    return userActivityResult;
  } catch (error) {
    throw error;
  }
}

/* 
  function to get all Accounts counts for activity tracking
*/
async function getAllAccountsDetails() {
  try {
    let data = {};
    data.totalAccountCount = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.account)
      .countDocuments({ scope: { $ne: "PROVIDER" } });

    return data;
  } catch (error) {
    throw error;
  }
}

/* 
  function to get all Account Users for activity tracking
*/
async function getAllAccountUsersDetails(accountId) {
  let matchClause = {
    account_id: ObjectID(accountId),
  };
  let projectClause = {
    _id: 0,
    user_id: "$_id",
    email_id: 1,
    role: 1,
    first_name: 1,
    last_name: 1,
  };
  let aggregationExpression = [
    {
      $match: matchClause,
    },
    {
      $sort: {
        created_ts: -1,
      },
    },
    {
      $project: projectClause,
    },
  ];
  try {
    const userDetails = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.user)
      .aggregate(aggregationExpression)
      .toArray();
    return userDetails;
  } catch (error) {
    throw error;
  }
}

/** function to search day activity a user */
async function findActivitySearchQueryCount(id, isUser, dateFrom = null, dateTo = null) {
  dateTo = dateTo + 'T23:59:59';
  try {
    var matchClause = {
      created_ts: {
        $gte: dateFrom
          ? new Date(dateFrom).getTime()
          : new Date(new Date().toISOString().split("T")[0]).getTime(),
        $lte: dateTo ? new Date(dateTo).getTime() : new Date().getTime(),
      }
    };
    if (isUser) {
      matchClause.user_id = ObjectID(id);
    } else {
      matchClause.account_id = ObjectID(id);
    }

    var daySearchResult = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.activity_tracker)
      .countDocuments(matchClause);

    return daySearchResult;
  } catch (error) {
    throw error;
  }
}

/** function to search day activity a user */
async function getActivityDetailsForAccounts(offset, limit, dateFrom = null, dateTo = null) {
  try {
    let activityAggregationExpression = [
      {
        $match: {
          created_ts: {
            $gte: dateFrom
              ? new Date(dateFrom).getTime()
              : new Date(new Date().toISOString().split("T")[0]).getTime(),
            $lte: dateTo ? new Date(dateTo).getTime() : new Date().getTime(),
          }
        },
      },
      {
        $group: {
          _id: "$account_id",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
      {
        $lookup: {
          from: "accounts",
          localField: "_id",
          foreignField: "_id",
          as: "account",
        },
      },
      {
        $skip: offset,
      },
      {
        $limit: limit,
      },
    ];

    var daySearchResult = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.activity_tracker)
      .aggregate(activityAggregationExpression)
      .toArray();

    return daySearchResult;
  } catch (error) {
    throw error;
  }
}

const findUserByEmailInActivity = async (email_id) => {
  try {
    let detail = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.user)
      .findOne({ email_id: email_id });

    return detail;
  } catch (error) {
    throw error;
  }
}

/* Fetch email suggestions for user activity data */
async function getUsersByEmailSuggestion(emailId) {
  let matchClause = {
    "access.email_id": {$regex: emailId}
  }
  let groupClause = {
    _id: "$access.email_id",
    count:{$sum:1}
  }
  
  let projectClause = {
    _id: 0,
    "access.email_id": "$_id"
  }
  let limitClause = 4;
  
  let aggregationExpression = [
    {
      $match: matchClause
    },
    {
      $group:groupClause
    },
    {
      $project: projectClause
    },
    {
      $limit : limitClause
    }
  ]
  try {
    let data = {}
    data.userDetails = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.account)
      .aggregate(aggregationExpression).toArray();

    return data;
  }
  catch (error) {
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
  findActivitySearchQueryCount,
  getActivityDetailsForAccounts,
  findUserByEmailInActivity,
  getUsersByEmailSuggestion
}
