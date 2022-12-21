const TAG = "accountModel";

const ObjectID = require("mongodb").ObjectID;
const { logger } = require('../config/logger');
const MongoDbHandler = require("../db/mongoDbHandler");
const ElasticsearchDbHandler = require("../db/elasticsearchDbHandler");
const accountLimitsCollection = MongoDbHandler.collections.account_limits;
const RecordSearchHelper = require("../helpers/recordSearchHelper");

const createCompanyRecommendation = (data, cb) => {
  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.isFavorite)
    .insertOne(data, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
};

const createShipmentRecommendation = (data, cb) => {
  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.favoriteShipment)
    .insertOne(data, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
};

const updateCompanyRecommendation = (data, cb) => {
  let filterClause = {
    _id: data._id,
  };

  let updateClause = {
    $set: {},
  };
  if (data != null) {
    updateClause.$set = data;
  }

  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.isFavorite)
    .updateOne(filterClause, updateClause, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result.modifiedCount);
      }
    });
};

const updateShipmentRecommendation = (data, cb) => {
  let filterClause = {
    _id: data._id,
  };
  let updateClause = {
    $set: {},
  };

  if (data != null) {
    updateClause.$set = data;
  }

  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.favoriteShipment)
    .updateOne(filterClause, updateClause, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result.modifiedCount);
      }
    });
};

const addRecommendationEmail = async (data) => {
  try {
    const result = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.recommendationEmail)
      .insertOne(data)
    return result
  } catch (e) {
    throw e
  }

};

const updateRecommendationEmail = async (data) => {
  let filterClause = {
    favorite_id: data.favorite_id,
  };

  let updateClause = {
    $set: {},
  };
  updateClause.$set.endDate = data.endDate;
  updateClause.$set.updatedAt = data.updatedAt;

  // console.log(filterClause);
  try {
    const result = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.recommendationEmail)
      .updateOne(filterClause, updateClause);

    return result
  } catch (e) {
    throw e
  }
};

const findShipment = (data, cb) => {
  let filterClause = {
    _id: data._id,
  };

  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.favoriteShipment)
    .find(filterClause)
    .project({
      _id: 1,
      isFavorite: 1,
      country: 1,
      tradeType: 1,
    })
    .toArray(function (err, results) {
      if (err) {
        cb(err);
      } else {
        cb(null, results);
      }
    });
};

const countShipment = (data, cb) => {
  let filterClause = {
    account_id: data.account_id,
    user_id: data.user_id,
    isFavorite: true,
  };

  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.favoriteShipment)
    .countDocuments(filterClause, function (err, results) {
      if (err) {
        cb(err);
      } else {
        cb(null, results);
      }
    });
};

const findCompany = (data, cb) => {
  let filterClause = {
    _id: data._id,
  };

  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.isFavorite)
    .find(filterClause)
    .project({
      _id: 1,
      isFavorite: 1,
      country: 1,
      tradeType: 1,
    })
    .toArray(function (err, results) {
      if (err) {
        cb(err);
      } else {
        cb(null, results);
      }
    });
};

const countCompany = (data, cb) => {
  let filterClause = {
    account_id: data.account_id,
    user_id: data.user_id,
    isFavorite: true,
  };

  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.isFavorite)
    .countDocuments(filterClause, function (err, results) {
      if (err) {
        cb(err);
      } else {
        cb(null, results);
      }
    });
};

