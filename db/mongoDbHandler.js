const TAG = 'mongoDbHandler';

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const Config = require('../config/dbConfig').dbMongo;

const COMMAND_SEPARATOR_SPACE = ' ';

const mongoImportOptions = {
  uri: '--uri',
  db: '--db',
  collection: '--collection',
  type: '--type csv',
  fields: '--fields=',
  headerLine: '--headerline',
  columnsHaveTypes: '--columnsHaveTypes',
  ignoreBlanks: '--ignoreBlanks',
  parseGrace: '--parseGrace autoCast',
  stopOnError: '--stopOnError',
  verbose: '--verbose',
  numInsertionWorkers: '--numInsertionWorkers',
  file: '--file'
};

const collections = {
  taxonomy: 'taxonomies',
  ledger: 'ledger',
  workspace: 'workspaces',
  account: 'accounts',
  user: 'users',
  subscription: 'subscriptions',
  order: 'orders',
  payment: 'payments',
  purchased_records_keeper: 'purchased_records_keeper'
};

const dbClient = new MongoClient(Config.connection_url, {
  useUnifiedTopology: true,
  useNewUrlParser: true
});

let dBInstance = null;

const useDb = () => {
  try {
    dBInstance = dbClient.db(Config.database);
  } catch (error) {
    console.log('Error Accessing Database');
    throw error;
  }
};

const intialiseDbClient = () => {
  dbClient.connect((err) => {
    assert.equal(null, err);
    if (err) throw err;
    useDb();
  });
};

const getDbInstance = () => {
  if (!dbClient) {
    intialiseDbClient();
  }
  return dBInstance;
};

const graceShutDb = () => {
  if (dbClient) dbClient.close();
};

const prepareFileImportUtil = (fileOptions) => {
  console.log(fileOptions);

  // Remote
  let tool = Config.importTool.concat(COMMAND_SEPARATOR_SPACE,
    mongoImportOptions.uri, COMMAND_SEPARATOR_SPACE, '"' + Config.connection_uri + '"', COMMAND_SEPARATOR_SPACE,
    mongoImportOptions.collection, COMMAND_SEPARATOR_SPACE, fileOptions.collection, COMMAND_SEPARATOR_SPACE,
    mongoImportOptions.type, COMMAND_SEPARATOR_SPACE,
    mongoImportOptions.columnsHaveTypes, COMMAND_SEPARATOR_SPACE,
    mongoImportOptions.fields, '"' + fileOptions.columnTypedHeaders + '"', COMMAND_SEPARATOR_SPACE,
    mongoImportOptions.parseGrace, COMMAND_SEPARATOR_SPACE,
    mongoImportOptions.file, COMMAND_SEPARATOR_SPACE, fileOptions.formattedFilePath
  );

  // LocalHost
  /*let tool = Config.importTool.concat(COMMAND_SEPARATOR_SPACE,
    mongoImportOptions.db, COMMAND_SEPARATOR_SPACE, Config.database, COMMAND_SEPARATOR_SPACE,
    mongoImportOptions.collection, COMMAND_SEPARATOR_SPACE, fileOptions.collection, COMMAND_SEPARATOR_SPACE,
    mongoImportOptions.type, COMMAND_SEPARATOR_SPACE,
    mongoImportOptions.columnsHaveTypes, COMMAND_SEPARATOR_SPACE,
    mongoImportOptions.fields, '"' + fileOptions.columnTypedHeaders + '"', COMMAND_SEPARATOR_SPACE,
    mongoImportOptions.parseGrace, COMMAND_SEPARATOR_SPACE,
    mongoImportOptions.file, COMMAND_SEPARATOR_SPACE, fileOptions.formattedFilePath
  );*/

  //mongoImportOptions.db, COMMAND_SEPARATOR_SPACE, Config.database, COMMAND_SEPARATOR_SPACE,
  //mongoImportOptions.numInsertionWorkers, COMMAND_SEPARATOR_SPACE, 2, COMMAND_SEPARATOR_SPACE,
  //mongoImportOptions.uri, COMMAND_SEPARATOR_SPACE, Config.connection_url, COMMAND_SEPARATOR_SPACE,
  //mongoImportOptions.ignoreBlanks, COMMAND_SEPARATOR_SPACE,
  //mongoImportOptions.stopOnError, COMMAND_SEPARATOR_SPACE,
  //mongoImportOptions.parseGrace, COMMAND_SEPARATOR_SPACE,
  //mongoImportOptions.verbose, COMMAND_SEPARATOR_SPACE,

  return tool;
};

module.exports = {
  intialiseDbClient,
  getDbInstance,
  graceShutDb,
  collections,
  prepareFileImportUtil
};
