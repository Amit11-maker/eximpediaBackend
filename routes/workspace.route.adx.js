const TAG = 'workspaceRoute';

const express = require('express');
const router = express.Router({
    mergeParams: true
});

const AuthMiddleware = require('../middlewares/authMiddleware');
const workspaceControllerADX = require('../controllers/workspace.controller.adx');
const WorkspaceController = require('../controllers/workspaceController');



// Log Time
router.use(function timeLog(req, res, next) {
    //console.log('Time: ', Date.now());
    next();
});

/** Create workspace using ADX */
router.post('/records', AuthMiddleware.authorizeAccess, workspaceControllerADX.createWorkspaceADX);



router.post('/', AuthMiddleware.authorizeAccess, WorkspaceController.create);
router.put('/:workspaceId', AuthMiddleware.authorizeAccess, WorkspaceController.updateRecordMetrics);

router.post('/shipments/analytics/records', AuthMiddleware.authorizeAccess, WorkspaceController.fetchAnalyticsShipmentsRecords);
router.post('/shipments/analytics/records/filter', AuthMiddleware.authorizeAccess, WorkspaceController.fetchAnalyticsShipmentsFilters);// Aliased GET
router.post('/shipments/analytics/statistics', AuthMiddleware.authorizeAccess, WorkspaceController.fetchAnalyticsShipmentsStatistics); // Aliased GET
router.get('/', AuthMiddleware.authorizeAccess, WorkspaceController.fetchByUser);

router.get('/list/:userId', AuthMiddleware.authorizeAccess, WorkspaceController.listWorkspace);

router.get('/:workspaceId/analytics/specifications', AuthMiddleware.authorizeAccess, WorkspaceController.fetchAnalyticsSpecification);
router.post('/shipments/analytics/traders/search', AuthMiddleware.authorizeAccess, WorkspaceController.fetchAnalyticsShipmentsTradersByPatternEngine); //fetchAnalyticsShipmentsTradersByPattern

/** same worspace name verification */
router.get('/existence/verification', AuthMiddleware.authorizeAccess, WorkspaceController.verifyWorkspaceExistence);

/** fetch template and check limit for workspace creation */
router.get('/templates', AuthMiddleware.authorizeAccess, WorkspaceController.fetchWorkspaceTemplates);

/** records approval in workspace */
router.post('/records/purchase/approval', AuthMiddleware.authorizeAccess, WorkspaceController.approveRecordsPurchaseEngine);

/** Download Workspace */
router.post('/shipments/analytics/records/file', AuthMiddleware.authorizeAccess, WorkspaceController.fetchAnalyticsShipmentRecordsFile);

/** Delete Workspace */
router.delete('/:workspaceId', AuthMiddleware.authorizeAccess, WorkspaceController.deleteWorkspace);

/** Share Workspace */
router.post('/share', AuthMiddleware.authorizeAccess, WorkspaceController.shareWorkspace);


module.exports = router;
