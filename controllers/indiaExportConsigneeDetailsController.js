let TAG = "IndiaExportConsigneeDetailsController";

let ConsigneeDetailsModel = require("../models/indiaExportConsigneeDetailsModel");
const { logger } = require("../config/logger");
const NotificationModel = require('../models/notificationModel');

/** Controller function to add customer requests */
async function addCustomerRequest(req, res) {
    logger.info("Method = addCustomerRequest , Entry");
    var payload = req.body;
    payload.email_id = req.user.email_id;
    payload.user_id = req.user.user_id;
    let shipmentLimits = await ConsigneeDetailsModel.getShipmentRequestLimits(payload.account_id);

    if (shipmentLimits?.max_request_shipment_count?.remaining_limit <= 0) {
        logger.info("Method = addCustomerRequest , Exit");
        res.status(409).json({
            message: "Request shipment limit reached...Please contact administrator for further help."
        });
    }
    else {
        try {
            shipmentLimits.max_request_shipment_count.remaining_limit = (shipmentLimits?.max_request_shipment_count?.remaining_limit - 1);
            await ConsigneeDetailsModel.updateShipmentRequestLimits(payload.account_id, shipmentLimits);

            await ConsigneeDetailsModel.addOrUpdateCustomerRequest(payload);

            let userRequestData = await ConsigneeDetailsModel.getUserRequestData(payload.user_id);
            let shipmentBillNumber = payload.shipmentBillNumber;
            let shipmentData = await ConsigneeDetailsModel.getShipmentData(shipmentBillNumber);
            if (shipmentData && Object.keys(shipmentData).length > 0) {
                await ConsigneeDetailsModel.updateRequestResponse(userRequestData, shipmentBillNumber);
            }
            let notificationInfo = {}
            notificationInfo.user_id = [payload.user_id]
            notificationInfo.heading = 'Consignee Request' ;
            notificationInfo.description = 'Shipment Request have been raised for shipment : ' + shipmentBillNumber ;
            let notificationType = 'user'
            await NotificationModel.add(notificationInfo, notificationType);

            let shipmentLimits = await ConsigneeDetailsModel.getShipmentRequestLimits(payload.account_id);
            res.status(200).json({
                data: "Request Submitted Successfully.",
                shipmentConsumedLimits: shipmentLimits.max_request_shipment_count.alloted_limit - shipmentLimits.max_request_shipment_count.remaining_limit,
                shipmentAllotedLimits: shipmentLimits.max_request_shipment_count.alloted_limit
            });
        }
        catch (error) {
            logger.error(`INDIA EXPORT CONSIGNEE DETAILS CONTROLLER ================== ${JSON.stringify(error)}`);
            res.status(500).json({
                data: error
            });
        }
        finally {
            logger.info("Method = addCustomerRequest , Exit");
        }
    }
}

/** Controller function to delete customer requests */
async function deleteCustomerRequest(req, res) {
    logger.info("Method = deleteCustomerRequest , Entry");
    var payload = req.body;
    try {
        await ConsigneeDetailsModel.deleteCustomerRequest(payload);
        res.status(200).json({
            data: "Request Removed Successfully."
        });
    }
    catch (error) {
        logger.error(`INDIA EXPORT CONSIGNEE DETAILS CONTROLLER ================== ${JSON.stringify(error)}`);
        res.status(500).json({
            data: error
        });
    }
    finally {
        logger.info("Method = deleteCustomerRequest , Exit");
    }

}

/** Controller function to get list of customers requests */
async function getRequestsList(req, res) {
    logger.info("Method = getRequestsList , Entry");
    let offset = req.body.offset;
    let limit = req.body.limit;
    try {
        let requestsList = await ConsigneeDetailsModel.getRequestsList(offset, limit);
        let updatedRequestListData = Array.from(new Set(requestsList.data.map(data => data.shipmentBillNumber))).map(shipmentBillNumber => {
            return requestsList.data.find(data => data.shipmentBillNumber === shipmentBillNumber);
        });

        requestsList.data = updatedRequestListData;
        res.status(200).json(requestsList);
    }
    catch (error) {
        logger.error(` INDIA EXPORT CONSIGNEE DETAILS CONTROLLER ================== ${JSON.stringify(error)}`);
        res.status(500).json({
            data: error
        });
    }
    finally {
        logger.info("Method = getRequestsList , Exit");
    }
}

/** Controller function to get list of processed customers requests */
async function getProcessedRequestsList(req, res) {
    logger.info("Method = getRequestsList , Entry");
    let offset = req.body.offset;
    let limit = req.body.limit;
    try {
        let requestsProcessedList = await ConsigneeDetailsModel.getProcessedRequestsList(offset, limit);
        res.status(200).json(requestsProcessedList);
    }
    catch (error) {
        logger.error(` INDIA EXPORT CONSIGNEE DETAILS CONTROLLER ================== ${JSON.stringify(error)}`);
        res.status(500).json({
            data: error
        });
    }
    finally {
        logger.info("Method = getRequestsList , Exit");
    }
}

