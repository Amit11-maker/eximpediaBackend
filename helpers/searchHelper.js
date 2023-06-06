const ElasticsearchDbHandler = require("../db/elasticsearchDbHandler");
const MongoDbHandler = require("../db/mongoDbHandler");
const { logger } = require("../config/logger");
const searchEngine = async (payload) => {
  // if (payload.searchField === "HS_CODE") {
  //   let searchTerm = payload.searchTerm;
  //   let rangeExpression = {};
  //   if (payload.searchTerm.length < 4) {
  //     rangeExpression = {
  //       $expr: { $lte: [{ $strLenCP: "$hs_code" }, 4] },
  //     };
  //   } else if (
  //     payload.searchTerm.length < 6 &&
  //     payload.searchTerm.length >= 4
  //   ) {
  //     rangeExpression = {
  //       $expr: {
  //         $and: [
  //           { $gte: [{ $strLenCP: "$hs_code" }, 4] },
  //           { $lte: [{ $strLenCP: "$hs_code" }, 6] },
  //         ],
  //       },
  //     };
  //   } else {
  //     rangeExpression = {
  //       $expr: {
  //         $gte: [
  //           { $strLenCP: "$hs_code" },
  //           payload.hs_code_digit_classification,
  //         ],
  //       },
  //     };
  //   }

  //   try {
  //     const hs_code_with_description = await MongoDbHandler.getDbInstance()
  //       .collection(MongoDbHandler.collections.hs_code_description_mapping)
  //       .find({ hs_code: { $regex: `^${searchTerm}` }, ...rangeExpression })
  //       .project({
  //         description: 1,
  //         hs_code: 1,
  //         _id: 0,
  //       })
  //       .project({
  //         _id: "$hs_code",
  //         description: 1,
  //       })
  //       .sort({ hs_code: 1 })
  //       .limit(5)
  //       .toArray();

  //     return hs_code_with_description ? hs_code_with_description : null;
  //   } catch (error) {
  //     return { message: "Internal server error!" };
  //   }
  // }

  let aggregationExpressionFuzzy = {
    _source: [payload.searchField],
    size: 5,
    query: {
      bool: {
        must: [],
        should: [],
        filter: [],
      },
    },
    aggs: {},
  };

  let matchExpression = {
    match: {},
  };
  matchExpression.match[payload.searchField] = {
    query: payload.searchTerm,
    operator: "and",
    fuzziness: "auto",
  };
  let rangeQuery = {
    range: {},
  };
  rangeQuery.range[payload.dateField] = {
    gte: payload.startDate,
    lte: payload.endDate,
  };
  let blMatchExpressions = { match: {} };
  if (payload.blCountry) {
    blMatchExpressions.match["COUNTRY_DATA"] = payload.blCountry;
    aggregationExpressionFuzzy.query.bool.must.push({ ...blMatchExpressions });
  }

  aggregationExpressionFuzzy.query.bool.must.push({ ...matchExpression });
  aggregationExpressionFuzzy.query.bool.must.push({ ...rangeQuery });
  aggregationExpressionFuzzy.aggs["searchText"] = {
    terms: {
      field: payload.searchField + ".keyword",
      size: 5,
    },
  };

  let aggregationExpressionPrefix = {
    _source: [payload.searchField],
    size: 5,
    query: {
      bool: {
        must: [],
        should: [],
      },
    },
    aggs: {},
  };

  let matchPhraseExpression = {
    match_phrase_prefix: {},
  };
  matchPhraseExpression.match_phrase_prefix[payload.searchField] = {
    query: payload.searchTerm,
  };
  if (payload.blCountry) {
    aggregationExpressionPrefix.query.bool.must.push({ ...blMatchExpressions });
  }
  if (payload.searchTerm != 0) {
    aggregationExpressionPrefix.query.bool.must.push({
      ...matchPhraseExpression,
    });
  }
  aggregationExpressionPrefix.query.bool.must.push({ ...rangeQuery });
  aggregationExpressionPrefix.aggs["searchText"] = {
    terms: {
      field: payload.searchField + ".keyword",
      size: 5,
    },
  };
  // logger.log(tradeMeta.indexNamePrefix, JSON.stringify(aggregationExpressionFuzzy))
  // logger.log("*********************")
  logger.log(JSON.stringify(aggregationExpressionPrefix));
  // console.log(JSON.stringify(aggregationExpressionPrefix));
  try {
    let resultPrefix = ElasticsearchDbHandler.dbClient.search({
      index: payload.indexNamePrefix,
      track_total_hits: true,
      body: aggregationExpressionPrefix,
    });
    let result = await ElasticsearchDbHandler.dbClient.search({
      index: payload.indexNamePrefix,
      track_total_hits: true,
      body: aggregationExpressionFuzzy,
    });
    let output = [];
    let dataSet = [];
    if (result.body.aggregations.hasOwnProperty("searchText")) {
      if (result.body.aggregations.searchText.hasOwnProperty("buckets")) {
        for (const prop of result.body.aggregations.searchText.buckets) {
          if (!dataSet.includes(prop.key.trim())) {
            output.push({ _id: prop.key.trim() });
            dataSet.push(prop.key.trim());
          }
        }
      }
    }
    resultPrefix = await resultPrefix;
    if (await resultPrefix.body.aggregations.hasOwnProperty("searchText")) {
      if (resultPrefix.body.aggregations.searchText.hasOwnProperty("buckets")) {
        for (const prop of resultPrefix.body.aggregations.searchText.buckets) {
          if (!dataSet.includes(prop.key.trim())) {
            output.push({ _id: prop.key.trim() });
            dataSet.push(prop.key.trim());
          }
        }
      }
    }
    return output ? output : null;
  } catch (err) {
    logger.log(`SEARCHHELPER ================== ${JSON.stringify(err)}`);
    throw err;
  }
}

module.exports = {
  searchEngine,
};
