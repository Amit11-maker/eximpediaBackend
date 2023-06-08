const TAG = 'orderRoute';

const express = require('express');
const router = express.Router({
  mergeParams: true
});

const OrderController = require('../controllers/orderController');

const AuthMiddleware = require('../middlewares/authMiddleware');

// Log Time
router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now());
  next();
});

//Command Segregation
router.post('/', AuthMiddleware.authorizeAccess, OrderController.create);

// Query Segregation


module.exports = router;
