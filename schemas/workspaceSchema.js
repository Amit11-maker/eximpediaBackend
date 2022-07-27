const TAG = "workspaceSchema";

const ObjectID = require("mongodb").ObjectID;

const TaxonomySchema = require("./taxonomySchema");
const MongoDbQueryBuilderHelper = require("./../helpers/mongoDbQueryBuilderHelper");
const ElasticsearchDbQueryBuilderHelper = require("./../helpers/elasticsearchDbQueryBuilderHelper");

const SEPARATOR_UNDERSCORE = "_";
const SEPARATOR_SPACE = " ";

const ORDER_ASCENDING = 1;
const ORDER_DESCENDING = -1;

const POINTS_CONSUME_TYPE_DEBIT = -1;
const POINTS_CONSUME_TYPE_CREDIT = 1;

const PURCHASE_MODE_RECORDS_SELECTION = "RECORDS_SELECTION";
const PURCHASE_MODE_RECORDS_EXPRESSION = "RECORDS_EXPRESSION";

const RESULT_PORTION_TYPE_RECORDS = "RECORD_SET";
const RESULT_PORTION_TYPE_SUMMARY = "SUMMARY_RECORDS";
const RESULT_PORTION_TYPE_FIELD_HEADERS = "FIELD_HEADERS";

const PREFIX_WORKSPACE_DATA_BUCKET = "wks_set";

const IDENTIFIER_SHIPMENT_RECORDS = "shipmentRecordsIdentifier";

const workspace = {
  taxonomy_id: "",
  account_id: "",
  user_id: "",
  country: "",
  code_iso_3: "",
  code_iso_2: "",
  trade: "",
  years: [],
  records: 0,
  data_bucket: "",
  name: "",
  created_ts: 0,
  modified_ts: 0,
  end_date: "",
  start_date: "",
  s3_path:""
}

const purchase_records = {
  taxonomy_id: "",
  account_id: "",
  country: "",
  code_iso_3: "",
  code_iso_2: "",
  trade: "",
  year: 0,
  records: [],
  created_ts: 0,
  modified_ts: 0,
};

const deriveDataBucket = (tradeType, country) => {
  return country.toLowerCase().concat("_").concat(tradeType.toLowerCase());
  // switch (tradeType) {
  //   case TaxonomySchema.TAXONOMY_TYPE_IMPORT: {
  //     return TaxonomySchema.TRADE_BUCKET_KEY.concat(SEPARATOR_UNDERSCORE, tradeType.toLowerCase(),
  //       SEPARATOR_UNDERSCORE, country.toLowerCase(), SEPARATOR_UNDERSCORE, tradeYear);
  //   }
  //   case TaxonomySchema.TAXONOMY_TYPE_EXPORT: {
  //     return TaxonomySchema.TRADE_BUCKET_KEY.concat(SEPARATOR_UNDERSCORE, tradeType.toLowerCase(),
  //       SEPARATOR_UNDERSCORE, country.toLowerCase(), SEPARATOR_UNDERSCORE, tradeYear);
  //   }
  //   default:
  //     return null;
  // }
};

const deriveWorkspaceBucket = (workspaceKey) => {
  return PREFIX_WORKSPACE_DATA_BUCKET.concat(
    SEPARATOR_UNDERSCORE,
    workspaceKey.trim()
  );
}

const buildWorkspace = (data) => {
  let currentTimestamp = Date.now();
  let content = JSON.parse(JSON.stringify(workspace));
  content.taxonomy_id = ObjectID(data.taxonomyId);
  content.account_id = ObjectID(data.accountId);
  content.user_id = ObjectID(data.userId);
  content.country = data.country;
  content.flag_uri = data.flagUri;
  content.code_iso_3 = data.countryCodeISO3;
  content.code_iso_2 = data.countryCodeISO2;
  content.trade = data.tradeType;
  //content.years.push(data.tradeYear);
  //content.records = data.tradeRecords;
  //content.data_bucket = deriveWorkspaceBucket(data.workspaceId);
  content.name = data.workspaceName;
  content.s3_path = data.s3_path;
  content.created_ts = currentTimestamp;
  content.modified_ts = currentTimestamp;

  return content;
}

const buildRecordsPurchase = (data) => {
  let currentTimestamp = Date.now();
  let content = JSON.parse(JSON.stringify(purchase_records));
  content.taxonomy_id = ObjectID(data.taxonomyId);
  content.account_id = ObjectID(data.accountId);
  content.country = data.country.toUpperCase();
  content.flag_uri = data.flagUri;
  content.code_iso_3 = data.countryCodeISO3;
  content.code_iso_2 = data.countryCodeISO2;
  content.trade = data.tradeType;
  content.year = data.tradeYear;
  content.records = data.tradePurchasedRecords; //data.tradePurchasedRecords
  content.created_ts = currentTimestamp;
  content.modified_ts = currentTimestamp;

  return content;
}

