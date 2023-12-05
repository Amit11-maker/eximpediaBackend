const TAG = "tradeModel";

const getLoggerInstance = require('../services/logger/Logger');
const { searchEngine } = require("../helpers/searchHelper");
const {
  getSearchData,
  getFilterData,
  getAnalysisSearchData,
  addQueryToActivityTrackerForUser,
} = require("../helpers/recordSearchHelper");
const ObjectID = require("mongodb").ObjectID;
const ElasticsearchDbQueryBuilderHelper = require("./../helpers/elasticsearchDbQueryBuilderHelper");
const MongoDbHandler = require("../db/mongoDbHandler");
const ElasticsearchDbHandler = require("../db/elasticsearchDbHandler");
const TradeSchema = require("../schemas/tradeSchema");
const accountLimitsCollection = MongoDbHandler.collections.account_limits;

const adxHelper = require("../helpers/adxQueryBuilder");
const { logger } = require("../config/logger");
const SEPARATOR_UNDERSCORE = "_";
const kustoClient = require("../db/adxDbHandler");
const { endianness } = require("os");
const { KQLMatchExpressionQueryBuilder } = require("../helpers/adxQueryBuilder");
const { query: adxQueryExecuter, parsedQueryResults } = require("../db/adxDbApi");
const { getADXAccessToken } = require("../db/accessToken");
const powerBiModel = require("./powerBiModel")

async function getBlCountriesISOArray() {
  let aggregationExpression = [
    {
      $match: {
        bl_flag: true,
      },
    },
    {
      $project: {
        country: 1,
        code_iso_3: 1,
        _id: 0,
      },
    },
    {
      $group: {
        _id: null,
        country: {
          $push: "$code_iso_3",
        },
      },
    },
  ];

  let blCountriesISOArray = await MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.taxonomy)
    .aggregate(aggregationExpression)
    .toArray();

  const uniqueblISOArray = [...new Set(blCountriesISOArray[0]["country"])];
  return uniqueblISOArray;
}

async function addOrUpdateViewColumn(userId, payload) {
  const query = {
    user_id: ObjectID(userId),
    taxonomy_id: ObjectID(payload.taxonomy_id),
  };
  const options = { upsert: true };
  try {
    const viewColumnData = {
      user_id: ObjectID(userId),
      taxonomy_id: ObjectID(payload.taxonomy_id),
      selected_columns: payload.selected_columns,
    };
    const updateClause = { $set: viewColumnData };
    const result = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.explore_view_columns)
      .updateOne(query, updateClause, options);

    return result;
  } catch (error) {
    logger.log(
      `"Method = addOrUpdateViewColumn, Error = ", ${JSON.stringify(error)}`
    );
    throw error;
  } finally {
    logger.log("Method = addOrUpdateViewColumn, Exit");
  }
}

async function findExploreViewColumnsByTaxonomyId(taxonomy_id, user_id) {
  try {
    const viewColumnData = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.explore_view_columns)
      .find({ taxonomy_id: ObjectID(taxonomy_id), user_id: ObjectID(user_id) })
      .project({ selected_columns: 1 })
      .toArray();

    return viewColumnData.length > 0 ? viewColumnData[0] : [];
  } catch (error) {
    logger.log(
      `"Method = findExploreViewColumnsByTaxonomyId, Error = ", ${JSON.stringify(
        error
      )}`
    );
    throw error;
  }
}

function isEmptyObject(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) return false;
  }
  return true;
}

const buildFilters = (filters) => {
  let filterClause = {};
  if (filters.tradeType) filterClause.trade = filters.tradeType;
  if (filters.countryCode) {
    filterClause.$or = [
      {
        code_iso_3: filters.countryCode,
      },
      {
        code_iso_2: filters.countryCode,
      },
    ];
  }
  if (filters.tradeYear) filterClause.year = parseInt(filters.tradeYear);
  if (filters.isPublished)
    filterClause.is_published = parseInt(filters.isPublished);
  return filterClause;
};

const findByFilters = (filters, cb) => {
  let filterClause = buildFilters(filters);
  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.taxonomy)
    .find(filterClause)
    .project({
      _id: 1,
      country: 1,
      code_iso_3: 1,
      flag_uri: 1,
      trade: 1,
      bucket: 1,
      fields: 1,
    })
    .toArray(function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
};

const findTradeCountries = async (tradeType, constraints, cb) => {
  let BLCOUNTRIESLIST = await getBlCountriesISOArray();
  if (constraints.allowedCountries.length >= BLCOUNTRIESLIST.length) {
    let blFlag = true;
    for (let i of BLCOUNTRIESLIST) {
      if (!constraints.allowedCountries.includes(i)) {
        blFlag = false;
      }
    }
    if (blFlag) {
      for (let i of BLCOUNTRIESLIST) {
        let index = constraints.allowedCountries.indexOf(i);
        console.log(index);
        if (index > -1) {
          constraints.allowedCountries.splice(index, 1);
        }
      }
    }
  }

  if (constraints.allowedCountries.length > 0) {
    console.log(constraints);
    let matchBlock = {
      country: { $ne: "bl" },
      "data_stages.examine.status": "COMPLETED",
      "data_stages.upload.status": "COMPLETED",
      "data_stages.ingest.status": "COMPLETED",
    };

    if (tradeType) {
      matchBlock.trade = tradeType;
    }

    if (constraints.allowedCountries) {
      matchBlock.code_iso_3 = {
        $in: constraints.allowedCountries,
      };
    }

    MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.ledger)
      .aggregate(
        [
          {
            $match: matchBlock,
          },
          {
            $group: {
              _id: {
                country: "$country",
                trade: "$trade",
              },
              taxonomy_id: {
                $first: "$taxonomy_id",
              },
              data_bucket: {
                $first: "$data_bucket",
              },
              recentRecordsAddition: {
                $max: "$created_ts",
              },
              totalRecords: {
                $sum: "$records",
              },
              publishedRecords: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$is_published", 1],
                    },
                    "$records",
                    0,
                  ],
                },
              },
              unpublishedRecords: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$is_published", 0],
                    },
                    "$records",
                    0,
                  ],
                },
              },
            },
          },
          {
            $lookup: {
              from: "taxonomies",
              localField: "taxonomy_id",
              foreignField: "_id",
              as: "taxonomy_map",
            },
          },
          {
            $addFields: {
              country_lower: {
                $toLower: "$_id.country",
              },
              trade_lower: {
                $toLower: "$_id.trade",
              },
              region: {
                $first: "$taxonomy_map",
              },
            },
          },
          {
            $lookup: {
              from: "country_date_range",
              localField: "taxonomy_id",
              foreignField: "taxonomy_id",
              as: "country_refresh",
            },
          },
          {
            $replaceRoot: {
              newRoot: {
                $mergeObjects: [
                  {
                    $arrayElemAt: ["$taxonomy_map", 0],
                  },
                  "$$ROOT",
                ],
              },
            },
          },
          {
            $project: {
              _id: 0,
              country: "$_id.country",
              trade: "$_id.trade",
              code_iso_3: 1,
              code_iso_2: 1,
              flag_uri: 1,
              mode: 1,
              showcase_fields: "$fields.showcase",
              data_bucket: 1,
              recentRecordsAddition: 1,
              totalRecords: 1,
              publishedRecords: 1,
              unpublishedRecords: 1,
              region: "$region.region",
              bl_flag: "$region.bl_flag",
              refresh_data: {
                $filter: {
                  input: "$country_refresh",
                  as: "country_refresh",
                  cond: {
                    $eq: ["$$country_refresh.trade_type", "$trade_lower"],
                  },
                },
              },
            },
          },
          {
            $sort: {
              country: 1,
            },
          },
        ],
        {
          allowDiskUse: true,
        },
        function (err, cursor) {
          if (err) {
            cb(err);
          } else {
            cursor.toArray(function (err, documents) {
              if (err) {
                logger.log(JSON.stringify(err));
                cb(err);
              } else {
                var output = {};
                for (var doc of documents) {
                  if (
                    doc.hasOwnProperty("refresh_data") &&
                    doc.refresh_data.length > 0
                  ) {
                    doc.dataRange = {
                      start: doc.refresh_data[0].start_date,
                      end: doc.refresh_data[0].end_date,
                    };
                    doc.count = doc.refresh_data[0].number_of_records;
                    delete doc.refresh_data;
                  }
                }
                cb(null, documents);
              }
            });
          }
        }
      );
  } else {
    cb(null, "Not accessible");
  }
};

const findBlTradeCountries = async (tradeType, constraints, cb) => {
  let matchBlock = {
    bl_flag: true,
  };

  if (tradeType) {
    matchBlock.trade = tradeType;
  }
  let BLCOUNTRIESLIST = await getBlCountriesISOArray();

  let isBLAlloted = BLCOUNTRIESLIST.every((e) =>
    constraints.allowedCountries.includes(e)
  );
  if (!isBLAlloted) {
    cb(null, "Not accessible");
  } else {
    MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.taxonomy)
      .aggregate(
        [
          {
            $match: matchBlock,
          },
          {
            $lookup: {
              from: "country_date_range",
              localField: "_id",
              foreignField: "taxonomy_id",
              as: "country_refresh",
            },
          },
          {
            $project: {
              _id: 0,
              country: 1,
              trade: 1,
              code_iso_3: 1,
              code_iso_2: 1,
              flag_uri: 1,
              showcase_fields: "$fields.showcase",
              bucket: 1,
              region: 1,
              bl_flag: 1,
              refresh_data: "$country_refresh",
            },
          },
          {
            $sort: {
              country: 1,
            },
          },
        ],
        {
          allowDiskUse: true,
        },
        function (err, cursor) {
          if (err) {
            cb(err);
          } else {
            cursor.toArray(function (err, documents) {
              if (err) {
                logger.log(JSON.stringify(err));
                cb(err);
              } else {
                var output = {};
                for (var doc of documents) {
                  if (
                    doc.hasOwnProperty("refresh_data") &&
                    doc.refresh_data.length > 0
                  ) {
                    doc.dataRange = {
                      start: doc.refresh_data[0].start_date,
                      end: doc.refresh_data[0].end_date,
                    };
                    doc.count = doc.refresh_data[0].number_of_records;
                    delete doc.refresh_data;
                  }
                }
                cb(null, documents);
              }
            });
          }
        }
      );
  }
};

const findTradeCountriesRegion = (cb) => {
  let matchBlock = {
    country: { $ne: "bl" },
    "data_stages.examine.status": "COMPLETED",
    "data_stages.upload.status": "COMPLETED",
    "data_stages.ingest.status": "COMPLETED",
  };

  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.ledger)
    .aggregate(
      [
        {
          $match: matchBlock,
        },
        {
          $lookup: {
            from: "taxonomies",
            localField: "taxonomy_id",
            foreignField: "_id",
            as: "taxonomy_map",
          },
        },
        {
          $match: {
            taxonomy_map: { $size: 1 },
          },
        },
        {
          $addFields: {
            region: { $first: "$taxonomy_map" },
          },
        },
        {
          $group: {
            _id: {
              country: "$region.country",
              region: "$region.region",
            },
          },
        },
        {
          $project: {
            _id: 0,
            country: "$_id.country",
            region: "$_id.region",
          },
        },
        {
          $sort: {
            country: 1,
          },
        },
      ],
      {
        allowDiskUse: true,
      },
      function (err, cursor) {
        if (err) {
          cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              logger.log(JSON.stringify(err));
              cb(err);
            } else {
              cb(null, documents);
            }
          });
        }
      }
    );
};

const getCountryNames = async (countryISOList, tradeType, bl_flag) => {
  let filterClause = {};
  filterClause.code_iso_3 = {
    $in: countryISOList,
  };
  filterClause.trade = tradeType;
  filterClause.bl_flag = bl_flag === null ? false : true;

  let result = await MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.taxonomy)
    .find(filterClause)
    .project({
      country: 1,
      code_iso_3: 1,
      _id: 0,
    })
    .sort({
      country: 1,
    })
    .toArray();

  return result;
};

