const TAG = "IndiaExportConsigneeDetailsModel";

const ConsigneeDetailsSchema = require("../schemas/indiaExportConsigneeDetailsSchema");
const ObjectID = require("mongodb").ObjectID;
const MongoDbHandler = require("../db/mongoDbHandler");

const accountLimitsCollection = MongoDbHandler.collections.account_limits;
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

/** Function to delete customer requests */
async function deleteCustomerRequest(requestData) {
    logger.info("Method = addOrUpdateCustomerRequest, Entry");
    try {
        const userId = requestData.userId;
        const shipmentBillNumber = requestData.shipmentBillNumber;

        let userRequestData = await MongoDbHandler.getDbInstance()
            .collection(MongoDbHandler.collections.shipment_request_details)
            .find({ "user_id": ObjectID(userId) }).toArray();

        let updatedRequestData = userRequestData[0];
        updatedRequestData.requested_shipments = updatedRequestData.requested_shipments.filter((requestedShipment) => {
            return (requestedShipment.bill_number != shipmentBillNumber);
        });

        updatedRequestData.recordData = updatedRequestData.recordData.filter((requestedShipment) => {
            return (requestedShipment.shipment != shipmentBillNumber);
        });
        updatedRequestData.modified_at = new Date();
        let filterClause = {
            user_id: ObjectID(userId)
        }
        let updateClause = {
            $set: updatedRequestData
        }

        const result = await MongoDbHandler.getDbInstance()
            .collection(MongoDbHandler.collections.shipment_request_details)
            .updateOne(filterClause, updateClause);

        return result;
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
async function getRequestsList(offset, limit) {
    logger.info("Method = getRequestsList, Entry");
    let aggregationExpression = [
        {
            $unwind: {
                path: '$requested_shipments'
            }
        },
        {
            $sort: {
                'requested_shipments.requested_date': 1
            }
        },
        {
            '$skip': offset
        },
        {
            '$limit': limit
        }
    ]

    let countRecordsAggregationExpression = [
        {
            '$unwind': {
                'path': '$requested_shipments'
            }
        }, {
            '$group': {
                '_id': null,
                'count': {
                    '$sum': 1
                }
            }
        }
    ]
    try {
        const pendingRequestData = await MongoDbHandler.getDbInstance()
            .collection(MongoDbHandler.collections.shipment_request_details)
            .aggregate(aggregationExpression).toArray();

        var requestListData = []

        pendingRequestData.forEach(pendingRequest => {
            const requestData = {
                shipmentBillNumber: pendingRequest.requested_shipments.bill_number,
                date: pendingRequest.requested_shipments.country_date,
                port: pendingRequest.requested_shipments.country_port,
                dateOfRequest: pendingRequest.requested_shipments.requested_date,
                requested_account: pendingRequest.email_id,
                user_id: pendingRequest.user_id
            }
            requestListData.push(requestData);
        });
        // For pagination on frontend
        const recordsFiltered = await MongoDbHandler.getDbInstance()
            .collection(MongoDbHandler.collections.shipment_request_details)
            .aggregate(countRecordsAggregationExpression).toArray();

        return { data: requestListData, recordsFiltered: recordsFiltered[0].count }
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
async function getProcessedRequestsList(offset, limit) {
    logger.info("Method = getRequestsList, Entry");
    try {
        const processedRequestData = await MongoDbHandler.getDbInstance()
            .collection(MongoDbHandler.collections.consignee_shipment_details)
            .find().limit(limit).skip(offset).toArray();

        // For pagination on frontend
        const recordsFiltered = await MongoDbHandler.getDbInstance()
            .collection(MongoDbHandler.collections.consignee_shipment_details)
            .countDocuments();

        return { data: processedRequestData, recordsFiltered: recordsFiltered }
    }
    catch (error) {
        logger.error(`Method = getRequestsList, Error = ${JSON.stringify(error)}`)
        throw error;
    }
    finally {
        logger.info("Method = getRequestsList, Exit");
    }
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
    const query = { shipment_number: shipmentData.shipment_number};
    const options = { upsert: true }
    try {
        const shipment = ConsigneeDetailsSchema.buildShipment(shipmentData);
        const updateClause = {$set : shipment};
        const result = await MongoDbHandler.getDbInstance()
            .collection(MongoDbHandler.collections.consignee_shipment_details)
            .updateOne(query, updateClause , options);

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

async function getShipmentRequestLimits(accountId) {

    const aggregationExpression = [
        {
            '$match': {
                'account_id': ObjectID(accountId),
                'max_request_shipment_count': {
                    '$exists': true
                }
            }
        },
        {
            '$project': {
                'max_request_shipment_count': 1,
                '_id': 0
            }
        }
    ]

    try {
        let limitDetails = await MongoDbHandler.getDbInstance()
            .collection(accountLimitsCollection)
            .aggregate(aggregationExpression).toArray();

        return limitDetails[0];
    } catch (error) {
        throw error;
    }
}

async function updateShipmentRequestLimits(accountId, updatedShipmentRequestLimits) {

    const matchClause = {
        'account_id': ObjectID(accountId),
        'max_request_shipment_count': {
            '$exists': true
        }
    }

    const updateClause = {
        $set: updatedShipmentRequestLimits
    }

    try {
        let limitUpdationDetails = await MongoDbHandler.getDbInstance()
            .collection(accountLimitsCollection)
            .updateOne(matchClause, updateClause);

        return limitUpdationDetails;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    addOrUpdateCustomerRequest,
    deleteCustomerRequest,
    getRequestsList,
    getProcessedRequestsList,
    getUserRequestData,
    updateRequestResponse,
    addShipmentBillDetails,
    getShipmentData,
    getShipmentRequestLimits,
    updateShipmentRequestLimits
}