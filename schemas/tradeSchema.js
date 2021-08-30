const TAG = 'tradeSchema';

const ObjectID = require('mongodb').ObjectID;

const TaxonomySchema = require('./taxonomySchema');
const MongoDbQueryBuilderHelper = require('./../helpers/mongoDbQueryBuilderHelper');
const ElasticsearchDbQueryBuilderHelper = require('./../helpers/elasticsearchDbQueryBuilderHelper');

const SEPARATOR_UNDERSCORE = '_';
const SEPARATOR_SPACE = ' ';

const ORDER_ASCENDING = 1;
const ORDER_DESCENDING = -1;

const RESULT_PORTION_TYPE_RECORDS = 'RECORD_SET';
const RESULT_PORTION_TYPE_SUMMARY = 'SUMMARY_RECORDS';

const RESULT_RECORDS_AGGREGATION_COMPUTE_LIMIT = 100000;

const deriveDataBucket = (tradeType, country) => {
  return country.toLowerCase().concat(SEPARATOR_UNDERSCORE, tradeType.toLowerCase())
};

const deriveDataTraderBucket = (tradeType, countryCodeISO3, traderType, tradeYear) => {
  switch (tradeType) {
    case TaxonomySchema.TAXONOMY_TYPE_IMPORT: {
      return TaxonomySchema.TRADE_BUCKET_KEY.concat(SEPARATOR_UNDERSCORE, tradeType.toLowerCase(),
        SEPARATOR_UNDERSCORE, countryCodeISO3.toLowerCase(), SEPARATOR_UNDERSCORE, traderType, SEPARATOR_UNDERSCORE, tradeYear);
    }
    case TaxonomySchema.TAXONOMY_TYPE_EXPORT: {
      return TaxonomySchema.TRADE_BUCKET_KEY.concat(SEPARATOR_UNDERSCORE, tradeType.toLowerCase(),
        SEPARATOR_UNDERSCORE, countryCodeISO3.toLowerCase(), SEPARATOR_UNDERSCORE, traderType, SEPARATOR_UNDERSCORE, tradeYear);
    }
    default:
      return null;
  }
};


// Maintained Aggregation For Forecasted Tuning Based on Observations

const formulateShipmentTradersAggregationPipeline = (data) => {

  let matchClause = {};
  matchClause.$and = [];
  let facetClause = {};
  let projectClause = {};

  data.matchExpressions.forEach(matchExpression => {
    let builtQueryClause = MongoDbQueryBuilderHelper.buildQueryMatchExpressions(matchExpression);
    let queryClause = {};
    queryClause[builtQueryClause.key] = builtQueryClause.value;
    matchClause.$and.push(queryClause);
  });

  data.groupExpressions.forEach(groupExpression => {
    let builtQueryClause = MongoDbQueryBuilderHelper.applyQueryGroupExpressions(groupExpression);

    if (Array.isArray(builtQueryClause.value)) {
      facetClause[groupExpression.identifier] = [];
      builtQueryClause.value.forEach(clause => {
        facetClause[groupExpression.identifier].push(clause);
      });
    } else {
      let groupClause = {};
      groupClause[builtQueryClause.key] = builtQueryClause.value;
      facetClause[groupExpression.identifier] = [];
      facetClause[groupExpression.identifier].push(groupClause);
    }
  });

  data.projectionExpressions.forEach(projectionExpression => {
    let builtQueryClause = MongoDbQueryBuilderHelper.applyQueryProjectionExpressions(projectionExpression);
    projectClause[builtQueryClause.key] = builtQueryClause.value;
  });

  return {
    match: (matchClause.$and.length != 0) ? matchClause : {},
    facet: facetClause,
    project: projectClause
  };

};



