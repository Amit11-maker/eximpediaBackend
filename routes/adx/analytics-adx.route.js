// @ts-check

const express = require('express');
const router = express.Router({
    mergeParams: true
});

const AnalyticsController_ADX = require('../../controllers/adx/analytics.adx.controller');

// Log Time
router.use(function timeLog(req, res, next) {
    //console.log('Time: ', Date.now());
    next();
});

//Command Segregation

//router.post('/summary/chronology/trade', AnalyticsController.fetchAnalyticsComparison); // Aliased GET
router.post('/correlation/chronology/trade/factors', AnalyticsController_ADX.fetchChronologicalTradeFactorsCorrelation_ADX); // Aliased GET
router.post('/distribution/chronology/trade/entities', AnalyticsController_ADX.fetchChronologicalTradeEntitiesDistribution_ADX); // Aliased GET
router.post('/comparison/chronology/trade/entities', AnalyticsController_ADX.fetchChronologicalTradeEntitiesComparison_ADX); // Aliased GET

router.post('/correlation/trade/entities/factors', AnalyticsController_ADX.fetchTradeEntitiesFactorsCorrelation_ADX); // Aliased GET
router.post('/contribution/trade/entities/factors', AnalyticsController_ADX.fetchTradeEntitiesFactorsContribution_ADX); // Aliased GET
router.post('/periodisation/trade/entities/factors', AnalyticsController_ADX.fetchTradeEntitiesFactorsPeriodization_ADX); // Aliased GET
router.post('/composition/trade/entities/factors', AnalyticsController_ADX.fetchTradeEntitiesFactorsComposition_ADX); // Aliased GET

// Query Segregation

module.exports = router;
