const UserModel = require("../models/userModel");
const AccountModel = require("../models/accountModel");
const OrderModel = require("../models/orderModel");
const ObjectID = require('mongodb').ObjectID;
const signUpUserSchema = require("../schemas/signUpUserSchema");
const SubscriptionSchema = require("../schemas/subscriptionSchema");
const EnvConfig = require('../config/envConfig');
const EmailHelper = require('../helpers/emailHelper');
const { logger } = require("../config/logger");

let randomstring = require("randomstring");

function sendActivationMail(accountID, userID, res) {
  UserModel.findById(userID, null, (error, user) => {
    if (error) {
      logger.error("SIGNUP USER CONTROLLER ==================",JSON.stringify(error));
      res.status(500).json({
        message: "Internal Server Error",
      });
    }
    else {
      if (!user.is_email_verified) {
        let templateData = {
          activationUrl: EnvConfig.HOST_WEB_PANEL + "password/reset-link?id" + "=" + userID,
          recipientEmail: user.email_id,
          recipientName: user.first_name + " " + user.last_name,
        }

        let emailTemplate = EmailHelper.buildEmailAccountActivationTemplate(templateData);

        let emailData = {
          recipientEmail: user.email_id,
          subject: "Account Access Email Activation",
          html: emailTemplate,
        }

        EmailHelper.triggerEmail(
          emailData,
          (error, mailtriggered) => {
            if (error) {
              logger.error("SIGNUP USER CONTROLLER ==================",JSON.stringify(error));
              res.status(500).json({
                message: "Internal Server Error",
              });
            } else {
              if (mailtriggered) {
                res.status(200).json({
                  data: {
                    customer_id: accountID,
                    message: "Successfully Registered",
                    activation_email_id: user.email_id
                  }
                });
              } else {
                res.status(200).json({
                  data: {
                    customer_id: accountID,
                    message: "Issue in trigerring mail , please reset password from login page"
                  }
                });
              }
            }
          });
      }
      else {
        res.status(200).json({
          data: {
            customer_id: accountID,
            message: "Plan updated"
          }
        });
      }
    }
  });
}

const addSignUpUser = (req, res) => {
  let payload = req.body;

  UserModel.findByEmail(payload.email_id, null, (error, userEntry) => {
    if (error) {
      logger.error("SIGNUP USER CONTROLLER ==================",JSON.stringify(error));
      res.status(500).json({
        message: "Internal Server Error"
      });
    } else {
      if (userEntry != null && userEntry.email_id == payload.email_id) {
        res.status(409).json({
          data: {
            type: "CONFLICT",
            msg: "Resource Conflict",
            desc: "Email Already Registered For Another User"
          }
        });
      } else {
        let accountData = signUpUserSchema.buildAccount(payload);
        AccountModel.add(accountData, (error, account) => {
          if (error) {
            logger.error("SIGNUP USER CONTROLLER ==================",JSON.stringify(error));
            res.status(500).json({
              message: "Internal Server Error"
            });
          }
          else {
            const accountID = account.insertedId;
            payload.account_id = accountID;
            const userData = signUpUserSchema.buildUser(payload);

            UserModel.add(userData, (error) => {
              if (error) {
                logger.error("SIGNUP USER CONTROLLER ==================",JSON.stringify(error));
                res.status(500).json({
                  message: "Internal Server Error"
                });
              }
              else {
                sendActivationMail(accountID, userData._id, res);
              }
            });
          }
        });
      }
    }
  });
}

const getSignUpUser = (req, res) => {
  const accountId = req.params.customerId;

  UserModel.findByAccount(accountId, null, (error, user) => {
    if (error) {
      logger.error("SIGNUP USER CONTROLLER ==================",JSON.stringify(error));
      res.status(500).json({
        message: "Internal Server Error"
      });
    }
    else {
      let userData = {}
      userData.customer_id = accountId;
      userData.first_name = user[0].first_name;
      userData.last_name = user[0].last_name;
      userData.email_id = user[0].email_id;
      userData.mobile_no = user[0].mobile_no;

      res.status(200).json({
        data: userData
      });
    }
  });
}

