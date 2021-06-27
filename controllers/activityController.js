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
  console.log(req.body);

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

  ActivityModel.findProviderActivity(null, offset, limit, (error, accounts) => {
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
const fetchConsumerActivities = (req, res) => {
  // console.log("reqy.sur", req.user, req.user.accountId)
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

  ActivityModel.findConsumerActivity(null, req.user.account_id, offset, limit, (error, accounts) => {
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


module.exports = {
  create,
  fetchProviderActivities,
  fetchConsumerActivities,
  fetchCustomerAccounts,
  fetchAccountUsers,
  fetchAccountUserTemplates,
  fetchAccount
};
