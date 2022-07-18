const TAG = "tradeController";

const TradeModel = require("../models/tradeModel");
const WorkspaceModel = require("../models/workspaceModel");
const TradeSchema = require("../schemas/tradeSchema");


const recommendationModel = require("../models/recommendationModel");
const recommendationSchema = require("../schemas/recommendationSchema");

const DateHelper = require("../helpers/dateHelper");

const TRADE_SHIPMENT_RESULT_TYPE_RECORDS = "RECORDS";
const TRADE_SHIPMENT_RESULT_TYPE_SUMMARY = "SUMMARY";
const TRADE_SHIPMENT_RESULT_TYPE_FILTER = "FILTER";

const QUERY_PARAM_VALUE_WORKSPACE = "workspace";

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


  TradeModel.findTradeCountries(tradeType, constraints, (error, countries) => {
    if (error) {
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      TradeModel.findBlTradeCountries(
        tradeType,
        constraints,
        (error, blCountries) => {
          if (error) {
            res.status(500).json({
              message: "Internal Server Error",
            });
          } else {
            res.status(200).json({
              data: {
                countries,
                blCountries,
              },
            });
          }
        }
      );
    }
  });
};

const fetchCountries = (req, res) => {
  let constraints = {};

  TradeModel.findTradeCountriesRegion((error, countries) => {
    if (error) {
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

const fetchExploreShipmentsSpecifications = (req, res) => {
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
    account_id: req.user.account_id
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

  if (constraints && constraints.allowedCountries.includes(countryCode)) {
    TradeModel.findTradeShipmentSpecifications(
      bl_flag,
      tradeType,
      countryCode,
      constraints,
      (error, shipmentSpecifications) => {
        if (error) {
          res.status(500).json({
            message: "Internal Server Error",
          });
        } else {
          let payload = {
            user_id: userDetails.user_id,
            account_id: userDetails.account_id,
            tradeType: tradeType,
            country: country
          }
          let offset = 0;
          let limit = req.plan.max_favorite_shipment_count != null ? req.plan.max_favorite_shipment_count : 10;


          const shipment = recommendationSchema.fetchTradeShipmentListSchema(payload);
          var favoriteCompany = recommendationModel.findCompanyRecommendationList(shipment, offset, limit)
          recommendationModel.findShipmentRecommendationList(shipment, offset, limit, async (error, favoriteShipment) => {
            if (error) {
              res.status(500).json({
                message: "Internal Server Error",
              });
            } else {
              try {
                res.status(200).json({
                  data: shipmentSpecifications,
                  favoriteShipment: favoriteShipment,
                  favoriteCompany: await favoriteCompany
                });
              } catch (e) {
                res.status(500).json({
                  message: "Internal Server Error",
                });
              }
            }
          });
        }
      });
  } else {
    // TODO:Unauthorised Country Access
    res.status(200).json({
      data: [],
    });
  }
};

const fetchExploreShipmentsRecords = async (req, res) => {
  let payload = req.body;

  //payload.isEngine = true;
  let maxQueryPerDay = req.plan.max_query_per_day ? req.plan.max_query_per_day : 10000;
  var output = await TradeModel.findQueryCount(payload.userId, maxQueryPerDay)
  if (!output[0]) {
    return res.status(200).json({
      message: 'out of search for the day',
    });
  }

  const resultType = (payload.resultType) ? payload.resultType.trim() : null;
  const accountId = (payload.accountId) ? payload.accountId.trim() : null;
  const userId = (payload.userId) ? payload.userId.trim() : null;

  const tradeType = (payload.tradeType) ? payload.tradeType.trim().toUpperCase() : null;
  const countryCode = (payload.countryCode) ? payload.countryCode.trim().toUpperCase() : null;
  const tradeYear = (payload.tradeYear) ? payload.tradeYear : null;
  const tradeTotalRecords = (payload.tradeTotalRecords) ? payload.tradeTotalRecords : null;

  const pageKey = (payload.draw && payload.draw != 0) ? payload.draw : null;
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

  // const dataBucket = "india_import"
  //

  const recordPurchaseKeeperParams = {
    tradeType: tradeType,
    countryCode: countryCode,
    tradeYear: tradeYear,
  };

  if (resultType == TRADE_SHIPMENT_RESULT_TYPE_RECORDS) {
    TradeModel.findTradeShipmentRecords(
      payload,
      dataBucket,
      accountId,
      recordPurchaseKeeperParams,
      offset,
      limit,
      (error, shipmentDataPack) => {
        if (error) {
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
            let recordsTotal = 1000; // TODO: Records Filtered Count Mapping
            bundle.recordsTotal =
              tradeTotalRecords != null ? tradeTotalRecords : recordsTotal;
            bundle.recordsFiltered = recordsTotal;

            bundle.summary = {};
            bundle.filter = {};

            //

            // TODO: Taxonomy Mapping Currently Focussed ForIndia Import Export Test
            // To Move In Taxonomy
            if (countryCode == "IND") {
              shipmentDataPack.forEach((shipmentElement) => {
                if (tradeType == "IMPORT") {
                  if (shipmentElement.purchased.length == 0) {
                    shipmentElement.BE_NO = "********";
                    shipmentElement.IEC = "********";
                    shipmentElement.IMPORTER_NAME = "********";
                    shipmentElement.ADDRESS = "********";
                    shipmentElement.CITY = "********";
                    shipmentElement.SUPPLIER_NAME = "********";
                    shipmentElement.SUPPLIER_ADDRESS = "********";
                  }
                } else if (tradeType == "EXPORT") {
                  if (shipmentElement.purchased.length == 0) {
                    shipmentElement.BILL_NO = "********";
                    shipmentElement.IEC = "********";
                    shipmentElement.EXPORTER_NAME = "********";
                    shipmentElement.ADDRESS = "********";
                    shipmentElement.CITY = "********";
                    shipmentElement.BUYER_NAME = "********";
                    shipmentElement.BUYER_ADDRESS = "********";
                  }
                }
              });
            }
          }

          if (pageKey) {
            bundle.draw = pageKey;
          }

          bundle.data = shipmentDataPack;
          res.status(200).json(bundle);
        }
      }
    );
  } else if (resultType == TRADE_SHIPMENT_RESULT_TYPE_SUMMARY) {
    TradeModel.findTradeShipmentSummary(
      payload,
      dataBucket,
      null,
      null,
      (error, shipmentDataPack) => {
        if (error) {
          res.status(500).json({
            message: "Internal Server Error",
          });
        } else {
          let bundle = {};

          if (!shipmentDataPack) {
            bundle.error = "Unrecognised Shipments Response"; //Show if to be interpreted as error on client-side
          } else {
            bundle.summary = {};
            for (const prop in shipmentDataPack) {
              if (shipmentDataPack.hasOwnProperty(prop)) {
                if (prop.indexOf("SUMMARY") === 0) {
                  if (prop === "SUMMARY_RECORDS") {
                    bundle.summary[prop] =
                      shipmentDataPack[TradeSchema.RESULT_PORTION_TYPE_SUMMARY]
                        .length > 0
                        ? shipmentDataPack[
                          TradeSchema.RESULT_PORTION_TYPE_SUMMARY
                        ][0].count
                        : 0;
                  } else {
                    bundle.summary[prop] = shipmentDataPack[prop];
                  }
                }
              }
            }
          }

          res.status(200).json(bundle);
        }
      }
    );
  } else if (resultType == TRADE_SHIPMENT_RESULT_TYPE_FILTER) {
    TradeModel.findTradeShipmentFilter(
      payload,
      dataBucket,
      null,
      null,
      (error, shipmentDataPack) => {
        if (error) {
          res.status(500).json({
            message: "Internal Server Error",
          });
        } else {
          let bundle = {};

          if (!shipmentDataPack) {
            bundle.error = "Unrecognised Shipments Response"; //Show if to be interpreted as error on client-side
          } else {
            bundle.filter = {};
            for (const prop in shipmentDataPack) {
              if (shipmentDataPack.hasOwnProperty(prop)) {
                if (prop.indexOf("FILTER") === 0) {
                  bundle.filter[prop] = shipmentDataPack[prop];
                }
              }
            }
          }

          bundle.data = []; // No records to be returned
          res.status(200).json(bundle);
        }
      }
    );
  } else {
    //findTradeShipmentRecordsAggregation findTradeShipmentRecordsAggregationEngine
    if (!payload.isEngine) {
      TradeModel.findTradeShipmentRecordsAggregation(
        payload,
        dataBucket,
        accountId,
        recordPurchaseKeeperParams,
        offset,
        limit,
        (error, shipmentDataPack) => {
          if (error) {
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
                shipmentDataPack[TradeSchema.RESULT_PORTION_TYPE_SUMMARY]
                  .length > 0
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
                }
              }

              //

              // TODO: Taxonomy Mapping
              if (countryCode == "IND") {
                shipmentDataPack[
                  TradeSchema.RESULT_PORTION_TYPE_RECORDS
                ].forEach((shipmentElement) => {
                  if (tradeType == "IMPORT") {
                    if (shipmentElement.purchased.length == 0) {
                      shipmentElement.BE_NO = "********";
                      shipmentElement.IEC = "********";
                      shipmentElement.IMPORTER_NAME = "********";
                      shipmentElement.ADDRESS = "********";
                      shipmentElement.CITY = "********";
                      shipmentElement.SUPPLIER_NAME = "********";
                      shipmentElement.SUPPLIER_ADDRESS = "********";
                    }
                  } else if (tradeType == "EXPORT") {
                    if (shipmentElement.purchased.length == 0) {
                      shipmentElement.BILL_NO = "********";
                      shipmentElement.IEC = "********";
                      shipmentElement.EXPORTER_NAME = "********";
                      shipmentElement.ADDRESS = "********";
                      shipmentElement.CITY = "********";
                      shipmentElement.BUYER_NAME = "********";
                      shipmentElement.BUYER_ADDRESS = "********";
                    }
                  }
                });
              }
            }

            if (pageKey) {
              bundle.draw = pageKey;
            }

            bundle.data =
              shipmentDataPack[TradeSchema.RESULT_PORTION_TYPE_RECORDS];
            res.status(200).json(bundle);
          }
        }
      );
    } else {
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
        (error, shipmentDataPack) => {
          if (error) {
            res.status(500).json({
              message: "Internal Server Error",
            });
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
              let recordsTotal =
                shipmentDataPack[TradeSchema.RESULT_PORTION_TYPE_SUMMARY]
                  .length > 0
                  ? shipmentDataPack[TradeSchema.RESULT_PORTION_TYPE_SUMMARY][0]
                    .count
                  : 0;
              bundle.recordsTotal =
                tradeTotalRecords != null ? tradeTotalRecords : recordsTotal;
              bundle.recordsFiltered = recordsTotal;

              bundle.summary = {};
              bundle.filter = {};
              bundle.data = {};
              bundle.maxQueryPerDay = maxQueryPerDay;
              bundle.count = output[1];
              bundle.risonQuery = shipmentDataPack.risonQuery;
              for (const prop in shipmentDataPack) {
                if (shipmentDataPack.hasOwnProperty(prop)) {
                  if (prop.indexOf("SUMMARY") === 0) {
                    if (prop === "SUMMARY_RECORDS") {
                      bundle.summary[prop] = recordsTotal;
                    } else {
                      // console.log(prop, country)
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
                  if (prop.indexOf("FILTER") === 0) {
                    bundle.filter[prop] = shipmentDataPack[prop];
                  }
                }
              }
              if (req.plan.is_hidden) {
                WorkspaceModel.findShipmentRecordsPurchasableAggregation(
                  payload.accountId,
                  payload.tradeType.toUpperCase(),
                  payload.country.toUpperCase(),
                  shipmentDataPack.idArr,
                  (error, purchasableRecords) => {
                    if (error) {
                      console.log(error);
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
                      res.status(200).json(bundle);
                    }
                  }
                );
              } else {
                if (pageKey) {
                  bundle.draw = pageKey;
                }
                bundle.data = [
                  ...shipmentDataPack[TradeSchema.RESULT_PORTION_TYPE_RECORDS],
                ];
                res.status(200).json(bundle);
              }
            }
          }
        }
      );
    }
  }
};

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
  let payload = req.body;
  let tradeType = payload.tradeType
    ? payload.tradeType.trim().toUpperCase()
    : null;
  let country = payload.countryCode
    ? payload.countryCode.trim().toUpperCase()
    : null;
  let dateField = payload.dateField ? payload.dateField : null;
  let searchTerm = payload.searchTerm ? payload.searchTerm : null;
  let searchField = payload.searchField ? payload.searchField : null;
  let startDate = payload.startDate ? payload.startDate : null;
  let endDate = payload.endDate ? payload.endDate : null;
  let blCountry = payload.blCountry ? payload.blCountry : null;
  if (blCountry != null) {
    blCountry = blCountry.replace(/_/g, " ");
  }

  let tradeMeta = {
    tradeType: tradeType,
    countryCode: country,
    startDate,
    endDate,
    dateField,
    indexNamePrefix:
      country.toLocaleLowerCase() + "_" + tradeType.toLocaleLowerCase(),
    blCountry,
  };

  TradeModel.findTradeShipmentsTradersByPatternEngine(
    searchTerm,
    searchField,
    tradeMeta,
    (error, shipmentTraders) => {
      if (error) {
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
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      res.status(200).json({
        data: shipmentEstimate,
      });
    }
  });
}

