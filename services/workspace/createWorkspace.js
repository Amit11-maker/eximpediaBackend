// @ts-check
const { formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax } = require("../../models/tradeModel");
const { CreateWorkpsaceOnAdx, getDatesForWorkspace, getCountryTradeDateColumn, deleteWorkspaceByID } = require("../../models/workspace.model.adx");
const { createWorkspaceBlobName, createAdxWorkspaceSchema } = require("../../schemas/workspace.schema");
const getLoggerInstance = require("../logger/Logger");
const { sendWorkspaceCreatedNotification, sendWorkspaceErrorNotification } = require("./notification");
const MongoDbHandler = require("../../db/mongoDbHandler");
const { ObjectId } = require("mongodb");
const { updatePurchasePointsByRoleAdx } = require("./utils");

/**
 * ### create a workspace if already exists then update the workspace
 */
class CreateWorkspace {

    /**
     * this function will create a workspace
     * @param {import("express").Request & {user: *}} req
     */
    async execute(req) {
        let isNewWorkspace = false;
        let workspaceId = req.body.workspaceId ?? null;
        let action = "updated";
        try {
            // create a new workspace and return the workspace id
            if (!workspaceId) {
                // Create new workspace and get workspaceID
                isNewWorkspace = true;
                workspaceId = await this.getWorkspaceId(req);
                action = "created";
            }

            // formulate the query
            let query = "";
            let selectedRecords = req.body.recordsSelections;
            if (selectedRecords.length <= 0) {
                query = formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax(req.body);
            }

            // calling create api for workspace
            let results = await CreateWorkpsaceOnAdx(query, selectedRecords, req.body, workspaceId);

            // retrieving dates for workspace 
            let dateColumn = await getCountryTradeDateColumn(req.body.country, req.body.tradeType);
            let datesForWorkspace = await getDatesForWorkspace(workspaceId, req.body.country, req.body.tradeType, dateColumn);

            // update the workspace with the records and query
            await this.updateWorkspace(workspaceId, results?.TotalRecords, datesForWorkspace);

            // update points
            updatePurchasePointsByRoleAdx(req, -1, results?.NewRecords, (error, value) => { });

            let workspaceCreationMessage = `Workspace ${req.body.workspaceName} succesfully ${action}. ${results?.NewRecords} points deducted.`;

            await sendWorkspaceCreatedNotification(req.body.userId, workspaceCreationMessage);
        } catch (error) {
            await sendWorkspaceErrorNotification(req.body.userId, "Workspace Creation Failed due to error => " + error);
            if (isNewWorkspace) {
                await deleteWorkspaceByID(workspaceId);
            }
            throw error;
        }
    }

    /**
     * creating a workspace and storing it in the mongodb
     * @param {import("express").Request} req
     */
    async getWorkspaceId(req) {
        try {
            // map the results to the schema
            const { ...mappedResults } = createAdxWorkspaceSchema({
                ...req.body,
            });

            const workspaceDetails = await MongoDbHandler
                .getDbInstance()
                .collection(MongoDbHandler.collections.workspace)
                .insertOne({ ...mappedResults });

            return workspaceDetails?.insertedId;
        } catch (error) {
            console.log(getLoggerInstance(error, __filename).errorMessage)
            throw error;
        }
    }

    /**
     * @param {any} workspaceID
     * @param {any} totalRecords
     * @param {any} datesForWorkspace
     */
    async updateWorkspace(workspaceID, totalRecords, datesForWorkspace) {
        try {
            const filterClause = { _id: new ObjectId(workspaceID) };
            const updateClause = {
                $set: {
                    records: totalRecords,
                    start_date: datesForWorkspace.start_date,
                    end_date: datesForWorkspace.end_date
                }
            }


            // Updating records and queries for workspace
            const updatedWorkspace = await MongoDbHandler
                .getDbInstance()
                .collection(MongoDbHandler.collections.workspace)
                .updateOne(filterClause, updateClause);

            return updatedWorkspace;
        }
        catch (error) {
            console.log(getLoggerInstance(error, __filename).errorMessage)
            throw error;
        }
    }

}

module.exports = CreateWorkspace