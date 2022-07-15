const TAG = 'accountRoute';

const express = require('express');
const router = express.Router({
  mergeParams: true
});

const AccountController = require('../controllers/accountController');

const AuthMiddleware = require('../middlewares/authMiddleware');

// Log Time
router.use(function timeLog(req, res, next) {
  //console.log('Time: ', Date.now());
  next();
});

//Command Segregation
router.post('/', AuthMiddleware.authorizeAccess, AccountController.create);
router.post('/registrations', AccountController.register);
router.put('/:accountId', AuthMiddleware.authorizeAccess, AccountController.update);
router.put('/:accountId/activation', AuthMiddleware.authorizeAccess, AccountController.activate);
router.delete('/:accountId/activation', AuthMiddleware.authorizeAccess, AccountController.deactivate);

// Query Segregation
router.get('/', AuthMiddleware.authorizeAccess, AccountController.fetchAccounts);
router.get('/:accountId', AuthMiddleware.authorizeAccess, AccountController.fetchAccount);
router.get('/:accountId/users', AuthMiddleware.authorizeAccess, AccountController.fetchAccountUsers);
router.get('/:accountId/users/templates', AuthMiddleware.authorizeAccess, AccountController.fetchAccountUserTemplates);
router.get('/email/existence/verification', AuthMiddleware.authorizeAccess, AccountController.verifyEmailExistence);


/* fetching customers which are created by provider panel */
router.post('/fetchCustomers', AuthMiddleware.authorizeAccess,AccountController.fetchAllCustomerAccounts);

/* fetching customers which are created by website */
router.post('/fetchWebsiteCustomers', AuthMiddleware.authorizeAccess,AccountController.fetchAllWebsiteCustomerAccounts);

/* addPlan or getPlan for the customer in provider panel */
router.get('/customer/plan/:accountId', AuthMiddleware.authorizeAccess, AccountController.addOrGetPlanForCustomersAccount);

/* getInfo for the customer in provider panel */
router.get('/customer/info/:accountId', AuthMiddleware.authorizeAccess, AccountController.getInfoForCustomerAccount);

/* delete customer from provider panel */
router.delete('/:accountId', AuthMiddleware.authorizeAccess, AccountController.removeCustomerAccount);


// need to replace this with plan and info appi 
router.get('/customer/:accountId', AuthMiddleware.authorizeAccess, AccountController.getInfoForCustomerAccount);

//Need to change to fetchCustomers Or fetchWebsiteCustomers
router.get('/customers', AuthMiddleware.authorizeAccess, AccountController.fetchAllCustomerAccounts);


module.exports = router;
