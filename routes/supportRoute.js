const TAG = 'supportRoute';

const express = require('express');
const router = express.Router({
  mergeParams: true
});

const supportController = require('../controllers/supportController');

const AuthMiddleware = require('../middlewares/authMiddleware');

// Log Time
router.use(function timeLog(req, res, next) {
  // console.log('Time: ', Date.now());
  next();
});


router.post('/raise_ticket',AuthMiddleware.authorizeAccess, supportController.raiseTicket); 


module.exports = router;
