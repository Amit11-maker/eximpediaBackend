const TAG = "dbConfig";

// Standalone Mongo
/*
const dbBMongo = {
  connection_url: 'mongodb://localhost:27017',
  database: 'seair_eximpedia_v0',
  importTool: 'mongoimport' //'"C:/Program Files/MongoDB/Server/4.2/bin/mongoimport"' //'mongoimport'
};
*/

// Cluster Mongo Atlas

const dbMongo = {
  user: 'mongo-atlas-user-admin',
  pwd: 'mongoAtlasExim',
  connection_uri: `mongodb://mongo-atlas-user-admin:${encodeURIComponent('mongoAtlasExim')}@cluster-search-benchmar-shard-00-00.dhtuw.mongodb.net:27017,cluster-search-benchmar-shard-00-01.dhtuw.mongodb.net:27017,cluster-search-benchmar-shard-00-02.dhtuw.mongodb.net:27017/${process.env.MONGODBNAME}?ssl=true&replicaSet=atlas-z0ernc-shard-0&authSource=admin`,
  connection_url: `mongodb+srv://mongo-atlas-user-admin:${encodeURIComponent('mongoAtlasExim')}@cluster-search-benchmar.dhtuw.mongodb.net/${process.env.MONGODBNAME}?retryWrites=true&w=majority`,
  database: process.env.MONGODBNAME,
  importTool: 'mongoimport' //'"C:/Program Files/MongoDB/Server/4.2/bin/mongoimport"' //'mongoimport'
};

// Standalone Elasticsearch

const dbElasticsearch = {
  region: "ap-southeast-1",
  user: "admin",
  pwd: "Metro@1234",
  connection_uri: ``,
  connection_url: `https://search-eximpedia-es-new-csjepr43j45akpltzeffmgzlwu.ap-southeast-1.es.amazonaws.com`, // http://localhost:9200 // http://18.138.163.242:9200/
  database: "",
  importTool: "",
	cloud: { id: 'Eximpedia:YXAtc291dGhlYXN0LTEuYXdzLmZvdW5kLmlvOjQ0MyQwMDYzMDJjMGViMzY0ZmI1OGQ4MjM4YjFkMjc5MTM1NyRiOTMxOTZmZjEzYjk0OGNiYTU1NDdlOGI2OWE3NDAzMA==' },
    auth: {  username: 'elastic', password: 'PZyKmNmPMeuyZTVuTTDs7ay7' },
    requestTimeout: 3000000
};

module.exports = {
  dbMongo,
  dbElasticsearch,
};
