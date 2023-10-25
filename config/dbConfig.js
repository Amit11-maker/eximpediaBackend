const TAG = "dbConfig";

// Standalone Mongo

// const dbMongo = {
//   connection_url: 'mongodb://localhost:27017',
//   database: 'seair_eximpedia_v0',
//   importTool: 'mongoimport' //'"C:/Program Files/MongoDB/Server/4.2/bin/mongoimport"' //'mongoimport'
// };


// Cluster Mongo Atlas

const dbMongo = {
  user: 'mongo-atlas-user-admin',
  pwd: 'mongoAtlasExim',
  connection_uri: `mongodb+srv://mongo-atlas-user-admin:mongoAtlasExim@cluster0.qhufsfe.mongodb.net/`,
  connection_url: `mongodb+srv://mongo-atlas-user-admin:mongoAtlasExim@cluster0.qhufsfe.mongodb.net/`,
  database: process.env.MONGODBNAME,
  importTool: 'mongoimport' //'"C:/Program Files/MongoDB/Server/4.2/bin/mongoimport"' //'mongoimport'
};

// Standalone Elasticsearch

// const dbElasticsearch = {
//   region: "ap-southeast-1",
//   user: "admin",
//   pwd: "Metro@1234",
//   connection_uri: ``,
//   connection_url: `https://search-eximpedia-es-new-csjepr43j45akpltzeffmgzlwu.ap-southeast-1.es.amazonaws.com`, // http://localhost:9200 // http://18.138.163.242:9200/
//   database: "",
//   importTool: "",
// };

const dbElasticsearch = {
    cloud: { id: 'Eximpedia:YXAtc291dGhlYXN0LTEuYXdzLmZvdW5kLmlvOjQ0MyQwMDYzMDJjMGViMzY0ZmI1OGQ4MjM4YjFkMjc5MTM1NyRiOTMxOTZmZjEzYjk0OGNiYTU1NDdlOGI2OWE3NDAzMA==' },
    auth: {  username: 'elastic', password: 'PZyKmNmPMeuyZTVuTTDs7ay7' },
    requestTimeout: 3000000
};

module.exports = {
  dbMongo,
  dbElasticsearch,
};
