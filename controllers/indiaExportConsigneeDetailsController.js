const TAG = "IndiaExportConsigneeDetailsController" ;

const ConsigneeDetailsModel = require("../models/indiaExportConsigneeDetailsModel");

/** Controller function to add customer requests */
async function addCustomerRequest(req , res){
    console.log("Method = addCustomerRequest , Entry , userID = " , req.user.user_id);
    const payload = req.body ;
    
    try {
        await ConsigneeDetailsModel.addCustomerRequest(payload);
        res.status(200).json({
            data : "Request Submitted Successfully."
        });
    }
    catch(error) {
        console.log("Method = addCustomerRequest , Error = " , error);
        res.status(500).json({
            data : error
        });
    }
    finally {
        console.log("Method = addCustomerRequest , Exit");
    }
}

/** Controller function to get list of customers requests */
async function getRequestsList(req , res){
    console.log("Method = getRequestsList , Entry");
    try {
        const requestsList = await ConsigneeDetailsModel.getRequestsList();
        res.status(200).json({
            data : requestsList
        });
    }
    catch(error) {
        console.log("Method = getRequestsList, Error = " , error)
        res.status(500).json({
            data : error
        });
    }
    finally {
        console.log("Method = getRequestsList , Exit");
    }
}

/** Controller function to update request response */
async function updateRequestResponse(req , res){
    console.log("Method = updateRequestResponse, Entry");
    const payload = req.body ;

    try {
        
    }
    catch(error) {
        console.log("Method = updateRequestResponse, Error = " , error)
        res.status(500).json({
            data : error
        });
    }
    finally {
        console.log("Method = updateRequestResponse, Exit");
    }
}


module.exports = {
    addCustomerRequest,
    getRequestsList,
    updateRequestResponse
}