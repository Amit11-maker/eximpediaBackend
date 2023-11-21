const config = require('../config/power_bi/powerBiConfig.json')

function getWorkspace_blobfile(payload){

    // if(((payload.tradeType == "IMPORT" && payload.country == "INDIA")) && payload.powerBiResponse_INDIA_IMPORT ){
    //     return {"workspace_id":config.workspace_id, "blobName":config.blobName, "powerBiResponse":payload.powerBiResponse_INDIA_IMPORT}
    // }
   if(payload.tradeType == "IMPORT" && payload.country == "INDIA") {
         return {"workspace_id":config.workspace_id, "blobName":config.blobName}
   }

   if((payload.tradeType == "EXPORT" && payload.country == "INDIA") ){
    return {"workspace_id":config.workspace_id_india_export, "blobName":config.blobName_india_export}
    }

}
module.exports = {
    getWorkspace_blobfile
}