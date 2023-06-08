const TAG = 'paymentRoute';

const express = require('express');
const router = express.Router({
  mergeParams: true
});

const PaymentController = require('../controllers/paymentController');

const AuthMiddleware = require('../middlewares/authMiddleware');

// Log Time
router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now());
  next();
});

//Command Segregation
router.post('/', AuthMiddleware.authorizeAccess, PaymentController.create);

// Query Segregation


module.exports = router;
