const express = require("express");
const router = express.Router({
  mergeParams: true,
});
const signUpUserController = require("../controllers/signUpUserController");
router.use(function timeLog(req, res, next) {
  //console.log('Time: ', Date.now());
  next();
});

router.post("/newUser", signUpUserController.addUserEntry);

module.exports = router;
