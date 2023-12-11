// // @ts-check
// const KustoClient = require("azure-kusto-data").Client;
// const KustoConnectionStringBuilder = require("azure-kusto-data").KustoConnectionStringBuilder;
// const config = JSON.parse(process.env.adx);
// const ClientRequestProperties = require("azure-kusto-data").ClientRequestProperties;
// const Client = require("azure-kusto-data").Client;
// const uuid = require("uuid")

// const kcsb = KustoConnectionStringBuilder.withAadApplicationKeyAuthentication(config.cluster, config.client_id, config.client_secret, config.authority_id);
// const kustoClient = new KustoClient(kcsb);

// /**
//  * @param {string} queryID 
//  * @returns {ClientRequestProperties}
//  */
// const getClientRequestProperties = (queryID = "__qID") => {
//     const clientRequestProps = new ClientRequestProperties();
//     clientRequestProps.setClientTimeout(1000 * 60 * 10); // set client timeout to 10 mins
//     clientRequestProps.clientRequestId = queryID + "__" + uuid.v4()
//     // clientRequestProps.setOption("norequesttimeout", true);
//     // clientRequestProps.setTimeout(1000 * 60 * 10)
//     clientRequestProps.setTimeout(1000 * 60 * 10); // set server timeout to 10 mins
//     // clientRequestProps.raw = true
//     // clientRequestProps.setParameter();
//     return clientRequestProps;
// }


// module.exports = kustoClient
