const TAG = "IndiaExportConsigneeDetailsSchema";


const request = {
    account_id: '',
    user_id: '',
    requested_shipments: [],
    available_shipments: [],
    date: '', // this needs to be asked
    created_at: '',
    modified_at: ''
}

const shipment = {
    shipment_number: '',
    buyer_email: '',
    buyer_name: '',
    buyer_address: '',
    buyer_phone: '',
    buyer_concerned_person: '',
    created_at: '',
    modified_at: ''
}

function buildRequest(requestData) {
    let currentTimestamp = Date.now();
    let content = JSON.parse(JSON.stringify(request));

    content.account_id = requestData.account_id;
    content.user_id = requestData.user_id;
    content.date = requestData.date;
    content.created_at = currentTimestamp;
    content.modified_at = currentTimestamp;
}


function buildShipment(shipmentData) {
    let currentTimestamp = Date.now();
    let content = JSON.parse(JSON.stringify(shipment));

    content.sb_no = shipmentData.sb_no;
    content.buyer_name = shipmentData.buyer_name;
    content.buyer_address = shipmentData.buyer_address;
    content.buyer_email_id = shipmentData.buyer_email_id;
    content.buyer_phone_no = shipmentData.buyer_phone_no;
    content.created_at = currentTimestamp;
    content.modified_at = currentTimestamp;
}

module.exports = {
    buildRequest,
    buildShipment
}