const TAG = 'taxonomyModel';

const ObjectID = require('mongodb').ObjectID;

const MongoDbHandler = require('../db/mongoDbHandler');


const findByFilters = (filters, cb) => {

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.taxonomy)
    .find(filters)
    .project({
      '_id': 1,
      'country': 1,
      'code_iso_3': 1,
      'code_iso_2': 1,
      'hs_code_digit_classification': 1,
      'flag_uri': 1,
      'trade': 1,
      'bucket': 1,
      'fields': 1,
      'bl_flag': 1,
      'points_purchase': 1,
      'dashboard':1
    })
    .toArray(function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
};

const findAll = (mode, cb) => {
  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.taxonomy)
    .find({
      'mode': mode
    })
    .project({
      '_id': 1,
      'country': 1,
      'code_iso_3': 1,
      'flag_uri': 1,
      'trade': 1,
      'bucket': 1,
      'fields': 1
    })
    .toArray(function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
};

const findByTradeType = (mode, tradeType, cb) => {
  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.taxonomy)
    .find({
      'mode': mode,
      'trade': tradeType,
    })
    .project({
      '_id': 1,
      'country': 1,
      'code_iso_3': 1,
      'flag_uri': 1,
      'trade': 1,
      'bucket': 1,
      'fields': 1
    })
    .toArray(function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
};

const findByCountryISOCode = (mode, countryISOCode, cb) => {
  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.taxonomy)
    .find({
      'mode': mode,
      $or: [{
        'code_iso_3': countryISOCode
      }, {
        'code_iso_2': countryISOCode
      }]
    })
    .project({
      '_id': 1,
      'country': 1,
      'code_iso_3': 1,
      'flag_uri': 1,
      'trade': 1,
      'bucket': 1,
      'fields': 1
    })
    .toArray(function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
};

module.exports = {
  findByFilters,
  findAll,
  findByTradeType,
  findByCountryISOCode
};
