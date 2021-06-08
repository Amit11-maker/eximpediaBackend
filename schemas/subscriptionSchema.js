const TAG = 'subscriptionSchema';

const ITEM_CATEGORY_SUBCRIPTION = 'SUBSCRIPTION';
const ITEM_CATEGORY_TOP_UP = 'TOP_UP';

const RESULT_PORTION_TYPE_RECORDS = 'RECORD_SET';
const RESULT_PORTION_TYPE_SUMMARY = 'SUMMARY_RECORDS';

const SUBSCRIPTION_PLAN_TYPE_CUSTOM = 'SP-CUSTOM';
const SUBSCRIPTION_PLAN_TYPE_A = 'SP-A'; // BASIC
const SUBSCRIPTION_PLAN_TYPE_B = 'SP-B';
const SUBSCRIPTION_PLAN_TYPE_C = 'SP-C';
const SUBSCRIPTION_PLAN_TYPE_D = 'SP-D';
const SUBSCRIPTION_PLAN_TYPE_E = 'SP-E';

const TOPUP_PLAN_TYPE_CUSTOM = 'TP-CUSTOM';
const TOPUP_PLAN_TYPE_A = 'TP-A';
const TOPUP_PLAN_TYPE_B = 'TP-B';
const TOPUP_PLAN_TYPE_C = 'TP-C';

const SEPARATOR_UNDERSCORE = '_';
const SEPARATOR_SPACE = ' ';

const subscription = {
  account_id: '',
  validity_interval: {
    start_date: new Date(),
    end_date: new Date()
  },
  plan: {
    type: SUBSCRIPTION_PLAN_TYPE_CUSTOM,
    price: {
      currency: "INR",
      amount: 0
    },
    countries_available: [],
    validity_days: 0,
    data_range: {},
    purchase_points: 0,
    max_users: 0
  },
  is_active: 0,
  created_ts: 0,
  modified_ts: 0
};

const topUp = {
  account_id: '',
  subscription_id: '',
  plan: {
    type: TOPUP_PLAN_TYPE_CUSTOM,
    price: {
      currency: "INR",
      amount: 0
    },
    add_on_points: 0,
    add_on_countries: [],
    add_on_users: 0,
    add_on_validity_days: 0,
    add_on_data_range: 0
  },
  is_active: 0,
  created_ts: 0,
  modified_ts: 0
};

const subscriptionsPlans = [{
    type: SUBSCRIPTION_PLAN_TYPE_CUSTOM,
    price: {
      currency: "INR",
      amount: 0
    },
    countries_available: [],
    validity_days: 0,
    data_range: {},
    purchase_points: 0,
    max_users: 0
  }, {
    type: SUBSCRIPTION_PLAN_TYPE_A,
    price: {
      currency: "INR",
      amount: 0
    },
    countries_available: ["USA"],
    validity_days: 5,
    data_range: {
      historic_days: 365
    },
    purchase_points: 200,
    max_users: 1
  },
  {
    type: SUBSCRIPTION_PLAN_TYPE_B,
    price: {
      currency: "INR",
      amount: 25000
    },
    countries_available: ["USA", "IND"],
    validity_days: 90,
    data_range: {
      historic_days: 365 * 2
    },
    purchase_points: 9000,
    max_users: 5
  },
  {
    type: SUBSCRIPTION_PLAN_TYPE_C,
    price: {
      currency: "INR",
      amount: 40000
    },
    countries_available: ["USA", "IND", "LKA"],
    validity_days: 180,
    data_range: {
      historic_days: 365 * 3
    },
    purchase_points: 16000,
    max_users: 5
  },
  {
    type: SUBSCRIPTION_PLAN_TYPE_D,
    price: {
      currency: "INR",
      amount: 70000
    },
    countries_available: ["USA", "IND", "LKA"],
    validity_days: 365,
    data_range: {
      historic_days: 365 * 4
    },
    purchase_points: 40000,
    max_users: 10
  },
  {
    type: SUBSCRIPTION_PLAN_TYPE_E,
    price: {
      currency: "INR",
      amount: 90000
    },
    countries_available: ["USA", "IND", "LKA"],
    validity_days: 365,
    data_range: {
      historic_days: 365 * 5
    },
    purchase_points: 90000,
    max_users: 10
  }
];

const topUpPlans = [{
  type: TOPUP_PLAN_TYPE_CUSTOM,
  price: {
    currency: "INR",
    amount: 0
  },
  add_on_points: 0,
  add_on_countries: [],
  add_on_users: 0,
  add_on_validity_days: 0,
  add_on_data_range: 0
}, {
  type: TOPUP_PLAN_TYPE_A,
  price: {
    currency: "INR",
    amount: 5000
  },
  add_on_points: 2500,
  add_on_countries: [],
  add_on_users: 0,
  add_on_validity_days: 0,
  add_on_data_range: 0
}, {
  type: TOPUP_PLAN_TYPE_B,
  price: {
    currency: "INR",
    amount: 10000
  },
  add_on_points: 6000,
  add_on_countries: [],
  add_on_users: 0,
  add_on_validity_days: 0,
  add_on_data_range: 0
}, {
  type: TOPUP_PLAN_TYPE_C,
  price: {
    currency: "INR",
    amount: 20000
  },
  add_on_points: 15000,
  add_on_countries: [],
  add_on_users: 0,
  add_on_validity_days: 0,
  add_on_data_range: 0
}];

