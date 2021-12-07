const signUpUserModel = require("../models/signUpUserModel");
const downloadCheckModel = require("../models/downloadCheckModel");

const downloadCheck = (req, res) => {
  let payload = req.body;
  signUpUserModel.get(payload).then((data, error) => {
    if (data) {
      if (data.download) {
        downloadCheckModel.updateSignUpUser(payload).then((data) => {
          if (data) {
            res
              .status(200)
              .json({ message: "Your Data Download Successfully", flag: true });
          } else {
            res.status(500).json({
              message: "Internal Server Error",
              flag: false,
            });
          }
        });
      } else {
        res.status(200).send({
          message: "You already exist your limit",
          flag: false,
        });
      }
    } else {
      res.status(200).send({
        message: "You are not authorized please sign-up first ",
        flag: false,
      });
    }
  });
};

module.exports = { downloadCheck };