const formulateShipmentRecordsAggregationPipeline = (data) => {

  let matchClause = {};
  matchClause.$and = [];

  let facetClause = {};
  let projectClause = {};

  data.matchExpressions.forEach(matchExpression => {
    let builtQueryClause = MongoDbQueryBuilderHelper.buildQueryMatchExpressions(matchExpression);
    let queryClause = {};
    //queryClause[builtQueryClause.key] = builtQueryClause.value;
    if (queryClause.key != null && queryClause.key == "$or") {
      queryClause.value.forEach(clause => {
        matchClause.$or.push(clause);
      });
    } else {
      queryClause = builtQueryClause;
      matchClause.$and.push(queryClause);
    }
  });

  let recordSet = [];

  /*let sortKey = {};
  if (data.sortTerm) {
    sortKey[data.sortTerm] = 1;
  }*/

  /*if (data.sortTerm) {
    let sortKey = {};
    sortKey[data.sortTerm] = 1;
    recordSet.push({
      $sort: sortKey
    });
  }*/

  recordSet.push({
    $skip: data.offset
  });
  recordSet.push({
    $limit: data.limit
  });

  let lookupExpression = {
    from: "purchased_records_keeper",
    let: {
      record: "$_id"
    },
    pipeline: [{
        $match: {
          account_id: ObjectID(data.accountId),
          trade: data.purhcaseParams.tradeType.toUpperCase(),
          code_iso_3: data.purhcaseParams.countryCode.toUpperCase(),
          year: data.purhcaseParams.tradeYear.toString(),
          $expr: {
            $in: ["$$record", "$records"]
          }
        }
      },
      {
        $project: {
          _id: 0,
          purchasedRecord: "$$record"
        }
      }
    ],
    as: "purchased"
  };
  recordSet.push({
    $lookup: lookupExpression
  });

  // Invalid as obfusctaion is applied for columns after results fetched
  /*if (!(data.recordSetKey === null || data.recordSetKey === '')) {
    facetClause[(data.recordSetKey) ? data.recordSetKey : RESULT_PORTION_TYPE_RECORDS] = recordSet;
  }*/
  // Valid as obfuscation added after results fetched
  facetClause[RESULT_PORTION_TYPE_RECORDS] = recordSet;

  data.groupExpressions.forEach(groupExpression => {
    let builtQueryClause = MongoDbQueryBuilderHelper.applyQueryGroupExpressions(groupExpression);

    if (Array.isArray(builtQueryClause.value)) {
      builtQueryClause.value.forEach(clause => {
        facetClause[groupExpression.identifier] = [];
        facetClause[groupExpression.identifier].push(clause);
      });
    } else {
      let groupClause = {};
      groupClause[builtQueryClause.key] = builtQueryClause.value;
      facetClause[groupExpression.identifier] = [];
      facetClause[groupExpression.identifier].push(groupClause);
    }
  });

  data.projectionExpressions.forEach(projectionExpression => {
    let builtQueryClause = MongoDbQueryBuilderHelper.applyQueryProjectionExpressions(projectionExpression);
    projectClause[builtQueryClause.key] = builtQueryClause.value;
  });

  return {
    match: (matchClause.$and.length != 0) ? matchClause : {},
    limit: RESULT_RECORDS_AGGREGATION_COMPUTE_LIMIT,
    facet: facetClause,
    project: projectClause
  };

};


const formulateShipmentRecordsAggregationPipelineEngine = (data) => {

  let queryClause = {
    bool: {}
  };
  queryClause.bool.must = [];
  queryClause.bool.should = [];
  queryClause.bool.filter = [];

  let aggregationClause = {};
  

  data.matchExpressions.forEach(matchExpression => {
    let builtQueryClause = ElasticsearchDbQueryBuilderHelper.buildQueryEngineExpressions(matchExpression);
    
    //queryClause[builtQueryClause.key] = builtQueryClause.value;
    if (builtQueryClause.or != null && builtQueryClause.or.length > 0) {
      builtQueryClause.or.forEach(clause => {
        queryClause.bool.should.push(clause);
      });
      queryClause.bool.minimum_should_match = 1;
    } else {
      queryClause.bool.must.push(builtQueryClause);
    }

  });
  //

  let sortKey = {};
  if (data.sortTerm) {
    sortKey[data.sortTerm] = {
      order: "desc"
    };
  } 

  data.groupExpressions.forEach(groupExpression => {
    let builtQueryClause = ElasticsearchDbQueryBuilderHelper.applyQueryGroupExpressions(groupExpression);
    //let groupClause = {};
    //groupClause[builtQueryClause.key] = builtQueryClause.value;
    aggregationClause[groupExpression.identifier] = builtQueryClause;
  });

  return {
    offset: data.offset,
    limit: data.limit,
    sort: sortKey,
    query: (queryClause.bool.must.length != 0) ? queryClause : {},
    aggregation: aggregationClause
  };

};



