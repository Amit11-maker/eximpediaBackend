const TAG = 'ledgerController';

const LedgerModel = require('../models/legerModel');
const LedgerSchema = require('../schemas/ledgerSchema');

const addFileEntry = (req, res) => {
  let payload = req.body;
  const file = LedgerSchema.buildLedger(payload);
  LedgerModel.add(file, (error, file) => {
    if (error) {
      console.log(error);
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        id: file.insertedId
      });
    }
  });
};

const updateFileExamineStage = (stage, cb) => {
  LedgerModel.updateExamineStage(stage, (error, examineStage) => {
    if (error) cb(error);
    cb(null, examineStage);
  });
};

const updateFileUploadStage = (stage, cb) => {
  LedgerModel.updateUploadStage(stage, (error, uploadStage) => {
    if (error) cb(error);
    cb(null, uploadStage);
  });
};

const updateFileIngestStage = (stage, cb) => {
  LedgerModel.updateIngestStage(stage, (error, ingestStage) => {
    if (error) cb(error);
    cb(null, ingestStage);
  });
};

const updateFileTerminateStage = (stage, cb) => {
  LedgerModel.updateTerminateStage(stage, (error, terminateStage) => {
    if (error) cb(error);
    cb(null, terminateStage);
  });
};

const updateFileDataStage = (req, res) => {
  let payload = JSON.parse(req.body.payload);
  payload.file_id = req.params.fileId;
  const dataStage = LedgerSchema.buildDataStageProcess(payload);
  switch (dataStage.stage) {
    case LedgerSchema.DATA_STAGE_EXAMINE: {
      updateFileExamineStage(dataStage, (error, examineStage) => {
        if (error) {
          res.status(500).json({
            message: 'Internal Server Error',
          });
        } else {
          res.status(200).json({
            data: examineStage
          });
        }
      });
      break;
    }
    case LedgerSchema.DATA_STAGE_UPLOAD: {
      updateFileUploadStage(dataStage, (error, uploadStage) => {
        if (error) {
          res.status(500).json({
            message: 'Internal Server Error',
          });
        } else {
          res.status(200).json({
            data: uploadStage
          });
        }
      });
      break;
    }
    case LedgerSchema.DATA_STAGE_INGEST: {
      updateFileIngestStage(dataStage, (error, ingestStage) => {
        if (error) {
          res.status(500).json({
            message: 'Internal Server Error',
          });
        } else {
          res.status(200).json({
            data: ingestStage
          });
        }
      });
      break;
    }
    case LedgerSchema.DATA_STAGE_TERMINATE: {
      updateFileTerminateStage(dataStage, (error, terminateStage) => {
        if (error) {
          res.status(500).json({
            message: 'Internal Server Error',
          });
        } else {
          res.status(200).json({
            data: terminateStage
          });
        }
      });
      break;
    }
    default: {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    }
  }
};

const ingestFileData = (req, res) => {


  let fileId = req.params.fileId;
  let payload = JSON.parse(req.body.payload);
  let columnTypedHeaders = payload.column_typed_headers;

  LedgerModel.findFileDataStage(fileId, LedgerSchema.DATA_STAGE_INGEST, (error, fileDataStage) => {
    if (error) {
      console.log(error);
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      if (fileDataStage.data_stages.ingest.status == LedgerSchema.DATA_STAGE_STATUS_ONGOING) {
        res.status(200).json({
          message: 'Pending Ingestion Ongoing',
          data: {
            ingesting: false
          }
        });
      } else if (fileDataStage.data_stages.ingest.status == LedgerSchema.DATA_STAGE_STATUS_COMPLETED) {
        res.status(200).json({
          message: 'Already Ingested',
          data: {
            ingesting: false
          }
        });
      } else if (fileDataStage.data_stages.ingest.status == LedgerSchema.DATA_STAGE_STATUS_TERMINATED) {
        res.status(200).json({
          message: 'Ingestion Not Allowed',
          data: {
            ingesting: false
          }
        });
      } else {
        let ongoingIngestPayload = {
          file_id: fileId,
          stage: {
            level: LedgerSchema.DATA_STAGE_INGEST,
            status: LedgerSchema.DATA_STAGE_STATUS_CODE_ONGOING,
            errors: []
          }
        };
        const dataStageIngestOngoing = LedgerSchema.buildDataStageProcess(ongoingIngestPayload);
        updateFileIngestStage(dataStageIngestOngoing, (error, ingestOngoingStage) => {
          if (error) {
            console.log(error);
            res.status(500).json({
              message: 'Internal Server Error',
            });
          } else {
            if (ingestOngoingStage) {
              res.status(200).json({
                message: 'Ingestion Started',
                data: {
                  ingesting: true
                }
              });
              fileDataStage.columnTypedHeaders = columnTypedHeaders;
              LedgerModel.ingestFileRecords(fileDataStage, (error, ingestFile) => {
                if (error) {
                  console.log(error);
                  let payload = {
                    file_id: fileId,
                    stage: {
                      level: LedgerSchema.DATA_STAGE_INGEST,
                      status: LedgerSchema.DATA_STAGE_STATUS_CODE_FAILED,
                      errors: [{
                        type: error.type,
                        code: error.code,
                        message: error.message,
                        extras: error.extras,
                        detect_ts: Date.now()
                      }]
                    }
                  };
                  const dataStage = LedgerSchema.buildDataStageProcess(payload);
                  updateFileIngestStage(dataStage, (error, ingestStage) => {
                    if (error) {
                      console.log(error); //TODO: Retry Stage Update
                    } else {
                      console.log(ingestStage);
                    }
                  });
                } else {
                  console.log(ingestFile);
                  let payload = {
                    file_id: fileId,
                    stage: {
                      level: LedgerSchema.DATA_STAGE_INGEST,
                      status: LedgerSchema.DATA_STAGE_STATUS_CODE_COMPLETED,
                      errors: []
                    }
                  };
                  const dataStage = LedgerSchema.buildDataStageProcess(payload);
                  updateFileIngestStage(dataStage, (error, ingestStage) => {
                    if (error) {
                      console.log(error); //TODO: Retry Stage Update
                    } else {
                      console.log(ingestStage);
                    }
                  });
                }
              });
            } else {
              res.status(200).json({
                message: 'Not Modified',
              });
            }
          }
        });
      }
    }
  });

};

