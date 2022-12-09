const TAG = 'userRoute';

const express = require('express');
const router = express.Router({
  mergeParams: true
});

const UserController = require('../controllers/userController');

const AuthMiddleware = require('../middlewares/authMiddleware');

// Log Time
router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now());
  next();
});


router.put('/email/verification', UserController.updateEmailVerification); // From Email Fire
router.put('/:userId/activate', AuthMiddleware.authorizeAccess, UserController.activate);
router.put('/:userId/deactivate', AuthMiddleware.authorizeAccess, UserController.deactivate);
router.get('/', AuthMiddleware.authorizeAccess, UserController.fetchUsers);
router.get('/:userId', AuthMiddleware.authorizeAccess, UserController.fetchUser);
router.get('/email/existence/verification', AuthMiddleware.authorizeAccess, UserController.verifyEmailExistence);

/** Route to create Child User */
router.post('/', AuthMiddleware.authorizeAccess, UserController.createUser);

/** Route to update Child User */
router.put('/:userId', AuthMiddleware.authorizeAccess, UserController.updateUser);

/** Route to delete Child User */
router.delete('/:userId', AuthMiddleware.authorizeAccess, UserController.removeUser);

/** Forgot passwprd route */
router.post('/sendResetPassworDetails', UserController.sendResetPassworDetails);

/** Reset password route */
router.post('/resetPassword', UserController.resetPassword);

/** Reset password route */
router.post('/verifyPassword', UserController.verifyResetPassword);

module.exports = router;
