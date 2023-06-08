const TAG = "taxonomyRoute";

const express = require("express");
const router = express.Router({
  mergeParams: true,
});

const TaxonomyController = require("../controllers/taxonomyController");

const AuthMiddleware = require("../middlewares/authMiddleware");

// Log Time
router.use(function timeLog(req, res, next) {
  //console.log('Time: ', Date.now());
  next();
});

//Command Segregation

// Query Segregation
router.get("/", AuthMiddleware.authorizeAccess, TaxonomyController.fetch);

module.exports = router;