const formulateShipmentRecordsStrippedAggregationPipeline = (data) => {

  let sortConsumed = false;

  let searchClause = {};
  searchClause.compound = {
    must: []
  };
  if (data.searchExpressions != null && data.searchExpressions != undefined) {

    searchClause.index = data.indexNamePrefix.concat(data.tradeYear);

    data.searchExpressions.forEach(searchExpression => {
      searchExpression.year = data.tradeYear;
      searchExpression.isCompundIndexSpecified = true; // Override Individual Index
      let builtQueryClause = MongoDbQueryBuilderHelper.buildQuerySearchExpressions(searchExpression);
      let queryClause = {};
      queryClause = builtQueryClause;
      searchClause.compound.must.push(queryClause);
    });

    sortConsumed = true;

  }

  let matchClause = {};
  matchClause.$and = [];
  if (data.matchExpressions != null && data.matchExpressions != undefined) {
    data.matchExpressions.forEach(matchExpression => {
      let builtQueryClause = MongoDbQueryBuilderHelper.buildQueryMatchExpressions(matchExpression);
      let queryClause = {};
      queryClause[builtQueryClause.key] = builtQueryClause.value;
      matchClause.$and.push(queryClause);
    });
  }

  let sortKey = {};
  if (!sortConsumed) {
    if (data.sortTerm) {
      sortKey[data.sortTerm] = 1;
    }
  }

  let lookupExpression = {
    from: "purchased_records_keeper",
    let: {
      record: "$_id"
    },
    pipeline: [{
        $match: {
          account_id: ObjectID(data.accountId),
          trade: data.purhcaseParams.tradeType.toUpperCase(),
          code_iso_3: data.purhcaseParams.countryCode.toUpperCase(),
          year: data.purhcaseParams.tradeYear.toString(),
          $expr: {
            $in: ["$$record", "$records"]
          }
        }
      },
      {
        $project: {
          _id: 0,
          purchasedRecord: "$$record"
        }
      }
    ],
    as: "purchased"
  };

  return {
    search: (searchClause.compound.must.length != 0) ? searchClause : {},
    match: (matchClause.$and.length != 0) ? matchClause : {},
    sort: sortKey,
    skip: data.offset,
    limit: data.limit,
    lookup: lookupExpression
  };

};

