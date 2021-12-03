const signUpUserModel = require("../models/signUpUserModel");
const signUpUserSchema = require("../schemas/signUpUserSchema");

const addUserEntry = (req, res) => {
  let payload = req.body;
  if (payload.date_and_time) {
    signUpUserModel
      .get(payload)
      .then((data, error) => {
        if (data) {
          if (data.live_demo) {
            signUpUserModel.updateSignUpUser(payload).then((data) => {
              if (data) {
                res
                  .status(200)
                  .json({ message: "Your request has been updated" });
              } else {
                res.status(500).json({
                  message: "Internal Server Error",
                });
              }
            });
          } else {
            res.status(200).send({ message: "You already exist your limit" });
          }
        } else {
          res.status(200).send({ message: "Please sign-up first " });
        }
      })
      .catch((err) => {
        res.status(404).send(err);
      });
  } else {
    signUpUserModel.get(payload).then((data, error) => {
      if (data && data.email_address) {
        res.status(200).json({ message: "Email already exist" });
      } else {
        const signUpUser = signUpUserSchema.buildSignUpUser(payload);
        signUpUserModel.add(signUpUser, (error, signUpUser) => {
          if (error) {
            res.status(500).json({
              message: "Internal Server Error",
            });
          } else {
            res
              .status(200)
              .json({ data: signUpUser, message: "Successfully Register" });
          }
        });
      }
    });
  }
};

module.exports = { addUserEntry };
