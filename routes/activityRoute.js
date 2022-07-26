const TAG = 'activityRoute';

const express = require('express');
const router = express.Router({
  mergeParams: true
});

const AuthMiddleware = require('../middlewares/authMiddleware');
const ActivityController = require('../controllers/activityController');

/* create activity data for the user */
router.post('/create', AuthMiddleware.authorizeAccess, ActivityController.createActivity);

/* fetch activity data for the account */
router.get('/account/:accountId', AuthMiddleware.authorizeAccess, ActivityController.fetchAccountActivityData);

/* fetch activity data for the user */
router.get('/user/:userId', AuthMiddleware.authorizeAccess, ActivityController.fetchUserActivityData);

module.exports = router;
