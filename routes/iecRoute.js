const TAG = "iecRoute";

const express = require('express');
const router = express.Router({
  mergeParams: true
});

const IECController = require('../controllers/iecController');
const AuthMiddleware = require('../middlewares/authMiddleware');

// Log Time
router.use(function timeLog(req, res, next) {
    //console.log('Time: ', Date.now());
    next();
});

router.get('/search/:iecNumber' , AuthMiddleware.authorizeAccess, IECController.fetchIECDetails);

module.exports = router ;