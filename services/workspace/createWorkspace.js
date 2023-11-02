// @ts-check
const { blobContainerClient } = require("../../config/azure/blob");
const { formulateAdxRawSearchRecordsQueries, formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax } = require("../../models/tradeModel");
const { RetrieveAdxRecordsForWorkspace, analyseDataAndCreateExcel } = require("../../models/workspace.model.adx");
const { createWorkspaceBlobName, createAdxWorkspaceSchema } = require("../../schemas/workspace.schema");
const getLoggerInstance = require("../logger/Logger");
const { sendWorkspaceCreatedNotification } = require("./notification");
const WorkspaceRecordKeeper = require("./recordKeeper");
const MongoDbHandler = require("../../db/mongoDbHandler");
const { ObjectId } = require("mongodb");
const { updatePurchasePointsByRoleAdx } = require("./utils");
const { BlobSASPermissions } = require("@azure/storage-blob");
const storage = require("@azure/storage-blob")
const fs = require('fs');
const { default: axios } = require("axios");
const { azureFunctionRoutes } = require("./constants");

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
        let workspaceId = req.body.workspaceId ?? null;
        try {
            // create a new workspace and return the workspace id
            let isNewWorkspace = false;
            if (!workspaceId) {
                // Create new workspace and get workspaceID
                isNewWorkspace = true;
                workspaceId = await this.getWorkspaceId(req);
            }


            const tradeType = req.body.tradeType[0].toUpperCase() + req.body.tradeType.slice(1).toLowerCase();
            const country = req.body.country[0].toUpperCase() + req.body.country.slice(1).toLowerCase();

            // formulate the query
            let query = formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax(req.body, country + tradeType);

            // get the records from the adx
            // let results = await RetrieveAdxRecordsForWorkspace(query, req.body);

            const payload = {
                "account_id": req.user.account_id,
                "user_id": req.user.user_id,
                "workspace_id": workspaceId,
                "trade_type": tradeType,
                "country": country,
                "record_ids": req.body.recordsSelections,
                "is_query": req.body.recordsSelections.length === 0 ? true : false,
                "query": query
            }

            /**
             * @type {import('axios').AxiosResponse<{message: string, TotalRecords: number}>}
             */
            let results = await axios.post(azureFunctionRoutes.createOrUpdate, payload);

            // update the workspace with the records and query
            await this.updateWorkspace(workspaceId, query, results.data.TotalRecords);

            // insert the records into the purchased records keeper
            // const RecordKeeperService = new WorkspaceRecordKeeper();

            // call insertRecord method to insert the records into the purchased records keeper
            // await RecordKeeperService.insertRecord(req.body, results.data);

            // update points
            updatePurchasePointsByRoleAdx(req, -1, +results.data.TotalRecords, (error, value) => { });

            // append the records to the blob and upload it to the blob storage and get the sas url
            // let sasUrl = await this.createAppendBlobAndUploadData(workspaceId, req, results, isNewWorkspace);

            // update the blob path in the workspace
            // await this.updateBlobPath(workspaceId, sasUrl);
            return "success!"
        } catch (err) {
            if (workspaceId && req.body.workspaceType?.toUpperCase() === "NEW") {
                await MongoDbHandler.getDbInstance()
                    .collection(MongoDbHandler.collections.workspace)
                    .deleteOne({ _id: ObjectId(workspaceId) })
            }
            console.log(getLoggerInstance(err, __filename).errorMessage)
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
     * @param {any} query
     * @param {any} totalRecords
     */
    async updateWorkspace(workspaceID, query, totalRecords) {
        try {

            const filterClause = { _id: new ObjectId(workspaceID) };
            const updateClause = {
                $inc: { records: totalRecords },
                $push: {
                    workspace_queries: {
                        "query": query,
                        "query_records": totalRecords
                    }
                }
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