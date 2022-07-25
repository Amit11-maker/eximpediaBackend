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
async function fetchAccountActivityData(req , res) {
  let accountId = req.params.accountId ;
  try {
    const accountActivityData = await ActivityModel.getAccountActivityData(accountId);

    res.status(200).json({
      data: accountActivityData
    });
  }
  catch(error){
    res.status(500).json({
      message: 'Internal Server Error',
    });
  }
}

/* controller to fetch particular user activity data */
async function fetchUserActivityData(req , res) {
  let userId = req.params.userId ;
  try {
    const userActivityData = await ActivityModel.getUserActivityData(userId);

    res.status(200).json({
      data: userActivityData
    });
  }
  catch(error){
    res.status(500).json({
      message: 'Internal Server Error',
    });
  }
}


module.exports = {
  createActivity,
  fetchAccountActivityData,
  fetchUserActivityData
}
