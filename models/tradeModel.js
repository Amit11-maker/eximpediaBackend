const TAG = "tradeModel";
const { searchEngine } = require("../helpers/searchHelper")
const { getSearchData } = require("../helpers/recordSearchHelper")
const ObjectID = require("mongodb").ObjectID;
const ElasticsearchDbQueryBuilderHelper = require('./../helpers/elasticsearchDbQueryBuilderHelper');
const MongoDbHandler = require("../db/mongoDbHandler");
const ElasticsearchDbHandler = require("../db/elasticsearchDbHandler");
const TradeSchema = require("../schemas/tradeSchema");
const { logger } = require('../config/logger');
const SEPARATOR_UNDERSCORE = "_";
const BLCOUNTRIESLIST = ['USA',
  'DZA',
  'AUS',
  'BHR',
  'BGD',
  'BEL',
  'CAN',
  'CHN',
  'DNK',
  'DJI',
  'EGY',
  'FIN',
  'FRA',
  'DUE',
  'GHA',
  'GRC',
  'IND',
  'IDN',
  'IRN',
  'IRQ',
  'ITA',
  'JPN',
  'KOR',
  'KWT',
  'MYS',
  'MEX',
  'NLD',
  'NOR',
  'OMN',
  'PAK',
  'PHL',
  'QAT',
  'SAU',
  'SGP',
  'ESP',
  'LKA',
  'TWN',
  'THA',
  'TUR',
  'ARE',
  'GBR',
  'VNM']


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

const findTradeCountries = (tradeType, constraints, cb) => {

  if (constraints.allowedCountries.length >= 42) {
    let blFlag = true
    for (let i of BLCOUNTRIESLIST) {
      if (!constraints.allowedCountries.includes(i)) {
        blFlag = false
      }
    }
    if (blFlag) {
      for (let i of BLCOUNTRIESLIST) {
        let index = constraints.allowedCountries.indexOf(i);
        console.log(index)
        if (index > -1) {
          constraints.allowedCountries.splice(index, 1);
        }
      }
    }
  }
  console.log(constraints)
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
              logger.error(JSON.stringify(err));
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
};

const findBlTradeCountries = (tradeType, constraints, cb) => {
  let matchBlock = {
    bl_flag: true,
  };

  if (tradeType) {
    matchBlock.trade = tradeType;
  }

  // if (constraints.allowedCountries) {
  //   matchBlock.code_iso_3 = {
  //     $in: constraints.allowedCountries
  //   };
  // }

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
              logger.error(JSON.stringify(err));
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
              logger.error(JSON.stringify(err));
              cb(err);
            } else {
              cb(null, documents);
            }
          });
        }
      }
    );
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
}

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
}

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
}

const findTradeShipmentRecordsAggregationEngine = async (
  aggregationParams, tradeType, country, dataBucket, userId, accountId,
  recordPurchasedParams, offset, limit, cb) => {
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

    let data = await getSearchData(payload)
    cb(null, data)
  } catch (error) {
    logger.error(` TRADE MODEL ============================ ${JSON.stringify(error)}`)
    cb(error)
  }
}

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
}

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
    let getSearchedData = await searchEngine(payload)
    cb(null, getSearchedData)
  } catch (error) {
    cb(error)
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

/** function to apply the max_search_limit for a user */
async function findQueryCount(userId, maxQueryPerDay) {
  let isSearchLimitExceeded = false;
  var aggregationExpression = [{
    $match: {
      user_id: ObjectID(userId),
      created_ts: { $gte: new Date(new Date().toISOString().split("T")[0]).getTime() },
      isWorkspaceQuery: false
    }
  }]
  var daySearchResult = await MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.activity_tracker)
    .aggregate(aggregationExpression, { allowDiskUse: true }).toArray();

  if (daySearchResult.length + 1 > maxQueryPerDay) {
    isSearchLimitExceeded = true;
  }
  return { limitExceeded: isSearchLimitExceeded, daySearchCount: daySearchResult.length + 1 }
}

const findCompanyDetailsByPatternEngine = async (searchTerm, tradeMeta, startDate, endDate, searchingColumns) => {
  let aggregationExpression = {
    // setting size as one to get address of the company
    size: 1,
    query: {
      bool: {
        must: [],
        should: [],
        filter: [],
        must_not: []
      },
    },
    aggs: {},
  }

  let buyerSellerAggregationExpression = {
    // setting size as one to get address of the company
    size: 1,
    query: {
      bool: {
        must: [],
        should: [],
        filter: [],
        must_not: []
      },
    },
    aggs: {},
  }

  let matchExpression = {
    match: {}
  }

  matchExpression.match[searchingColumns.searchField] = {
    query: searchTerm,
    operator: "and",
    fuzziness: "auto",
  }
  aggregationExpression.query.bool.must.push({ ...matchExpression });
  buyerSellerAggregationExpression.query.bool.must.push({ ...matchExpression });

  let rangeQuery = {
    range: {}
  }
  rangeQuery.range[searchingColumns.dateColumn] = {
    gte: startDate,
    lte: endDate,
  }
  aggregationExpression.query.bool.must.push({ ...rangeQuery });
  buyerSellerAggregationExpression.query.bool.must.push({ ...rangeQuery });

  if (tradeMeta.blCountry) {
    var blMatchExpressions = { match: {} };
    blMatchExpressions.match["COUNTRY_DATA"] = tradeMeta.blCountry;
    aggregationExpression.query.bool.must.push({ ...blMatchExpressions });
    buyerSellerAggregationExpression.query.bool.must.push({ ...blMatchExpressions });
  }

  let buyerSellerData = await buyerSellerDataAggregation(buyerSellerAggregationExpression, searchingColumns, tradeMeta, matchExpression);

  summaryCountAggregation(aggregationExpression, searchingColumns);
  quantityPriceAggregation(aggregationExpression, searchingColumns);
  quantityPortAggregation(aggregationExpression, searchingColumns);
  countryPriceQuantityAggregation(aggregationExpression, searchingColumns);
  hsCodePriceQuantityAggregation(aggregationExpression, searchingColumns);

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
}

