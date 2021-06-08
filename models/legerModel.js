const TAG = 'ledgerModel';

const fs = require('fs');
const CLIExecutioner = require('child_process').exec;
const ObjectID = require('mongodb').ObjectID;
const MongoDbHandler = require('../db/mongoDbHandler');
const LedgerSchema = require('../schemas/ledgerSchema');
const AWSS3Helper = require('../helpers/awsS3Helper');
const FileHelper = require('../helpers/fileHelper');

const buildFilters = (filters) => {
  let filterClause = {};
  if (filters.tradeType) filterClause.trade = filters.tradeType;
  if (filters.countryCode) {
    filterClause.$or = [{
      'code_iso_3': filters.countryCode
    }, {
      'code_iso_2': filters.countryCode
    }];
  }
  if (filters.tradeYear) filterClause.year = parseInt(filters.tradeYear);

  if (filters.isPublished) filterClause.is_published = parseInt(filters.isPublished);

  if (filters.dataStage) {
    switch (filters.dataStage) {
      case LedgerSchema.DATA_STAGE_EXAMINE: {
        filterClause['data_stages.examine.status'] = LedgerSchema.DATA_STAGE_STATUS_COMPLETED;
        break;
      }
      case LedgerSchema.DATA_STAGE_UPLOAD: {
        filterClause['data_stages.upload.status'] = LedgerSchema.DATA_STAGE_STATUS_COMPLETED;
        break;
      }
      case LedgerSchema.DATA_STAGE_INGEST: {
        filterClause['data_stages.ingest.status'] = LedgerSchema.DATA_STAGE_STATUS_COMPLETED;
        break;
      }
      case LedgerSchema.DATA_STAGE_TERMINATE: {
        filterClause['data_stages.terminate.status'] = LedgerSchema.DATA_STAGE_STATUS_COMPLETED;
        break;
      }
      default:
        break;
    }
  }
  return filterClause;
};

const findByFiltersScope = (filters, cb) => {
  let filterClause = buildFilters(filters);
  console.log(filterClause);
  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.ledger)
    .find(filterClause)
    .project({
      '_id': 1,
      'taxonomy_id': 1,
      'file': 1,
      'country': 1,
      'data_bucket': 1,
      'code_iso_3': 1,
      'code_iso_2': 1,
      'trade': 1,
      'year': 1,
      'records': 1,
      'data_stages': 1,
      'is_published': 1
    })
    .sort({
      'created_ts': 1
    })
    .toArray(function (err, results) {
      if (err) {
        cb(err);
      } else {
        cb(null, results);
      }
    });
};

const add = (file, cb) => {
  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.ledger).insertOne(file, function (err, result) {
    if (err) {
      cb(err);
    } else {
      cb(null, result);
    }
  });
};

const updateExamineStage = (stage, cb) => {
  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.ledger).updateOne({
    '_id': ObjectID(stage.file_id)
  }, {
    $set: {
      'records': stage.records,
      'records_tag': stage.records_tag,
      'data_stages.examine.status': stage.status,
      'data_stages.examine.errors': stage.errors,
      'data_stages.examine.occured_ts': stage.occured_ts,
      'modified_ts': stage.occured_ts
    }
  }, function (err, result) {
    if (err) {
      cb(err);
    } else {
      cb(null, result.modifiedCount);
    }
  });
};

const updateUploadStage = (stage, cb) => {
  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.ledger).updateOne({
    '_id': ObjectID(stage.file_id)
  }, {
    $set: {
      'data_stages.upload.status': stage.status,
      'data_stages.upload.errors': stage.errors,
      'data_stages.upload.occured_ts': stage.occured_ts,
      'modified_ts': stage.occured_ts
    }
  }, function (err, result) {
    if (err) {
      cb(err);
    } else {
      cb(null, result.modifiedCount);
    }
  });
};

const updateIngestStage = (stage, cb) => {
  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.ledger).updateOne({
    '_id': ObjectID(stage.file_id)
  }, {
    $set: {
      'data_stages.ingest.status': stage.status,
      'data_stages.ingest.errors': stage.errors,
      'data_stages.ingest.occured_ts': stage.occured_ts,
      'modified_ts': stage.occured_ts
    }
  }, function (err, result) {
    if (err) {
      cb(err);
    } else {
      cb(null, result.modifiedCount);
    }
  });
};