const fetchCompanyDetails = async (req, res) => {
  const payload = req.body;
  let tradeType = payload.tradeType ? payload.tradeType.trim().toUpperCase() : null;
  const country = payload.country ? payload.country.trim().toUpperCase() : null;
  let searchField = payload.searchField ? payload.searchField.trim().toUpperCase() : null;
  const searchTerm = payload.searchTerm ? payload.searchTerm.trim().toUpperCase() : null;
  const blCountry = payload.blCountry ? payload.blCountry : null;
  if (blCountry != null) {
    blCountry = blCountry.replace(/_/g, " ");
  }


  const tradeTypes = ["IMPORT", "EXPORT"];
  try {
    let bundle = {}
    let importData = {}
    let exportData = {}
    for (let i = 0; i < tradeTypes.length; i++) {
      tradeType = tradeTypes[i];
      /*temporary useCase for country India , we have to map values in other countries in taxonomy*/
      searchField = (tradeType == "IMPORT") ? "IMPORTER_NAME" : "EXPORTER_NAME";

      let groupExpressions = await TradeModel.getGroupExpressions(country, tradeType);
      let tradeMeta = {
        tradeType: tradeType,
        countryCode: country,
        indexNamePrefix: country.toLocaleLowerCase() + "_" + tradeType.toLocaleLowerCase(),
        blCountry,
        groupExpressions
      }
      const tradeCompanies = await TradeModel.findCompanyDetailsByPatternEngine(searchField, searchTerm, tradeMeta);
      if (tradeType == "IMPORT") {
        getImportBundleData(tradeCompanies, importData, country);
      } else {
        getImportBundleData(tradeCompanies, exportData, country);
      }
    }
    bundle.importData = importData;
    bundle.exportData = exportData;
    res.status(200).json(bundle);
  }
  catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

function getImportBundleData(tradeCompanies, bundle, country) {
  let recordsTotal = (tradeCompanies[TradeSchema.RESULT_PORTION_TYPE_SUMMARY].length > 0) ? tradeCompanies[TradeSchema.RESULT_PORTION_TYPE_SUMMARY][0].count : 0;
  bundle.recordsTotal = recordsTotal;
  bundle.summary = {};
  bundle.filter = {};
  bundle.data = tradeCompanies.RECORD_SET[0];
  for (const prop in tradeCompanies) {
    if (tradeCompanies.hasOwnProperty(prop)) {
      if (prop.indexOf("SUMMARY") === 0) {
        if (prop === "SUMMARY_RECORDS") {
          bundle.summary[prop] = recordsTotal;
        } else {
          if (prop.toLowerCase() == "summary_shipments" && country.toLowerCase() == "indonesia") {
            bundle.summary[prop] = recordsTotal;
          } else {
            bundle.summary[prop] = tradeCompanies[prop];
          }
        }
      }
      if (prop.indexOf("FILTER") === 0) {
        bundle.filter[prop] = tradeCompanies[prop];
      }
    }
  }
}

module.exports = {
  fetchExploreCountries,
  fetchCountries,
  fetchExploreShipmentsSpecifications,
  fetchExploreShipmentsRecords,
  fetchExploreShipmentsStatistics,
  fetchExploreShipmentsTraders,
  fetchExploreShipmentsTradersByPattern,
  fetchExploreShipmentsEstimate,
  fetchCompanyDetails
}


