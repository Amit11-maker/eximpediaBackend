const TAG = 'marketAnalyaticsRoute';

const express = require('express');
const router = express.Router({
  mergeParams: true
});

const marketAnalyticsController = require('../controllers/marketAnalyticsController');

const AuthMiddleware = require('../middlewares/authMiddleware');


// Route to analyse market data of companies as per two countries
router.post('/companies/search', AuthMiddleware.authorizeAccess, marketAnalyticsController.fetchContryWiseMarketAnalyticsData);
router.post('/companies/filters', AuthMiddleware.authorizeAccess, marketAnalyticsController.fetchContryWiseMarketAnalyticsFilters);
router.post('/companies/download', AuthMiddleware.authorizeAccess, marketAnalyticsController.downloadContryWiseMarketAnalyticsData);


// Route to analyse country vs country market data as per the company
router.post('/countries/search', AuthMiddleware.authorizeAccess, marketAnalyticsController.fetchContryWiseCompanyAnalyticsData);
router.post('/countries/download', AuthMiddleware.authorizeAccess, marketAnalyticsController.downloadContryWiseCompanyAnalyticsData);


// Route to analyse country vs product market data
router.post('/product/search', AuthMiddleware.authorizeAccess, marketAnalyticsController.fetchProductWiseMarketAnalyticsData);
router.post('/product/filter', AuthMiddleware.authorizeAccess, marketAnalyticsController.fetchProductWiseMarketAnalyticsFilters);
router.post('/product/download', AuthMiddleware.authorizeAccess, marketAnalyticsController.downloadProductWiseMarketAnalyticsData);

// Route to analyse country vs importer/exporter market data
router.post('/trade/search', AuthMiddleware.authorizeAccess, marketAnalyticsController.fetchTradeWiseMarketAnalyticsData);
router.post('/trade/filter', AuthMiddleware.authorizeAccess, marketAnalyticsController.fetchTradeWiseMarketAnalyticsFilters);
router.post('/trade/download', AuthMiddleware.authorizeAccess, marketAnalyticsController.downloadTradeWiseMarketAnalyticsData);

module.exports = router;
