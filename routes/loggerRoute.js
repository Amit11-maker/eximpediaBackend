const express = require("express");
const router = express.Router({
  mergeParams: true,
});
const { logger } = require("../config/logger");

const AuthMiddleware = require("../middlewares/authMiddleware");
// Log Time
router.use(function timeLog(req, res, next) {
  //console.log('Time: ', Date.now());
  next();
});

//Command Segregation
router.use("/addlogger", AuthMiddleware.authorizeAccess, function (req, res) {
  console.log(req.body);
  logger.log(
    `LEDGER CONTROLLER ================== ${JSON.stringify(req.body.logs)}`
  );
});

module.exports = router;
