const TAG = 's3Config';
const dotenv = require("dotenv").config();
const AWS = require('aws-sdk');
const EXPIRATION_FOR_UNSIGNED_URL_IN_SEC = 31536000  // 1 year
const s3BucketSpecs = {
  bucket: 'seair-exim-workload-test',
  keyPath: 'raw-data',
  localDiskAlias: 'uploads'
}

const s3ConnectionConfig = new AWS.S3({
  accessKeyId: "AKIA4KVGSE7EWZDEGAXZ",
  secretAccessKey: "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"
});

module.exports = {
  s3BucketSpecs,
  s3ConnectionConfig,
  EXPIRATION_FOR_UNSIGNED_URL_IN_SEC
}
