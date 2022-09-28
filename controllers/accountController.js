const TAG = "accountController";

const EnvConfig = require("../config/envConfig");
const AccountModel = require("../models/accountModel");
const OrderModel = require("../models/orderModel");
const UserModel = require("../models/userModel");
const AccountSchema = require("../schemas/accountSchema");
const UserSchema = require("../schemas/userSchema");
const SubscriptionSchema = require("../schemas/subscriptionSchema");
const OrderSchema = require("../schemas/orderSchema");
const PaymentSchema = require("../schemas/paymentSchema");
const EmailHelper = require("../helpers/emailHelper");
const { logger } = require("../config/logger")

const create = (req, res) => {
  let payload = req.body;
  const account = AccountSchema.buildAccount(payload);
  AccountModel.add(account, (error, account) => {
    if (error) {
      logger.error(`ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`);
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      res.status(200).json({
        id: account.insertedId,
      });
    }
  });
}

const update = (req, res) => {
  let accountId = req.params.accountId;
  let payload = req.body;
  const accountUpdates = AccountSchema.buildAccountUpdate(payload);
  AccountModel.update(
    accountId,
    accountUpdates,
    (error, accountUpdateStatus) => {
      if (error) {
        logger.error(`ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`);
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        res.status(200).json({
          data: accountUpdateStatus,
        });
      }
    }
  );
}

const deactivate = (req, res) => {
  let userId = req.params.userId;
  AccountModel.updateActivationStatus(
    fileId,
    AccountSchema.USER_MODE_DEACTIVATE,
    (error, deactiveStatus) => {
      if (error) {
        logger.error(`ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`);;
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        res.status(200).json({
          data: deactiveStatus,
        });
      }
    }
  );
}

const activate = (req, res) => {
  let userId = req.params.userId;
  AccountModel.updateActivationStatus(
    userId,
    AccountSchema.USER_MODE_ACTIVATE,
    (error, activeStatus) => {
      if (error) {
        logger.error(`ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`);;
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        res.status(200).json({
          data: activeStatus,
        });
      }
    }
  );
}

const verifyAccountEmailExistence = (req, res) => {
  let accountId = req.params.accountId;
  let emailId = req.query.emailId ? req.query.emailId.trim() : null;
  AccountModel.findByEmailForAccount(
    accountId,
    emailId,
    null,
    (error, emailExistence) => {
      if (error) {
        logger.error(`ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`);;
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        res.status(200).json({
          data: emailExistence ? true : false,
        });
      }
    }
  );
}

const verifyEmailExistence = (req, res) => {
  let emailId = req.query.emailId ? req.query.emailId.trim() : null;
  AccountModel.findByEmail(emailId, null, (error, emailExistence) => {
    if (error) {
      logger.error(`ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`);;
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      res.status(200).json({
        data: emailExistence ? true : false,
      });
    }
  });
}

const fetchAccounts = (req, res) => {
  let payload = req.body;

  const pageKey = payload.draw && payload.draw != 0 ? payload.draw : null;
  let offset = null;
  let limit = null;
  //Datatable JS Mode
  if (pageKey != null) {
    offset = payload.start != null ? payload.start : 0;
    limit = payload.length != null ? payload.length : 10;
  } else {
    offset = payload.offset != null ? payload.offset : 0;
    limit = payload.limit != null ? payload.limit : 10;
  }

  // Temp Full Fetch Mode
  offset = 0;
  limit = 1000;

  AccountModel.find(null, offset, limit, (error, accounts) => {
    if (error) {
      logger.error(`ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`);;
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      res.status(200).json({
        data: accounts,
      });
    }
  });
}

const fetchAccountUsers = (req, res) => {
  let accountId = req.params.accountId ? req.params.accountId.trim() : null;

  UserModel.findByAccount(accountId, null, (error, users) => {
    if (error) {
      logger.error(`ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`);;
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      var flag = false;
      for (let user of users) {
        if (user._id == req.user.user_id && user.role != "ADMINISTRATOR") {
          flag = true;
          users = [user];
        }
      }
      res.status(200).json({
        data: users,
      });
    }
  });
}

