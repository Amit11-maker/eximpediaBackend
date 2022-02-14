const TAG = "orderSchema";

const SubscriptionSchema = require("./subscriptionSchema");
const PaymentSchema = require("./paymentSchema");
const { SUBSCRIPTION_PLAN_TYPE_CUSTOM } = require("./subscriptionSchema");

const ObjectID = require("mongodb").ObjectID;

const PROCESS_STATUS_INITIATING = "INITIATING";
const PROCESS_STATUS_INITIATED = "INITIATED";
const PROCESS_STATUS_PROCESSING = "PROCESSING";
const PROCESS_STATUS_SUCCESS = "SUCCESS";
const PROCESS_STATUS_FAILED = "FAILED";
const PROCESS_STATUS_CANCELLED = "CANCELLED";
const PROCESS_STATUS_RETURNED = "RETURNED";
const PROCESS_STATUS_UNKNOWN = "UNKNOWN";

const SEPARATOR_UNDERSCORE = "_";
const SEPARATOR_SPACE = " ";

const order = {
  account_id: "",
  user_id: "",
  receipt_uid: "",
  status: PROCESS_STATUS_INITIATING,
  currency: "",
  amount: 0,
  items: [],
  offer: [],
  charges: [],
  billing: {},
  payments: [],
  created_ts: 0,
  modified_ts: 0,
};

const billing = {
  name: {
    first_name: "",
    last_name: "",
  },
  email_id: "",
  mobile_no: "",
  address: {
    place: "",
    postal_code: "",
    city: "",
    state: "",
    country: "",
  },
};

const buildOrder = (data) => {
  let currentTimestamp = Date.now();
  let content = JSON.parse(JSON.stringify(order));
  content.account_id = ObjectID(data.account_id);
  content.user_id = ObjectID(data.user_id);
  content.receipt_uid = `EXIM-${currentTimestamp}`;
  let orderAmount = 0;
  data.items.forEach((item) => {
    if (item.category === SubscriptionSchema.ITEM_CATEGORY_SUBCRIPTION) {
      let selectedPlan = SubscriptionSchema.subscriptionsPlans.filter(
        (plan) => plan.type === item.subscriptionType
      )[0];

      if (
        selectedPlan.type === SubscriptionSchema.SUBSCRIPTION_PLAN_TYPE_CUSTOM
      ) {
        item.price = {};
        item.price.currency = item.payment.currency;
        item.price.amount = item.payment.amount;
        selectedPlan =
          SubscriptionSchema.deriveCustomSubscriptionPlanDetail(item);
      }

      let itemBundle = {
        _id: new ObjectID(),
        category: SubscriptionSchema.ITEM_CATEGORY_SUBCRIPTION,
        detail: JSON.parse(JSON.stringify(selectedPlan)),
        meta: {
          is_active: 0,
        },
      };
      if (data.applySubscription != null && data.applySubscription) {
        itemBundle.meta = SubscriptionSchema.buildSubscriptionConstraint(item);
        itemBundle.meta.is_active = 1;
        itemBundle.meta.subscribed_ts = currentTimestamp;
        itemBundle.meta.is_hidden = item.is_hidden;
        itemBundle.meta.max_query_per_day = item.max_query_per_day;
        itemBundle.meta.max_save_query = Number(item.max_save_query);
        itemBundle.meta.max_workspace_count = Number(item.max_workspace_count);
        //itemBundle.created_ts = currentTimestamp;
        //itemBundle.modified_ts = currentTimestamp;
      }
      content.items.push(itemBundle);

      orderAmount += selectedPlan.price.amount;
      content.currency = selectedPlan.price.currency;
    } else if (item.category === SubscriptionSchema.ITEM_CATEGORY_TOP_UP) {
      let selectedTopUp = SubscriptionSchema.topUpPlans.filter(
        (plan) => plan.type === item.topUpType
      )[0];
      let itemBundle = {
        _id: new ObjectID(),
        category: SubscriptionSchema.ITEM_CATEGORY_TOP_UP,
        detail: JSON.parse(JSON.stringify(selectedTopUp)),
        meta: {
          is_active: 0,
        },
      };
      if (data.applySubscription != null && data.applySubscription) {
        itemBundle.meta = SubscriptionSchema.buildTopUpConstraint(item);
        itemBundle.meta.is_active = 1;
        itemBundle.meta.added_ts = currentTimestamp;
        //itemBundle.created_ts = currentTimestamp;
        //itemBundle.modified_ts = currentTimestamp;
      }
      content.items.push(itemBundle);

      orderAmount += selectedTopUp.price.amount;
      content.currency = selectedTopUp.price.currency;
    }
  });
  data.offers.forEach((offer) => {
    orderAmount -= offer.price.amount;
  });
  data.charges.forEach((offer) => {
    orderAmount += offer.price.amount;
  });
  content.amount = orderAmount;
  content.created_ts = currentTimestamp;
  content.modified_ts = currentTimestamp;
  return content;
};

module.exports = {
  PROCESS_STATUS_INITIATING,
  PROCESS_STATUS_INITIATED,
  PROCESS_STATUS_PROCESSING,
  PROCESS_STATUS_SUCCESS,
  PROCESS_STATUS_FAILED,
  PROCESS_STATUS_CANCELLED,
  PROCESS_STATUS_UNKNOWN,
  buildOrder,
};
