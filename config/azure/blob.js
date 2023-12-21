// @ts-check
require("dotenv").config()
const {getBlobUploadAccessToken} = require("../../db/accessToken")
const { BlobServiceClient } = require("@azure/storage-blob");


async function getBlobContainerClient() {
    const AZURE_STORAGE_CONNECTION_STRING = `DefaultEndpointsProtocol=https;AccountName=${process.env.blobAccountName};AccountKey=${process.env.blobAccountKey};EndpointSuffix=core.windows.net`;
    if (!AZURE_STORAGE_CONNECTION_STRING) {
        throw Error('Azure Storage Connection string not found');
    }

    const sasToken = `https://${process.env.blobAccountName}.blob.core.windows.net/?${getBlobUploadAccessToken()}`;
    const blobServiceClient = new BlobServiceClient(sasToken);

    // const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const WORKSPACES_CONTAINER_NAME = process.env.WorkspaceData;

    // @ts-ignore
    const blobContainerClient = blobServiceClient.getContainerClient(WORKSPACES_CONTAINER_NAME);
    try {
        // Create the container
        const createContainerResponse = await blobContainerClient.createIfNotExists();
        console.log(`Container was created successfully.\n\trequestId:${createContainerResponse.requestId}\n\tURL: ${blobContainerClient.url}`);

        return blobContainerClient;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    getBlobContainerClient
}