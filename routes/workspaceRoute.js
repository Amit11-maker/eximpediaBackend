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
router.put('/:workspaceId',AuthMiddleware.authorizeAccess, WorkspaceController.updateRecordMetrics);

router.post('/shipments/analytics/records',AuthMiddleware.authorizeAccess, WorkspaceController.fetchAnalyticsShipmentsRecords);
router.post('/shipments/analytics/records/filter',AuthMiddleware.authorizeAccess, WorkspaceController.fetchAnalyticsShipmentsFilters);// Aliased GET
router.post('/shipments/analytics/statistics',AuthMiddleware.authorizeAccess, WorkspaceController.fetchAnalyticsShipmentsStatistics); // Aliased GET
router.get('/',AuthMiddleware.authorizeAccess, WorkspaceController.fetchByUser);

router.get('/list/:userId', AuthMiddleware.authorizeAccess, WorkspaceController.listWorkspace);
router.get('/existence/verification',AuthMiddleware.authorizeAccess, WorkspaceController.verifyWorkspaceExistence);

router.get('/:workspaceId/analytics/specifications',AuthMiddleware.authorizeAccess, WorkspaceController.fetchAnalyticsSpecification);
router.post('/shipments/analytics/traders/search',AuthMiddleware.authorizeAccess, WorkspaceController.fetchAnalyticsShipmentsTradersByPatternEngine); //fetchAnalyticsShipmentsTradersByPattern

/** fetch template and check limit for workspace creation */
router.get('/templates', AuthMiddleware.authorizeAccess, WorkspaceController.fetchWorkspaceTemplates);

/** records approval in workspace */
router.post('/records/purchase/approval',AuthMiddleware.authorizeAccess,  WorkspaceController.approveRecordsPurchaseEngine);

/** Create workspace using elastic */
router.post('/records',AuthMiddleware.authorizeAccess, WorkspaceController.createWorkspace);

/** Download Workspace */
router.post('/shipments/analytics/records/file', WorkspaceController.fetchAnalyticsShipmentRecordsFile);

/** Delete Workspace */
router.delete('/:workspaceId',AuthMiddleware.authorizeAccess, WorkspaceController.deleteWorkspace);

/** Share Workspace */
router.post('/share', AuthMiddleware.authorizeAccess, WorkspaceController.shareWorkspace);

module.exports = router;
