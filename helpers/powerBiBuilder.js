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
  // turkey import report
  if (payload.tradeType === "IMPORT" && payload.country === "TURKEY") {
    if (payload.powerBiResponse_TURKEY_IMPORT && Object.keys(payload.powerBiResponse_TURKEY_IMPORT).length > 0)  {
      return {
        "workspace_id": config.workspace_id_turkey_import,
        "blobName": config.blobname_turkey_import,
        "powerBiResponse": payload.powerBiResponse_TURKEY_IMPORT
      };
    } else {
      return {
        "workspace_id": config.workspace_id_turkey_import,
        "blobName": config.blobname_turkey_import
      };
    }
  }
  // turkey export report
  if (payload.tradeType === "EXPORT" && payload.country === "TURKEY") {
    if (payload.powerBiResponse_TURKEY_EXPORT && Object.keys(payload.powerBiResponse_TURKEY_EXPORT).length > 0)  {
      return {
        "workspace_id": config.workspace_id_turkey_export,
        "blobName": config.blobname_turkey_export,
        "powerBiResponse": payload.powerBiResponse_TURKEY_EXPORT
      };
    } else {
      return {
        "workspace_id": config.workspace_id_turkey_export,
        "blobName": config.blobname_turkey_export
      };
    }
  }
  // vietnam export report
  if (payload.tradeType === "EXPORT" && payload.country === "VIETNAM") {
  if (payload.powerBiResponse_VIETNAM_EXPORT && Object.keys(payload.powerBiResponse_VIETNAM_EXPORT).length > 0)  {
    return {
      "workspace_id": config.workspace_id_vietnam_export,
      "blobName": config.blobname_vietnam_export,
      "powerBiResponse": payload.powerBiResponse_VIETNAM_EXPORT
    };
  } else {
    return {
      "workspace_id": config.workspace_id_vietnam_export,
      "blobName": config.blobname_vietnam_export
    };
  }
  }
  // vietnam import report
  if (payload.tradeType === "IMPORT" && payload.country === "VIETNAM") {
    if (payload.powerBiResponse_VIETNAM_IMPORT && Object.keys(payload.powerBiResponse_VIETNAM_IMPORT).length > 0)  {
      return {
        "workspace_id": config.workspace_id_vietnam_import,
        "blobName": config.blobname_vietnam_import,
        "powerBiResponse": payload.powerBiResponse_VIETNAM_IMPORT
      };
    } else {
      return {
        "workspace_id": config.workspace_id_vietnam_import,
        "blobName": config.blobname_vietnam_import
      };
    }

    }
  }



module.exports = {
    getWorkspace_blobfile
}