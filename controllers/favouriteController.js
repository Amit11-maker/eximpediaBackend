const TAG = "favouriteController";

const FavouriteModel = require("../models/favouriteModel");
const { logger } = require("../config/logger");

const fetchFavouriteCountries = async (req, res) => {
    let payload = req.body;
    let tradeType = payload.tradeType ? payload.tradeType.trim().toUpperCase() : null;
    let country = payload.country ? payload.country.trim().toUpperCase() : null;
    let searchField = payload.searchField ? payload.searchField.trim().toUpperCase() : null;
    let blCountry = payload.blCountry ? payload.blCountry : null;
    if (blCountry != null) {
        blCountry = blCountry.replace(/_/g, " ");
    }

    let tradeMeta = {
        tradeType: tradeType,
        countryCode: country,
        indexNamePrefix:
            country.toLocaleLowerCase() + "_" + tradeType.toLocaleLowerCase(),
        blCountry,
    };

    try {
        const tradeCountries = await FavouriteModel.findTradeCountriesByPatternEngine(searchField ,tradeMeta);
        res.status(200).json({
            data: tradeCountries
        });
    }
    catch (error) {
        logger.error("FAVORITE CONTROLLER ==================",JSON.stringify(error));
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
}

module.exports = {
    fetchFavouriteCountries
}