const formulateShipmentRecordsIdentifierAggregationPipeline = (data) => {
  let matchClause = {};
  matchClause.$and = [];
  let groupClause = {};
  let projectClause = {};

  data.matchExpressions.forEach((matchExpression) => {
    let builtQueryClause =
      MongoDbQueryBuilderHelper.buildQueryMatchExpressions(matchExpression);
    let queryClause = {};
    queryClause[builtQueryClause.key] = builtQueryClause.value;
    matchClause.$and.push(queryClause);
  });

  groupClause = {
    _id: null,
    shipmentRecordsIdentifier: {
      $push: "$_id",
    },
  };

  projectClause = {
    _id: 0,
    shipmentRecordsIdentifier: 1,
  };

  return {
    match: matchClause.$and.length != 0 ? matchClause : {},
    group: groupClause,
    project: projectClause,
  };
};

const formulateShipmentRecordsIdentifierAggregationPipelineEngine = (data,accountId) => {
  let queryClause = {
    bool: {},
  };
  queryClause.bool.must = [];
  queryClause.bool.should = [];

  data.matchExpressions.forEach((matchExpression) => {
    let builtQueryClause = ElasticsearchDbQueryBuilderHelper.buildQueryEngineExpressions(matchExpression);
    
    //queryClause[builtQueryClause.key] = builtQueryClause.value;
    if (builtQueryClause.or != null && builtQueryClause.or.length > 0) {
      var query = {
        bool: {
          should: [],
          minimum_should_match: 1,
        },
      };
      builtQueryClause.or.forEach((clause) => {
        query.bool.should.push(clause);
      });
      builtQueryClause = query;
    }
    queryClause.bool.must.push(builtQueryClause);
  });
  //

  let sortKey = {};
  if (data.sortTerm) {
    sortKey[data.sortTerm] = {
      order: "desc",
    };
  }

  return {
    offset: data.offset,
    limit: data.limit,
    sort: sortKey,
    query: queryClause.bool.must.length != 0 ? queryClause : {},
  };
};

// Maintained Aggregation For Forecasted Tuning Based on Observations

const formulateShipmentTradersAggregationPipeline = (data) => {
  let matchClause = {};
  matchClause.$and = [];
  let facetClause = {};
  let projectClause = {};

  data.matchExpressions.forEach((matchExpression) => {
    let builtQueryClause =
      MongoDbQueryBuilderHelper.buildQueryMatchExpressions(matchExpression);
    let queryClause = {};
    queryClause[builtQueryClause.key] = builtQueryClause.value;
    matchClause.$and.push(queryClause);
  });

  let recordSet = [
    {
      $skip: data.offset,
    },
    {
      $limit: data.limit,
    },
  ];
  if (data.sortTerm) {
    let sortKey = {};
    sortKey[data.sortKey] = 1;
    recordSet.push({
      $sort: sortKey,
    });
  }
  if (!(data.recordSetKey === null || data.recordSetKey === "")) {
    facetClause[
      data.recordSetKey ? data.recordSetKey : RESULT_PORTION_TYPE_RECORDS
    ] = recordSet;
  }

  data.groupExpressions.forEach((groupExpression) => {
    let builtQueryClause =
      MongoDbQueryBuilderHelper.applyQueryGroupExpressions(groupExpression);

    if (Array.isArray(builtQueryClause.value)) {
      facetClause[groupExpression.identifier] = [];
      builtQueryClause.value.forEach((clause) => {
        facetClause[groupExpression.identifier].push(clause);
      });
    } else {
      let groupClause = {};
      groupClause[builtQueryClause.key] = builtQueryClause.value;
      facetClause[groupExpression.identifier] = [];
      facetClause[groupExpression.identifier].push(groupClause);
    }
  });

  data.projectionExpressions.forEach((projectionExpression) => {
    let builtQueryClause =
      MongoDbQueryBuilderHelper.applyQueryProjectionExpressions(
        projectionExpression
      );
    projectClause[builtQueryClause.key] = builtQueryClause.value;
  });

  return {
    match: matchClause.$and.length != 0 ? matchClause : {},
    facet: facetClause,
    project: projectClause,
  };
};

