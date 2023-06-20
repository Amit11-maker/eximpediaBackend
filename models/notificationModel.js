const TAG = "notificationModel";

const ObjectID = require("mongodb").ObjectID;
const { logger } = require("../config/logger");
const MongoDbHandler = require("../db/mongoDbHandler");
const ACCOUNT = "accountNotification";
const USER = "userNotification";
const GENERAL = "generalNotification";

const add = async (notificationDetails, notificationType) => {
  try {
    logger.log(JSON.stringify(notificationDetails, notificationType));
    if (notificationType == "general") {
      notificationDetails.created_at = new Date().getTime();
      notificationDetails.view = false;
      const result = await MongoDbHandler.getDbInstance()
        .collection(MongoDbHandler.collections.general_notification_details)
        .insertOne(notificationDetails);
      return result;
    } else if (notificationType == "user") {
      let notificationArray = [];
      for (let userId of notificationDetails.user_id) {
        let notificationData = {};
        notificationData.user_id = ObjectID(userId);
        notificationData.heading = notificationDetails.heading;
        notificationData.description = notificationDetails.description;
        notificationData.link = notificationDetails.link;
        notificationData.created_at = new Date().getTime();
        notificationData.view = false;
        notificationArray.push({ ...notificationData });
      }
      let result = await MongoDbHandler.getDbInstance()
        .collection(MongoDbHandler.collections.user_notification_details)
        .insertMany(notificationArray);
      return result;
    } else if (notificationType == "account") {
      let notificationArray = [];
      for (let accountId of notificationDetails.account_id) {
        // console.log(accountId);
        let notificationData = {};
        notificationData.account_id = ObjectID(accountId);
        notificationData.heading = notificationDetails.heading;
        notificationData.description = notificationDetails.description;
        notificationData.link = notificationDetails.link;
        notificationData.created_at = new Date().getTime();
        notificationData.view = false;
        notificationArray.push({ ...notificationData });
      }
      let result = await MongoDbHandler.getDbInstance()
        .collection(MongoDbHandler.collections.account_notification_details)
        .insertMany(notificationArray);
      return result;
    } else {
      throw { msg: "please share correct notification type" };
    }
  } catch (error) {
    logger.log(
      ` NOTIFICATION MODEL ================== ${JSON.stringify(error)}`
    );
    throw error;
  }
};

const fetchAccountNotification = (accountId, timeStamp, flagValue) => {
  // logger.log("in");
  if (
    accountId != undefined &&
    timeStamp != undefined &&
    flagValue != undefined
  ) {
    return new Promise((resolve, reject) => {
      let aggregationClause = [
        {
          $match: {
            heading: "Recharge",
            account_id: ObjectID(accountId),
            created_at: {
              $lt: timeStamp,
            },
            flag: flagValue,
          },
        },
      ];

      MongoDbHandler.getDbInstance()
        .collection(MongoDbHandler.collections.account_notification_details)
        .aggregate(
          aggregationClause,
          {
            allowDiskUse: true,
          },
          function (err, cursor) {
            if (err)
              logger.log(
                ` NOTIFICATION MODEL ================== ${JSON.stringify(err)}`
              );
            cursor.toArray(function (err, results) {
              if (err) {
                logger.log(
                  ` NOTIFICATION MODEL ================== ${JSON.stringify(
                    err
                  )}`
                );
                logger.log(JSON.stringify(err));
              } else {
                if (results.length > 0) {
                  // console.log(results);
                } else {
                  // console.log(results);
                  let notificationDetails = {
                    account_id: ObjectID(accountId),
                    heading: "Recharge",
                    description: `Your account is about to expire ${flagValue} days`,
                    link: "",
                    created_at: new Date().getTime(),
                    flag: flagValue,
                  };
                  MongoDbHandler.getDbInstance()
                    .collection(
                      MongoDbHandler.collections.account_notification_details
                    )
                    .insertOne(notificationDetails, function (err, result) {
                      if (err) {
                        logger.log(
                          ` NOTIFICATION MODEL ================== ${JSON.stringify(
                            err
                          )}`
                        );
                      } else {
                        // console.log(result);
                      }
                    });
                }
              }
            });
          }
        );
    });
  }
};

async function getGeneralNotifications() {
  let generalAggregationExpression = [
    {
      $match: {
        created_at: {
          $gte: new Date(
            new Date().getTime() - 10 * 24 * 60 * 60 * 1000
          ).getTime(),
        },
      },
    },
    { $sort: { created_at: -1, view: -1 } },
  ];

  try {
    let generalNotifications = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.general_notification_details)
      .aggregate(generalAggregationExpression)
      .toArray();

    return generalNotifications;
  } catch (error) {
    throw error;
  }
}

async function getUserNotifications(userId) {
  let userAggregationExpression = [
    {
      $match: {
        user_id: ObjectID(userId),
        created_at: {
          $gte: new Date(
            new Date().getTime() - 10 * 24 * 60 * 60 * 1000
          ).getTime(),
        },
      },
    },
    { $sort: { created_at: -1, view: -1 } },
  ];
  try {
    let userNotifications = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.user_notification_details)
      .aggregate(userAggregationExpression)
      .toArray();

    return userNotifications;
  } catch (error) {
    throw error;
  }
}

async function getAccountNotifications(accountId) {
  let accountAggregationExpression = [
    {
      $match: {
        account_id: ObjectID(accountId),
        created_at: {
          $gte: new Date(
            new Date().getTime() - 10 * 24 * 60 * 60 * 1000
          ).getTime(),
        },
      },
    },
    { $sort: { created_at: -1, view: -1 } },
  ];
  try {
    let accountNotifications = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.account_notification_details)
      .aggregate(accountAggregationExpression)
      .toArray();

    return accountNotifications;
  } catch (error) {
    throw error;
  }
}

