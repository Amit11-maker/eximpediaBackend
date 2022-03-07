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



module.exports = router;
