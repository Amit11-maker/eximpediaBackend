const TAG = 'globalSearchController';

const EnvConfig = require('../config/envConfig');
const WebSiteDataModel = require('../models/webSiteDataModel');
const TradeSchema = require('../schemas/tradeSchema');


const findCountryDetails = (req, res) => {

    let payload = req.body;
    var country = payload.country != undefined ? payload.country : null
    var tradeType = payload.tradeType != undefined ? payload.tradeType : null
    const dataBucket = TradeSchema.deriveDataBucket(tradeType, country);

    WebSiteDataModel.findCountryDetailsModel(dataBucket, payload, (error, data) => {
        if (error) {
            // console.log(error);
            logger.error(` WEBSITE DATA CONTROLLER ================== ${JSON.stringify(error)}`);
            res.status(500).json({
                message: 'Internal Server Error',
            });
        } else {
            res.status(200).json({
                data
            });
        }
    });


};


const findPortDetails = (req, res) => {

    let payload = req.body;
    var country = payload.country != undefined ? payload.country : null
    var tradeType = payload.tradeType != undefined ? payload.tradeType : null
    const dataBucket = TradeSchema.deriveDataBucket(tradeType, country);

    WebSiteDataModel.findPortDetailsModel(dataBucket, payload, (error, data) => {
        if (error) {
            logger.error(` WEBSITE DATA CONTROLLER ================== ${JSON.stringify(error)}`);
            // console.log(error);
            res.status(500).json({
                message: 'Internal Server Error',
            });
        } else {
            res.status(200).json({
                data
            });
        }
    });
};


const findCompanyDetails = (req, res) => {

    let payload = req.body;
    var country = payload.country != undefined ? payload.country : null
    var tradeType = payload.tradeType != undefined ? payload.tradeType : null
    const dataBucket = TradeSchema.deriveDataBucket(tradeType, country);

    WebSiteDataModel.findCompanyDetailsModel(dataBucket, payload, (error, data) => {
        if (error) {
            logger.error(` WEBSITE DATA CONTROLLER ================== ${JSON.stringify(error)}`);
            // console.log(error);
            res.status(500).json({
                message: 'Internal Server Error',
            });
        } else {
            res.status(200).json({
                data
            });
        }
    });
};


const addContactDetails = (req, res) => {
    // { firstName: "divaker", lastName: "Soni", "emailId": "soni@fsnkfs.sxfn", "message":"I am sexy and I know it"}
    let payload = req.body;

    WebSiteDataModel.addContactDetailsModel(payload, (error, data) => {
        if (error) {
            // console.log(error);
            logger.error(` WEBSITE DATA CONTROLLER ================== ${JSON.stringify(error)}`);
            res.status(500).json({
                message: 'Internal Server Error',
            });
        } else {
            res.status(200).json({
                "message": "data saved successfully"
            });
        }
    });
}

module.exports = {
    findCountryDetails,
    findPortDetails,
    findCompanyDetails,
    addContactDetails
};
