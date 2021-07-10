const TAG = 'elasticsearchDbHandler';

const AWS = require('aws-sdk')
const { Client } = require('@elastic/elasticsearch');
const assert = require('assert');
const createAwsElasticsearchConnector = require('aws-elasticsearch-connector')
AWS.config.loadFromPath('./config/aws/aws-access-config.json');

const Config = require('../config/dbConfig').dbElasticsearch;

const COMMAND_SEPARATOR_SPACE = ' ';

const elasticsearchImportOptions = {};

const indices = {
  prefix_trade_bucket_import: 'eximpedia_bucket_import_'
};

const dbClient = new Client({
  ...createAwsElasticsearchConnector(AWS.config),
  node: Config.connection_url
});

let dBInstance = null;

const useDb = () => {
  try {
    dBInstance = dbClient;
  } catch (error) {
    console.log('Error Accessing Database');
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
      if (err) console.log(err);
      console.log(JSON.parse(JSON.stringify(result.body.hits)));
    });
    */

    useDb();
  });
};

const getDbInstance = () => {
  if (!dbClient) {
    intialiseDbClient();
  }
  return dBInstance;
};

const graceShutDb = () => { };

const prepareFileImportUtil = (fileOptions) => { };

module.exports = {
  intialiseDbClient,
  getDbInstance,
  graceShutDb,
  indices,
  prepareFileImportUtil
};
