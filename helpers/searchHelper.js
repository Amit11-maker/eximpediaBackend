const ElasticsearchDbHandler = require("../db/elasticsearchDbHandler");
const MongoDbHandler = require("../db/mongoDbHandler");
const { logger } = require("../config/logger");

const searchEngine = async (payload) => {
  try {
    let searchTerm = payload.searchTerm;
    let rangeExpression = {};
    if (payload.searchTerm.length <= 4) {
      rangeExpression = {
        $expr: { $lte: [{ $strLenCP: "$hs_code" }, 4] },
      };
    } else if (
      payload.searchTerm.length <= 6 &&
      payload.searchTerm.length > 4
    ) {
      rangeExpression = {
        $expr: {
          $and: [
            { $gt: [{ $strLenCP: "$hs_code" }, 4] },
            { $lte: [{ $strLenCP: "$hs_code" }, 6] },
          ],
        },
      };
    } else {
      rangeExpression = {
        $expr: { $gt: [{ $strLenCP: "$hs_code" }, 6] },
      };
    }

    const hs_code_with_description = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.hs_code_description_mapping)
      .find({ hs_code: { $regex: `^${searchTerm}` }, ...rangeExpression })
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
