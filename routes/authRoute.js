const TAG = 'authRoute';

const express = require('express');
const router = express.Router({
  mergeParams: true
});

const AuthController = require('../controllers/authController');

const AuthMiddleware = require('../middlewares/authMiddleware');

// Log Time
router.use(function timeLog(req, res, next) {
  //// console.log('Time: ', Date.now());

  next();
});

//Command Segregation
router.put('/login', AuthController.login);
router.put('/users/:userId/logout', AuthController.logout);
router.post('/updatePassword' , AuthController.updatePassword);
// Query Segregation
router.get('/log/password', AuthController.logPassword); // Test Simulation

module.exports = router;
