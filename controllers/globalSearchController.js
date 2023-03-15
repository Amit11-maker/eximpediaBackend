const TAG = 'globalSearchController';

const EnvConfig = require('../config/envConfig');
const GlobalSearchModel = require('../models/globalSearchModel');
const { logger } = require("../config/logger");


const fetchCountriesDetails = async (req, res) => {
    try {
        let payload = req.body;
        let column = payload.key != undefined ? payload.key : null
        let value = payload.value != undefined ? payload.value : null
        let available_country = undefined
        if (payload.countries_available) {
            available_country = payload.countries_available
        }

        if (column && value) {
            let result = await GlobalSearchModel.findTradeShipmentAllCountries(available_country, column, value)
            if (result){
                res.status(200).json({
                    result
                })
            }else{
                res.status(404).json({
                    message: 'NOT FOUND',
                });
            }
        } else {
            res.status(500).json({
                message: 'please send proper values',
            });
        }
    }
    catch(error) {
        logger.error(JSON.stringify(error));
        res.status(500).json({
            message: error.message,
        });
    }
};


module.exports = {
    fetchCountriesDetails
};
