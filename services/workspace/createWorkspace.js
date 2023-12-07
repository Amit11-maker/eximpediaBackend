// @ts-check
const { blobContainerClient } = require("../../config/azure/blob");
const { formulateAdxRawSearchRecordsQueries } = require("../../models/tradeModel");
const { CreateWorkpsaceOnAdx, analyseDataAndCreateExcel } = require("../../models/workspace.model.adx");
const { createWorkspaceBlobName, createAdxWorkspaceSchema } = require("../../schemas/workspace.schema");
const getLoggerInstance = require("../logger/Logger");
const { sendWorkspaceCreatedNotification } = require("./notification");
const MongoDbHandler = require("../../db/mongoDbHandler");
const { ObjectId } = require("mongodb");
const { updatePurchasePointsByRoleAdx } = require("./utils");
const { BlobSASPermissions } = require("@azure/storage-blob");
const storage = require("@azure/storage-blob")
const fs = require('fs')

/**
 * ### create a workspace if already exists then update the workspace
 */
class CreateWorkspace {

    /**
     * this function will create a workspace
     * @param {import("express").Request & {user: *}} req
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
            let query = "";
            let selectedRecords = req.body.recordsSelections;
            if (selectedRecords.length <= 0) {
                query = formulateAdxRawSearchRecordsQueries(req.body);
            }

            // calling create api for workspace
            let results = await CreateWorkpsaceOnAdx(query, selectedRecords, req.body, workspaceId);

            // update the workspace with the records and query
            await this.updateWorkspace(workspaceId, results?.TotalRecords);

            // // insert the records into the purchased records keeper
            // const RecordKeeperService = new WorkspaceRecordKeeper();

            // // call insertRecord method to insert the records into the purchased records keeper
            // await RecordKeeperService.insertRecord(req.body, results.data);

            // update points
            updatePurchasePointsByRoleAdx(req, -1, results?.TotalRecords, (error, value) => { });
        } catch (err) {
            getLoggerInstance(err, __filename).errorMessage
            throw err;
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
     */
    async updateWorkspace(workspaceID, totalRecords) {
        try {

            const filterClause = { _id: new ObjectId(workspaceID) };
            const updateClause = {
                $inc: { records: totalRecords },
                // $push: {
                //     workspace_queries: {
                //         "query": query,
                //         "query_records": totalRecords
                //     }
                // }
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

    /**
     * creating a append blob and uploading the data to it
     * @param {string} workspaceId
     * @param {import("express").Request} req
     * @param {{ data: any[]; }} results
     * @param {any} isNewWorkspace
     * @returns {Promise<string>} sasUrl
     */
    async createAppendBlobAndUploadData(workspaceId, req, results, isNewWorkspace) {
        try {
            // get a append blob client
            const blobName = createWorkspaceBlobName(workspaceId, req.body.workspaceName);
            const appendBlob = blobContainerClient.getAppendBlobClient(blobName);
            // const appendBlob = blobContainerClient.getAppendBlobClient("test.txt");
            const excelBuffer = await analyseDataAndCreateExcel(results.data, req.body, isNewWorkspace);
            if (isNewWorkspace) {
                fs.writeFileSync("test.xlsx", Buffer.from(excelBuffer))
            } else {
                fs.appendFileSync("test.xlsx", Buffer.from(excelBuffer))
            }
            await appendBlob.createIfNotExists();

            // generate an sas url for and set the expiry to 1 year
            let sasUrl = await appendBlob.generateSasUrl({
                expiresOn: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                permissions: storage.BlobSASPermissions.parse("racwd")
            })

            console.log("uploading blob");
            // upload the blob
            const uploadBlobResponse = await appendBlob.appendBlock(Buffer.from(excelBuffer), excelBuffer.byteLength);
            console.log(`Blob was uploaded successfully`);
            return sasUrl
        } catch (error) {
            let { errorMessage } = getLoggerInstance(error, __filename)
            console.log(errorMessage)
            throw error;
        }
    }

}

module.exports = CreateWorkspace