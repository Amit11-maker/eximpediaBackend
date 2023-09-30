const TAG = "accountController";

const EnvConfig = require("../config/envConfig");
const AccountModel = require("../models/accountModel");
const OrderModel = require("../models/orderModel");
const UserModel = require("../models/userModel");
const UserController = require("../controllers/userController");
const TradeModel = require("../models/tradeModel");
const AccountSchema = require("../schemas/accountSchema");
const UserSchema = require("../schemas/userSchema");
const SubscriptionSchema = require("../schemas/subscriptionSchema");
const OrderSchema = require("../schemas/orderSchema");
const PaymentSchema = require("../schemas/paymentSchema");
const EmailHelper = require("../helpers/emailHelper");
const { logger } = require("../config/logger");

const create = (req, res) => {
  try {
    let payload = req.body;
    const account = AccountSchema.buildAccount(payload);
    AccountModel.add(account, (error, account) => {
      if (error) {
        logger.log(
          req.user.user_id,
          `ACCOUNT CONTROLLER 2 ================== ${JSON.stringify(error)}`
        );
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        res.status(200).json({
          id: account.insertedId,
        });
      }
    });
  } catch (err) {
    logger.log(
      req.user.user_id,
      `ACCOUNT CONTROLLER 1 ================== ${JSON.stringify(err)}`
    );
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const update = (req, res) => {
  let accountId = req.params.accountId;
  let payload = req.body;
  const accountUpdates = AccountSchema.buildAccountUpdate(payload);
  AccountModel.update(
    accountId,
    accountUpdates,
    (error, accountUpdateStatus) => {
      if (error) {
        logger.log(
          req.user.user_id,
          `ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`
        );
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
};

const deactivate = (req, res) => {
  let userId = req.params.userId;
  AccountModel.updateActivationStatus(
    fileId,
    AccountSchema.USER_MODE_DEACTIVATE,
    (error, deactiveStatus) => {
      if (error) {
        logger.log(
          req.user.user_id,
          `ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`
        );
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
};

const activate = (req, res) => {
  let userId = req.params.userId;
  AccountModel.updateActivationStatus(
    userId,
    AccountSchema.USER_MODE_ACTIVATE,
    (error, activeStatus) => {
      if (error) {
        logger.log(
          req.user.user_id,
          `ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`
        );
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
};

const verifyAccountEmailExistence = (req, res) => {
  let accountId = req.params.accountId;
  let emailId = req.query.emailId ? req.query.emailId.trim() : null;
  AccountModel.findByEmailForAccount(
    accountId,
    emailId,
    null,
    (error, emailExistence) => {
      if (error) {
        logger.log(
          req.user.user_id,
          `ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`
        );
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
};

const verifyEmailExistence = (req, res) => {
  let emailId = req.query.emailId ? req.query.emailId.trim() : null;
  AccountModel.findByEmail(emailId, null, (error, emailExistence) => {
    if (error) {
      logger.log(
        req.user.user_id,
        `ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`
      );
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      res.status(200).json({
        data: emailExistence ? true : false,
      });
    }
  });
};

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
      logger.log(
        req.user.user_id,
        `ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`
      );
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      res.status(200).json({
        data: accounts,
      });
    }
  });
};

const fetchAccountUsers = async (req, res) => {
  let accountId = req.params.accountId ? req.params.accountId.trim() : null;
  const blCountryArray = await TradeModel.getBlCountriesISOArray();

  UserModel.findByAccount(accountId, null, async (error, users) => {
    if (error) {
      logger.log(
        req.user.user_id,
        `ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`
      );
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      for (let user of users) {
        if (user._id == req.user.user_id && user.role != "ADMINISTRATOR") {
          users = [user];
        }
      }

      for (let user of users) {
        let blFlag = true;
        for (let i of blCountryArray) {
          if (!user?.available_countries?.includes(i)) {
            blFlag = false;
          }
        }

        if (!blFlag) {
          user.bl_selected = false;
        } else {
          user.bl_selected = true;
        }
      }

      let userCreationLimits = await UserModel.getUserCreationLimit(accountId);
      res.status(200).json({
        data: users,
        userCreationConsumedLimit:
          userCreationLimits.max_users.alloted_limit -
          userCreationLimits.max_users.remaining_limit,
        userCreationAllotedLimit: userCreationLimits.max_users.alloted_limit,
      });
    }
  });
};

const fetchAccountUserTemplates = (req, res) => {
  let accountId = req.params.accountId ? req.params.accountId.trim() : null;
  if (req.user.role == "ADMINISTRATOR") {
    UserModel.findTemplatesByAccount(accountId, null, (error, users) => {
      if (error) {
        logger.log(
          req.user.user_id,
          `ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`
        );
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        res.status(200).json({
          data: users,
        });
      }
    });
  } else {
    res.status(200).json({
      data: [
        {
          _id: req.user.user_id,
          first_name: req.user.first_name,
          last_name: req.user.last_name,
        },
      ],
    });
  }
};


const fetchAccountUserTemplatesForShareWorkspace = (req, res) => {
  let accountId = req.params.accountId ? req.params.accountId.trim() : null;
  UserModel.findTemplatesByAccount(accountId, null, (error, users) => {
    if (error) {
      logger.log(
        req.user.user_id,
        `ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`
      );
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      res.status(200).json({
        data: users,
      });
    }
  });
};


const fetchAccount = (req, res) => {
  let accountId = req.params.accountId ? req.params.accountId.trim() : null;
  logger.log(req.user.user_id, `Account_ID ==========2========== ${accountId}`);
  try {
    AccountModel.findById(accountId, null, (error, account) => {
      if (error) {
        logger.log(
          req.user.user_id,
          `ACCOUNT CONTROLLER ================== ${accountId} ==== ${JSON.stringify(
            error
          )}`
        );
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
  } catch (err) {
    logger.log(
      req.user.user_id,
      `ACCOUNT CONTROLLER Error ================== ${JSON.stringify(err)}`
    );
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

/* 
  controller function to add customers by provider panel 
*/
const register = (req, res) => {
  let payload = req.body;
  let account = AccountSchema.buildAccount(payload);
  account.referral_medium = payload.referral_medium;
  account.plan_constraints = {};

  UserModel.findByEmail(
    payload.user.email_id.toLowerCase().trim(),
    null,
    (error, userEntry) => {
      if (error) {
        logger.log(
          req.user.user_id,
          `ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`
        );
        res.status(500).json({
          message: "Error in creating user , please try again.",
        });
      } else {
        if (
          userEntry != null &&
          userEntry.email_id == account.access.email_id
        ) {
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
              logger.log(
                req.user.user_id,
                `ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`
              );
              res.status(500).json({
                message: "Internal Server Error",
              });
            } else {
              let accountId = account.insertedId;
              payload.user.account_id = accountId;
              payload.user.first_name = !payload.user.first_name
                ? "ADMIN"
                : payload.user.first_name;
              payload.user.last_name = !payload.user.last_name
                ? "OWNER"
                : payload.user.last_name;
              payload.user.role = UserSchema.USER_ROLES.administrator;
              const userData = UserSchema.buildUser(payload.user);

              userData.is_account_owner = 1;

              UserModel.add(userData, (error, user) => {
                if (error) {
                  logger.log(
                    req.user.user_id,
                    `ACCOUNT CONTROLLER ================== ${JSON.stringify(
                      error
                    )}`
                  );
                  res.status(500).json({
                    message: "Internal Server Error",
                  });
                } else {
                  let userId = user.insertedId;

                  let orderPayload = getOrderPayload(
                    payload,
                    accountId,
                    userId
                  );

                  let order = OrderSchema.buildOrder(orderPayload);
                  order.status = OrderSchema.PROCESS_STATUS_SUCCESS;

                  if (
                    payload.plan.subscriptionType ==
                    SubscriptionSchema.SUBSCRIPTION_PLAN_TYPE_CUSTOM
                  ) {
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
                    };

                    let payment = PaymentSchema.buildPayment(paymentPayload);
                    order.payments.push(payment);
                  }

                  let orderItemSubcsription = order.items[0];
                  let accountPlanConstraint = {
                    plan_constraints: orderItemSubcsription.meta,
                  };

                  accountPlanConstraint.plan_constraints.order_item_subscription_id =
                    orderItemSubcsription._id;
                  OrderModel.add(order, (error) => {
                    if (error) {
                      logger.log(
                        req.user.user_id,
                        `ACCOUNT CONTROLLER ================== ${JSON.stringify(
                          error
                        )}`
                      );
                      res.status(500).json({
                        message: "Internal Server Error",
                      });
                    } else {
                      AccountModel.update(
                        accountId,
                        accountPlanConstraint,
                        async (error, accountUpdateStatus) => {
                          if (error) {
                            logger.log(
                              req.user.user_id,
                              `ACCOUNT CONTROLLER ================== ${JSON.stringify(
                                error
                              )}`
                            );
                            res.status(500).json({
                              message: "Internal Server Error",
                            });
                          } else {
                            //storing AccountLimits
                            await addAccountLimits(
                              accountId,
                              accountPlanConstraint.plan_constraints
                            );

                            // updating credits and countries for user
                            updateUserData = {
                              available_credits:
                                accountPlanConstraint.plan_constraints
                                  .purchase_points,
                              available_countries:
                                accountPlanConstraint.plan_constraints
                                  .countries_available,
                            };
                            UserModel.update(
                              userId,
                              updateUserData,
                              async (error, userUpdateStatus) => {
                                if (error) {
                                  logger.log(
                                    req.user.user_id,
                                    `ACCOUNT CONTROLLER ================== ${JSON.stringify(
                                      error
                                    )}`
                                  );
                                  res.status(500).json({
                                    message: "Internal Server Error",
                                  });
                                } else {
                                  let resetPasswordId = 0;
                                  try {
                                    //to authenticate user
                                    resetPasswordId =
                                      await UserController.getResetPasswordId(
                                        userData
                                      );
                                  } catch (error) {
                                    logger.log(
                                      req.user.user_id,
                                      "UserController , Method = addEntryInResetPassword , Error = " +
                                      error
                                    );
                                  }

                                  sendActivationMail(
                                    res,
                                    payload,
                                    accountUpdateStatus,
                                    userUpdateStatus,
                                    userData,
                                    resetPasswordId
                                  );
                                }
                              }
                            );
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
    }
  );
};

function getOrderPayload(payload, accountId, userId) {
  let subscriptionItem = {};
  subscriptionItem = payload.plan;

  if (payload.plan.subscriptionType.startsWith("SP")) {
    subscriptionItem.category = SubscriptionSchema.ITEM_CATEGORY_SUBCRIPTION;
  } else if (payload.plan.subscriptionType.startsWith("WP")) {
    subscriptionItem.category = SubscriptionSchema.ITEM_CATEGORY_WEB;
  }

  let subscriptionOrderPayload = {
    upgrade: true,
    account_id: accountId,
    user_id: userId,
    items: [subscriptionItem],
    offers: [],
    charges: [],
  };
  subscriptionOrderPayload.applySubscription = true; // Registration Plan | Custom Plan -> Auto-Activation-Flag
  return subscriptionOrderPayload;
}

function sendActivationMail(
  res,
  payload,
  accountUpdateStatus,
  userUpdateStatus,
  userData,
  resetPasswordId
) {
  if (accountUpdateStatus && userUpdateStatus) {
    let templateData = {
      activationUrl:
        EnvConfig.HOST_WEB_PANEL +
        "password/reset-link?id" +
        "=" +
        resetPasswordId,
      recipientEmail: userData.email_id,
      recipientName: userData.first_name + " " + userData.last_name,
    };

    let emailTemplate =
      EmailHelper.buildEmailAccountActivationTemplate(templateData);

    let emailData = {
      recipientEmail: userData.email_id,
      subject: "Account Access Email Activation",
      html: emailTemplate,
    };

    EmailHelper.triggerEmail(emailData, function (error, mailtriggered) {
      if (error) {
        logger.log(
          `ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`
        );
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        if (mailtriggered) {
          res.status(200).json({
            data: {
              activation_email_id: payload.user.email_id,
            },
          });
        } else {
          res.status(200).json({
            data: {},
          });
        }
      }
    });
  } else {
    logger.log(
      req.user.user_id,
      "ACCOUNT CONTROLLER ==================  accountUpdateStatus && userUpdateStatus NOT FOUND"
    );
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
    const accounts = await AccountModel.getAllCustomersDetails(
      offset,
      limit,
      planStartIndex
    );
    if (accounts.accountDetails && accounts.accountDetails.length > 0) {
      res.status(200).json({
        data: accounts.accountDetails,
        recordsFiltered: accounts.totalAccountCount,
        totalAccountCount: accounts.totalAccountCount,
      });
    } else {
      res.status(200).json({
        data: "No accounts available.",
      });
    }
  } catch (error) {
    logger.log(
      req.user.user_id,
      `ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`
    );
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

/* 
  controller function to fetch customers which are created by website 
*/
async function fetchAllWebsiteCustomerAccounts(req, res) {
  let offset = req.body.offset ?? 0;
  let limit = req.body.limit ?? 1000;
  const planStartIndex = "WP";
  try {
    const accounts = await AccountModel.getAllCustomersDetails(
      offset,
      limit,
      planStartIndex
    );
    if (accounts.accountDetails && accounts.accountDetails.length > 0) {
      res.status(200).json({
        data: accounts.accountDetails,
        recordsFiltered: accounts.totalAccountCount,
        totalAccountCount: accounts.totalAccountCount,
      });
    } else {
      res.status(200).json({
        data: "No accounts available.",
      });
    }
  } catch (error) {
    logger.log(
      req.user.user_id,
      `ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`
    );
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

/* 
  controller function to fetch customer by Email 
*/
async function fetchCustomerAccountByEmail(req, res) {
  try {
    const accounts = await AccountModel.getCustomerDetailsByEmail(
      req.params.emailId
    );
    if (accounts.accountDetails && accounts.accountDetails.length > 0) {
      res.status(200).json({
        data: accounts.accountDetails,
      });
    } else {
      res.status(200).json({
        msg: "No account available.",
      });
    }
  } catch (error) {
    logger.log(
      req.user.user_id,
      `ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`
    );
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}
/* */
async function fetchCustomerAccountByEmailSuggestion(req, res) {
  try {
    const accounts = await AccountModel.getCustomerDetailsByEmailSuggestion(
      req.params.emailId
    );
    if (accounts.accountDetails && accounts.accountDetails.length > 0) {
      let suggestedEmails = [];
      for (let emailSuggestion of accounts.accountDetails) {
        suggestedEmails.push(emailSuggestion.access.email_id);
      }
      res.status(200).json({
        data: suggestedEmails,
      });
    } else {
      res.status(200).json({
        msg: "No account available.",
      });
    }
  } catch (error) {
    logger.log(
      `ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`
    );
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
    let accountDetails = await AccountModel.getAccountDetailsForCustomer(
      accountId
    );
    const accountLimitDetails = await AccountModel.getDbAccountLimits(
      accountId
    );

    for (let limit of Object.keys(accountLimitDetails)) {
      accountDetails[0]["plan_constraints"][limit] = {};
      accountDetails[0]["plan_constraints"][limit].remaining_limit =
        accountLimitDetails[limit]["remaining_limit"];
      accountDetails[0]["plan_constraints"][limit].alloted_limit =
        accountLimitDetails[limit]["alloted_limit"];
    }
    res.status(200).json({
      data: accountDetails,
    });
  } catch (error) {
    logger.log(
      req.user.user_id,
      `ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`
    );
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
      logger.log(
        req.user.user_id,
        `ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`
      );
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

/* 
  controller function to update customer account constraints from provider panel 
*/
async function updateCustomerConstraints(req, res) {
  let payload = req.body;
  let accountId = payload.accountId;

  let subscriptionItem = payload.plan;
  subscriptionItem.subscriptionType = payload.plan.subscriptionType;
  let constraints =
    SubscriptionSchema.buildSubscriptionConstraint(subscriptionItem);

  let accountPlanConstraint = {
    plan_constraints: constraints,
  };

  try {
    await updateAccountLimits(accountId, payload.plan);
    let dbAccount = await AccountModel.findAccountDetailsByID(accountId);
    const orderUpdateStatus =
      await OrderModel.updateItemSubscriptionConstraints(
        accountId,
        constraints
      );
    if (orderUpdateStatus) {
      // Adding already existing points to the new allocated ones
      accountPlanConstraint.plan_constraints.purchase_points +=
        dbAccount.plan_constraints.purchase_points;
      AccountModel.update(accountId, accountPlanConstraint, async (error) => {
        if (error) {
          logger.log(
            req.user.user_id,
            `ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`
          );
          res.status(500).json({
            message: "Something went wrong while updating account.",
            error: error,
          });
        } else {
          // updating credits and countries for user
          await updateUsersCountriesForAccount(payload);
          await updateUsersCreditsForAccount(payload, dbAccount);

          let templateData = {
            recipientEmail: dbAccount.access.email_id,
          };

          let emailTemplate =
            EmailHelper.buildEmailAccountConstraintsUpdationTemplate(
              templateData
            );

          let emailData = {
            recipientEmail: dbAccount.access.email_id,
            subject: "Account Subscription Updation",
            html: emailTemplate,
          };

          await EmailHelper.triggerEmail(emailData, function (error) {
            if (error) {
              logger.log(
                req.user.user_id,
                `ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`
              );
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
        message: "Order details not found for the account.",
      });
    }
  } catch (error) {
    logger.log(`ACCOUNT CONTROLLER = ${JSON.stringify(error)}`);
    res.status(500).json({
      message: "Internal Server Error",
      error: error,
    });
  }
}

async function updateAccountLimits(accountId, updatedPlan) {
  try {
    let dbAccountLimits = await AccountModel.getDbAccountLimits(accountId);
    if (dbAccountLimits) {
      let accountLimitsSchema = { ...dbAccountLimits };

      for (let limit of Object.keys(dbAccountLimits)) {
        if (updatedPlan[limit] == dbAccountLimits[limit]["remaining_limit"]) {
          continue;
        } else {
          accountLimitsSchema[limit]["total_alloted_limit"] =
            parseInt(dbAccountLimits[limit]["total_alloted_limit"]) +
            parseInt(updatedPlan[limit]);
          accountLimitsSchema[limit]["alloted_limit"] = parseInt(
            updatedPlan[limit]
          );
          accountLimitsSchema[limit]["remaining_limit"] = parseInt(
            updatedPlan[limit]
          );
          accountLimitsSchema[limit]["modified_at"] = Date.now();
        }
      }

      await AccountModel.updateAccountLimits(accountId, accountLimitsSchema);
    }
  } catch (error) {
    throw error;
  }
}

async function addAccountLimits(accountId, constraints) {
  try {
    let accountLimitsSchema = AccountSchema.accountLimits;

    for (let limit of Object.keys(accountLimitsSchema)) {
      accountLimitsSchema[limit]["total_alloted_limit"] = parseInt(
        constraints[limit]
      );
      accountLimitsSchema[limit]["alloted_limit"] = parseInt(
        constraints[limit]
      );
      accountLimitsSchema[limit]["remaining_limit"] = parseInt(
        constraints[limit]
      );
      accountLimitsSchema[limit]["created_at"] = Date.now();
      accountLimitsSchema[limit]["modified_at"] = Date.now();
    }

    let accountLimitPayload = AccountSchema.buildAccountLimits(
      accountId,
      accountLimitsSchema
    );

    await AccountModel.addAccountLimits(accountLimitPayload);
  } catch (error) {
    throw error;
  }
}

async function updateUsersCountriesForAccount(data) {
  try {
    let updateUserData = {
      available_countries: data.plan.countries_available,
    };

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
  } catch (error) {
    throw error;
  }
}

async function updateUsersCreditsForAccount(data, dbAccount) {
  try {
    let updateUserData = {
      available_credits:
        Number(data.plan.purchase_points) +
        Number(dbAccount.plan_constraints.purchase_points),
    };

    let users = await UserModel.findUserDetailsByAccountID(data.accountId);
    if (users) {
      users.forEach((user) => {
        if (
          user.role === "ADMINISTRATOR" ||
          user.available_credits === dbAccount.plan_constraints.purchase_points
        ) {
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
    await AccountModel.removeAccount(accountId);
    res.status(200).json({
      data: {
        msg: "Deleted Successfully!",
      },
    });
  } catch (error) {
    logger.log(
      req.user.user_id,
      `ACCOUNT CONTROLLER ================== ${JSON.stringify(error)}`
    );
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
  fetchCustomerAccountByEmail,
  fetchCustomerAccountByEmailSuggestion,
  getInfoForCustomerAccount,
  addOrGetPlanForCustomersAccount,
  updateCustomerConstraints,
  removeCustomerAccount,
  fetchAccountUserTemplatesForShareWorkspace
};