async function buyerSellerDataAggregation(aggregationExpression, searchingColumns, tradeMeta, matchExpression) {
  try {

    let subQuery = { ...aggregationExpression };
    buyerSupplierAggregation(subQuery, searchingColumns, format = false);
    
    let result = await ElasticsearchDbHandler.dbClient.search({
      index: tradeMeta.indexNamePrefix,
      track_total_hits: true,
      body: subQuery,
    });
    
    let supplier_data = [];
    for (let record of result?.body?.aggregations?.FILTER_BUYER_SELLER?.buckets) {
      supplier_data.push(record.key);
    }

    let termsQuery = {
      terms: {}
    }

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
    throw error ;
  }
}

function summaryCountAggregation(aggregationExpression, searchingColumns) {
  aggregationExpression.aggs["SUMMARY_TOTAL_SUPPLIER"] = {
    "cardinality": {
      "field": searchingColumns.sellerName + ".keyword"
    }
  }

  aggregationExpression.aggs["SUMMARY_TOTAL_USD_VALUE"] = {
    "sum": {
      "field": searchingColumns.priceColumn + ".double"
    }
  }
}

function buyerSupplierAggregation(aggregationExpression, searchingColumns, format = true) {
  if (!format) {
    aggregationExpression.aggs["FILTER_BUYER_SELLER"] = {
      "terms": {
        "field": searchingColumns.sellerName + ".keyword",
        "size": 10
      }
    }
  }
  else
    aggregationExpression.aggs["FILTER_BUYER_SELLER"] = {
      "terms": {
        "field": searchingColumns.sellerName + ".keyword",
        "size": 10
      }, "aggs": {
        "BUYERS": {
          "terms": {
            "field": searchingColumns.buyerName + ".keyword",
            "size": 10
          }
        }
      }
    }
}

function quantityPortAggregation(aggregationExpression, searchingColumns) {
  aggregationExpression.aggs["FILTER_PORT_QUANTITY"] = {
    "terms": {
      "field": searchingColumns.portColumn + ".keyword",
      "size": 10
    },
    "aggs": {
      "PORT_QUANTITY": {
        "sum": {
          "field": searchingColumns.quantityColumn + ".double"
        }
      }
    }
  }
}

function countryPriceQuantityAggregation(aggregationExpression, searchingColumns) {
  aggregationExpression.aggs["FILTER_COUNTRY_PRICE_QUANTITY"] = {
    "terms": {
      "field": searchingColumns.countryColumn + ".keyword"
    },
    "aggs": {
      "COUNTRY_QUANTITY": {
        "sum": {
          "field": searchingColumns.quantityColumn + ".double"
        }
      },
      "COUNTRY_PRICE": {
        "sum": {
          "field": searchingColumns.priceColumn + ".double"
        }
      }
    }
  }
}

function hsCodePriceQuantityAggregation(aggregationExpression, searchingColumns) {
  aggregationExpression.aggs["FILTER_HSCODE_PRICE_QUANTITY"] = {
    "terms": {
      "field": searchingColumns.codeColumn + ".keyword"
    },
    "aggs": {
      "CODE_QUANTITY": {
        "sum": {
          "field": searchingColumns.quantityColumn + ".double"
        }
      },
      "CODE_PRICE": {
        "sum": {
          "field": searchingColumns.priceColumn + ".double"
        }
      }
    }
  }
}

function quantityPriceAggregation(aggregationExpression, searchingColumns) {
  aggregationExpression.aggs["FILTER_PRICE_QUANTITY"] = {
    "date_histogram": {
      "field": searchingColumns.dateColumn,
      "calendar_interval": "month"
    },
    "aggs": {
      "MONTH_PRICE": {
        "sum": {
          "field": searchingColumns.priceColumn + ".double"
        }
      },
      "MONTH_QUANTITY": {
        "sum": {
          "field": searchingColumns.quantityColumn + ".double"
        }
      }
    }
  }
}

