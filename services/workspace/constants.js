const WORKSPACE_ID = "WORKSPACE_ID"

/**
 * Azure Function Routes
 */
const azureFunctionRoutes = {
    approval: "https://workspacestab.azurewebsites.net/api/deduplicate",
    createOrUpdate: "https://workspacestab.azurewebsites.net/api/create_update_workspaces",
}

module.exports = {
    WORKSPACE_ID,
    azureFunctionRoutes
}