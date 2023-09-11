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

<<<<<<< HEAD
// fetch countries list
=======
// countries list
>>>>>>> eae7809c7f1b1b67476dcea4bff4647263bfd9e5
router.get("/countries/list", AuthMiddleware.authorizeAccess, TaxonomyController.listCountries);

module.exports = router;
