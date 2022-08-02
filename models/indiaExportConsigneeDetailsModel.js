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
    const payload = requestResponseData;
    try {
        let filterClause = {
            accountId: ObjectID(payload.accountId),
            userId: ObjectID(payload.userId),
        }
        let updateClause = {
            $set: {}
        };
        if (data != null) {
            updateClause.$set = payload.data;
        }

        const result = await MongoDbHandler.getDbInstance()
            .collection(MongoDbHandler.collections.shipment_request_details)
            .updateOne(filterClause, updateClause)
        console.log(result);
        return result
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
async function addShipmentBillDetails(shipmentData) {
    const payload = shipmentData;
    try {
        let query = {
            shipment_number: payload.shipment_number,
            buyer_email: payload.buyer_email,
            buyer_name: payload.buyer_name,
            buyer_address: payload.buyer_address,
            buyer_phone: payload.buyer_phone,
            buyer_concerned_person: payload.buyer_concerned_person,
        }
        const result = await MongoDbHandler.getDbInstance()
            .collection(MongoDbHandler.collections.consignee_shipment_details)
            .insertOne(query)
        console.log(result);
        return result

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

async function checkExistingShipmentBillDetails(shipment_number) {
    try {
        let query = {}
        if(shipment_number){    
            query.shipment_number = shipment_number
        }
        let result = await MongoDbHandler.getDbInstance()
            .collection(MongoDbHandler.collections.consignee_shipment_details)
            .find(query).toArray();
        console.log(result);
        return result
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
    addShipmentBillDetails,
    checkExistingShipmentBillDetails
}