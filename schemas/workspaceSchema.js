const TAG = "workspaceSchema";

const ObjectID = require("mongodb").ObjectID;

const TaxonomySchema = require("./taxonomySchema");
const MongoDbQueryBuilderHelper = require("./../helpers/mongoDbQueryBuilderHelper");
const { queryCreator } = require("../helpers/recordQueryHelper")
const { logger } = require("../config/logger")
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
  flag_uri: "",
  code_iso_3: "",
  code_iso_2: "",
  trade: "",
  records: 0,
  data_bucket: "",
  name: "",
  start_date: "",
  end_date: "",
  s3_path: "",
  created_ts: "",
  modified_ts: ""
}

const buildWorkspace = (data) => {
  let currentTimestamp = Date.now();
  let content = JSON.parse(JSON.stringify(workspace));
  content.taxonomy_id = ObjectID(data.taxonomyId) ?? null;
  content.account_id = ObjectID(data.accountId) ?? null;
  content.user_id = ObjectID(data.userId) ?? null;
  content.country = data.country ?? null;
  content.flag_uri = data.flagUri ?? null;
  content.code_iso_3 = data.countryCodeISO3 ?? null;
  content.code_iso_2 = data.countryCodeISO2 ?? null;
  content.trade = data.tradeType ?? null;
  content.records = data.recordsCount ?? 0;
  content.data_bucket = data.workspaceDataBucket ?? null;
  content.name = data.workspaceName ?? null;
  content.start_date = data.start_date ?? currentTimestamp;
  content.end_date = data.end_date ?? currentTimestamp;
  content.s3_path = data.s3FilePath ?? null;
  content.created_ts = currentTimestamp;
  content.modified_ts = currentTimestamp;

  return content;
}

const buildShareWorkspaceData = (userId , data) => {
  let currentTimestamp = Date.now();
  let content = JSON.parse(JSON.stringify(workspace));
  content.taxonomy_id = ObjectID(data.taxonomy_id) ?? null;
  content.account_id = ObjectID(data.account_id) ?? null;
  content.user_id = ObjectID(userId) ?? null;
  content.country = data.country ?? null;
  content.flag_uri = data.flag_uri ?? null;
  content.code_iso_3 = data.code_iso_3 ?? null;
  content.code_iso_2 = data.code_iso_3 ?? null;
  content.trade = data.trade ?? null;
  content.records = data.records ?? 0;
  content.data_bucket = data.data_bucket ?? null;
  content.name = data.name ?? null;
  content.start_date = data.start_date ?? currentTimestamp;
  content.end_date = data.end_date ?? currentTimestamp;
  content.s3_path = data.s3_path ?? null;
  content.created_ts = currentTimestamp;
  content.modified_ts = currentTimestamp;

  return content;
}

const deriveDataBucket = (tradeType, country) => {
  return country.toLowerCase().concat("_").concat(tradeType.toLowerCase());
}

const deriveWorkspaceBucket = (workspaceKey) => {
  return PREFIX_WORKSPACE_DATA_BUCKET.concat(
    SEPARATOR_UNDERSCORE,
    workspaceKey.trim()
  );
}

const purchase_records = {
  taxonomy_id: "",
  account_id: "",
  country: "",
  code_iso_3: "",
  code_iso_2: "",
  trade: "",
  records: [],
  created_ts: '',
  modified_ts: ''
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
  content.records = data.tradePurchasedRecords;
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

const formulateShipmentRecordsIdentifierAggregationPipelineEngine = (data) => {
  try {
    let query = queryCreator(data)
    return query
  } catch (error) {
    logger.error(`TRADE SCHEMA ================ ${JSON.stringify(error)}`)
  }
}
const formulateShipmentRecordsAggregationPipelineEngine = (data) => {
  try {
    let query = queryCreator(data)
    return query
  } catch (error) {
    logger.error(`TRADE SCHEMA ================ ${JSON.stringify(error)}`)
  }
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
  buildShareWorkspaceData,
  buildRecordsPurchase,
  formulateShipmentRecordsIdentifierAggregationPipeline,
  formulateShipmentRecordsIdentifierAggregationPipelineEngine,
  formulateShipmentTradersAggregationPipeline,
  formulateShipmentRecordsAggregationPipeline,
  formulateShipmentRecordsAggregationPipelineEngine,
  formulateShipmentStatisticsAggregationPipeline,
};
