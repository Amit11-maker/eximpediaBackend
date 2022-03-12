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
router.post('/company', AuthMiddleware.authorizeAccess, RecommendationController.createCompanyRecommendation);
router.put('/company/update', AuthMiddleware.authorizeAccess, RecommendationController.updateCompanyRecommendation);
router.get('/company/list', AuthMiddleware.authorizeAccess, RecommendationController.fetchCompanyRecommendationList);


router.post('/shipment', AuthMiddleware.authorizeAccess, RecommendationController.createShipmentRecommendation);
router.put('/shipment/update', AuthMiddleware.authorizeAccess, RecommendationController.updateShipmentRecommendation);
router.get('/shipment/list', AuthMiddleware.authorizeAccess, RecommendationController.fetchShipmentRecommendationList);




module.exports = router;
