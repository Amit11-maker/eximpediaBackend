const TAG = 'activityController';
const ActivityModel = require('../models/activityModel');
const ActivitySchema = require('../schemas/acitivitySchema');


/* controller to create user activity */
async function createActivity(req, res) {
  let payload = req.body;
  const activity = ActivitySchema.buildActivity(payload);
  try {
    const addActivityResult = await ActivityModel.addActivity(activity);

    res.status(200).json({
      id: account.insertedId
    });
  }
  catch (error) {
    res.status(500).json({
      message: 'Internal Server Error',
    });
  }
}

/* controller to fetch account activity data */
async function fetchAccountActivityData(req, res) {
  let accountId = req.params.accountId;
  try {
    const accountActivityData = await ActivityModel.fetchAccountActivityData(accountId);

    res.status(200).json({
      data: accountActivityData
    });
  }
  catch (error) {
    res.status(500).json({
      message: 'Internal Server Error',
    });
  }
}

/* controller to fetch particular user activity data */
async function fetchUserActivityData(req, res) {
  let userId = req.params.userId;
  try {
    const userActivityData = await ActivityModel.fetchUserActivityData(userId);

    res.status(200).json({
      data: userActivityData
    });
  }
  catch (error) {
    res.status(500).json({
      message: 'Internal Server Error',
    });
  }
}

/* controller to fetch particular user activity data by emailId*/
async function fetchUserActivityDataByEmailId(req, res) {
  let emailId = req.params.emailId;
  try {
    const userActivityData = await ActivityModel.fetchUserActivityDataByEmailId(emailId);

    res.status(200).json({
      data: userActivityData
    });
  }
  catch (error) {
    res.status(500).json({
      message: 'Internal Server Error',
    });
  }
}

/* 
  controller function to fetch all accounts list for activity tracking 
*/
async function fetchAllCustomerAccountsForActivity(req, res) {
  let offset = req.body.offset ?? 0;
  let limit = req.body.limit ?? 1000;
  try {
    const accounts = await ActivityModel.getAllAccountsDetails(offset, limit);
    if (accounts.accountDetails && accounts.accountDetails.length > 0) {
      res.status(200).json({
        data: accounts.accountDetails,
        recordsFiltered: accounts.totalAccountCount,
        totalAccountCount: accounts.totalAccountCount
      });
    }
    else {
      res.status(200).json({
        data: "No accounts available."
      });
    }
  }
  catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

/* 
  controller function to fetch all accounts list for activity tracking 
*/
async function fetchAllAccountUsersForActivity(req, res) {
  let accountId = req.params.accountId;
  try {
    const accountUsers = await ActivityModel.getAllAccountUsersDetails(accountId);
    if (accountUsers && accountUsers.length > 0) {
      res.status(200).json({
        data: accountUsers
      });
    }
    else {
      res.status(409).json({
        data: "No users available for this account ."
      });
    }
  }
  catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

module.exports = {
  createActivity,
  fetchAccountActivityData,
  fetchUserActivityData,
  fetchUserActivityDataByEmailId,
  fetchAllCustomerAccountsForActivity,
  fetchAllAccountUsersForActivity
}