function getResponseDataForCompany(result) {
  let mappedResult = {};
  mappedResult[TradeSchema.RESULT_PORTION_TYPE_RECORDS] = [];
  result.body.hits.hits.forEach((hit) => {
    let sourceData = hit._source;
    sourceData._id = hit._id;
    mappedResult[TradeSchema.RESULT_PORTION_TYPE_RECORDS].push(
      sourceData
    );
  });

  mappedResult[TradeSchema.RESULT_PORTION_TYPE_SUMMARY] = [
    {
      _id: null,
      count: result.body.hits.total.value,
    },
  ]
  for (let prop in result.body.aggregations) {
    if (result.body.aggregations.hasOwnProperty(prop)) {
      if (prop.indexOf("FILTER") === 0) {
        let mappingGroups = []

        if (result.body.aggregations[prop].buckets) {
          result.body.aggregations[prop].buckets.forEach((bucket) => {
            if (bucket.doc_count != null && bucket.doc_count != undefined) {
              let groupedElement = {
                _id: (bucket.key_as_string != null && bucket.key_as_string != undefined) ? bucket.key_as_string : bucket.key,
              }
              segregateSummaryData(bucket, groupedElement);

              if (bucket.minRange != null && bucket.minRange != undefined && bucket.maxRange != null && bucket.maxRange != undefined) {
                groupedElement.minRange = bucket.minRange.value;
                groupedElement.maxRange = bucket.maxRange.value;
              }

              mappingGroups.push(groupedElement);
            }
          });
        }

        let propElement = result.body.aggregations[prop];
        if (propElement.min != null && propElement.min != undefined && propElement.max != null && propElement.max != undefined) {
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
          mappingGroups.push(propElement.value)
        }
        mappedResult[prop] = mappingGroups;

      } else if (prop.indexOf("SUMMARY") === 0 && result.body.aggregations[prop].value) {
        mappedResult[prop] = result.body.aggregations[prop].value;
      }
    }
  }

  return mappedResult;
}

function segregateSummaryData(bucket, groupedElement) {

  if (bucket.hasOwnProperty("PORT_QUANTITY")) {
    groupedElement.quantity = bucket['PORT_QUANTITY'].value;
  }

  if (bucket.hasOwnProperty('MONTH_PRICE') && bucket.hasOwnProperty('MONTH_QUANTITY')) {
    groupedElement.price = bucket['MONTH_PRICE'].value;
    groupedElement.quantity = bucket['MONTH_QUANTITY'].value;
  }

  if (bucket.hasOwnProperty('COUNTRY_PRICE') && bucket.hasOwnProperty('COUNTRY_QUANTITY')) {
    groupedElement.price = bucket['COUNTRY_PRICE'].value;
    groupedElement.quantity = bucket['COUNTRY_QUANTITY'].value;
  }

  if (bucket.hasOwnProperty('CODE_PRICE') && bucket.hasOwnProperty('CODE_QUANTITY')) {
    groupedElement.price = bucket['CODE_PRICE'].value;
    groupedElement.quantity = bucket['CODE_QUANTITY'].value;
  }

  if (bucket.BUYERS?.buckets.length > 0) {
    groupedElement.buyers = [];
    bucket.BUYERS?.buckets.forEach((bucket) => {
      if (bucket.doc_count != null && bucket.doc_count != undefined) {
        let nestedElement = {
          _id: (bucket.key_as_string != null && bucket.key_as_string != undefined) ? bucket.key_as_string : bucket.key
        };
        if (bucket.minRange != null && bucket.minRange != undefined && bucket.maxRange != null && bucket.maxRange != undefined) {
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
            "country": country.charAt(0).toUpperCase() + country.slice(1).toLowerCase(),
            "trade": tradeType.toUpperCase()
          }
        },
        {
          $project: {
            "fields.explore_aggregation.sortTerm": 1,
            "fields.explore_aggregation.groupExpressions": 1
          }
        }
      ]).toArray();

    return ((taxonomyData) ? taxonomyData[0].fields.explore_aggregation : null);
  } catch (error) {
    throw error;
  }
}

/** Function to get the company search summary count in explore view summary */
const getSummaryLimitCount = async (accountId) => {
  try {
    let isMaxSummaryLimitExceeded = false;
    let filterClause = {
      _id: ObjectID(accountId),
    }

    let currentCount = await MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.account)
      .find(filterClause).project({
        "plan_constraints.max_summary_limit": 1
      }).toArray();
    let updatedLimit = currentCount[0].plan_constraints.max_summary_limit - 1;

    if (updatedLimit >= 0) {
      let updateClause = {
        $set: { "plan_constraints.max_summary_limit": updatedLimit }
      }

      await MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.account).updateOne(filterClause, updateClause);
    } else {
      isMaxSummaryLimitExceeded = true;
    }
    return { limitExceeded: isMaxSummaryLimitExceeded, updatedSummaryLimitCount: updatedLimit }
  } catch (error) {
    throw error;
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
  findQueryCount,
  findBlTradeCountries,
  findCompanyDetailsByPatternEngine,
  getExploreExpressions,
  getSummaryLimitCount
}


