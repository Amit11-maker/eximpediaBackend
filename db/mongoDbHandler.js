const TAG = "mongoDbHandler";

const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");
const { logger } = require("../config/logger");
const Config = require("../config/dbConfig").dbMongo;
const COMMAND_SEPARATOR_SPACE = " ";

const mongoImportOptions = {
  uri: "--uri",
  db: "--db",
  collection: "--collection",
  type: "--type csv",
  fields: "--fields=",
  headerLine: "--headerline",
  columnsHaveTypes: "--columnsHaveTypes",
  ignoreBlanks: "--ignoreBlanks",
  parseGrace: "--parseGrace autoCast",
  stopOnError: "--stopOnError",
  verbose: "--verbose",
  numInsertionWorkers: "--numInsertionWorkers",
  file: "--file",
};

const collections = {
  taxonomy: "taxonomies",
  summary:"summary",
  ledger: "ledger",
  workspace: "workspaces",
  account: "accounts",
  account_limits: "account_limits",
  user: "users",
  subscription: "subscriptions",
  order: "orders",
  payment: "payments",
  purchased_records_keeper: "purchased_records_keeper",
  activity_tracker: "activity_tracker",
  country_date_range: "country_date_range",
  reset_password: "reset_password",
  explore_search_query: "explore_search_query",
  workspace_query_save: "workspace_query_save",
  general_notification_details: "general_notification_details",
  user_notification_details: "user_notification_details",
  account_notification_details: "account_notification_details",
  signup_user: "signup_users",
  blog: "blogs",
  saveQuery: "save_querys",
  websiteContactUs: "website_contact_us",
  isFavorite: "favorite",
  recommendationEmail: "recommendationEmail",
  favoriteShipment: "favoriteShipment",
  iecData: "iec",
  shipment_request_details: "india_exp_shipment_request_details",
  consignee_shipment_details: "india_exp_consignee_shipment_details",
  user_session_tracker: "user_session_tracker",
  search_recommendations: "search_recommendations",
  hs_code_description_mapping: "hs_code_description_mapping",
  explore_view_columns: "explore_view_columns",
  sortSchema: "sortSchema",
};

const mongoConnectionSetting = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  poolSize: 20,
  keepAlive: true,
  connectTimeoutMS: 2147483647,
  socketTimeoutMS: 2147483647,
  reconnectTries: 2147483647,
  reconnectInterval: 2147483647,
};
let dbClient = new MongoClient(Config.connection_url, {
  ...mongoConnectionSetting,
});

let dBInstance = null;

const useDb = () => {
  try {
    console.log(Config.connection_url);
    dBInstance = dbClient.db(Config.database);
    logger.log("connected with Mongo DB");
  } catch (error) {
    logger.log(`MONGODBHANDLER ================== ${JSON.stringify(error)}`);
    throw error;
  }
};

const intialiseDbClient = () => {
  logger.log("intialiseDbClient");
  dbClient.connect((err) => {
    assert.equal(null, err);
    if (err) {
      logger.log(`MONGODBHANDLER ================== ${JSON.stringify(err)}`);
      throw err;
    }
    useDb();
  });
};
const getDbInstance = () => {
  if (!dbClient) {
    intialiseDbClient();
  }
  try {
    if (dBInstance == null) {
      useDb();
    }
    try {
      dBInstance
        .command({ ping: 1 })
        .then((_) => {
          // logger.log("then")
        })
        .catch((err) => {
          logger.log(
            `MONGODBHANDLER ================== ${JSON.stringify(err)}`
          );
          dbClient = new MongoClient(Config.connection_url, {
            ...mongoConnectionSetting,
          });
          intialiseDbClient();
        });
    } catch (err) {
      logger.log(`MONGODBHANDLER ================== ${JSON.stringify(err)}`);
      dbClient = new MongoClient(Config.connection_url, {
        ...mongoConnectionSetting,
      });
      intialiseDbClient();
    }
  } catch (error) {
    logger.log(`MONGODBHANDLER ================== ${JSON.stringify(error)}`);
    dbClient = new MongoClient(Config.connection_url, {
      ...mongoConnectionSetting,
    });
    intialiseDbClient();
  }
  return dBInstance;
};

const graceShutDb = () => {
  if (dbClient) dbClient.close();
};

const prepareFileImportUtil = (fileOptions) => {
  // logger.log(fileOptions);

  // Remote
  let tool = Config.importTool.concat(
    COMMAND_SEPARATOR_SPACE,
    mongoImportOptions.uri,
    COMMAND_SEPARATOR_SPACE,
    '"' + Config.connection_uri + '"',
    COMMAND_SEPARATOR_SPACE,
    mongoImportOptions.collection,
    COMMAND_SEPARATOR_SPACE,
    fileOptions.collection,
    COMMAND_SEPARATOR_SPACE,
    mongoImportOptions.type,
    COMMAND_SEPARATOR_SPACE,
    mongoImportOptions.columnsHaveTypes,
    COMMAND_SEPARATOR_SPACE,
    mongoImportOptions.fields,
    '"' + fileOptions.columnTypedHeaders + '"',
    COMMAND_SEPARATOR_SPACE,
    mongoImportOptions.parseGrace,
    COMMAND_SEPARATOR_SPACE,
    mongoImportOptions.file,
    COMMAND_SEPARATOR_SPACE,
    fileOptions.formattedFilePath
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
  prepareFileImportUtil,
};
