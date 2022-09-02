const TAG = 'elasticsearchDbHandler';

const AWS = require('aws-sdk')
const { Client } = require('@elastic/elasticsearch');
const {logger} = require("../config/logger")
AWS.config.loadFromPath('./config/aws/aws-access-config.json');

const Config = require('../config/dbConfig').dbElasticsearch;
const indices = {
  prefix_trade_bucket_import: 'eximpedia_bucket_import_'
};

// const dbClient = new Client({
//   ...createAwsElasticsearchConnector(AWS.config),
//   node: Config.connection_url
// });

const dbClient = new Client(Config);

let dBInstance = null;

const useDb = () => {
  try {
    dBInstance = dbClient;
  } catch (error) {
    logger.error('Error Accessing Database');
    // throw error;
  }
};

const intialiseDbClient = () => {
  dbClient.ping({}, (err) => {
    //assert.equal(null, err);
    // if (err) throw err;

    /*
    dbClient.search({
      index: 'eximpedia_bucket_import_ind_2019',
      body: {
        query: {
          match: {
            "PRODUCT_DESCRIPTION": {
              "query": "bearing",
              "operator": "and"
            }
          }
        }
      }
    }, (err, result) => {
      if (err) logger.error(err);
      logger.error(JSON.parse(JSON.stringify(result.body.hits)));
    });
    */

    useDb();
  });
};

const getDbInstance = () => {
  // if (!dbClient) {
    // intialiseDbClient();
  // }
  return dbClient;
};

const graceShutDb = () => { };

const prepareFileImportUtil = (fileOptions) => { };

module.exports = {
  intialiseDbClient,
  getDbInstance,
  graceShutDb,
  indices,
  dbClient,
  prepareFileImportUtil
};