const subscriptionConstraint = {
  countries_available: [],
  access_validity_interval: {
    start_date: '',
    end_date: '',
  },
  data_availability_interval: {
    start_date: '',
    end_date: '',
  },
  purchase_points: 0,
  max_users: 0,
  created_ts: 0,
  modified_ts: 0
};

const topUpConstraint = {
  purchase_points: 0,
  created_ts: 0,
  modified_ts: 0
};

const deriveCustomSubscriptionPlanDetail = (data) => {

  let selectedPlan = subscriptionsPlans.filter(plan => plan.type === SUBSCRIPTION_PLAN_TYPE_CUSTOM)[0];
  let constraintBundle = data;

  let todayDate = new Date();
  selectedPlan.data_range.historic_days = new Date(todayDate.getTime() - new Date(constraintBundle.data_availability_interval.start_date).getTime()) / (24 * 60 * 60 * 1000);
  selectedPlan.validity_days = new Date(new Date(constraintBundle.access_validity_interval.end_date).getTime() - todayDate.getTime()) / (24 * 60 * 60 * 1000);

  selectedPlan.countries_available = constraintBundle.countries_available;

  selectedPlan.purchase_points = Number(constraintBundle.purchase_points);
  selectedPlan.max_users = Number(constraintBundle.max_users);

  selectedPlan.price.currency = data.price.currency;
  selectedPlan.price.amount = Number(data.price.amount);

  return selectedPlan;
};

const buildSubscriptionConstraint = (data) => {
  let currentTimestamp = Date.now();
  let content = JSON.parse(JSON.stringify(subscriptionConstraint));
  let selectedPlan = subscriptionsPlans.filter(plan => plan.type === data.subscriptionType)[0];
  let constraintBundle = {};

  if (selectedPlan.type != SUBSCRIPTION_PLAN_TYPE_CUSTOM) {

    constraintBundle = JSON.parse(JSON.stringify(selectedPlan));

    let todayDate = new Date();
    let startDate = new Date(todayDate.getTime() - (constraintBundle.data_range.historic_days * 24 * 60 * 60 * 1000));
    let endDate = new Date(todayDate.getTime() + (constraintBundle.validity_days * 24 * 60 * 60 * 1000));

    content.access_validity_interval.start_date = todayDate;
    content.access_validity_interval.end_date = endDate;

    content.data_availability_interval.start_date = startDate;
    content.data_availability_interval.end_date = endDate;

    content.subscriptionType = constraintBundle.type;

  } else {

    constraintBundle = data;

    content.access_validity_interval.start_date = new Date(constraintBundle.access_validity_interval.start_date);
    content.access_validity_interval.end_date = new Date(constraintBundle.access_validity_interval.end_date);

    content.data_availability_interval.start_date = new Date(constraintBundle.data_availability_interval.start_date);
    content.data_availability_interval.end_date = new Date(constraintBundle.data_availability_interval.end_date);

    content.subscriptionType = constraintBundle.subscriptionType;
  }

  content.countries_available = constraintBundle.countries_available;

  content.purchase_points = Number(constraintBundle.purchase_points);
  content.max_users = Number(constraintBundle.max_users);

  content.created_ts = currentTimestamp;
  content.modified_ts = currentTimestamp;

  return content;
};

const buildTopUpConstraint = (data) => {
  let currentTimestamp = Date.now();
  let content = JSON.parse(JSON.stringify(topUpConstraint));
  let selectedPlan = topUpPlans.filter(plan => plan.type === data.topUpType)[0];
  let constraintBundle = {};
  if (selectedPlan.type != TOPUP_PLAN_TYPE_CUSTOM) {
    constraintBundle = JSON.parse(JSON.stringify(selectedPlan));
  } else {
    constraintBundle = JSON.parse(JSON.stringify(data.plan_constraints));
  }

  content.purchase_points = constraintBundle.purchase_points;

  content.created_ts = currentTimestamp;
  content.modified_ts = currentTimestamp;

  content.topUpType = constraintBundle.type;

  return content;
};

const getSubscriptionPlanByType = (type) => {
  return subscriptionsPlans.filter(plan => plan.type === type)[0];
};

const getSubscriptionPlans = () => {
  return subscriptionsPlans.filter(plan => (plan.type != SUBSCRIPTION_PLAN_TYPE_CUSTOM && plan.type != SUBSCRIPTION_PLAN_TYPE_A));
};

module.exports = {
  ITEM_CATEGORY_SUBCRIPTION,
  ITEM_CATEGORY_TOP_UP,
  SUBSCRIPTION_PLAN_TYPE_CUSTOM,
  TOPUP_PLAN_TYPE_CUSTOM,
  RESULT_PORTION_TYPE_RECORDS,
  RESULT_PORTION_TYPE_SUMMARY,
  subscriptionsPlans,
  topUpPlans,
  deriveCustomSubscriptionPlanDetail,
  buildSubscriptionConstraint,
  buildTopUpConstraint,
  getSubscriptionPlanByType,
  getSubscriptionPlans
};
