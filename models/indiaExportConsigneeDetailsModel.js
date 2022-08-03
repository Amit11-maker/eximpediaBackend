const TAG = "IndiaExportConsigneeDetailsModel";

const ConsigneeDetailsSchema = require("../schemas/indiaExportConsigneeDetailsSchema");
const ObjectID = require("mongodb").ObjectID;
const MongoDbHandler = require("../db/mongoDbHandler");


/** Function to add customer requests */
async function addCustomerRequest(requestData) {
    console.log("Method = addCustomerRequest, Entry");
    try {
        const requestPayload = ConsigneeDetailsSchema.buildRequest(requestData);
        const billInfo = {
            bill_number: requestData.shipmentBillNumber,
            requested_date: Date.now()
        }
        requestPayload.requested_shipments.push(billInfo);

        const addRequestResult = MongoDbHandler.getDbInstance()
            .collection(MongoDbHandler.collections.shipment_request_details)
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
        const pendingRequestData = await MongoDbHandler.getDbInstance()
            .collection(MongoDbHandler.collections.shipment_request_details)
            .find({ $where: "this.requested_shipments.length > 0" }).toArray();

        var requestListData = []

        pendingRequestData.forEach(pendingRequest => {
            pendingRequest.requested_shipments.forEach(request => {
                const requestData = {
                    shipmentBillNumber: request.bill_number,
                    date: pendingRequest.country_date,
                    port: pendingRequest.country_port,
                    dateOfRequest: request.requested_date,
                    requested_account: pendingRequest.email_id
                }
                requestListData.push(requestData);
            });
        });

        return requestListData;
    }
    catch (error) {
        console.log("Method = getRequestsList, Error = ", error)
        throw error;
    }
    finally {
        console.log("Method = getRequestsList, Exit");
    }
}

/** Function to get user request data */
async function getUserRequestData(userId) {
    console.log("Method = getUserRequestData, Exit");
    try {
        const userRequestData = await MongoDbHandler.getDbInstance()
            .collection(MongoDbHandler.collections.shipment_request_details)
            .find({ user_id: ObjectID(userId) }).toArray();

        return userRequestData[0];
    }
    catch (error) {
        console.log("Method = getUserRequestData, Error = ", error)
        throw error;
    }
    finally {
        console.log("Method = getUserRequestData, Exit");
    }

}

/** Function to update request response */
async function updateRequestResponse(userRequestData, shipmentNumber) {
    try {
        const request = ConsigneeDetailsSchema.buildRequest(userRequestData) ;
        request.requested_shipments = userRequestData.requested_shipments.filter((requestedShipment) => {
            return (requestedShipment.bill_number != shipmentNumber);
        });

        request.available_shipments.push(shipmentNumber);
        let filterClause = {
            user_id: ObjectID(userRequestData.user_id)
        }
        let updateClause = {
            $set: request
        }

        const result = await MongoDbHandler.getDbInstance()
            .collection(MongoDbHandler.collections.shipment_request_details)
            .updateOne(filterClause, updateClause) ;
        
        return result ;
    }
    catch (error) {
        console.log("Method = , Error = ", error);
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
    try {
        const shipment = ConsigneeDetailsSchema.buildShipment(shipmentData);
        const result = await MongoDbHandler.getDbInstance()
            .collection(MongoDbHandler.collections.consignee_shipment_details)
            .insertOne(shipment);

        return result;

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

/** Function to get user request data */
async function getShipmentData(shipmentNumber) {
    console.log("Method = getShipmentData, Exit");
    try {
        const shipmentData = await MongoDbHandler.getDbInstance()
            .collection(MongoDbHandler.collections.consignee_shipment_details)
            .find({ shipment_number: shipmentNumber }).toArray();

        return shipmentData[0];
    }
    catch (error) {
        console.log("Method = getShipmentData, Error = ", error)
        throw error;
    }
    finally {
        console.log("Method = getShipmentData, Exit");
    }

}

module.exports = {
    addCustomerRequest,
    getRequestsList,
    getUserRequestData,
    updateRequestResponse,
    addShipmentBillDetails,
    getShipmentData
}