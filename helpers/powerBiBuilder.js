const config = require('../config/power_bi/powerBiConfig.json')

function getWorkspace_blobfile(payload){
   
   // India Import report
   if (payload.tradeType === "IMPORT" && payload.country === "INDIA") {
    if (payload.powerBiResponse_INDIA_IMPORT && Object.keys(payload.powerBiResponse_INDIA_IMPORT).length > 0)  {
      return {
        "workspace_id": config.workspace_id,
        "blobName": config.blobName,
        "powerBiResponse": payload.powerBiResponse_INDIA_IMPORT
      };
    } else {
      return {
        "workspace_id": config.workspace_id,
        "blobName": config.blobName
      };
    }
  }

  // India Export Report
  if (payload.tradeType === "EXPORT" && payload.country === "INDIA") {
    if (payload.powerBiResponse_INDIA_EXPORT && Object.keys(payload.powerBiResponse_INDIA_EXPORT).length > 0)  {
      return {
        "workspace_id": config.workspace_id,
        "blobName": config.blobName,
        "powerBiResponse": payload.powerBiResponse_INDIA_EXPORT
      };
    } else {
      return {
        "workspace_id": config.workspace_id_india_export,
        "blobName": config.blobName_india_export
      };
    }
  }
}
module.exports = {
    getWorkspace_blobfile
}