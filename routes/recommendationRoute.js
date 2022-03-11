const TAG = 'recommendationRoute';

const express = require('express');
const router = express.Router({
  mergeParams: true
});

const RecommendationController = require('../controllers/recommendationController');

const AuthMiddleware = require('../middlewares/authMiddleware');

// Log Time
router.use(function timeLog(req, res, next) {
  //console.log('Time: ', Date.now());
  next();
});

//Command Segregation
router.post('/', AuthMiddleware.authorizeAccess, RecommendationController.addRecommendation);
router.put('/update', AuthMiddleware.authorizeAccess, RecommendationController.updateRecommendation);
router.get('/list', AuthMiddleware.authorizeAccess, RecommendationController.fetchRecommendationList);
router.get('/shipmentlist', AuthMiddleware.authorizeAccess, RecommendationController.fetchShipmentList);
router.post('/shipment', AuthMiddleware.authorizeAccess, RecommendationController.addShipmentRecommendation);
router.put('/updateshipment', AuthMiddleware.authorizeAccess, RecommendationController.updateShipmentRecommendation);



module.exports = router;
