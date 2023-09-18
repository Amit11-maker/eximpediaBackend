const TAG = "tradeController";

const date = require("date-and-time");
const TradeModel = require("../models/tradeModel");
const SaveQueryModel = require("../models/saveQueryModel");
const WorkspaceModel = require("../models/workspaceModel");
const TradeSchema = require("../schemas/tradeSchema");
const { logger } = require("../config/logger");
const recommendationModel = require("../models/recommendationModel");
const recommendationSchema = require("../schemas/recommendationSchema");
const DateHelper = require("../helpers/dateHelper");
const AccountModel = require("../models/accountModel");
const { getSearchData } = require("../helpers/recordSearchHelper");

var CronJob = require("cron").CronJob;

const fetchExploreCountries = (req, res) => {
  let tradeType = req.query.tradeType
    ? req.query.tradeType.trim().toUpperCase()
    : null;

  let constraints = {};
  if (req.plan) {
    constraints.allowedCountries = req.plan.countries_available;
    constraints.dataAccessYears = DateHelper.getDateDifferenceAsYears(
      req.plan.data_availability_interval.start_date,
      req.plan.data_availability_interval.end_date
    ).map((x) => `${x}`);
  }
  logger.log(constraints);

  TradeModel.findTradeCountries(tradeType, constraints, (error, countries) => {
    if (error) {
      logger.log(
        ` TRADE CONTROLLER ================== ${JSON.stringify(error)}`
      );
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      if (countries == "Not accessible") {
        res.status(409).json({
          message: "Please raise access for at least one trade country !!",
        });
      } else {
        res.status(200).json({
          data: {
            countries,
          },
        });
      }
    }
  });
};

const fetchBLExploreCountries = (req, res) => {
  let tradeType = req.query.tradeType
    ? req.query.tradeType.trim().toUpperCase()
    : null;

  let constraints = {};
  if (req.plan) {
    constraints.allowedCountries = req.plan.countries_available;
    constraints.dataAccessYears = DateHelper.getDateDifferenceAsYears(
      req.plan.data_availability_interval.start_date,
      req.plan.data_availability_interval.end_date
    ).map((x) => `${x}`);
  }
  logger.log(constraints);

  TradeModel.findBlTradeCountries(
    tradeType,
    constraints,
    (error, blCountries) => {
      if (error) {
        logger.log(
          ` TRADE CONTROLLER ================== ${JSON.stringify(error)}`
        );
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        if (blCountries == "Not accessible") {
          res.status(409).json({
            message: "Please raise access for atleast one bl country !!",
          });
        } else {
          res.status(200).json({
            data: {
              blCountries,
            },
          });
        }
      }
    }
  );
};

const fetchCountries = (req, res) => {
  let constraints = {};

  TradeModel.findTradeCountriesRegion((error, countries) => {
    if (error) {
      logger.log(
        ` TRADE CONTROLLER ================== ${JSON.stringify(error)}`
      );
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      res.status(200).json({
        data: countries,
      });
    }
  });
};

const fetchExploreShipmentsSpecifications = async (req, res) => {
  let tradeType = req.query.tradeType
    ? req.query.tradeType.trim().toUpperCase()
    : null;
  let countryCode = req.query.countryCode
    ? req.query.countryCode.trim().toUpperCase()
    : null;
  let country = req.query.country
    ? req.query.country.trim().toUpperCase()
    : null;
  let bl_flag = req.query.bl_flag
    ? req.query.bl_flag.trim().toLowerCase()
    : null;
  // let tradeYear = (req.query.tradeYear) ? req.query.tradeYear.trim().toUpperCase() : null;

  let userDetails = {
    user_id: req.user.user_id,
    account_id: req.user.account_id,
  };

  let constraints = {};
  if (req.plan) {
    constraints.allowedCountries = req.plan.countries_available;
    if (bl_flag) {
      constraints.allowedCountries.push(countryCode);
    }
    // constraints.allowedCountries.pu;
    constraints.dataAccessYears = DateHelper.getDateDifferenceAsYears(
      req.plan.data_availability_interval.start_date,
      req.plan.data_availability_interval.end_date
    ).map((x) => `${x}`);
  }
  constraints.countryNames = await TradeModel.getCountryNames(
    constraints.allowedCountries,
    tradeType,
    bl_flag
  );

  if (constraints && constraints.allowedCountries.includes(countryCode)) {
    TradeModel.findTradeShipmentSpecifications(
      bl_flag,
      tradeType,
      countryCode,
      constraints,
      (error, shipmentSpecifications) => {
        if (error) {
          logger.log(
            ` TRADE CONTROLLER ================== ${JSON.stringify(error)}`
          );

          res.status(500).json({
            message: "Internal Server Error",
          });
        } else {
          let payload = {
            user_id: userDetails.user_id,
            account_id: userDetails.account_id,
            tradeType: tradeType,
            country: country,
          };
          let offset = 0;
          let limit =
            req.plan.max_favorite_shipment_count != null
              ? req.plan.max_favorite_shipment_count
              : 10;

          const shipment =
            recommendationSchema.fetchTradeShipmentListSchema(payload);
          var favoriteCompany =
            recommendationModel.findCompanyRecommendationList(
              shipment,
              offset,
              limit
            );
          recommendationModel.findShipmentRecommendationList(
            shipment,
            offset,
            limit,
            async (error, favoriteShipment) => {
              if (error) {
                logger.log(
                  ` TRADE CONTROLLER ================== ${JSON.stringify(
                    error
                  )}`
                );
                res.status(500).json({
                  message: "Internal Server Error",
                });
              } else {
                try {
                  res.status(200).json({
                    data: shipmentSpecifications,
                    userConstraints: {
                      dataAccessRange: {
                        start_date:
                          req.plan.data_availability_interval.start_date,
                        end_date: req.plan.data_availability_interval.end_date,
                      },
                      countries_available: constraints.allowedCountries,
                    },
                    favoriteShipment: favoriteShipment,
                    favoriteCompany: await favoriteCompany,
                    countryNames: constraints.countryNames,
                  });
                } catch (e) {
                  logger.log(
                    ` TRADE CONTROLLER ================== ${JSON.stringify(e)}`
                  );
                  res.status(500).json({
                    message: "Internal Server Error",
                  });
                }
              }
            }
          );
        }
      }
    );
  } else {
    // TODO:Unauthorised Country Access
    res.status(200).json({
      data: [],
    });
  }
};

