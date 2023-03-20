const TAG = 'tradeRoute';

const express = require('express');
const router = express.Router({
  mergeParams: true
});

const GlobalSearchController = require('../controllers/globalSearchController');

const AuthMiddleware = require('../middlewares/authMiddleware');

// Log Time
router.use(function timeLog(req, res, next) {
  //console.log('Time: ', Date.now());
  next();
});

//Command Segregation

//Exceptional Use-Case As Params Contain Large Data Payloads
router.post('/existingUser/globalsearch',AuthMiddleware.authorizeAccess, GlobalSearchController.fetchCountriesDetails);// Aliased GET
router.post('/newUser/globalsearch', GlobalSearchController.fetchCountriesDetails); // Aliased GET

module.exports = router;
