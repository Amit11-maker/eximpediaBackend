const TAG = "paymentController";

const Razorpay = require("razorpay");

const PaymentModel = require("../models/paymentModel");
const AccountModel = require("../models/accountModel");
const SubscriptionModel = require("../models/subscriptionModel");
const PaymentSchema = require("../schemas/paymentSchema");
const OrderSchema = require("../schemas/orderSchema");
const SubscriptionSchema = require("../schemas/subscriptionSchema");
const PaymentHelper = require("../helpers/paymentHelper");

const create = (req, res) => {
  let payload = req.body;
  let payment = PaymentSchema.buildPayment(payload);

  if (payment.error == null && payment.transaction_signature != null) {
    if (
      PaymentHelper.verifyTransactionSignature(
        payload.order_ref_id,
        payload.transaction_id,
        payload.transaction_signature,
        PaymentHelper.RAZORPAY_CREDENTIALS.key_secret
      )
    ) {
      payment.isVerified = true;
      let order_status = payment.status;

      SubscriptionModel.findByOrderId(
        payload.order_id,
        null,
        function (error, subscriptionBundle) {
          if (error) {
            res.status(500).json({
              message: "Internal Server Error",
            });
          } else {
            let subscription = subscriptionBundle.subscription;
            subscription.detail.subscriptionType = subscription.detail.type; // Internal Schema Mapping
            let subscriptionConstraints =
              SubscriptionSchema.buildSubscriptionConstraint(
                subscription.detail
              );
            subscriptionConstraints.is_active = 1;
            subscriptionConstraints.subscribed_ts =
              subscriptionConstraints.created_ts;

            PaymentModel.addForOrder(
              payload.order_id,
              payload.order_ref_id,
              order_status,
              subscriptionConstraints,
              payment,
              (error, paymentModifedStatus) => {
                if (error) {
                  logger.log(JSON.stringify(error));
                  res.status(500).json({
                    message: "Internal Server Error",
                  });
                } else {
                  if (paymentModifedStatus) {
                    subscriptionConstraints.order_item_subscription_id =
                      subscription._id;
                    let planConstraints = {
                      plan_constraints: subscriptionConstraints,
                    };
                    AccountModel.update(
                      subscriptionBundle.account_id,
                      planConstraints,
                      (error, accountUpdateStatus) => {
                        if (error) {
                          res.status(500).json({
                            message: "Internal Server Error",
                          });
                        } else {
                          if (accountUpdateStatus) {
                            res.status(200).json({
                              subscription: subscription,
                            });
                          } else {
                            res.status(500).json({
                              message: "Internal Server Error",
                            });
                          }
                        }
                      }
                    );
                  } else {
                    logger.log("NOT");
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
    } else {
      payment.isVerified = false;
      PaymentModel.addForOrder(
        payment.order_id,
        payment.order_ref_id,
        OrderSchema.PROCESS_STATUS_UNKNOWN,
        {},
        payment,
        (error, paymentModifedStatus) => {
          if (error) {
            res.status(500).json({
              message: "Internal Server Error",
            });
          } else {
            if (paymentModifedStatus) {
              res.status(403).json({
                data: {
                  type: "UNAUTHORISED",
                  msg: "Invalid Signature",
                  desc: "Incorrect Payment Source",
                },
              });
            } else {
              res.status(500).json({
                message: "Internal Server Error",
              });
            }
          }
        }
      );
    }
  } else {
    PaymentModel.addForOrder(
      payment.order_id,
      payment.order_ref_id,
      OrderSchema.PROCESS_STATUS_FAILED,
      {},
      payment,
      (error, paymentModifedStatus) => {
        if (error) {
          res.status(500).json({
            message: "Internal Server Error",
          });
        } else {
          if (paymentModifedStatus) {
            res.status(402).json({
              data: {
                type: "PAYMENT REQUIRED",
                msg: "Payment Failed",
                desc: "Payment Not Completed Successfully",
              },
            });
          } else {
            res.status(500).json({
              message: "Internal Server Error",
            });
          }
        }
      }
    );
  }
};

module.exports = {
  create,
};
