const TAG = "userRoute";

const express = require("express");
const router = express.Router({
  mergeParams: true,
});

const blogContentController = require("../controllers/blogContentController");

// Log Time
router.use(function timeLog(req, res, next) {
  // console.log("Time: ", Date.now());
  next();
});

router.post("/blogcontent", blogContentController.addBlog);
router.get("/", blogContentController.fetchBlogContent);

module.exports = router;
