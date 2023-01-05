const TAG = 'dashboardRoute';

const express = require('express');
const DashboardController = require('../controllers/dashboardController');
const AuthMiddleware = require('../middlewares/authMiddleware');
const router = express.Router({
  mergeParams: true
});

// Log Time
router.use(function timeLog(req, res, next) {
  //console.log('Time: ', Date.now());
  next();
});

// router.get('/', (req, res) => {
//   res.sendFile('index.html', {
//     root: './views'
//   })
// });


router.get('/consumers', AuthMiddleware.authorizeAccess, DashboardController.fetchConsumersDashboardDetails);
router.get('/providers', AuthMiddleware.authorizeAccess, DashboardController.fetchProvidersDashboardDetails);


// router.get('/ledger/files', (req, res) => res.sendFile('data-file-ledger.html', {
//   root: './views'
// }));
// router.get('/data/manager', (req, res) => res.sendFile('data-file-uploads.html', {
//   root: './views'
// }));
// router.get('/explore/countries', (req, res) => res.sendFile('explore-trade-countries.html', {
//   root: './views'
// }));
// router.get('/explore/shipments', (req, res) => res.sendFile('explore-trade-shipments.html', {
//   root: './views'
// }));
// router.get('/workspace/manager', (req, res) => res.sendFile('manage-workspace.html', {
//   root: './views'
// }));
// router.get('/workspace/analyze', (req, res) => res.sendFile('analyze-workspace.html', {
//   root: './views'
// }));

module.exports = router;
