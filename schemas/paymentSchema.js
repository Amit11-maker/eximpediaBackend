const TAG = 'orderSchema';

const ObjectID = require('mongodb').ObjectID;

const PAYMENT_MODE_ONLINE_DIRECT = 'ONLINE_DIRECT';
const PAYMENT_MODE_ONLINE_INDIRECT = 'ONLINE_INDIRECT';

const PROCESS_STATUS_INITIATING = 'INITIATING';
const PROCESS_STATUS_PROCESSING = 'PROCESSING';
const PROCESS_STATUS_SUCCESS = 'SUCCESS';
const PROCESS_STATUS_FAILED = 'FAILED';
const PROCESS_STATUS_CANCELLED = 'CANCELLED';
const PROCESS_STATUS_RETURNED = 'RETURNED';
const PROCESS_STATUS_REFUNDED = 'REFUNDED';
const PROCESS_STATUS_UNKNOWN = 'UNKNOWN';

const SEPARATOR_UNDERSCORE = '_';
const SEPARATOR_SPACE = ' ';

const payment = {
  mode: PAYMENT_MODE_ONLINE_DIRECT,
  provider: '',
  transaction_id: '',
  transaction_signature: '',
  error: {},
  meta: {
    merchant_name: '',
    purchase_desc: ''
  },
  info: {
    note: ''
  },
  status: PROCESS_STATUS_INITIATING,
  currency: '',
  amount: 0,
  transaction_ts: 0,
  created_ts: 0,
  modified_ts: 0
};

const buildPayment = (data) => {
  let currentTimestamp = Date.now();
  let content = JSON.parse(JSON.stringify(payment));
  content._id = new ObjectID();
  content.provider = data.provider;
  content.transaction_id = data.transaction_id;
  content.transaction_signature = data.transaction_signature;
  content.error = data.error;

  if (data.error == null && data.transaction_signature != null) {
    content.status = PROCESS_STATUS_SUCCESS;
  } else {
    content.status = PROCESS_STATUS_FAILED;
  }

  if (data.info != null && data.info.mode != null) {
    data.mode = data.info.mode;
    content.info.note = data.info.note;
  }

  content.currency = data.currency;
  content.amount = data.amount;
  content.transaction_ts = currentTimestamp;
  content.created_ts = currentTimestamp;
  content.modified_ts = currentTimestamp;
  return content;
}

module.exports = {
  PAYMENT_MODE_ONLINE_DIRECT,
  PAYMENT_MODE_ONLINE_INDIRECT,
  buildPayment
};
