const TAG = "taxonomyRoute";

const express = require("express");
const router = express.Router({
  mergeParams: true,
});

const TaxonomyController = require("../controllers/taxonomyController");
const TradeController = require("../controllers/tradeController")
const AuthMiddleware = require("../middlewares/authMiddleware");

// Log Time
router.use(function timeLog(req, res, next) {
  //console.log('Time: ', Date.now());
  next();
});

//Command Segregation

// Query Segregation
router.get("/", AuthMiddleware.authorizeAccess, TaxonomyController.fetch);

// fetch countries list
router.get("/countries/list", AuthMiddleware.authorizeAccess, TaxonomyController.listCountries);

module.exports = router;
