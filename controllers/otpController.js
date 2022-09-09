var axios = require("axios");
var sha512 = require("js-sha512");
var date = new Date();
var currentTimestampInMillis = Math.round(date.getTime());
var customerKey = 274886;
var apiKey = "qo3fpPdo3FCW3aHjD3chnjnrRoTYePC1";
var stringToHash = customerKey + currentTimestampInMillis + apiKey;
var authHeader = sha512(stringToHash);

const otpGenrator = (req, res) => {
  axios({
    method: "post",
    url: "https://login.xecurify.com/moas/api/auth/challenge",
    headers: {
      "Content-Type": "application/json",
      "Customer-Key": "274886",
      Timestamp: currentTimestampInMillis,
      Authorization: authHeader,
    },
    data: JSON.stringify({
      customerKey: "274886",
      email: req.body.email,
      authType: "EMAIL",
      transactionName: "CUSTOM-OTP-VERIFICATION",
    }),
  })
    .then(function (response) {
      logger.info(JSON.stringify(response.data));
      res.send(response.data);
    })
    .catch(function (error) {
      logger.error(`OTP CONTROLLER ================== ${JSON.stringify(error)}`);
      res.send(error);
    });
};

const otpVerify = (req, res) => {
  axios({
    method: "post",
    url: "https://login.xecurify.com/moas/api/auth/validate",
    headers: {
      "Content-Type": "application/json",
      "Customer-Key": "274886",
      Timestamp: currentTimestampInMillis,
      Authorization: authHeader,
    },
    data: JSON.stringify({
      txId: req.body.txId,
      token: req.body.token,
    }),
  })
    .then(function (response) {
      logger.info(JSON.stringify(response.data));
      res.send(response.data);
    })
    .catch(function (error) {
      logger.error(`OTP CONTROLLER ================== ${JSON.stringify(error)}`);
      res.send(error);
    });
};
module.exports = { otpGenrator, otpVerify };