const publishFileData = (req, res) => {
  let fileId = req.params.fileId;
  LedgerModel.updatePublishMode(fileId, LedgerSchema.DATA_MODE_PUBLISHED, (error, publishFile) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        data: publishFile
      });
    }
  });
};

const unPublishFileData = (req, res) => {
  let fileId = req.params.fileId;
  LedgerModel.updatePublishMode(fileId, LedgerSchema.DATA_MODE_UNPUBLISHED, (error, unPublishFile) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        data: unPublishFile
      });
    }
  });
};

const verifyFilesExistence = (req, res) => {
  let files = req.query.files.split(',');
  console.log(files);
  LedgerModel.findFileIngestionExistence(files, (error, filesExistence) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      console.log(filesExistence);
      let filesVerifiedBatch = [];
      files.forEach(file => {
        let fileEntity = {};
        fileEntity.file = file;
        let fileEntityExists = filesExistence.filter(fileExist => fileExist.file == file);
        if (fileEntityExists && fileEntityExists.length > 0) {
          fileEntity.file_id = fileEntityExists[0]._id;
          fileEntity.exists = true;
        } else {
          fileEntity.file_id = null;
          fileEntity.exists = false;
        }
        filesVerifiedBatch.push(fileEntity);
      });
      res.status(200).json({
        data: filesVerifiedBatch
      });
    }
  });
};

const fetchFilesDataStage = (req, res) => {
  let fileId = req.query.file_id;
  let dataStage = (req.query.data_stage) ? req.query.data_stage.toUpperCase().trim() : null;
  LedgerModel.findFileDataStage(fileId, dataStage, (error, fileDataStage) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      //console.log(fileDataStage);
      let fileDataStageCode = {};
      if (fileDataStage) {
        fileDataStageCode.file_id = fileDataStage._id;
        switch (dataStage) {
          case LedgerSchema.DATA_STAGE_EXAMINE: {
            fileDataStageCode.status_code = LedgerSchema.deriveDataStageStatusCode(fileDataStage.data_stages.examine.status);
            fileDataStageCode.errors = fileDataStage.data_stages.examine.errors;
            break;
          }
          case LedgerSchema.DATA_STAGE_UPLOAD: {
            fileDataStageCode.status_code = LedgerSchema.deriveDataStageStatusCode(fileDataStage.data_stages.upload.status);
            fileDataStageCode.errors = fileDataStage.data_stages.upload.errors;
            break;
          }
          case LedgerSchema.DATA_STAGE_INGEST: {
            fileDataStageCode.status_code = LedgerSchema.deriveDataStageStatusCode(fileDataStage.data_stages.ingest.status);
            fileDataStageCode.errors = fileDataStage.data_stages.ingest.errors;
            break;
          }
          case LedgerSchema.DATA_STAGE_TERMINATE: {
            fileDataStageCode.status_code = LedgerSchema.deriveDataStageStatusCode(fileDataStage.data_stages.terminate.status);
            fileDataStageCode.errors = fileDataStage.data_stages.terminate.errors;
            break;
          }
          default: {
            break;
          }
        }
      }
      res.status(200).json({
        data: fileDataStageCode
      });
    }
  });
};

const fetch = (req, res) => {
  console.log('Reached');
  let tradeType = (req.query.tradeType) ? req.query.tradeType.trim().toUpperCase() : null;
  let countryCode = (req.query.countryCode) ? req.query.countryCode.trim().toUpperCase() : null;
  let tradeYear = (req.query.tradeYear) ? req.query.tradeYear.trim().toUpperCase() : null;
  let dataStage = (req.query.dataStage) ? req.query.dataStage.trim().toUpperCase() : null;
  let isPublished = (req.query.isPublished) ? req.query.isPublished.trim().toUpperCase() : null;
  let filters = {
    tradeType: tradeType,
    countryCode: countryCode,
    tradeYear: tradeYear,
    dataStage: dataStage,
    isPublished: isPublished
  };
  console.log(filters);
  LedgerModel.findByFilters(filters, (error, ledgerFiles) => {
    if (error) {
      console.log(error);
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        data: ledgerFiles
      });
    }
  });
};

module.exports = {
  addFileEntry,
  updateFileDataStage,
  fetch,
  verifyFilesExistence,
  ingestFileData,
  fetchFilesDataStage,
  publishFileData,
  unPublishFileData,
};
