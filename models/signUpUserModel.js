const MongoDbHandler = require("../db/mongoDbHandler");
const signUpUserSchema = require("../schemas/signUpUserSchema");

const addSignUpUser = async (data) => {
  try {
    const result = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.signup_user)
      .insertOne(data);

    return result;
  }
  catch (error) {
    throw error;
  }
}

const getSignUpUser = async (customer_id) => {
  try {
    const result = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.signup_user)
      .findOne({ _id : customer_id });

    return result;
  }
  catch (error) {
    throw error;
  }
}

const updateSignUpUser = async (data) => {
  try {
    const result = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.signup_user)
      .updateOne(
        {
          email_address: data.email_address,
        },
        {
          $set: { data }
        });
    return result;
  }
  catch (error) {
    throw error;
  }
}

module.exports = {
  getSignUpUser,
  addSignUpUser,
  updateSignUpUser
}
