const TAG = "taxonomyController";

const TaxonomyModel = require("../models/taxonomyModel");
const TaxonomySchema = require("../schemas/taxonomySchema");
const { logger } = require("../config/logger");
const QUERY_PARAM_VALUE_TAXONOMY_GLOBAL = "GLOBAL";
const MongoDbHandler = require('../db/mongoDbHandler');

const fetchAllTaxonomy = (cb) => {
  TaxonomyModel.findAll(
    TaxonomySchema.TAXONOMY_MODE_ACTIVE,
    (error, taxonomies) => {
      if (error) {
        logger.log(
          ` TAXONOMY CONTROLLER ================== ${JSON.stringify(error)}`
        );
        cb(error);
      } else {
        cb(null, taxonomies);
      }
    }
  );
};

const fetchByTradeType = (tradeType, cb) => {
  TaxonomyModel.findByTradeType(
    TaxonomySchema.TAXONOMY_MODE_ACTIVE,
    tradeType,
    (error, taxonomies) => {
      if (error) {
        logger.log(
          ` TAXONOMY CONTROLLER ================== ${JSON.stringify(error)}`
        );
        cb(error);
      } else {
        cb(null, taxonomies);
      }
    }
  );
};

const fetchByCountryISOCode = (countryISOCode, cb) => {
  TaxonomyModel.findByCountryISOCode(
    TaxonomySchema.TAXONOMY_MODE_ACTIVE,
    countryISOCode,
    (error, taxonomies) => {
      if (error) {
        logger.log(
          ` TAXONOMY CONTROLLER ================== ${JSON.stringify(error)}`
        );
        cb(error);
      } else {
        cb(null, taxonomies);
      }
    }
  );
};

const fetch = (req, res) => {
  let tradeType =
    req.query.tradeType != null
      ? req.query.tradeType.trim().toUpperCase()
      : null;
  let countryName =
    req.query.countryName != null
      ? req.query.countryName.charAt(0).toUpperCase() +
        req.query.countryName.slice(1).toLowerCase()
      : null;
  let filters = {
    mode: TaxonomySchema.TAXONOMY_MODE_ACTIVE,
    tradeType: tradeType,
    countryName: countryName,
  };

  let constraints = {};
  if (req.plan) {
    if (
      !req.query.taxonomyScope &&
      req.query.taxonomyScope != QUERY_PARAM_VALUE_TAXONOMY_GLOBAL
    ) {
      constraints.allowedCountries = req.plan.countries_available;
    }
  }

  TaxonomyModel.findByFilters(filters, constraints, (error, taxonomies) => {
    if (error) {
      logger.log(
        req.user.user_id,
        ` TAXONOMY CONTROLLER ================== ${JSON.stringify(error)}`
      );
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      res.status(200).json({
        data: taxonomies,
      });
    }
  });
};


/**
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 */
const listCountries = async(req, res) => {
  try {
    const countries = await MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.taxonomy)
      .find()
      .project({
        '_id': 0,
        'country': 1,
        'code_iso_3': 1,
        'bl_flag': 1
      })
      .toArray();
      return res.status(200).json(countries)
  } catch (error) {
    logger.log(` TAXONOMY CONTROLLER ================== ${JSON.stringify(error)}`)
    res.status(500).json({message: "Internal server error!"})
  }
}


module.exports = {
  fetch,
  listCountries
};
