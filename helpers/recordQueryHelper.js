const { logger } = require('../config/logger');
const ElasticsearchDbQueryBuilderHelper = require('./elasticsearchDbQueryBuilderHelper');

const queryCreator = (data) => {
    try {
        let queryClause = {
            bool: {}
        };

        queryClause.bool.must = [
            {
                bool: {
                    should: []
                }
            },
            {
                bool: {
                    should: []
                }
            }
        ];
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
                        if(builtQueryClause.datas){
                            builtQueryClause.datas.forEach(data => {
                                queryClause.bool.must[0].bool.should.push(data)
                            });
                        }else{
                            queryClause.bool.filter[0].bool.should.push(builtQueryClause)
                        }
                    }
                }
                else if (matchExpression && matchExpression.relation && matchExpression.relation.toLowerCase() == "not") {
                    if (builtQueryClause.multiple) {
                        queryClause.bool.must_not.push(...builtQueryClause.multiple)
                    } else if(builtQueryClause.datas) {
                        queryClause.bool.must_not.push(...builtQueryClause.datas)
                    } else {
                        queryClause.bool.must_not.push(builtQueryClause)
                    }
                }
                else if (!matchExpression.hasOwnProperty('relation') && builtQueryClause.multiple) {
                    // Condition for not contains
                    if (matchExpression.expressionType == "204") {
                        queryClause.bool.must_not.push(...builtQueryClause.multiple)
                    } else {
                        queryClause.bool.filter[0].bool.should.push(...builtQueryClause.multiple)
                    }
                }
                else {
                    if (builtQueryClause.multiple) {
                        if (matchExpression.alias == "COUNTRY" && matchExpression.fieldTerm == "COUNTRY_DATA") {
                            queryClause.bool.must.push(builtQueryClause.multiple[0]);
                        } else if (matchExpression.expressionType == "204") {  //Condition for not contain of product description
                            queryClause.bool.must_not.push(...builtQueryClause.multiple)
                        }
                        else if (matchExpression.alias == "UNIT" && matchExpression.identifier == "FILTER_UNIT") {

                            queryClause.bool.must[1].bool.should.push(...builtQueryClause.multiple);

                        } else {
                            queryClause.bool.must.push(...builtQueryClause.multiple);
                        }
                    } else {
                        if (builtQueryClause.datas) {
                            for (let i = 0; i < builtQueryClause.datas.length; i++) {
                                queryClause.bool.must[0].bool.should.push(builtQueryClause.datas[i]);
                            }
                        } else {
                            queryClause.bool.must.push(builtQueryClause);
                        }
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

        let sortArr = []
        if (data.aggregationParams.sortTerms && data.aggregationParams.sortTerms.length > 0) {
            for (let term of data.aggregationParams.sortTerms) {
                let sortKey = {};
                sortKey[term.sortField] = {
                    order: term.sortType
                }
                sortArr.push(sortKey)
            }
        }

        return {
            offset: data.offset,
            limit: data.limit,
            sort: sortArr,
            query: (queryClause.bool.must.length != 0 || queryClause.bool.filter[0].bool.should.length != 0) ? queryClause : {},
            aggregation: aggregationClause
        }
    } catch (error) {
        logger.error(error)
        throw error
    }
}


