const TAG = "subscriptionSchema";

const ITEM_CATEGORY_SUBCRIPTION = "SUBSCRIPTION";
const ITEM_CATEGORY_TOP_UP = "TOP_UP";
const ITEM_CATEGORY_WEB = "WEB";

const RESULT_PORTION_TYPE_RECORDS = "RECORD_SET";
const RESULT_PORTION_TYPE_SUMMARY = "SUMMARY_RECORDS";

const SUBSCRIPTION_PLAN_TYPE_CUSTOM = "SP-CUSTOM";
const SUBSCRIPTION_PLAN_TYPE_A = "SP-A"; // BASIC
const SUBSCRIPTION_PLAN_TYPE_B = "SP-B";
const SUBSCRIPTION_PLAN_TYPE_C = "SP-C";
const SUBSCRIPTION_PLAN_TYPE_D = "SP-D";
const SUBSCRIPTION_PLAN_TYPE_E = "SP-E";

const TOPUP_PLAN_TYPE_CUSTOM = "TP-CUSTOM";
const TOPUP_PLAN_TYPE_A = "TP-A";
const TOPUP_PLAN_TYPE_B = "TP-B";
const TOPUP_PLAN_TYPE_C = "TP-C";

const WEB_PLAN_TYPE_CUSTOM = "WP-CUSTOM";
const WEB_PLAN_TYPE_A = "WP-BASIC";
const WEB_PLAN_TYPE_B = "WP-GROWTH";
const WEB_PLAN_TYPE_C = "WP-BOOSTE";
const WEB_PLAN_TYPE_D = "WP-BUSINESS";
const WEB_PLAN_TYPE_E = "WP-CORPORATE";


const SEPARATOR_UNDERSCORE = "_";
const SEPARATOR_SPACE = " ";

const subscription = {
  account_id: "",
  validity_interval: {
    start_date: new Date(),
    end_date: new Date(),
  },
  plan: {
    type: SUBSCRIPTION_PLAN_TYPE_CUSTOM,
    price: {
      currency: "INR",
      amount: 0,
    },
    countries_available: [],
    validity_days: 0,
    data_range: {},
    purchase_points: 0,
    max_users: 0,
  },
  is_active: 0,
  created_ts: 0,
  modified_ts: 0,
}

const topUp = {
  account_id: "",
  subscription_id: "",
  plan: {
    type: TOPUP_PLAN_TYPE_CUSTOM,
    price: {
      currency: "INR",
      amount: 0,
    },
    add_on_points: 0,
    add_on_countries: [],
    add_on_users: 0,
    add_on_validity_days: 0,
    add_on_data_range: 0,
  },
  is_active: 0,
  created_ts: 0,
  modified_ts: 0,
}

const web = {
  account_id: "",
  validity_interval: {
    start_date: new Date(),
    end_date: new Date(),
  },
  plan: {
    type: WEB_PLAN_TYPE_CUSTOM,
    price: {
      currency: "USD",
      amount: 0,
    },
    validity_days: 0,
    data_range: {},
    purchase_points: 0,
    max_workspace: 0,
    support: '',
    ticket_manager: '',
    email_alert: '',
    notification: '',
    max_workspace_records: 0,
    max_users: 0,
    is_hidden: '',
    max_search_query: 0,
    max_favourite_company: 0
  },
  is_active: 0,
  created_ts: 0,
  modified_ts: 0,
}

const subscriptionsPlans = [
  {
    type: SUBSCRIPTION_PLAN_TYPE_CUSTOM,
    price: {
      currency: "INR",
      amount: 0,
    },
    countries_available: [],
    validity_days: 0,
    data_range: {},
    purchase_points: 0,
    max_users: 0,
  },
  {
    type: SUBSCRIPTION_PLAN_TYPE_A,
    price: {
      currency: "INR",
      amount: 0,
    },
    countries_available: ["USA"],
    validity_days: 5,
    data_range: {
      historic_days: 365,
    },
    purchase_points: 200,
    max_users: 1,
  },
  {
    type: SUBSCRIPTION_PLAN_TYPE_B,
    price: {
      currency: "INR",
      amount: 25000,
    },
    countries_available: ["USA", "IND"],
    validity_days: 90,
    data_range: {
      historic_days: 365 * 2,
    },
    purchase_points: 9000,
    max_users: 5,
  },
  {
    type: SUBSCRIPTION_PLAN_TYPE_C,
    price: {
      currency: "INR",
      amount: 40000,
    },
    countries_available: ["USA", "IND", "LKA"],
    validity_days: 180,
    data_range: {
      historic_days: 365 * 3,
    },
    purchase_points: 16000,
    max_users: 5,
  },
  {
    type: SUBSCRIPTION_PLAN_TYPE_D,
    price: {
      currency: "INR",
      amount: 70000,
    },
    countries_available: ["USA", "IND", "LKA"],
    validity_days: 365,
    data_range: {
      historic_days: 365 * 4,
    },
    purchase_points: 40000,
    max_users: 10,
  },
  {
    type: SUBSCRIPTION_PLAN_TYPE_E,
    price: {
      currency: "INR",
      amount: 90000,
    },
    countries_available: ["USA", "IND", "LKA"],
    validity_days: 365,
    data_range: {
      historic_days: 365 * 5,
    },
    purchase_points: 90000,
    max_users: 10,
  },
]

