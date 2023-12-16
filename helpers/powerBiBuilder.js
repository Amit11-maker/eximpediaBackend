const config = require('../config/power_bi/powerBiConfig.json')

function getWorkspace_blobfile(payload){
  const tradeType = payload.tradeType.toUpperCase();
  const country = payload.country.toUpperCase();
   
   // India Import report
   if ((tradeType === "IMPORT" && country === "INDIA")) {
    if ((payload.powerBiResponse_INDIA_IMPORT && Object.keys(payload.powerBiResponse_INDIA_IMPORT).length > 0) ||(payload.powerBiResponse_workspace_India_IMPORT && Object.keys(payload.powerBiResponse_workspace_India_IMPORT).length > 0))  {
      return {
        "workspace_id": config.workspace_id,
        "blobName": config.blobName,
        "powerBiResponse": payload.powerBiResponse_INDIA_IMPORT  || payload.powerBiResponse_workspace_India_IMPORT
      };
    } else {
      return {
        "workspace_id": config.workspace_id,
        "blobName": config.blobName
      };
    }
  }

  // India Export Report
  if (tradeType === "EXPORT" && country === "INDIA") {
    if (payload.powerBiResponse_INDIA_EXPORT && Object.keys(payload.powerBiResponse_INDIA_EXPORT).length > 0 ||(payload.powerBiResponse_workspace_India_EXPORT && Object.keys(payload.powerBiResponse_workspace_India_EXPORT).length > 0))  {
      return {
        "workspace_id": config.workspace_id,
        "blobName": config.blobName,
        "powerBiResponse": payload.powerBiResponse_INDIA_EXPORT || payload.powerBiResponse_workspace_India_EXPORT
      };
    } else {
      return {
        "workspace_id": config.workspace_id_india_export,
        "blobName": config.blobName_india_export
      };
    }
  }
  // turkey import report
  if (tradeType === "IMPORT" && country === "TURKEY") {
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
  if (tradeType === "EXPORT" && country === "TURKEY") {
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
  if (tradeType === "EXPORT" && country === "VIETNAM_2022") {
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
  if (tradeType === "IMPORT" && country === "VIETNAM_2022") {
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
    if (tradeType === "IMPORT" && country === "SRILANKA") {
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
    if (tradeType === "EXPORT" && country === "SRILANKA") {
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
    if (tradeType === "EXPORT" && country === "PAKISTAN") {
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

     //Pakistan Import
     if (tradeType === "IMPORT" && country === "PAKISTAN") {
      if (payload.powerBiResponse_PAKISTAN_IMPORT && Object.keys(payload.powerBiResponse_PAKISTAN_IMPORT).length > 0)  {
        return {
          "workspace_id": config.workspace_id_pakistan_import,
          "blobName": config.blobname_pakistan_import,
          "powerBiResponse": payload.powerBiResponse_PAKISTAN_IMPORT
        };
      } else {
        return {
          "workspace_id": config.workspace_id_pakistan_import,
          "blobName": config.blobname_pakistan_import
        };
      }
    }

    //Philippines Export
    if (tradeType === "EXPORT" && country === "PHILIPPINES") {
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
    if (tradeType === "IMPORT" && country === "PHILIPPINES") {
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

     //Burundi import
     if (tradeType === "IMPORT" && country === "BURUNDI") {
      if (payload.powerBiResponse_BURUNDI_IMPORT && Object.keys(payload.powerBiResponse_BURUNDI_IMPORT).length > 0)  {
        return {
          "workspace_id": config.workspace_id_burundi_import,
          "blobName": config.blobname_burundi_import,
          "powerBiResponse": payload.powerBiResponse_BURUNDI_IMPORT
        };
      } else {
        return {
          "workspace_id": config.workspace_id_burundi_import,
          "blobName": config.blobname_burundi_import
        };
      }
    }

     //Uganda import
     if (tradeType === "IMPORT" && country === "UGANDA") {
      if (payload.powerBiResponse_UGANDA_IMPORT && Object.keys(payload.powerBiResponse_UGANDA_IMPORT).length > 0)  {
        return {
          "workspace_id": config.workspace_id_uganda_import,
          "blobName": config.blobname_uganda_import,
          "powerBiResponse": payload.powerBiResponse_UGANDA_IMPORT
        };
      } else {
        return {
          "workspace_id": config.workspace_id_uganda_import,
          "blobName": config.blobname_uganda_import
        };
      }
    }

    //Uganda Export
    if (tradeType === "EXPORT" && country === "UGANDA") {
      if (payload.powerBiResponse_UGANDA_EXPORT && Object.keys(payload.powerBiResponse_UGANDA_EXPORT).length > 0)  {
        return {
          "workspace_id": config.workspace_id_uganda_export,
          "blobName": config.blobname_uganda_export,
          "powerBiResponse": payload.powerBiResponse_UGANDA_EXPORT
        };
      } else {
        return {
          "workspace_id": config.workspace_id_uganda_export,
          "blobName": config.blobname_uganda_export
        };
      }
    }

    //Ethiopia import
    if (tradeType === "IMPORT" && country === "ETHIOPIA") {
      if (payload.powerBiResponse_ETHIOPIA_IMPORT && Object.keys(payload.powerBiResponse_ETHIOPIA_IMPORT).length > 0)  {
        return {
          "workspace_id": config.workspace_id_ethiopia_import,
          "blobName": config.blobname_ethiopia_import,
          "powerBiResponse": payload.powerBiResponse_ETHIOPIA_IMPORT
        };
      } else {
        return {
          "workspace_id": config.workspace_id_ethiopia_import,
          "blobName": config.blobname_ethiopia_import
        };
      }
    }

    //Ethiopia Export
    if (tradeType === "EXPORT" && country === "ETHIOPIA") {
      if (payload.powerBiResponse_ETHIOPIA_EXPORT && Object.keys(payload.powerBiResponse_ETHIOPIA_EXPORT).length > 0)  {
        return {
          "workspace_id": config.workspace_id_ethiopia_export,
          "blobName": config.blobname_ethiopia_export,
          "powerBiResponse": payload.powerBiResponse_ETHIOPIA_EXPORT
        };
      } else {
        return {
          "workspace_id": config.workspace_id_ethiopia_export,
          "blobName": config.blobname_ethiopia_export
        };
      }
    }

  }



module.exports = {
    getWorkspace_blobfile
}