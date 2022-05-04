const TAG = 'workspaceRoute';

const express = require('express');
const router = express.Router({
  mergeParams: true
});

const WorkspaceController = require('../controllers/workspaceController');

const AuthMiddleware = require('../middlewares/authMiddleware');

// Log Time
router.use(function timeLog(req, res, next) {
  //console.log('Time: ', Date.now());
  next();
});

//Command Segregation

router.post('/', WorkspaceController.create);
router.delete('/:workspaceId', WorkspaceController.remove);
router.post('/records/purchase/approval', WorkspaceController.approveRecordsPurchaseEngine); // Aliased GET //approveRecordsPurchaseEngine
router.post('/records', AuthMiddleware.authorizeAccess, WorkspaceController.addRecordsEngine); //addRecordsEngine addRecords
router.put('/:workspaceId', WorkspaceController.updateRecordMetrics);

router.post('/shipments/analytics/records', WorkspaceController.fetchAnalyticsShipmentsRecords); // Aliased GET
router.post('/shipments/analytics/statistics', WorkspaceController.fetchAnalyticsShipmentsStatistics); // Aliased GET

router.post('/shipments/analytics/records/file', WorkspaceController.fetchAnalyticsShipmentRecordsFile);
// router.get('/shipments/records/file', WorkspaceController.fetchShipmentRecordsFile);

// Query Segregation
router.get('/', WorkspaceController.fetchByUser);
router.get('/share', AuthMiddleware.authorizeAccess, WorkspaceController.shareWorkspace);
router.get('/list', AuthMiddleware.authorizeAccess, WorkspaceController.listWorkspace);
router.get('/templates', AuthMiddleware.authorizeAccess, WorkspaceController.fetchWorkspaceTemplates);
router.get('/existence/verification', WorkspaceController.verifyWorkspaceExistence);

router.get('/:workspaceId/analytics/specifications', WorkspaceController.fetchAnalyticsSpecification);
router.post('/shipments/analytics/traders/search', WorkspaceController.fetchAnalyticsShipmentsTradersByPatternEngine); //fetchAnalyticsShipmentsTradersByPattern

module.exports = router;
