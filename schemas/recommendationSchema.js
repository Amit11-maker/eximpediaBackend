const TAG = 'recommendationSchema';

const ObjectID = require('mongodb').ObjectID;

const add = {
  account_id: '',
  user_id: '',
  country: '',
  tradeType: '',
  columnName: '',
  columnValue: '',
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

const fetch = {
  _id: '',
  user_id: '',
  country: '',
  tradeType: '',
  columnValue: ''
};

const fetchRecommendationMail = {

  user_id: '',
  favorite_id: ''

};



const fetchCDNDetails = {

  country: '',
  trade_type: ''

};


const addRecommendationSchema = (data) => {
  let currentTimestamp = Date();
  let content = JSON.parse(JSON.stringify(add));

  content.account_id = ObjectID(data.account_id);
  content.user_id = ObjectID(data.user_id);
  content.country = data.country;
  content.tradeType = data.tradeType;
  content.bl_flag = data.bl_flag;
  content.columnName = data.columnName;
  content.columnValue = data.columnValue;
  content.recordRow = data.recordRow
  content.isFavorite = data.isFavorite;
  content.createdAt = currentTimestamp;
  content.updatedAt = currentTimestamp;

  return content;
};


const updateRecommendationSchema = (data) => {
  let currentTimestamp = new Date();
  let content = JSON.parse(JSON.stringify(update));

  content.user_id = ObjectID(data.user_id);
  content._id = ObjectID(data._id);
  content.isFavorite = data.isFavorite;
  content.updatedAt = currentTimestamp;
  content.country = data.country;
  content.tradeType = data.tradeType;

  return content;
};

const fetchRecommendationSchema = (data) => {
  let currentTimestamp = new Date();
  let content = JSON.parse(JSON.stringify(fetch));

  content.user_id = ObjectID(data.user_id);
  content._id = ObjectID(data.object_id);
  content.country = data.country;
  content.tradeType = data.tradeType;
  content.columnValue = data.columnValue;
  content.updatedAt = currentTimestamp;

  return content;
};

const fetchCDNRecommendationSchema = (country,tradeType) => {
  let content = JSON.parse(JSON.stringify(fetchCDNDetails));

  if (tradeType && country) {
    content.country = country
    content.trade_type = tradeType.toLowerCase()  
  }
  
  return content;
};


const fetchRecommendationMailSchema = (user_id,favorite_id) => {
  let content = JSON.parse(JSON.stringify(fetchRecommendationMail));

  if (user_id && favorite_id) {
    content.favorite_id =favorite_id
    content.user_id = user_id  
  }
  
  return content;
};

const esSchema = (metaData,endDate) => {

  let content = {}
  let indexName = metaData.country.toLocaleLowerCase() + "_" + metaData.tradeType.toLocaleLowerCase()
  content.columnName = metaData.columnName;
  content.columnValue = metaData.columnValue;
  content.dateField = metaData.date_type;
  content.gte = endDate.mail_endDate;
  content.lte = endDate.CDR_EndDate;
  content.indexName = indexName

  return content;
};

module.exports = {
  addRecommendationSchema,
  updateRecommendationSchema,
  fetchRecommendationSchema,
  //fetchUserRecommendationSchema,
  esSchema,
  fetchCDNRecommendationSchema,
  fetchRecommendationMailSchema
}