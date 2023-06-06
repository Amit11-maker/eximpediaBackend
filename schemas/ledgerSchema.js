const TAG = 'ledgerSchema';

const ObjectID = require('mongodb').ObjectID;

const TaxonomySchema = require('./taxonomySchema');

const DATA_STAGE_REGISTER = 'REGISTER';
const DATA_STAGE_EXAMINE = 'EXAMINE';
const DATA_STAGE_UPLOAD = 'UPLOAD';
const DATA_STAGE_INGEST = 'INGEST';
const DATA_STAGE_TERMINATE = 'TERMINATE';

const DATA_STAGE_STATUS_PENDING = 'PENDING';
const DATA_STAGE_STATUS_CODE_PENDING = 'P';
const DATA_STAGE_STATUS_FAILED = 'FAILED';
const DATA_STAGE_STATUS_CODE_FAILED = 'F';
const DATA_STAGE_STATUS_COMPLETED = 'COMPLETED';
const DATA_STAGE_STATUS_CODE_COMPLETED = 'S';
const DATA_STAGE_STATUS_ONGOING = 'ONGOING';
const DATA_STAGE_STATUS_CODE_ONGOING = 'O';
const DATA_STAGE_STATUS_TERMINATED = 'TERMINATED';

const DATA_MODE_UNPUBLISHED = 0;
const DATA_MODE_PUBLISHED = 1;

const SEPARATOR_UNDERSCORE = '_';
const SEPARATOR_SPACE = ' ';

const dataStageStatuses = [{
    code: 'U',
    status: 'UNKNOWN'
  }, {
    code: 'P',
    status: 'PENDING'
  },
  {
    code: 'O',
    status: 'ONGOING'
  },
  {
    code: 'I',
    status: 'INTERRUPTED'
  },
  {
    code: 'F',
    status: 'FAILED'
  },
  {
    code: 'S',
    status: 'COMPLETED'
  }
];

const errorConfig = {
  type: '',
  code: '',
  message: '',
  extras: {},
  detect_ts: ''
};

const ledger = {
  taxonomy_id: '',
  file: '',
  data_bucket: '',
  country: '',
  code_iso_3: '',
  code_iso_2: '',
  trade: '',
  records: '',
  year: 0,
  data_stages: {
    examine: {
      rank: 1,
      term: DATA_STAGE_EXAMINE,
      status: DATA_STAGE_STATUS_PENDING,
      errors: [],
      occured_ts: ''
    },
    upload: {
      rank: 2,
      term: DATA_STAGE_UPLOAD,
      status: DATA_STAGE_STATUS_PENDING,
      errors: [],
      occured_ts: ''
    },
    ingest: {
      rank: 3,
      term: DATA_STAGE_INGEST,
      status: DATA_STAGE_STATUS_PENDING,
      errors: [],
      occured_ts: ''
    },
    terminate: {
      rank: 4,
      term: DATA_STAGE_TERMINATE,
      status: DATA_STAGE_STATUS_PENDING,
      errors: [],
      occured_ts: ''
    }
  },
  is_published: 0,
  is_override: 0,
  created_ts: 0,
  modified_ts: 0
};

const assignBucket = (tradeType, countryCodeISO3, tradeYear) => {
  switch (tradeType) {
    case TaxonomySchema.TAXONOMY_TYPE_IMPORT: {
      return TaxonomySchema.TRADE_BUCKET_KEY.concat(SEPARATOR_UNDERSCORE, tradeType.toLowerCase(),
        SEPARATOR_UNDERSCORE, countryCodeISO3.toLowerCase(), SEPARATOR_UNDERSCORE, tradeYear);
    }
    case TaxonomySchema.TAXONOMY_TYPE_EXPORT: {
      return TaxonomySchema.TRADE_BUCKET_KEY.concat(SEPARATOR_UNDERSCORE, tradeType.toLowerCase(),
        SEPARATOR_UNDERSCORE, countryCodeISO3.toLowerCase(), SEPARATOR_UNDERSCORE, tradeYear);
    }
    default:
      return null;
  }
};

