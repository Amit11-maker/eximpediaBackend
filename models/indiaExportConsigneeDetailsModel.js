const TAG = "IndiaExportConsigneeDetailsModel";

const ConsigneeDetailsSchema = require("../schemas/indiaExportConsigneeDetailsSchema");
const ObjectID = require("mongodb").ObjectID;
const MongoDbHandler = require("../db/mongoDbHandler");
const { logger } = require("../config/logger");

/** Function to add customer requests */
async function addOrUpdateCustomerRequest(requestData) {
    logger.info("Method = addOrUpdateCustomerRequest, Entry");
    try {
        let requestPayload = {}

        const billInfo = {
            bill_number: requestData.shipmentBillNumber,
            country_date: (new Date(requestData.country_date)).getTime(),
            country_port: requestData.country_port,
            requested_date: Date.now()
        }
        const recordInfo = {
            shipment: requestData.shipmentBillNumber,
            recordRow: requestData.recordRow
        }

        const userRequestData = await getUserRequestData(requestData.user_id);
        if (userRequestData != undefined) {
            requestPayload = userRequestData;
        }
        else {
            requestPayload = ConsigneeDetailsSchema.buildRequest(requestData);
        }

        requestPayload.requested_shipments.push(billInfo);
        requestPayload.recordData.push(recordInfo);

        let filterClause = {
            user_id: ObjectID(requestData.user_id)
        }

        let updateClause = {
            $set: requestPayload
        }

        const options = { upsert: true }

        const addOrUpdateRequestResult = MongoDbHandler.getDbInstance()
            .collection(MongoDbHandler.collections.shipment_request_details)
            .updateOne(filterClause, updateClause, options);

        return addOrUpdateRequestResult;
    }
    catch (error) {
        logger.error(`Method = addOrUpdateCustomerRequest, Error =  ${JSON.stringify(error)}`)
        throw error;
    }
    finally {
        logger.info("Method = addOrUpdateCustomerRequest, Exit");
    }
}

/** Function to get list of customers requests */
async function getRequestsList() {
    logger.info("Method = getRequestsList, Exit");
    try {
        const pendingRequestData = await MongoDbHandler.getDbInstance()
            .collection(MongoDbHandler.collections.shipment_request_details)
            .find({ $where: "this.requested_shipments.length > 0" }).toArray();

        var requestListData = []
        
        pendingRequestData.forEach(pendingRequest => {
            pendingRequest.requested_shipments.forEach(request => {
                const requestData = {
                    shipmentBillNumber: request.bill_number,
                    date: request.country_date,
                    port: request.country_port,
                    dateOfRequest: request.requested_date,
                    requested_account: pendingRequest.email_id,
                    user_id: pendingRequest.user_id
                }
                requestListData.push(requestData);
            });
        });
        requestListData.sort((data1 ,data2) => {return compareDates(data1, data2, 'dateOfRequest')});
        return { data: requestListData, recordsFiltered: requestListData.length }
    }
    catch (error) {
        logger.error(`Method = getRequestsList, Error = ",${JSON.stringify(error)}`)
        throw error;
    }
    finally {
        logger.info("Method = getRequestsList, Exit");
    }
}

/** Function to get list of processed customers requests */
async function getProcessedRequestsList() {
    logger.info("Method = getRequestsList, Exit");
    try {
        const processedRequestData = await MongoDbHandler.getDbInstance()
            .collection(MongoDbHandler.collections.consignee_shipment_details)
            .find().toArray();
            
        return { data: processedRequestData, recordsFiltered: processedRequestData.length }
    }
    catch (error) {
        logger.error(`Method = getRequestsList, Error = ${JSON.stringify(error)}`)
        throw error;
    }
    finally {
        logger.info("Method = getRequestsList, Exit");
    }
}

function compareDates(object1, object2, key) {
    const date1 = new Date(object1[key]);   
    const date2 = new Date(object2[key]);
  
    if (date1.getTime() < date2.getTime()) {
      return -1 
    }
    if (date1.getTime() > date2.getTime()) {
      return 1
    }
    return 0
}

/** Function to get user request data */
async function getUserRequestData(userId) {
    logger.info("Method = getUserRequestData, Exit");
    try {
        const userRequestData = await MongoDbHandler.getDbInstance()
            .collection(MongoDbHandler.collections.shipment_request_details)
            .find({ user_id: ObjectID(userId) }).toArray();

        return userRequestData[0];
    }
    catch (error) {
        logger.error(`"Method = getUserRequestData, Error = ", ${JSON.stringify(error)}`)
        throw error;
    }
    finally {
        logger.info("Method = getUserRequestData, Exit");
    }

}

/** Function to update request response */
async function updateRequestResponse(userRequestData, shipmentNumber) {
    try {
        userRequestData.requested_shipments = userRequestData.requested_shipments.filter((requestedShipment) => {
            return (requestedShipment.bill_number != shipmentNumber);
        });

        userRequestData.available_shipments.push(shipmentNumber);
        let filterClause = {
            user_id: ObjectID(userRequestData.user_id)
        }
        let updateClause = {
            $set: userRequestData
        }

        const result = await MongoDbHandler.getDbInstance()
            .collection(MongoDbHandler.collections.shipment_request_details)
            .updateOne(filterClause, updateClause);

        return result;
    }
    catch (error) {
        logger.error(`"Method = , Error = ${JSON.stringify(error)}`);
        res.status(500).json({
            data: error
        });
    }
    finally {
        logger.info("Method = , Exit");
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
        logger.error(`"Method = , Error = ", ${JSON.stringify(error)}`)
        res.status(500).json({
            data: error
        });
    }
    finally {
        logger.info("Method = , Exit");
    }
}

/** Function to get user request data */
async function getShipmentData(shipmentNumber) {
    logger.info("Method = getShipmentData, Exit");
    try {
        const shipmentData = await MongoDbHandler.getDbInstance()
            .collection(MongoDbHandler.collections.consignee_shipment_details)
            .find({ shipment_number: shipmentNumber }).toArray();

        return shipmentData[0];
    }
    catch (error) {
        logger.error(`"Method = getShipmentData, Error = ${JSON.stringify(error)}`)
        throw error;
    }
    finally {
        logger.info("Method = getShipmentData, Exit");
    }

}

module.exports = {
    addOrUpdateCustomerRequest,
    getRequestsList,
    getProcessedRequestsList,
    getUserRequestData,
    updateRequestResponse,
    addShipmentBillDetails,
    getShipmentData
}