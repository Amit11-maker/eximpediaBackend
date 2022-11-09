const ElasticsearchDbHandler = require("../db/elasticsearchDbHandler");
const { logger } = require("../config/logger")
const searchEngine = async (payload) => {
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
      size: 5
    },
  };

  let aggregationExpressionPrefix = {
    _source: [payload.searchField],
    size: 5,
    query: {
      bool: {
        must: [],
        should: []
      },
    },
    aggs: {},
  };

  if (payload.searchField === 'HS_CODE') {
    if (payload.searchTerm[0] == 0) {
      payload.searchTerm = payload.searchTerm.slice(1)
      aggregationExpressionPrefix.query.bool.filter = {
        "script": {
          "script": {
            "lang": "painless",
            "source": `doc['HS_CODE.keyword'].value.length() < ${payload.hs_code_digit_classification}`
          }
        }
      }
    } else {
      aggregationExpressionPrefix.query.bool.filter = {
        "script": {
          "script": {
            "lang": "painless",
            "source": `doc['HS_CODE.keyword'].value.length() >= ${payload.hs_code_digit_classification}`
          }
        }
      }
    }
  }

  let matchPhraseExpression = {
    match_phrase_prefix: {},
  };
  matchPhraseExpression.match_phrase_prefix[payload.searchField] = { query: payload.searchTerm };
  if (payload.blCountry) {
    aggregationExpressionPrefix.query.bool.must.push({ ...blMatchExpressions });
  }
  if (payload.searchTerm != 0) {
    aggregationExpressionPrefix.query.bool.must.push({ ...matchPhraseExpression, });
  }
  aggregationExpressionPrefix.query.bool.must.push({ ...rangeQuery });
  aggregationExpressionPrefix.aggs["searchText"] = {
    terms: {
      field: payload.searchField + ".keyword",
      size: 5
    },
  };
  // logger.info(tradeMeta.indexNamePrefix, JSON.stringify(aggregationExpressionFuzzy))
  // logger.info("*********************")
  // logger.info(JSON.stringify(aggregationExpressionPrefix))

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
    return output ? output : null
  } catch (err) {
    logger.error(`SEARCHHELPER ================== ${JSON.stringify(err)}`);
    throw err
  }
};

module.exports = {
  searchEngine
}