const topUpPlans = [
  {
    type: TOPUP_PLAN_TYPE_CUSTOM,
    price: {
      currency: "INR",
      amount: 0,
    },
    add_on_points: 0,
    add_on_countries: [],
    add_on_users: 0,
    add_on_validity_days: 0,
    add_on_data_range: 0,
  },
  {
    type: TOPUP_PLAN_TYPE_A,
    price: {
      currency: "INR",
      amount: 5000,
    },
    add_on_points: 2500,
    add_on_countries: [],
    add_on_users: 0,
    add_on_validity_days: 0,
    add_on_data_range: 0,
  },
  {
    type: TOPUP_PLAN_TYPE_B,
    price: {
      currency: "INR",
      amount: 10000,
    },
    add_on_points: 6000,
    add_on_countries: [],
    add_on_users: 0,
    add_on_validity_days: 0,
    add_on_data_range: 0,
  },
  {
    type: TOPUP_PLAN_TYPE_C,
    price: {
      currency: "INR",
      amount: 20000,
    },
    add_on_points: 15000,
    add_on_countries: [],
    add_on_users: 0,
    add_on_validity_days: 0,
    add_on_data_range: 0,
  },
]

const webPlans = [
  {
    type: WEB_PLAN_TYPE_CUSTOM,
    price: {
      currency: 'USD',
      amount: 0,
    },
    countries_available: [],
    validity_days: 0,
    data_range: {},
    purchase_points: 0,
    max_workspace: 0,
    support: '',
    ticket_manager: '',
    email_alert: '',
    notification: '',
    max_workspace_records: 0,
    max_users: 0,
    is_hidden: '',
    max_search_query: '',
    max_favourite_company: ''
  },
  {
    type: WEB_PLAN_TYPE_A,
    price: {
      currency: 'USD',
      amount: 198,
    },
    countries_available: ['USA'],
    validity_days: 90,
    data_range: {
      historic_years: '1',
    },
    purchase_points: 10000,
    max_workspace: 5,
    support: 'Limited',
    ticket_manager: 'NO',
    email_alert: 'NO',
    notification: 'YES',
    max_workspace_records: 5000,
    max_users: 1,
    is_hidden: false,
    max_search_query: 5,
    max_favourite_company: 2
  },
  {
    type: WEB_PLAN_TYPE_B,
    price: {
      currency: 'USD',
      amount: 349,
    },
    countries_available: ['USA', '3 LATIN'],
    validity_days: 180,
    data_range: {
      historic_years: '2',
    },
    purchase_points: 20000,
    max_workspace: 20,
    support: 'LIMITED',
    ticket_manager: 'LIMITED',
    email_alert: 'NO',
    notification: 'YES',
    max_workspace_records: 5000,
    max_users: 2,
    is_hidden: false,
    max_search_query: 10,
    max_favourite_company: 5
  },
  {
    type: WEB_PLAN_TYPE_C,
    price: {
      currency: 'USD',
      amount: 580,
    },
    countries_available: ['USA', 'ALL LATIN'],
    validity_days: 180,
    data_range: {
      historic_years: '3',
    },
    purchase_points: 40000,
    max_workspace: 40,
    support: 'YES',
    ticket_manager: 'YES',
    email_alert: '5',
    notification: 'YES',
    max_workspace_records: 10000,
    max_users: 5,
    is_hidden: false,
    max_search_query: 20,
    max_favourite_company: 10
  },
  {
    type: WEB_PLAN_TYPE_D,
    price: {
      currency: 'USD',
      amount: 999,
    },
    countries_available: ['USA', '7 COUNTRIES'],
    validity_days: 365,
    data_range: {
      historic_years: 'ALL',
    },
    countries_available: [],
    purchase_points: 100000,
    max_workspace: 80,
    support: 'ACCOUNT_MANAGER',
    ticket_manager: 'YES',
    email_alert: '10',
    notification: 'YES',
    max_workspace_records: 25000,
    max_users: 10,
    is_hidden: true,
    max_search_query: 40,
    max_favourite_company: 20
  },
  {
    type: WEB_PLAN_TYPE_E,
    price: {
      currency: 'USD',
      amount: 1999,
    },
    countries_available: ['USA', 'ALL'],
    validity_days: 365,
    data_range: {
      historic_years: 'ALL',
    },
    purchase_points: 300000,
    max_workspace: 200,
    support: 'ACCOUNT_MANAGER',
    ticket_manager: 'YES',
    email_alert: '15',
    notification: 'YES',
    max_workspace_records: 60000,
    max_users: 15,
    is_hidden: true,
    max_search_query: 50,
    max_favourite_company: 40
  }
]


