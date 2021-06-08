const TAG = 'awsS3Helper';

const AWS = require('aws-sdk');
const UUID = require('uuid');
const FSHandler = require('fs');

const S3Config = require('../config/aws/s3Config');
AWS.config.loadFromPath('./config/aws/aws-access-config.json');

const PATH_SEPARATOR_SLASH = '/';
const TERM_SUFFIX_FORMATTED = '_formatted';

const prepareDataFileAccess = (fileSpecs, cb) => {
  const s3 = new AWS.S3();
  const params = {
    Bucket: S3Config.s3BucketSpecs.bucket,
    Key: S3Config.s3BucketSpecs.keyPath.concat(PATH_SEPARATOR_SLASH, 'release', PATH_SEPARATOR_SLASH, fileSpecs.fileId) // release // stage
  };
  s3.getObject(params, function (err, data) {
    if (err) {
      cb(err);
    } else {
      let fileAccess = {};
      if (data.Metadata) {
        if (data.Metadata.type) fileAccess.trade = data.Metadata.type;
        if (data.Metadata.country) fileAccess.country = data.Metadata.country;
        if (data.Metadata.year) fileAccess.year = data.Metadata.year;
        if (data.Metadata.filereference) fileAccess.fileName = data.Metadata.filereference;
      }
      let objectData = data.Body.toString();
      let filePath = './'.concat(S3Config.s3BucketSpecs.localDiskAlias, PATH_SEPARATOR_SLASH, fileSpecs.fileId);
      let formattedFilePath = './'.concat(S3Config.s3BucketSpecs.localDiskAlias, PATH_SEPARATOR_SLASH, fileSpecs.fileId, TERM_SUFFIX_FORMATTED);
      fileAccess.filePath = filePath;
      fileAccess.formattedFilePath = formattedFilePath;
      FSHandler.writeFile(filePath, objectData, function (err) {
        if (err) {
          cb(err);
        }
        cb(null, fileAccess);
      });
    }
  });

};

const discardLocalDataFile = (filePath) => {
  FSHandler.unlinkSync(filePath);
};

module.exports = {
  prepareDataFileAccess,
  discardLocalDataFile
};
