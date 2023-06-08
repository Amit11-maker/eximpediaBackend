const express = require("express");
const router = express.Router({
  mergeParams: true,
});
const signUpUserController = require("../controllers/signUpUserController");
router.use(function timeLog(req, res, next) {
  //console.log('Time: ', Date.now());
  next();
});

router.post("/newUser", signUpUserController.addSignUpUser);
router.get("/getUser/:customerId" , signUpUserController.getSignUpUser);
router.post("/validateEmail/:emailId" , signUpUserController.validateEmailId);
router.get("/getUserPlanDetails/:customerId" , signUpUserController.getUserPlanDetails);
router.post("/plan" , signUpUserController.planRequest);
router.post("/paymentUpdate" , signUpUserController.updatePaymentAndApplyConstraints);

module.exports = router;
