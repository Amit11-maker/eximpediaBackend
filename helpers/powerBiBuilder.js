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
  if (payload.tradeType === "EXPORT" && payload.country === "VIETNAM_2022") {
  if (payload.powerBiResponse_VIETNAM_2022_EXPORT && Object.keys(payload.powerBiResponse_VIETNAM_2022_EXPORT).length > 0)  {
    return {
      "workspace_id": config.workspace_id_vietnam_export,
      "blobName": config.blobname_vietnam_export,
      "powerBiResponse": payload.powerBiResponse_VIETNAM_2022_EXPORT
    };
  } else {
    return {
      "workspace_id": config.workspace_id_vietnam_export,
      "blobName": config.blobname_vietnam_export
    };
  }
  }
  // vietnam import report
  if (payload.tradeType === "IMPORT" && payload.country === "VIETNAM_2022") {
    if (payload.powerBiResponse_VIETNAM_2022_IMPORT && Object.keys(payload.powerBiResponse_VIETNAM_2022_IMPORT).length > 0)  {
      return {
        "workspace_id": config.workspace_id_vietnam_import,
        "blobName": config.blobname_vietnam_import,
        "powerBiResponse": payload.powerBiResponse_VIETNAM_2022_IMPORT
      };
    } else {
      return {
        "workspace_id": config.workspace_id_vietnam_import,
        "blobName": config.blobname_vietnam_import
      };
    }

    }

    // Srilanka import
    if (payload.tradeType === "IMPORT" && payload.country === "SRILANKA") {
      if (payload.powerBiResponse_SRILANKA_IMPORT && Object.keys(payload.powerBiResponse_SRILANKA_IMPORT).length > 0)  {
        return {
          "workspace_id": config.workspace_id_srilanka_import,
          "blobName": config.blobname_srilanka_import,
          "powerBiResponse": payload.powerBiResponse_SRILANKA_IMPORT
        };
      } else {
        return {
          "workspace_id": config.workspace_id_srilanka_import,
          "blobName": config.blobname_srilanka_import
        };
      }
    }
    // srilanka export
    if (payload.tradeType === "EXPORT" && payload.country === "SRILANKA") {
      if (payload.powerBiResponse_SRILANKA_EXPORT && Object.keys(payload.powerBiResponse_SRILANKA_EXPORT).length > 0)  {
        return {
          "workspace_id": config.workspace_id_srilanka_export,
          "blobName": config.blobname_srilanka_export,
          "powerBiResponse": payload.powerBiResponse_SRILANKA_EXPORT
        };
      } else {
        return {
          "workspace_id": config.workspace_id_srilanka_export,
          "blobName": config.blobname_srilanka_export
        };
      }
    }

    //Pakistan Export
    if (payload.tradeType === "EXPORT" && payload.country === "PAKISTAN") {
      if (payload.powerBiResponse_PAKISTAN_EXPORT && Object.keys(payload.powerBiResponse_PAKISTAN_EXPORT).length > 0)  {
        return {
          "workspace_id": config.workspace_id_pakistan_export,
          "blobName": config.blobname_pakistan_export,
          "powerBiResponse": payload.powerBiResponse_PAKISTAN_EXPORT
        };
      } else {
        return {
          "workspace_id": config.workspace_id_pakistan_export,
          "blobName": config.blobname_pakistan_export
        };
      }
    }

    //Philippines Export
    if (payload.tradeType === "EXPORT" && payload.country === "PHILIPPINES") {
      if (payload.powerBiResponse_PHILIPPINES_EXPORT && Object.keys(payload.powerBiResponse_PHILIPPINES_EXPORT).length > 0)  {
        return {
          "workspace_id": config.workspace_id_philippines_export,
          "blobName": config.blobname_philippines_export,
          "powerBiResponse": payload.powerBiResponse_PHILIPPINES_EXPORT
        };
      } else {
        return {
          "workspace_id": config.workspace_id_philippines_export,
          "blobName": config.blobname_philippines_export
        };
      }
    }

    //Philippines import
    if (payload.tradeType === "IMPORT" && payload.country === "PHILIPPINES") {
      if (payload.powerBiResponse_PHILIPPINES_IMPORT && Object.keys(payload.powerBiResponse_PHILIPPINES_IMPORT).length > 0)  {
        return {
          "workspace_id": config.workspace_id_philippines_import,
          "blobName": config.blobname_philippines_import,
          "powerBiResponse": payload.powerBiResponse_PHILIPPINES_IMPORT
        };
      } else {
        return {
          "workspace_id": config.workspace_id_philippines_import,
          "blobName": config.blobname_philippines_import
        };
      }
    }

  }



module.exports = {
    getWorkspace_blobfile
}