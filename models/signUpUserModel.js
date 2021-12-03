const MongoDbHandler = require("../db/mongoDbHandler");

const add = (signUpUser, cb) => {
  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.signup_user)
    .insertOne(signUpUser, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
};

const get = async (data) => {
  const result = await MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.signup_user)
    .findOne({ email_address: data.email_address });

  return result;
};

const updateSignUpUser = async (payload) => {
  const result = await MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.signup_user)
    .updateOne(
      {
        email_address: payload.email_address,
      },
      {
        $set: {
          person_name: payload.person_name,
          company_name: payload.company_name,
          email_address: payload.email_address,
          mobile_number: payload.mobile_number,
          country: payload.country,
          live_demo: false,
          date_and_time: payload.date_and_time,
          your_message: payload.your_message,
          modified_ts: payload.created_ts,
        },
      }
    );
  // );
  return result;
};

module.exports = { add, updateSignUpUser, get };