const findTradeShipmentSpecifications = (
  bl_flag,
  tradeType,
  countryCode,
  constraints,
  cb
) => {
  let matchBlock = {
    country: { $ne: "bl" },
    "data_stages.examine.status": "COMPLETED",
    "data_stages.upload.status": "COMPLETED",
    "data_stages.ingest.status": "COMPLETED",
  };

  if (bl_flag) {
    matchBlock = { bl_flag: true };
  }

  if (countryCode) {
    matchBlock.code_iso_3 = countryCode;
  }

  if (tradeType) {
    matchBlock.trade = tradeType;
  }

  if (bl_flag) {
    // console.log(matchBlock);
    MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.taxonomy)
      .aggregate(
        [
          {
            $match: matchBlock,
          },
          {
            $lookup: {
              from: "country_date_range",
              localField: "_id",
              foreignField: "taxonomy_id",
              as: "country_date",
            },
          },
          {
            $project: {
              _id: 0,
              country: 1,
              trade: 1,
              code_iso_3: 1,
              code_iso_2: 1,
              flag_uri: 1,
              hs_code_digit_classification: 1,
              dashboard: 1,
              explore_fields: "$fields.explore",
              search_fields: "$fields.search",
              filter_fields: "$fields.filter",
              all_fields: "$fields.all",
              dataTypes_fields: "$fields.dataTypes",
              search_field_semantic: "$fields.search_semantic",
              filter_field_semantic: "$fields.filter_semantic",
              traders_aggregation: "$fields.traders_aggregation",
              explore_aggregation: "$fields.explore_aggregation",
              records_aggregation: "$fields.records_aggregation",
              statistics_aggregation: "$fields.statistics_aggregation",
              data_bucket: "$bucket",
              years: 1,
              data_start_date: {
                $arrayElemAt: ["$country_date.start_date", 0],
              },
              data_end_date: { $arrayElemAt: ["$country_date.end_date", 0] },
            },
          },
        ],
        {
          allowDiskUse: true,
        },
        function (err, cursor) {
          if (err) {
            cb(err);
          } else {
            cursor.toArray(function (err, documents) {
              if (err) {
                cb(err);
              } else {
                cb(null, documents);
              }
            });
          }
        }
      );
  } else {
    MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.ledger)
      .aggregate(
        [
          {
            $match: matchBlock,
          },
          {
            $group: {
              _id: {
                country: "$country",
                trade: "$trade",
              },
              taxonomy_id: {
                $first: "$taxonomy_id",
              },
              data_bucket: {
                $first: "$data_bucket",
              },
              // "years": {
              //   $addToSet: "$year"
              // },
              recentRecordsAddition: {
                $max: "$created_ts",
              },
              totalRecords: {
                $sum: "$records",
              },
              publishedRecords: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$is_published", 1],
                    },
                    "$records",
                    0,
                  ],
                },
              },
              unpublishedRecords: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$is_published", 0],
                    },
                    "$records",
                    0,
                  ],
                },
              },
            },
          },
          {
            $lookup: {
              from: "taxonomies",
              localField: "taxonomy_id",
              foreignField: "_id",
              as: "taxonomy_map",
            },
          },
          {
            $replaceRoot: {
              newRoot: {
                $mergeObjects: [
                  {
                    $arrayElemAt: ["$taxonomy_map", 0],
                  },
                  "$$ROOT",
                ],
              },
            },
          },
          {
            $lookup: {
              from: "country_date_range",
              localField: "taxonomy_id",
              foreignField: "taxonomy_id",
              as: "country_date",
            },
          },
          {
            $project: {
              _id: 0,
              country: "$_id.country",
              trade: "$_id.trade",
              code_iso_3: 1,
              code_iso_2: 1,
              flag_uri: 1,
              mode: 1,
              dashboard: 1,
              hs_code_digit_classification: 1,
              explore_fields: "$fields.explore",
              search_fields: "$fields.search",
              filter_fields: "$fields.filter",
              all_fields: "$fields.all",
              dataTypes_fields: "$fields.dataTypes",
              search_field_semantic: "$fields.search_semantic",
              filter_field_semantic: "$fields.filter_semantic",
              traders_aggregation: "$fields.traders_aggregation",
              explore_aggregation: "$fields.explore_aggregation",
              records_aggregation: "$fields.records_aggregation",
              statistics_aggregation: "$fields.statistics_aggregation",
              data_bucket: "$bucket",
              years: 1,
              recentRecordsAddition: 1,
              totalRecords: 1,
              publishedRecords: 1,
              unpublishedRecords: 1,
              data_start_date: {
                $arrayElemAt: ["$country_date.start_date", 0],
              },
              data_end_date: { $arrayElemAt: ["$country_date.end_date", 0] },
            },
          },
        ],
        {
          allowDiskUse: true,
        },
        function (err, cursor) {
          if (err) {
            cb(err);
          } else {
            cursor.toArray(function (err, documents) {
              if (err) {
                cb(err);
              } else {
                cb(null, documents);
              }
            });
          }
        }
      );
  }
};

const findTradeShipments = (
  searchParams,
  filterParams,
  dataBucket,
  offset,
  limit,
  cb
) => {
  let matchBlock = {};

  MongoDbHandler.getDbInstance()
    .collection(dataBucket)
    .find({})
    .skip(parseInt(offset))
    .limit(parseInt(limit))
    .toArray(function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
};

const findTradeShipmentRecordsAggregation = (
  aggregationParams,
  dataBucket,
  accountId,
  recordPurchasedParams,
  offset,
  limit,
  cb
) => {
  aggregationParams.accountId = accountId;
  aggregationParams.purhcaseParams = recordPurchasedParams;
  aggregationParams.offset = offset;
  aggregationParams.limit = limit;
  let clause =
    TradeSchema.formulateShipmentRecordsAggregationPipeline(aggregationParams);

  let aggregationExpression = [
    {
      $match: clause.match,
    },
    {
      $limit: clause.limit,
    },
    {
      $facet: clause.facet,
    },
    {
      $project: clause.project,
    },
  ];
  //

  MongoDbHandler.getDbInstance()
    .collection(dataBucket)
    .aggregate(
      aggregationExpression,
      {
        allowDiskUse: true,
      },
      function (err, cursor) {
        if (err) {
          throw err; //cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              throw err; //cb(err);
            } else {
              cb(null, documents ? documents[0] : null);
            }
          });
        }
      }
    );
};

const findTradeShipmentRecordsAggregationEngine = async (
  aggregationParams,
  tradeType,
  country,
  dataBucket,
  userId,
  accountId,
  recordPurchasedParams,
  offset,
  limit,
  cb
) => {
  try {
    let payload = {};
    payload.aggregationParams = aggregationParams;
    payload.tradeType = tradeType;
    payload.country = country;
    payload.dataBucket = dataBucket;
    payload.userId = userId;
    payload.accountId = accountId;
    payload.recordPurchasedParams = recordPurchasedParams;
    payload.offset = offset;
    payload.limit = limit;
    payload.tradeRecordSearch = true;

    let data = await getSearchData(payload);

    cb(null, data);
    return data;
  } catch (error) {
    logger.log(
      ` TRADE MODEL ============================ ${JSON.stringify(error)}`
    );
    cb(error);
  }
};

const findTradeShipmentFiltersAggregationEngine = async (
  aggregationParams,
  tradeType,
  country,
  dataBucket,
  userId,
  accountId,
  recordPurchasedParams,
  offset,
  limit,
  cb
) => {
  try {
    let payload = {};
    payload.aggregationParams = aggregationParams;
    payload.tradeType = tradeType;
    payload.country = country;
    payload.dataBucket = dataBucket;
    payload.userId = userId;
    payload.accountId = accountId;
    payload.recordPurchasedParams = recordPurchasedParams;
    payload.offset = offset;
    payload.limit = limit;
    payload.tradeRecordSearch = true;

    let data = await getFilterData(payload);
    cb(null, data);
  } catch (error) {
    logger.log(
      ` TRADE MODEL ============================ ${JSON.stringify(error)}`
    );
    cb(error);
  }
};

// Distribute Result Explore
const findTradeShipmentRecords = (
  aggregationParams,
  dataBucket,
  accountId,
  recordPurchasedParams,
  offset,
  limit,
  cb
) => {
  aggregationParams.accountId = accountId;
  aggregationParams.purhcaseParams = recordPurchasedParams;
  aggregationParams.offset = offset;
  aggregationParams.limit = limit;
  let clause =
    TradeSchema.formulateShipmentRecordsStrippedAggregationPipeline(
      aggregationParams
    );

  let aggregationExpression = [];

  if (clause.search != null && clause.search != undefined) {
    if (!isEmptyObject(clause.search)) {
      aggregationExpression.push({
        $search: clause.search,
      });
    }
  }

  if (clause.match != null && clause.match != undefined) {
    if (!isEmptyObject(clause.match)) {
      aggregationExpression.push({
        $match: clause.match,
      });
    }
  }

  if (clause.sort != null && clause.sort != undefined) {
    if (!isEmptyObject(clause.sort)) {
      aggregationExpression.push({
        $sort: clause.sort,
      });
    }
  }

  if (
    clause.skip != null &&
    clause.skip != undefined &&
    clause.limit != null &&
    clause.limit != undefined
  ) {
    aggregationExpression.push({
      $skip: clause.skip,
    });
    aggregationExpression.push({
      $limit: clause.limit,
    });
  }

  aggregationExpression.push({
    $lookup: clause.lookup,
  });

  //

  MongoDbHandler.getDbInstance()
    .collection(dataBucket)
    .aggregate(
      aggregationExpression,
      {
        allowDiskUse: true,
      },
      function (err, cursor) {
        if (err) {
          throw err; //cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              cb(err);
            } else {
              cb(null, documents ? documents : null);
            }
          });
        }
      }
    );
};

// Distribute Result Explore
const findTradeShipmentSummary = (
  aggregationParams,
  dataBucket,
  offset,
  limit,
  cb
) => {
  aggregationParams.offset = offset;
  aggregationParams.limit = limit;
  let clause =
    TradeSchema.formulateShipmentSummaryStrippedAggregationPipeline(
      aggregationParams
    );

  let aggregationExpression = [];

  if (clause.search != null && clause.search != undefined) {
    if (!isEmptyObject(clause.search)) {
      aggregationExpression.push({
        $search: clause.search,
      });
    }
  }

  if (clause.match != null && clause.match != undefined) {
    if (!isEmptyObject(clause.match)) {
      aggregationExpression.push({
        $match: clause.match,
      });
    }
  }

  if (clause.sort != null && clause.sort != undefined) {
    if (!isEmptyObject(clause.sort)) {
      aggregationExpression.push({
        $sort: clause.sort,
      });
    }
  }

  if (
    clause.skip != null &&
    clause.skip != undefined &&
    clause.limit != null &&
    clause.limit != undefined
  ) {
    aggregationExpression.push({
      $skip: clause.skip,
    });
    aggregationExpression.push({
      $limit: clause.limit,
    });
  }

  // Searchable Data Results Limit for Efficiency
  aggregationExpression.push({
    $limit: 1000,
  });

  aggregationExpression.push({
    $facet: clause.facet,
  });

  aggregationExpression.push({
    $project: clause.project,
  });

  //

  MongoDbHandler.getDbInstance()
    .collection(dataBucket)
    .aggregate(
      aggregationExpression,
      {
        allowDiskUse: true,
      },
      function (err, cursor) {
        if (err) {
          cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              cb(err);
            } else {
              cb(null, documents ? documents[0] : null);
            }
          });
        }
      }
    );
};

// Distribute Result Explore
const findTradeShipmentFilter = (
  aggregationParams,
  dataBucket,
  offset,
  limit,
  cb
) => {
  aggregationParams.offset = offset;
  aggregationParams.limit = limit;
  let clause =
    TradeSchema.formulateShipmentFilterStrippedAggregationPipeline(
      aggregationParams
    );

  let aggregationExpression = [];

  if (clause.search != null && clause.search != undefined) {
    if (!isEmptyObject(clause.search)) {
      aggregationExpression.push({
        $search: clause.search,
      });
    }
  }

  if (clause.match != null && clause.match != undefined) {
    if (!isEmptyObject(clause.match)) {
      aggregationExpression.push({
        $match: clause.match,
      });
    }
  }

  if (clause.sort != null && clause.sort != undefined) {
    if (!isEmptyObject(clause.sort)) {
      aggregationExpression.push({
        $sort: clause.sort,
      });
    }
  }

  if (
    clause.skip != null &&
    clause.skip != undefined &&
    clause.limit != null &&
    clause.limit != undefined
  ) {
    aggregationExpression.push({
      $skip: clause.skip,
    });
    aggregationExpression.push({
      $limit: clause.limit,
    });
  }

  // Searchable Data Results Limit for Efficiency
  aggregationExpression.push({
    $limit: 1000,
  });

  aggregationExpression.push({
    $facet: clause.facet,
  });

  aggregationExpression.push({
    $project: clause.project,
  });

  //

  MongoDbHandler.getDbInstance()
    .collection(dataBucket)
    .aggregate(
      aggregationExpression,
      {
        allowDiskUse: true,
      },
      function (err, cursor) {
        if (err) {
          cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              cb(err);
            } else {
              cb(null, documents ? documents[0] : null);
            }
          });
        }
      }
    );
};

const findTradeShipmentStatisticsAggregation = (
  aggregationParams,
  dataBucket,
  offset,
  limit,
  cb
) => {
  aggregationParams.offset = offset;
  aggregationParams.limit = limit;
  let clause =
    TradeSchema.formulateShipmentStatisticsAggregationPipeline(
      aggregationParams
    );

  let aggregationExpression = [
    {
      $match: clause.match,
    },
    {
      $facet: clause.facet,
    },
    {
      $project: clause.project,
    },
  ];

  //

  MongoDbHandler.getDbInstance()
    .collection(dataBucket)
    .aggregate(
      aggregationExpression,
      {
        allowDiskUse: true,
      },
      function (err, cursor) {
        if (err) {
          cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              cb(err);
            } else {
              cb(null, documents ? documents[0] : null);
            }
          });
        }
      }
    );
};

const findTradeShipmentsTraders = (aggregationParams, dataBucket, cb) => {
  let clause =
    TradeSchema.formulateShipmentTradersAggregationPipeline(aggregationParams);

  let aggregationExpression = [
    {
      $match: clause.match,
    },
    {
      $facet: clause.facet,
    },
    {
      $project: clause.project,
    },
  ];

  //

  MongoDbHandler.getDbInstance()
    .collection(dataBucket)
    .aggregate(
      aggregationExpression,
      {
        allowDiskUse: true,
      },
      function (err, cursor) {
        if (err) {
          cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              cb(err);
            } else {
              cb(null, documents ? documents[0] : null);
            }
          });
        }
      }
    );
};

