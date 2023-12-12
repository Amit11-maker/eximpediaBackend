var request = require('request');
// const config = require("../adxvalues.json");
const getLoggerInstance = require('../services/logger/Logger');

const query = (Query, accessToken) => {
    const config = JSON.parse(process.env.adx)
    return new Promise((resolve, reject) => {
        var options = {
            'method': 'POST',
            'url': `${config.clusterdb}/v1/rest/query`,
            'headers': {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "db": `${config.database}`,
                "csl": `${Query}`
            })
        }
        request(options, function (error, response) {
            if (error) {
                reject(error);
            }
            else {
                resolve(response.body);
            }
        });
    });
}

/**
 * 
 * @param {string} Query 
 * @param {string} accessToken 
 * @returns {Promise<import("../types/adx-response").Response>}
 */
const parsedQueryResults = async (Query, accessToken) => {
    try {
        const response = await query(Query, accessToken);
        return JSON.parse(response);
    } catch (error) {
        getLoggerInstance(error, __filename, parsedQueryResults.name);
        throw error
    }
}

module.exports = {
    query,
    parsedQueryResults
}