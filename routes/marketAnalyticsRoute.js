const TAG = 'marketAnalyaticsRoute';

const express = require('express');
const router = express.Router({
  mergeParams: true
});

const marketAnalyticsController = require('../controllers/marketAnalyticsController');

const AuthMiddleware = require('../middlewares/authMiddleware');


// Route to get market analysis of companies data as per two countries
router.post('/companies/search', AuthMiddleware.authorizeAccess , marketAnalyticsController.fetchCompanies);

// Route to get filters for companies data as per two countries
router.post('/filters', AuthMiddleware.authorizeAccess , marketAnalyticsController.fetchFilters);

// Route to download companies data as per two countries
router.post('/companies/download', AuthMiddleware.authorizeAccess , marketAnalyticsController.downloadCompaniesData);


// Route to get country vs country data analysis as per the company
router.post('/countries/search', AuthMiddleware.authorizeAccess , marketAnalyticsController.fetchCountries);

// Route to download countries data as per a company
router.post('/countries/download', AuthMiddleware.authorizeAccess , marketAnalyticsController.downloadCountriesData);



module.exports = router;
