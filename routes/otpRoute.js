const TAG = "dashboardRoute";

const express = require("express");
const otpController = require("../controllers/otpController");
const AuthMiddleware = require("../middlewares/authMiddleware");
const router = express.Router({
  mergeParams: true,
});

router.use(function timeLog(req, res, next) {
  //console.log('Time: ', Date.now());
  next();
});

router.post("/generate", otpController.otpGenrator);
router.post("/verify", otpController.otpVerify);

module.exports = router;
