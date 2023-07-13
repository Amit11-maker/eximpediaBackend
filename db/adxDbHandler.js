const KustoClient = require("azure-kusto-data").Client;
const KustoConnectionStringBuilder = require("azure-kusto-data").KustoConnectionStringBuilder;
const config = require("../config/azure/adx.json")

const kcsb = KustoConnectionStringBuilder.withAadApplicationKeyAuthentication(config.cluster, config.client_id, config.client_secret, config.authority_id);
const kustoClient = new KustoClient(kcsb);

module.exports = kustoClient;