const findTradeShipmentsTradersByPattern = (
  searchTerm,
  searchField,
  dataBucket,
  tradeMeta,
  cb
) => {
  let searchClause = {
    index: tradeMeta.indexNamePrefix.concat(
      tradeMeta.traderType,
      SEPARATOR_UNDERSCORE,
      tradeMeta.tradeYear
    ), //searchTerm,
    autocomplete: {
      query: searchTerm,
      path: searchField,
      tokenOrder: "any", // any|sequential
    },
  };

  let groupClause = {};
  groupClause._id = `$${searchField}`;

  let aggregationExpression = [
    {
      $search: searchClause,
    },
    {
      $skip: 0,
    },
    {
      $limit: 100,
    },
    {
      $project: {
        _id: `$${searchField}`,
      },
    },
  ];

  MongoDbHandler.getDbInstance()
    .collection(dataBucket)
    .aggregate(
      aggregationExpression,
      {
        allowDiskUse: true,
      },
      function (err, cursor) {
        if (err) {
          cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              cb(err);
            } else {
              cb(null, documents ? documents : null);
            }
          });
        }
      }
    );
};

const findTradeShipmentsTradersByPatternEngine = async (payload, cb) => {
  try {
    let getSearchedData = await searchEngine(payload);
    // if (payload.searchField === "HS_CODE") {
    //   getSearchedData.unshift({ _id: payload.searchTerm });
    // }
    cb(null, getSearchedData);
  } catch (error) {
    cb(error);
  }
};

const findShipmentsCount = (dataBucket, cb) => {
  MongoDbHandler.getDbInstance()
    .collection(dataBucket)
    .estimatedDocumentCount({}, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
};

const findCompanyDetailsByPatternEngineADX = async (
  metaData,
  searchTerm,
  tradeMeta,
  startDate,
  endDate,
  searchingColumns,
  isrecommendationDataRequest
) => {
  let recordSize = 1;
  if (isrecommendationDataRequest) {
    recordSize = 0;
  }

  try {
    const data = getCompanySearchFiltersADX(
      metaData,
      searchTerm,
      tradeMeta,
      startDate,
      endDate,
      searchingColumns,
      isrecommendationDataRequest
    );

    return data;
  } catch (error) {
    throw error;
  }
}

async function getCompanySearchFiltersADX(
  metaDataObject,
  searchTerm,
  tradeMeta,
  startDate,
  endDate,
  searchingColumns,
  isrecommendationDataRequest
) {

  let filtersObject = {
    startDate: startDate,
    endDate: endDate,
    [searchingColumns.searchField ?? ""]: searchTerm
  }

  /** @type {{}} */
  let summaryObject = {
    [`SUMMARY_TOTAL_USD_VALUE = sum(${searchingColumns.priceColumn})`]: 1,
    [`SUMMARY_RECORDS = count() by ${searchingColumns.searchField}`]: 1,
  }

  let summary = await companySearchAdxQuerySummarize(metaDataObject, filtersObject, summaryObject, searchingColumns);

  /** @type {{}} */
  let summaryExpporterImporterObject = {
    [`count() by ${searchingColumns.sellerName} | count`]: 1
  }

  let sellerSummary = await companySearchAdxQuerySummarize(metaDataObject, filtersObject, summaryExpporterImporterObject, searchingColumns);

  filtersObject = {
    startDate: startDate,
    endDate: endDate,
    [`${searchingColumns.buyerName}`]: searchTerm
  };

  let projectionObject = {}

  let Data = await companySearchAdxQuery(metaDataObject, filtersObject, projectionObject, searchingColumns);

  projectionObject = {
    [`_id = ${searchingColumns.codeColumn}`]: 1,
    [`price = ${searchingColumns.unitColumn}`]: 1,
    [`quantity = ${searchingColumns.quantityColumn}`]: 1
  };

  let FILTER_HSCODE_PRICE_QUANTITY = await companySearchAdxQuery(metaDataObject, filtersObject, projectionObject, searchingColumns);

  projectionObject = {};

  const portFilters = {
    [`| distinct ${searchingColumns.portColumn}, ${searchingColumns.priceColumn}, ${searchingColumns.quantityColumn}`]: 1,
    [`| project _id = ${searchingColumns.portColumn}, price =  ${searchingColumns.priceColumn}, quantityField = ${searchingColumns.quantityColumn}`]: 1,
    [`| summarize quantity = sum(quantityField) by _id `]: 1,
  }

  let FILTER_PORT_QUANTITY = await companySearchAdxQuery(metaDataObject, filtersObject, projectionObject, searchingColumns, portFilters);

  summaryObject = {};

  let filterPriceQuantity = {
    [`| distinct ${searchingColumns.dateColumn}, ${searchingColumns.priceColumn}, ${searchingColumns.quantityColumn} | summarize price = sum(${searchingColumns.priceColumn}), quantity = sum(${searchingColumns.quantityColumn}) by _id = ${searchingColumns.dateColumn}`]: 1
  }

  let FILTER_PRICE_QUANTITY = await companySearchAdxQuerySummarize(metaDataObject, filtersObject, summaryObject, searchingColumns, filterPriceQuantity);

  summaryObject = {
    [`price = sum(${searchingColumns.priceColumn})`]: 1,
    [`quantity = sum(${searchingColumns.quantityColumn}) by _id = ${searchingColumns.countryColumn}`]: 1,
  };

  let FILTER_COUNTRY_PRICE_QUANTITY = await companySearchAdxQuerySummarize(metaDataObject, filtersObject, summaryObject, searchingColumns);

  projectionObject = {
    [`_id = ${searchingColumns.codeColumn}`]: 1,
    [`UNIT_PRICE_USD`]: 1,
    [`QUANTITY`]: 1
  };

  let FILTER_BUYER_SELLER = await filterBuyerSellerADX({
    dataBucket: getSearchBucket(metaDataObject["country"], metaDataObject["tradeType"]), endDate, startDate, searchingColumns, searchTerm
  });

  filtersObject = {
    startDate: startDate,
    endDate: endDate,
    [`${searchingColumns.searchField}`]: searchTerm
  };

  let filterData = {};
  filterData["summary"] = {
    "SUMMARY_RECORDS": summary[0]["SUMMARY_RECORDS"],
    "SUMMARY_TOTAL_USD_VALUE": summary[0]["SUMMARY_TOTAL_USD_VALUE"],
    "SUMMARY_TOTAL_SUPPLIER": sellerSummary[0]["Count"]
  }

  filterData["chart"] = {};
  filterData["data"] = Data[0];

  filterData["filter"] = {};
  filterData["filter"]["FILTER_HSCODE_PRICE_QUANTITY"] = FILTER_HSCODE_PRICE_QUANTITY;
  filterData["filter"]["FILTER_PORT_QUANTITY"] = FILTER_PORT_QUANTITY;
  filterData["filter"]["FILTER_PRICE_QUANTITY"] = FILTER_PRICE_QUANTITY;
  filterData["filter"]["FILTER_COUNTRY_PRICE_QUANTITY"] = FILTER_COUNTRY_PRICE_QUANTITY
  filterData["filter"]["FILTER_BUYER_SELLER"] = FILTER_BUYER_SELLER;

  return filterData;
}

/** 
 * @param {{searchingColumns: any, dataBucket: string, startDate: string, endDate: string, searchTerm: string}} param0
 */
async function filterBuyerSellerADX({ searchingColumns, dataBucket, startDate, endDate, searchTerm }) {
  try {

    let query = `${dataBucket}
    | where ${searchingColumns.dateColumn} between (todatetime('${startDate}') .. todatetime('${endDate}'))
    | where ${searchingColumns.searchField} == '${searchTerm}'
    | summarize count() by ${searchingColumns.sellerName}
    `
    const token = await getADXAccessToken()
    const result = await parsedQueryResults(query, token);
    const mappedDataResult = mapAdxRowsAndColumns(result?.Tables[0]['Rows'], result?.Tables[0]['Columns']);

    const buyersOrSellers = mappedDataResult.map((item) => `'${item[searchingColumns.sellerName]}'`)

    const identifiers = {
      buyer: "buyer",
      _id: "_id",
      buyerCount: "buyerCount",
      subBuyerCount: "subBuyerCount"
    }

    const subQuery = `${dataBucket}
    | where  ${searchingColumns.dateColumn} between (todatetime('${startDate}') .. todatetime('${endDate}'))
    | where ${searchingColumns.sellerName} in (${buyersOrSellers.join(", ")})
    | summarize ${identifiers.buyerCount} = count() by ${searchingColumns.sellerName}, ${searchingColumns.searchField}, ${searchingColumns.quantityColumn}
    | distinct ${identifiers.buyer} = ${searchingColumns.searchField}, ${identifiers._id} = ${searchingColumns.sellerName}, ${searchingColumns.quantityColumn}, ${identifiers.buyerCount}
    | summarize ${identifiers.subBuyerCount} = sum(${searchingColumns.quantityColumn}) by ${identifiers.buyer}, ${identifiers._id}, ${identifiers.buyerCount}`

    const subBuyerSellerResult = await parsedQueryResults(subQuery, token);
    const subMappedDataResult = mapAdxRowsAndColumns(subBuyerSellerResult?.Tables[0]['Rows'], subBuyerSellerResult?.Tables[0]['Columns']);

    /** 
     * @type {{
     * buyer: string,
     * _id: string,
     * buyerCount: number,
     * subBuyerCount: number
     * }[]}
     */
    let response = subMappedDataResult
    const mapped = [];
    for (let i = 0; i < response.length; i++) {
      let item = response[i];
      const buyerExists = mapped.find((v) => v._id === item._id);
      if (buyerExists) {
        if (buyerExists.buyers) {
          buyerExists.buyers.push({
            subBuyerCount: item.subBuyerCount,
            _id: item.buyer
          })
        }
      } else {
        mapped.push({
          _id: item._id,
          buyers: [{
            subBuyerCount: item.subBuyerCount,
            _id: item.buyer
          }],
          buyerCount: item.buyerCount
        })
      }
    }

    return mapped;
  } catch (error) {
    getLoggerInstance(error, __filename, filterBuyerSellerADX.name)
    throw error
  }
}

const companySearchAdxQuerySummarize = async (metaDataObject, filtersObject, summaryObject, searchingColumns, rawQuery = {}) => {

  let country = metaDataObject.country;
  let tradeType = metaDataObject.tradeType;

  let ADXTable = getSearchBucket(country, tradeType)
  // country +  tradeType + "WP | ";

  let filterString = ``;
  let summaryString = ``;


  Object.keys(filtersObject).map((property) => {

    if (property == "startDate") {
      filterString = filterString + ` | where ${searchingColumns.dateColumn} >= datetime(${filtersObject[property]}) `;
    }
    else if (property == "endDate") {
      filterString = filterString + ` | where ${searchingColumns.dateColumn} <= datetime(${filtersObject[property]}) `;
    }
    else {
      filterString = filterString + ` | where ${property} == "${filtersObject[property]}" `;
    }
  });

  const summaryFields = Object.keys(summaryObject);
  if (summaryFields.length > 0) {
    summaryString += "| summarize "
  }

  summaryFields.map((property, index) => {
    summaryString = summaryString + `${property},`
  });

  summaryString = summaryString.slice(0, summaryString.length - 1);
  let queryString = ADXTable + filterString + summaryString;

  Object.keys(rawQuery).forEach(q => {
    queryString += q;
  })

  const accessToken = await getADXAccessToken()
  let records = await parsedQueryResults(queryString, accessToken);

  console.log(
    "Rows\n",
    records["Tables"][0]["Rows"],
    "\nColumns\n",
    records["Tables"][0]["Columns"]
  );

  let mappedRecords = mapAdxRowsAndColumns(
    records["Tables"][0]["Rows"],
    records["Tables"][0]["Columns"]
  );

  let finalResult = {
    data: [...mappedRecords],
  }

  return finalResult.data;
}

const companySearchAdxQuery = async (metaDataObject, filtersObject, projectionObject, searchingColumns, otherFilters = {}) => {

  let country = metaDataObject.country;
  let tradeType = metaDataObject.tradeType;

  let ADXTable = getSearchBucket(country, tradeType)
  // country +  tradeType + "WP | ";

  let filterString = ``;
  let projectString = ``;


  Object.keys(filtersObject).map((property) => {

    if (property == "startDate") {
      filterString = filterString + ` | where ${searchingColumns.dateColumn} >= datetime(${filtersObject[property]}) `;
    }
    else if (property == "endDate") {
      filterString = filterString + ` | where ${searchingColumns.dateColumn} <= datetime(${filtersObject[property]}) `;
    }
    else {
      filterString = filterString + ` | where ${property} == "${filtersObject[property]}" `;
    }
  });


  let projectColumns = Object.keys(projectionObject);

  if (projectColumns.length > 0) {
    projectString += "| project "
  }

  projectColumns.map((property) => {
    projectString = projectString + `${property},`
  });

  projectString = projectString.slice(0, projectString.length - 1);

  let queryString = ADXTable + filterString + projectString;
  console.log(queryString);

  Object.keys(otherFilters).forEach((property) => {
    queryString += property;
  })


  let accessToken = await getADXAccessToken()
  let records = await adxQueryExecuter(queryString, accessToken);
  records = JSON.parse(records);
  let mappedRecords = mapAdxRowsAndColumns(
    records["Tables"][0]["Rows"],
    records["Tables"][0]["Columns"]
  );

  let finalResult = {
    data: [...mappedRecords],
  };

  return finalResult.data;

}

const findCompanyDetailsByPatternEngine = async (
  searchTerm,
  tradeMeta,
  startDate,
  endDate,
  searchingColumns,
  isrecommendationDataRequest
) => {
  let recordSize = 1;
  if (isrecommendationDataRequest) {
    recordSize = 0;
  }
  let aggregationExpression = {
    // setting size as one to get address of the company
    size: recordSize,
    query: {
      bool: {
        must: [],
        should: [],
        filter: [],
        must_not: [],
      },
    },
    aggs: {},
  };

  let buyerSellerAggregationExpression = {
    // setting size as one to get address of the company
    size: recordSize,
    query: {
      bool: {
        must: [],
        should: [],
        filter: [],
        must_not: [],
      },
    },
    aggs: {},
  };

  let matchExpression = {
    match: {},
  };

  matchExpression.match[searchingColumns.searchField] = {
    query: searchTerm,
    operator: "and",
    fuzziness: "auto",
  };
  aggregationExpression.query.bool.must.push({ ...matchExpression });
  buyerSellerAggregationExpression.query.bool.must.push({ ...matchExpression });

  let rangeQuery = {
    range: {},
  };
  rangeQuery.range[searchingColumns.dateColumn] = {
    gte: startDate,
    lte: endDate,
  };
  aggregationExpression.query.bool.must.push({ ...rangeQuery });
  buyerSellerAggregationExpression.query.bool.must.push({ ...rangeQuery });

  if (tradeMeta.blCountry) {
    var blMatchExpressions = { match: {} };
    blMatchExpressions.match["COUNTRY_DATA"] = tradeMeta.blCountry;
    aggregationExpression.query.bool.must.push({ ...blMatchExpressions });
    buyerSellerAggregationExpression.query.bool.must.push({
      ...blMatchExpressions,
    });
  }

  let buyerSellerData = await buyerSellerDataAggregation(
    buyerSellerAggregationExpression,
    searchingColumns,
    tradeMeta,
    matchExpression
  );

  if (!isrecommendationDataRequest) {
    summaryCountAggregation(aggregationExpression, searchingColumns);
    quantityPriceAggregation(aggregationExpression, searchingColumns);
    quantityPortAggregation(aggregationExpression, searchingColumns);
    countryPriceQuantityAggregation(aggregationExpression, searchingColumns);
    hsCodePriceQuantityAggregation(aggregationExpression, searchingColumns);
  }

  try {
    let result = await ElasticsearchDbHandler.dbClient.search({
      index: tradeMeta.indexNamePrefix,
      track_total_hits: true,
      body: aggregationExpression,
    });
    const data = getResponseDataForCompany(result);
    data["FILTER_BUYER_SELLER"] = buyerSellerData["FILTER_BUYER_SELLER"];
    return data;
  } catch (error) {
    throw error;
  }
};

async function buyerSellerDataAggregation(
  aggregationExpression,
  searchingColumns,
  tradeMeta,
  matchExpression
) {
  try {
    let subQuery = { ...aggregationExpression };
    buyerSupplierAggregation(subQuery, searchingColumns, (format = false));

    let result = await ElasticsearchDbHandler.dbClient.search({
      index: tradeMeta.indexNamePrefix,
      track_total_hits: true,
      body: subQuery,
    });

    let supplier_data = [];
    for (let record of result?.body?.aggregations?.FILTER_BUYER_SELLER
      ?.buckets) {
      supplier_data.push(record.key);
    }

    let termsQuery = {
      terms: {},
    };

    termsQuery.terms[searchingColumns.sellerName + ".keyword"] = supplier_data;
    subQuery = { ...aggregationExpression };
    buyerSupplierAggregation(subQuery, searchingColumns);
    subQuery.query.bool.must = [termsQuery];
    subQuery.query.bool.must_not = [matchExpression];
    subQuery.size = 0;

    result = await ElasticsearchDbHandler.dbClient.search({
      index: tradeMeta.indexNamePrefix,
      track_total_hits: true,
      body: subQuery,
    });

    const data = getResponseDataForCompany(result);
    return data;
  } catch (error) {
    throw error;
  }
}

function summaryCountAggregation(aggregationExpression, searchingColumns) {
  aggregationExpression.aggs["SUMMARY_TOTAL_SUPPLIER"] = {
    cardinality: {
      field: searchingColumns.sellerName + ".keyword",
    },
  };

  aggregationExpression.aggs["SUMMARY_TOTAL_USD_VALUE"] = {
    sum: {
      field: searchingColumns.priceColumn + ".double",
    },
  };
}

function buyerSupplierAggregation(
  aggregationExpression,
  searchingColumns,
  format = true
) {
  if (!format) {
    aggregationExpression.aggs["FILTER_BUYER_SELLER"] = {
      terms: {
        field: searchingColumns.sellerName + ".keyword",
        size: 10,
      },
    };
  } else
    aggregationExpression.aggs["FILTER_BUYER_SELLER"] = {
      terms: {
        field: searchingColumns.sellerName + ".keyword",
        size: 10,
      },
      aggs: {
        BUYERS: {
          terms: {
            field: searchingColumns.buyerName + ".keyword",
            size: 10,
          },
        },
      },
    };
}

function quantityPortAggregation(aggregationExpression, searchingColumns) {
  aggregationExpression.aggs["FILTER_PORT_QUANTITY"] = {
    terms: {
      field: searchingColumns.portColumn + ".keyword",
      size: 10,
    },
    aggs: {
      PORT_QUANTITY: {
        sum: {
          field: searchingColumns.quantityColumn + ".double",
        },
      },
    },
  };
}

function countryPriceQuantityAggregation(
  aggregationExpression,
  searchingColumns
) {
  aggregationExpression.aggs["FILTER_COUNTRY_PRICE_QUANTITY"] = {
    terms: {
      field: searchingColumns.countryColumn + ".keyword",
    },
    aggs: {
      COUNTRY_QUANTITY: {
        sum: {
          field: searchingColumns.quantityColumn + ".double",
        },
      },
      COUNTRY_PRICE: {
        sum: {
          field: searchingColumns.priceColumn + ".double",
        },
      },
    },
  };
}

function hsCodePriceQuantityAggregation(
  aggregationExpression,
  searchingColumns
) {
  aggregationExpression.aggs["FILTER_HSCODE_PRICE_QUANTITY"] = {
    terms: {
      field: searchingColumns.codeColumn + ".keyword",
    },
    aggs: {
      CODE_QUANTITY: {
        sum: {
          field: searchingColumns.quantityColumn + ".double",
        },
      },
      CODE_PRICE: {
        sum: {
          field: searchingColumns.priceColumn + ".double",
        },
      },
    },
  };
}

function quantityPriceAggregation(aggregationExpression, searchingColumns) {
  aggregationExpression.aggs["FILTER_PRICE_QUANTITY"] = {
    date_histogram: {
      field: searchingColumns.dateColumn,
      calendar_interval: "month",
    },
    aggs: {
      MONTH_PRICE: {
        sum: {
          field: searchingColumns.priceColumn + ".double",
        },
      },
      MONTH_QUANTITY: {
        sum: {
          field: searchingColumns.quantityColumn + ".double",
        },
      },
    },
  };
}

function getResponseDataForCompany(result) {
  let mappedResult = {};
  mappedResult[TradeSchema.RESULT_PORTION_TYPE_RECORDS] = [];
  result.body.hits.hits.forEach((hit) => {
    let sourceData = hit._source;
    sourceData._id = hit._id;
    mappedResult[TradeSchema.RESULT_PORTION_TYPE_RECORDS].push(sourceData);
  });

  mappedResult[TradeSchema.RESULT_PORTION_TYPE_SUMMARY] = [
    {
      _id: null,
      count: result.body.hits.total.value,
    },
  ];
  for (let prop in result.body.aggregations) {
    if (result.body.aggregations.hasOwnProperty(prop)) {
      if (prop.indexOf("FILTER") === 0) {
        let mappingGroups = [];

        if (result.body.aggregations[prop].buckets) {
          result.body.aggregations[prop].buckets.forEach((bucket) => {
            if (bucket.doc_count != null && bucket.doc_count != undefined) {
              let groupedElement = {
                _id:
                  bucket.key_as_string != null &&
                    bucket.key_as_string != undefined
                    ? bucket.key_as_string
                    : bucket.key,
              };
              segregateSummaryData(bucket, groupedElement);

              if (
                bucket.minRange != null &&
                bucket.minRange != undefined &&
                bucket.maxRange != null &&
                bucket.maxRange != undefined
              ) {
                groupedElement.minRange = bucket.minRange.value;
                groupedElement.maxRange = bucket.maxRange.value;
              }

              mappingGroups.push(groupedElement);
            }
          });
        }

        let propElement = result.body.aggregations[prop];
        if (
          propElement.min != null &&
          propElement.min != undefined &&
          propElement.max != null &&
          propElement.max != undefined
        ) {
          let groupedElement = {};
          if (propElement.meta != null && propElement.meta != undefined) {
            groupedElement = propElement.meta;
          }
          groupedElement._id = null;
          groupedElement.minRange = propElement.min;
          groupedElement.maxRange = propElement.max;
          mappingGroups.push(groupedElement);
        }
        if (propElement.value) {
          mappingGroups.push(propElement.value);
        }
        mappedResult[prop] = mappingGroups;
      } else if (
        prop.indexOf("SUMMARY") === 0 &&
        result.body.aggregations[prop].value
      ) {
        mappedResult[prop] = result.body.aggregations[prop].value;
      }
    }
  }

  return mappedResult;
}

function segregateSummaryData(bucket, groupedElement) {
  if (bucket.hasOwnProperty("PORT_QUANTITY")) {
    groupedElement.quantity = bucket["PORT_QUANTITY"].value;
  }

  if (
    bucket.hasOwnProperty("MONTH_PRICE") &&
    bucket.hasOwnProperty("MONTH_QUANTITY")
  ) {
    groupedElement.price = bucket["MONTH_PRICE"].value;
    groupedElement.quantity = bucket["MONTH_QUANTITY"].value;
  }

  if (
    bucket.hasOwnProperty("COUNTRY_PRICE") &&
    bucket.hasOwnProperty("COUNTRY_QUANTITY")
  ) {
    groupedElement.price = bucket["COUNTRY_PRICE"].value;
    groupedElement.quantity = bucket["COUNTRY_QUANTITY"].value;
  }

  if (
    bucket.hasOwnProperty("CODE_PRICE") &&
    bucket.hasOwnProperty("CODE_QUANTITY")
  ) {
    groupedElement.price = bucket["CODE_PRICE"].value;
    groupedElement.quantity = bucket["CODE_QUANTITY"].value;
  }

  if (bucket.BUYERS?.buckets.length > 0) {
    groupedElement.buyers = [];
    groupedElement.buyerCount = bucket.doc_count;
    bucket.BUYERS?.buckets.forEach((bucket) => {
      if (bucket.doc_count != null && bucket.doc_count != undefined) {
        let nestedElement = {
          _id:
            bucket.key_as_string != null && bucket.key_as_string != undefined
              ? bucket.key_as_string
              : bucket.key,
          subBuyerCount: bucket.doc_count,
        };
        if (
          bucket.minRange != null &&
          bucket.minRange != undefined &&
          bucket.maxRange != null &&
          bucket.maxRange != undefined
        ) {
          nestedElement.minRange = bucket.minRange.value;
          nestedElement.maxRange = bucket.maxRange.value;
        }
        groupedElement.buyers.push(nestedElement);
      }
    });
  }
}

async function getExploreExpressions(country, tradeType) {
  try {
    const taxonomyData = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.taxonomy)
      .aggregate([
        {
          $match: {
            country:
              country.charAt(0).toUpperCase() + country.slice(1).toLowerCase(),
            trade: tradeType.toUpperCase(),
          },
        },
        {
          $project: {
            "fields.explore_aggregation.sortTerm": 1,
            "fields.explore_aggregation.groupExpressions": 1,
          },
        },
      ])
      .toArray();

    return taxonomyData ? taxonomyData[0].fields.explore_aggregation : null;
  } catch (error) {
    throw error;
  }
}