const formulateShipmentRecordsAggregationPipeline = (data) => {
  let matchClause = {};
  matchClause.$and = [];
  let facetClause = {};
  let projectClause = {};

  data.matchExpressions.forEach((matchExpression) => {
    let builtQueryClause =
      MongoDbQueryBuilderHelper.buildQueryMatchExpressions(matchExpression);
    let queryClause = {};
    queryClause[builtQueryClause.key] = builtQueryClause.value;
    matchClause.$and.push(queryClause);
  });

  let recordSet = [];
  if (data.sortTerm) {
    let sortKey = {};
    sortKey[data.sortTerm] = 1;
    recordSet.push({
      $sort: sortKey,
    });
  }

  recordSet.push({
    $skip: data.offset,
  });
  recordSet.push({
    $limit: data.limit,
  });

  // Invalid as obfusctaion is applied for columns after results fetched
  /*if (!(data.recordSetKey === null || data.recordSetKey === '')) {
    facetClause[(data.recordSetKey) ? data.recordSetKey : RESULT_PORTION_TYPE_RECORDS] = recordSet;
  }*/
  // Valid as obfuscation added after results fetched
  facetClause[RESULT_PORTION_TYPE_RECORDS] = recordSet;

  data.groupExpressions.forEach((groupExpression) => {
    let builtQueryClause =
      MongoDbQueryBuilderHelper.applyQueryGroupExpressions(groupExpression);

    if (Array.isArray(builtQueryClause.value)) {
      builtQueryClause.value.forEach((clause) => {
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

  data.projectionExpressions.forEach((projectionExpression) => {
    let builtQueryClause =
      MongoDbQueryBuilderHelper.applyQueryProjectionExpressions(
        projectionExpression
      );
    projectClause[builtQueryClause.key] = builtQueryClause.value;
  });

  return {
    match: matchClause.$and.length != 0 ? matchClause : {},
    facet: facetClause,
    project: projectClause,
  };
};

const formulateShipmentRecordsAggregationPipelineEngine = (data) => {
  let queryClause = {
    bool: {},
  };
  queryClause.bool.must = [];
  queryClause.bool.should = [];

  let aggregationClause = {};
  data.matchExpressions.forEach((matchExpression) => {
    let builtQueryClause =
      ElasticsearchDbQueryBuilderHelper.buildQueryEngineExpressions(
        matchExpression
      );

    //queryClause[builtQueryClause.key] = builtQueryClause.value;
    if (builtQueryClause.or != null && builtQueryClause.or.length > 0) {
      var query = {
        bool: {
          should: [],
          minimum_should_match: 1,
        },
      };
      builtQueryClause.or.forEach((clause) => {
        query.bool.should.push(clause);
      });
      builtQueryClause = query;
    }
    queryClause.bool.must.push(builtQueryClause);
  });
  //
  if (data.startDate && data.endDate) {
    const field =
      data.sortTerm === "IMP_DATE"
        ? {
          IMP_DATE: {
            gte: data.startDate,
            lte: data.endDate,
          },
        }
        : {
          EXP_DATE: {
            gte: data.startDate,
            lte: data.endDate,
          },
        };

    queryClause.bool.must.push({ range: field });
  }
  let sortKey = {};
  if (data.sortTerm) {
    sortKey[data.sortTerm] = {
      order: "desc",
    };
  }

  data.groupExpressions.forEach((groupExpression) => {
    let builtQueryClause =
      ElasticsearchDbQueryBuilderHelper.applyQueryGroupExpressions(
        groupExpression
      );
    //let groupClause = {};
    //groupClause[builtQueryClause.key] = builtQueryClause.value;
    aggregationClause[groupExpression.identifier] = builtQueryClause;
  });

  return {
    offset: data.offset ? data.offset : 0,
    limit: data.limit ? data.limit : 10000,
    sort: sortKey,
    query: queryClause,
    aggregation: aggregationClause,
  };
};

const formulateShipmentStatisticsAggregationPipeline = (data) => {
  let matchClause = {};
  matchClause.$and = [];
  let facetClause = {};
  let projectClause = {};

  data.matchExpressions.forEach((matchExpression) => {
    let builtQueryClause =
      MongoDbQueryBuilderHelper.buildQueryMatchExpressions(matchExpression);
    let queryClause = {};
    queryClause[builtQueryClause.key] = builtQueryClause.value;
    matchClause.$and.push(queryClause);
  });

  data.groupExpressions.forEach((groupExpression) => {
    let builtQueryClause =
      MongoDbQueryBuilderHelper.applyQueryGroupExpressions(groupExpression);

    if (builtQueryClause.key === "$groups") {
      let groupsClause = [];
      builtQueryClause.value.forEach((clause) => {
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

  data.projectionExpressions.forEach((projectionExpression) => {
    let builtQueryClause =
      MongoDbQueryBuilderHelper.applyQueryProjectionExpressions(
        projectionExpression
      );
    projectClause[builtQueryClause.key] = builtQueryClause.value;
  });

  return {
    match: matchClause.$and.length != 0 ? matchClause : {},
    facet: facetClause,
    project: projectClause,
  };
};

module.exports = {
  POINTS_CONSUME_TYPE_DEBIT,
  POINTS_CONSUME_TYPE_CREDIT,
  PURCHASE_MODE_RECORDS_SELECTION,
  PURCHASE_MODE_RECORDS_EXPRESSION,
  IDENTIFIER_SHIPMENT_RECORDS,
  RESULT_PORTION_TYPE_RECORDS,
  RESULT_PORTION_TYPE_SUMMARY,
  RESULT_PORTION_TYPE_FIELD_HEADERS,
  deriveDataBucket,
  deriveWorkspaceBucket,
  buildWorkspace,
  buildRecordsPurchase,
  formulateShipmentRecordsIdentifierAggregationPipeline,
  formulateShipmentRecordsIdentifierAggregationPipelineEngine,
  formulateShipmentTradersAggregationPipeline,
  formulateShipmentRecordsAggregationPipeline,
  formulateShipmentRecordsAggregationPipelineEngine,
  formulateShipmentStatisticsAggregationPipeline,
};
