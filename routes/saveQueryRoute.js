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
router.post("/save", QueryController.saveUserQuery);
router.get(`/`, QueryController.get);
router.put("/:id", QueryController.updateUserEntry);
router.delete('/:id', QueryController.remove);

// router.get('/', AuthMiddleware.authorizeAccess, QueryController.fetchUsers);

module.exports = router;
