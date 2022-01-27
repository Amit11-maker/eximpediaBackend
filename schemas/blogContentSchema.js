const blogSchema = {
  image_url: "",
  title: "",
  description: "",
  created_ts: 0,
  modified_ts: 0,
};

const buildBlog = (data) => {
  let currentTimestamp = Date.now();
  let content = JSON.parse(JSON.stringify(blogSchema));
  content.image_url = data.image_url;
  (content.title = data.title),
    (content.description = data.description),
    (content.created_ts = currentTimestamp);
  content.modified_ts = currentTimestamp;
  return content;
};

module.exports = { buildBlog };