const updateNotifications = (notificationIdArr) => {
  let notificationArr = [];
  for (let id of notificationIdArr) {
    notificationArr.push(ObjectID(id));
  }

  let updateClause = {
    $set: {},
  };

  updateClause.$set = { view: true };

  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.general_notification_details)
    .updateMany({ _id: { $in: notificationArr } }, updateClause);

  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.user_notification_details)
    .updateMany({ _id: { $in: notificationArr } }, updateClause);

  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.account_notification_details)
    .updateMany({ _id: { $in: notificationArr } }, updateClause);
};

const checkDataUpdation = async () => {
  try {
    let todayDate = new Date();
    let lte_ts = todayDate.getTime();
    let gte_ts = todayDate.setDate(todayDate.getDate() - 1);

    let query = {
      created_ts: { $gte: gte_ts, $lte: lte_ts },
    };
    let result = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.ledger)
      .distinct("country", query);

    return result;
  } catch (error) {
    logger.log(
      ` NOTIFICATION MODEL ================== ${JSON.stringify(error)}`
    );
    throw error;
  }
};

const checkFavoriteCompanyUpdation = async () => {
  let todayDate = new Date();
  let lte_ts = todayDate.getTime();
  let gte_ts = todayDate.setDate(todayDate.getDate() - 1);

  let query = {
    createdAt: { $gte: gte_ts, $lte: lte_ts },
  };
  let result = await MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.favoriteShipment)
    .find(query)
    .toArray();

  return result;
};

const clubNotifications = async () => {
  try {
    let todayDate = new Date();
    let lte_ts = todayDate.getTime();
    let gte_ts = todayDate.setDate(todayDate.getDate() - 1);

    let aggregationClause = [
      {
        $match: {
          created_at: {
            $gte: gte_ts,
            $lte: lte_ts,
          },
          view: {
            $exists: true,
          },
        },
      },
      {
        $sort: {
          view: 1,
          created_at: -1,
        },
      },
      {
        $limit: 10,
      },
    ];
    let clubNotification = {};

    let accountNotification = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.account_notification_details)
      .aggregate(aggregationClause, {
        allowDiskUse: true,
      })
      .toArray();

    let generalNotification = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.general_notification_details)
      .aggregate(aggregationClause, {
        allowDiskUse: true,
      })
      .toArray();
    let userNotification = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.user_notification_details)
      .aggregate(aggregationClause, {
        allowDiskUse: true,
      })
      .toArray();
    if (accountNotification.length > 0) {
      clubNotification.accountNotification = accountNotification;
    }

    if (generalNotification.length > 0) {
      clubNotification.generalNotification = generalNotification;
    }

    if (userNotification.length > 0) {
      clubNotification.userNotification = userNotification;
    }

    return clubNotification;
  } catch (error) {
    logger.log(JSON.stringify(error));
    throw error;
  }
};

const updateNotification = async (notificationArr) => {
  try {
    for (let notificationType in notificationArr) {
      for (let notificationData of notificationArr[notificationType]) {
        switch (notificationType) {
          case ACCOUNT: {
            let query = {};
            query.filterQuery = {
              _id: ObjectID(notificationData._id),
            };
            query.updateQuery = { $set: { view: true } };
            logger.log(JSON.stringify(query));

            await MongoDbHandler.getDbInstance()
              .collection(
                MongoDbHandler.collections.account_notification_details
              )
              .updateOne(query.filterQuery, query.updateQuery);
            break;
          }
          case GENERAL: {
            let query = {};
            query.filterQuery = {
              _id: ObjectID(notificationData._id),
            };
            query.updateQuery = { $set: { view: true } };
            logger.log(JSON.stringify(query));

            await MongoDbHandler.getDbInstance()
              .collection(
                MongoDbHandler.collections.general_notification_details
              )
              .updateOne(query.filterQuery, query.updateQuery);
            break;
          }
          case USER: {
            let query = {};
            query.filterQuery = {
              _id: ObjectID(notificationData._id),
            };
            query.updateQuery = { $set: { view: true } };
            logger.log(JSON.stringify(query));

            await MongoDbHandler.getDbInstance()
              .collection(MongoDbHandler.collections.user_notification_details)
              .updateOne(query.filterQuery, query.updateQuery);
            break;
          }
          default: {
            break;
          }
        }
      }
    }
  } catch (error) {
    logger.log(JSON.stringify(error));
    throw error;
  }
};

async function updateNotificationsStatus() {
  let matchExpression = {
    view : { $exists : true},
    view: false,
    created_at: {
      $lte: new Date(new Date().getTime() - 10 * 24 * 60 * 60 * 1000).getTime(),
    },
  };

  let updateExpression = {
    view: true,
  };

  try {
    await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.account_notification_details)
      .updateMany(matchExpression, updateExpression);

    await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.user_notification_details)
      .updateMany(matchExpression, updateExpression);

    await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.general_notification_details)
      .updateMany(matchExpression, updateExpression);
  } catch (error) {
    throw error;
  }
}

module.exports = {
  add,
  fetchAccountNotification,
  getGeneralNotifications,
  getUserNotifications,
  getAccountNotifications,
  updateNotifications,
  checkDataUpdation,
  clubNotifications,
  updateNotification,
  checkFavoriteCompanyUpdation,
  updateNotificationsStatus,
};
