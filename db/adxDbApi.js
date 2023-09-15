var request = require('request');
const config = require("../config/azure/adx.json")

const query = (Query, accessToken) => {
    return new Promise((resolve, reject) => {
        var options = {
            'method': 'POST',
            'url': `${config.cluster}/v1/rest/query`,
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

module.exports = {
    query
}