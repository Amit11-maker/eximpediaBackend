const TAG = 'activityRoute';

const express = require('express');
const router = express.Router({
  mergeParams: true
});

const ActivityController = require('../controllers/activityController');

const AuthMiddleware = require('../middlewares/authMiddleware');

// Log Time
router.use(function timeLog(req, res, next) {
  //console.log('Time: ', Date.now());
  next();
});

//Command Segregation
router.post('/', AuthMiddleware.authorizeAccess, ActivityController.create);

// Query Segregation

router.get('/customers', AuthMiddleware.authorizeAccess, ActivityController.fetchCustomerAccounts);
router.post('/providers/:accountId', AuthMiddleware.authorizeAccess, ActivityController.fetchProviderActivities);
router.post('/consumers/:accountId', AuthMiddleware.authorizeAccess, ActivityController.fetchConsumerActivities);

router.get('/search/:searchText', AuthMiddleware.authorizeAccess, ActivityController.searchActivity)
module.exports = router;
