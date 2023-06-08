const TAG = 'analyticsRoute';

const express = require('express');
const router = express.Router({
  mergeParams: true
});

const AnalyticsController = require('../controllers/analyticsController');

const AuthMiddleware = require('../middlewares/authMiddleware');

// Log Time
router.use(function timeLog(req, res, next) {
  //console.log('Time: ', Date.now());
  next();
});

//Command Segregation

//router.post('/summary/chronology/trade', AnalyticsController.fetchAnalyticsComparison); // Aliased GET
router.post('/correlation/chronology/trade/factors', AnalyticsController.fetchChronologicalTradeFactorsCorrelation); // Aliased GET
router.post('/distribution/chronology/trade/entities', AnalyticsController.fetchChronologicalTradeEntitiesDistribution); // Aliased GET
router.post('/comparison/chronology/trade/entities', AnalyticsController.fetchChronologicalTradeEntitiesComparison); // Aliased GET

router.post('/correlation/trade/entities/factors', AnalyticsController.fetchTradeEntitiesFactorsCorrelation); // Aliased GET
router.post('/contribution/trade/entities/factors', AnalyticsController.fetchTradeEntitiesFactorsContribution); // Aliased GET
router.post('/periodisation/trade/entities/factors', AnalyticsController.fetchTradeEntitiesFactorsPeriodisation); // Aliased GET
router.post('/composition/trade/entities/factors', AnalyticsController.fetchTradeEntitiesFactorsComposition); // Aliased GET

// Query Segregation

module.exports = router;