const formulateShipmentSummaryStrippedAggregationPipeline = (data) => {

  let sortConsumed = false;

  let searchClause = {};
  searchClause.compound = {
    must: []
  };
  if (data.searchExpressions != null && data.searchExpressions != undefined) {

    searchClause.index = data.indexNamePrefix.concat(data.tradeYear);

    data.searchExpressions.forEach(searchExpression => {
      searchExpression.year = data.tradeYear;
      searchExpression.isCompundIndexSpecified = true; // Override Individual Index
      let builtQueryClause = MongoDbQueryBuilderHelper.buildQuerySearchExpressions(searchExpression);
      let queryClause = {};
      queryClause = builtQueryClause;
      searchClause.compound.must.push(queryClause);
    });

    sortConsumed = true;

  }

  let matchClause = {};
  matchClause.$and = [];
  if (data.matchExpressions != null && data.matchExpressions != undefined) {
    data.matchExpressions.forEach(matchExpression => {
      let builtQueryClause = MongoDbQueryBuilderHelper.buildQueryMatchExpressions(matchExpression);
      let queryClause = {};
      queryClause[builtQueryClause.key] = builtQueryClause.value;
      matchClause.$and.push(queryClause);
    });
  }

  let sortKey = {};
  if (!sortConsumed) {
    if (data.sortTerm) {
      sortKey[data.sortTerm] = 1;
    }
  }

  let facetClause = {};
  let projectClause = {};
  /*
  let matchClause = {};
  matchClause.$and = [];
  let facetClause = {};
  let projectClause = {};

  data.matchExpressions.forEach(matchExpression => {
    let builtQueryClause = MongoDbQueryBuilderHelper.buildQueryMatchExpressions(matchExpression);
    let queryClause = {};
    queryClause[builtQueryClause.key] = builtQueryClause.value;
    matchClause.$and.push(queryClause);
  });
  */


  data.groupExpressions.forEach(groupExpression => {
    let builtQueryClause = MongoDbQueryBuilderHelper.applyQueryGroupExpressions(groupExpression);

    if (Array.isArray(builtQueryClause.value)) {
      facetClause[groupExpression.identifier] = [];
      builtQueryClause.value.forEach(clause => {
        facetClause[groupExpression.identifier].push(clause);
      });
    } else {
      let groupClause = {};
      groupClause[builtQueryClause.key] = builtQueryClause.value;
      facetClause[groupExpression.identifier] = [];
      facetClause[groupExpression.identifier].push(groupClause);
    }
  });

  data.projectionExpressions.forEach(projectionExpression => {
    let builtQueryClause = MongoDbQueryBuilderHelper.applyQueryProjectionExpressions(projectionExpression);
    projectClause[builtQueryClause.key] = builtQueryClause.value;
  });

  return {
    search: (searchClause.compound.must.length != 0) ? searchClause : {},
    match: (matchClause.$and.length != 0) ? matchClause : {},
    sort: sortKey,
    facet: facetClause,
    skip: data.offset,
    limit: data.limit,
    project: projectClause
  };

};

const formulateShipmentFilterStrippedAggregationPipeline = (data) => {

  let sortConsumed = false;

  let searchClause = {};
  searchClause.compound = {
    must: []
  };
  if (data.searchExpressions != null && data.searchExpressions != undefined) {

    searchClause.index = data.indexNamePrefix.concat(data.tradeYear);

    data.searchExpressions.forEach(searchExpression => {
      searchExpression.year = data.tradeYear;
      searchExpression.isCompundIndexSpecified = true; // Override Individual Index
      let builtQueryClause = MongoDbQueryBuilderHelper.buildQuerySearchExpressions(searchExpression);
      let queryClause = {};
      queryClause = builtQueryClause;
      searchClause.compound.must.push(queryClause);
    });

    sortConsumed = true;

  }

  let matchClause = {};
  matchClause.$and = [];
  if (data.matchExpressions != null && data.matchExpressions != undefined) {
    data.matchExpressions.forEach(matchExpression => {
      let builtQueryClause = MongoDbQueryBuilderHelper.buildQueryMatchExpressions(matchExpression);
      let queryClause = {};
      queryClause[builtQueryClause.key] = builtQueryClause.value;
      matchClause.$and.push(queryClause);
    });
  }

  let sortKey = {};
  if (!sortConsumed) {
    if (data.sortTerm) {
      sortKey[data.sortTerm] = 1;
    }
  }

  let facetClause = {};
  let projectClause = {};
  /*
  let matchClause = {};
  matchClause.$and = [];
  let facetClause = {};
  let projectClause = {};

  data.matchExpressions.forEach(matchExpression => {
    let builtQueryClause = MongoDbQueryBuilderHelper.buildQueryMatchExpressions(matchExpression);
    let queryClause = {};
    queryClause[builtQueryClause.key] = builtQueryClause.value;
    matchClause.$and.push(queryClause);
  });
  */

  data.groupExpressions.forEach(groupExpression => {
    let builtQueryClause = MongoDbQueryBuilderHelper.applyQueryGroupExpressions(groupExpression);

    if (Array.isArray(builtQueryClause.value)) {
      facetClause[groupExpression.identifier] = [];
      builtQueryClause.value.forEach(clause => {
        facetClause[groupExpression.identifier].push(clause);
      });
    } else {
      let groupClause = {};
      groupClause[builtQueryClause.key] = builtQueryClause.value;
      facetClause[groupExpression.identifier] = [];
      facetClause[groupExpression.identifier].push(groupClause);
    }
  });

  data.projectionExpressions.forEach(projectionExpression => {
    let builtQueryClause = MongoDbQueryBuilderHelper.applyQueryProjectionExpressions(projectionExpression);
    projectClause[builtQueryClause.key] = builtQueryClause.value;
  });

  return {
    search: (searchClause.compound.must.length != 0) ? searchClause : {},
    match: (matchClause.$and.length != 0) ? matchClause : {},
    sort: sortKey,
    facet: facetClause,
    skip: data.offset,
    limit: data.limit,
    project: projectClause
  };

};



