const TAG = 'tradeRoute';

const express = require('express');
const router = express.Router({
  mergeParams: true
});

const WebSiteDataController = require('../controllers/webSiteDataController');

const AuthMiddleware = require('../middlewares/authMiddleware');

// Log Time
router.use(function timeLog(req, res, next) {
  //console.log('Time: ', Date.now());
  next();
});

//Command Segregation

//Exceptional Use-Case As Params Contain Large Data Payloads
router.post('/countryDetails', AuthMiddleware.authorizeAccess, WebSiteDataController.findCountryDetails);
router.post('/portDetails', AuthMiddleware.authorizeAccess, WebSiteDataController.findPortDetails);
router.post('/companyDetails', AuthMiddleware.authorizeAccess, WebSiteDataController.findCompanyDetails);

module.exports = router;
