const TAG = 'accountController';

const EnvConfig = require('../config/envConfig');

const AccountModel = require('../models/accountModel');
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
  // console.log(req.body);

  let payload = req.body;
  const account = AccountSchema.buildAccount(payload);
  AccountModel.add(account, (error, account) => {
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

const register = (req, res) => {

  let payload = req.body;
  let account = AccountSchema.buildAccount(payload);
  account.referral_medium = payload.referral_medium;
  account.plan_constraints = {}; //SubscriptionSchema.buildSubscriptionConstraint(payload.plan);  Hit Post Order Mapping

  UserModel.findByEmail(payload.user.email_id, null, (error, userEntry) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      if (userEntry != null && userEntry.email_id == account.access.email_id) {

        res.status(409).json({
          data: {
            type: 'CONFLICT',
            msg: 'Resource Conflict',
            desc: 'Email Already Registered For Another User'
          }
        });

      } else {

        AccountModel.add(account, (error, account) => {
          if (error) {
            res.status(500).json({
              message: 'Internal Server Error',
            });
          } else {
            let accountId = account.insertedId;
            payload.user.account_id = accountId;
            payload.user.first_name = 'ADMIN';
            payload.user.last_name = 'OWNER';
            payload.user.role = UserSchema.USER_ROLES.administrator;
            const userData = UserSchema.buildUser(payload.user);
            CryptoHelper.generateAutoSaltHashedPassword(payload.user.password, function (err, hashedPassword) {
              if (err) {
                res.status(500).json({
                  message: 'Internal Server Error',
                });
              } else {
                userData.password = hashedPassword;
                userData.is_account_owner = 1;

                UserModel.add(userData, (error, user) => {
                  if (error) {
                    res.status(500).json({
                      message: 'Internal Server Error',
                    });
                  } else {

                    let userId = user.insertedId;

                    let subscriptionItem = {};
                    if (payload.plan.subscriptionType == SubscriptionSchema.SUBSCRIPTION_PLAN_TYPE_CUSTOM) {
                      subscriptionItem = payload.plan;
                    }
                    subscriptionItem.category = SubscriptionSchema.ITEM_CATEGORY_SUBCRIPTION;
                    subscriptionItem.subscriptionType = payload.plan.subscriptionType;

                    let subscriptionOrderPayload = {
                      upgrade: true,
                      account_id: accountId,
                      user_id: userId,
                      items: [subscriptionItem],
                      offers: [],
                      charges: []
                    };
                    subscriptionOrderPayload.applySubscription = true; // Registration Plan | Custom Plan -> Auto-Activation-Flag
                    let order = OrderSchema.buildOrder(subscriptionOrderPayload);
                    order.status = OrderSchema.PROCESS_STATUS_SUCCESS;

                    if (payload.plan.subscriptionType == SubscriptionSchema.SUBSCRIPTION_PLAN_TYPE_CUSTOM) {
                      let paymentPayload = {
                        provider: "EXIMPEDIA",
                        transaction_id: payload.plan.payment.transaction_id,
                        order_ref_id: "",
                        transaction_signature: "",
                        error: null,
                        info: {
                          mode: PaymentSchema.PAYMENT_MODE_ONLINE_INDIRECT,
                          note: payload.plan.payment.note
                        },
                        currency: payload.plan.payment.currency,
                        amount: payload.plan.payment.amount
                      };
                      let payment = PaymentSchema.buildPayment(paymentPayload);
                      order.payments.push(payment);
                    }

                    let orderItemSubcsription = order.items.filter(item => item.category === SubscriptionSchema.ITEM_CATEGORY_SUBCRIPTION)[0];
                    let accountPlanConstraint = {
                      plan_constraints: orderItemSubcsription.meta
                    };
                    accountPlanConstraint.plan_constraints.order_item_subscription_id = orderItemSubcsription._id;
                    OrderModel.add(order, (error, orderEntry) => {
                      if (error) {
                        res.status(500).json({
                          message: 'Internal Server Error',
                        });
                      } else {

                        AccountModel.update(accountId, accountPlanConstraint, (error, accountUpdateStatus) => {
                          if (error) {
                            res.status(500).json({
                              message: 'Internal Server Error',
                            });
                          } else {

                            if (accountUpdateStatus) {

                              let templateData = {
                                activationUrl: EnvConfig.HOST_WEB_PANEL + 'consumers/accounts/email/verification?' + QUERY_PARAM_TERM_VERIFICATION_EMAIL + '=' + userData.email_id,
                                recipientEmail: userData.email_id,
                                recipientName: userData.first_name + " " + userData.last_name,
                              };
                              
                              let emailTemplate = EmailHelper.buildEmailAccountActivationTemplate(templateData);

                              let emailData = {
                                recipientEmail: userData.email_id,
                                subject: 'Account Access Email Activation',
                                html: emailTemplate
                              };

                              EmailHelper.triggerEmail(emailData, function (error, mailtriggered) {
                                if (error) {
                                  res.status(500).json({
                                    message: 'Internal Server Error',
                                  });
                                } else {
                                  if (mailtriggered) {
                                    res.status(200).json({
                                      data: {
                                        activation_email_id: payload.user.email_id
                                      }
                                    });
                                  } else {
                                    res.status(200).json({
                                      data: {}
                                    });
                                  }
                                }
                              });

                            } else {
                              res.status(500).json({
                                message: 'Internal Server Error',
                              });
                            }

                          }
                        });

                      }

                    });

                  }

                });
              }

            });
          }
        });

      }
    }
  });

};

