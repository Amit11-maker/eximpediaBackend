const TAG = "saveQueryRoute";

const express = require("express");
const router = express.Router({
  mergeParams: true,
});

const QueryController = require("../controllers/saveQueryController");

const AuthMiddleware = require("../middlewares/authMiddleware");

// Log Time
router.use(function timeLog(req, res, next) {
  console.log("Time: ", Date.now());
  next();
});

//Command Segregation
router.post("/save", AuthMiddleware.authorizeAccess, QueryController.saveUserQuery);
router.get(`/:id?`, AuthMiddleware.authorizeAccess, QueryController.getQuery);
router.put("/:id", AuthMiddleware.authorizeAccess, QueryController.updateUserEntry);
router.delete("/:id", AuthMiddleware.authorizeAccess, QueryController.deleteUserQuery);

module.exports = router;