const updateTerminateStage = (stage, cb) => {
  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.ledger).updateOne({
    '_id': stage.file_id
  }, {
    $set: {
      'data_stages.terminate.status': stage.status,
      'data_stages.terminate.errors': stage.errors,
      'data_stages.terminate.occured_ts': stage.occured_ts,
      'modified_ts': stage.occured_ts
    }
  }, function (err, result) {
    if (err) {
      cb(err);
    } else {
      cb(null, result.modifiedCount);
    }
  });
};

const updatePublishMode = (fileId, mode, cb) => {
  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.ledger).updateOne({
    '_id': ObjectID(fileId)
  }, {
    $set: {
      'is_published': mode,
      'modified_ts': Date.now()
    }
  }, function (err, result) {
    if (err) {
      cb(err);
    } else {
      cb(null, result.modifiedCount);
    }
  });
};

const ingestFileRecords = (fileSpecs, cb) => {
  const fileOptions = {
    collection: fileSpecs.data_bucket,
    fileId: fileSpecs._id, //TODO: fileSpecs.file 5dbb47ee53daad32c073df72
    fileName: fileSpecs.file,
    columnTypedHeaders: fileSpecs.columnTypedHeaders
  };
  //console.log(fileOptions);
  AWSS3Helper.prepareDataFileAccess(fileOptions, (err, fileLocalAccess) => {
    if (err) {
      let s3Error = {
        type: err,
        code: err,
        message: err,
        extras: err
      };
      cb(s3Error);
    }

    fileOptions.filePath = fileLocalAccess.filePath;
    fileOptions.formattedFilePath = fileLocalAccess.formattedFilePath;

    removeFileHeaderLine(fileOptions.fileId, fileOptions.filePath, fileOptions.formattedFilePath);

    let importUtilCommand = MongoDbHandler.prepareFileImportUtil(fileOptions);
    console.time('IMPORT_INIT');
    CLIExecutioner(importUtilCommand, {
      maxBuffer: 1024 * 5000
    }, (error, stdout, stderr) => {
      const used = process.memoryUsage().heapUsed / 1024 / 1024;
      console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
      console.timeEnd('IMPORT_INIT');
      AWSS3Helper.discardLocalDataFile(fileOptions.filePath);
      AWSS3Helper.discardLocalDataFile(fileOptions.formattedFilePath);
      if (error) {
        //console.log(error, stderr);
        let rawPack = {
          error: error,
          stderr: stderr
        };
        let mongoError = {
          type: error.cmd,
          code: error.code,
          message: stderr,
          extras: rawPack
        };
        cb(mongoError);
      } else {
        cb(null, true);
      }
    });
  });
};

const removeFileHeaderLine = (fileId, filePath, formattedFilePath) => {

  //var input = fs.createReadStream('uploads/' + fileId); // read file
  var input = fs.createReadStream(filePath); // read file
  //var output = fs.createWriteStream('uploads/' + fileId + '_formatted'); // write file
  var output = fs.createWriteStream(formattedFilePath); // write file

  input // take input
    .pipe(FileHelper.RemoveFirstLine()) // pipe through line remover
    .pipe(output); // save to file

};

const findFileDataStage = (fileId, dataStage, cb) => {
  let projection = {};
  projection._id = 1;
  projection.file = 1;
  projection.data_bucket = 1;
  projection.is_published = 1;
  if (dataStage) {
    switch (dataStage) {
      case LedgerSchema.DATA_STAGE_EXAMINE: {
        projection["data_stages.examine.status"] = 1;
        projection["data_stages.examine.errors"] = 1;
        break;
      }
      case LedgerSchema.DATA_STAGE_UPLOAD: {
        projection["data_stages.upload.status"] = 1;
        projection["data_stages.upload.errors"] = 1;
        break;
      }
      case LedgerSchema.DATA_STAGE_INGEST: {
        projection["data_stages.ingest.status"] = 1;
        projection["data_stages.ingest.errors"] = 1;
        break;
      }
      case LedgerSchema.DATA_STAGE_TERMINATE: {
        projection["data_stages.terminate.status"] = 1;
        projection["data_stages.terminate.errors"] = 1;
        break;
      }
      default:
        break;
    }
  }
  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.ledger)
    .find({
      "_id": ObjectID(fileId)
    })
    .project(projection)
    .toArray(function (err, results) {
      if (err) {
        cb(err);
      } else {
        let result = (results.length > 0) ? results[0] : null;
        cb(null, result);
      }
    });
};

