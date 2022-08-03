const TAG = "IndiaExportConsigneeDetailsController";

const ConsigneeDetailsModel = require("../models/indiaExportConsigneeDetailsModel");

/** Controller function to add customer requests */
async function addCustomerRequest(req, res) {
    console.log("Method = addCustomerRequest , Entry");
    const payload = req.body;
    const maxShipmentCount = req.plan.max_request_shipment_count;
    if (maxShipmentCount == 0) {
        console.log("Method = addCustomerRequest , Exit");
        res.status(409).json({
            message : "Request shipment limit reached...Please contact administrator for more shipment requests."
        });
    }
    else {
        try {
            await ConsigneeDetailsModel.addCustomerRequest(payload);
            res.status(200).json({
                data: "Request Submitted Successfully."
            });
        }
        catch (error) {
            console.log("Method = addCustomerRequest , Error = ", error);
            res.status(500).json({
                data: error
            });
        }
        finally {
            console.log("Method = addCustomerRequest , Exit");
        }
    }
}

/** Controller function to get list of customers requests */
async function getRequestsList(req, res) {
    console.log("Method = getRequestsList , Entry");
    try {
        const requestsList = await ConsigneeDetailsModel.getRequestsList();
        res.status(200).json({
            data: requestsList
        });
    }
    catch (error) {
        console.log("Method = getRequestsList, Error = ", error)
        res.status(500).json({
            data: error
        });
    }
    finally {
        console.log("Method = getRequestsList , Exit");
    }
}

/** Controller function to update request response */
async function updateRequestResponse(req, res) {
    console.log("Method = updateRequestResponse, Entry");
    const payload = req.body;
    try {

        await ConsigneeDetailsModel.addShipmentBillDetails(payload);

        const userRequestData = await ConsigneeDetailsModel.getUserRequestData(payload.userId);
        await ConsigneeDetailsModel.updateRequestResponse(userRequestData, payload.shipment_number);
        res.status(200).json({
            data: "Request Updated Successfully."
        });
    }
    catch (error) {
        console.log("Method = updateRequestResponse, Error = ", error)
        res.status(500).json({
            data: error
        });
    }
    finally {
        console.log("Method = updateRequestResponse, Exit");
    }
}

/** */
async function getCosigneeDetailForUser(req, res) {
    console.log("Method = getCosigneeDetailForUser, Entry");
    const userId = req.user.user_id;
    const shipment_number = req.body.shipment_number;
    try {
        const userRequestData = await ConsigneeDetailsModel.getUserRequestData(userId);
        const isRequestedShipment = !!userRequestData.requested_shipments.find((shipment) => {
            return shipment.bill_number === shipment_number;
        });
        const isAvailableShipment = !!userRequestData.available_shipments.find((shipment) => {
            return shipment === shipment_number;
        });
        if (isAvailableShipment) {
            const shipmentData = await ConsigneeDetailsModel.getShipmentData(shipment_number);
            res.status(200).json({
                data: shipmentData
            });
        }
        else if (isRequestedShipment) {
            res.status(200).json({
                message: "Shipment Data Request is in process ."
            });
        }
        else {
            res.status(200).json({
                message: "Request Cosignee Data"
            });
        }
    }
    catch (error) {
        console.log("Method = getCosigneeDetailForUser, Error = ", error)
        res.status(500).json({
            data: error
        });
    }
    finally {
        console.log("Method = getCosigneeDetailForUser, Exit");
    }

}

module.exports = {
    addCustomerRequest,
    getRequestsList,
    updateRequestResponse,
    getCosigneeDetailForUser
}