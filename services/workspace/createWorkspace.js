// @ts-check
const { blobContainerClient } = require("../../config/azure/blob");
const { formulateAdxRawSearchRecordsQueries } = require("../../models/tradeModel");
const { RetrieveAdxRecordsForWorkspace, analyseDataAndCreateExcel } = require("../../models/workspace.model.adx");
const { createWorkspaceBlobName, createAdxWorkspaceSchema } = require("../../schemas/workspace.schema");
const getLoggerInstance = require("../logger/Logger");
const { sendWorkspaceCreatedNotification } = require("./notification");
const WorkspaceRecordKeeper = require("./recordKeeper");
const MongoDbHandler = require("../../db/mongoDbHandler");
const { ObjectId } = require("mongodb");
const { updatePurchasePointsByRoleAdx } = require("./utils");
const { BlobSASPermissions } = require("@azure/storage-blob");
var storage = require("@azure/storage-blob")

/**
 * ### create a workspace if already exists then update the workspace
 */
class CreateWorkspace {

    /**
     * this function will create a workspace
     * @param {import("express").Request & {user: *}} req
     * @returns {Promise<string | undefined>}
     */
    async execute(req) {
        try {
            // create a new workspace and return the workspace id
            let workspaceId = req.body.workspaceId ?? null;
            let isNewWorkspace = false;
            if (!workspaceId) {
                // Create new workspace and get workspaceID
                isNewWorkspace = true;
                workspaceId = await this.getWorkspaceId(req);
            }

            // formulate the query
            let query = formulateAdxRawSearchRecordsQueries(req.body);

            // get the records from the adx
            let results = await RetrieveAdxRecordsForWorkspace(query, req.body);

            // update the workspace with the records and query
            await this.updateWorkspace(workspaceId, query, results.data.length);

            // insert the records into the purchased records keeper
            const RecordKeeperService = new WorkspaceRecordKeeper();

            // call insertRecord method to insert the records into the purchased records keeper
            await RecordKeeperService.insertRecord(req.body, results.data);

            // update points
            await updatePurchasePointsByRoleAdx(req, -1, results.data.length, (error, value) => { });

            // get a append blob client
            const blobName = createWorkspaceBlobName(workspaceId, req.body.workspaceName);
            const appendBlob = blobContainerClient.getAppendBlobClient(blobName);
            const excelBuffer = await analyseDataAndCreateExcel(results.data, req.body, isNewWorkspace);

            await appendBlob.createIfNotExists();

            // generate an sas url for and set the expiry to 1 year
            let sasUrl = await appendBlob.generateSasUrl({
                expiresOn: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 
                permissions: storage.BlobSASPermissions.parse("racwd")
            })

            console.log("uploading blob");
            // upload the blob
            const uploadBlobResponse = await appendBlob.appendBlock(excelBuffer, excelBuffer.byteLength,);
            console.log(`Blob was uploaded successfully`);

            // add sas token at the end of the url
            const AZURE_SAS_TOKEN = process.env.SAS_TOKEN
            // const updatedWorkspace = await this.updateBlobPath(workspaceId, appendBlob.url + "?" + AZURE_SAS_TOKEN);

            // update the blob path in the workspace
            await this.updateBlobPath(workspaceId, sasUrl);
            return "success!"
        } catch (err) {
            getLoggerInstance(err, __filename).errorMessage
            throw err;
        }
    }

    /**
     * creating a workspace and storing it in the mongodb
     * @param {import("express").Request} req
     * @param {string} query
     * @param {{ data: string | any[]; }} results
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
     * @param {any} query
     * @param {any} totalRecords
     */
    async updateWorkspace(workspaceID, query, totalRecords) {
        try {

            const filterClause = { _id: new ObjectId(workspaceID) };
            const updateClause = {
                $inc: { records: totalRecords },
                $push: { workspace_queries: query }
            };

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

    /**
     * update the blob path in the workspace
     * @param {string} workspaceId
     * @param {string} blobPath
     */
    updateBlobPath(workspaceId, blobPath) {
        return MongoDbHandler.getDbInstance()
            .collection(MongoDbHandler.collections.workspace)
            .updateOne({ _id: ObjectId(workspaceId) }, {
                $set: {
                    file_path: blobPath
                }
            })
    }

}

module.exports = CreateWorkspace