const findFileIngestionExistence = (files, cb) => {
  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.ledger)
    .find({
      "file": {
        "$in": files
      },
      "data_stages.examine.status": {
        "$in": [LedgerSchema.DATA_STAGE_STATUS_ONGOING, LedgerSchema.DATA_STAGE_STATUS_COMPLETED]
      },
      "data_stages.upload.status": {
        "$in": [LedgerSchema.DATA_STAGE_STATUS_ONGOING, LedgerSchema.DATA_STAGE_STATUS_COMPLETED]
      },
      "data_stages.ingest.status": {
        "$in": [LedgerSchema.DATA_STAGE_STATUS_ONGOING, LedgerSchema.DATA_STAGE_STATUS_COMPLETED]
      },
      "data_stages.terminate.status": {
        "$in": [LedgerSchema.DATA_STAGE_STATUS_PENDING, LedgerSchema.DATA_STAGE_STATUS_CODE_ONGOING]
      }
    })
    .project({
      "_id": 1,
      "file": 1
    })
    .toArray(function (err, results) {
      if (err) {
        cb(err);
      } else {
        cb(null, results);
      }
    });
};


const findByFilters = (filters, cb) => {
  let filterClause = buildFilters(filters); //filterClause
  console.log(filterClause);

  filterClause["data_stages.examine.status"] = "COMPLETED";
  filterClause["data_stages.upload.status"] = "COMPLETED";
  filterClause["data_stages.ingest.status"] = "COMPLETED";

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.ledger)
    .aggregate(
      [{
          "$match": filterClause
        },
        {
          "$sort": {
            "created_ts": -1,
          }
        },
        {
          "$facet": {
            "summary": [{
                "$group": {
                  "_id": null,
                  "taxonomy_id": {
                    $first: "$taxonomy_id"
                  },
                  "files": {
                    $sum: 1
                  },
                  "countries": {
                    $addToSet: "$country"
                  },
                  "years": {
                    $addToSet: "$year"
                  },
                  "recentRecordsAddition": {
                    $max: "$data_stages.ingest.occured_ts"
                  },
                  "totalRecords": {
                    $sum: "$records"
                  },
                  "publishedRecords": {
                    $sum: {
                      $cond: [{
                        $eq: ["$is_published", 1]
                      }, "$records", 0]
                    }
                  },
                  "unpublishedRecords": {
                    $sum: {
                      $cond: [{
                        $eq: ["$is_published", 0]
                      }, "$records", 0]
                    }
                  }
                }
              },
              {
                "$project": {
                  "_id": 0,
                  "totalFiles": "$files",
                  "totalCountries": {
                    $size: "$countries"
                  },
                  "totalYears": {
                    $size: "$years"
                  },
                  "recentRecordsAddition": 1,
                  "totalRecords": 1,
                  "publishedRecords": 1,
                  "unpublishedRecords": 1
                }
              }
            ],
            "ledger_files": [{
              "$replaceRoot": {
                newRoot: {
                  "_id": "$_id",
                  "file": "$file",
                  "country": "$country",
                  "data_bucket": "$data_bucket",
                  "trade": "$trade",
                  "year": "$year",
                  "records": "$records",
                  "is_published": "$is_published",
                  "ingested_at": {
                    "$dateToString": {
                      "format": "%d-%m-%Y",
                      "date": {
                        $toDate: "$data_stages.ingest.occured_ts"
                      }
                    }
                  }
                }
              }
            }]
          }
        }
      ], {
        allowDiskUse: true
      },
      function (err, cursor) {
        if (err) cb(err);
        cursor.toArray(function (err, results) {
          if (err) {
            cb(err);
          } else {
            cb(null, results);
          }
        });
      }
    );

};

module.exports = {
  findByFilters,
  add,
  updateExamineStage,
  updateUploadStage,
  updateIngestStage,
  updateTerminateStage,
  updatePublishMode,
  ingestFileRecords,
  findFileDataStage,
  findFileIngestionExistence
};
