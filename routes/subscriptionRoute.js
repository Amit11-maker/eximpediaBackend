const TAG = 'subscriptionRoute';

const express = require('express');
const router = express.Router({
  mergeParams: true
});

const SubscriptionController = require('../controllers/subscriptionController');

const AuthMiddleware = require('../middlewares/authMiddleware');

// Log Time
router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now());
  next();
});

//Command Segregation

router.post('/', AuthMiddleware.authorizeAccess, SubscriptionController.create);
router.put('/:subscriptionId/constraints', AuthMiddleware.authorizeAccess, SubscriptionController.updateConstraints);

// Query Segregation

router.get('/', AuthMiddleware.authorizeAccess, SubscriptionController.fetchSubscriptions);
router.get('/plans/templates', AuthMiddleware.authorizeAccess, SubscriptionController.fetchSubscriptionPlanTemplates);


router.get('/web/plans/templates', SubscriptionController.fetchWebPlanTemplates);
module.exports = router;
