const TAG = "activityModel";

const ObjectID = require("mongodb").ObjectID;

const MongoDbHandler = require("../db/mongoDbHandler");

const add = (activityDetails, cb) => {
  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.activity_tracker)
    .insertOne(activityDetails, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
};

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
};

const findProviderActivity = (searchText, scope, offset, limit, cb) => {
  aggregationExpression = [];
  // add filter user conddition
  aggregationExpression.push({
    $match: {
      scope: scope,
      role: "ADMINISTRATOR",
    },
  });
  aggregationExpression.push({
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "parent_id",
      as: "child",
    },
  });
  aggregationExpression.push({
    $lookup: {
      from: "activity_tracker",
      localField: "child._id",
      foreignField: "userId",
      as: "child",
    },
  });
  aggregationExpression.push({
      $lookup: {
          from: 'explore_search_query',
          localField: 'userId',
          foreignField: 'user_id',
          as: 'searchQuery'
      }
  })
  aggregationExpression.push({
    $unwind: {
      path: "$searchQuery",
      preserveNullAndEmptyArrays: true,
    },
  });
  aggregationExpression.push({
    $sort: {
      "searchQuery.created_at": -1,
    },
  });
  aggregationExpression.push({
    $group: {
      _id: "$_id",
      firstName: { $first: "$firstName" },
      lastName: { $first: "$lastName" },
      email: { $first: "$email" },
      login: { $first: "$login" },
      ip: { $first: "$ip" },
      browser: { $first: "$browser" },
      url: { $first: "$url" },
      role: { $first: "$role" },
      alarm: { $first: "$alarm" },
      scope: { $first: "$scope" },
      account_id: { $first: "$account_id" },
      userId: { $first: "$userId" },
      child: { $first: "$child" },
      searchQuery: {
        $push: "$searchQuery",
      },
    },
  });
  aggregationExpression.push({
    $addFields: {
      searchQuery: { $slice: ["$searchQuery", 10] },
    },
  });

  if (typeof searchText == "string" && searchText.length > 0) {
    aggregationExpression.push({
      $match: {
        $or: [
          {
            child: {
              $elemMatch: { firstName: new RegExp(`^.*${searchText}.*`, "i") },
            },
          },
          {
            child: {
              $elemMatch: { email: new RegExp(`^.*${searchText}.*`, "i") },
            },
          },
          {
            child: {
              $elemMatch: { role: new RegExp(`^.*${searchText}.*`, "i") },
            },
          },
          { firstName: new RegExp(`^.*${searchText}.*`, "i") },
          { email: new RegExp(`^.*${searchText}.*`, "i") },
          { role: new RegExp(`^.*${searchText}.*`, "i") },
        ],
      },
    });
  }
  // console.log(JSON.stringify(aggregationExpression));
  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.activity_tracker)
    .aggregate(aggregationExpression)
    .sort({
      login: -1,
    })
    .skip(parseInt(offset))
    .limit(parseInt(limit))
    .toArray(function (err, results) {
      if (err) {
        cb(err);
      } else {
        // console.log(results);
        cb(null, results);
      }
    });
};

const findConsumerActivity = (
  searchText,
  accountId,
  scope,
  offset,
  limit,
  cb
) => {
  aggregationExpression = [];
  // add filter user conddition
  aggregationExpression.push({
    $match: {
      scope: scope,
      account_id: ObjectID(accountId),
      role: "ADMINISTRATOR",
    },
  });
  aggregationExpression.push({
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "parent_id",
      as: "child",
    },
  });
  aggregationExpression.push({
    $lookup: {
      from: "activity_tracker",
      localField: "child._id",
      foreignField: "userId",
      as: "child",
    },
  });
  aggregationExpression.push({
    $lookup: {
      from: "workspace_query_save",
      localField: "userId",
      foreignField: "user_id",
      as: "workspaceQuery",
    },
  });
  aggregationExpression.push({
    $addFields: {
      workspaceQuery: { $last: "$workspaceQuery.query" },
    },
  });
  if (typeof searchText == "string" && searchText.length > 0) {
    aggregationExpression.push({
      $match: {
        $or: [
          {
            child: {
              $elemMatch: { firstName: new RegExp(`^.*${searchText}.*`, "i") },
            },
          },
          {
            child: {
              $elemMatch: { email: new RegExp(`^.*${searchText}.*`, "i") },
            },
          },
          {
            child: {
              $elemMatch: { role: new RegExp(`^.*${searchText}.*`, "i") },
            },
          },
          { firstName: new RegExp(`^.*${searchText}.*`, "i") },
          { email: new RegExp(`^.*${searchText}.*`, "i") },
          { role: new RegExp(`^.*${searchText}.*`, "i") },
        ],
      },
    });
  }
  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.activity_tracker)
    .aggregate(aggregationExpression)
    .sort({
      login: -1,
    })
    .skip(parseInt(offset))
    .limit(parseInt(limit))
    .toArray(function (err, results) {
      if (err) {
        cb(err);
      } else {
        for (let activity of results) {
          if (!activity.hasOwnProperty("workspace_query")) {
            activity.workspace_query = "";
          }
        }
        // console.log(results);
        cb(null, results);
      }
    });
};
const findConsumerSpecificActivity = (userId, scope, offset, limit, cb) => {
  aggregationExpression = [];
  // add filter user conddition
  aggregationExpression.push({
    $match: {
      scope: scope,
      userId: ObjectID(userId),
    },
  });
  aggregationExpression.push({
    $lookup: {
      from: "workspace_query_save",
      localField: "userId",
      foreignField: "user_id",
      as: "workspaceQuery",
    },
  });
  aggregationExpression.push({
    $addFields: {
      workspaceQuery: { $last: "$workspaceQuery.query" },
    },
  });
  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.activity_tracker)
    .aggregate(aggregationExpression)
    .sort({
      first_name: 1,
    })
    .skip(parseInt(offset))
    .limit(parseInt(limit))
    .toArray(function (err, results) {
      if (err) {
        cb(err);
      } else {
        for (let activity of results) {
          if (!activity.hasOwnProperty("workspace_query")) {
            activity.workspace_query = "";
          }
        }
        // console.log(results);
        cb(null, results);
      }
    });
};

module.exports = {
  add,
  update,
  findProviderActivity,
  findConsumerActivity,
  findConsumerSpecificActivity,
};
