const TAG = 'globalSearchSchema';
const ElasticsearchDbQueryBuilderHelper = require('./../helpers/elasticsearchDbQueryBuilderHelper');

const RESULT_PORTION_TYPE_RECORDS = 'RECORD_SET';
const RESULT_PORTION_TYPE_SUMMARY = 'SUMMARY_RECORDS';

const formulateCountryGraph = (data) => {
  let aggregationClause = {
    "yearMonth": {
      "date_histogram": {
        "field": "",
        "calendar_interval": "month",
        "format": "yyyy-MM"
      }
    }
  }

  aggregationClause.yearMonth.date_histogram.field = data.dateField != undefined ? data.dateField : ""
  aggregationClause.yearMonth.date_histogram.field += data.dateFieldSuffix != undefined ? data.dateFieldSuffix : ""

  startDate = data.startDate != undefined ? data.startDate : ""
  endDate = data.endDate != undefined ? data.endDate : ""

  let queryClause = {
    bool: {}
  };
  queryClause.bool.must = [{
    "range": {
      "IMP_DATE": {
        "gte": startDate,
        "lte": endDate
      }
    }
  }];
  queryClause.bool.should = [];
  queryClause.bool.filter = [];


  // console.log(JSON.stringify(queryClause));
  return {
    size: data.size,
    query: (queryClause.bool.must.length != 0) ? queryClause : {},
    aggs: aggregationClause
  };
};


const formulatePortGraph = (data) => {
  let aggregationClause = {
    "importersCount": {
      "terms": {
        "field": "IMPORTER_NAME.keyword",
        "size": 5,
        "order": { "_count": "desc" }
      },
      "aggs":{
        "yearMonth": {
          "date_histogram": {
            "field": "IMP_DATE",
            "calendar_interval": "month",
            "format": "yyyy-MM"
          }
        }
      }
    }
  }

  aggregationClause.importersCount.terms.field = data.importerField != undefined ? data.importerField : ""
  aggregationClause.importersCount.terms.field += data.importerFieldSuffix != undefined ? data.importerFieldSuffix : ""

  aggregationClause.importersCount.aggs.yearMonth.date_histogram.field = data.dateField != undefined ? data.dateField : ""
  aggregationClause.importersCount.aggs.yearMonth.date_histogram.field += data.dateFieldSuffix != undefined ? data.dateFieldSuffix : ""

  startDate = data.startDate != undefined ? data.startDate : ""
  endDate = data.endDate != undefined ? data.endDate : ""

  let fieldName = aggregationClause.importersCount.terms.field;
  let termsQuery = {
  }
  termsQuery[fieldName] = ["",
    "NULL"
  ]

  let queryClause = {
    bool: {}
  };
  queryClause.bool.must = [{
    "range": {
      "IMP_DATE": {
        "gte": startDate,
        "lte": endDate
      }
    }
  }];
  queryClause.bool.should = [];
  queryClause.bool.filter = [];
  queryClause.bool.must_not = [];
  queryClause.bool.must_not.push({ "terms": termsQuery })

  // console.log(JSON.stringify(queryClause));

  return {
    size: data.size,
    query: (queryClause.bool.must.length != 0) ? queryClause : {},
    aggs: aggregationClause
  };

};


const formulateCompanyGraph = (data) => {
  let aggregationClause = {
    "companyDetails": {
      "terms": {
        "field": "",
        "size": 5,
        "order": {
          "_count": "desc"
        }
      },
      "aggs": {
        "portDetails": {
          "terms": {
            "field": "",
            "size": 5,
            "order": {
              "_count": "desc"
            }
          }
        },
        "traderDetails": {
          "terms": {
            "field": "",
            "size": 5,
            "order": {
              "_count": "desc"
            }
          }
        },
        "yearMonth": {
          "date_histogram": {
            "field": "IMP_DATE",
            "calendar_interval": "month",
            "format": "yyyy-MM"
          }
        }
      }
    }
  }

  aggregationClause.companyDetails.terms.field = data.companyField != undefined ? data.companyField : ""
  aggregationClause.companyDetails.terms.field += data.companyFieldSuffix != undefined ? data.companyFieldSuffix : ""

  aggregationClause.companyDetails.aggs.portDetails.terms.field = data.portField != undefined ? data.portField : ""
  aggregationClause.companyDetails.aggs.portDetails.terms.field += data.portFieldSuffix != undefined ? data.portFieldSuffix : ""

  aggregationClause.companyDetails.aggs.traderDetails.terms.field = data.traderField != undefined ? data.traderField : ""
  aggregationClause.companyDetails.aggs.traderDetails.terms.field += data.traderFieldSuffix != undefined ? data.traderFieldSuffix : ""

  aggregationClause.companyDetails.aggs.yearMonth.date_histogram.field = data.dateField != undefined ? data.dateField : ""
  aggregationClause.companyDetails.aggs.yearMonth.date_histogram.field += data.dateFieldSuffix != undefined ? data.dateFieldSuffix : ""

  startDate = data.startDate != undefined ? data.startDate : ""
  endDate = data.endDate != undefined ? data.endDate : ""


  let queryClause = {
    bool: {}
  };
  queryClause.bool.must = [{
    "range": {
      "IMP_DATE": {
        "gte": startDate,
        "lte": endDate
      }
    }
  }];
  queryClause.bool.should = [];
  queryClause.bool.filter = [];
  queryClause.bool.must_not = [];

  let companyFieldName = aggregationClause.companyDetails.terms.field;

  let termsQuery = {
  }
  termsQuery[companyFieldName] = ["",
    "NULL"
  ]
  queryClause.bool.must_not.push({ "terms": { ...termsQuery } })

  let portFieldName = aggregationClause.companyDetails.aggs.portDetails.terms.field;
  termsQuery = {
  }
  termsQuery[portFieldName] = ["",
    "NULL"
  ]
  queryClause.bool.must_not.push({ "terms": { ...termsQuery } })
  let traderFieldName = aggregationClause.companyDetails.aggs.traderDetails.terms.field;

  termsQuery = {
  }
  termsQuery[traderFieldName] = ["",
    "NULL"
  ]
  queryClause.bool.must_not.push({ "terms": { ...termsQuery } })

  // console.log(JSON.stringify(data));

  return {
    size: data.size,
    query: (queryClause.bool.must.length != 0) ? queryClause : {},
    aggs: aggregationClause
  };

};

module.exports = {
  formulateCountryGraph,
  formulatePortGraph,
  formulateCompanyGraph
};
