const MongoDbHandler = require("../db/mongoDbHandler");

const post = async (data) => {
  const taxonomyResult = MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.taxonomy)
    .findOne({ country: data.country, trade: data.trade });

  const dateResult = MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.country_date_range)
    .findOne({
      country: data.country.toLowerCase(),
      trade_type: data.trade.toLowerCase(),
    });

  const [taxResult, dResult] = await Promise.all([taxonomyResult, dateResult]);

  const output = {
    website: taxResult ? taxResult.fields.website : {},
    startDate: dResult.start_date,
    endDate: dResult.end_date,
  };

  return output;
};

module.exports = { post };