const queryFilterCreator = (data) => {
    try {
        let queryClause = {
            bool: {}
        };

        queryClause.bool.must = [
            {
                bool: {
                    should: []
                }
            }, {
                bool: {
                    should: []
                }
            }
        ];
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
                else if (!matchExpression.hasOwnProperty('relation') && builtQueryClause.multiple) {
                    queryClause.bool.filter[0].bool.should.push(...builtQueryClause.multiple)
                }
                else {
                    if (builtQueryClause.multiple) {
                        if (matchExpression.alias == "COUNTRY" && matchExpression.fieldTerm == "COUNTRY_DATA") {
                            queryClause.bool.must.push(builtQueryClause.multiple[0]);
                        } else if (matchExpression.alias == "UNIT" && matchExpression.identifier == "FILTER_UNIT") {

                            queryClause.bool.must[1].bool.should.push(...builtQueryClause.multiple);

                        } else {
                            queryClause.bool.filter[0].bool.should.push(...builtQueryClause.multiple);
                        }
                    } else {
                        // queryClause.bool.must.push(builtQueryClause);
                        if (builtQueryClause.datas) {
                            for (let i = 0; i < builtQueryClause.datas.length; i++) {
                                queryClause.bool.must[0].bool.should.push(builtQueryClause.datas[i]);
                            }
                        } else {
                            queryClause.bool.must.push(builtQueryClause);
                        }
                    }

                }
            }
            );
        }
        //

        if (data.aggregationParams.groupExpressions) {

            let priceObject = data.aggregationParams.groupExpressions.find(o => o.identifier === 'FILTER_CURRENCY_PRICE_USD')
            data.aggregationParams.groupExpressions.forEach(groupExpression => {
                if (groupExpression.identifier.includes("FILTER")) {
                    let builtQueryClause = ElasticsearchDbQueryBuilderHelper.applyQueryGroupExpressions(groupExpression);
                    console.log(JSON.stringify(builtQueryClause), priceObject && !builtQueryClause.hasOwnProperty("meta"), priceObject && builtQueryClause.hasOwnProperty("meta"))
                    if (priceObject && !builtQueryClause.hasOwnProperty("meta")) {
                        if (builtQueryClause.hasOwnProperty('aggs')) {
                            builtQueryClause.aggs.totalSum = {
                                "sum": {
                                    "field": priceObject.fieldTerm + priceObject.fieldTermTypeSuffix
                                }
                            }
                        }
                        else {
                            builtQueryClause.aggs = {
                                "totalSum": {
                                    "sum": {
                                        "field": priceObject.fieldTerm + priceObject.fieldTermTypeSuffix
                                    }
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
            }
        }

        return {
            limit: 0,
            sort: sortKey,
            query: (queryClause.bool.must.length != 0 || queryClause.bool.filter[0].bool.should.length != 0) ? queryClause : {},
            aggregation: aggregationClause
        }

    } catch (error) {
        throw error;
    }
}

const queryRecommendationByValueCreator = (data) => {
    try {
        let queryClause = {
            bool: {}
        }

        queryClause.bool.must = [
            {
                bool: {
                    should: []
                }
            }, {
                bool: {
                    should: []
                }
            }
        ];
        queryClause.bool.must_not = [];
        queryClause.bool.should = [];
        queryClause.bool.filter = [{
            bool: {
                should: [],
                must: []
            }
        }];


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
                else if (!matchExpression.hasOwnProperty('relation') && builtQueryClause.multiple) {
                    queryClause.bool.filter[0].bool.should.push(...builtQueryClause.multiple)
                }
                else {
                    if (builtQueryClause.multiple) {
                        if (matchExpression.alias == "COUNTRY" && matchExpression.fieldTerm == "COUNTRY_DATA") {
                            queryClause.bool.must.push(builtQueryClause.multiple[0]);
                        }
                        else {
                            queryClause.bool.filter[0].bool.should.push(...builtQueryClause.multiple);
                        }
                    } else {
                        if (builtQueryClause.datas) {
                            for (let i = 0; i < builtQueryClause.datas.length; i++) {
                                queryClause.bool.must[0].bool.should.push(builtQueryClause.datas[i]);
                            }
                        } else {
                            queryClause.bool.must.push(builtQueryClause);
                        }
                    }

                }
            }
            );
        }

        let sortKey = {}
        let priceObject = data?.aggregationParams?.groupExpressions?.find(o => (o.alias === 'PRICE' && o.metaTag == 'USD'));
        if (priceObject?.fieldTerm) {
            sortKey[priceObject.fieldTerm + priceObject.fieldTermTypeSuffix] = {
                order: "desc"
            }
        }

        return {
            limit: 5,
            sort: sortKey,
            query: (queryClause.bool.must.length != 0 || queryClause.bool.filter[0].bool.should.length != 0) ? queryClause : {}
        }

    } catch (error) {
        throw error
    }
}


module.exports = {
    queryCreator,
    queryFilterCreator,
    queryRecommendationByValueCreator
}
