const MongoDbHandler = require("../db/mongoDbHandler");

const updateSignUpUser = async (payload) => {
  const result = await MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.signup_user)
    .updateOne(
      {
        email_address: payload.email_address,
      },
      {
        $set: {
          download: false,
        },
      }
    );
  return result;
};

module.exports = { updateSignUpUser };