const subscriptionConstraint = {
  countries_available: [],
  access_validity_interval: {
    start_date: "",
    end_date: "",
  },
  data_availability_interval: {
    start_date: "",
    end_date: "",
  },
  purchase_points: 0,
  max_users: 0,
  created_ts: 0,
  modified_ts: 0,
  favorite_company_limit: 0,
  favorite_shipment_limit: 0,
  payment: {}
}

const topUpConstraint = {
  purchase_points: 0,
  created_ts: 0,
  modified_ts: 0,
}

const webConstraint = {
  countries_available: [],
  validity_days: 0,
  data_range: {
    historic_years: '',
  },
  purchase_points: 0,
  max_workspace: 0,
  max_workspace_records: 0,
  max_users: 0,
  is_hidden: false,
  max_search_query: 0,
  max_favourite_company: 0
}

const deriveCustomSubscriptionPlanDetail = (data) => {
  let selectedPlan = subscriptionsPlans.filter(
    (plan) => plan.type === SUBSCRIPTION_PLAN_TYPE_CUSTOM
  )[0];
  let constraintBundle = data;

  let todayDate = new Date();
  selectedPlan.data_range.historic_days =
    new Date(
      todayDate.getTime() -
      new Date(
        constraintBundle.data_availability_interval.start_date
      ).getTime()
    ) /
    (24 * 60 * 60 * 1000);
  selectedPlan.validity_days =
    new Date(
      new Date(constraintBundle.access_validity_interval.end_date).getTime() -
      todayDate.getTime()
    ) /
    (24 * 60 * 60 * 1000);

  selectedPlan.countries_available = constraintBundle.countries_available;

  selectedPlan.purchase_points = Number(constraintBundle.purchase_points);
  selectedPlan.max_users = Number(constraintBundle.max_users);
  selectedPlan.is_hidden = Boolean(constraintBundle.is_hidden);
  selectedPlan.max_save_query = Number(constraintBundle.max_save_query);
  selectedPlan.max_workspace_count = Number(
    constraintBundle.max_workspace_count
  );

  selectedPlan.price.currency = data.price.currency;
  selectedPlan.price.amount = Number(data.price.amount);

  return selectedPlan;
}

