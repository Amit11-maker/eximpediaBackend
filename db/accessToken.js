var request = require('request');
const config = require("../config/azure/adx.json")

const getADXAccessToken = () => {
    return new Promise((resolve, reject) => {
        var options = {
            'method': 'GET',
            'url': `https://login.microsoftonline.com/${config.authority_id}/oauth2/token`,
            'headers': {
            },
            formData: {
                'grant_type': 'client_credentials',
                'resource': `${config.cluster}`,
                'client_id': `${config.client_id}`,
                'client_secret': `${config.client_secret}`
            }
        };
        request(options, function (error, response) {
            if (error) {
                reject(error);
            }
            else {
                const data = JSON.parse(response.body);
                const accessToken = data.access_token;
                resolve(accessToken)
            }
        });
    });
}

module.exports = {
    getADXAccessToken
}