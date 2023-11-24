const FormData = require("form-data")
const axios = require("axios")
const request = require('request-promise-native');
const fs = require("fs")
const azure = require('azure-storage');
const config = require('../config/power_bi/powerBiConfig.json')
const {getBiaccessToken} = require('../config/power_bi/accessTokenBi')
const country_builder = require('../helpers/powerBiBuilder')

let countryBuilder;
let blobName;


const blobService = azure.createBlobService(config.storageaccount, config.storagekey);
const containerName = config.containerName;
// const blobName = `${countryBuilder.blobName}`;
// console.log("Blob name", blobName)
const uuid = require("uuid");
const unique_id = uuid.v4();

// Import pbix from blob
function getFileStreamFromBlob() {
    return new Promise((resolve, reject) => {
      const stream = blobService.createReadStream(containerName, blobName);
      const chunks = [];

      stream.on('data', (chunk) => {
        chunks.push(chunk);
      });

      stream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });

      stream.on('error', (error) => {
        reject(error);
      });
    });
  }  
  //Import the file
  async function postImportInGroup(accessToken) {
    try {
      var formData = new FormData();
      const fileBuffer = await getFileStreamFromBlob();

      formData.append('file', fileBuffer, {filename:'adx.pbix'});
      // Check if the fileBuffer is empty or null
      if (!fileBuffer || fileBuffer.length === 0) {
      console.error('Error: Unable to read file from blob.');
      return null;
      }
      var headers = formData.getHeaders();
      headers['Authorization'] = `Bearer ${accessToken}`;
      headers['Content-Type'] = 'multipart/form-data';
      headers['Content-Length'] = formData.getLengthSync();
       const options = {
        method: 'POST',
        headers: headers,
        data: formData,
        url: `https://api.powerbi.com/v1.0/myorg/groups/${countryBuilder.workspace_id}/imports?datasetDisplayName=adxfileblob${unique_id}&nameConflict=Ignore`,
        maxBodyLength: Infinity //file length can be different
      };
      try {
        const response = await axios(options);
        if (response.status === 202) {
          console.log('File successfully transferred to Power BI API.');
          console.log('Import ID:', response.data.id);
        } else {
          console.error('Unexpected response from Power BI API. Response:', response.status, response.data);
        }
        return response.data.id;
      } catch (error) {
        if (error.response) {
          console.error('Power BI API Error. Status:', error.response.status, 'Data:',error.response.data) ;
        } else if (error.request) {
          console.error('No response from Power BI API.');
        } else {
          console.error('Error setting up the request to Power BI API:', error.message);
        }
        return null;
      }
    } catch (err) {
      console.error('Error:', err);
      return null;
    }
  }

async function importdetails(accessToken){
var import_id = await postImportInGroup(accessToken);
if(import_id){
var options = {
  'method': 'GET',
  'url': `https://api.powerbi.com/v1.0/myorg/groups/${countryBuilder.workspace_id}/imports/${import_id}`,
  'headers': {
    'Authorization': `Bearer ${accessToken}`
  },
  'json': true,
};
  let importstate;
  let importresponse;
  do{
      importresponse = await request(options);
      importstate = importresponse.importState;
      if (importstate === 'Publishing') {
        console.log('Import is still in progress. Waiting for it to complete...');
      }
    }while(importstate=="Publishing");
    return importresponse;
  }
}

