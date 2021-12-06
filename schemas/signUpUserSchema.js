const ObjectID = require("mongodb").ObjectID;

const signUpUser = {
  person_name: "",
  company_name: "",
  email_address: "",
  password: "",
  mobile_number: "",
  country: "",
  date_and_time: "",
  your_message: "",
  download: true,
  live_demo: true,
  created_ts: 0,
  modified_ts: 0,
};

const buildSignUpUser = (data) => {
  let currentTimestamp = Date.now();
  let content = JSON.parse(JSON.stringify(signUpUser));
  content.person_name = data.person_name;
  content.company_name = data.company_name;
  content.email_address = data.email_address;
  content.password = data.password;
  content.mobile_number = data.mobile_number ?? "";
  content.country = data.country ?? "";
  content.date_and_time = data.date_and_time ?? "";
  content.your_message = data.your_message ?? "";
  content.download = true;
  content.live_demo = true;
  content.created_ts = currentTimestamp;
  content.modified_ts = currentTimestamp;
  return content;
};

module.exports = { buildSignUpUser };
