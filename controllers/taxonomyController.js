const TAG = 'taxonomyController';

const TaxonomyModel = require('../models/taxonomyModel');
const TaxonomySchema = require('../schemas/taxonomySchema');
const { logger } = require("../config/logger");
const QUERY_PARAM_VALUE_TAXONOMY_GLOBAL = 'GLOBAL';

const fetchAllTaxonomy = (cb) => {
  TaxonomyModel.findAll(TaxonomySchema.TAXONOMY_MODE_ACTIVE, (error, taxonomies) => {
    if (error) {
      logger.error(` TAXONOMY CONTROLLER ================== ${JSON.stringify(error)}`);
      cb(error)
    } else {
      cb(null, taxonomies);
    }
  });
};

const fetchByTradeType = (tradeType, cb) => {
  TaxonomyModel.findByTradeType(TaxonomySchema.TAXONOMY_MODE_ACTIVE, tradeType, (error, taxonomies) => {
    if (error) {
      logger.error(` TAXONOMY CONTROLLER ================== ${JSON.stringify(error)}`);
      cb(error)
    } else {
      cb(null, taxonomies);
    }
  });
};

const fetchByCountryISOCode = (countryISOCode, cb) => {
  TaxonomyModel.findByCountryISOCode(TaxonomySchema.TAXONOMY_MODE_ACTIVE, countryISOCode, (error, taxonomies) => {
    if (error) {
      logger.error(` TAXONOMY CONTROLLER ================== ${JSON.stringify(error)}`);
      cb(error)
    } else {
      cb(null, taxonomies);
    }
  });
};

const fetch = (req, res) => {

  let tradeType = req.query.trade_type ? req.query.trade_type.toUpperCase().trim() : null;
  let country = req.query.country ? req.query.country.toLowerCase().trim() : null ;
  let blFlag = req.query.bl_flag ? req.query.bl_flag.trim() : null;

  let filters = {
    mode: TaxonomySchema.TAXONOMY_MODE_ACTIVE,
    trade: tradeType,
    country: country.charAt(0).toUpperCase() + country.slice(1),
    bl_flag: blFlag == "true" ? true : false
  }

  if (req.plan?.allowedCountries?.length >= 0) {
    filters.code_iso_3 = {
      $in: req.plan.allowedCountries
    }
  }


  TaxonomyModel.findByFilters(filters, (error, taxonomies) => {
    if (error) {
      logger.error(` TAXONOMY CONTROLLER ================== ${JSON.stringify(error)}`);
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        data: taxonomies
      });
    }
  });

};

module.exports = {
  fetch
};
