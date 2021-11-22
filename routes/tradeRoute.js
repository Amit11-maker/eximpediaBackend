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

//Exceptional Use-Case As Params Contain Large Data Payloads
router.post('/shipments/explore/records', AuthMiddleware.authorizeAccess, TradeController.fetchExploreShipmentsRecords); // Aliased GET
router.post('/shipments/explore/statistics', AuthMiddleware.authorizeAccess, TradeController.fetchExploreShipmentsStatistics); // Aliased GET
router.post('/shipments/explore/traders', AuthMiddleware.authorizeAccess, TradeController.fetchExploreShipmentsTraders); // Aliased GET

// Query Segregation
router.get('/countries/explore', AuthMiddleware.authorizeAccess, TradeController.fetchExploreCountries);
router.get('/countries', TradeController.fetchCountries);
router.get('/shipments/explore/specifications', AuthMiddleware.authorizeAccess, TradeController.fetchExploreShipmentsSpecifications);
router.get('/shipments/explore/traders/search', AuthMiddleware.authorizeAccess, TradeController.fetchExploreShipmentsTradersByPattern);
router.get('/shipments/explore/estimate', AuthMiddleware.authorizeAccess, TradeController.fetchExploreShipmentsEstimate);

module.exports = router;
