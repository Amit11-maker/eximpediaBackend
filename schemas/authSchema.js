const TAG = 'authSchema';

const ObjectID = require('mongodb').ObjectID;

const SEPARATOR_UNDERSCORE = '_';
const SEPARATOR_SPACE = ' ';

const user = {
  account_id: '',
  first_name: '',
  last_name: '',
  email_id: '',
  password: '',
  refresh_token: '',
  is_email_verified: 0,
  is_active: 0,
  created_ts: 0,
  modified_ts: 0
};

const buildRoles = (data) => {
  let currentTimestamp = Date.now();
  let content = JSON.parse(JSON.stringify(user));
  content.user_id = ObjectID(data.user_id);
  return content;
};

module.exports = {
  buildUser,
  USER_MODE_ACTIVATE,
  USER_MODE_DEACTIVATE,
};
