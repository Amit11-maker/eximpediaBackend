const TAG = 'taxonomyController';

const TaxonomyModel = require('../models/taxonomyModel');
const TaxonomySchema = require('../schemas/taxonomySchema');
const { logger } = require("../config/logger");
const QUERY_PARAM_VALUE_TAXONOMY_GLOBAL = 'GLOBAL';

const fetchAllTaxonomy = (cb) => {
  TaxonomyModel.findAll(TaxonomySchema.TAXONOMY_MODE_ACTIVE, (error, taxonomies) => {
    if (error) {
      logger.error("TAXONOMY CONTROLLER ==================", JSON.stringify(error));
      cb(error)
    } else {
      cb(null, taxonomies);
    }
  });
};

const fetchByTradeType = (tradeType, cb) => {
  TaxonomyModel.findByTradeType(TaxonomySchema.TAXONOMY_MODE_ACTIVE, tradeType, (error, taxonomies) => {
    if (error) {
      logger.error("TAXONOMY CONTROLLER ==================", JSON.stringify(error));
      cb(error)
    } else {
      cb(null, taxonomies);
    }
  });
};

const fetchByCountryISOCode = (countryISOCode, cb) => {
  TaxonomyModel.findByCountryISOCode(TaxonomySchema.TAXONOMY_MODE_ACTIVE, countryISOCode, (error, taxonomies) => {
    if (error) {
      logger.error("TAXONOMY CONTROLLER ==================", JSON.stringify(error));
      cb(error)
    } else {
      cb(null, taxonomies);
    }
  });
};

const fetch = (req, res) => {
  let tradeType = (req.query.tradeType != null) ? req.query.tradeType.trim().toUpperCase() : null;
  let countryCode = (req.query.countryCode != null) ? req.query.countryCode.trim().toUpperCase() : null;
  let filters = {
    mode: TaxonomySchema.TAXONOMY_MODE_ACTIVE,
    tradeType: tradeType,
    countryCode: countryCode
  };

  let constraints = {};
  if (req.plan) {
    if (!req.query.taxonomyScope && req.query.taxonomyScope != QUERY_PARAM_VALUE_TAXONOMY_GLOBAL) {
      constraints.allowedCountries = req.plan.countries_available;
    }
  }

  TaxonomyModel.findByFilters(filters, constraints, (error, taxonomies) => {
    if (error) {
      logger.error("TAXONOMY CONTROLLER ==================", JSON.stringify(error));
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
