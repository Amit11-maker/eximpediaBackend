const TAG = 'orderController';

const axios = require('axios').default;
const Razorpay = require('razorpay');
const crypto = require("crypto");
const { logger } = require("../config/logger");
const OrderModel = require('../models/orderModel');
const AccountModel = require('../models/accountModel');
const PaymentModel = require('../models/paymentModel');
const SubscriptionModel = require('../models/subscriptionModel');
const OrderSchema = require('../schemas/orderSchema');
const PaymentSchema = require('../schemas/paymentSchema');
const UserSchema = require('../schemas/userSchema');
const SubscriptionSchema = require('../schemas/subscriptionSchema');

const CryptoHelper = require('../helpers/cryptoHelper');
const EmailHelper = require('../helpers/emailHelper');

const PaymentHelper = require('../helpers/paymentHelper');

const QUERY_PARAM_TERM_VERIFICATION_EMAIL = 'verification_email';

const create = (req, res) => {
  //console.log(req.body);
  let payload = req.body;
  let order = OrderSchema.buildOrder(payload);

  OrderModel.add(order, (error, orderEntry) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {

      let orderId = orderEntry.insertedId;

      var instance = new Razorpay({
        key_id: PaymentHelper.RAZORPAY_CREDENTIALS.key_id,
        key_secret: PaymentHelper.RAZORPAY_CREDENTIALS.key_secret,
        headers: {
          "X-Razorpay-Account": PaymentHelper.RAZORPAY_CREDENTIALS.merchant_id,
        }
      });
      let orderRegisterPayload = {
        amount: order.amount * 100,
        currency: order.currency,
        receipt: order.receipt_uid,
        payment_capture: 1,
        notes: {
          order_id: orderId.toString()
        }
      };

      instance.orders.create(orderRegisterPayload, function (error, orderRegistered) {
        if (error) {
          res.status(500).json({
            message: 'Internal Server Error',
          });
        } else {
          if (orderRegistered.status == "created") {
            let orderRegisteredUpdates = {
              payment_provider: "RAZORPAY",
              payment_attempts: orderRegistered.attempts,
              payment_order_ref_id: orderRegistered.id,
              status: OrderSchema.PROCESS_STATUS_INITIATED
            };
            OrderModel.update(orderId, orderRegisteredUpdates, (error, orderUpdateStatus) => {
              if (error) {
                res.status(500).json({
                  message: 'Internal Server Error',
                });
              } else {
                if (orderUpdateStatus) {

                  let orderTransactioData = {
                    order_id: orderId,
                    order_ref_id: orderRegistered.id,
                    receipt_uid: order.receipt_uid,
                    currency: orderRegisterPayload.currency,
                    amount: orderRegisterPayload.amount
                  };
                  let transactionPayload = PaymentHelper.generateTransactionPayload(orderTransactioData);
                  res.status(200).json({
                    data: transactionPayload
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

};

const createSim = (req, res) => {

  let orderTransactioData = {
    order_id: "5fd13137b4db1e133c08bf20", //orderId,
    order_ref_id: "order_GB3v5Ap8FtJXcr", //orderRegistered.id,
    receipt_uid: "EXIM-1607543332124", //order.receipt_uid,
    currency: "INR", //orderRegisterPayload.currency,
    amount: 2500000 //orderRegisterPayload.amount
  };
  let transactionPayload = PaymentHelper.generateTransactionPayload(orderTransactioData);
  res.status(200).json({
    data: transactionPayload
  });
  /*
  let signature = "3c06b62a6b1e4a89bad2b213470028dcea359d96fb1f8e0fd29b021061600222";
  let message = "order_GB4LD29IKHdqSq" + '|' + "pay_GB64FO9ObPHDEP";
  let computedSignature = crypto.createHmac("sha256", "DWduw4GkifH4sfzorCX5pJRi").update(message).digest("hex");
  console.log(">>>>>>>>>>>>>>>>>>>");
  console.log(computedSignature);
  console.log("<<<<<<<<<<<<<<<<<<<<");
  console.log(signature);
  let val = (signature === computedSignature);
  res.status(200).json({
    data: val
  });*/
  /*
    let payload = {
      provider: "RAZORPAY",
      order_id: "5fd13137b4db1e133c08bf20",
      transaction_id: "pay_GB6LmpV8zeCzMf",
      order_ref_id: "order_GB3zQh3VnfICb7",
      transaction_signature: "5a18912ceb042757be31c8ae9957b62b75f1fa826ad63052787cc4bb33b960a3",
      error: null,
      currency: "INR",
      amount: 2500000 / 100 // Reverse from pg sub-unit
    };
    let payment = PaymentSchema.buildPayment(payload);
    SubscriptionModel.findByOrderId(payload.order_id, null, function (error, subscriptionBundle) {

      if (error) {
        res.status(500).json({
          message: 'Internal Server Error',
        });
      } else {
        let subscription = subscriptionBundle.subscription;
        subscription.detail.subscriptionType = subscription.detail.type; // Internal Schema Mapping
        let subscriptionConstraints = SubscriptionSchema.buildSubscriptionConstraint(subscription.detail);
        subscriptionConstraints.is_active = 1;
        subscriptionConstraints.subscribed_ts = Date.now();
        console.log(subscriptionConstraints);

        PaymentModel.addForOrder(payload.order_id, payload.order_ref_id, "SUCCESS", subscriptionConstraints, payment, (error, paymentModifedStatus) => {
          if (error) {
            console.log(error);
            res.status(500).json({
              message: 'Internal Server Error',
            });
          } else {

            if (paymentModifedStatus) {
              let planConstraints = {
                plan_constraints: subscriptionConstraints
              };
              AccountModel.update(subscriptionBundle.account_id, planConstraints, (error, accountUpdateStatus) => {
                if (error) {
                  res.status(500).json({
                    message: 'Internal Server Error',
                  });
                } else {

                  if (accountUpdateStatus) {

                    res.status(200).json({
                      subscription: subscription
                    });

                  } else {
                    res.status(500).json({
                      message: 'Internal Server Error',
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

    });*/

};

module.exports = {
  create
};