async function getreportdetails(recordQuery,accessToken) {
  console.log("Record query", recordQuery);

  try {
    // Assuming importDetails returns a promise
    const importResponse = await importdetails(accessToken);
    if (importResponse ) {
      const datasetsId = importResponse.datasets[0].id;
      const reportId = importResponse.reports[0].id;
      const embeddedUrl = importResponse.reports[0].embedUrl;
      
      // Binding the gateway
      const bindToGatewayOptions = {
        method: 'POST',
        url :`https://api.powerbi.com/v1.0/myorg/groups/${countryBuilder.workspace_id}/datasets/${datasetsId}/Default.BindToGateway`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        data: {
          "gatewayObjectId": `${config.gatewayObjectId}`
        }
      };

      const bindToGatewayResponse = await axios(bindToGatewayOptions);
      console.log(bindToGatewayResponse.status);

      if (bindToGatewayResponse.status === 200) {
        const updateParametersOptions = {
          method: 'POST',
          url: `https://api.powerbi.com/v1.0/myorg/groups/${countryBuilder.workspace_id}/datasets/${datasetsId}/Default.UpdateParameters`,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          data: {
            "updateDetails": [
              {
                "name": "Query",
                "newValue": `${recordQuery}`
              }
            ]
          }
        };

        const updateParametersResponse = await axios(updateParametersOptions);
        console.log(updateParametersResponse.status);

        // Check if the updateParameters call was successful
        // if (updateParametersResponse.status === 200) {
        //   const refreshOptions = {
        //     method: 'POST',
        //     url: `https://api.powerbi.com/v1.0/myorg/groups/${countryBuilder.workspace_id}/datasets/${datasetsId}/refreshes`,
        //     headers: {
        //       'Content-Type': 'application/json',
        //       'Authorization': `Bearer ${accessToken}`
        //     }
        //   };

        //   const refreshResponse = await axios(refreshOptions);
        //   console.log(refreshResponse.status);

        //   // Check if the refresh call was successful
        //   if (refreshResponse.status === 202) {
        //     console.log("Dataset refresh initiated successfully");
        //     return {reportId:reportId,embedUrl:embeddedUrl,accessToken:accessToken,datasetsId:datasetsId};  
        //   } else {
        //     console.log("Dataset refresh failed");
        //   }
        // }
      }
      console.log({ reportId, embeddedUrl, accessToken }); 
      return {reportId:reportId,embedUrl:embeddedUrl,accessToken:accessToken,datasetsId:datasetsId};  
         
    } else {
      return {};
    }
  } catch (error) {
    console.error("An error occurred:", error.message);
    return {};
  }
}

async function getreport(recordQuery,payload) {
   if(payload.country === "INDIA"){
    // To get the blobfilename and workspaceid and power bi object if exist to manage the sessions
        let powerBiResponse = null;
        let accessToken = null;
        countryBuilder =  await country_builder.getWorkspace_blobfile(payload);
        blobName = `${countryBuilder.blobName}`;
        console.log("country builder", countryBuilder)
        if(countryBuilder.hasOwnProperty('powerBiResponse') && typeof countryBuilder.powerBiResponse === 'object' && countryBuilder.powerBiResponse !== null){
          powerBiResponse = countryBuilder.powerBiResponse ;
        }

    // To get the access token of power bi to generate access token and generate the report
  
    while (!accessToken) {
        accessToken = await getBiaccessToken();
        if (!accessToken) {
            console.log('Access token is not available. Retrying in 1 seconds...');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    console.log('Access token is now available. Continuing with function execution.');
    try {
        if(powerBiResponse){

          const datasetsId = powerBiResponse.datasetsId;
          const reportId = powerBiResponse.reportId;
          const embeddedUrl = powerBiResponse.embedUrl;
          const updateParametersOptions = {
            method: 'POST',
            url: `https://api.powerbi.com/v1.0/myorg/groups/${countryBuilder.workspace_id}/datasets/${datasetsId}/Default.UpdateParameters`,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            data: {
              "updateDetails": [
                {
                  "name": "Query",
                  "newValue": `${recordQuery}`
                }
              ]
            }
          };
          const updateParametersResponse = await axios(updateParametersOptions);
          console.log({reportId:reportId,embedUrl:embeddedUrl,accessToken:accessToken,datasetsId:datasetsId})
          
          return {reportId:reportId,embedUrl:embeddedUrl,accessToken:accessToken,datasetsId:datasetsId};
        }
        else {
              console.log("get reports ")
              const res = await getreportdetails(recordQuery,accessToken);
              return res;
          }
        } catch (error) {
        console.error("An error occurred:", error.message);
        return {};
    }
   }
   else{
    return {"Message": "We are Working for different countries"}
   }

}

module.exports = {
    getreport
}