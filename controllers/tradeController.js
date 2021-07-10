const TAG = 'tradeController';

const TradeModel = require('../models/tradeModel');
const TradeSchema = require('../schemas/tradeSchema');

const DateHelper = require('../helpers/dateHelper');

const TRADE_SHIPMENT_RESULT_TYPE_RECORDS = "RECORDS";
const TRADE_SHIPMENT_RESULT_TYPE_SUMMARY = "SUMMARY";
const TRADE_SHIPMENT_RESULT_TYPE_FILTER = "FILTER";

const QUERY_PARAM_VALUE_WORKSPACE = 'workspace';

const fetchExploreCountries = (req, res) => {
  let tradeType = (req.query.tradeType) ? req.query.tradeType.trim().toUpperCase() : null;
  let countryCode = (req.query.countryCode) ? req.query.countryCode.trim().toUpperCase() : null;
  let tradeYear = (req.query.tradeYear) ? req.query.tradeYear.trim().toUpperCase() : null;
  let isPublished = (req.query.isPublished) ? req.query.isPublished.trim().toUpperCase() : null;
  let filters = {
    tradeType: tradeType,
    countryCode: countryCode,
    tradeYear: tradeYear,
    isPublished: isPublished
  };

  let constraints = {};
  if (req.plan) {
    constraints.allowedCountries = req.plan.countries_available;
    constraints.dataAccessYears = DateHelper.getDateDifferenceAsYears(req.plan.data_availability_interval.start_date,
      req.plan.data_availability_interval.end_date).map(x => `${x}`);
  }
  console.log(constraints);

  TradeModel.findTradeCountries(tradeType, constraints, (error, countries) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        data: countries
      });
    }
  });
};

const fetchExploreShipmentsSpecifications = (req, res) => {
  let tradeType = (req.query.tradeType) ? req.query.tradeType.trim().toUpperCase() : null;
  let countryCode = (req.query.countryCode) ? req.query.countryCode.trim().toUpperCase() : null;
  let tradeYear = (req.query.tradeYear) ? req.query.tradeYear.trim().toUpperCase() : null;

  let filters = {
    tradeType: tradeType,
    countryCode: countryCode
  };

  let constraints = {};
  if (req.plan) {
    constraints.allowedCountries = req.plan.countries_available;
    constraints.dataAccessYears = DateHelper.getDateDifferenceAsYears(req.plan.data_availability_interval.start_date,
      req.plan.data_availability_interval.end_date).map(x => `${x}`);
  }

  if (constraints && constraints.allowedCountries.includes(countryCode)) {
    TradeModel.findTradeShipmentSpecifications(tradeType, countryCode, constraints, (error, shipmentSpecifications) => {
      if (error) {
        res.status(500).json({
          message: 'Internal Server Error',
        });
      } else {
        if (shipmentSpecifications.length == 1) {
          shipmentSpecifications[0].allowedMonthRange = DateHelper.getProjectedYearMonthsFromDateInterval(tradeYear, req.plan.data_availability_interval.start_date,
            req.plan.data_availability_interval.end_date);
          console.log(shipmentSpecifications[0].allowedMonthRange);
        }
        res.status(200).json({
          data: shipmentSpecifications
        });
      }
    });
  } else {
    // TODO:Unauthorised Country Access
    res.status(200).json({
      data: []
    });
  }

};