const findCompanyRecommendationList = async (data, offset, limit) => {
  try {
    let filterClause = {
      user_id: data.user_id,
      account_id: data.account_id,
    };

    if (data.tradeType) {
      filterClause.tradeType = data.tradeType;
    }
    if (data.country) {
      filterClause.country = data.country;
    }

    const results = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.isFavorite)
      .find(filterClause)
      .sort({ isFavorite: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .toArray();

    return results;
  } catch (e) {
    return e;
  }
}

// model function to find recommendationByValue 
const findTradeShipmentRecommendationByValueAggregationEngine = async (
  aggregationParams, dataBucket , cb) => {
  try {
    let payload = {}
    payload.aggregationParams = aggregationParams;
    payload.dataBucket = dataBucket;

    let data = await RecordSearchHelper.getRecommendationDataByValue(payload);
    cb(null, data);
  } catch (error) {
    logger.error(` TRADE MODEL ============================ ${JSON.stringify(error)}`)
    cb(error);
  }
}

const findShipmentRecommendationList = async (data, offset, limit, cb) => {
  let filterClause = {
    user_id: data.user_id,
    account_id: data.account_id,
  };

  if (data.tradeType) {
    filterClause.tradeType = data.tradeType;
  }
  if (data.country) {
    filterClause.country = data.country;
  }

  try {
    const results = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.favoriteShipment)
      .find(filterClause)
      .sort({ isFavorite: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .toArray();

    cb(null, results);
  } catch (e) {
    cb(e);
  }
};

const fetchbyUser = async () => {
  let aggregationExpression = [
    {
      $lookup: {
        from: "favorite",
        localField: "_id",
        foreignField: "user_id",
        as: "rec",
      },
    },
    {
      $project: {
        email_id: 1,
        first_name: 1,
        last_name: 1,
        rec: 1,
      },
    },
  ];
  try {
    const result = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.user)
      .aggregate(aggregationExpression, {
        allowDiskUse: true,
      })
      .toArray();

    return result;

  } catch (err) {
    throw err;
  }
};

const findCountryDateRangeEndDate = async (data) => {
  try {
    let filterClause = {
      taxonomy_id: data.taxonomy_id,
    };

    const result = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.country_date_range)
      .find(filterClause)
      .project({
        _id: 1,
        end_date: 1,
      })
      .toArray();;

    return result;
  } catch (err) {
    throw err;
  }
};

const findRecommendationEmailEndDate = async (data) => {
  try {
    let filterClause = {
      user_id: data.user_id,
      favorite_id: data.favorite_id,
    };

    const result = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.recommendationEmail)
      .find(filterClause)
      .project({
        _id: 1,
        endDate: 1,
      })
      .sort({ createdAt: -1 })
      .toArray();

    return result;
  } catch (err) {
    throw err;
  }
};

const esCount = async (esData) => {
  let query = {
    query: {
      bool: {
        must: [],
      },
    },
  };

  var matchExpression = {
    match: {},
  };

  matchExpression.match[esData.columnName] = esData.columnValue;

  var rangeQuery = {
    range: {},
  };
  rangeQuery.range[esData.dateField] = {
    gte: esData.gte,
    lte: esData.lte,
  };

  query.query.bool.must.push({ ...matchExpression });
  query.query.bool.must.push({ ...rangeQuery });

  try {
    let resultCount = await ElasticsearchDbHandler.dbClient.count({
      index: esData.indexName,
      body: query,
    });
    return resultCount;
  } catch (err) {

    throw err;
  }
};

const esListCount = async (esData) => {
  let query = {
    query: {
      bool: {
        must: [],
      },
    },
  };

  var matchExpression = {
    match: {},
  };

  matchExpression.match[esData.columnName] = esData.columnValue;
  query.query.bool.must.push({ ...matchExpression });

  try {
    let resultCount = await ElasticsearchDbHandler.dbClient.count({
      index: esData.indexName,
      body: query,
    });
    if (resultCount.body.count) {
      return resultCount.body.count;
    }
  } catch (err) {
    return err;
  }
}

async function getFavoriteCompanyLimits (accountId) {

  const aggregationExpression = [
    {
      '$match': {
        'account_id': ObjectID(accountId),
        'favorite_company_limit': {
          '$exists': true
        }
      }
    },
    {
      '$project': {
        'favorite_company_limit': 1,
        '_id': 0
      }
    }
  ]

  try {
    let limitDetails = await MongoDbHandler.getDbInstance()
      .collection(accountLimitsCollection)
      .aggregate(aggregationExpression).toArray();

    return limitDetails[0];
  } catch (error) {
    throw error;
  }
}

async function updateFavoriteCompanyLimits (accountId, updatedFavoriteCompanyLimits) {

  const matchClause = {
    'account_id': ObjectID(accountId),
    'favorite_company_limit': {
      '$exists': true
    }
  }

  const updateClause = {
    $set: updatedFavoriteCompanyLimits
  }

  try {
    let limitUpdationDetails = await MongoDbHandler.getDbInstance()
      .collection(accountLimitsCollection)
      .updateOne(matchClause, updateClause);

    return limitUpdationDetails;
  } catch (error) {
    throw error;
  }
}

