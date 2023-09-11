// @ts-check
const { blobContainerClient } = require("../../config/azure/blob");
const { formulateAdxRawSearchRecordsQueries } = require("../../models/tradeModel");
const { RetrieveAdxRecordsForWorkspace, analyseDataAndCreateExcel } = require("../../models/workspace.model.adx");
const { createWorkspaceBlobName, createAdxWorkspaceSchema } = require("../../schemas/workspace.schema");
const getLoggerInstance = require("../logger/Logger");
const { sendWorkspaceCreatedNotification } = require("./notification");
const WorkspaceRecordKeeper = require("./recordKeeper");
const MongoDbHandler = require("../../db/mongoDbHandler");
const { ObjectId } = require("mongodb")

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
            // formulate the query
            let query = formulateAdxRawSearchRecordsQueries(req.body);

            // get the records from the adx
            let results = await RetrieveAdxRecordsForWorkspace(query, req.body);

            // create a new workspace and return the workspace id
            let workspaceId = ''
            if (req.body.workspaceType === "EXISTING") {
                workspaceId = req.body.workspaceId
            } else {
                workspaceId = await this.getWorkspaceId(req, query, results);
            }

            // insert the records into the purchased records keeper
            const insertIntoPurchasedRecordKeep = new WorkspaceRecordKeeper();

            // call insertRecord method to insert the records into the purchased records keeper
            await insertIntoPurchasedRecordKeep.insertRecord(req.body, results.data)

            // get a block blob client
            // const blockBlobClient = blobContainerClient.getBlockBlobClient(blobName);

            // get a append blob client
            const blobName = createWorkspaceBlobName(workspaceId, req.body.workspaceName);
            const appendBlob = blobContainerClient.getAppendBlobClient(blobName);
            const excelBuffer = await analyseDataAndCreateExcel(results.data, req.body);

            await appendBlob.createIfNotExists();

            console.log("uploading blob");
            // upload the blob
            const uploadBlobResponse = await appendBlob.appendBlock(excelBuffer, excelBuffer.byteLength,);
            console.log(`Blob was uploaded successfully`);

            // update the blob path in the workspace
            // add sas token at the end of the url
            const AZURE_SAS_TOKEN = process.env.SAS_TOKEN
            const updatedWorkspace = await this.updateBlobPath(workspaceId, appendBlob.url + "?" + AZURE_SAS_TOKEN);
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
    async getWorkspaceId(req, query, results) {
        try {
            // map the results to the schema
            const { workspace_queries, created_ts, ...mappedResults } = createAdxWorkspaceSchema({
                ...req.body,
                workspace_queries: [query],
                records: results.data.length,
            });

            const workspaceDetails = await MongoDbHandler
                .getDbInstance()
                .collection(MongoDbHandler.collections.workspace)
                .insertOne({ ...mappedResults, workspace_queries: [query] });
            workspaceDetails
            return workspaceDetails?.insertedId;
        } catch (error) {
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
                    s3_path: blobPath
                }
            })
    }

}

module.exports = CreateWorkspace