const fetchAccountUserTemplates = (req, res) => {
  let accountId = req.params.accountId ? req.params.accountId.trim() : null;

  UserModel.findTemplatesByAccount(accountId, null, (error, users) => {
    if (error) {
      logger.error(`ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`);;
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      res.status(200).json({
        data: users,
      });
    }
  });
}

const fetchAccount = (req, res) => {
  let accountId = req.params.accountId ? req.params.accountId.trim() : null;
  logger.info(`Account_ID ==========2========== ${accountId}`)

  AccountModel.findById(accountId, null, (error, account) => {
    if (error) {
      logger.error(`ACCOUNT CONTROLLER ================== ${accountId} ==== ${JSON.stringify(error)}`);
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      if (account) {
        res.status(200).json({
          data: account,
        });
      } else {
        res.status(404).json({
          data: {
            type: "MISSING",
            msg: "Access Unavailable",
            desc: "Account Not Found",
          },
        });
      }
    }
  });
}

/* 
  controller function to add customers by provider panel 
*/
const register = (req, res) => {
  let payload = req.body;
  let account = AccountSchema.buildAccount(payload);
  account.referral_medium = payload.referral_medium;
  account.plan_constraints = {}

  UserModel.findByEmail(payload.user.email_id, null, (error, userEntry) => {
    if (error) {
      logger.error(`ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`);;
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      if (userEntry != null && userEntry.email_id == account.access.email_id) {
        res.status(409).json({
          data: {
            type: "CONFLICT",
            msg: "Resource Conflict",
            desc: "Email Already Registered For Another User",
          },
        });
      } else {
        AccountModel.add(account, (error, account) => {
          if (error) {
            logger.error(`ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`);;
            res.status(500).json({
              message: "Internal Server Error",
            });
          } else {
            let accountId = account.insertedId;
            payload.user.account_id = accountId;
            payload.user.first_name = (!payload.user.first_name) ? "ADMIN" : payload.user.first_name;
            payload.user.last_name = (!payload.user.last_name) ? "OWNER" : payload.user.last_name;
            payload.user.role = UserSchema.USER_ROLES.administrator;
            const userData = UserSchema.buildUser(payload.user);

            userData.is_account_owner = 1;

            UserModel.add(userData, (error, user) => {
              if (error) {
                logger.error(`ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`);;
                res.status(500).json({
                  message: "Internal Server Error",
                });
              } else {
                let userId = user.insertedId;

                let orderPayload = getOrderPayload(payload, accountId, userId);

                let order = OrderSchema.buildOrder(orderPayload);
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
                      note: payload.plan.payment.note,
                    },
                    currency: payload.plan.payment.currency,
                    amount: payload.plan.payment.amount,
                  }

                  let payment = PaymentSchema.buildPayment(paymentPayload);
                  order.payments.push(payment);
                }

                let orderItemSubcsription = order.items[0];
                let accountPlanConstraint = {
                  plan_constraints: orderItemSubcsription.meta
                }

                accountPlanConstraint.plan_constraints.order_item_subscription_id = orderItemSubcsription._id;
                OrderModel.add(order, (error) => {
                  if (error) {
                    logger.error(`ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`);;
                    res.status(500).json({
                      message: "Internal Server Error",
                    });
                  } else {
                    AccountModel.update(
                      accountId,
                      accountPlanConstraint,
                      (error, accountUpdateStatus) => {
                        if (error) {
                          logger.error(`ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`);;
                          res.status(500).json({
                            message: "Internal Server Error",
                          });
                        } else {
                          // updating credits and countries for user
                          updateUserData = {
                            available_credits: accountPlanConstraint.plan_constraints.purchase_points,
                            available_countries: accountPlanConstraint.plan_constraints.countries_available
                          }
                          UserModel.update(userId, updateUserData, (error, userUpdateStatus) => {
                            if (error) {
                              logger.error(`ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`);
                              res.status(500).json({
                                message: "Internal Server Error",
                              });
                            }
                            else {
                              sendActivationMail(res, payload, accountUpdateStatus, userUpdateStatus, userData);
                            }
                          });
                        }
                      }
                    );
                  }
                });
              }
            });
          }
        });
      }
    }
  });
}