const validateEmailId = (req, res) => {
  let emailID = req.params.emailId;
  if (!emailID) {
    logger.error("SIGNUP USER CONTROLLER ==================","NO EMAIL ID FOUND OR THE PROVIDED IS INVALID");
    res.status(500).json({
      data: {
        type: "Server Error",
        msg: "Email id is null/invalid."
      }
    });
  }
  else {
    UserModel.findByEmail(emailID, null, (error, userEntry) => {
      if (error) {
        logger.error("SIGNUP USER CONTROLLER ==================",JSON.stringify(error));
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        if (userEntry != null && userEntry.email_id) {
          res.status(409).json({
            data: {
              msg: "Invalid email",
            }
          });
        } else {
          res.status(409).json({
            data: {
              msg: "Valid email"
            }
          });
        }
      }
    });
  }
}

const getUserPlanDetails = async (req, res) => {
  const accountId = ObjectID(req.params.customerId);
  try {
    const orderDetails = await OrderModel.getOrderDetails(accountId);
    if (orderDetails.length == 0) {
      res.status(200).json({
        msg: "No plan is activated for this user ."
      });
    }
    else {  
      const plan = {}
      plan.customer_id = accountId;
      plan.order_id = orderDetails[0].items[0].orderID;
      plan.plan_type = orderDetails[0].items[0].meta.subscriptionType;
      plan.access_validity_interval = orderDetails[0].items[0].meta.access_validity_interval;
      plan.data_availability_interval = orderDetails[0].items[0].meta.data_availability_interval;
      plan.payment_transaction_status = orderDetails[0].payments.status;
      res.status(200).json({
        plan
      });
    }
  }
  catch (error) {
    logger.error("SIGNUP USER CONTROLLER ==================",JSON.stringify(error));
    res.status(500).json({
      message: "Internal Server Error"
    });
  }
}

const planRequest = async (req, res) => {
  let payload = req.body;
  const accountID = payload.customer_id;
  try {
    const userID = await UserModel.findUserIdForAccount(accountID, null);
    let orderPayload = getOrderPayload(payload, accountID, userID);
    let order = signUpUserSchema.buildOrder(orderPayload);

    const orderDetails = await OrderModel.getOrderDetails(accountID);
    if (orderDetails.length == 0) {
      addOrderDetails(order, res, accountID);
    }
    else if (orderDetails[0].items[0].meta.subscriptionType != payload.plan_type) {
      orderDetails[0].items[0].orderID = randomstring.generate({length : 6 , charset : "alphanumeric"}).toString().toUpperCase(),
      updateOrderDetails(orderDetails, order, res, accountID);
    }
    else {
      res.status(409).json({
        order_id: orderDetails[0].items[0].orderID,
        customer_id: accountID,
        message: "Plan already active , please use a diffrent plan."
      });
    }
  }
  catch (error) {
    logger.error("SIGNUP USER CONTROLLER ==================",JSON.stringify(error));
    res.status(500).json({
      message: "Internal Server Error"
    });
  }
}

function updateOrderDetails(orderDetails, order, res, accountID) {
  OrderModel.update(orderDetails[0]._id, order, (error) => {
    if (error) {
      logger.error("SIGNUP USER CONTROLLER ==================",JSON.stringify(error));
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      res.status(200).json({
        order_id: order.items[0].orderID,
        customer_id: accountID,
        message: "Plan updated."
      });
    }
  });
}

function addOrderDetails(order, res, accountID) {
  OrderModel.add(order, (error) => {
    if (error) {
      logger.error("SIGNUP USER CONTROLLER ==================",JSON.stringify(error));
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      res.status(200).json({
        order_id: order.items[0].orderID,
        customer_id: accountID,
        message: "Plan Added."
      });
    }
  });
}

