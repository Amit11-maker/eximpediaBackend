const { Logger } = require("aws-cloudwatch-log");

const config = {
  logGroupName: "demo-test",
  logStreamName: "frontend",
  region: "ap-southeast-1",
  accessKeyId: "AKIA4KVGSE7EWZDEGAXZ",
  secretAccessKey: "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",
  uploadFreq: 10000, // Optional. Send logs to AWS LogStream in batches after 10 seconds intervals.
  local: false, // Optional. If set to true, the log will fall back to the standard '// console.log'.
};

exports.loggerfrontend = new Logger(config);
