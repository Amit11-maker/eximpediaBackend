const TAG = 'accountSchema';

const ObjectID = require('mongodb').ObjectID;

const ACCOUNT_MODE_DEACTIVATE = 0;
const ACCOUNT_MODE_ACTIVATE = 1;

const SEPARATOR_UNDERSCORE = '_';
const SEPARATOR_SPACE = ' ';

const IDENTITY_SCOPES = {
  consumer: 'CONSUMER',
  provider: 'PROVIDER'
};

const account = {
  company: {
    name: '',
    email_id: '',
    website_url: '',
    phone_no: '',
    fax_no: '',
    tax_identification_no: '',
    address: '',
    pin_code: '',
    city: '',
    state: '',
    country: ''
  },
  access: {
    email_id: ''
  },
  plan_constraints: {},
  is_active: 1,
  scope: IDENTITY_SCOPES.consumer,
  created_ts: 0,
  modified_ts: 0,
};

const buildAccount = (data) => {
  let currentTimestamp = Date.now();
  let content = JSON.parse(JSON.stringify(account));

  content.company.name = data.company.name;
  content.company.email_id = data.company.email_id;
  content.company.website_url = data.company.website_url;
  content.company.phone_no = data.company.phone_no;
  content.company.tax_identification_no = data.company.tax_identification_no;
  content.company.fax_no = data.company.fax_no;
  content.company.address = data.company.address;
  content.company.pin_code = data.company.pin_code;
  content.company.city = data.company.city;
  content.company.state = data.company.state;
  content.company.country = data.company.country;

  content.access.email_id = data.user.email_id;

  content.is_active = 1;
  content.created_ts = currentTimestamp;
  content.modified_ts = currentTimestamp;

  return content;
};

const buildAccountUpdate = (data) => {
  let currentTimestamp = Date.now();
  let content = {
    company: {}
  };

  if (data != null) {

    if (data.company != null && data.company != undefined) {
      if (data.company.name != null) content.company.name = data.company.name;
      if (data.company.email_id != null) content.company.email_id = data.company.email_id;
      if (data.company.website_url != null) content.company.website_url = data.company.website_url;
      if (data.company.phone_no != null) content.company.phone_no = data.company.phone_no;
      if (data.company.tax_identification_no != null) content.company.tax_identification_no = data.company.tax_identification_no;
      if (data.company.fax_no != null) content.company.fax_no = data.company.fax_no;
      if (data.company.address != null) content.company.address = data.company.address;
      if (data.company.pin_code != null) content.company.pin_code = data.company.pin_code;
      if (data.company.city != null) content.company.city = data.company.city;
      if (data.company.state != null) content.company.state = data.company.state;
      if (data.company.country != null) content.company.country = data.company.country;
    }

    if (data.user != null && data.user != undefined) {
      if (data.user.email_id != null) content.access.email_id = data.user.email_id;
    }

    if (data.plan != null && data.plan != undefined) {

    }

    if (data.is_active != null && data.is_active != undefined) {
      content.is_active = data.is_active;
    }

  }

  content.modified_ts = currentTimestamp;

  return content;
};

module.exports = {
  buildAccount,
  buildAccountUpdate,
  ACCOUNT_MODE_ACTIVATE,
  ACCOUNT_MODE_DEACTIVATE,
};
