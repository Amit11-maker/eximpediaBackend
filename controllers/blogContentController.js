const blogContentModel = require("../models/blogContentModel");
const blogContentSchema = require("../schemas/blogContentSchema");
const { logger } = require("../config/logger");

const addBlog = (req, res) => {
  let payload = req.body;
  const blogContent = blogContentSchema.buildBlog(payload);
  blogContentModel.add(blogContent, (error, blogContent) => {
    if (error) {
      logger.error(` BLOGCONTENT CONTROLLER ================== ${JSON.stringify(error)}`);
      res.status(400).json(error);
    } else {
      res.status(200).json({ data: blogContent });
    }
  });
};

const fetchBlogContent = (req, res) => {
  blogContentModel.find((error, blogs) => {
    if (error) {
      logger.error(` BLOGCONTENT CONTROLLER ================== ${JSON.stringify(error)}`);
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      res.status(200).json({
        data: blogs,
      });
    }
  });
};

module.exports = { addBlog, fetchBlogContent };
