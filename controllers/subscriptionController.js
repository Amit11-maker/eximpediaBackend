const TAG = "subscriptionController";

const EnvConfig = require("../config/envConfig");

const ObjectID = require("mongodb").ObjectID;
const { logger } = require("../config/logger");
const SubscriptionModel = require("../models/subscriptionModel");
const OrderModel = require("../models/orderModel");
const AccountModel = require("../models/accountModel");
const UserModel = require("../models/userModel");
const SubscriptionSchema = require("../schemas/subscriptionSchema");
const OrderSchema = require("../schemas/orderSchema");
const PaymentSchema = require("../schemas/paymentSchema");

const EmailHelper = require("../helpers/emailHelper");
const { use } = require("bcrypt/promises");

const create = (req, res) => {
  try {
    let payload = req.body;

    let account = {};
    account.plan_constraints = {}; //SubscriptionSchema.buildSubscriptionConstraint(payload.plan);  Hit Post Order Mapping

    let accountId = payload.account_id;
    let accountEmailId = payload.account_email_id;
    let userId = payload.user_id;

    let subscriptionItem = {};
    if (
      payload.plan.subscriptionType ==
      SubscriptionSchema.SUBSCRIPTION_PLAN_TYPE_CUSTOM
    ) {
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
      charges: [],
    };
    subscriptionOrderPayload.applySubscription = true; // Registration Plan | Custom Plan -> Auto-Activation-Flag
    let order = OrderSchema.buildOrder(subscriptionOrderPayload);
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

    let orderItemSubcsription = order.items.filter(
      (item) => item.category === SubscriptionSchema.ITEM_CATEGORY_SUBCRIPTION
    )[0];
    let accountPlanConstraint = {
      plan_constraints: orderItemSubcsription.meta,
    };
    accountPlanConstraint.plan_constraints.order_item_subscription_id =
      orderItemSubcsription._id;

    OrderModel.add(order, (error, orderEntry) => {
      if (error) {
        logger.log(
          ` SUBSCRIPTION CONTROLLER ================== ${JSON.stringify(error)}`
        );
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        AccountModel.update(
          accountId,
          accountPlanConstraint,
          (error, accountUpdateStatus) => {
            if (error) {
              logger.log(
                ` SUBSCRIPTION CONTROLLER ================== ${JSON.stringify(
                  error
                )}`
              );
              res.status(500).json({
                message: "Internal Server Error",
              });
            } else {
              // updating credits and countries for user
              updateUserData = {
                available_credits:
                  accountPlanConstraint.plan_constraints.purchase_points,
                available_countries:
                  accountPlanConstraint.plan_constraints.countries_available,
              };
              UserModel.update(
                userId,
                updateUserData,
                (error, userUpdateStatus) => {
                  if (error) {
                    logger.log(
                      ` SUBSCRIPTION CONTROLLER ================== ${JSON.stringify(
                        error
                      )}`
                    );
                    res.status(500).json({
                      message: "Internal Server Error",
                    });
                  } else {
                    if (accountUpdateStatus && userUpdateStatus) {
                      let templateData = {
                        accountAccessUrl:
                          EnvConfig.HOST_WEB_PANEL +
                          "consumers/accounts/profile",
                        recipientEmail: accountEmailId,
                      };
                      let emailTemplate =
                        EmailHelper.buildEmailAccountSubscriptionTemplate(
                          templateData
                        );

                      let emailData = {
                        recipientEmail: accountEmailId,
                        subject: "Account Subscription Activation",
                        html: emailTemplate,
                      };

                      // res.status(200).json({
                      //   data: {
                      //     subscription_email_id: accountEmailId,
                      //   },
                      // });
                      EmailHelper.triggerEmail(
                        emailData,
                        function (error, mailtriggered) {
                          if (error) {
                            logger.log(
                              ` SUBSCRIPTION CONTROLLER ================== ${JSON.stringify(
                                error
                              )}`
                            );
                            res.status(500).json({
                              message: "Internal Server Error",
                            });
                          } else {
                            if (mailtriggered) {
                              res.status(200).json({
                                data: {
                                  subscription_email_id: accountEmailId,
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
                      logger.log(
                        "SUBSCRIPTION CONTROLLER ================== NO accountUpdateStatus && userUpdateStatus"
                      );
                      res.status(500).json({
                        message: "Internal Server Error",
                      });
                    }
                  }
                }
              );
            }
          }
        );
      }
    });
  } catch (err) {
    logger.log(` Subscription Controller create == ${JSON.stringify(err)}`);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const fetchSubscriptions = (req, res) => {
  let payloadParams = req.params;
  let payload = req.query;

  const tradeTotalRecords = payload.tradeTotalRecords
    ? payload.tradeTotalRecords
    : null;
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

  SubscriptionModel.findByAccount(
    payloadParams.accountId,
    null,
    offset,
    limit,
    (error, subscriptionDataPack) => {
      if (error) {
        logger.log(
          ` SUBSCRIPTION CONTROLLER ================== ${JSON.stringify(error)}`
        );
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        let bundle = {};
        if (!subscriptionDataPack) {
          bundle.recordsTotal = 0;
          bundle.recordsFiltered = 0;
          bundle.error = "Unrecognised Shipments Response"; //Show if to be interpreted as error on client-side
        } else {
          let recordsTotal =
            subscriptionDataPack[SubscriptionSchema.RESULT_PORTION_TYPE_SUMMARY]
              .length > 0
              ? subscriptionDataPack[
                  SubscriptionSchema.RESULT_PORTION_TYPE_SUMMARY
                ][0].count
              : 0;
          bundle.recordsTotal =
            tradeTotalRecords != null ? tradeTotalRecords : recordsTotal;
          bundle.recordsFiltered = recordsTotal;
        }

        if (pageKey) {
          bundle.draw = pageKey;
        }

        bundle.data =
          subscriptionDataPack[SubscriptionSchema.RESULT_PORTION_TYPE_RECORDS];

        res.status(200).json(bundle);
      }
    }
  );
};

const fetchSubscriptionPlanTemplates = (req, res) => {
  res.status(200).json({
    data: SubscriptionSchema.getSubscriptionPlans(),
  });
};

const fetchWebPlanTemplates = (req, res) => {
  res.status(200).json({
    data: SubscriptionSchema.getWebPlans(),
  });
};

module.exports = {
  create,
  fetchSubscriptions,
  fetchSubscriptionPlanTemplates,
  fetchWebPlanTemplates,
};