const fetchExploreShipmentsRecords = async (req, res) => {
  let payload = req.body;
  payload.accountId = req.user.account_id;
  try {
    let daySearchLimits = await TradeModel.getDaySearchLimit(payload.accountId);
    if (daySearchLimits?.max_query_per_day?.remaining_limit <= 0) {
      return res.status(409).json({
        message: "Out of search for the day , please contact administrator.",
      });
    } else {
      const accountId = payload.accountId ? payload.accountId.trim() : null;
      const userId = payload.userId ? payload.userId.trim() : null;

      const tradeType = payload.tradeType
        ? payload.tradeType.trim().toUpperCase()
        : null;
      const countryCode = payload.countryCode
        ? payload.countryCode.trim().toUpperCase()
        : null;
      const tradeYear = payload.tradeYear ? payload.tradeYear : null;
      const tradeTotalRecords = payload.tradeTotalRecords
        ? payload.tradeTotalRecords
        : null;

      const pageKey = payload.draw && payload.draw != 0 ? payload.draw : null;
      let offset = null;
      let limit = null;
      //Datatable JS Mode
      if (pageKey != null) {
        offset = payload.start != null ? payload.start : 0;
        limit = payload.length != null ? payload.length : 10;
      } else {
        offset = payload.offset != null ? payload.offset : 0;
        limit = payload.limit != null ? payload.limit : 10;
      }
      let country = payload.country
        ? payload.country.trim().toUpperCase()
        : null;
      const dataBucket = TradeSchema.deriveDataBucket(tradeType, country);

      const recordPurchaseKeeperParams = {
        tradeType: tradeType,
        countryCode: countryCode,
        tradeYear: tradeYear,
      };

      TradeModel.findTradeShipmentRecordsAggregationEngine(
        payload,
        tradeType,
        country,
        dataBucket,
        userId,
        accountId,
        recordPurchaseKeeperParams,
        offset,
        limit,
        async (error, shipmentDataPack) => {
          if (error) {
            logger.log(
              "TRADE CONTROLLER ==================",
              JSON.stringify(error)
            );
            res.status(500).json({
              message: "Internal Server Error",
            });
          } else {
            // fetchRecommendation(shipmentDataPack);
            if (
              shipmentDataPack[0] != undefined &&
              shipmentDataPack[0].message
            ) {
              res.status(409).json({ message: shipmentDataPack[0].message });
            } else {
              let bundle = {};
              let alteredRecords = [];

              if (!shipmentDataPack) {
                bundle.recordsTotal = 0;
                bundle.recordsFiltered = 0;
                bundle.error = "Unrecognised Shipments Response"; //Show if to be interpreted as error on client-side
                if (pageKey) {
                  bundle.draw = pageKey;
                }

                if (payload.resultType == "SEARCH_RECORDS") {
                  daySearchLimits.max_query_per_day.remaining_limit =
                    daySearchLimits?.max_query_per_day?.remaining_limit - 1;
                  await TradeModel.updateDaySearchLimit(
                    payload.accountId,
                    daySearchLimits
                  );
                }
                await addLimitsAndSendResponse(
                  payload,
                  bundle,
                  daySearchLimits,
                  res
                );
              } else {
                let recordsTotal =
                  shipmentDataPack[TradeSchema.RESULT_PORTION_TYPE_SUMMARY]
                    .length > 0
                    ? shipmentDataPack[
                      TradeSchema.RESULT_PORTION_TYPE_SUMMARY
                    ][0].count
                    : 0;

                bundle.recordsTotal =
                  tradeTotalRecords != null ? tradeTotalRecords : recordsTotal;
                bundle.recordsFiltered = recordsTotal;

                bundle.summary = {};
                bundle.data = {};
                bundle.risonQuery = shipmentDataPack.risonQuery;

                for (const prop in shipmentDataPack) {
                  if (shipmentDataPack.hasOwnProperty(prop)) {
                    if (prop.indexOf("SUMMARY") === 0) {
                      if (prop === "SUMMARY_RECORDS") {
                        bundle.summary[prop] = recordsTotal;
                      } else {
                        if (
                          prop.toLowerCase() == "summary_shipments" &&
                          country.toLowerCase() == "indonesia"
                        ) {
                          bundle.summary[prop] = recordsTotal;
                        } else {
                          bundle.summary[prop] = shipmentDataPack[prop];
                        }
                      }
                    }
                  }
                }
                if (req.plan.is_hidden) {
                  WorkspaceModel.findShipmentRecordsPurchasableAggregation(
                    payload.accountId,
                    payload.tradeType.toUpperCase(),
                    payload.country.toUpperCase(),
                    shipmentDataPack.idArr,
                    async (error, purchasableRecords) => {
                      if (error) {
                        logger.log(
                          ` TRADE CONTROLLER ================== ${JSON.stringify(
                            error
                          )}`
                        );
                        res.status(500).json({
                          message: "Internal Server Error",
                        });
                      } else {
                        for (let shipmentElement of shipmentDataPack[
                          TradeSchema.RESULT_PORTION_TYPE_RECORDS
                        ]) {
                          if (
                            purchasableRecords == undefined ||
                            purchasableRecords.purchase_records.includes(
                              shipmentElement._id
                            )
                          ) {
                            for (let columnName of payload.purchasable) {
                              shipmentElement[columnName] = "********";
                            }
                          }
                          alteredRecords.push({ ...shipmentElement });
                        }
                        if (pageKey) {
                          bundle.draw = pageKey;
                        }
                        if (alteredRecords.length > 0) {
                          shipmentDataPack[
                            TradeSchema.RESULT_PORTION_TYPE_RECORDS
                          ] = [...alteredRecords];
                        }
                        bundle.data = [
                          ...shipmentDataPack[
                          TradeSchema.RESULT_PORTION_TYPE_RECORDS
                          ],
                        ];

                        if (payload.resultType == "SEARCH_RECORDS") {
                          daySearchLimits.max_query_per_day.remaining_limit =
                            daySearchLimits?.max_query_per_day
                              ?.remaining_limit - 1;
                          await TradeModel.updateDaySearchLimit(
                            payload.accountId,
                            daySearchLimits
                          );
                        }
                        await addLimitsAndSendResponse(
                          payload,
                          bundle,
                          daySearchLimits,
                          res
                        );
                      }
                    }
                  );
                } else {
                  if (pageKey) {
                    bundle.draw = pageKey;
                  }
                  bundle.data = [
                    ...shipmentDataPack[
                    TradeSchema.RESULT_PORTION_TYPE_RECORDS
                    ],
                  ];

                  if (payload.resultType == "SEARCH_RECORDS") {
                    daySearchLimits.max_query_per_day.remaining_limit =
                      daySearchLimits?.max_query_per_day?.remaining_limit - 1;
                    await TradeModel.updateDaySearchLimit(
                      payload.accountId,
                      daySearchLimits
                    );
                  }
                  await addLimitsAndSendResponse(
                    payload,
                    bundle,
                    daySearchLimits,
                    res
                  );
                }
              }
            }
          }
        }
      );
    }
  } catch (error) {
    logger.log(
      req.user.user_id,
      "TRADE CONTROLLER ==================",
      JSON.stringify(error)
    );
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const fetchExploreShipmentsFilters = async (req, res) => {
  let payload = req.body;
  try {
    const accountId = payload.accountId ? payload.accountId.trim() : null;
    const userId = payload.userId ? payload.userId.trim() : null;

    const tradeType = payload.tradeType
      ? payload.tradeType.trim().toUpperCase()
      : null;
    const countryCode = payload.countryCode
      ? payload.countryCode.trim().toUpperCase()
      : null;
    const tradeYear = payload.tradeYear ? payload.tradeYear : null;
    const tradeTotalRecords = payload.tradeTotalRecords
      ? payload.tradeTotalRecords
      : null;

    const pageKey = payload.draw && payload.draw != 0 ? payload.draw : null;
    let offset = null;
    let limit = null;
    //Datatable JS Mode
    if (pageKey != null) {
      offset = payload.start != null ? payload.start : 0;
      limit = payload.length != null ? payload.length : 10;
    } else {
      offset = payload.offset != null ? payload.offset : 0;
      limit = payload.limit != null ? payload.limit : 10;
    }
    let country = payload.country ? payload.country.trim().toUpperCase() : null;
    const dataBucket = TradeSchema.deriveDataBucket(tradeType, country);

    const recordPurchaseKeeperParams = {
      tradeType: tradeType,
      countryCode: countryCode,
      tradeYear: tradeYear,
    };

    TradeModel.findTradeShipmentFiltersAggregationEngine(
      payload,
      tradeType,
      country,
      dataBucket,
      userId,
      accountId,
      recordPurchaseKeeperParams,
      offset,
      limit,
      async (error, shipmentDataPack) => {
        if (error) {
          logger.log(
            "TRADE CONTROLLER ==================",
            JSON.stringify(error)
          );
          res.status(500).json({
            message: "Internal Server Error",
          });
        } else {
          if (shipmentDataPack[0] != undefined && shipmentDataPack[0].message) {
            res.status(409).json({ message: shipmentDataPack[0].message });
          } else {
            let bundle = {};
            let alteredRecords = [];

            if (!shipmentDataPack) {
              bundle.recordsTotal = 0;
              bundle.recordsFiltered = 0;
              bundle.error = "Unrecognised Shipments Response"; //Show if to be interpreted as error on client-side
              if (pageKey) {
                bundle.draw = pageKey;
              }
              res.status(200).json(bundle);
            } else {
              bundle.filter = {};

              for (const prop in shipmentDataPack) {
                if (shipmentDataPack.hasOwnProperty(prop)) {
                  if (prop.indexOf("FILTER") === 0) {
                    bundle.filter[prop] = shipmentDataPack[prop];
                  }
                }
              }

              res.status(200).json(bundle);
            }
          }
        }
      }
    );
  } catch (error) {
    logger.log(
      req.user.user_id,
      "TRADE CONTROLLER ==================",
      JSON.stringify(error)
    );
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

async function addLimitsAndSendResponse(payload, bundle, daySearchLimits, res) {
  let saveQueryLimits = await SaveQueryModel.getSaveQueryLimit(
    payload.accountId
  );
  bundle.saveQueryAllotedLimit = saveQueryLimits.max_save_query.alloted_limit;
  bundle.saveQueryConsumedLimit =
    saveQueryLimits.max_save_query.alloted_limit -
    saveQueryLimits.max_save_query.remaining_limit;

  bundle.dayQueryConsumedLimit =
    daySearchLimits.max_query_per_day.alloted_limit -
    daySearchLimits.max_query_per_day.remaining_limit;
  bundle.dayQueryAlottedLimit = daySearchLimits.max_query_per_day.alloted_limit;
  res.status(200).json(bundle);
}

const fetchExploreShipmentsStatistics = (req, res) => {
  let payload = req.body;
  let tradeType = payload.tradeType
    ? payload.tradeType.trim().toUpperCase()
    : null;
  let countryCode = payload.countryCode
    ? payload.countryCode.trim().toUpperCase()
    : null;
  let tradeTotalRecords = payload.tradeTotalRecords
    ? payload.tradeTotalRecords
    : null;
  let country = payload.country ? payload.country.trim().toUpperCase() : null;

  const dataBucket = TradeSchema.deriveDataBucket(tradeType, country);

  //

  TradeModel.findTradeShipmentStatisticsAggregation(
    payload,
    dataBucket,
    0,
    0,
    (error, shipmentDataPack) => {
      if (error) {
        logger.log(
          ` TRADE CONTROLLER ================== ${JSON.stringify(error)}`
        );
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        let bundle = {};

        if (!shipmentDataPack) {
          bundle.recordsTotal = 0;
          bundle.recordsFiltered = 0;
          bundle.error = "Unrecognised Shipments Response"; //Show if to be interpreted as error on client-side
        } else {
          let recordsTotal =
            shipmentDataPack[TradeSchema.RESULT_PORTION_TYPE_SUMMARY].length > 0
              ? shipmentDataPack[TradeSchema.RESULT_PORTION_TYPE_SUMMARY][0]
                .count
              : 0;
          bundle.recordsTotal =
            tradeTotalRecords != null ? tradeTotalRecords : recordsTotal;
          bundle.recordsFiltered = recordsTotal;

          bundle.summary = {};
          bundle.filter = {};
          for (const prop in shipmentDataPack) {
            if (shipmentDataPack.hasOwnProperty(prop)) {
              if (prop.indexOf("SUMMARY") === 0) {
                if (prop === "SUMMARY_RECORDS") {
                  bundle.summary[prop] = recordsTotal;
                } else {
                  bundle.summary[prop] = shipmentDataPack[prop];
                }
              }
              if (prop.indexOf("FILTER") === 0) {
                bundle.filter[prop] = shipmentDataPack[prop];
              }
              //
            }
          }
        }

        res.status(200).json(bundle);
      }
    }
  );
};

const fetchExploreShipmentsTraders = (req, res) => {
  let payload = req.body;
  let tradeType = payload.tradeType
    ? payload.tradeType.trim().toUpperCase()
    : null;
  let countryCode = payload.countryCode
    ? payload.countryCode.trim().toUpperCase()
    : null;
  let country = payload.country ? payload.country.trim().toUpperCase() : null;

  const dataBucket = TradeSchema.deriveDataBucket(tradeType, country);

  //

  TradeModel.findTradeShipmentsTraders(
    payload,
    dataBucket,
    (error, shipmentDataPack) => {
      if (error) {
        logger.log(
          ` TRADE CONTROLLER ================== ${JSON.stringify(error)}`
        );
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        res.status(200).json({
          data: shipmentDataPack,
        });
      }
    }
  );
};

const fetchExploreShipmentsTradersByPattern = (req, res) => {
  let payload = {};

  payload.tradeType = req.body.tradeType
    ? req.body.tradeType.trim().toUpperCase()
    : null;
  payload.country = req.body.countryCode
    ? req.body.countryCode.trim().toUpperCase()
    : null;
  payload.dateField = req.body.dateField ? req.body.dateField : null;
  payload.hs_code_digit_classification = req.body.hs_code_digit_classification
    ? req.body.hs_code_digit_classification
    : 8;
  payload.searchTerm = req.body.searchTerm ? req.body.searchTerm : null;
  payload.searchField = req.body.searchField ? req.body.searchField : null;
  payload.startDate = req.body.startDate ? req.body.startDate : null;
  payload.endDate = req.body.endDate ? req.body.endDate : null;
  payload.indexNamePrefix = TradeSchema.deriveDataBucket(
    payload.tradeType.toLocaleLowerCase(),
    payload.country.toLocaleLowerCase()
  );

  if (req.body.blCountry) {
    payload.blCountry = req.body.blCountry ? req.body.blCountry : null;
  }
  if (payload.blCountry != null) {
    payload.blCountry = payload.blCountry.replace(/_/g, " ");
  }
  console.log(payload);
  if (
    date.isValid(payload.startDate, "YYYY-MM-DD") &&
    date.isValid(payload.endDate, "YYYY-MM-DD")
  ) {
    TradeModel.findTradeShipmentsTradersByPatternEngine(
      payload,
      (error, shipmentTraders) => {
        if (error) {
          logger.log(
            ` TRADE CONTROLLER ================== ${JSON.stringify(error)}`
          );
          res.status(500).json({
            message: "Internal Server Error",
          });
        } else {
          res.status(200).json({
            data: shipmentTraders,
          });
        }
      }
    );
  } else {
    logger.log("Trade Controller => StartDate/EndDate is not valid");
    res.status(500).json({
      message: "Internal Server Error, Please try again",
    });
  }
};

const fetchExploreShipmentsEstimate = (req, res) => {
  let payload = req.query;
  let tradeType = payload.tradeType
    ? payload.tradeType.trim().toUpperCase()
    : null;
  let countryCode = payload.countryCode
    ? payload.countryCode.trim().toUpperCase()
    : null;
  let tradeYear = payload.tradeYear ? payload.tradeYear : null;
  let country = payload.country ? payload.country.trim().toUpperCase() : null;

  const dataBucket = TradeSchema.deriveDataBucket(tradeType, country);

  TradeModel.findShipmentsCount(dataBucket, (error, shipmentEstimate) => {
    if (error) {
      logger.log(
        ` TRADE CONTROLLER ================== ${JSON.stringify(error)}`
      );
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      res.status(200).json({
        data: shipmentEstimate,
      });
    }
  });
};

/** Controller fumction to get the summary of a company. */
const fetchCompanySummary = async (req, res) => {
  fetchCompanyDetails(req, res, false);
};

/** Function to get comapny details for summary and recommendation */
const fetchCompanyDetails = async (req, res, isrecommendationDataRequest) => {
  const payload = req.body;
  let tradeType = payload.tradeType.trim().toUpperCase();
  const country = payload.country.trim().toUpperCase();
  const searchTerm = payload.searchTerm.trim().toUpperCase();
  const blCountry = payload.blCountry;
  const startDate = payload.dateRange.startDate ?? null;
  const endDate = payload.dateRange.endDate ?? null;
  if (blCountry != null) {
    blCountry = blCountry.replace(/_/g, " ");
  }
  try {
    if (!isrecommendationDataRequest) {
      var summaryLimitCountResult = await TradeModel.getSummaryLimit(
        req.user.account_id
      );
      if (summaryLimitCountResult?.max_summary_limit?.remaining_limit <= 0) {
        return res.status(409).json({
          message: "Out of View Summary Limit , Please Contact Administrator.",
        });
      }
    }

    let bundle = {};
    let searchingColumns = {};

    let dataBucket = TradeSchema.deriveDataBucket(tradeType, country);
    let tradeMeta = {
      tradeType: tradeType,
      countryCode: country,
      indexNamePrefix: dataBucket,
      blCountry,
    };
    let summaryColumn = await TradeModel.findCountrySummary(
      payload.taxonomy_id
    );
    if (summaryColumn && summaryColumn.length === 0) {
      summaryColumn = await TradeModel.createSummaryForNewCountry(
        payload.taxonomy_id
      );
    }

    for (let matchExp of summaryColumn[0].matchExpression) {
      switch (matchExp.identifier) {
        case "SEARCH_HS_CODE":
          searchingColumns.codeColumn = matchExp.fieldTerm;
          break;
        case "SEARCH_BUYER":
          if (tradeType === "IMPORT") {
            searchingColumns.buyerName = matchExp.fieldTerm;
            searchingColumns.searchField = matchExp.fieldTerm;
          } else {
            searchingColumns.sellerName = matchExp.fieldTerm;
          }
          break;
        case "FILTER_PRICE":
          if (matchExp.metaTag === "USD") {
            searchingColumns.priceColumn = matchExp.fieldTerm;
          }
          break;
        case "FILTER_PORT":
          searchingColumns.portColumn = matchExp.fieldTerm;
          break;
        case "SEARCH_SELLER":
          if (tradeType === "IMPORT") {
            searchingColumns.sellerName = matchExp.fieldTerm;
          } else {
            searchingColumns.buyerName = matchExp.fieldTerm;
            searchingColumns.searchField = matchExp.fieldTerm;
          }
          break;
        case "SEARCH_MONTH_RANGE":
          searchingColumns.dateColumn = matchExp.fieldTerm;
          break;
        case "FILTER_UNIT":
          searchingColumns.unitColumn = matchExp.fieldTerm;
          break;
        case "FILTER_QUANTITY":
          searchingColumns.quantityColumn = matchExp.fieldTerm;
          break;
        case "FILTER_COUNTRY":
          searchingColumns.countryColumn = matchExp.fieldTerm;
          break;
      }
    }

    const tradeCompanies = await TradeModel.findCompanyDetailsByPatternEngine(
      searchTerm,
      tradeMeta,
      startDate,
      endDate,
      searchingColumns,
      isrecommendationDataRequest
    );

    if (isrecommendationDataRequest) {
      return tradeCompanies.FILTER_BUYER_SELLER;
    } else {
      try {
        summaryLimitCountResult.max_summary_limit.remaining_limit =
          summaryLimitCountResult?.max_summary_limit?.remaining_limit - 1;
        await TradeModel.updateDaySearchLimit(
          req.user.account_id,
          summaryLimitCountResult
        );
      } catch (error) {
        logger.log(
          req.user.user_id,
          ` TRADE CONTROLLER ================== ${JSON.stringify(error)}`
        );
      }
      getBundleData(tradeCompanies, bundle, country);

      bundle.consumedCount =
        summaryLimitCountResult.max_summary_limit.alloted_limit -
        summaryLimitCountResult.max_summary_limit.remaining_limit;
      bundle.allotedCount =
        summaryLimitCountResult.max_summary_limit.alloted_limit;
      res.status(200).json(bundle);
    }
  } catch (error) {
    logger.log(` TRADE CONTROLLER ================== ${JSON.stringify(error)}`);
    if (isrecommendationDataRequest) {
      throw error;
    } else {
      res.status(500).json({
        message: "Internal Server Error",
      });
    }
  }
};

//create view column
const createOrUpdateExploreViewColumns = async (req, res) => {
  let payload = req.body;
  try {
    await TradeModel.addOrUpdateViewColumn(req.user.user_id, payload);

    res.status(200).json({
      data: "Columns successfully added.",
    });
  } catch (error) {
    res.status(500).json({
      data: error,
    });
  }
};

async function getExploreViewColumns(req, res) {
  let taxonomyId = req.params.taxonomy_id
    ? req.params.taxonomy_id.trim()
    : null;
  try {
    if (taxonomyId) {
      const selectedColumns =
        await TradeModel.findExploreViewColumnsByTaxonomyId(
          taxonomyId,
          req.user.user_id
        );

      res.status(200).json({
        data: selectedColumns,
      });
    } else {
      res.status(405).json({
        message: "Taxonomy id can not be null",
      });
    }
  } catch (error) {
    logger.log(
      req.user.user_id,
      "TRADE CONTROLLER ==================",
      JSON.stringify(error)
    );
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

function getBundleData(tradeCompanies, bundle, country) {
  let recordsTotal =
    tradeCompanies[TradeSchema.RESULT_PORTION_TYPE_SUMMARY].length > 0
      ? tradeCompanies[TradeSchema.RESULT_PORTION_TYPE_SUMMARY][0].count
      : 0;
  bundle.recordsTotal = recordsTotal;
  bundle.summary = {};
  bundle.filter = {};
  bundle.chart = {};
  bundle.data = tradeCompanies.RECORD_SET[0];
  for (const prop in tradeCompanies) {
    if (tradeCompanies.hasOwnProperty(prop)) {
      if (prop.indexOf("SUMMARY") === 0) {
        if (prop === "SUMMARY_RECORDS") {
          bundle.summary[prop] = recordsTotal;
        } else {
          if (
            prop.toLowerCase() == "summary_shipments" &&
            country.toLowerCase() == "indonesia"
          ) {
            bundle.summary[prop] = recordsTotal;
          } else {
            bundle.summary[prop] = tradeCompanies[prop];
          }
        }
      } else if (prop.indexOf("FILTER") === 0) {
        bundle.filter[prop] = tradeCompanies[prop];
      }
    }
  }
}
// */10 * * * * *
// 00 00 00 * * *
const dayQueryLimitResetJob = new CronJob({
  cronTime: "00 00 00 * * *",
  onTick: async () => {
    const action = TAG + " , Method = dayQueryLimitResetJob , AccountId = ";

    console.log("dayQueryLimitResetJob -> Entry");
    logger.log("dayQueryLimitResetJob -> Entry");
    try {
      if (
        process.env.MONGOCLUSTER == "cluster-search-benchmar.dhtuw.mongodb.net"
      ) {
        let userAccounts = await AccountModel.getAllUserAccounts();
        console.log(userAccounts.length);
        let index = 0;
        for (let account of userAccounts) {
          try {
            console.log(index++);
            let daySearchLimits = await TradeModel.getDaySearchLimit(
              account._id
            );
            daySearchLimits.max_query_per_day.remaining_limit =
              daySearchLimits?.max_query_per_day?.alloted_limit;
            await TradeModel.updateDaySearchLimit(account._id, daySearchLimits);
          } catch (error) {
            logger.log(action + account._id + " , Error = " + error);
            console.log(action + account._id + " , Error = " + error);
            continue;
          }
        }
        logger.log("end of this cron job");
        logger.log("dayQueryLimitResetJob -> Exit");
        console.log("dayQueryLimitResetJob -> end of this cron job");
        console.log("dayQueryLimitResetJob -> Exit");
      }
    } catch (e) {
      logger.log("dayQueryLimitResetJob -> " + "Error = " + e);
    }
  },
  start: false,
  timeZone: "Asia/Kolkata", //'Asia/Singapore'
});
dayQueryLimitResetJob.start();

const getSortSchema = async (req, res) => {
  try {
    let payload = {};
    payload.taxonomy = req.body.taxonomy ? req.body.taxonomy : null;

    if (payload) {
      payload.result = await TradeModel.checkSortSchema(payload);
      if (payload.result.length > 0) {
        res.status(200).json({
          result: payload.result,
        });
      } else {
        payload.mapping = await TradeModel.getSortMapping(payload);
        payload.sortMapping = TradeSchema.getSortSchema(payload);
        payload.sortSchema = await TradeModel.createSortSchema(payload);
        res.status(200).json({
          result: payload.sortSchema,
        });
      }
    } else {
      logger.log("TRADE CONTROLLER ==================", JSON.stringify(error));
      res.status(500).json({
        message: "Internal Server Error",
      });
    }
  } catch (error) {
    logger.log(
      req.user.user_id,
      "TRADE CONTROLLER ==================",
      JSON.stringify(error)
    );
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const fetchAdxData = async (req, res) => {
  try {
    // const results = await TradeModel.RetrieveAdxData(req.body);
    const results = await TradeModel.RetrieveAdxDataOptimized(req.body);

    let dataToReturn = {
      "recordsTotal": 24858,
      "recordsFiltered": 24858,
      "summary": results["summary"][0],
      "data": results["data"],
      "risonQuery": "(query:(bool:(filter:!((bool:(must:!(),should:!()))),must:!((bool:(should:!((range:(HS_CODE.number:(gte:32000000,lte:32999999)))))),(bool:(should:!())),(range:(IMP_DATE:(gte:'2023-05-30T00:00:00.000Z',lte:'2023-06-30T00:00:00.000Z')))),must_not:!(),should:!())))",
      "draw": 2,
      "saveQueryAllotedLimit": 10000,
      "saveQueryConsumedLimit": -15,
      "dayQueryConsumedLimit": 21,
      "dayQueryAlottedLimit": 100000
    }

    res.status(200).json(dataToReturn)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Internal server error!" })
  }
}

/** fetch records summary */
const fetchAdxRecordsSummary = async (req, res) => {
  try {
    // const results = await TradeModel.RetrieveAdxData(req.body);
    const results = await TradeModel.RetrieveAdxDataSummary(req.body);

    let dataToReturn = {
      "recordsTotal": 24858,
      "recordsFiltered": 24858,
      "summary": results["summary"][0],
      "data": results["data"],
      "risonQuery": "(query:(bool:(filter:!((bool:(must:!(),should:!()))),must:!((bool:(should:!((range:(HS_CODE.number:(gte:32000000,lte:32999999)))))),(bool:(should:!())),(range:(IMP_DATE:(gte:'2023-05-30T00:00:00.000Z',lte:'2023-06-30T00:00:00.000Z')))),must_not:!(),should:!())))",
      "draw": 2,
      "saveQueryAllotedLimit": 10000,
      "saveQueryConsumedLimit": -15,
      "dayQueryConsumedLimit": 21,
      "dayQueryAlottedLimit": 100000
    }

    res.status(200).json(dataToReturn)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Internal server error!" })
  }
}

const fetchAdxFilters = async (req, res) => {
  try {
    // const results = await TradeModel.RetrieveAdxDataFilters(req.body);
    const results = await TradeModel.RetrieveAdxDataFiltersUsingMaterialize(req.body);

    // let dataToReturn = {
    //   "recordsTotal": 24858,
    //   "recordsFiltered": 24858,
    //   "summary": results["aggregations"][0],
    //   "data": results["data"],
    //   "risonQuery": "(query:(bool:(filter:!((bool:(must:!(),should:!()))),must:!((bool:(should:!((range:(HS_CODE.number:(gte:32000000,lte:32999999)))))),(bool:(should:!())),(range:(IMP_DATE:(gte:'2023-05-30T00:00:00.000Z',lte:'2023-06-30T00:00:00.000Z')))),must_not:!(),should:!())))",
    //   "draw": 2,
    //   "saveQueryAllotedLimit": 10000,
    //   "saveQueryConsumedLimit": -15,
    //   "dayQueryConsumedLimit": 21,
    //   "dayQueryAlottedLimit": 100000
    // }

    res.status(200).json(results)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Internal server error!" })
  }
}

const fetchAdxSuggestions = async (req, res) => {
  try {
    const results = await TradeModel.RetrieveAdxDataSuggestions(req.body);

    // let dataToReturn = {
    //   "recordsTotal": 24858,
    //   "recordsFiltered": 24858,
    //   "summary": results["aggregations"][0],
    //   "data": results["data"],
    //   "risonQuery": "(query:(bool:(filter:!((bool:(must:!(),should:!()))),must:!((bool:(should:!((range:(HS_CODE.number:(gte:32000000,lte:32999999)))))),(bool:(should:!())),(range:(IMP_DATE:(gte:'2023-05-30T00:00:00.000Z',lte:'2023-06-30T00:00:00.000Z')))),must_not:!(),should:!())))",
    //   "draw": 2,
    //   "saveQueryAllotedLimit": 10000,
    //   "saveQueryConsumedLimit": -15,
    //   "dayQueryConsumedLimit": 21,
    //   "dayQueryAlottedLimit": 100000
    // }

    res.status(200).json(results)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Internal server error!" })
  }
}

module.exports = {
  fetchExploreCountries,
  fetchBLExploreCountries,
  fetchCountries,
  fetchExploreShipmentsSpecifications,
  fetchExploreShipmentsRecords,
  fetchExploreShipmentsStatistics,
  fetchExploreShipmentsTraders,
  fetchExploreShipmentsTradersByPattern,
  fetchExploreShipmentsEstimate,
  fetchExploreShipmentsFilters,
  fetchCompanySummary,
  fetchCompanyDetails,
  createOrUpdateExploreViewColumns,
  getExploreViewColumns,
  getSortSchema,
  fetchAdxData,
  fetchAdxFilters,
  fetchAdxSuggestions,
  fetchAdxRecordsSummary
};