async function getDaySearchLimit(accountId) {
  const aggregationExpression = [
    {
      $match: {
        account_id: ObjectID(accountId),
        max_query_per_day: {
          $exists: true,
        },
      },
    },
    {
      $project: {
        max_query_per_day: 1,
        _id: 0,
      },
    },
  ];

  try {
    let limitDetails = await MongoDbHandler.getDbInstance()
      .collection(accountLimitsCollection)
      .aggregate(aggregationExpression)
      .toArray();

    return limitDetails[0];
  } catch (error) {
    throw error;
  }
}

async function updateDaySearchLimit(accountId, updatedDaySearchLimits) {
  const matchClause = {
    account_id: ObjectID(accountId),
    max_query_per_day: {
      $exists: true,
    },
  };

  const updateClause = {
    $set: updatedDaySearchLimits,
  };

  try {
    let limitUpdationDetails = await MongoDbHandler.getDbInstance()
      .collection(accountLimitsCollection)
      .updateOne(matchClause, updateClause);

    return limitUpdationDetails;
  } catch (error) {
    throw error;
  }
}

async function getSummaryLimit(accountId) {
  const aggregationExpression = [
    {
      $match: {
        account_id: ObjectID(accountId),
        max_summary_limit: {
          $exists: true,
        },
      },
    },
    {
      $project: {
        max_summary_limit: 1,
        _id: 0,
      },
    },
  ];

  try {
    let limitDetails = await MongoDbHandler.getDbInstance()
      .collection(accountLimitsCollection)
      .aggregate(aggregationExpression)
      .toArray();

    return limitDetails[0];
  } catch (error) {
    throw error;
  }
}

async function updateSummaryLimit(accountId, updatedSummaryLimits) {
  const matchClause = {
    account_id: ObjectID(accountId),
    max_summary_limit: {
      $exists: true,
    },
  };

  const updateClause = {
    $set: updatedSummaryLimits,
  };

  try {
    let limitUpdationDetails = await MongoDbHandler.getDbInstance()
      .collection(accountLimitsCollection)
      .updateOne(matchClause, updateClause);

    return limitUpdationDetails;
  } catch (error) {
    throw error;
  }
}