const buildLedger = (data) => {
  let currentTimestamp = Date.now();
  let content = JSON.parse(JSON.stringify(ledger));
  content.taxonomy_id = ObjectID(data.taxonomy_id);
  content.file = data.file;
  // content.data_bucket = assignBucket(data.trade_type, data.code_iso_3, data.trade_year);
  content.country = data.country;
  content.code_iso_3 = data.code_iso_3;
  content.code_iso_2 = data.code_iso_2;
  content.trade = data.trade_type;
  content.records = data.trade_records;
  // content.year = data.trade_year;
  content.records_tag = data.file_records_tag;
  content.is_override = data.is_override;
  content.created_ts = currentTimestamp;
  content.modified_ts = currentTimestamp;

  let errorsArr = [];
  let stageStatus = 'UNKNOWN';
  if (data.stage) {
    if (data.stage.status) {
      let stageStatusArr = dataStageStatuses.filter(stageStatus => stageStatus.code === data.stage.status);
      if (stageStatusArr.length > 0) stageStatus = stageStatusArr[0].status;
    }
    if (data.stage.errors) {
      data.stage.errors.forEach((error) => {
        let errorBody = JSON.parse(JSON.stringify(errorConfig));
        errorBody.type = error.type;
        errorBody.code = error.code;
        errorBody.message = error.message;
        errorBody.extras = error.extras;
        errorBody.detect_ts = currentTimestamp;
        errorsArr.push(errorBody);
      });
    }

    switch (data.stage.level) {
      case DATA_STAGE_EXAMINE: {
        content.data_stages.examine.status = stageStatus;
        content.data_stages.examine.occured_ts = currentTimestamp;
        content.data_stages.examine.errors = errorsArr;
        break;
      }
      case DATA_STAGE_UPLOAD: {
        content.data_stages.upload.status = stageStatus;
        content.data_stages.upload.occured_ts = currentTimestamp;
        content.data_stages.upload.errors = errorsArr;
        break;
      }
      case DATA_STAGE_INGEST: {
        content.data_stages.ingest.status = stageStatus;
        content.data_stages.ingest.occured_ts = currentTimestamp;
        content.data_stages.ingest.errors = errorsArr;
        break;
      }
      case DATA_STAGE_TERMINATE: {
        content.data_stages.terminate.status = stageStatus;
        content.data_stages.terminate.occured_ts = currentTimestamp;
        content.data_stages.terminate.errors = errorsArr;
        break;
      }
      default:
        break;
    }
  }

  return content;
};

const buildDataStageProcess = (data) => {
  let currentTimestamp = Date.now();
  let content = {};
  content.file_id = ObjectID(data.file_id);

  let errorsArr = [];
  let stageStatus = 'UNKNOWN';
  if (data.stage) {
    if (data.stage.status) {
      let stageStatusArr = dataStageStatuses.filter(stageStatus => stageStatus.code === data.stage.status);
      if (stageStatusArr.length > 0) stageStatus = stageStatusArr[0].status;
    }
    if (data.stage.errors) {
      data.stage.errors.forEach((error) => {
        let errorBody = JSON.parse(JSON.stringify(errorConfig));
        errorBody.type = error.type;
        errorBody.code = error.code;
        errorBody.message = error.message;
        errorBody.extras = error.extras;
        errorBody.detect_ts = currentTimestamp;
        errorsArr.push(errorBody);
      });
    }

    content.stage = data.stage.level.toUpperCase().trim();
    // console.log(data);
    if (data.stage.level.toUpperCase().trim() === DATA_STAGE_EXAMINE) {
      content.records = data.stage.meta.trade_records;
      content.records_tag = data.stage.meta.file_records_tag;
    }
    content.status = stageStatus;
    content.occured_ts = currentTimestamp;
    content.errors = errorsArr;
  }

  return content;
};

const deriveDataStageStatusCode = (data) => {
  let stageStatusCode = 'U';
  let stageStatusArr = dataStageStatuses.filter(stageStatus => stageStatus.status === data.toUpperCase().trim());
  if (stageStatusArr.length > 0) stageStatusCode = stageStatusArr[0].code;
  return stageStatusCode;
};

module.exports = {
  buildLedger,
  buildDataStageProcess,
  deriveDataStageStatusCode,
  DATA_STAGE_REGISTER,
  DATA_STAGE_EXAMINE,
  DATA_STAGE_UPLOAD,
  DATA_STAGE_INGEST,
  DATA_STAGE_TERMINATE,
  DATA_MODE_PUBLISHED,
  DATA_MODE_UNPUBLISHED,
  DATA_STAGE_STATUS_COMPLETED,
  DATA_STAGE_STATUS_PENDING,
  DATA_STAGE_STATUS_FAILED,
  DATA_STAGE_STATUS_ONGOING,
  DATA_STAGE_STATUS_TERMINATED,
  DATA_STAGE_STATUS_CODE_FAILED,
  DATA_STAGE_STATUS_CODE_COMPLETED,
  DATA_STAGE_STATUS_CODE_ONGOING
};
