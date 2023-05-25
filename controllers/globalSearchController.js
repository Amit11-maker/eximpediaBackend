const TAG = "globalSearchController";

const EnvConfig = require("../config/envConfig");
const GlobalSearchModel = require("../models/globalSearchModel");
const { logger } = require("../config/logger");

const available_country = [
  "ARG",
  "BGD",
  "BRA",
  "BOL",
  "BWA",
  "BDI",
  "CHL",
  "COL",
  "CRI",
  "ECU",
  "ETH",
  "GHA",
  "IND",
  "IDN",
  "CIV",
  "KEN",
  "LSO",
  "LBR",
  "MEX",
  "NAM",
  "NGA",
  "PAK",
  "PAN",
  "PRY",
  "PER",
  "PHL",
  "RWA",
  "LKA",
  "TUR",
  "UGA",
  "URY",
  "USA",
  "VEN",
  "VNM",
  "VNM_NEW",
  "ZWE",
  "USA",
  "DZA",
  "AUS",
  "BHR",
  "BGD",
  "BEL",
  "CAN",
  "CHN",
  "DNK",
  "DJI",
  "EGY",
  "FIN",
  "FRA",
  "DUE",
  "GHA",
  "GRC",
  "IND",
  "IDN",
  "IRN",
  "IRQ",
  "ITA",
  "JPN",
  "KOR",
  "KWT",
  "MYS",
  "MEX",
  "NLD",
  "NOR",
  "OMN",
  "PAK",
  "PHL",
  "QAT",
  "SAU",
  "SGP",
  "ESP",
  "LKA",
  "TWN",
  "THA",
  "ARE",
  "GBR",
  "VNM",
];

const fetchCountriesDetails = async (req, res) => {
  try {
    let payload = {};
    payload.countries_available = req.plan
      ? req.plan.countries_available
        ? req.plan.countries_available
        : []
      : [];
    payload.column =
      req.body.key != undefined ? req.body.key.toUpperCase() : null;
    payload.value = req.body.value != undefined ? req.body.value : null;
    payload.trade = req.body.tradeType
      ? req.body.tradeType.toUpperCase()
      : null;
    payload.startDate = req.body.startDate ?? null;
    payload.endDate = req.body.endDate ?? null;
    // payload.bl_flag = req.body.bl_flag ?? null;
    payload.filter_hs_code = req.body.filter_hs_code ?? [];

    if (req.body.country && req.body.country.length > 0) {
      payload.country = req.body.country ? req.body.country : null;
    } else {
      payload.available_country = available_country;
    }

    if (
      payload.column &&
      payload.value &&
      payload.startDate &&
      payload.endDate
    ) {
      let result = await GlobalSearchModel.findTradeShipmentAllCountries(
        payload
      );
      if (result) {
        res.status(200).json({
          result,
        });
      } else {
        res.status(404).json({
          message: "NOT FOUND",
        });
      }
    } else {
      res.status(500).json({
        message: "please send proper values",
      });
    }
  } catch (error) {
    logger.log(
      req.user.user_id,
      "Fetch counrty  fetchCountriesDetails",
      JSON.stringify(error)
    );
    res.status(500).json({
      message: error.message,
    });
  }
};

const fetchCountriesFilterDetails = async (req, res) => {
  try {
    let payload = {};
    payload.column =
      req.body.key != undefined ? req.body.key.toUpperCase() : null;
    payload.value = req.body.value != undefined ? req.body.value : null;
    payload.trade = req.body.tradeType
      ? req.body.tradeType.toUpperCase()
      : null;
    payload.startDate = req.body.startDate ?? null;
    payload.endDate = req.body.endDate ?? null;
    // payload.bl_flag = req.body.bl_flag ?? null;

    if (req.body.country && req.body.country.length > 0) {
      payload.country = req.body.country ? req.body.country : null;
    } else {
      payload.available_country = available_country;
    }

    if (
      payload.column &&
      payload.value &&
      payload.startDate &&
      payload.endDate
    ) {
      let result = await GlobalSearchModel.findFilterTradeShipmentAllCountries(
        payload
      );
      if (result) {
        res.status(200).json({
          result,
        });
      } else {
        res.status(404).json({
          message: "NOT FOUND",
        });
      }
    } else {
      res.status(500).json({
        message: "please send proper values",
      });
    }
  } catch (error) {
    logger.log(
      req.user.user_id,
      "Fetch country details fetchCountriesFilterDetails",
      JSON.stringify(error)
    );
    res.status(500).json({
      message: error.message,
    });
  }
};

const getCountryNames = async (req, res) => {
  try {
    let payload = req.body;
    let matchExpression = {};

    matchExpression = {
      code_iso_3: {
        $in: available_country,
      },
    };

    if (payload.trade) {
      matchExpression = {
        trade: payload.trade.toUpperCase(),
      };
    }

    if (payload.bl_flag) {
      matchExpression = {
        bl_flag: payload.bl_flag,
      };
    }
    let result = await GlobalSearchModel.getCountryNames(matchExpression);

    if (result) {
      res.status(200).json({
        countryNames: result,
      });
    } else {
      res.status(500).json({
        message: "please send proper values",
      });
    }
  } catch (error) {
    logger.log(req.user.user_id, "Get Country Names ", JSON.stringify(error));
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  fetchCountriesDetails,
  fetchCountriesFilterDetails,
  getCountryNames,
};