const fetchExploreShipmentsRecords = (req, res) => {

  let payload = req.body;
  //payload.isEngine = true;

  const resultType = (payload.resultType) ? payload.resultType.trim() : null;
  const accountId = (payload.accountId) ? payload.accountId.trim() : null;

  const tradeType = (payload.tradeType) ? payload.tradeType.trim().toUpperCase() : null;
  const countryCode = (payload.countryCode) ? payload.countryCode.trim().toUpperCase() : null;
  const tradeYear = (payload.tradeYear) ? payload.tradeYear : null;
  const tradeTotalRecords = (payload.tradeTotalRecords) ? payload.tradeTotalRecords : null;

  const pageKey = (payload.draw && payload.draw != 0) ? payload.draw : null;
  let offset = null;
  let limit = null;
  //Datatable JS Mode
  if (pageKey != null) {
    offset = (payload.start != null) ? payload.start : 0;
    limit = (payload.length != null) ? payload.length : 10;
  } else {
    offset = (payload.offset != null) ? payload.offset : 0;
    limit = (payload.limit != null) ? payload.limit : 10;
  }

  // const dataBucket = TradeSchema.deriveDataBucket(tradeType, countryCode, tradeYear);
  const dataBucket = "india_import"
  // console.log(dataBucket);

  const recordPurchaseKeeperParams = {
    tradeType: tradeType,
    countryCode: countryCode,
    tradeYear: tradeYear,
  };

  if (resultType == TRADE_SHIPMENT_RESULT_TYPE_RECORDS) {

    TradeModel.findTradeShipmentRecords(payload, dataBucket, accountId, recordPurchaseKeeperParams, offset, limit, (error, shipmentDataPack) => {
      if (error) {
        res.status(500).json({
          message: 'Internal Server Error',
        });
      } else {
        let bundle = {};

        if (!shipmentDataPack) {
          bundle.recordsTotal = 0;
          bundle.recordsFiltered = 0;
          bundle.error = "Unrecognised Shipments Response"; //Show if to be interpreted as error on client-side
        } else {
          let recordsTotal = 1000; // TODO: Records Filtered Count Mapping
          bundle.recordsTotal = (tradeTotalRecords != null) ? tradeTotalRecords : recordsTotal;
          bundle.recordsFiltered = recordsTotal;

          bundle.summary = {};
          bundle.filter = {};

          //console.log(shipmentDataPack);

          // TODO: Taxonomy Mapping Currently Focussed ForIndia Import Export Test
          // To Move In Taxonomy
          if (countryCode == "IND") {
            shipmentDataPack.forEach(shipmentElement => {
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
    });

  } else if (resultType == TRADE_SHIPMENT_RESULT_TYPE_SUMMARY) {

    TradeModel.findTradeShipmentSummary(payload, dataBucket, null, null, (error, shipmentDataPack) => {
      if (error) {
        res.status(500).json({
          message: 'Internal Server Error',
        });
      } else {
        let bundle = {};

        if (!shipmentDataPack) {
          bundle.error = "Unrecognised Shipments Response"; //Show if to be interpreted as error on client-side
        } else {
          bundle.summary = {};
          for (const prop in shipmentDataPack) {
            if (shipmentDataPack.hasOwnProperty(prop)) {
              if (prop.indexOf('SUMMARY') === 0) {
                if (prop === 'SUMMARY_RECORDS') {
                  bundle.summary[prop] = (shipmentDataPack[TradeSchema.RESULT_PORTION_TYPE_SUMMARY].length > 0) ? shipmentDataPack[TradeSchema.RESULT_PORTION_TYPE_SUMMARY][0].count : 0;
                } else {
                  bundle.summary[prop] = shipmentDataPack[prop];
                }
              }
            }
          }
        }

        res.status(200).json(bundle);
      }
    });

  } else if (resultType == TRADE_SHIPMENT_RESULT_TYPE_FILTER) {

    TradeModel.findTradeShipmentFilter(payload, dataBucket, null, null, (error, shipmentDataPack) => {
      if (error) {
        res.status(500).json({
          message: 'Internal Server Error',
        });
      } else {
        let bundle = {};

        if (!shipmentDataPack) {
          bundle.error = "Unrecognised Shipments Response"; //Show if to be interpreted as error on client-side
        } else {
          bundle.filter = {};
          for (const prop in shipmentDataPack) {
            if (shipmentDataPack.hasOwnProperty(prop)) {
              if (prop.indexOf('FILTER') === 0) {
                bundle.filter[prop] = shipmentDataPack[prop];
              }
            }
          }
        }

        bundle.data = []; // No records to be returned
        res.status(200).json(bundle);
      }
    });

  } else {
    //findTradeShipmentRecordsAggregation findTradeShipmentRecordsAggregationEngine
    if (!payload.isEngine) {
      TradeModel.findTradeShipmentRecordsAggregation(payload, dataBucket, accountId, recordPurchaseKeeperParams, offset, limit, (error, shipmentDataPack) => {
        if (error) {
          res.status(500).json({
            message: 'Internal Server Error',
          });
        } else {
          let bundle = {};

          if (!shipmentDataPack) {
            bundle.recordsTotal = 0;
            bundle.recordsFiltered = 0;
            bundle.error = "Unrecognised Shipments Response"; //Show if to be interpreted as error on client-side
          } else {
            let recordsTotal = (shipmentDataPack[TradeSchema.RESULT_PORTION_TYPE_SUMMARY].length > 0) ? shipmentDataPack[TradeSchema.RESULT_PORTION_TYPE_SUMMARY][0].count : 0;
            bundle.recordsTotal = (tradeTotalRecords != null) ? tradeTotalRecords : recordsTotal;
            bundle.recordsFiltered = recordsTotal;

            bundle.summary = {};
            bundle.filter = {};
            for (const prop in shipmentDataPack) {
              if (shipmentDataPack.hasOwnProperty(prop)) {
                if (prop.indexOf('SUMMARY') === 0) {
                  if (prop === 'SUMMARY_RECORDS') {
                    bundle.summary[prop] = recordsTotal;
                  } else {
                    bundle.summary[prop] = shipmentDataPack[prop];
                  }
                }
                if (prop.indexOf('FILTER') === 0) {
                  bundle.filter[prop] = shipmentDataPack[prop];
                }
              }
            }

            //console.log(shipmentDataPack);

            // TODO: Taxonomy Mapping
            if (countryCode == "IND") {
              shipmentDataPack[TradeSchema.RESULT_PORTION_TYPE_RECORDS].forEach(shipmentElement => {
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

          bundle.data = shipmentDataPack[TradeSchema.RESULT_PORTION_TYPE_RECORDS];
          res.status(200).json(bundle);
        }
      });
    } else {
      TradeModel.findTradeShipmentRecordsAggregationEngine(payload, dataBucket, accountId, recordPurchaseKeeperParams, offset, limit, (error, shipmentDataPack) => {
        if (error) {
          res.status(500).json({
            message: 'Internal Server Error',
          });
        } else {
          let bundle = {};

          if (!shipmentDataPack) {
            bundle.recordsTotal = 0;
            bundle.recordsFiltered = 0;
            bundle.error = "Unrecognised Shipments Response"; //Show if to be interpreted as error on client-side
          } else {
            let recordsTotal = (shipmentDataPack[TradeSchema.RESULT_PORTION_TYPE_SUMMARY].length > 0) ? shipmentDataPack[TradeSchema.RESULT_PORTION_TYPE_SUMMARY][0].count : 0;
            bundle.recordsTotal = (tradeTotalRecords != null) ? tradeTotalRecords : recordsTotal;
            bundle.recordsFiltered = recordsTotal;

            bundle.summary = {};
            bundle.filter = {};
            for (const prop in shipmentDataPack) {
              if (shipmentDataPack.hasOwnProperty(prop)) {
                if (prop.indexOf('SUMMARY') === 0) {
                  if (prop === 'SUMMARY_RECORDS') {
                    bundle.summary[prop] = recordsTotal;
                  } else {
                    bundle.summary[prop] = shipmentDataPack[prop];
                  }
                }
                if (prop.indexOf('FILTER') === 0) {
                  bundle.filter[prop] = shipmentDataPack[prop];
                }
              }
            }

            //console.log(shipmentDataPack);

            // TODO: Taxonomy Mapping
            /*if (countryCode == "IND") {
              shipmentDataPack[TradeSchema.RESULT_PORTION_TYPE_RECORDS].forEach(shipmentElement => {
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
            }*/

          }

          if (pageKey) {
            bundle.draw = pageKey;
          }

          bundle.data = shipmentDataPack[TradeSchema.RESULT_PORTION_TYPE_RECORDS];
          res.status(200).json(bundle);
        }
      });
    }

  }

};

const fetchExploreShipmentsStatistics = (req, res) => {

  let payload = req.body;
  let tradeType = (payload.tradeType) ? payload.tradeType.trim().toUpperCase() : null;
  let countryCode = (payload.countryCode) ? payload.countryCode.trim().toUpperCase() : null;
  let tradeYear = (payload.tradeYear) ? payload.tradeYear : null;
  let tradeTotalRecords = (payload.tradeTotalRecords) ? payload.tradeTotalRecords : null;

  const dataBucket = TradeSchema.deriveDataBucket(tradeType, countryCode, tradeYear);

  // console.log(dataBucket);

  TradeModel.findTradeShipmentStatisticsAggregation(payload, dataBucket, 0, 0, (error, shipmentDataPack) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      let bundle = {};

      if (!shipmentDataPack) {
        bundle.recordsTotal = 0;
        bundle.recordsFiltered = 0;
        bundle.error = "Unrecognised Shipments Response"; //Show if to be interpreted as error on client-side
      } else {
        let recordsTotal = (shipmentDataPack[TradeSchema.RESULT_PORTION_TYPE_SUMMARY].length > 0) ? shipmentDataPack[TradeSchema.RESULT_PORTION_TYPE_SUMMARY][0].count : 0;
        bundle.recordsTotal = (tradeTotalRecords != null) ? tradeTotalRecords : recordsTotal;
        bundle.recordsFiltered = recordsTotal;

        bundle.summary = {};
        bundle.filter = {};
        for (const prop in shipmentDataPack) {
          if (shipmentDataPack.hasOwnProperty(prop)) {
            if (prop.indexOf('SUMMARY') === 0) {
              if (prop === 'SUMMARY_RECORDS') {
                bundle.summary[prop] = recordsTotal;
              } else {
                bundle.summary[prop] = shipmentDataPack[prop];
              }
            }
            if (prop.indexOf('FILTER') === 0) {
              bundle.filter[prop] = shipmentDataPack[prop];
            }
            //console.log(`shipmentDataPack.${prop} = ${shipmentDataPack[prop]}`);
          }
        }
      }

      res.status(200).json(bundle);
    }
  });
};

const fetchExploreShipmentsTraders = (req, res) => {

  let payload = req.body;
  let tradeType = (payload.tradeType) ? payload.tradeType.trim().toUpperCase() : null;
  let countryCode = (payload.countryCode) ? payload.countryCode.trim().toUpperCase() : null;
  let tradeYear = (payload.tradeYear) ? payload.tradeYear : null;

  const dataBucket = TradeSchema.deriveDataBucket(tradeType, countryCode, tradeYear);

  // console.log(dataBucket);

  TradeModel.findTradeShipmentsTraders(payload, dataBucket, (error, shipmentDataPack) => {
    if (error) {
      console.log(error);
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        data: shipmentDataPack
      });
    }
  });
};

const fetchExploreShipmentsTradersByPattern = (req, res) => {

  let payload = req.query;
  let tradeType = (payload.tradeType) ? payload.tradeType.trim().toUpperCase() : null;
  let countryCode = (payload.countryCode) ? payload.countryCode.trim().toUpperCase() : null;
  let tradeYear = (payload.tradeYear) ? payload.tradeYear : null;
  let indexNamePrefix = (payload.indexNamePrefix) ? payload.indexNamePrefix : null;
  let searchTerm = (payload.searchTerm) ? payload.searchTerm : null;
  let searchField = (payload.searchField) ? payload.searchField : null;

  let tradeMeta = {
    tradeType: tradeType,
    countryCode: countryCode,
    tradeYear: tradeYear,
    indexNamePrefix: indexNamePrefix
  };

  // console.log(tradeMeta);

  let traderType = "";
  if (searchField.includes("IMPORTER") || searchField.includes("BUYER")) {
    traderType = "buyers";
  } else if (searchField.includes("EXPORTER") || searchField.includes("SUPPLIER")) {
    traderType = "sellers";
  }
  tradeMeta.traderType = traderType;
  searchField = "trader";
  const dataBucket = TradeSchema.deriveDataTraderBucket(tradeType, countryCode, traderType, tradeYear);
  // dataBucket = "eximpedia_bucket_import_ind"
  // console.log(dataBucket);

  TradeModel.findTradeShipmentsTradersByPattern(searchTerm, searchField, dataBucket, tradeMeta, (error, shipmentTraders) => {
    if (error) {
      console.log(error);
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        data: shipmentTraders
      });
    }
  });
};

const fetchExploreShipmentsEstimate = (req, res) => {

  let payload = req.query;
  let tradeType = (payload.tradeType) ? payload.tradeType.trim().toUpperCase() : null;
  let countryCode = (payload.countryCode) ? payload.countryCode.trim().toUpperCase() : null;
  let tradeYear = (payload.tradeYear) ? payload.tradeYear : null;

  const dataBucket = TradeSchema.deriveDataBucket(tradeType, countryCode, tradeYear);

  console.log(dataBucket);

  TradeModel.findShipmentsCount(dataBucket, (error, shipmentEstimate) => {
    if (error) {
      console.log(error);
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        data: shipmentEstimate
      });
    }
  });
};

module.exports = {
  fetchExploreCountries,
  fetchExploreShipmentsSpecifications,
  fetchExploreShipmentsRecords,
  fetchExploreShipmentsStatistics,
  fetchExploreShipmentsTraders,
  fetchExploreShipmentsTradersByPattern,
  fetchExploreShipmentsEstimate
};
