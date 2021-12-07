const express = require("express");
const router = express.Router({
  mergeParams: true,
});

const downloadCheckController = require("../controllers/downloadCheckController");
router.use(function timeLog(req, res, next) {
  //console.log('Time: ', Date.now());
  next();
});

router.post("/check", downloadCheckController.downloadCheck);
module.exports = router;
