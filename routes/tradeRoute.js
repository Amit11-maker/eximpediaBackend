const TAG = 'tradeRoute';

const express = require('express');
const router = express.Router({
  mergeParams: true
});

const TradeController = require('../controllers/tradeController');
const AuthMiddleware = require('../middlewares/authMiddleware');

// Log Time
router.use(function timeLog(req, res, next) {
  //console.log('Time: ', Date.now());
  next();
});

//Command Segregation

// router.post('/shipments/explore/records', AuthMiddleware.authorizeAccess, TradeController.fetchExploreShipmentsRecords);
router.post('/shipments/explore/records', AuthMiddleware.authorizeAccess, TradeController.fetchAdxData);
// router.post('/shipments/explore/records/filter', AuthMiddleware.authorizeAccess, TradeController.fetchExploreShipmentsFilters);
router.post('/shipments/explore/records/filter', AuthMiddleware.authorizeAccess, TradeController.fetchAdxFilters);
// router.post('/shipments/explore/traders/search', AuthMiddleware.authorizeAccess, TradeController.fetchExploreShipmentsTradersByPattern);
router.post('/shipments/explore/traders/search', AuthMiddleware.authorizeAccess, TradeController.fetchAdxSuggestions);
router.post('/shipments/explore/statistics', AuthMiddleware.authorizeAccess, TradeController.fetchExploreShipmentsStatistics);
router.post('/shipments/explore/traders', AuthMiddleware.authorizeAccess, TradeController.fetchExploreShipmentsTraders);

router.get('/countries/explore', AuthMiddleware.authorizeAccess, TradeController.fetchExploreCountries);
router.get('/countries/bl/explore', AuthMiddleware.authorizeAccess, TradeController.fetchBLExploreCountries);
router.get('/countries', TradeController.fetchCountries);
router.get('/shipments/explore/specifications', AuthMiddleware.authorizeAccess, TradeController.fetchExploreShipmentsSpecifications);
router.get('/shipments/explore/estimate', AuthMiddleware.authorizeAccess, TradeController.fetchExploreShipmentsEstimate);

// Route to create summary of a company
router.post('/companies/search' , AuthMiddleware.authorizeAccess, TradeController.fetchCompanySummary);

// Routes to get and update explore view Columns
router.post('/addViewColumn', AuthMiddleware.authorizeAccess, TradeController.createOrUpdateExploreViewColumns);
router.get('/getViewColumn/:taxonomy_id', AuthMiddleware.authorizeAccess, TradeController.getExploreViewColumns);

router.post('/sort/schema', AuthMiddleware.authorizeAccess,TradeController.getSortSchema);

// Cognitive search

router.get("/indices", TradeController.fetchAdxData)


module.exports = router;
