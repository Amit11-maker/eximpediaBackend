const TAG = "indiaExportConsigneeDetailsRoute";

const express = require('express');
const router = express.Router({
  mergeParams: true
});

const AuthMiddleware = require('../middlewares/authMiddleware');
const ConsigneeDetailsController = require('../controllers/indiaExportConsigneeDetailsController');

/** add customer requests */
router.get('/requests/list' , AuthMiddleware.authorizeAccess, ConsigneeDetailsController.addCustomerRequest);

/** get list of customers requests */
router.get('/requests/list' , AuthMiddleware.authorizeAccess, ConsigneeDetailsController.getRequestsList);

/** update request response */
router.get('/requests/list' , AuthMiddleware.authorizeAccess, ConsigneeDetailsController.updateRequestResponse);


module.exports = router ;