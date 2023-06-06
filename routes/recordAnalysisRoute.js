const RecordController = require('../controllers/recordAnalysisController');

const AuthMiddleware = require("../middlewares/authMiddleware");
const express = require("express");
const router = express.Router({
    mergeParams: true,
});

router.use(function timeLog(req, res, next) {
    //// console.log('Time: ', Date.now());
    next();
});

//Command Segregation
router.post('/shipments/explore/records', AuthMiddleware.authorizeAccess, RecordController.getRecordAnalysis);

module.exports = router;