/** Controller function to update request response */
async function updateRequestResponse(req, res) {
    logger.info("Method = updateRequestResponse, Entry");
    var payload = req.body;
    try {

        await ConsigneeDetailsModel.addShipmentBillDetails(payload);

        let userRequestData = await ConsigneeDetailsModel.getUserRequestData(payload.userId);
        await ConsigneeDetailsModel.updateRequestResponse(userRequestData, payload.shipment_number);
        let notificationInfo = {}
        notificationInfo.user_id = [payload.user_id]
        notificationInfo.heading = 'Consignee Request'
        notificationInfo.description = `Request have been updated.`
        let notificationType = 'user'
        let ConsigneeNotification = await NotificationModel.add(notificationInfo, notificationType)
        res.status(200).json({
            data: "Request Submitted Successfully."
        });
        res.status(200).json({
            data: "Request Updated Successfully."
        });
    }
    catch (error) {
        logger.error(` INDIA EXPORT CONSIGNEE DETAILS CONTROLLER ================== ${JSON.stringify(error)}`);
        res.status(500).json({
            data: error
        });
    }
    finally {
        logger.info("Method = updateRequestResponse, Exit");
    }
}

/** Controller function to getch user shipment details*/
async function getCosigneeDetailForUser(req, res) {
    logger.info("Method = getCosigneeDetailForUser, Entry");
    var userId = req.user.user_id;
    var shipment_number = req.body.shipment_number;
    try {
        let userRequestData = await ConsigneeDetailsModel.getUserRequestData(userId);
        if (userRequestData == undefined) {
            res.status(200).json({
                message: "Request Cosignee Data"
            });
        }
        else {
            let isRequestedShipment = !!userRequestData.requested_shipments.find((shipment) => {
                return shipment.bill_number === shipment_number;
            });
            let isAvailableShipment = !!userRequestData.available_shipments.find((shipment) => {
                return shipment === shipment_number;
            });

            let shipmentLimits = await ConsigneeDetailsModel.getShipmentRequestLimits(req.user.account_id);

            if (isAvailableShipment) {
                let shipmentData = await ConsigneeDetailsModel.getShipmentData(shipment_number);
                res.status(200).json({
                    data: shipmentData
                });
            }
            else if (isRequestedShipment) {
                res.status(200).json({
                    message: "Shipment Data Request is in process .",
                    shipmentConsumedLimits: shipmentLimits.max_request_shipment_count.alloted_limit - shipmentLimits.max_request_shipment_count.remaining_limit,
                    shipmentAllotedLimits: shipmentLimits.max_request_shipment_count.alloted_limit            
                });
            }
            else {
                res.status(200).json({
                    message: "Request Cosignee Data",
                    shipmentConsumedLimits: shipmentLimits.max_request_shipment_count.alloted_limit - shipmentLimits.max_request_shipment_count.remaining_limit,
                    shipmentAllotedLimits: shipmentLimits.max_request_shipment_count.alloted_limit            
                });
            }
        }
    }
    catch (error) {
        logger.error(` INDIA EXPORT CONSIGNEE DETAILS CONTROLLER ================== ${JSON.stringify(error)}`);
        res.status(500).json({
            data: error.message
        });
    }
    finally {
        logger.info("Method = getCosigneeDetailForUser, Exit");
    }

}

/** Controller function to fetch requested data record list for a user */
async function getUserRequestedShipmentList(req, res) {
    logger.info("Method = getUserRequestedShipmentList, Entry");
    var userId = req.user.user_id;
    try {
        let recordRow = []
        let userRequestData = await ConsigneeDetailsModel.getUserRequestData(userId);
        if (userRequestData == undefined) {
            res.status(200).json({ recordRow: recordRow });
        }
        else {
            userRequestData.recordData.forEach(record => {
                recordRow.push(record.recordRow);
            });
            res.status(200).json({ recordRow: recordRow });
        }
    }
    catch (error) {
        logger.error(` INDIA EXPORT CONSIGNEE DETAILS CONTROLLER ================== ${JSON.stringify(error)}`);
        res.status(500).json({
            data: error
        });
    }
    finally {
        logger.info("Method = getUserRequestedShipmentList, Exit");
    }
}

module.exports = {
    addCustomerRequest,
    deleteCustomerRequest,
    getRequestsList,
    getProcessedRequestsList,
    updateRequestResponse,
    getCosigneeDetailForUser,
    getUserRequestedShipmentList
}