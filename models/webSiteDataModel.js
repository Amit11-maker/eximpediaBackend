const TAG = 'tradeModel';

const ObjectID = require('mongodb').ObjectID;

const MongoDbHandler = require('../db/mongoDbHandler');
const ElasticsearchDbHandler = require('../db/elasticsearchDbHandler');
const WebSiteDataSchema = require('../schemas/webSiteDataSchema');

const findCountryDetailsModel = async (dataBucket, payload, cb) => {
  payload.size = 0
  let query = WebSiteDataSchema.formulateCountryGraph(payload)
  try {
    var result = await ElasticsearchDbHandler.dbClient.search({
      index: dataBucket,
      track_total_hits: true,
      body: query
    });
    let output = {};
    output.data = result.body.hits.hits;
    output.aggregations = result.body.aggregations;
    cb(null, output);
  } catch (error) {
    // console.log(JSON.stringify(error));
    cb(error, null)
  }

};


const findPortDetailsModel = async (dataBucket, payload, cb) => {
  payload.size = 0
  let query = WebSiteDataSchema.formulatePortGraph(payload);
  try {

    var result = await ElasticsearchDbHandler.dbClient.search({
      index: dataBucket,
      track_total_hits: true,
      body: query
    });
    let output = {};
    output.data = result.body.hits.hits;
    output.aggregations = result.body.aggregations;
    cb(null, output);
  } catch (error) {
    // console.log(JSON.stringify(error));
    cb(error, null)
  }

};

const findCompanyDetailsModel = async (dataBucket, payload, cb) => {
  payload.size = 10
  let query = WebSiteDataSchema.formulateCompanyGraph(payload);
  // // console.log(JSON.stringify(query))
  try {
    var result = await ElasticsearchDbHandler.dbClient.search({
      index: dataBucket,
      track_total_hits: true,
      body: query
    });
    let output = {};
    output.data = result.body.hits.hits;
    output.aggregations = result.body.aggregations;
    cb(null, output);
  } catch (error) {
    // console.log(JSON.stringify(error));
    cb(error, null)
  }

};

const addContactDetailsModel = (payload, cb) => {
  var firstName = payload.firstName != undefined ? payload.firstName : null
  var lastName = payload.lastName != undefined ? payload.lastName : null
  var emailId = payload.emailId != undefined ? payload.emailId : null
  var message = payload.message != undefined ? payload.message : null
  var contactDetails = {firstName,lastName, emailId, message}

  MongoDbHandler.getDbInstance().collection(
    MongoDbHandler.collections.websiteContactUs)
    .insertOne(contactDetails, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });

};


module.exports = {
  findCountryDetailsModel,
  findPortDetailsModel,
  findCompanyDetailsModel,
  addContactDetailsModel
};
