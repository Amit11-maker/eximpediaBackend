const countryTaxonomiesDetailsModel = require("../models/countryTaxonomiesDetailsModel");

const fetch = (req, res) => {
  let payload = req.body;
  countryTaxonomiesDetailsModel
    .get(payload)
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => {
      res.status(404).send(err);
    });
};
module.exports = { fetch };
