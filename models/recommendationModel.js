const TAG = 'accountModel';

const ObjectID = require('mongodb').ObjectID;

const MongoDbHandler = require('../db/mongoDbHandler');


const add = (data, cb) => {

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.isFavorite).insertOne(data, function (err, result) {
    if (err) {
      cb(err);
    } else {
      cb(null, result);
    }
  });
};


const update = (data, cb) => {
  let filterClause = {
    country: data.country,
    tradeType: data.tradeType,
    user_id: data.user_id,
    _id: data._id

  };

  if (data.isFavorite === true) {
    data.isFavorite = false;
  } else {
    data.isFavorite = true;
  }

  let updateClause = {
    $set: {}
  };
  if (data != null) {
    updateClause.$set = data;
  }

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.isFavorite)
    .updateOne(filterClause, updateClause,
      function (err, result) {
        if (err) {
          cb(err);
        } else {
          cb(null, result.modifiedCount);
        }
      });
};



const find = (data, cb) => {

  let filterClause = {
    country: data.country,
    columnValue: data.columnValue,
    tradeType: data.tradeType,
    user_id: ObjectID(data.user_id),
    _id: ObjectID(data._id)

  };

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.isFavorite)
    .find(filterClause)
    .project({
      '_id': 1,
      'isFavorite': 1,
      'country': 1,
      'tradeType': 1,
    })
    .toArray(function (err, results) {
      if (err) {
        cb(err);
      } else {
        cb(null, results);
      }
    });

};



// const findList = (data, cb) => {

//   let filterClause = {
//     user_id: data.user_id,
//     account_id: data.account_id
//   };

//   if (data.tradeType) {
//     filterClause.tradeType = data.tradeType
//   }

//   MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.isFavorite)
//     .find(filterClause)
//     .sort({ isFavorite: -1 })
//     .toArray(function (err, results) {
//       if (err) {
//         cb(err);
//       } else {
//         cb(null, results);
//       }
//     });

// };


const findUserModel = (cb) => {

  MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.user)
    .find({})
    .toArray(function (err, results) {
      if (err) {
        cb(err);
      } else {
        cb(null, results);
      }
    });
};


const fetchbyUser = async () => {
  try {
    let aggregationExpression = [{
      $lookup: {
        from: 'favorite',
        localField: '_id',
        foreignField: 'user_id',
        as: 'rec'
      }
    },
    {
      $project: {
        email_id: 1,
        first_name:1,
        last_name:1,
        rec: 1
      }
    }];

    const result = await MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.user)
      .aggregate(aggregationExpression, {
        allowDiskUse: true
      })

    const output = await result.toArray();
    return output
  } catch (err) {
    throw err
  };
};
//,
//   function (err, cursor) {
//     if (err) {
//       throw err; //cb(err);
//     } else {
//       cursor.toArray(function (err, documents) {
//         if (err) {
//           cb(err);
//         } else {
//           cb(null, documents);
//         }
//});
//}
// }


//};



const findEndDateCDR = async (data) => {
  try {
    let filterClause = {

      country: data.country,
      trade_type: data.trade_type

    };

    const result = await MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.country_date_range)
      .find(filterClause)
      .project({

        '_id': 1,
        'end_date': 1

      });
    const output = await result.toArray();
    return output

  } catch (err) {
    throw err
  }
};


const findEndDateEmail = async (data) => {
  try {
    let filterClause = {

      user_id: data.user_id,
      favorite_id: data.favorite_id

    };

    const result = await MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.recommendationEmail)
      .find(filterClause)
      .project({

        '_id': 1,
        'end_date': { $dateToString: { format: "%Y-%m-%d", date: "$end_date" } }

      })
      .sort({ createdAt: -1 })
    const output = await result.toArray();

    return output

  } catch (err) {
    throw err
  }
};

// if (data.country && data.tradeType) {

//   filterClause.country = data.country
//   filterClause.tradeType = data.tradeType
// }

module.exports = {
  add,
  update,
  find,
  findList,
  findUserModel,
  fetchbyUser,
  findEndDateCDR,
  findEndDateEmail
}