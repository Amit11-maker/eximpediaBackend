const TAG = "taxonomyRoute";

const express = require("express");
const router = express.Router({
  mergeParams: true,
});

const TaxonomyController = require("../controllers/taxonomyController");

const AuthMiddleware = require("../middlewares/authMiddleware");

router.get("/", AuthMiddleware.authorizeAccess, TaxonomyController.fetch);

module.exports = router;
