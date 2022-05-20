const TAG = 'favouriteRoute';

const express = require('express');
const router = express.Router({
  mergeParams: true
});

const FavouriteController = require('../controllers/favouriteController');

const AuthMiddleware = require('../middlewares/authMiddleware');

// Log Time
router.use(function timeLog(req, res, next) {
    //console.log('Time: ', Date.now());
    next();
});

router.get('/countries/search', AuthMiddleware.authorizeAccess, FavouriteController.fetchFavouriteCountries);

module.exports = router;