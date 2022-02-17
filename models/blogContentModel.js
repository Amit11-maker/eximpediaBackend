const MongoDbHandler = require("../db/mongoDbHandler");

const add = async (data, cb) => {
  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.blog)
    .insertOne(data, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
};

const find = (cb) => {
  let filterClause = {};

  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.blog)
    .find(filterClause)
    .toArray(function (err, results) {
      if (err) {
        cb(err);
      } else {
        cb(null, results);
      }
    });
};
module.exports = { add, find };
