var request = require('request');
const config = require('./powerBiConfig.json')

//generate token for power bi

const getBiaccessToken = () => {
    return new Promise((resolve, reject) => {
        var options = {
            'method': 'POST',
            'url': `https://login.microsoftonline.com/${config.tenant_id}/oauth2/v2.0/token`,
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              form: {
                'client_secret': `${config.client_secret}`,
                'grant_type': 'client_credentials',
                'client_id': `${config.client_id}`,
                'scope': 'https://analysis.windows.net/powerbi/api/.default'
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
module.exports= {
    getBiaccessToken
}