const TAG = "IndiaExportConsigneeDetailsModel";

const ConsigneeDetailsSchema = require("../schemas/indiaExportConsigneeDetailsSchema");
const ObjectID = require("mongodb").ObjectID;
const MongoDbHandler = require("../db/mongoDbHandler");


/** Function to add customer requests */
async function addCustomerRequest(requestData) {
    console.log("Method = addCustomerRequest, Entry");
    try {
        const requestPayload = ConsigneeDetailsSchema.buildRequest(requestData);
        requestPayload.requested_shipments.push(requestData.shipmentBillNumber);

        const addRequestResult = MongoDbHandler.getDbInstance()
            .collection(MongoDbHandler.collections.mock)
            .insertOne(requestPayload);

        return addRequestResult;
    }
    catch (error) {
        console.log("Method = addCustomerRequest, Error = ", error)
        throw error;
    }
    finally {
        console.log("Method = addCustomerRequest, Exit");
    }
}

/** Function to get list of customers requests */
async function getRequestsList() {
    console.log("Method = getRequestsList, Exit");
    try {
        var aggregationExpression = [
            {

            }
        ]
        const shipment = await MongoDbHandler.getDbInstance()
            .collection(MongoDbHandler.collections.mock)
            .find();

        return requestsListData;
    }
    catch (error) {
        console.log("Method = getRequestsList, Error = ", error)
        throw error;
    }
    finally {
        console.log("Method = getRequestsList, Exit");
    }
}

/** Function to update request response */
async function updateRequestResponse(requestResponseData) {
    const payload = req.body;

    try {

    }
    catch (error) {
        console.log("Method = , Error = ", error)
        res.status(500).json({
            data: error
        });
    }
    finally {
        console.log("Method = , Exit");
    }
}

/** Function to update shipment bill details */
async function updateShipmentBillDetails(shipmentData) {
    const payload = req.body;

    try {

    }
    catch (error) {
        console.log("Method = , Error = ", error)
        res.status(500).json({
            data: error
        });
    }
    finally {
        console.log("Method = , Exit");
    }
}

module.exports = {
    addCustomerRequest,
    getRequestsList,
    updateRequestResponse,
    updateShipmentBillDetails
}