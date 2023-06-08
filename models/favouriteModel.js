const TAG = "favouriteModel";
const ElasticsearchDbHandler = require("../db/elasticsearchDbHandler");

const findTradeCountriesByPatternEngine = async (searchField ,tradeMeta) => {
    let aggregationExpression = {
        size: 0,
        query: {
            bool: {
                must: [],
                should: [],
                filter: [],
            },
        },
        aggs: {},
    }

    if (tradeMeta.blCountry) {
        var blMatchExpressions = { match: {} };
        blMatchExpressions.match["COUNTRY_DATA"] = tradeMeta.blCountry;
        aggregationExpression.query.bool.must.push({ ...blMatchExpressions });
    }

    aggregationExpression.aggs["searchText"] = {
        terms: {
          field: searchField + ".keyword",
        },
    }

    try {
        let result = await ElasticsearchDbHandler.dbClient.search({
            index: tradeMeta.indexNamePrefix,
            track_total_hits: true,
            body: aggregationExpression,
        });
        var dataSet = [];
        if (result.body.aggregations.hasOwnProperty("searchText")) {
            if (result.body.aggregations.searchText.hasOwnProperty("buckets")) {
                for (const prop of result.body.aggregations.searchText.buckets) {
                    // console.log(prop);
                    if (!dataSet.includes(prop.key.trim())) {
                        dataSet.push(prop.key.trim());
                    }
                }
            }
        }
        
        return dataSet ;
    } catch (error) {
        throw error ;
    }
}

module.exports = {
    findTradeCountriesByPatternEngine
}