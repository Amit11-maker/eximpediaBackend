const TAG = 'ledgerRoute';

const express = require('express');
const router = express.Router({
  mergeParams: true
});

const LedgerController = require('../controllers/ledgerController');

const AuthMiddleware = require('../middlewares/authMiddleware');

// Log Time
router.use(function timeLog(req, res, next) {
  //console.log('Time: ', Date.now());
  next();
});

//Command Segregation
router.post('/files', LedgerController.addFileEntry);
router.put('/files/:fileId/stage', LedgerController.updateFileDataStage);
router.put('/files/:fileId/ingest', LedgerController.ingestFileData);
router.put('/files/:fileId/publish', LedgerController.publishFileData);
router.delete('/files/:fileId/publish', LedgerController.unPublishFileData);

// Query Segregation

router.get('/files/stats', LedgerController.fetch);
router.get('/files/verify', LedgerController.verifyFilesExistence);
router.get('/files/stage', LedgerController.fetchFilesDataStage);

module.exports = router;