const buildSubscriptionConstraint = (data) => {
  let currentTimestamp = Date.now();
  let content = JSON.parse(JSON.stringify(subscriptionConstraint));
  let selectedPlan = subscriptionsPlans.filter(
    (plan) => plan.type === data.subscriptionType
  )[0];
  let constraintBundle = {};

  if (selectedPlan.type != SUBSCRIPTION_PLAN_TYPE_CUSTOM) {
    constraintBundle = JSON.parse(JSON.stringify(selectedPlan));

    let todayDate = new Date();
    let startDate = new Date(
      todayDate.getTime() -
      constraintBundle.data_range.historic_days * 24 * 60 * 60 * 1000
    );
    let endDate = new Date(
      todayDate.getTime() + constraintBundle.validity_days * 24 * 60 * 60 * 1000
    );

    content.access_validity_interval.start_date = todayDate;
    content.access_validity_interval.end_date = endDate;

    content.data_availability_interval.start_date = startDate;
    content.data_availability_interval.end_date = endDate;
    content.subscriptionType = constraintBundle.type;
  } else {
    constraintBundle = data;

    content.access_validity_interval.start_date = new Date(
      constraintBundle.access_validity_interval.start_date
    );
    content.access_validity_interval.end_date = new Date(
      constraintBundle.access_validity_interval.end_date
    );

    content.data_availability_interval.start_date = new Date(
      constraintBundle.data_availability_interval.start_date
    );
    content.data_availability_interval.end_date = new Date(
      constraintBundle.data_availability_interval.end_date
    );

    content.subscriptionType = constraintBundle.subscriptionType;
  }
  content.countries_available = constraintBundle.countries_available;

  content.purchase_points = Number(constraintBundle.purchase_points);
  content.max_users = Number(constraintBundle.max_users);
  content.is_hidden = Boolean(constraintBundle.is_hidden);
  content.max_save_query = Number(constraintBundle.max_save_query);
  content.max_query_per_day = Number(constraintBundle.max_query_per_day);
  content.max_workspace_count = Number(constraintBundle.max_workspace_count);
  content.favorite_company_limit = Number(
    constraintBundle.favorite_company_limit
  );
  content.favorite_shipment_limit = Number(
    constraintBundle.favorite_shipment_limit
  );
  content.payment = constraintBundle.payment
  content.created_ts = currentTimestamp;
  content.modified_ts = currentTimestamp;

  return content;
}

const buildWebConstraint = (data) => {
  let currentTimestamp = Date.now();
  let content = {
    access_validity_interval: {},
    data_availability_interval: {}
  }
  let selectedPlan = webPlans.filter((plan) => plan.type === data.plan_type)[0];

  let start_date = new Date();
  let end_date = new Date(start_date.getTime() + selectedPlan.validity_days * 24 * 60 * 60 * 1000);
  content.access_validity_interval.start_date = start_date;
  content.access_validity_interval.end_date = end_date;
  if (selectedPlan.data_range.historic_years == "ALL") {
    content.data_availability_interval.start_date = new Date(0);
  } else {
    content.data_availability_interval.start_date = new Date(start_date.getTime() - selectedPlan.data_range.historic_years * 365 * 24 * 60 * 60 * 1000);
  }
  content.data_availability_interval.end_date = end_date ;
  content.purchase_points = Number(selectedPlan.purchase_points);
  content.max_users = (selectedPlan.max_users);
  content.subscriptionType = selectedPlan.type;
  content.is_hidden = Boolean(selectedPlan.is_hidden);
  content.max_save_query = Number(selectedPlan.max_search_query);
  content.max_query_per_day = Number(selectedPlan.max_search_query);
  content.max_workspace_count = Number(selectedPlan.max_workspace);
  content.favorite_shipment_limit = Number(selectedPlan.max_favourite_company);
  content.favorite_company_limit = Number(selectedPlan.max_favourite_company);
  content.payment = data.payment;
  content.created_ts = currentTimestamp;
  content.modified_ts = currentTimestamp;

  return content;
}

const buildTopUpConstraint = (data) => {
  let currentTimestamp = Date.now();
  let content = JSON.parse(JSON.stringify(topUpConstraint));
  let selectedPlan = topUpPlans.filter(
    (plan) => plan.type === data.topUpType
  )[0];
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
}

const getSubscriptionPlanByType = (type) => {
  return subscriptionsPlans.filter((plan) => plan.type === type)[0];
}

const getSubscriptionPlans = () => {
  return subscriptionsPlans.filter(
    (plan) =>
      plan.type != SUBSCRIPTION_PLAN_TYPE_CUSTOM &&
      plan.type != SUBSCRIPTION_PLAN_TYPE_A
  );
}

const getWebPlans = () => {
  return webPlans.filter(
    (plan) =>
      plan.type != WEB_PLAN_TYPE_CUSTOM
  );
}

module.exports = {
  ITEM_CATEGORY_SUBCRIPTION,
  ITEM_CATEGORY_TOP_UP,
  ITEM_CATEGORY_WEB,
  SUBSCRIPTION_PLAN_TYPE_CUSTOM,
  TOPUP_PLAN_TYPE_CUSTOM,
  WEB_PLAN_TYPE_CUSTOM,
  RESULT_PORTION_TYPE_RECORDS,
  RESULT_PORTION_TYPE_SUMMARY,
  subscriptionsPlans,
  topUpPlans,
  webPlans,
  deriveCustomSubscriptionPlanDetail,
  buildSubscriptionConstraint,
  buildWebConstraint,
  buildTopUpConstraint,
  getSubscriptionPlanByType,
  getSubscriptionPlans,
  getWebPlans
}
