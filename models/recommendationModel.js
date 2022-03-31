const TAG = "accountModel";

const ObjectID = require("mongodb").ObjectID;

const MongoDbHandler = require("../db/mongoDbHandler");
const ElasticsearchDbHandler = require("../db/elasticsearchDbHandler");

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

const addRecommendationEmail = (data, cb) => {
  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.recommendationEmail)
    .insertOne(data, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
};

const updateRecommendationEmail = (data, cb) => {
  let filterClause = {
    favorite_id: data.favorite_id,
  };

  let updateClause = {
    $set: {},
  };
  updateClause.$set.endDate = data.endDate;
  updateClause.$set.updatedAt = data.updatedAt;

  // console.log(filterClause);

  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.recommendationEmail)
    .updateOne(filterClause, updateClause, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result.modifiedCount);
      }
    });
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
};

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
  try {
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

    const result = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.user)
      .aggregate(aggregationExpression, {
        allowDiskUse: true,
      })
      .toArray();

    // const output = await result
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
    console.log(err);
    return err;
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
      return resultCount;
    }
  } catch (err) {
    return err;
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
};