async function getFavoriteShipmentLimits (accountId) {

  const aggregationExpression = [
    {
      '$match': {
        'account_id': ObjectID(accountId),
        'favorite_shipment_limit': {
          '$exists': true
        }
      }
    },
    {
      '$project': {
        'favorite_shipment_limit': 1,
        '_id': 0
      }
    }
  ]

  try {
    let limitDetails = await MongoDbHandler.getDbInstance()
      .collection(accountLimitsCollection)
      .aggregate(aggregationExpression).toArray();

    return limitDetails[0];
  } catch (error) {
    throw error;
  }
}

async function updateFavoriteShipmentLimits (accountId, updatedFavoriteShipmentLimits) {

  const matchClause = {
    'account_id': ObjectID(accountId),
    'favorite_shipment_limit': {
      '$exists': true
    }
  }

  const updateClause = {
    $set: updatedFavoriteShipmentLimits
  }

  try {
    let limitUpdationDetails = await MongoDbHandler.getDbInstance()
      .collection(accountLimitsCollection)
      .updateOne(matchClause, updateClause);

    return limitUpdationDetails;
  } catch (error) {
    throw error;
  }
}

const fetchSearchRecommendation = async (payload) => {
  var searchedItemList = []
  for (let conditions of payload.matchExpressions) {
    console.log(conditions)
    // searchedItemList.push()
    output = ""
    if (conditions.hasOwnProperty("fieldValue")) {
      if ("HS_CODE" == conditions["fieldTerm"]) {
        if (Array.isArray(conditions["fieldValue"])) {
          for (let i of conditions["fieldValue"]) {
            if (i.length > 4) {
              searchedItemList.push(
                conditions["fieldTerm"] + "##$$##" + i.toString().slice(0, 4))
            }
          }
        }
        else {
          output = conditions["fieldTerm"] + "##$$##" + conditions["fieldValue"].toString().slice(0, 4)
          searchedItemList.push(output)
        }
      }
      else if (!conditions["fieldTerm"].toLowerCase().includes('date')) {
        if (Array.isArray(conditions["fieldValue"])) {
          for (let i of conditions["fieldValue"]) {
            searchedItemList.push(conditions["fieldTerm"] + "##$$##" + i)
          }
        }
        else {
          output = conditions["fieldTerm"] + "##$$##" + conditions["fieldValue"]
          searchedItemList.push(output)
        }
      }
    }
    else {
      try {
        if (Array.isArray(conditions["fieldValueLeft"])) {
          for (let i of conditions["fieldValueLeft"]) {
            searchedItemList.push(conditions["fieldTerm"] + "##$$##" + i)
          }
        }
        else {
          output = conditions["fieldTerm"] + "##$$##" + conditions["fieldValueLeft"]
          searchedItemList.push(output)
        }
      }
      catch (err) {
        console.log(err)
      }
    }
  }

  const aggregationExpression = [
    {
      '$match': {
        'country': payload.country.toLowerCase(),
        "trade_type": payload.tradeType.toLowerCase()
      }
    }, {
      '$project': {
        'recommedation_patterns': {
          '$objectToArray': '$recommedation_patterns'
        },
        'country': 1,
        'trade_type': 1
      }
    },
    {
      '$unwind': '$recommedation_patterns'
    },
    {
      '$project': {
        'country': 1,
        'trade_type': 1,
        'recommedation_patterns_size': {
          '$size': '$recommedation_patterns.v'
        },
        'recommedation_patterns': 1
      }
    },
    {
      '$match': {
        'recommedation_patterns_size': {
          '$gt': 0
        }
      }
    },
    {
      '$match': {
        'recommedation_patterns.k': {
          '$in': [
            ...searchedItemList
          ]
        }
      }
    }
  ]

  try {
    let limitDetails = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.search_recommendations)
      .aggregate(aggregationExpression).toArray();
    return [limitDetails, searchedItemList];
  } catch (error) {
    throw error;
  }
};
module.exports = {
  createCompanyRecommendation,
  updateCompanyRecommendation,
  createShipmentRecommendation,
  updateShipmentRecommendation,
  findShipmentRecommendationList,
  findCompanyRecommendationList,
  findCompany,
  findShipment,
  countCompany,
  countShipment,
  esCount,
  esListCount,
  addRecommendationEmail,
  updateRecommendationEmail,
  fetchbyUser,
  findCountryDateRangeEndDate,
  findRecommendationEmailEndDate,
  getFavoriteCompanyLimits,
  updateFavoriteCompanyLimits,
  getFavoriteShipmentLimits,
  updateFavoriteShipmentLimits,
  fetchSearchRecommendation,
  findTradeShipmentRecommendationByValueAggregationEngine
}
