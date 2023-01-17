const TAG = 'diffAnalyaticsRoute';

const express = require('express');
const router = express.Router({
  mergeParams: true
});

const diffAnalyticsController = require('../controllers/diffAnalyticsController');

const AuthMiddleware = require('../middlewares/authMiddleware');

// Log Time
router.use(function timeLog(req, res, next) {
  //console.log('Time: ', Date.now());
  next();
});



// Route to create summary of a company data
router.post('/companies/search', diffAnalyticsController.fetchCompanies);
router.post('/countries/search', diffAnalyticsController.fetchCountries);
router.post('/filters', diffAnalyticsController.fetchFilters);
module.exports = router;
