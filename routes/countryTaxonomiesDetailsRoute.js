const express = require("express");
const router = express.Router({
  mergeParams: true,
});

const countryTaxonomiesDetailsRoute = require("../controllers/countryTaxonomiesDetailsController");
router.use(function timeLog(req, res, next) {
  //console.log('Time: ', Date.now());
  next();
});

router.post("/", countryTaxonomiesDetailsRoute.fetch);
module.exports = router;
