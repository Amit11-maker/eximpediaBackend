// @ts-check
require("dotenv").config()
const { BlobServiceClient } = require("@azure/storage-blob");


const AZURE_STORAGE_CONNECTION_STRING = process.env.BLOB_CONNECTION_STRING

// Create a unique name for the container
const WORKSPACES_CONTAINER_NAME = 'eximpedia-workspaces'

if (!AZURE_STORAGE_CONNECTION_STRING) {
    throw Error('Azure Storage Connection string not found');
}

// Create the BlobServiceClient object with connection string
const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);

console.log('\nCreating container...');
console.log('\t', WORKSPACES_CONTAINER_NAME);

// Get a reference to a container
const blobContainerClient = blobServiceClient.getContainerClient(WORKSPACES_CONTAINER_NAME);

(async () => {
    try {
        // Create the container
        const createContainerResponse = await blobContainerClient.create();
        console.log(`Container was created successfully.\n\trequestId:${createContainerResponse.requestId}\n\tURL: ${blobContainerClient.url}`);
    } catch (error) {
        if (error instanceof Error) console.log(__filename, error.message)
        console.log(__filename)
    }
})()

module.exports = {
    blobContainerClient,
}