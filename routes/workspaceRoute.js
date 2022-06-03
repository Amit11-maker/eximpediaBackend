const TAG = 'workspaceRoute';

const express = require('express');
const router = express.Router({
  mergeParams: true
});

const WorkspaceController = require('../controllers/workspaceController');

const AuthMiddleware = require('../middlewares/authMiddleware');

// Log Time
router.use(function timeLog (req, res, next) {
  //console.log('Time: ', Date.now());
  next();
});


router.post('/', AuthMiddleware.authorizeAccess,WorkspaceController.create);
router.delete('/:workspaceId',AuthMiddleware.authorizeAccess, WorkspaceController.remove);
router.post('/records/purchase/approval',AuthMiddleware.authorizeAccess,  WorkspaceController.approveRecordsPurchaseEngine); // Aliased GET //approveRecordsPurchaseEngine
router.post('/records',AuthMiddleware.authorizeAccess, WorkspaceController.addRecordsEngine); //addRecordsEngine addRecords
router.put('/:workspaceId',AuthMiddleware.authorizeAccess, WorkspaceController.updateRecordMetrics);

router.post('/shipments/analytics/records',AuthMiddleware.authorizeAccess, WorkspaceController.fetchAnalyticsShipmentsRecords); // Aliased GET
router.post('/shipments/analytics/statistics',AuthMiddleware.authorizeAccess, WorkspaceController.fetchAnalyticsShipmentsStatistics); // Aliased GET

router.post('/shipments/analytics/records/file',AuthMiddleware.authorizeAccess, WorkspaceController.fetchAnalyticsShipmentRecordsFile);

router.get('/',AuthMiddleware.authorizeAccess, WorkspaceController.fetchByUser);
router.post('/share', AuthMiddleware.authorizeAccess, WorkspaceController.shareWorkspace);
router.get('/list/:userId', AuthMiddleware.authorizeAccess, WorkspaceController.listWorkspace);
router.get('/templates', AuthMiddleware.authorizeAccess, WorkspaceController.fetchWorkspaceTemplates);
router.get('/existence/verification',AuthMiddleware.authorizeAccess, WorkspaceController.verifyWorkspaceExistence);

router.get('/:workspaceId/analytics/specifications',AuthMiddleware.authorizeAccess, WorkspaceController.fetchAnalyticsSpecification);
router.post('/shipments/analytics/traders/search',AuthMiddleware.authorizeAccess, WorkspaceController.fetchAnalyticsShipmentsTradersByPatternEngine); //fetchAnalyticsShipmentsTradersByPattern

module.exports = router;
