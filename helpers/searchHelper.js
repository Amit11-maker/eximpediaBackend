const ElasticsearchDbHandler = require("../db/elasticsearchDbHandler");
const MongoDbHandler = require("../db/mongoDbHandler");
const { logger } = require("../config/logger");

const searchEngine = async (payload) => {
  try {
    let searchTerm = payload.searchTerm;
    let hs_code_length = payload.searchTerm.length <= 4;
    let rangeExpression = {};
    if (hs_code_length) {
      rangeExpression = {
        $lte: [{ $strLenCP: "$hs_code" }, 4],
      };
    } else {
      rangeExpression = {
        $gt: [{ $strLenCP: "$hs_code" }, 4],
      };
    }

    const hs_code_with_description = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.hs_code_description_mapping)
      .find({ hs_code: { $regex: `^${searchTerm}` }, $expr: rangeExpression })
      .project({
        description: 1,
        hs_code: 1,
        _id: 0,
      })
      .sort({ hs_code: 1 })
      .limit(5)
      .toArray();

    return hs_code_with_description ? hs_code_with_description : null;
  } catch (error) {
    logger.error(JSON.stringify(error));
    throw error;
  }
};

module.exports = {
  searchEngine,
};
