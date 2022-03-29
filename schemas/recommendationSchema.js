const TAG = "recommendationSchema";

const ObjectID = require("mongodb").ObjectID;

const createCompanyRecommendation = {
  account_id: "",
  user_id: "",
  country: "",
  tradeType: "",
  recordRow: "",
  columnName: "",
  columnValue: "",
  bl_flag: 0,
  taxonomy_id: "",
  isFavorite: 0,
  createdAt: 0,
  updatedAt: 0,
  countryCode: "",
};

const createShipment = {
  account_id: "",
  user_id: "",
  country: "",
  tradeType: "",
  taxonomy_id: "",
  recordRow: "",
  bl_flag: 0,
  isFavorite: 0,
  createdAt: 0,
  updatedAt: 0,
};

const updateCompany = {
  _id: "",
  isFavorite: "",
  updatedAt: 0,
};

const updateRecommendationEmail = {
  favorite_id: '',
  endDate: '',
  updatedAt: 0
};

const find = {
  _id: "",
  user_id: "",
  country: "",
  tradeType: "",
  updatedAt: "",
};

const fetchCount = {
  account_id: "",
  user_id: "",
};

const companyRecommendationList = {
  account_id: "",
  user_id: "",
  tradeType: "",
  country: "",
};

const shipmentRecommendationList = {
  account_id: "",
  user_id: "",
  tradeType: "",
  country: "",
};

const fetchRecommendationMail = {
  user_id: "",
  favorite_id: "",
};

const CDNDetails = {
  taxonomy_id: "",
};

const addRecommendationEmail = {
  account_id: "",
  user_id: "",
  country: "",
  tradeType: "",
  favorite_id: "",
  endDate: "",
  createdAt: 0,
  updatedAt: 0,
};

const createCompanyRecommendationSchema = (data) => {
  let currentTimestamp = Date();
  let content = JSON.parse(JSON.stringify(createCompanyRecommendation));

  content.countryCode = data.countryCode;
  content.account_id = ObjectID(data.account_id);
  content.user_id = ObjectID(data.user_id);
  content.country = data.country;
  content.tradeType = data.tradeType;
  content.bl_flag = data.bl_flag;
  content.recordRow = data.recordRow;
  content.taxonomy_id = ObjectID(data.taxonomyId);
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

const fetchCountSchema = (data) => {
  let content = JSON.parse(JSON.stringify(fetchCount));

  content.account_id = ObjectID(data.account_id);
  content.user_id = ObjectID(data.user_id);

  return content;
};

const createShipmentRecommendationSchema = (data) => {
  let currentTimestamp = Date();
  let content = JSON.parse(JSON.stringify(createShipment));

  content.account_id = ObjectID(data.account_id);
  content.user_id = ObjectID(data.user_id);
  content.country = data.country;
  content.tradeType = data.tradeType;
  content.bl_flag = data.bl_flag;
  content.taxonomy_id = ObjectID(data.taxonomyId);
  content.recordRow = data.recordRow;
  content.isFavorite = true;
  content.createdAt = currentTimestamp;
  content.updatedAt = currentTimestamp;

  return content;
};

const updateRecommendationSchema = (data) => {
  let currentTimestamp = Date();
  let content = JSON.parse(JSON.stringify(updateCompany));

  if (data.isFavorite) {
    content.isFavorite = false;
  } else {
    content.isFavorite = true;
  }
  content._id = ObjectID(data._id);
  content.updatedAt = currentTimestamp;
  return content;
};

const updateRecommendationEmailSchema = (id, endDate) => {
  let currentTimestamp = Date();
  let content = JSON.parse(JSON.stringify(updateRecommendationEmail));

  content.endDate = endDate;
  content.favorite_id = id;
  content.updatedAt = currentTimestamp;
  return content;
};

const fetchRecommendationSchema = (data) => {
  let currentTimestamp = Date();
  let content = JSON.parse(JSON.stringify(find));

  content.user_id = ObjectID(data.user_id);
  content._id = ObjectID(data._id);
  content.country = data.country;
  content.tradeType = data.tradeType;
  content.updatedAt = currentTimestamp;

  return content;
};

const fetchCDNRecommendationSchema = (taxonomy_id) => {
  let content = JSON.parse(JSON.stringify(CDNDetails));

  if (taxonomy_id) {
    content.taxonomy_id = ObjectID(taxonomy_id);
  }

  return content;
};

const fetchRecommendationMailSchema = (user_id, favorite_id) => {
  let content = JSON.parse(JSON.stringify(fetchRecommendationMail));

  if (user_id && favorite_id) {
    content.favorite_id = ObjectID(favorite_id);
    content.user_id = ObjectID(user_id);
  }

  return content;
};

const esListSchema = (metaData) => {
  let content = {};
  let indexName =
    metaData.country.toLocaleLowerCase() +
    "_" +
    metaData.tradeType.toLocaleLowerCase();
  content.columnName = metaData.columnName;
  content.columnValue = metaData.columnValue;
  content.countryCode = metaData.countryCode;
  content.indexName = indexName;

  return content;
};

const esSchema = (metaData, endDate) => {
  let content = {};
  let indexName =
    metaData.country.toLocaleLowerCase() +
    "_" +
    metaData.tradeType.toLocaleLowerCase();
  content.columnName = metaData.columnName;
  content.columnValue = metaData.columnValue;
  content.dateField = metaData.date_type;
  content.lte = endDate.CDR_endDate;
  content.gte = endDate.mail_endDate;
  content.indexName = indexName;

  return content;
};

const fetchRecommendationListSchema = (data) => {
  let content = JSON.parse(JSON.stringify(companyRecommendationList));

  content.user_id = ObjectID(data.user_id);
  content.account_id = ObjectID(data.account_id);
  if (data.tradeType) {
    content.tradeType = data.tradeType.toUpperCase();
  }
  if (data.country) {
    content.country = data.country.toLocaleLowerCase();
  }
  return content;
};

const fetchTradeShipmentListSchema = (data) => {
  let content = JSON.parse(JSON.stringify(shipmentRecommendationList));

  content.user_id = ObjectID(data.user_id);
  content.account_id = ObjectID(data.account_id);
  content.tradeType = data.tradeType;
  content.country = data.country.toLocaleLowerCase();

  return content;
};

module.exports = {
  createCompanyRecommendationSchema,
  createShipmentRecommendationSchema,
  updateRecommendationSchema,
  fetchRecommendationSchema,
  esSchema,
  esListSchema,
  fetchCountSchema,
  fetchCDNRecommendationSchema,
  fetchRecommendationMailSchema,
  fetchRecommendationListSchema,
  addRecommendationEmailSchema,
  updateRecommendationEmailSchema,
  fetchTradeShipmentListSchema,
};
