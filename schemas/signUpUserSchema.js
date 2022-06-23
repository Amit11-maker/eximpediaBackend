const ObjectID = require("mongodb").ObjectID;
var randomstring = require("randomstring");
var SubscriptionSchema = require("../schemas/subscriptionSchema");

const PAYMENT_MODE_ONLINE_DIRECT = "ONLINE_DIRECT";

const PROCESS_STATUS_INITIATED = "INITIATED";
const PROCESS_STATUS_SUCCESS = "SUCCESS";
const PROCESS_STATUS_FAILED = "FAILED";

const account = {
  company: {
    name: "",
    email_id: "",
    website_url: "",
    phone_no: "",
    fax_no: "",
    tax_identification_no: "",
    address: "",
    pin_code: "",
    city: "",
    state: "",
    country: "",
  },
  access: {
    email_id: "",
  },
  plan_constraints: {},
  is_active: 0,
  scope: "CONSUMER",
  created_ts: 0,
  modified_ts: 0,
}

const user = {
  account_id: '',
  first_name: '',
  last_name: '',
  mobile_no: '',
  email_id: '',
  password: '',
  refresh_token: '',
  is_email_verified: 0,
  role: "ADMINISTRATOR",
  available_credits: '',
  available_countries: [],
  is_account_owner: 1,
  is_active: 0,
  is_first_login : 1,
  scope: "CONSUMER",
  parent_id: '',
  created_ts: 0,
  modified_ts: 0
}

const order = {
  account_id: "",
  user_id: "",
  receipt_uid: "",
  status: "",
  currency: "",
  amount: 0,
  items: [],
  offer: [],
  charges: [],
  billing: {},
  payments: [],
  created_ts: 0,
  modified_ts: 0,
}

const payment = {
  mode: PAYMENT_MODE_ONLINE_DIRECT,
  provider: '',
  transaction_id: '',
  transaction_signature: '',
  error: {},
  meta: {
    merchant_name: '',
    purchase_desc: ''
  },
  info: {
    note: ''
  },
  status: PROCESS_STATUS_INITIATED,
  currency: '',
  amount: 0,
  transaction_ts: 0,
  created_ts: 0,
  modified_ts: 0
}

const buildAccount = (data) => {
  let currentTimestamp = Date.now();
  let content = JSON.parse(JSON.stringify(account));

  content.company.name = data.company_name ?? "";
  content.access.email_id = data.email_id;
  content.is_active = 0;
  content.created_ts = currentTimestamp;
  content.modified_ts = currentTimestamp;

  return content;
}

const buildUser = (data) => {
  let currentTimestamp = Date.now();
  let content = JSON.parse(JSON.stringify(user));
  content.account_id = ObjectID(data.account_id);
  content.first_name = data.first_name;
  content.last_name = data.last_name;
  content.mobile_no = data.mobile_no;
  content.email_id = data.email_id;
  content.refresh_token = '';
  content.is_email_verified = 0;
  content.is_active = 0;
  content.is_first_login = 1;
  content.created_ts = currentTimestamp;
  content.modified_ts = currentTimestamp;
  content.parent_id = null;
  return content;
}

const buildOrder = (data) => {
  let currentTimestamp = Date.now();
  let content = JSON.parse(JSON.stringify(order));
  content.account_id = ObjectID(data.account_id);
  content.user_id = ObjectID(data.user_id);
  content.receipt_uid = `EXIM-${currentTimestamp}`;
  content.status = PROCESS_STATUS_INITIATED;
  let orderAmount = 0;
  data.items.forEach((item) => {
    let selectedPlan = SubscriptionSchema.webPlans.filter((plan) => plan.type === item.plan_type)[0];

    let itemBundle = {
      _id: new ObjectID(),
      orderID : randomstring.generate({length : 6 , charset : "alphanumeric"}).toString().toUpperCase(),
      category: SubscriptionSchema.ITEM_CATEGORY_WEB,
      detail: JSON.parse(JSON.stringify(selectedPlan)),
      meta: {
        is_active: 0,
        payment: {}
      }
    }

    itemBundle.meta = SubscriptionSchema.buildWebConstraint(item);
    itemBundle.meta.is_active = 0;
    itemBundle.meta.subscribed_ts = currentTimestamp;


    content.items.push(itemBundle);

    orderAmount += selectedPlan.price.amount;
    content.currency = selectedPlan.price.currency;

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
}

const buildPayment = (data) => {
  let currentTimestamp = Date.now();
  let content = JSON.parse(JSON.stringify(payment));
  content._id = new ObjectID();
  content.provider = data.provider;
  content.transaction_id = data.transaction_id;
  content.transaction_status = data.transaction_status;
  content.error = data.error;

  if ((data.  error == null || (data.error).length == 0)  && data.transaction_status == "SUCCESS") {
    content.status = PROCESS_STATUS_SUCCESS;
  } else {
    content.status = PROCESS_STATUS_FAILED;
  }

  if (data.info != null && data.info.mode != null) {
    data.mode = data.info.mode;
    content.info.note = data.info.note;
  }

  content.currency = data.currency;
  content.amount = data.amount;
  content.transaction_ts = currentTimestamp;
  content.created_ts = currentTimestamp;
  content.modified_ts = currentTimestamp;
  return content;
}

module.exports = {
  PAYMENT_MODE_ONLINE_DIRECT,
  PROCESS_STATUS_FAILED,
  PROCESS_STATUS_INITIATED,
  PROCESS_STATUS_SUCCESS,
  buildAccount,
  buildUser,
  buildOrder,
  buildPayment
}