function getOrderPayload(payload, accountID, userID) {
  let subscriptionItem = {}
  subscriptionItem.plan_type = payload.plan_type;
  subscriptionItem.category = SubscriptionSchema.ITEM_CATEGORY_WEB;

  let subscriptionOrderPayload = {
    upgrade: true,
    account_id: accountID,
    user_id: userID,
    items: [subscriptionItem],
    offers: [],
    charges: []
  }
  return subscriptionOrderPayload;
}

const updatePaymentAndApplyConstraints = async (req, res) => {
  const payload = req.body;
  const accountID = payload.customer_id;

  try {
    const userID = await UserModel.findUserIdForAccount(accountID, null);
    const orderDetails = await OrderModel.getOrderDetails(accountID);
    if (orderDetails.length != 0) {
      addPaymentToOrder(payload, orderDetails[0]);

      let orderItemSubcsription = orderDetails[0].items[0];
      let accountPlanConstraint = {
        plan_constraints: orderItemSubcsription.meta
      }

      accountPlanConstraint.plan_constraints.order_item_subscription_id = orderItemSubcsription._id;
      OrderModel.update(orderDetails[0]._id, orderDetails[0], (error) => {
        if (error) {
          logger.error("SIGNUP USER CONTROLLER ==================",JSON.stringify(error));
          res.status(500).json({
            message: "Internal Server Error",
          });
        }
        else {
          if (orderDetails[0].status == signUpUserSchema.PROCESS_STATUS_SUCCESS) {
            AccountModel.update(accountID, accountPlanConstraint, (error, accountUpdateStatus) => {
              if (error) {
                logger.error("SIGNUP USER CONTROLLER ==================",JSON.stringify(error));
                res.status(500).json({
                  message: "Internal Server Error",
                });
              } else {
                updateUserData = {
                  available_credits: accountPlanConstraint.plan_constraints.purchase_points,
                  available_countries: accountPlanConstraint.plan_constraints.countries_available
                }
                UserModel.update(userID, updateUserData, (error, userUpdateStatus) => {
                  if (error) {
                    logger.error("SIGNUP USER CONTROLLER ==================",JSON.stringify(error));
                    res.status(500).json({
                      message: "Internal Server Error",
                    });
                  }
                  else {
                    res.status(200).json({
                      data: {
                        customer_id: accountID,
                        message: "Plan updated."
                      }
                    });
                  }
                });
              }
            });
          }
          else {
            res.status(200).json({
              customer_id: accountID,
              message: "Payment status was failed , constraints not applied. Try again !!",
            });
          }
        }
      });
    }
    else {
      res.status(500).json({
        message: "Please select plan before payment.",
      });
    }
  }
  catch (error) {
    logger.error("SIGNUP USER CONTROLLER ==================",JSON.stringify(error));
    res.status(500).json({
      message: "Internal Server Error"
    });
  }
}

function addPaymentToOrder(payload, order) {

  let paymentPayload = {
    provider: payload.payment_details.transaction_provider ?? "EXIMPEDIA",
    transaction_id: payload.payment_details.transaction_id,
    order_ref_id: payload.order_id,
    transaction_status: payload.payment_details.transaction_status,
    error: payload.payment_details.error ?? null,
    info: {
      mode: signUpUserSchema.PAYMENT_MODE_ONLINE_DIRECT,
      note: payload.payment_details.transaction_log
    },
    currency: payload.payment_details.transaction_currency ?? "",
    amount: payload.payment_details.transaction_amount ?? ""
  }

  let payment = signUpUserSchema.buildPayment(paymentPayload);
  order.status = payment.status;
  order.items[0].meta.payment = payment;
  order.payments = payment;
}


module.exports = {
  addSignUpUser,
  getSignUpUser,
  validateEmailId,
  getUserPlanDetails,
  planRequest,
  updatePaymentAndApplyConstraints
}


