const TAG = "indiaExportConsigneeDetailsRoute";

const express = require('express');
const router = express.Router({
  mergeParams: true
});

const AuthMiddleware = require('../middlewares/authMiddleware');
const ConsigneeDetailsController = require('../controllers/indiaExportConsigneeDetailsController');

/** add customer requests */
router.post('/request/add' , AuthMiddleware.authorizeAccess, ConsigneeDetailsController.addCustomerRequest);

/** get list of customers requests */
router.get('/request/list' , AuthMiddleware.authorizeAccess, ConsigneeDetailsController.getRequestsList);

/** get list of customers requests */
router.get('/request/processed/list' , AuthMiddleware.authorizeAccess, ConsigneeDetailsController.getProcessedRequestsList);

/** update request response */
router.post('/request/update' , AuthMiddleware.authorizeAccess, ConsigneeDetailsController.updateRequestResponse);

/** get cosignee details for user */
router.post('/shipment/detail' , AuthMiddleware.authorizeAccess, ConsigneeDetailsController.getCosigneeDetailForUser);

/** get user requested cosignee details */
router.get('/user/shipment/request/list' , AuthMiddleware.authorizeAccess, ConsigneeDetailsController.getUserRequestedShipmentList);

module.exports = router ;