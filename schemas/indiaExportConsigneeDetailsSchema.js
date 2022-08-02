const TAG = "IndiaExportConsigneeDetailsSchema";
const ObjectID = require("mongodb").ObjectID;

const request = {
    account_id: '',
    user_id: '',
    email_id: '',
    requested_shipments: [],
    available_shipments: [],
    country_date: '', 
    country_port: '',
    created_at: '',
    modified_at: ''
}

const shipment = {
    shipment_number: '',
    buyer_email: '',
    buyer_name: '',
    buyer_address: '',
    buyer_phone_number: '',
    buyer_concerned_person: '',
    created_at: '',
    modified_at: ''
}

function buildRequest(requestData) {
    let currentTimestamp = Date.now();
    let content = JSON.parse(JSON.stringify(request));

    content.account_id = ObjectID(requestData.account_id);
    content.user_id = ObjectID(requestData.user_id);
    content.email_id = requestData.email_id;
    content.country_date = (new Date(requestData.country_date)).getTime();
    content.country_port = requestData.country_port;
    content.created_at = currentTimestamp;
    content.modified_at = currentTimestamp;

    return content ;
}


function buildShipment(shipmentData) {
    let currentTimestamp = Date.now();
    let content = JSON.parse(JSON.stringify(shipment));

    content.shipment_number = shipmentData.shipment_number;
    content.buyer_name = shipmentData.buyer_name;
    content.buyer_address = shipmentData.buyer_address;
    content.buyer_email = shipmentData.buyer_email;
    content.buyer_phone_number = shipmentData.buyer_phone_number;
    content.buyer_concerned_person = shipmentData.buyer_concerned_person;
    content.created_at = currentTimestamp;
    content.modified_at = currentTimestamp;

    return content ;
}

module.exports = {
    buildRequest,
    buildShipment
}