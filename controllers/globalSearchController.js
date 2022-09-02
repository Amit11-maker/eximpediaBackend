const TAG = 'globalSearchController';

const EnvConfig = require('../config/envConfig');
const GlobalSearchModel = require('../models/globalSearchModel');
const { logger } = require("../config/logger");


const fetchCountriesDetails = (req, res) => {

    let payload = req.body;
    var column = payload.key != undefined ? payload.key : null
    var value = payload.value != undefined ? payload.value : null
    var available_country = undefined
    if (req.plan){
        available_country = req.plan.countries_available
    }

    if (column && value) {
        GlobalSearchModel.findTradeShipmentAllCountries(available_country, column, value, (error, data) => {
            if (error) {
                // console.log(error);
                logger.error("GLOBALSEARCH CONTROLLER ==================",JSON.stringify(error));
                res.status(500).json({
                    message: 'Internal Server Error',
                });
            } else {
                res.status(200).json({
                    data
                });
            }
        });
    }
    else {
        res.status(500).json({
            message: 'please send proper values',
        });
    }
};


module.exports = {
    fetchCountriesDetails
};
