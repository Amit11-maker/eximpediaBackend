const TAG = 'recommendationSchema';

const ObjectID = require('mongodb').ObjectID;

const add = {
  account_id: '',
  user_id: '',
  country: '',
  tradeType: '',
  recordRow: '',
  columnName: '',
  columnValue: '',
  bl_flag: 0,
  taxonomy_id: '',
  isFavorite: 0,
  createdAt: 0,
  updatedAt: 0
};

const addShipment = {
  account_id: '',
  user_id: '',
  country: '',
  tradeType: '',
  recordRow: '',
  bl_flag: 0,
  isFavorite: 0,
  createdAt: 0,
  updatedAt: 0
};

const update = {
  _id: '',
  user_id: '',
  isFavorite: '',
  country: '',
  tradeType: '',
  updatedAt: 0
};

const updateRecommendationEmail = {
  _id: '',
  endDate: '',
  updatedAt: 0
};

const fetch = {
  _id: '',
  user_id: '',
  country: '',
  tradeType: '',
  updatedAt: ''
};

const count = {
  account_id: '',
  user_id: '',
};

const fetchList = {
  account_id: '',
  user_id: '',
  tradeType: '',
  country:''
};

const fetchShipmentList = {
  account_id: '',
  user_id: '',
  tradeType: '',
  country:''
};


const fetchRecommendationMail = {

  user_id: '',
  favorite_id: ''

};



const fetchCDNDetails = {

  taxonomy_id: ''

};

const addRecommendationEmail = {
  account_id: '',
  user_id: '',
  country: '',
  tradeType: '',
  favorite_id: '',
  endDate: '',
  createdAt: 0,
  updatedAt: 0
}

const addRecommendationSchema = (data) => {
  let currentTimestamp = Date();
  let content = JSON.parse(JSON.stringify(add));

  content.account_id = ObjectID(data.account_id);
  content.user_id = ObjectID(data.user_id);
  content.country = data.country;
  content.tradeType = data.tradeType;
  content.bl_flag = data.bl_flag;
  content.recordRow = data.recordRow;
  content.taxonomy_id = ObjectID(data.taxonomy_id);
  content.columnName = data.columnName;
  content.columnValue = data.columnValue;
  content.isFavorite = true;
  content.createdAt = currentTimestamp;
  content.updatedAt = currentTimestamp;

  return content;
};

const addRecommendationEmailSchema = (data, endDate) => {
  let currentTimestamp = Date();
  let content = JSON.parse(JSON.stringify(addRecommendationEmail));
  content.account_id = ObjectID(data.account_id);
  content.user_id = ObjectID(data.user_id);
  content.favorite_id = data._id;
  content.tradeType = data.tradeType;
  content.country = data.country;
  content.endDate = endDate;
  content.createdAt = currentTimestamp;
  content.updatedAt = currentTimestamp;

  return content;
};

const countSchema = (data) => {

  let content = JSON.parse(JSON.stringify(count));

  content.account_id = ObjectID(data.account_id);
  content.user_id = ObjectID(data.user_id);

  return content;
};

const addShipmentRecommendationSchema = (data) => {
  let currentTimestamp = Date();
  let content = JSON.parse(JSON.stringify(addShipment));

  content.account_id = ObjectID(data.account_id);
  content.user_id = ObjectID(data.user_id);
  content.country = data.country;
  content.tradeType = data.tradeType;
  content.bl_flag = data.bl_flag;
  content.taxonomy_id = ObjectID(data.taxonomy_id);
  content.recordRow = data.recordRow;
  content.isFavorite = true;
  content.createdAt = currentTimestamp;
  content.updatedAt = currentTimestamp;

  return content;
};

const updateRecommendationSchema = (data) => {
  let currentTimestamp = Date();
  let content = JSON.parse(JSON.stringify(update));

  //content.user_id = ObjectID(data.user_id);
  content._id = ObjectID(data._id);
  if (data.isFavorite) {
    content.isFavorite = false
  }
  else {
    content.isFavorite = true
  }
  // content.isFavorite = data.isFavorite;
  // content.country = data.country;
  // content.tradeType = data.tradeType;
  content.updatedAt = currentTimestamp;
  return content;
};

const updateRecommendationEmailSchema = (id, endDate) => {
  let currentTimestamp = Date();
  let content = JSON.parse(JSON.stringify(updateRecommendationEmail));

  content.endDate = endDate;
  content.favorite_id = ObjectID(id);
  content.updatedAt = currentTimestamp;
  return content;
};

const fetchRecommendationSchema = (data) => {
  let currentTimestamp = Date();
  let content = JSON.parse(JSON.stringify(fetch));

  content.user_id = ObjectID(data.user_id);
  content._id = ObjectID(data._id);
  content.country = data.country;
  content.tradeType = data.tradeType;
  content.updatedAt = currentTimestamp;

  return content;
};

const fetchCDNRecommendationSchema = (taxonomy_id) => {
  let content = JSON.parse(JSON.stringify(fetchCDNDetails));

  if (taxonomy_id) {
    content.taxonomy_id = ObjectID(taxonomy_id)
  }

  return content;
};


const fetchRecommendationMailSchema = (user_id, favorite_id) => {
  let content = JSON.parse(JSON.stringify(fetchRecommendationMail));

  if (user_id && favorite_id) {
    content.favorite_id = ObjectID(favorite_id)
    content.user_id = ObjectID(user_id)
  }

  return content;
};

const esSchema = (metaData, endDate) => {

  let content = {}
  let indexName = metaData.country.toLocaleLowerCase() + "_" + metaData.tradeType.toLocaleLowerCase()
  content.columnName = metaData.columnName;
  content.columnValue = metaData.columnValue;
  content.dateField = metaData.date_type;
  content.lte = endDate.CDR_endDate;
  content.gte = endDate.mail_endDate;
  content.indexName = indexName

  return content;
};

const fetchRecommendationListSchema = (data) => {

  let content = JSON.parse(JSON.stringify(fetchList));

  content.user_id = ObjectID(data.user_id);
  content.account_id = ObjectID(data.account_id);
  if (data.tradeType) {
    content.tradeType = data.tradeType.toUpperCase();
  }
  if(data.country){
    content.country = data.country.toLocaleLowerCase();
  }
  return content;
};

const fetchTradeShipmentListSchema = (data) => {

  let content = JSON.parse(JSON.stringify(fetchShipmentList));

  content.user_id = ObjectID(data.user_id);
  content.account_id = ObjectID(data.account_id);
  content.tradeType = data.tradeType;
  content.country = data.country.toLocaleLowerCase()

  return content;
};


module.exports = {
  addRecommendationSchema,
  updateRecommendationSchema,
  fetchRecommendationSchema,
  esSchema,
  countSchema,
  fetchCDNRecommendationSchema,
  fetchRecommendationMailSchema,
  fetchRecommendationListSchema,
  addRecommendationEmailSchema,
  updateRecommendationEmailSchema,
  addShipmentRecommendationSchema,
  fetchTradeShipmentListSchema
}