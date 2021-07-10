const TAG = 'activityController';

const EnvConfig = require('../config/envConfig');

const ActivityModel = require('../models/activityModel');
const OrderModel = require('../models/orderModel');
const UserModel = require('../models/userModel');
const AccountSchema = require('../schemas/accountSchema');
const UserSchema = require('../schemas/userSchema');
const SubscriptionSchema = require('../schemas/subscriptionSchema');
const OrderSchema = require('../schemas/orderSchema');
const PaymentSchema = require('../schemas/paymentSchema');

const CryptoHelper = require('../helpers/cryptoHelper');
const EmailHelper = require('../helpers/emailHelper');

const QUERY_PARAM_TERM_VERIFICATION_EMAIL = 'verification_email';

const create = (req, res) => {
  console.log("champ2323", req.body);

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
  console.log("reqy.sur3333", req.user, req.user.accountId)

  // let payload = req.body;

  // const pageKey = (payload.draw && payload.draw != 0) ? payload.draw : null;
  // let offset = null;
  // let limit = null;
  // //Datatable JS Mode
  // if (pageKey != null) {
  //   offset = (payload.start != null) ? payload.start : 0;
  //   limit = (payload.length != null) ? payload.length : 10;
  // } else {
  //   offset = (payload.offset != null) ? payload.offset : 0;
  //   limit = (payload.limit != null) ? payload.limit : 10;
  // }

  // // Temp Full Fetch Mode
  // offset = 0;
  // limit = 1000;

  // ActivityModel.findProviderActivity(null, offset, limit, (error, activities) => {
  //   if (error) {
  //     res.status(500).json({
  //       message: 'Internal Server Error',
  //     });
  //   } else {
  //     res.status(200).json({
  //       data: activities
  //     });
  //   }
  // });

  let payload = req.body;
  const pageKey = (payload.draw && payload.draw != 0) ? payload.draw : null;

  if (payload.search.value.length > 0) {
    let searchText = payload.search.value.length;
    if (searchText != undefined || searchText.length > 0) {
      ActivityModel.searchActivityByText(searchText, req.user.account_id, (error, activityDetails) => {
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

  ActivityModel.findProviderActivity(null, req.user.account_id, offset, limit, (error, activities) => {
    if (error) {
      console.log(error)
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      console.log(activities)
      if (activities.length > 0 && activities) {
        res.status(200).json({
          "recordsTotal": activities.length,
          // "summary":{"SUMMARY_RECORDS":8,"SUMMARY_SHIPMENTS":2,"SUMMARY_HS_CODE":1,"SUMMARY_BUYERS":1,"SUMMARY_SELLERS":1},
          "draw": pageKey,
          "data": activities
        });
      }
    }
  });

};
const fetchConsumerActivities = (req, res) => {
  // console.log("reqy.sur", req.user, req.user.accountId)
  let payload = req.body;
  const pageKey = (payload.draw && payload.draw != 0) ? payload.draw : null;

  if (payload.search.value.length > 0) {
    let searchText = payload.search.value.length;
    if (searchText != undefined || searchText.length > 0) {
      ActivityModel.searchActivityByText(searchText, req.user.account_id, (error, activityDetails) => {
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

  ActivityModel.findConsumerActivity(null, req.user.account_id, offset, limit, (error, activities) => {
    if (error) {
      console.log(error)
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      console.log(activities)
      if (activities.length > 0 && activities) {
        res.status(200).json({
          "recordsTotal": activities.length,
          // "summary":{"SUMMARY_RECORDS":8,"SUMMARY_SHIPMENTS":2,"SUMMARY_HS_CODE":1,"SUMMARY_BUYERS":1,"SUMMARY_SELLERS":1},
          "draw": pageKey,
          "data": activities
        });
      }
    }
  });

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
