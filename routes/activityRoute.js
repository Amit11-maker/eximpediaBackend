const TAG = "activityRoute";

const express = require("express");
const router = express.Router({
  mergeParams: true,
});

const AuthMiddleware = require("../middlewares/authMiddleware");
const ActivityController = require("../controllers/activityController");

/* create activity data for the user */
router.post(
  "/create",
  AuthMiddleware.authorizeAccess,
  ActivityController.createActivity
);

/* fetch activity data for the account */
router.get(
  "/account/:accountId",
  AuthMiddleware.authorizeAccess,
  ActivityController.fetchAccountActivityData
);

/* fetch activity data for the user */
router.get(
  "/user",
  // AuthMiddleware.authorizeAccess,
  ActivityController.fetchUserActivityData
);

/* fetch activity data for the user by EmailId */
router.get(
  "/user/email/:emailId",
  AuthMiddleware.authorizeAccess,
  ActivityController.fetchUserActivityDataByEmailId
);

/** Get Users list for activity tracking for a account */
router.post(
  "/account/list",
  AuthMiddleware.authorizeAccess,
  ActivityController.fetchAllCustomerAccountsForActivity
);

/** Get Users list for activity tracking for a account */
router.get(
  "/user/list/:accountId",
  // AuthMiddleware.authorizeAccess,
  ActivityController.fetchAllAccountUsersForActivity
);

/** Download DataTable activity tracking for a user */
router.post(
  "/user/download",
  AuthMiddleware.authorizeAccess,
  ActivityController.downloadActivityTableForUser
);

// ! fetch user by EmailId for the activity tracking
router.put("/user/find", ActivityController.fetchUserByEmailId);

module.exports = router;