function getOrderPayload(payload, accountId, userId) {
  let subscriptionItem = {}
  subscriptionItem = payload.plan;

  if (payload.plan.subscriptionType.startsWith('SP')) {
    subscriptionItem.category = SubscriptionSchema.ITEM_CATEGORY_SUBCRIPTION;
  }

  else if (payload.plan.subscriptionType.startsWith('WP')) {
    subscriptionItem.category = SubscriptionSchema.ITEM_CATEGORY_WEB;
  }

  let subscriptionOrderPayload = {
    upgrade: true,
    account_id: accountId,
    user_id: userId,
    items: [subscriptionItem],
    offers: [],
    charges: [],
  }
  subscriptionOrderPayload.applySubscription = true; // Registration Plan | Custom Plan -> Auto-Activation-Flag
  return subscriptionOrderPayload;
}

function sendActivationMail(res, payload, accountUpdateStatus, userUpdateStatus, userData) {
  if (accountUpdateStatus && userUpdateStatus) {
    let templateData = {
      activationUrl: EnvConfig.HOST_WEB_PANEL + "password/reset-link?id" + "=" + userData._id,
      recipientEmail: userData.email_id,
      recipientName: userData.first_name + " " + userData.last_name,
    }

    let emailTemplate = EmailHelper.buildEmailAccountActivationTemplate(templateData);

    let emailData = {
      recipientEmail: userData.email_id,
      subject: "Account Access Email Activation",
      html: emailTemplate,
    }

    EmailHelper.triggerEmail(emailData, function (error, mailtriggered) {
      if (error) {
        logger.error(`ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`);;
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        if (mailtriggered) {
          res.status(200).json({
            data: {
              activation_email_id: payload.user.email_id
            },
          });
        } else {
          res.status(200).json({
            data: {},
          });
        }
      }
    }
    );
  } else {
    logger.error("ACCOUNT CONTROLLER ==================  accountUpdateStatus && userUpdateStatus NOT FOUND");
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

/* 
  controller function to fetch customers which are created by provider panel 
*/
async function fetchAllCustomerAccounts(req, res) {
  let offset = req.body.offset ?? 0;
  let limit = req.body.limit ?? 1000;
  const planStartIndex = "SP";
  try {
    const accounts = await AccountModel.getAllCustomersDetails(offset, limit, planStartIndex);
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
    logger.error(`ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`);;
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

/* 
  controller function to fetch customers which are created by website 
*/
async function fetchAllWebsiteCustomerAccounts(req, res) {
  let offset = req.body.offset ?? 0;;
  let limit = req.body.limit ?? 1000;
  const planStartIndex = "WP";
  try {
    const accounts = await AccountModel.getAllCustomersDetails(offset, limit, planStartIndex);
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
    logger.error(`ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

/* 
  controller function to add or get plan for any customer account from provider panel 
*/
async function addOrGetPlanForCustomersAccount(req, res) {
  let accountId = req.params.accountId;
  try {
    const accountDetails = await AccountModel.getAccountDetailsForCustomer(accountId);
    res.status(200).json({
      data: accountDetails
    });
  } catch (error) {
    logger.error(`ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

/* 
  controller function to getInfo for any customer account from provider panel 
*/
async function getInfoForCustomerAccount(req, res) {
  let accountId = req.params.accountId;

  AccountModel.getInfoForCustomer(accountId, (error, accounts) => {
    if (error) {
      logger.error(`ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`);
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      res.status(200).json({
        data: accounts
      });
    }
  }
  );
}

/* 
  controller function to update customer account constraints from provider panel 
*/
async function updateCustomerConstraints(req, res) {
  let payload = req.body;
  let accountId = payload.accountId;

  let subscriptionItem = payload.plan;
  subscriptionItem.subscriptionType = payload.plan.subscriptionType;
  let constraints = SubscriptionSchema.buildSubscriptionConstraint(subscriptionItem);

  let accountPlanConstraint = {
    plan_constraints: constraints
  }

  try {
    await updateAccountLimits(accountId, payload.plan);
    let dbAccount = await AccountModel.findAccountDetailsByID(accountId);

    const orderUpdateStatus = await OrderModel.updateItemSubscriptionConstraints(accountId, constraints);
    if (orderUpdateStatus) {
      AccountModel.update(accountId, accountPlanConstraint, async (error) => {
        if (error) {
          logger.error(`ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`);
          res.status(500).json({
            message: "Something went wrong while updating account.",
            error: error
          });
        } else {
          // updating credits and countries for user
          await updateUsersCountriesForAccount(payload);
          await updateUsersCreditsForAccount(payload, dbAccount);

          let templateData = {
            recipientEmail: dbAccount.access.email_id
          }

          let emailTemplate = EmailHelper.buildEmailAccountConstraintsUpdationTemplate(templateData);

          let emailData = {
            recipientEmail: dbAccount.access.email_id,
            subject: "Account Subscription Updation",
            html: emailTemplate,
          }

          await EmailHelper.triggerEmail(emailData, function (error) {
            if (error) {
              logger.error(`ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`);
              res.status(500).json({
                message: "Internal Server Error",
              });
            } else {
              res.status(200).json({
                message: "Constarints updated.",
              });
            }
          });
        }
      });
    } else {
      res.status(409).json({
        message: "Order details not found for the account."
      });
    }
  }
  catch (error) {
    logger.error(`ACCOUNT CONTROLLER = ${JSON.stringify(error)}`);
    res.status(500).json({
      message: "Internal Server Error",
      error: error
    });
  }
}

async function updateAccountLimits(accountId, updatedPlan) {
  try {
    let dbAccountLimits = await AccountModel.getDbAccountLimits(accountId);
    if (dbAccountLimits) {
      let updatedAccountLimits = { ...dbAccountLimits }

      for (let limit of Object.keys(dbAccountLimits)) {
        if (updatedPlan[limit] == dbAccountLimits[limit]["consumed_limit"]) {
          continue;
        }
        else {
          updatedAccountLimits[limit]["total_alloted_limit"] = parseInt(dbAccountLimits[limit]["total_alloted_limit"]) + parseInt(updatedPlan[limit]);
          updatedAccountLimits[limit]["alloted_limit"] = updatedPlan[limit];
          updatedAccountLimits[limit]["consumed_limit"] = updatedPlan[limit];
          updatedAccountLimits[limit]["modified_at"] = Date.now();
        }
      }

      await AccountModel.updateAccountLimits(accountId, updatedAccountLimits);
    }
  } catch (error) {
    throw error;
  }
}

async function updateUsersCountriesForAccount(data) {
  try {
    let updateUserData = {
      available_countries: data.plan.countries_available
    }

    let users = await UserModel.findUserDetailsByAccountID(data.accountId);
    if (users) {
      users.forEach((user) => {
        UserModel.update(user._id, updateUserData, (error) => {
          if (error) {
            throw error;
          }
        });
      });
    }
  }
  catch (error) {
    throw error
  }
}

async function updateUsersCreditsForAccount(data, dbAccount) {
  try {
    let updateUserData = {
      available_countries: data.plan.countries_available
    }

    let users = await UserModel.findUserDetailsByAccountID(data.accountId);
    if (users) {
      users.forEach((user) => {
        if (user.role == "ADMINISTRATOR" || user.available_credits == dbAccount.plan_constraints.purchasePoints) {
          UserModel.update(user._id, updateUserData, (error) => {
            if (error) {
              throw error;
            }
          });
        }
      });
    }
  } catch (error) {
    throw error;
  }
}

/* 
  controller function to remove customer account from provider panel 
*/
async function removeCustomerAccount(req, res) {
  try {
    let accountId = req.params.accountId;
    await AccountModel.removeAccount(accountId)
    res.status(200).json({
      data: {
        msg: "Deleted Successfully!",
      },
    });
  } catch (error) {
    logger.error(`ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

module.exports = {
  create,
  register,
  update,
  activate,
  deactivate,
  verifyAccountEmailExistence,
  verifyEmailExistence,
  fetchAccounts,
  fetchAccountUsers,
  fetchAccountUserTemplates,
  fetchAccount,
  fetchAllCustomerAccounts,
  fetchAllWebsiteCustomerAccounts,
  getInfoForCustomerAccount,
  addOrGetPlanForCustomersAccount,
  updateCustomerConstraints,
  removeCustomerAccount
}
