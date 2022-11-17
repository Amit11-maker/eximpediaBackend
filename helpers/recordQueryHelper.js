const { logger } = require('../config/logger');
const ElasticsearchDbQueryBuilderHelper = require('./elasticsearchDbQueryBuilderHelper');

const queryCreator = (data) => {
    try {
        let queryClause = {
            bool: {}
        };
        queryClause.bool.must = [];
        queryClause.bool.must_not = [];
        queryClause.bool.should = [];
        queryClause.bool.filter = [{
            bool: {
                should: [],
                must: []
            }
        }];

        let aggregationClause = {};


        if (data.aggregationParams.matchExpressions.length > 0) {
            data.aggregationParams.matchExpressions.forEach(matchExpression => {
                let builtQueryClause = ElasticsearchDbQueryBuilderHelper.buildQueryEngineExpressions(matchExpression);

                //queryClause[builtQueryClause.key] = builtQueryClause.value;
                if (builtQueryClause.or != null && builtQueryClause.or.length > 0) {
                    var query = {
                        "bool": {
                            "minimum_should_match": 1,
                            "should": []
                        }
                    }
                    builtQueryClause.or.forEach(clause => {
                        query.bool.should.push(clause);
                    });
                    builtQueryClause = query;
                }
                if (matchExpression && matchExpression.relation && matchExpression.relation.toLowerCase() == "or") {
                    if (builtQueryClause.multiple) {
                        queryClause.bool.filter[0].bool.should.push(...builtQueryClause.multiple)
                    } else {
                        queryClause.bool.filter[0].bool.should.push(builtQueryClause)
                    }
                }
                else if (matchExpression && matchExpression.relation && matchExpression.relation.toLowerCase() == "not") {
                    if (builtQueryClause.multiple) {
                        queryClause.bool.must_not.push(...builtQueryClause.multiple)
                    } else {
                        queryClause.bool.must_not.push(builtQueryClause)
                    }
                }
                else if (!matchExpression.hasOwnProperty('relation') && builtQueryClause.multiple && matchExpression.analyser === false) {
                    queryClause.bool.filter[0].bool.should.push(...builtQueryClause.multiple)
                }
                else if (!matchExpression.hasOwnProperty('relation') && builtQueryClause.multiple && matchExpression.analyser) {
                    queryClause.bool.filter[0].bool.must.push(...builtQueryClause.multiple)
                } else {
                    if (builtQueryClause.multiple) {
                        queryClause.bool.must.push(...builtQueryClause.multiple);
                    } else {
                        queryClause.bool.must.push(builtQueryClause);
                    }
                }

            });
        }
        //

        if (data.aggregationParams.groupExpressions) {
            data.aggregationParams.groupExpressions.forEach(groupExpression => {
                if (groupExpression.identifier.includes("SUMMARY")) {
                    let builtQueryClause = ElasticsearchDbQueryBuilderHelper.applyQueryGroupExpressions(groupExpression);
                    aggregationClause[groupExpression.identifier] = builtQueryClause;
                }
            });
        }

        let sortKey = {};
        if (data.aggregationParams.sortTerm) {
            sortKey[data.aggregationParams.sortTerm] = {
                order: "desc"
            };
        }

        return {
            offset: data.offset,
            limit: data.limit,
            sort: sortKey,
            query: (queryClause.bool.must.length != 0 || queryClause.bool.filter[0].bool.should.length != 0) ? queryClause : {},
            aggregation: aggregationClause
        };
    } catch (error) {
        logger.error(error)
        throw error
    }
};

const queryFilterCreator = (data) => {
    try {
        let queryClause = {
            bool: {}
        };
        queryClause.bool.must = [];
        queryClause.bool.must_not = [];
        queryClause.bool.should = [];
        queryClause.bool.filter = [{
            bool: {
                should: [],
                must: []
            }
        }];

        let aggregationClause = {};


        if (data.aggregationParams.matchExpressions.length > 0) {
            data.aggregationParams.matchExpressions.forEach(matchExpression => {
                let builtQueryClause = ElasticsearchDbQueryBuilderHelper.buildQueryEngineExpressions(matchExpression);

                //queryClause[builtQueryClause.key] = builtQueryClause.value;
                if (builtQueryClause.or != null && builtQueryClause.or.length > 0) {
                    var query = {
                        "bool": {
                            "minimum_should_match": 1,
                            "should": []
                        }
                    }
                    builtQueryClause.or.forEach(clause => {
                        query.bool.should.push(clause);
                    });
                    builtQueryClause = query;
                }
                if (matchExpression && matchExpression.relation && matchExpression.relation.toLowerCase() == "or") {
                    if (builtQueryClause.multiple) {
                        queryClause.bool.filter[0].bool.should.push(...builtQueryClause.multiple)
                    } else {
                        queryClause.bool.filter[0].bool.should.push(builtQueryClause)
                    }
                }
                else if (matchExpression && matchExpression.relation && matchExpression.relation.toLowerCase() == "not") {
                    if (builtQueryClause.multiple) {
                        queryClause.bool.must_not.push(...builtQueryClause.multiple)
                    } else {
                        queryClause.bool.must_not.push(builtQueryClause)
                    }
                }
                else if (!matchExpression.hasOwnProperty('relation') && builtQueryClause.multiple && matchExpression.analyser === false) {
                    queryClause.bool.filter[0].bool.should.push(...builtQueryClause.multiple)
                }
                else if (!matchExpression.hasOwnProperty('relation') && builtQueryClause.multiple && matchExpression.analyser) {
                    queryClause.bool.filter[0].bool.must.push(...builtQueryClause.multiple)
                } else {
                    if (builtQueryClause.multiple) {
                        queryClause.bool.must.push(...builtQueryClause.multiple);
                    } else {
                        queryClause.bool.must.push(builtQueryClause);
                    }
                }

            });
        }
        //

        if (data.aggregationParams.groupExpressions) {

            let priceObject = data.aggregationParams.groupExpressions.find(o => o.identifier === 'FILTER_CURRENCY_PRICE_USD')
            data.aggregationParams.groupExpressions.forEach(groupExpression => {
                if (groupExpression.identifier.includes("FILTER")) {
                    let builtQueryClause = ElasticsearchDbQueryBuilderHelper.applyQueryGroupExpressions(groupExpression);
                    if (priceObject && !builtQueryClause.hasOwnProperty("meta")) {
                        builtQueryClause.aggs = {
                            "totalSum": {
                                "sum": {
                                    "field": priceObject.fieldTerm + priceObject.fieldTermTypeSuffix
                                }
                            }
                        }
                    } else if (priceObject && builtQueryClause.hasOwnProperty("meta")) {
                        builtQueryClause.meta.aggs = {
                            "totalSum": {
                                "sum": {
                                    "field": priceObject.fieldTerm + priceObject.fieldTermTypeSuffix
                                }
                            }
                        }
                    }
                    aggregationClause[groupExpression.identifier] = builtQueryClause;
                }
            });
        }

        let sortKey = {};
        if (data.aggregationParams.sortTerm) {
            sortKey[data.aggregationParams.sortTerm] = {
                order: "desc"
            };
        }

        return {
            limit: 0,
            sort: sortKey,
            query: (queryClause.bool.must.length != 0 || queryClause.bool.filter[0].bool.should.length != 0) ? queryClause : {},
            aggregation: aggregationClause
        };

    } catch (error) {
        throw error
    }
};


module.exports = {
    queryCreator,
    queryFilterCreator
}