const formulateShipmentStatisticsAggregationPipeline = (data) => {

  let matchClause = {};
  matchClause.$and = [];
  let facetClause = {};
  let projectClause = {};

  data.matchExpressions.forEach(matchExpression => {
    let builtQueryClause = MongoDbQueryBuilderHelper.buildQueryMatchExpressions(matchExpression);
    let queryClause = {};
    queryClause[builtQueryClause.key] = builtQueryClause.value;
    matchClause.$and.push(queryClause);
  });

  data.groupExpressions.forEach(groupExpression => {
    let builtQueryClause = MongoDbQueryBuilderHelper.applyQueryGroupExpressions(groupExpression);

    if (builtQueryClause.key === "$groups") {
      let groupsClause = [];
      builtQueryClause.value.forEach(clause => {
        groupsClause.push(clause);
      });
      facetClause[groupExpression.identifier] = groupsClause;
      
    } else {
      let groupClause = {};
      groupClause[builtQueryClause.key] = builtQueryClause.value;
      facetClause[groupExpression.identifier] = [];
      facetClause[groupExpression.identifier].push(groupClause);
    }

    //
  });

  data.projectionExpressions.forEach(projectionExpression => {
    let builtQueryClause = MongoDbQueryBuilderHelper.applyQueryProjectionExpressions(projectionExpression);
    projectClause[builtQueryClause.key] = builtQueryClause.value;
  });

  return {
    match: (matchClause.$and.length != 0) ? matchClause : {},
    facet: facetClause,
    project: projectClause
  };

};


/*
{
	identifier: '',
	alias: '',
	recordSetKey: 'RECORDS',
	sortTerm: '',
	matchExpressions: [],
	groupExpressions: [],
	projectionExpressions: []
}
{
	clause: 'MATCH|GROUP|PROJECTION'
	expressionType:'',
	fieldTerm: '',
	fieldValue: '',
	fieldValueLeft: '',
	fieldValueRight: '',
	fieldTermPrimary: '',
	fieldTermSecondary: ''
}
*/

module.exports = {
  RESULT_PORTION_TYPE_RECORDS,
  RESULT_PORTION_TYPE_SUMMARY,
  deriveDataBucket,
  deriveDataTraderBucket,
  formulateShipmentTradersAggregationPipeline,
  formulateShipmentRecordsAggregationPipeline,
  formulateShipmentRecordsAggregationPipelineEngine,
  formulateShipmentRecordsStrippedAggregationPipeline,
  formulateShipmentSummaryStrippedAggregationPipeline,
  formulateShipmentFilterStrippedAggregationPipeline,
  formulateShipmentStatisticsAggregationPipeline
};
