const TAG = 'activityRoute';

const express = require('express');
const router = express.Router({
  mergeParams: true
});

const NotificationController = require('../controllers/notificationController');

const AuthMiddleware = require('../middlewares/authMiddleware');

// Log Time
router.use(function timeLog(req, res, next) {
  //console.log('Time: ', Date.now());
  next();
});

//Command Segregation
router.post('/', AuthMiddleware.authorizeAccess, NotificationController.create);

// Query Segregation

router.get('/', AuthMiddleware.authorizeAccess, NotificationController.fetchNotification);

module.exports = router;
