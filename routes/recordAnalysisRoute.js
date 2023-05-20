const RecordController = require('../controllers/recordAnalysisController');

// Log Time
router.use(function timeLog(req, res, next) {
    //console.log('Time: ', Date.now());
    next();
});

//Command Segregation

router.post('/shipments/explore/records', AuthMiddleware.authorizeAccess, RecordController.getRecordAnalysis);