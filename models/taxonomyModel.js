const TAG = 'taxonomyModel';

const ObjectID = require('mongodb').ObjectID;

const MongoDbHandler = require('../db/mongoDbHandler');

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
  filterClause.mode = filters.mode;
  return filterClause;
};

const findByFilters = (filters, constraints, cb) => {
  let filterClause = buildFilters(filters);

  if (constraints) {
    if (constraints.allowedCountries && constraints.allowedCountries.length >= 0) {
      filterClause.code_iso_3 = {
        $in: constraints.allowedCountries
      };
    }
  }

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.taxonomy)
    .find(filterClause)
    .project({
      '_id': 1,
      'country': 1,
      'code_iso_3': 1,
      'code_iso_2': 1,
      'flag_uri': 1,
      'trade': 1,
      'bucket': 1,
      'fields': 1
    })
    .sort({
      'country': 1
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