const checkSortSchema = async (payload) => {
  try {
    let matchExpression = {};
    matchExpression.taxonomy_id = ObjectID(
      payload.taxonomy ? payload.taxonomy._id : null
    );

    let result = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.sortSchema)
      .find(matchExpression)
      .toArray();

    return result;
  } catch (error) {
    throw error;
  }
};

const createSortSchema = async (payload) => {
  try {
    let insertData = {};
    insertData.country = payload.taxonomy.country;
    insertData.trade = payload.taxonomy.trade;
    insertData.sortMapping = payload.sortMapping;
    insertData.taxonomy_id = ObjectID(payload.taxonomy._id);

    let created = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.sortSchema)
      .insertOne(insertData);

    insertData._id = created.insertedId;
    return [insertData];
  } catch (error) {
    throw error;
  }
};

const getSortMapping = async (payload) => {
  try {
    let index;
    if (payload.taxonomy.bl_flag === false) {
      index = TradeSchema.deriveDataBucket(
        payload.taxonomy.trade,
        payload.taxonomy.country
      );
    } else {
      index = payload.taxonomy.bucket
        ? payload.taxonomy.bucket + "*"
        : "bl" + payload.taxonomy.trade + "*";
    }
    let body = await ElasticsearchDbHandler.dbClient.indices.getMapping({
      index,
    });
    return body.body;
  } catch (error) {
    throw error;
  }
};

const findCountrySummary = async (taxonomy_id) => {
  try {
    let matchExpression = {
      taxonomy_id: ObjectID(taxonomy_id),
    };
    let result = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.summary)
      .find(matchExpression)
      .toArray();

    return result;
  } catch (error) {
    throw error;
  }
};

