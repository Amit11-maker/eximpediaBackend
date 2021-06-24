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
router.get('/:accountId', AuthMiddleware.authorizeAccess, ActivityController.fetchActivities);
router.get('/:accountId/users', AuthMiddleware.authorizeAccess, ActivityController.fetchAccountUsers);
router.get('/:accountId/users/templates', AuthMiddleware.authorizeAccess, ActivityController.fetchAccountUserTemplates);

module.exports = router;
