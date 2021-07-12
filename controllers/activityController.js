const TAG = 'activityController';

const EnvConfig = require('../config/envConfig');

const ActivityModel = require('../models/activityModel');
const UserModel = require('../models/userModel');
const AccountSchema = require('../schemas/accountSchema');

const create = (req, res) => {

  let payload = req.body;
  const account = AccountSchema.buildAccount(payload);
  ActivityModel.add(account, (error, account) => {
    if (error) {
      console.log(error);
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        id: account.insertedId
      });
    }
  });
};

const fetchProviderActivities = (req, res) => {
  let scope = 'CONSUMER';
  let payload = req.body;
  const pageKey = (payload.draw && payload.draw != 0) ? payload.draw : null;
  let offset = null;
  let limit = null;
  //Datatable JS Mode
  if (pageKey != null) {
    offset = (payload.start != null) ? payload.start : 0;
    limit = (payload.length != null) ? payload.length : 10;
  } else {
    offset = (payload.offset != null) ? payload.offset : 0;
    limit = (payload.limit != null) ? payload.limit : 10;
  }

  payload.offset = offset;
  payload.limit = limit;

  if (payload.search.value.length > 0) {
    let searchText = payload.search.value;
    if (searchText != undefined || searchText.length > 0) {
      searchText = searchText.toLowerCase();
      ActivityModel.findProviderActivity(searchText, scope, offset, limit, (error, activityDetails) => {
        if (error) {
          res.status(500).json({
            message: 'Internal Server Error',
          });
        } else {
          res.status(200).json({
            "recordsTotal": activityDetails.length,
            // "summary":{"SUMMARY_RECORDS":8,"SUMMARY_SHIPMENTS":2,"SUMMARY_HS_CODE":1,"SUMMARY_BUYERS":1,"SUMMARY_SELLERS":1},
            "draw": pageKey,
            "data": activityDetails
          });
        }
      });
    }
  }
  else {
    ActivityModel.findProviderActivity(null, scope, offset, limit, (error, activities) => {
      if (error) {
        console.log(error)
        res.status(500).json({
          message: 'Internal Server Error',
        });
      } else {
        if (activities.length > 0 && activities) {
          res.send({
            "recordsTotal": activities.length,
            // "summary":{"SUMMARY_RECORDS":8,"SUMMARY_SHIPMENTS":2,"SUMMARY_HS_CODE":1,"SUMMARY_BUYERS":1,"SUMMARY_SELLERS":1},
            "draw": pageKey,
            "data": activities
          });
        }
      }
    });
  }

};


const fetchConsumerActivities = (req, res) => {
  // console.log("reqy.sur", req.user, req.user.accountId)
  let scope = 'CONSUMER';
  let payload = req.body;
  const pageKey = (payload.draw && payload.draw != 0) ? payload.draw : null;
  let offset = null;
  let limit = null;
  //Datatable JS Mode
  if (pageKey != null) {
    offset = (payload.start != null) ? payload.start : 0;
    limit = (payload.length != null) ? payload.length : 10;
  } else {
    offset = (payload.offset != null) ? payload.offset : 0;
    limit = (payload.limit != null) ? payload.limit : 10;
  }

  payload.offset = offset;
  payload.limit = limit;

  if (payload.search.value.length > 0) {
    let searchText = payload.search.value;
    if (searchText != undefined || searchText.length > 0) {
      searchText = searchText.toLowerCase();
      ActivityModel.findConsumerActivity(searchText, req.user.account_id, scope, offset, limit, (error, activityDetails) => {
        if (error) {
          res.status(500).json({
            message: 'Internal Server Error',
          });
        } else {
          res.status(200).json({
            "recordsTotal": activityDetails.length,
            // "summary":{"SUMMARY_RECORDS":8,"SUMMARY_SHIPMENTS":2,"SUMMARY_HS_CODE":1,"SUMMARY_BUYERS":1,"SUMMARY_SELLERS":1},
            "draw": pageKey,
            "data": activityDetails
          });
        }
      });
    }
  }
  else {
    ActivityModel.findConsumerActivity(null, req.user.account_id, scope, offset, limit, (error, activities) => {
      if (error) {
        console.log(error)
        res.status(500).json({
          message: 'Internal Server Error',
        });
      } else {
        if (activities.length > 0 && activities) {
          res.send({
            "recordsTotal": activities.length,
            // "summary":{"SUMMARY_RECORDS":8,"SUMMARY_SHIPMENTS":2,"SUMMARY_HS_CODE":1,"SUMMARY_BUYERS":1,"SUMMARY_SELLERS":1},
            "draw": pageKey,
            "data": activities
          });
        }
      }
    });
  }

};


const fetchCustomerAccounts = (req, res) => {

  let payload = req.body;

  const pageKey = (payload.draw && payload.draw != 0) ? payload.draw : null;
  let offset = null;
  let limit = null;
  //Datatable JS Mode
  if (pageKey != null) {
    offset = (payload.start != null) ? payload.start : 0;
    limit = (payload.length != null) ? payload.length : 10;
  } else {
    offset = (payload.offset != null) ? payload.offset : 0;
    limit = (payload.limit != null) ? payload.limit : 10;
  }

  // Temp Full Fetch Mode
  offset = 0;
  limit = 1000;

  ActivityModel.findCustomers(null, offset, limit, (error, accounts) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        data: accounts
      });
    }
  });

};


const fetchAccountUsers = (req, res) => {

  let accountId = (req.params.accountId) ? req.params.accountId.trim() : null;

  UserModel.findByAccount(accountId, null, (error, users) => {
    if (error) {
      console.log(error);
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        data: users
      });
    }
  });
};

const fetchAccountUserTemplates = (req, res) => {

  let accountId = (req.params.accountId) ? req.params.accountId.trim() : null;

  UserModel.findTemplatesByAccount(accountId, null, (error, users) => {
    if (error) {
      console.log(error);
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        data: users
      });
    }
  });
};

const fetchAccount = (req, res) => {
  let accountId = (req.params.accountId) ? req.params.accountId.trim() : null;
  ActivityModel.findById(accountId, null, (error, account) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      if (account) {
        res.status(200).json({
          data: account
        });
      } else {
        res.status(404).json({
          data: {
            type: 'MISSING',
            msg: 'Access Unavailable',
            desc: 'Account Not Found'
          }
        });
      }
    }
  });
};

const searchActivity = (req, res) => {
  var searchText = req.params.searchText;
  if (searchText != undefined || searchText.length > 0) {
    ActivityModel.searchActivityByText(searchText, (error, activityDetails) => {
      if (error) {
        res.status(500).json({
          message: 'Internal Server Error',
        });
      } else {
        res.status(200).json({
          data: activityDetails
        });
      }
    });
  }
  else {
    // return error
  }
};


module.exports = {
  create,
  fetchProviderActivities,
  fetchConsumerActivities,
  fetchCustomerAccounts,
  fetchAccountUsers,
  fetchAccountUserTemplates,
  fetchAccount,
  searchActivity
};
