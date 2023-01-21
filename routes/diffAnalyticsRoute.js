const TAG = 'diffAnalyaticsRoute';

const express = require('express');
const router = express.Router({
  mergeParams: true
});

const diffAnalyticsController = require('../controllers/diffAnalyticsController');

const AuthMiddleware = require('../middlewares/authMiddleware');

// Route to create summary of companies data as per two countries
router.post('/companies/search', diffAnalyticsController.fetchCompanies);

// Route to create summary of a countries data as per a company
router.post('/countries/search', diffAnalyticsController.fetchCountries);

// Route to get filters for companies data as per two countries
router.post('/filters', diffAnalyticsController.fetchFilters);

// Route to download companies data as per two countries
router.post('/companies/download', diffAnalyticsController.downloadCompaniesData);

// Route to download countries data as per a company
router.post('/countries/download', diffAnalyticsController.downloadCountriesData);

module.exports = router;
