const TAG = 'userSchema';

const ObjectID = require('mongodb').ObjectID;

const USER_MODE_DEACTIVATE = 0;
const USER_MODE_ACTIVATE = 1;

const USER_EMAIL_VERIFIED = 1;

const SEPARATOR_UNDERSCORE = '_';
const SEPARATOR_SPACE = ' ';

const IDENTITY_SCOPES = {
  consumer: 'CONSUMER',
  provider: 'PROVIDER'
}

const USER_ROLES = {
  administrator: 'ADMINISTRATOR',
  moderator: 'MODERATOR',
  support: 'SUPPORT',
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
  role: USER_ROLES.MODERATOR,
  available_credits : '',
  available_countries : [],
  is_account_owner: 0,
  is_active: 0,
  is_first_login : 0,
  scope: IDENTITY_SCOPES.consumer,
  created_ts: 0,
  modified_ts: 0
}

const userMeta = {
  user_id: '',
  account_id: '',
  first_name: '',
  last_name: '',
  email_id: '',
  refresh_token: '',
  role: '',
  scope :'',
  password :''
}

const buildUser = (data) => {
  let currentTimestamp = Date.now();
  let content = JSON.parse(JSON.stringify(user));
  content.account_id = ObjectID(data.account_id);
  content.first_name = data.first_name ?? "";
  content.last_name = data.last_name ?? "";
  content.mobile_no = data.mobile_no ?? "";
  content.email_id = data.email_id.toLowerCase().trim() ?? "";
  content.password = data.password;
  content.refresh_token = '';
  content.is_email_verified = 0;
  content.role = data.role;
  content.available_credits = parseInt(!(data.allocated_credits) ? 0 : data.allocated_credits);
  content.available_countries = data.allocated_countries;
  content.is_active = 0;
  content.is_first_login = 0;
  content.created_ts = currentTimestamp;
  content.modified_ts = currentTimestamp;


  if (data.role == "ADMINISTRATOR") {
    content.parent_id = null;
  } else {
    content.parent_id = ObjectID(data.parentId);
  }

  return content;
}

const buildUserUpdate = (data) => {
  let currentTimestamp = Date.now();
  let content = {};

  if (data != null && data != undefined) {

    if (data.first_name != null) content.first_name = data.first_name;
    if (data.last_name != null) content.last_name = data.last_name;
    if (data.email_id != null) content.email_id = data.email_id.toLowerCase().trim();
    if (data.mobile_no != null) content.mobile_no = data.mobile_no;
    if (data.password != null) content.password = data.password;
    if (data.refresh_token != null) content.refresh_token = data.refresh_token;
    if (data.is_email_verified != null) content.is_email_verified = data.is_email_verified;
    if (data.role != null) content.role = data.role;
    if (data.is_active != null) content.is_active = data.is_active;
    if (data.allocated_countries != null) content.available_countries = data.allocated_countries;
  }

  content.modified_ts = currentTimestamp;

  return content;
}

const buildUserMeta = (data) => {
  let content = JSON.parse(JSON.stringify(userMeta));
  content.user_id = data._id;
  content.account_id = data.account_id;
  content.first_name = data.first_name;
  content.last_name = data.last_name;
  content.email_id = data.email_id.toLowerCase().trim();
  content.refresh_token = '';
  content.role = data.role;
  content.scope = data.scope;
  content.password = data.password;
  return content;
}


module.exports = {
  IDENTITY_SCOPES,
  USER_MODE_ACTIVATE,
  USER_MODE_DEACTIVATE,
  USER_EMAIL_VERIFIED,
  USER_ROLES,
  buildUser,
  buildUserUpdate,
  buildUserMeta,
}
