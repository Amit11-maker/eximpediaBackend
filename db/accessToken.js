var request = require('request');

// const config = require("../adxvalues.json");

const getADXAccessToken = () => {
    return new Promise((resolve, reject) => {
        const config = JSON.parse(process.env.adx);
        var options = {
            'method': 'GET',
            'url': `https://login.microsoftonline.com/${config.tenantid}/oauth2/token`,
            'headers': {
            },
            formData: {
                'grant_type': 'password',
                'resource': `${config.kustoresource}`,
                'client_id': `${config.clientid}`,
                'client_secret': `${config.clientsecret}`,
                'username': `${config.username}`,
                'password': `${config.password}`
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

const getBlobUploadAccessToken = () => {
    const {
        generateAccountSASQueryParameters,
        AccountSASServices,
        AccountSASResourceTypes,
        StorageSharedKeyCredential,
        SASProtocol,
        BlobSASPermissions
    } = require('@azure/storage-blob');

    const sharedKeyCredential = new StorageSharedKeyCredential(
        config.blobAccountName,
        config.blobAccountKey
    );

    // Define the permissions you want for the SAS token
    const sasOptions = {
        expiresOn: new Date(Date.now() + 15 * 60 * 1000), // Token expiration time (15 minutes from now)
        permissions: BlobSASPermissions.parse("cw"), // Replace with your desired permissions
        services: AccountSASServices.parse("b").toString(),          // blobs, tables, queues, files
        resourceTypes: AccountSASResourceTypes.parse("co").toString(), // container, object
        protocol: SASProtocol.HttpsAndHttp,
    };

    const sasToken = generateAccountSASQueryParameters(
        sasOptions,
        sharedKeyCredential
    ).toString();

    return sasToken;
}

module.exports = {
    getADXAccessToken,
    getBlobUploadAccessToken
}