async function createSummaryForNewCountry(taxonomy_id) {
  try {
    let summary;
    let aggregation = [
      {
        $match: {
          _id: ObjectID(taxonomy_id),
        },
      },
      {
        $project: {
          _id: 1,
          country: 1,
          trade: 1,
          "fields.explore_aggregation.matchExpressions": 1,
        },
      },
      {
        $unwind: {
          path: "$fields.explore_aggregation.matchExpressions",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $match: {
          "fields.explore_aggregation.matchExpressions.identifier": {
            $in: [
              "SEARCH_HS_CODE",
              "SEARCH_BUYER",
              "FILTER_PRICE",
              "FILTER_PORT",
              "SEARCH_SELLER",
              "SEARCH_MONTH_RANGE",
              "FILTER_UNIT",
              "FILTER_QUANTITY",
              "FILTER_COUNTRY",
            ],
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          country: {
            $first: "$$ROOT.country",
          },
          trade: {
            $first: "$$ROOT.trade",
          },
          match: {
            $push: "$$ROOT.fields.explore_aggregation.matchExpressions",
          },
        },
      },
    ];
    const results = await MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.taxonomy)
      .aggregate(aggregation, {
        allowDiskUse: true,
      })
      .toArray();
    if (results.length > 0) {
      for (let result of results) {
        let insertDate = {
          taxonomy_id: result._id,
          country: result.country,
          trade: result.trade,
          matchExpression: result.match,
        };
        let insert = await MongoDbHandler.getDbInstance()
          .collection(MongoDbHandler.collections.summary)
          .insertOne(insertDate);

        summary = findCountrySummary(taxonomy_id);
      }
    }

    return summary;
  } catch (error) {
    throw error;
  }
}


async function getRecordscount(payload) {
  try {
    const adxAccessToken = await getADXAccessToken();
    let recordQuerycount;
    // let recordQuerycount = formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax(payload) + "| count";
    // console.log("record count", recordQuerycount)

    if (payload.country === "INDIA" && payload.matchExpressions[1]["dateExpression"] == 2){
      let recordDataQueryMain = `let data_1 = (`+formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax(payload, 1)+`);`
      let recordDataQueryHot = `let data_2 =(`+formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax(payload, 2)+ `);`;
      recordQuerycount  = recordDataQueryMain + recordDataQueryHot + `union data_1 , data_2 | count `
    }
    else if(payload.country === "INDIA" && payload.matchExpressions[1]["dateExpression"] == 1){
      recordQuerycount  =  formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax(payload,2) + `| count`
    }
   else{
    recordQuerycount  =  formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax(payload,0) + `| count`
    }
    let resolved_count = await adxQueryExecuter(recordQuerycount, adxAccessToken);
    let resolved_count_res = JSON.parse(resolved_count)
    let recordDataQuerycount = resolved_count_res["Tables"][0]["Rows"];
    finalResult = {
      "data": recordDataQuerycount
    }
    return finalResult;
  }
  catch (err) {
    const recordcount = [[0]];
    console.log("Internal server error")
    finalResult = {
      "data": recordcount
    }
    return finalResult;
  }
}

/** returning indices from cognitive search, optimized function. */
async function RetrieveAdxDataOptimized(payload) {
  try {
    let recordDataQuery;
    const adxAccessToken = await getADXAccessToken();

    // if country is india and it involves both hot table and new table
    if (payload.country === "INDIA" && payload.matchExpressions[1]["dateExpression"] == 2){
          let recordDataQueryMain = `let data_1 = (`+formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax(payload, 1) + "| order by " + payload["sortTerms"][0]["sortField"] + " " + payload["sortTerms"][0]["sortType"]+`|take 100);`;
          let recordDataQueryHot = `let data_2 =(`+formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax(payload, 2)+ "| order by " +  payload["sortTerms"][0]["sortField"] + " " + payload["sortTerms"][0]["sortType"]+`|take 100);`;
          recordDataQuery  = recordDataQueryMain + recordDataQueryHot + `union data_1 , data_2`
          console.log(recordDataQuery)
    }
    else if(payload.country === "INDIA" && payload.matchExpressions[1]["dateExpression"] == 1){
       recordDataQuery  =  formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax(payload,2)
       console.log("record data", recordDataQuery)
    }
    else{
      recordDataQuery  =  formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax(payload,0)
    }
    
    // Adding limit to the query records
    // recordDataQuery += " | take " + limit;

    // removing summary from record query
    // let summaryDataQuery = recordDataQuery + " | summarize SUMMARY_RECORDS = count()" + formulateAdxSummaryRecordsQueries(payload);

    const limit = Number(payload.length) ?? 10;
    const offset = Number(payload.start) ?? 0;

    recordDataQuery = "set query_results_cache_max_age = time(15m);" + recordDataQuery;

    // Adding sorting
    recordDataQuery += " | order by " + payload["sortTerms"][0]["sortField"] + " " + payload["sortTerms"][0]["sortType"]
    console.log("record query",recordDataQuery)

    // Adding pagination
    // recordDataQuery += ` | serialize index = row_number() | where index between (${offset + 1} .. ${limit + offset})`
    recordDataQuery += " | take 100"
    // console.time("time starts")
    let resolved = await Promise.all([adxQueryExecuter(recordDataQuery, adxAccessToken)]);
    // console.timeEnd("time starts")  
    let recordDataQueryResult = JSON.parse(resolved['0']);
    recordDataQueryResult = mapAdxRowsAndColumns(recordDataQueryResult["Tables"][0]["Rows"], recordDataQueryResult["Tables"][0]["Columns"]);

    // removing summary from record query
    // let summaryDataQueryResult = await kustoClient.execute(process.env.AdxDbName, summaryDataQuery);
    // let summaryDataQueryResult = JSON.parse(resolved['1']);
    // summaryDataQueryResult = mapAdxRowsAndColumns(summaryDataQueryResult["Tables"][0]["Rows"], summaryDataQueryResult["Tables"][0]["Columns"]);

    finalResult = {
      "data": recordDataQueryResult
    }

    return finalResult;
  } catch (error) {
    console.log(error);
    // For testing Purpose
    finalResult = {
      "data": [],
      "summary": []
    }

    return finalResult;
  }
}

/** retrieve records summary */
async function RetrieveAdxDataSummary(payload) {
  try {
    const adxAccessToken = await getADXAccessToken();
    let recordDataQuery;

    if (payload.country === "INDIA" && payload.matchExpressions[1]["dateExpression"] == 2){
      let recordDataQueryMain = `let data_1 = (`+formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax(payload, 1) + `);`;
      let recordDataQueryHot = `let data_2 =(`+formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax(payload, 2)+ `);`;
      recordDataQuery  = recordDataQueryMain + recordDataQueryHot + `union data_1 , data_2`
      }
      else if(payload.country === "INDIA" && payload.matchExpressions[1]["dateExpression"] == 1){
        recordDataQuery  =  formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax(payload,2)
      }
     else{
       recordDataQuery  =  formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax(payload,0)
      }
     

    // let recordDataQuery = formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax(payload)
    // console.log(recordDataQuery);
    // Adding limit to the query records
    // recordDataQuery += " | take " + limit;

    let summaryDataQuery = "set query_results_cache_max_age = time(15m);" + recordDataQuery + " | summarize SUMMARY_RECORDS = count()" + formulateAdxSummaryRecordsQueries(payload) + ";";
    // console.log("Summary data query",summaryDataQuery)
    let summaryDataQueryResult = await adxQueryExecuter(summaryDataQuery, adxAccessToken)
    summaryDataQueryResult = JSON.parse(summaryDataQueryResult);
    summaryDataQueryResult = mapAdxRowsAndColumns(summaryDataQueryResult["Tables"][0]["Rows"], summaryDataQueryResult["Tables"][0]["Columns"]);

    finalResult = {
      "summary": summaryDataQueryResult
    }

    return finalResult;
  } catch (error) {
    console.log(error);
    // For testing Purpose
    finalResult = {
      "data": [],
      "summary": []
    }

    return finalResult;
  }
}

async function RetrieveAdxDataSuggestions(payload) {
  try {
    const adxAccessToken = await getADXAccessToken();
    let bucket = getSearchBucket(payload.countryCode, payload.tradeType);

    if(payload.dateExpression == 1){
      bucket+= `Hot`
    }
    let recordDataQuery = bucket + " | where tostring(" + payload?.searchField + ") startswith '" + payload.searchTerm + "' | where "
    if(payload.dateExpression == 1){
      recordDataQuery += payload.dateField + " between (todatetime('" +payload?.dividedDateRange[0]['leftFieldvalueHot'] + "') .. todatetime('" + payload?.dividedDateRange[0]['rightFieldValueHot'] + "'))";    
    }else{
       // Adding date condition
    recordDataQuery += payload.dateField + " between (todatetime('" + payload?.startDate + "') .. todatetime('" + payload?.endDate + "'))";    
    }
    // adding search aggregations
    recordDataQuery += " | summarize count() by " + payload?.searchField + " | top 5 by count_ desc";

    console.log(recordDataQuery);
    let recordDataQueryResult = await adxQueryExecuter(recordDataQuery, adxAccessToken);

    recordDataQueryResult = JSON.parse(recordDataQueryResult)["Tables"][0]["Rows"].map(row => {
      const obj = {};
      JSON.parse(recordDataQueryResult)["Tables"][0]["Columns"].forEach((column, index) => {
        if (column["ColumnName"] == payload?.searchField) {
          obj["_id"] = [...row][index];
        }
      });
      return obj;
    });

    // adding HS_code into final result condition
    // if (payload.searchField === "HS_CODE") {
    //   recordDataQueryResult.unshift({ _id: payload.searchTerm });
    // }

    finalResult = {
      "data": recordDataQueryResult
    }

    return finalResult;
  } catch (error) {
    console.log(error);
  }
}

async function RetrieveAdxDataFiltersUsingMaterialize(payload) {
  try {
    let adxToken = await getADXAccessToken()
    let timeStart = Date.now()
    let recordDataQuery;
    let filteredData;
    let recordDataQueryMain;
    let recordDataQueryHot;
    let clause;

    let priceObject = payload.groupExpressions.find((o) => o.identifier === "FILTER_CURRENCY_PRICE_USD");

    if (payload.country === "INDIA" && payload.matchExpressions[1]["dateExpression"] == 2){
       recordDataQueryMain = `let recordDataQueryMain = materialize(`+formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax(payload, 1)+`);`;
       recordDataQueryHot = `let recordDataQueryHot = materialize(`+formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax(payload, 2)+`);`;
      
      recordDataQuery  = `let filteredData = recordDataQueryMain | union  recordDataQueryHot` ;
      }
      else if(payload.country === "INDIA" && payload.matchExpressions[1]["dateExpression"] == 1){
        recordDataQuery  =  formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax(payload,2)
     }
     else{
       recordDataQuery  =  formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax(payload,0)
     }

    // let recordDataQuery = formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax(payload);

    let hscode = "";
    let country = "";
    let port = "";
    let foreignPorts = "";
    let months = "";
    let quantity = "";
    // let duty = "";
    // let currencyInr = "";
    // let currencyUsd = "";
    if (payload.matchExpressions[1]["dateExpression"] == 2 && payload.country === "INDIA"){
      filteredData = recordDataQueryMain + recordDataQueryHot + recordDataQuery;
    }
    let project = " | project " + priceObject.fieldTerm + ", "
    /** @type {{identifier: string, filter: object}[]} */
    const filtersArr = []
    if (payload.groupExpressions) {
      for (let groupExpression of payload.groupExpressions) {
        if (groupExpression.identifier == "FILTER_HS_CODE") {
          project += groupExpression.fieldTerm + ", ";
          hscode += "filteredData | summarize totalAmount = sum(" + priceObject["fieldTerm"] + ") , count = count() by FILTER_HS_CODE = " + groupExpression.fieldTerm + ";";
        }
        if (groupExpression.identifier == "FILTER_PORT") {
          project += groupExpression.fieldTerm + ", ";
          port = 'filteredData| summarize totalAmount = sum(' + priceObject["fieldTerm"] + ') , count = count() by FILTER_PORT = ' + groupExpression.fieldTerm + ';';
        }
        if (groupExpression.identifier == "FILTER_COUNTRY") {
          project += groupExpression.fieldTerm + ", ";
          country = 'filteredData | summarize count = count(), totalAmount = sum(' + priceObject["fieldTerm"] + ') by FILTER_COUNTRY = ' + groupExpression.fieldTerm + ';';
        }
        if (groupExpression.identifier == "FILTER_FOREIGN_PORT") {
          project += groupExpression.fieldTerm + ", ";
          foreignPorts = 'filteredData | summarize count = count(), totalAmount =sum(' + priceObject["fieldTerm"] + ') by FILTER_FOREIGN_PORT = ' + groupExpression.fieldTerm + ';';
        }
        if (groupExpression.identifier == "FILTER_MONTH") {
          project += groupExpression.fieldTerm + ", ";
          months = 'filteredData | extend FILTER_MONTH = format_datetime(' + groupExpression.fieldTerm + ', "yyyy-MM") | summarize count = count(), totalAmount = sum(' + priceObject["fieldTerm"] + ') by FILTER_MONTH;';
        }

        if (groupExpression.identifier == "FILTER_UNIT_QUANTITY") {
          project += groupExpression.fieldTermPrimary + ", " + groupExpression.fieldTermSecondary + ", ";
          quantity = `filteredData | summarize minRange = min(${groupExpression.fieldTermSecondary}), maxRange = max(${groupExpression.fieldTermSecondary}) by FILTER_UNIT_QUANTITY = ${groupExpression.fieldTermPrimary};`
        }

        // if (groupExpression.identifier == "FILTER_CURRENCY_PRICE_INR") {
        //   currencyInr = " filteredData | " + " summarize minRange = min(" + priceObject["fieldTerm"] + "), maxRange = max(" + groupExpression["fieldTerm"] + "), totalAmount = sum(" + priceObject["fieldTerm"] + ") by " + " FILTER_CURRENCY_PRICE_INR = " + priceObject["fieldTerm"] + ";";
        // }

        // if (groupExpression.identifier == "FILTER_CURRENCY_PRICE_USD") {
        //   currencyUsd = " filteredData | " + " summarize minRange = min(" + priceObject["fieldTerm"] + "), maxRange = max(" + groupExpression["fieldTerm"] + "), totalAmount = sum(" + priceObject["fieldTerm"] + ") by " + " FILTER_CURRENCY_PRICE_USD = " + priceObject["fieldTerm"] + ";";
        // }

        // if (groupExpression.identifier == "FILTER_DUTY") {
        //   duty = " filteredData | " + " summarize minRange = min(" + priceObject["fieldTerm"] + "), maxRange = max(" + groupExpression["fieldTerm"] + "), totalAmount = sum(" + priceObject["fieldTerm"] + ") by " + " FILTER_DUTY = " + priceObject["fieldTerm"] + ";";
        // }
        else {
          continue;
        }
      }
    };

    recordDataQuery += (project.substring(0, project.length - 2));
    if(payload.matchExpressions[1]["dateExpression"] != 2 ){
        filteredData = "materialize( " + recordDataQuery + " );";
        clause = ` set query_results_cache_max_age = time(15m); let filteredData = ${filteredData}`;
    }
    if((payload.matchExpressions[1]["dateExpression"] == 2 && payload.country != "INDIA") || (payload.matchExpressions[1]["dateExpression"] == 1 && payload.country != "INDIA") || (payload.matchExpressions[1]["dateExpression"] == 0 && payload.country != "INDIA") ){
      filteredData = "materialize( " + recordDataQuery + " );";
      clause = ` set query_results_cache_max_age = time(15m); let filteredData = ${filteredData}`;
    }
    if(payload.matchExpressions[1]["dateExpression"] == 2 && payload.country === "INDIA"){
      clause = ` set query_results_cache_max_age = time(15m); ${filteredData};`
    }
    //  clause = ` set query_results_cache_max_age = time(15m); let filteredData = ${filteredData}`
    // let duty = ${duty} let currencyInr = ${currencyInr} let currencyUsd = ${currencyUsd}
    if (payload.groupExpressions) {
      for (let groupExpression of payload.groupExpressions) {
        if (groupExpression.identifier == "FILTER_HS_CODE") {
          clause += `let hscode = ${hscode}`
        }
        if (groupExpression.identifier == "FILTER_COUNTRY") {
          clause += `let country = ${country}`
        }
        if (groupExpression.identifier == "FILTER_PORT") {
          clause += `let port = ${port}`
        }
        if (groupExpression.identifier == "FILTER_FOREIGN_PORT") {
          clause += `let foreignPorts = ${foreignPorts}`

        }
        if (groupExpression.identifier == "FILTER_MONTH") {
          clause += `let months = ${months}`
        }

        if (groupExpression.identifier == "FILTER_UNIT_QUANTITY") {
          clause += `let quantity = ${quantity}`
        }
      }
    }
    // union according to the specified columns
    clause += `union` + ` `
    let identifiers = [];
    for (let groupExpression of payload.groupExpressions) {
      if (groupExpression.identifier == "FILTER_COUNTRY") {
        identifiers.push('country');
      }
      if (groupExpression.identifier == "FILTER_PORT") {
        identifiers.push('port');
      }
      if (groupExpression.identifier == "FILTER_FOREIGN_PORT") {
        identifiers.push('foreignPorts');
      }
      if (groupExpression.identifier == "FILTER_MONTH") {
        identifiers.push('months');
      }
      if (groupExpression.identifier == "FILTER_UNIT_QUANTITY") {
        identifiers.push('quantity');
      }
      if (groupExpression.identifier == "FILTER_HS_CODE") {
        identifiers.push('hscode');
      }
    }

    // Join the identifiers with commas and add to the clause
    clause += identifiers.join(',');
    console.log("filter query",clause)
    //  console.log("filter query", clause)
    //  clause+= `,${clause}`;
    // duty, currencyInr, currencyUsd
    // clause += `union hscode, country, port, foreignPorts, months, quantity`
    let results = await adxQueryExecuter(clause, adxToken);
    results = JSON.parse(results);

    let mappedResults = mapMaterializedAdxRowsAndColumns(results.Tables[0].Columns, results.Tables[0].Rows)

    finalResult = {
      "filter": mappedResults
    }

    let timeEnd = Date.now()
    console.log(timeEnd - timeStart)
    return finalResult;
  } catch (error) {
    console.log(JSON.stringify(error));
    //For testing
    finalResult = {
      "filter": []
    }
    return finalResult;
  }
}

function mapMaterializedAdxRowsAndColumns(cols, rows) {
  // FILTER_COUNTRY_AMOUNT: [],
  // FILTER_CURRENCY_PRICE_USD: [],
  // FILTER_CURRENCY_PRICE_INR: [],
  // FILTER_CURRENCY: [],
  // FILTER_DUTY: [],
  let columnsObj = {
    FILTER_COUNTRY: [],
    FILTER_FOREIGN_PORT: [],
    FILTER_PORT: [],
    FILTER_MONTH: [],
    FILTER_HS_CODE: [],
    FILTER_UNIT_QUANTITY: [],
  }

  let countIndex = 0;
  let amountIndex = 0;
  let minRange = 0;
  let maxRange = 0;

  cols.map((col, i) => {
    if (col.ColumnName == 'count') {
      countIndex = i;
    }
    if (col.ColumnName == 'totalAmount') {
      amountIndex = i;
    }
    if (col.ColumnName == 'minRange') {
      minRange = i;
    }
    if (col.ColumnName == 'maxRange') {
      maxRange = i;
    }
  });
  cols?.map((col, i) => {
    rows?.forEach((row) => {
      if (!(col.ColumnName == 'count' || col.ColumnName == 'totalAmount')) {

        // if (col.ColumnName == "FILTER_CURRENCY_PRICE_INR" || col.ColumnName == "FILTER_CURRENCY_PRICE_USD" || col.ColumnName == "FILTER_DUTY") {
        //   if (row?.[minRange] && row?.[maxRange] && row?.[amountIndex]) {
        //     let obj = {
        //       "_id": null,
        //       "minRange": row?.[minRange],
        //       "maxRange": row?.[maxRange],
        //       "totalSum": row?.[amountIndex],
        //       "metaTag": (col?.ColumnName == "FILTER_DUTY") ? [{ "currency": "" }] : [{ "currency": col?.ColumnName === "FILTER_CURRENCY_PRICE_INR" ? "INR" : "USD" }],
        //       "aggs": { "totalSum": { "sum": { "field": "FOB_USD.double" } } }
        //     };
        //     columnsObj?.[col?.ColumnName]?.push(obj)
        //   }
        // } 
        // else {
        if (row[i] != '') {
          let obj = {
            _id: row[i],
            count: row[countIndex],
            totalSum: row[amountIndex]
          }

          if (row?.[minRange]) {
            obj.minRange = row[minRange]
          }
          if (row?.[maxRange]) {
            obj.maxRange = row[maxRange]
          }
          columnsObj?.[col?.ColumnName]?.push(obj)
        }
        // }
      }
    })
  })
  return columnsObj;
}

async function RetrieveAdxDataFilters(payload) {
  try {
    const adxAccessToken = await getADXAccessToken();

    let recordDataQuery = formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax(payload);

    let priceObject = payload.groupExpressions.find(
      (o) => o.identifier === "FILTER_CURRENCY_PRICE_USD"
    );
    let filtersResolved = {}

    /** @type {{identifier: string, filter: object}[]} */
    const filtersArr = []
    if (payload.groupExpressions) {
      for (let groupExpression of payload.groupExpressions) {
        let filterQuery = "";
        // filterQuery += "let identifier = '" + groupExpression.identifier + "'";
        let oldKey = groupExpression["fieldTerm"];
        if (groupExpression.identifier == 'FILTER_UNIT_QUANTITY') {
          oldKey = groupExpression["fieldTermPrimary"];
          filterQuery = recordDataQuery + " | summarize Count = count(), minRange = min(" + groupExpression["fieldTermSecondary"] + "), maxRange = max(" + groupExpression["fieldTermSecondary"] + ") , TotalAmount = sum(" + priceObject["fieldTerm"] + ") by " + groupExpression["fieldTermPrimary"];
        }
        else if (groupExpression.identifier == 'FILTER_MONTH') {
          filterQuery = recordDataQuery + " | extend MonthYear = format_datetime(" + groupExpression["fieldTerm"] + ", 'yyyy-MM') | summarize Count = count(), TotalAmount = sum(" + priceObject["fieldTerm"] + ") by MonthYear";
        }
        else if (groupExpression.identifier == "FILTER_CURRENCY_PRICE_INR" || groupExpression.identifier == "FILTER_CURRENCY_PRICE_USD" || groupExpression.identifier == "FILTER_DUTY") {
          filterQuery = recordDataQuery + " | extend Currency = '" + groupExpression["fieldTerm"].split("_")[1] + "' | summarize minRange = min(" + groupExpression["fieldTerm"] + "), maxRange = max(" + groupExpression["fieldTerm"] + "), TotalAmount = sum(" + groupExpression["fieldTerm"] + ")";
        }
        else if (groupExpression.identifier.includes("FILTER")) {
          filterQuery = recordDataQuery + " | summarize Count = count() , TotalAmount = sum(" + priceObject["fieldTerm"] + ") by " + groupExpression["fieldTerm"];
        }
        else {
          continue;
        }

        // push filters into filtersArray without resolving them with their identifier!
        filtersArr.push({ filter: adxQueryExecuter(filterQuery, adxAccessToken), identifier: groupExpression.identifier })
      };

      // resolve all the filters.
      const filteredResultsResolved = await Promise.all(filtersArr.map((filter) => filter?.filter));

      // loop over group expressions and map the filters.
      for (let expression of payload.groupExpressions) {
        // loop over filters array to match identifier with groupExpression
        let index = 0;
        for (let filter of filtersArr) {
          // if identifier matches the we will break the loop so I will not iterate till the end of the filtersArray
          if (filter?.identifier === expression?.identifier) {
            getADXFilterResults(expression, filteredResultsResolved[index], filtersResolved)
            index++;
            break;
          } else {
            index++;
          }
        }
      }
    }

    finalResult = {
      "filter": filtersResolved
    }
    console.log(new Date().getSeconds())
    return finalResult;
  } catch (error) {
    console.log(error);
    //For testing
    finalResult = {
      "filter": []
    }

    return finalResult;
  }
}

let mapCountryToAdxTableName = {
  "SRILANKA": "SriLanka",
  "USA": "USA",
  "SOUTH_SUDAN": "SouthSudan",
  "IVORY_COAST": "IvoryCoast",
  "VIETNAM_2022": "Vietnam",
  "BL_BRAZIL": "BLBrazil",
  "BL": "BL"
}

function getSearchBucket(country, tradetype) {
  let bucket = country[0].toUpperCase() + country.slice(1, country.length).toLowerCase() + tradetype?.[0] + tradetype.slice(1, tradetype.length).toLowerCase();


  if (country in mapCountryToAdxTableName){
    bucket = mapCountryToAdxTableName[country] + tradetype?.[0] + tradetype.slice(1, tradetype.length).toLowerCase();
  }  

  return bucket;
}

function mapAdxRowsAndColumns(rows, columns) {
  const mappedDataResult = rows.map(row => {
    const obj = {};
    columns.forEach((column, index) => {
      obj[column["ColumnName"]] = [...row][index];
    });
    return obj;
  });

  return mappedDataResult
}

function mapFilterAdxRowsAndColumns(rows, columns) {
  const mappedDataResult = rows.map(row => {
    return {
      "_id": row[0],
      "count": row[1],
      "totalSum": row[2]
    }
  });

  return mappedDataResult
}

// To get the pattern for exact searching
const generateRegexPattern = (words) => {
  const escapedWords = words.map(word => word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
  const wordBoundaries = escapedWords.map(word => `\\\\b${word}\\\\b`);
  const pattern = wordBoundaries.join(`[^\\\\w]*`);

  return `strcat ('(?i)${pattern}')`;
}

function getADXFilterResults(groupExpression, filterQueryResult, filterDataQueryResult) {
  if (groupExpression.identifier == "FILTER_CURRENCY_PRICE_INR" ||
    groupExpression.identifier == "FILTER_CURRENCY_PRICE_USD" ||
    groupExpression.identifier == "FILTER_DUTY") {
    filterDataQueryResult[groupExpression["identifier"]] = [];
    for (let row of JSON.parse(filterQueryResult)["Tables"][0]["Rows"]) {
      let currencyResult = {
        "_id": null,
        "minRange": row[0],
        "maxRange": row[1],
        "totalSum": row[2],
        "metaTag": (groupExpression.identifier == "FILTER_DUTY") ? [{ "currency": "" }] : [{ "currency": groupExpression["fieldTerm"].split("_")[1] }],
        "aggs": { "totalSum": { "sum": { "field": "FOB_USD.double" } } }
      };
      filterDataQueryResult[groupExpression["identifier"]].push(currencyResult);
    }
  }
  else if (groupExpression.identifier == "FILTER_UNIT_QUANTITY") {
    filterDataQueryResult[groupExpression["identifier"]] = [];
    for (let row of JSON.parse(filterQueryResult)["Tables"][0]["Rows"]) {
      let quantityResult = {
        "_id": row[0],
        "count": row[1],
        "minRange": row[2],
        "maxRange": row[3],
        "totalSum": row[4]
      };
      filterDataQueryResult[groupExpression["identifier"]].push(quantityResult);
    }
  }
  else {
    filterQueryResult = mapFilterAdxRowsAndColumns(JSON.parse(filterQueryResult)["Tables"][0]["Rows"], JSON.parse(filterQueryResult)["Tables"][0]["Columns"]);
    filterDataQueryResult[groupExpression["identifier"]] = filterQueryResult;
  }
  return filterQueryResult;
}

function formulateAdxSummaryRecordsQueries(data) {
  let query = "";
  if (data.groupExpressions) {
    data.groupExpressions.forEach((groupExpression) => {
      if (groupExpression.identifier.includes("SUMMARY")) {
        query += ", " + groupExpression["identifier"] + " = count_distinct(" + groupExpression["fieldTerm"] + ")"
      }
    });
  }

  return query;
}

function formulateAdxRawSearchRecordsQueries(data) {
  let isQuantityApplied = false;
  let quantityFilterValues = [];
  let priceFilterValues = [];
  let query = getSearchBucket(data.country, data.tradeType);

  if (data.matchExpressions.length > 0) {
    for (let matchExpression of data.matchExpressions) {

      if (matchExpression["identifier"] == "FILTER_UNIT") {
        isQuantityApplied = matchExpression["fieldTerm"];
        continue;
      }

      if (matchExpression["identifier"] == 'FILTER_QUANTITY') {
        quantityFilterValues.push({
          "unitTerm": isQuantityApplied,
          "unit": matchExpression["unit"],
          "fieldTerm": matchExpression["fieldTerm"],
          "fieldValueLeft": matchExpression["fieldValueLeft"],
          "fieldValueRight": matchExpression["fieldValueRight"]
        });
        continue;
      }

      if (matchExpression["identifier"] == 'FILTER_PRICE') {
        priceFilterValues.push(matchExpression);
        continue;
      }

      if (matchExpression["expressionType"] != 300) {
        query += " | where ";
      }

      if (matchExpression["expressionType"] == 103 && matchExpression["fieldValueArr"].length > 0) {
        let count = matchExpression["fieldValueArr"].length;
        for (let value of matchExpression["fieldValueArr"]) {
          query += "tolong(" + matchExpression["fieldTerm"] + ") between (" + value["fieldValueLeft"] + " .. " + value["fieldValueRight"] + ")";
          count -= 1;
          if (count != 0) {
            query += " | union ";
          }
        }
      }
      else if ((matchExpression["expressionType"] == 102 || matchExpression["expressionType"] == 206) && matchExpression["fieldValue"].length > 0) {
        let count = matchExpression["fieldValue"].length;
        query += matchExpression["fieldTerm"] + " in (";

        for (let value of matchExpression["fieldValue"]) {
          query += "'" + value + "'";
          count -= 1;
          if (count != 0) {
            query += " , "
          }
        }

        query += ")";
        // for (let value of matchExpression["fieldValue"]) {
        //   query += matchExpression["fieldTerm"] + " == '" + value + "'";
        //   count -= 1;
        //   if (count != 0) {
        //     query += "| union "
        //   }
        // }
      }
      else if (matchExpression["expressionType"] == 200) {
        if (matchExpression["fieldValue"].length > 0) {
          let count = matchExpression["fieldValue"].length;
          for (let value of matchExpression["fieldValue"]) {
            let regexPattern = "strcat('(?i).*\\\\b', replace_string('" + value + "', ' ', '\\\\b.*\\\\b'), '\\\\b.*')";
            query += matchExpression["fieldTerm"] + " matches regex " + regexPattern;
            count -= 1;
            if (count != 0) {
              query += "| union "
            }
          }
        }
      }
      else if (matchExpression["expressionType"] == 201 && matchExpression["fieldValue"].length > 0) {
        let count = matchExpression["fieldValue"].length;
        for (let value of matchExpression["fieldValue"]) {
          let words = value.split(" ");
          let innerCount = words.length;
          let word = "";
          for (let val of words) {
            word += "'" + val + "'"
            innerCount -= 1;
            if (innerCount != 0) {
              word += " , ";
            }
          }
          query += matchExpression["fieldTerm"] + " has_any (" + word + ")";
          count -= 1;
          if (count != 0) {
            query += "| union ";
          }
        }
      }
      else if (matchExpression["expressionType"] == 202 && matchExpression["fieldValue"].length > 0) {
        let count = matchExpression["fieldValue"].length;
        for (let value of matchExpression["fieldValue"]) {
          let words = value.split(" ");
          let innerCount = words.length;
          let word = "";
          for (let val of words) {
            word += "'" + val + "'"
            innerCount -= 1;
            if (innerCount != 0) {
              word += " , ";
            }
          }
          query += matchExpression["fieldTerm"] + " has_all (" + word + ")";
          count -= 1;
          if (count != 0) {
            query += "| join kind=inner ";
          }
        }
      }
      else if (matchExpression["expressionType"] == 203 && matchExpression["fieldValue"].length > 0) {
        let count = matchExpression["fieldValue"].length;
        for (let value of matchExpression["fieldValue"]) {
          let words = value.split(" ");
          let innerCount = words.length;
          let word = "";
          for (let val of words) {
            word += "'" + val + "'"
            innerCount -= 1;
            if (innerCount != 0) {
              word += " , ";
            }
          }
          query += matchExpression["fieldTerm"] + " has_all (" + word + ")";
          count -= 1;
          if (count != 0) {
            query += "| union ";
          }
        }
      }
      else if (matchExpression["expressionType"] == 204 && matchExpression["fieldValue"].length > 0) {
        let count = matchExpression["fieldValue"].length;
        for (let value of matchExpression["fieldValue"]) {
          let valueArray = value.split(" ");
          let innerCount = valueArray.length;
          for (let val of valueArray) {
            query += matchExpression["fieldTerm"] + " contains '" + val + "'";
            innerCount -= 1;
            if (innerCount != 0) {
              query += " and ";
            }
          }
          count -= 1;
          if (count != 0) {
            query += " | union "
          }
        }
      }
      else if (matchExpression["expressionType"] == 301 && matchExpression["fieldValues"].length > 0) {
        let count = matchExpression["fieldValues"].length;
        for (let value of matchExpression["fieldValues"]) {
          query += matchExpression["fieldTerm"] + " between (todatetime('" + value["fieldValueLeft"] + "') .. todatetime('" + value["fieldValueRight"] + "'))"
          count -= 1;
          if (count != 0) {
            query += " or "
          }
        }
      }
    }

    if (quantityFilterValues.length > 0) {
      query += " | where ";
      let count = quantityFilterValues.length;
      for (let value of quantityFilterValues) {
        query += "(" + value["unitTerm"] + " == '" + value["unit"] + "' and tolong(" + value["fieldTerm"] + ") between (" + value["fieldValueLeft"] + " .. " + value["fieldValueRight"] + "))";
        count -= 1;
        if (count != 0) {
          query += " or ";
        }
      }
    }

    if (priceFilterValues.length > 0) {
      query += " | where ";
      let count = priceFilterValues.length;
      for (let value of priceFilterValues) {
        query += "(tolong(" + value["fieldTerm"] + ") between (" + value["fieldValueLeft"] + " .. " + value["fieldValueRight"] + "))";
        count -= 1;
        if (count != 0) {
          query += " or ";
        }
      }
    }

    data.matchExpressions.forEach((matchExpression) => {
      if (matchExpression["expressionType"] == 300) {

        query += " | where " + +matchExpression["fieldTerm"] + " between (todatetime('" + matchExpression["fieldValueLeft"] + "') .. todatetime('" + matchExpression["fieldValueRight"] + "'))"
      }
    });
  }

  return query;
}

function formulateAdxGlobalSearchQueries(data) {
  let query = getSearchBucket(data.country ?? "India", data.tradeType ?? "IMPORT");

  if (data.aggregationParams.matchExpressions.length > 0) {
    for (let matchExpression of data.aggregationParams.matchExpressions) {

      if (matchExpression["expressionType"] != 300) {
        query += " | where ";
      }

      if (matchExpression['identifier'] === 'SEARCH_HS_CODE' && matchExpression['expressionType'] === 103) {
        query += "tolong(" + matchExpression["fieldTerm"] + ")" + " between (" + matchExpression["fieldValueLeft"] + " .. " + matchExpression["fieldValueRight"] + ")";
        continue;
      }

      if (matchExpression['identifier'] === 'SEARCH_PRODUCT_DESCRIPTION') {
        query += `hscode == '${matchExpression['fieldValue']}'`
        continue;
      }

      if (matchExpression['identifier'] === 'SEARCH_MONTH_RANGE' && matchExpression['expressionType'] === 300) {
        query += " | where" + matchExpression["fieldTerm"] + " between (todatetime('" + matchExpression["fieldValueLeft"] + "') .. todatetime('" + matchExpression["fieldValueRight"] + "')) | where "
      }
    }
  }
  return query;
}

/** ### this function will push query into querySkeleton object according to matchexpression. */
function pushAdvanceSearchQuery(matchExpression, kqlQueryFinal, querySkeleton) {
  if (kqlQueryFinal.trim().length > 0) {
    if (matchExpression?.['identifier']?.startsWith('FILTER')) {
      // if identifier starts with FILTER then push it into filter property of the querySkeleton
      querySkeleton.filter.push(kqlQueryFinal)
    } else {
      // push query according to the relation
      if (matchExpression.relation === "OR") {
        querySkeleton.should.push(kqlQueryFinal)
      } else if (matchExpression.relation === "AND") {
        querySkeleton.must.push(kqlQueryFinal)
      } else if (matchExpression.relation === "NOT") {
        querySkeleton.must_not.push(kqlQueryFinal)
      } else {
        querySkeleton.must.push(kqlQueryFinal)
      }
    }
  }
}

/** this function will return query without wrapping hs_code into tolong */
function formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax(data,query_no) {
  let hotTable = 0;
  let isQuantityApplied = false;
  let quantityFilterValues = [];
  let priceFilterValues = [];
  let query = getSearchBucket(data.country, data.tradeType);
  let finalQuery = ""
  query += ""
  let dateRangeQuery = "";
  const querySkeleton = {
    must: [],
    should: [],
    must_not: [],
    should_not: [],
    filter: [],
  }

  

  if (data.matchExpressions.length > 0) {
    for (let matchExpression of data.matchExpressions) {

      if (matchExpression["identifier"] == "FILTER_UNIT") {
        isQuantityApplied = matchExpression["fieldTerm"];
        continue;
      }
      if (matchExpression["identifier"] == 'FILTER_QUANTITY') {
        quantityFilterValues.push({
          "unitTerm": isQuantityApplied,
          "unit": matchExpression["unit"],
          "fieldTerm": matchExpression["fieldTerm"],
          "fieldValueLeft": matchExpression["fieldValueLeft"],
          "fieldValueRight": matchExpression["fieldValueRight"],
          "identifier": matchExpression["identifier"]
        });
        continue;
      }

      if (matchExpression["identifier"] == 'FILTER_PRICE') {
        priceFilterValues.push(matchExpression);
        continue;
      }

      if (matchExpression["expressionType"] == 300) {
        // to do the query on hot table only 
        if(matchExpression["dateExpression"] == 1 && data.country === "INDIA"){
          query+= 'Hot';
          dateRangeQuery += matchExpression["fieldTerm"] + " between (todatetime('" + matchExpression['dividedDateRange'][0]['leftFieldvalueHot'] + "') .. todatetime('" + matchExpression['dividedDateRange'][0]['rightFieldValueHot'] + "'))"
        }

        // to do the query on hot table and on main table 
        if(matchExpression["dateExpression"] == 2 && data.country === "INDIA"){
          if(query_no == 1){
          dateRangeQuery+= matchExpression["fieldTerm"] + " between (todatetime('" + matchExpression['dividedDateRange'][1]['leftFieldvalue'] + "') .. todatetime('" + matchExpression['dividedDateRange'][1]['rightFieldValue'] + "'))"
          }
          if(query_no == 2){
            query+= 'Hot';
            dateRangeQuery += matchExpression["fieldTerm"] + " between (todatetime('" + matchExpression['dividedDateRange'][0]['leftFieldvalueHot'] + "') .. todatetime('" + matchExpression['dividedDateRange'][0]['rightFieldValueHot'] + "'))"
          }
        }
        // to do the query in main table only
          if( ((matchExpression["dateExpression"] == 0) && query_no == 0) || query_no == 0 ){
              dateRangeQuery += matchExpression["fieldTerm"] + " between (todatetime('" + matchExpression["fieldValueLeft"] + "') .. todatetime('" + matchExpression["fieldValueRight"] + "'))"
            }
      }

      if (matchExpression["expressionType"] == 103 && matchExpression["fieldValueArr"].length > 0) {
        let count = matchExpression["fieldValueArr"].length;
        let kqlQ = ''
        for (let value of matchExpression["fieldValueArr"]) {
          kqlQ += "tolong(" + matchExpression["fieldTerm"] + ")" + " between (" + value["fieldValueLeft"] + " .. " + value["fieldValueRight"] + ")";
          // kqlQ += matchExpression["fieldTerm"] + " >= " + value["fieldValueLeft"] + " and " + matchExpression["fieldTerm"] + " <= " + value["fieldValueRight"]
          count -= 1;
          if (count != 0) {
            kqlQ += " or ";
          }
        }
        pushAdvanceSearchQuery(matchExpression, kqlQ, querySkeleton)
      }
      else if ((matchExpression["expressionType"] == 102 || matchExpression["expressionType"] == 206) && matchExpression["fieldValue"].length > 0) {
        let count = matchExpression["fieldValue"].length;
        let kqlQ = ''
        kqlQ += matchExpression["fieldTerm"] + " in (";

        for (let value of matchExpression["fieldValue"]) {
          kqlQ += "'" + value + "'";
          count -= 1;
          if (count != 0) {
            kqlQ += " , "
          }
        }

        kqlQ += ")";
        pushAdvanceSearchQuery(matchExpression, kqlQ, querySkeleton)

        // for (let value of matchExpression["fieldValue"]) {
        //   query += matchExpression["fieldTerm"] + " == '" + value + "'";
        //   count -= 1;
        //   if (count != 0) {
        //     query += "| union "
        //   }
        // }
      }
      else if (matchExpression["expressionType"] == 200) {
        if (matchExpression['fieldTerm'] === "IEC") {
          let kqlQ = matchExpression['fieldTerm'] + ' == ' + matchExpression['fieldValue'];
          pushAdvanceSearchQuery(matchExpression, kqlQ, querySkeleton)
        } else {
          let kqlQ = ''
          if (matchExpression["fieldValue"].length > 0) {
            let count = matchExpression["fieldValue"].length;
            for (let value of matchExpression["fieldValue"]) {

              let value_array = value.split(' ');
              let regexPattern = generateRegexPattern(value_array)
              // let regexPattern = "strcat('(?i).*\\\\b', replace_string('" + value + "', ' ', '\\\\b.*\\\\b'), '\\\\b.*')";
              kqlQ += matchExpression["fieldTerm"] + " matches regex " + regexPattern;
              count -= 1;
              if (count != 0) {
                kqlQ += " or "
              }
            }
            pushAdvanceSearchQuery(matchExpression, kqlQ, querySkeleton)
          }

        }
      }
      else if (matchExpression["expressionType"] == 201 && matchExpression["fieldValue"].length > 0) {
        let count = matchExpression["fieldValue"].length;
        let kqlQ = ''
        for (let value of matchExpression["fieldValue"]) {
          let words = value.split(" ");
          let innerCount = words.length;
          let word = "";
          for (let val of words) {
            word += "'" + val + "'"
            innerCount -= 1;
            if (innerCount != 0) {
              word += " , ";
            }
          }
          kqlQ += matchExpression["fieldTerm"] + " has_any (" + word + ")";
          count -= 1;
          if (count != 0) {
            kqlQ += " or ";
          }
        }
        pushAdvanceSearchQuery(matchExpression, kqlQ, querySkeleton)

      }
      else if (matchExpression["expressionType"] == 202 && matchExpression["fieldValue"].length > 0) {
        let count = matchExpression["fieldValue"].length;
        let kqlQ = ''
        for (let value of matchExpression["fieldValue"]) {
          let words = value.split(" ");
          let innerCount = words.length;
          let word = "";
          for (let val of words) {
            word += "'" + val + "'"
            innerCount -= 1;
            if (innerCount != 0) {
              word += " , ";
            }
          }
          kqlQ += matchExpression["fieldTerm"] + " has_all (" + word + ")";
          count -= 1;
          if (count != 0) {
            kqlQ += "| join kind=inner ";
          }
        }
        pushAdvanceSearchQuery(matchExpression, kqlQ, querySkeleton)

      }
      else if (matchExpression["expressionType"] == 203 && matchExpression["fieldValue"].length > 0) {
        let count = matchExpression["fieldValue"].length;
        let kqlQ = ''
        for (let value of matchExpression["fieldValue"]) {
          let words = value.split(" ");
          let innerCount = words.length;
          let word = "";
          for (let val of words) {
            word += "'" + val + "'"
            innerCount -= 1;
            if (innerCount != 0) {
              word += " , ";
            }
          }


          const suffixVariations = ['', 's', 'es', 'ing'];

          // Generate all combinations
          const allCombinations = [];
          function generateCombinations(index, currentCombination) {
            if (index === words.length) {
              allCombinations.push(currentCombination.join("', '"));
              return;
            }
            for (const suffix of suffixVariations) {
              currentCombination[index] = `${words[index]}${suffix}`;
              generateCombinations(index + 1, currentCombination.slice());
            }
          }
          generateCombinations(0, []);

          kqlQ += `${allCombinations.map(combination => matchExpression["fieldTerm"] + ` has_all ('${combination}')`).join(' or ')}`
          count -= 1;
          if (count != 0) {
            kqlQ += " or ";
          }
        }
        pushAdvanceSearchQuery(matchExpression, kqlQ, querySkeleton)

      }
      else if (matchExpression["expressionType"] == 204 && matchExpression["fieldValue"].length > 0) {
        let count = matchExpression["fieldValue"].length;
        let kqlQ = ''
        for (let value of matchExpression["fieldValue"]) {
          let valueArray = value.split(" ");
          let innerCount = valueArray.length;
          for (let val of valueArray) {
            kqlQ += matchExpression["fieldTerm"] + " contains '" + val + "'";
            innerCount -= 1;
            if (innerCount != 0) {
              kqlQ += " and ";
            }
          }
          count -= 1;
          if (count != 0) {
            kqlQ += " or "
          }
        }
        pushAdvanceSearchQuery(matchExpression, kqlQ, querySkeleton)


      }
      else if (matchExpression["expressionType"] == 301 && matchExpression["fieldValues"].length > 0) {
        let count = matchExpression["fieldValues"].length;
        let kqlQ = ''
        for (let value of matchExpression["fieldValues"]) {
          kqlQ += matchExpression["fieldTerm"] + " between (todatetime('" + value["fieldValueLeft"] + "') .. todatetime('" + value["fieldValueRight"] + "'))"
          count -= 1;
          if (count != 0) {
            kqlQ += " or "
          }
        }
        pushAdvanceSearchQuery(matchExpression, kqlQ, querySkeleton)
      }

    }

    if (quantityFilterValues.length > 0) {
      // query += " | where ";
      let count = quantityFilterValues.length;
      let kqlQ = '';
      for (let value of quantityFilterValues) {
        kqlQ += value["unitTerm"] + " == '" + value["unit"] + "' and tolong(" + value["fieldTerm"] + ") between (" + value["fieldValueLeft"] + " .. " + value["fieldValueRight"] + ")";
        count -= 1;
        if (count != 0) {
          kqlQ += " or ";
        }
      }
      pushAdvanceSearchQuery({ identifier: "FILTER_QUANTITY" }, kqlQ, querySkeleton)
    }

    if (priceFilterValues.length > 0) {
      let kqlQ = ''
      kqlQ += " | where ";
      let count = priceFilterValues.length;
      for (let value of priceFilterValues) {
        // kqlQ += value["fieldTerm"] + " between (" + value["fieldValueLeft"] + " .. " + value["fieldValueRight"] + ")";
        kqlQ += value["fieldTerm"] + " <" + value["fieldValueLeft"] + " .. " + value["fieldValueRight"] + ")";
        count -= 1;
        if (count != 0) {
          kqlQ += " or ";
        }
      }
      pushAdvanceSearchQuery(matchExpression, kqlQ, querySkeleton)
    }
  }


  // data.matchExpressions.forEach((matchExpression) => {
  //   if (matchExpression["expressionType"] == 300) {
  //     finalQuery += matchExpression["fieldTerm"] + " between (todatetime('" + matchExpression["fieldValueLeft"] + "') .. todatetime('" + matchExpression["fieldValueRight"] + "')) | where "
  //   }
  // });

  querySkeleton.must.forEach((q, i) => {
    finalQuery += q;
    if (i < querySkeleton.must.length - 1) {
      // finalQuery += " and "
      finalQuery += " and "
    }
  })

  querySkeleton.should.forEach((q, i) => {
    if (i == 0) {
      finalQuery += " or "
    }
    finalQuery += q;
    if (i < querySkeleton.should.length - 1) {
      finalQuery += " or "
    }
  })

  querySkeleton.must_not.forEach((q, i) => {
    if (i == 0) {
      finalQuery += "| where "
    }
    finalQuery += 'not( ' + q + " )";
    if (i < querySkeleton.must_not.length - 1) {
      finalQuery += " and "
    }
  })


  querySkeleton.filter.forEach((q, i) => {
    finalQuery += " | where " + q;
  })


  // data.matchExpressions.forEach((matchExpression) => {
  //   if (matchExpression["expressionType"] == 300) {
  //     finalQuery += " | where " + matchExpression["fieldTerm"] + " between (todatetime('" + matchExpression["fieldValueLeft"] + "') .. todatetime('" + matchExpression["fieldValueRight"] + "'))"
  //   }
  // });
  finalQuery = query + " | where " + dateRangeQuery + " | where " + finalQuery;
  // console.log("final query",finalQuery)

  return finalQuery;
}

async function getPowerbiDash(payload) {
  let recordquery;
  let results;
  if (payload.country === "INDIA" && payload.matchExpressions[1]["dateExpression"] == 2){
    let recordDataQueryMain = `let data_1 = (`+formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax(payload, 1) + `);`;
    let recordDataQueryHot = `let data_2 =(`+formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax(payload, 2)+ `);`;
    recordquery  = recordDataQueryMain + recordDataQueryHot + `union data_1 , data_2`
    }
    else if(payload.country === "INDIA" && payload.matchExpressions[1]["dateExpression"] == 1){
      recordquery  =  formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax(payload,2)
   }
   else{
    recordquery  =  formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax(payload,0)
   }
  
  try {
    results = await powerBiModel.getreport(recordquery, payload)
    return results;
  } catch (err) {
    console.log("Error getting response from power bi")
  }
}


module.exports = {
  findByFilters,
  findTradeCountries,
  findTradeCountriesRegion,
  findTradeShipmentSpecifications,
  findTradeShipments,
  findTradeShipmentRecordsAggregation,
  findTradeShipmentRecordsAggregationEngine,
  findTradeShipmentRecords,
  findTradeShipmentSummary,
  findTradeShipmentFilter,
  findTradeShipmentStatisticsAggregation,
  findTradeShipmentsTraders,
  findTradeShipmentsTradersByPattern,
  findTradeShipmentsTradersByPatternEngine,
  findShipmentsCount,
  findBlTradeCountries,
  findCompanyDetailsByPatternEngine,
  getExploreExpressions,
  findTradeShipmentFiltersAggregationEngine,
  getDaySearchLimit,
  updateDaySearchLimit,
  getSummaryLimit,
  updateSummaryLimit,
  getBlCountriesISOArray,
  addOrUpdateViewColumn,
  findExploreViewColumnsByTaxonomyId,
  getCountryNames,
  createSortSchema,
  checkSortSchema,
  getSortMapping,
  findCountrySummary,
  createSummaryForNewCountry,
  RetrieveAdxDataSuggestions,
  RetrieveAdxDataFilters,
  RetrieveAdxDataOptimized,
  formulateAdxRawSearchRecordsQueries,
  mapAdxRowsAndColumns,
  // formulate final adx raw search records queries without to long syntax
  formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax,
  formulateAdxSummaryRecordsQueries,
  getADXFilterResults,
  RetrieveAdxDataFiltersUsingMaterialize,
  RetrieveAdxDataSummary,
  formulateAdxGlobalSearchQueries,
  getSearchBucket,
  getRecordscount,
  getPowerbiDash,
  findCompanyDetailsByPatternEngineADX
}