const update = (req, res) => {
  let accountId = req.params.accountId;
  let payload = req.body;
  const accountUpdates = AccountSchema.buildAccountUpdate(payload);
  AccountModel.update(accountId, accountUpdates, (error, accountUpdateStatus) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        data: accountUpdateStatus
      });
    }
  });
};

const remove = (req, res) => {
  let accountId = req.params.accountId;
  AccountModel.remove(accountId, (error, userEntry) => {
    if (error) {
      console.log(error);
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        data: {
          msg: 'Deleted Successfully!',

        }
      });
    }
  });
}

const deactivate = (req, res) => {
  let userId = req.params.userId;
  AccountModel.updateActivationStatus(fileId, AccountSchema.USER_MODE_DEACTIVATE, (error, deactiveStatus) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        data: deactiveStatus
      });
    }
  });
};

const activate = (req, res) => {
  let userId = req.params.userId;
  AccountModel.updateActivationStatus(userId, AccountSchema.USER_MODE_ACTIVATE, (error, activeStatus) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        data: activeStatus
      });
    }
  });
};

const verifyAccountEmailExistence = (req, res) => {
  let accountId = req.params.accountId;
  let emailId = (req.query.emailId) ? req.query.emailId.trim() : null;
  AccountModel.findByEmailForAccount(accountId, emailId, null, (error, emailExistence) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        data: (emailExistence) ? true : false
      });
    }
  });
};

const verifyEmailExistence = (req, res) => {
  let emailId = (req.query.emailId) ? req.query.emailId.trim() : null;
  AccountModel.findByEmail(emailId, null, (error, emailExistence) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        data: (emailExistence) ? true : false
      });   
    }
  });
};


const fetchAccounts = (req, res) => {

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

  AccountModel.find(null, offset, limit, (error, accounts) => {
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

  // check for account id in request params
  let accountId = req.params.accountId;


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

  AccountModel.findCustomers(null, offset, limit, accountId, (error, accounts) => {
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
      var flag = false;  
      for(let user of users){
        if (user._id == req.user.user_id && user.role != 'ADMINISTRATOR'){
          flag = true
          users = [user]
        }
      }
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
  AccountModel.findById(accountId, null, (error, account) => {
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
  register,
  update,
  remove,
  activate,
  deactivate,
  verifyAccountEmailExistence,
  verifyEmailExistence,
  fetchAccounts,
  fetchCustomerAccounts,
  fetchAccountUsers,
  fetchAccountUserTemplates,
  fetchAccount
};
