const TAG = "favouriteController";

const FavouriteModel = require("../models/favouriteModel");
const { logger } = require("../config/logger");
const TradeSchema = require("../schemas/tradeSchema");

const fetchFavouriteCountries = async (req, res) => {
  let payload = req.body;
  let tradeType = payload.tradeType
    ? payload.tradeType.trim().toUpperCase()
    : null;
  let country = payload.country ? payload.country.trim().toUpperCase() : null;
  let searchField = payload.searchField
    ? payload.searchField.trim().toUpperCase()
    : null;
  let blCountry = payload.blCountry ? payload.blCountry : null;
  if (blCountry != null) {
    blCountry = blCountry.replace(/_/g, " ");
  }

  let dataBucket = TradeSchema.deriveDataBucket(tradeType, country);

  let tradeMeta = {
    tradeType: tradeType,
    countryCode: country,
    indexNamePrefix: dataBucket,
    blCountry,
  };

  try {
    const tradeCountries =
      await FavouriteModel.findTradeCountriesByPatternEngine(
        searchField,
        tradeMeta
      );
    res.status(200).json({
      data: tradeCountries,
    });
  } catch (error) {
    logger.log(
      req.user.user_id,
      ` FAVORITE CONTROLLER ================== ${JSON.stringify(error)}`
    );
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  fetchFavouriteCountries,
};
