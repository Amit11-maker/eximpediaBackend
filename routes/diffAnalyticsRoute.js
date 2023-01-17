const TAG = 'diffAnalyaticsRoute';

const express = require('express');
const router = express.Router({
  mergeParams: true
});

const TradeController = require('../controllers/tradeController');
const diffAnalyticsController = require('../controllers/diffAnalyticsController');

const AuthMiddleware = require('../middlewares/authMiddleware');

// Log Time
router.use(function timeLog(req, res, next) {
  //console.log('Time: ', Date.now());
  next();
});



// Route to create summary of a company data
router.post('/companies/search', AuthMiddleware.authorizeAccess, diffAnalyticsController.fetchCompanies);
router.post('/countries/search', AuthMiddleware.authorizeAccess, diffAnalyticsController.fetchCountries);
router.post('/filters', AuthMiddleware.authorizeAccess, diffAnalyticsController.fetchFilters);
module.exports = router;
