const TAG = 'dbConfig';

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
  pwd: 'mongoAtlasExim@AjAmCluster',
  connection_uri: `mongodb://mongo-atlas-user-admin:${encodeURIComponent('mongoAtlasExim@AjAmCluster')}@cluster-search-benchmar-shard-00-00.dhtuw.mongodb.net:27017,cluster-search-benchmar-shard-00-01.dhtuw.mongodb.net:27017,cluster-search-benchmar-shard-00-02.dhtuw.mongodb.net:27017/sampled_seair_eximpedia_v0?ssl=true&replicaSet=atlas-z0ernc-shard-0&authSource=admin`,
  connection_url: `mongodb+srv://mongo-atlas-user-admin:${encodeURIComponent('mongoAtlasExim@AjAmCluster')}@cluster-search-benchmar.dhtuw.mongodb.net/sampled_seair_eximpedia_v0?retryWrites=true&w=majority`,
  database: 'sampled_seair_eximpedia_v0',
  importTool: 'mongoimport' //'"C:/Program Files/MongoDB/Server/4.2/bin/mongoimport"' //'mongoimport'
};


// Standalone Elasticsearch

const dbElasticsearch = {
  user: '',
  pwd: '',
  connection_uri: ``,
  connection_url: `http://18.138.163.242:9200`, // http://localhost:9200 // http://18.138.163.242:9200/
  database: '',
  importTool: ''
};


module.exports = {
  dbMongo,
  dbElasticsearch
};
