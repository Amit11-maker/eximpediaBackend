// @ts-check
const TAG = 'workspaceRoute';

const express = require('express');
const router = express.Router({
    mergeParams: true
});

const AuthMiddleware = require('../middlewares/authMiddleware');
const workspaceControllerADX = require('../controllers/workspace.controller.adx');
const workspaceControllerADX2 = require('../controllers/workspaceController');



// Log Time
router.use(function timeLog(req, res, next) {
    //console.log('Time: ', Date.now());
    next();
});

/** Create workspace using ADX */
router.post('/records', AuthMiddleware.authorizeAccess, workspaceControllerADX.createWorkspaceADX);

/** records approval in workspace */
router.post('/records/purchase/approval', AuthMiddleware.authorizeAccess, workspaceControllerADX.ApproveRecordsPurchaseADX);

/** get analytics records */
router.post('/shipments/analytics/records', AuthMiddleware.authorizeAccess, workspaceControllerADX.fetchAnalyticsShipmentsRecordsAdx);

/** get analytics summary */
router.post('/shipments/analytics/summary', AuthMiddleware.authorizeAccess, workspaceControllerADX.fetchAnalyticsShipmentsSummaryAdx);


/**get the powerbi dashboard of workspace */
router.post('/powerbi', AuthMiddleware.authorizeAccess, workspaceControllerADX.powerBiDash )

/** get analytics filters  */
router.post('/shipments/analytics/records/filter', AuthMiddleware.authorizeAccess, workspaceControllerADX.fetchAnalyticsShipmentsFiltersAdx);// Aliased GET

/** List workspace */
router.get('/list/:userId/:workspace_id?', AuthMiddleware.authorizeAccess, workspaceControllerADX.listWorkspace);
router.get('/', AuthMiddleware.authorizeAccess, workspaceControllerADX.fetchWorkspaceByUser);



router.post('/', AuthMiddleware.authorizeAccess, workspaceControllerADX.createWorkspaceADX);
router.put('/:workspaceId', AuthMiddleware.authorizeAccess, workspaceControllerADX2.updateRecordMetrics);


router.post('/shipments/analytics/statistics', AuthMiddleware.authorizeAccess, workspaceControllerADX2.fetchAnalyticsShipmentsStatistics); // Aliased GET


router.get('/:workspaceId/analytics/specifications', AuthMiddleware.authorizeAccess, workspaceControllerADX2.fetchAnalyticsSpecification);
router.post('/shipments/analytics/traders/search', AuthMiddleware.authorizeAccess, workspaceControllerADX2.fetchAnalyticsShipmentsTradersByPatternEngine); //fetchAnalyticsShipmentsTradersByPattern

/** same workspace name verification */
router.get('/existence/verification', AuthMiddleware.authorizeAccess, workspaceControllerADX2.verifyWorkspaceExistence);

/** fetch template and check limit for workspace creation */
router.get('/templates', AuthMiddleware.authorizeAccess, workspaceControllerADX2.fetchWorkspaceTemplates);

/** Download Workspace */
router.post('/shipments/analytics/records/file',AuthMiddleware.authorizeAccess, workspaceControllerADX.DownloadWorkspace);

/** Delete Workspace */
router.delete('/:workspaceId', AuthMiddleware.authorizeAccess, workspaceControllerADX2.deleteWorkspace);

/** Share Workspace */
router.post('/share', AuthMiddleware.authorizeAccess, workspaceControllerADX2.shareWorkspace);


module.exports = router;
