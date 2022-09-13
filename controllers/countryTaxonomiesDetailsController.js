const countryTaxonomiesDetailsModel = require("../models/countryTaxonomiesDetailsModel");
const { logger } = require("../config/logger");

const fetch = (req, res) => {
  let payload = req.body;
  countryTaxonomiesDetailsModel
    .post(payload)
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => {
      logger.error(` countryTaxonomies ================== ${JSON.stringify(err)}`);
      res.status(404).send(err);
    });
};
module.exports = { fetch };
