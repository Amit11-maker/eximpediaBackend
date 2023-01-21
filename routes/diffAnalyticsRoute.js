const TAG = 'diffAnalyaticsRoute';

const express = require('express');
const router = express.Router({
  mergeParams: true
});

const diffAnalyticsController = require('../controllers/diffAnalyticsController');

const AuthMiddleware = require('../middlewares/authMiddleware');

// Route to create summary of companies data as per two countries
router.post('/companies/search', AuthMiddleware.authorizeAccess , diffAnalyticsController.fetchCompanies);

// Route to create summary of a countries data as per a company
router.post('/countries/search', AuthMiddleware.authorizeAccess , diffAnalyticsController.fetchCountries);

// Route to get filters for companies data as per two countries
router.post('/filters', AuthMiddleware.authorizeAccess , diffAnalyticsController.fetchFilters);

// Route to download companies data as per two countries
router.post('/companies/download', AuthMiddleware.authorizeAccess , diffAnalyticsController.downloadCompaniesData);

// Route to download countries data as per a company
router.post('/countries/download', AuthMiddleware.authorizeAccess , diffAnalyticsController.downloadCountriesData);

module.exports = router;
