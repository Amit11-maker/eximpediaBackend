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
router.delete('/:accountId', AuthMiddleware.authorizeAccess, AccountController.remove);

// Query Segregation

router.get('/', AuthMiddleware.authorizeAccess, AccountController.fetchAccounts);
router.get('/customers', AuthMiddleware.authorizeAccess, AccountController.fetchCustomerAccounts);
router.get('/:accountId', AuthMiddleware.authorizeAccess, AccountController.fetchAccount);
router.get('/:accountId/users', AuthMiddleware.authorizeAccess, AccountController.fetchAccountUsers);
router.get('/:accountId/users/templates', AuthMiddleware.authorizeAccess, AccountController.fetchAccountUserTemplates);
router.get('/email/existence/verification', AuthMiddleware.authorizeAccess, AccountController.verifyEmailExistence);

module.exports = router;
