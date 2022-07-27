const TAG = "workspaceModel";
const dotenv = require("dotenv").config();

const ObjectID = require("mongodb").ObjectID;
const ElasticsearchDbQueryBuilderHelper = require('./../helpers/elasticsearchDbQueryBuilderHelper');
const MongoDbHandler = require("../db/mongoDbHandler");
const ElasticsearchDbHandler = require("../db/elasticsearchDbHandler");
const WorkspaceSchema = require("../schemas/workspaceSchema");
const ActivityModel = require("../models/activityModel");
const ExcelJS = require("exceljs");
const s3Config = require("../config/aws/s3Config")

const recordsLimitPerWorkspace = 50000;

const INDIA_EXPORT_COLUMN_NAME = {
  "BILL_NO": "SB_NO",
  "FOUR_DIGIT": "FOUR_DIGIT",
  "EXP_DATE": "DATE",
  "HS_CODE": "HS_CODE",
  "PRODUCT_DESCRIPTION": "GOODS_DESCRIPTION",
  "QUANTITY": "QUANTITY",
  "UNIT": "UNIT",
  "ITEM_RATE_INV": "ITEM_PRICE_INV",
  "CURRENCY": "CURRENCY",
  "TOTAL_AMOUNT_INV_FC": "TOTAL_PRICE_INV_FC",
  "FOB_INR": "FOB_INR",
  "ITEM_RATE_INR": "UNIT_PRICE_INR",
  "FOB_USD": "FOB_USD",
  "USD_EXCHANGE_RATE": "EXCHANGE_RATE_USD",
  "FOREIGN_PORT": "DESTINATION_PORT",
  "COUNTRY": "COUNTRY",
  "INDIAN_PORT": "INDIAN_PORT",
  "IEC": "IEC",
  "EXPORTER_NAME": "EXPORTER",
  "ADDRESS": "ADDRESS",
  "CITY": "CITY",
  "PIN": "PIN",
  "BUYER_NAME": "CONSIGNEE_NAME",
  "BUYER_ADDRESS": "CONSIGNEE_ADDRESS",
  "INVOICE_NO": "INVOICE_NO",
  "CUSH": "PORT_CODE",
  "ITEM_NO": "ITEM_NO",
  "DRAWBACK": "DRAWBACK",
  "STD_QUANTITY": "STD_QUANTITY",
  "STD_UNIT": "STD_UNIT",
  "STD_ITEM_RATE_INR": "STD_ITEM_RATE_INR",
  "STD_ITEM_RATE_INV": "STD_ITEM_RATE_USD"
}

const INDIA_IMPORT_COLUMN_NAME = {
  "HS_CODE": "HS_CODE",
  "IMP_DATE": "DATE",
  "PRODUCT_DESCRIPTION": "GOODS_DESCRIPTION",
  "TOTAL_ASSESS_USD": "TOTAL_VALUE_USD",
  "TOTAL_ASSESSABLE_VALUE_INR": "TOTAL_VALUE_INR",
  "IMPORTER_NAME": "IMPORTER",
  "SUPPLIER_NAME": "SUPPLIER",
  "UNIT": "UNIT",
  "QUANTITY": "QUANTITY",
  "ADDRESS": "ADDRESS",
  "APPRAISING_GROUP": "APPRAISING_GROUP",
  "BE_NO": "BILL OF ENTRY",
  "CHA_NAME": "CHA_NAME",
  "CHA_NO": "CHA_NO",
  "CITY": "CITY",
  "CUSH": "PORT_CODE",
  "IEC": "IEC",
  "INDIAN_PORT": "INDIAN_PORT",
  "INVOICE_CURRENCY": "INVOICE_CURRENCY",
  "INVOICE_NO": "INVOICE_NO",
  "INVOICE_UNITPRICE_FC": "INVOICE_UNITPRICE_FC",
  "ORIGIN_COUNTRY": "COUNTRY_OF_ORIGIN",
  "PORT_OF_SHIPMENT": "LOADING_PORT",
  "RECORDS_TAG": "RECORDS_TAG",
  "SUPPLIER_ADDRESS": "SUPPLIER_ADDRESS",
  "TOTAL_DUTY_PAID": "DUTY_PAID_INR",
  "TYPE": "BE_TYPE",
  "UNIT_PRICE_USD": "UNIT_PRICE_USD",
  "UNIT_VALUE_INR": "UNIT_PRICE_INR",
  "STD_QUANTITY": "STD_QUANTITY",
  "STD_UNIT": "STD_UNIT",
  "STD_UNIT_PRICE_USD": "STD_UNIT_PRICE_USD",
  "STD_UNIT_VALUE_INR": " STD_UNIT_VALUE_INR"
}

// fetches existing purchased record id's from elasticsearch
const fetchPurchasedRecords = async (wks) => {
  let query = {
    size: recordsLimitPerWorkspace,
    query: {
      match_all: {}
    }
  }
  try {
    let results = await ElasticsearchDbHandler.getDbInstance().search({
      index: wks,
      track_total_hits: true,
      body: query
    }
    );
    let mappedResult = {};
    mappedResult[WorkspaceSchema.IDENTIFIER_SHIPMENT_RECORDS] = [];
    mappedResult['id'] = [];

    results.body.hits.hits.forEach((hit) => {
      mappedResult[WorkspaceSchema.IDENTIFIER_SHIPMENT_RECORDS].push(hit._source);
      mappedResult["id"].push(hit._source.id);
    });
    return [mappedResult[WorkspaceSchema.IDENTIFIER_SHIPMENT_RECORDS], mappedResult["id"]]
  } catch (err) {
    return [[], []]
  }

}

const buildFilters = (filters) => {
  let filterClause = {};
  // filterClause.years = {};
  if (filters.tradeType != null) filterClause.trade = filters.tradeType;
  if (filters.countryCode != null)
    filterClause.code_iso_3 = filters.countryCode;
  // if (filters.tradeYear != null) filterClause.years.$in = [filters.tradeYear];
  return filterClause;
}

const add = (workspace, cb) => {
  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.workspace)
    .insertOne(workspace, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
}

const remove = (workspaceId, cb) => {
  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.workspace)
    .deleteOne(
      {
        _id: ObjectID(workspaceId),
      },
      function (err, result) {
        if (err) {
          cb(err);
        } else {
          cb(null, result);
        }
      }
    );
}

const createIndexes = (collection, indexSpecifications, cb) => {
  let keyedIndexSpecifications = indexSpecifications.map(
    (indexSpecification) => {
      return {
        key: indexSpecification,
      };
    }
  );

  //

  MongoDbHandler.getDbInstance()
    .collection(collection)
    .createIndexes(keyedIndexSpecifications, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
}

const addRecordsAggregationEngine = async (payload, aggregationParams, tradeDataBucket,
  workspaceDataBucket, workspaceElasticConfig, cb) => {

  const accountId = payload.accountId;
  const userId = payload.userId;
  const tradeType = payload.tradeType;
  const country = payload.country;
  const workspaceId = payload.workspaceId;
  const workspaceName = payload.workspaceName;
  let downloadPayload = {
    country,
    trade: tradeType,
    workspaceBucket: workspaceDataBucket,
    indexNamePrefix: `${country.toLowerCase()}_${tradeType.toLowerCase()}`,
    allFields: payload.allFields
  }
  let shipmentRecordsIds = []
  let clause = {}
  let aggregationExpression = {}
  const startQueryTime = new Date();
  let existing_records = [[], []]
  aggregationParams = await ElasticsearchDbQueryBuilderHelper.addAnalyzer(aggregationParams)

  if ((aggregationParams.recordsSelections && aggregationParams.recordsSelections.length > 0) || aggregationParams.allRecords) {
    shipmentRecordsIds = aggregationParams.recordsSelections;
    allRecords = aggregationParams.allRecords;
    existing_records = await fetchPurchasedRecords(workspaceDataBucket)
    if (allRecords && existing_records[1]) {
      for (let record of allRecords) {
        if (!existing_records.includes(record)) {
          shipmentRecordsIds.push(record)
        }
      }
    }
    clause.terms = {
      _id: shipmentRecordsIds,
    }
    aggregationExpression.query = clause;
    aggregationExpression.from = 0; // clause.offset;
    aggregationExpression.size = recordsLimitPerWorkspace; // clause.limit;
  } else {
    if (aggregationParams.recordsSelections == null) {
      cb(null, {
        merged: false,
        message: "Nothing to add",
      });
      return;
    }
    clause = WorkspaceSchema.formulateShipmentRecordsIdentifierAggregationPipelineEngine(aggregationParams);
    aggregationExpression.from = 0;
    aggregationExpression.size = recordsLimitPerWorkspace;
    aggregationExpression.sort = clause.sort;
    aggregationExpression.query = clause.query;
  }

  result = await ElasticsearchDbHandler.getDbInstance().search({
    index: tradeDataBucket,
    track_total_hits: true,
    body: aggregationExpression,
  });

  let dataset = []
  result.body.hits.hits.forEach((hit) => {
    let sourceData = hit._source;
    sourceData.id = hit._id;
    dataset.push(sourceData);
  });

  await ElasticsearchDbHandler.getDbInstance().indices.create(
    {
      index: workspaceDataBucket,
      body: workspaceElasticConfig
    },
    {
      ignore: [400],
    }
  );

  const body = dataset.flatMap((doc) => [
    {
      index: {
        _index: workspaceDataBucket,
      },
    },
    doc
  ]);

  const { body: bulkResponse } = await ElasticsearchDbHandler.getDbInstance().bulk({ refresh: true, body });

  if (bulkResponse.errors) {
    console.log("Error ===================", bulkResponse.errors);
    const erroredDocuments = [];
    // The items array has the same order of the dataset we just indexed.
    // The presence of the `error` key indicates that the operation
    // that we did for the document has failed.
    bulkResponse.items.forEach((action, i) => {
      const operation = Object.keys(action)[0];
      if (action[operation].error) {
        erroredDocuments.push({
          // If the status is 429 it means that you can retry the document,
          // otherwise it's very likely a mapping error, and you should
          // fix the document before to try it again.
          status: action[operation].status,
          error: action[operation].error,
          operation: body[i * 2],
          document: body[i * 2 + 1],
        });
      }
    });
    cb(bulkResponse.errors);
  } else {
    const endQueryTime = new Date();

    const queryTimeResponse = (endQueryTime.getTime() - startQueryTime.getTime()) / 1000;
    addQueryToActivityTrackerForUser(aggregationParams, accountId, userId, tradeType, country, queryTimeResponse);

    for (let data of existing_records[0]) {
      dataset.push(data)
    }

    try {
      /** Adding data in s3 file */
      const s3FilePath = await analyseData(dataset, downloadPayload, workspaceId, workspaceName);
      cb(null, { merged: true, s3FilePath: s3FilePath });
    } catch (error) {
      cb(error);
    }
  }
}

async function analyseData(mappedResult, payload, workspaceId, workspaceName) {
  let isHeaderFieldExtracted = false;
  let shipmentDataPack = {};
  shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_RECORDS] = [];
  shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_FIELD_HEADERS] = [];

  let newArr = [...mappedResult];

  newArr.forEach((hit) => {

    if (payload) {
      let row_values = [];
      for (let fields of payload.allFields) {
        if (fields.toLowerCase() == "records_tag")
          continue;
        else if (fields.toLowerCase() == "be_no")
          continue;

        else if (fields.toLowerCase() == "bill_no")
          continue;
        if (hit[fields] == null || hit[fields] == "NULL" || hit[fields] == "") {
          hit[fields] = "null";
        }
        row_values.push(hit[fields]);
      }
      shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_RECORDS].push([
        ...row_values,
      ]);
    }
    else
      shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_RECORDS].push([
        ...Object.values(hit),
      ]);
    if (!isHeaderFieldExtracted) {
      var headerArr = [];
      if (payload)
        headerArr = payload.allFields.filter((columnName) => { return columnName.toLowerCase() != 'records_tag' });
      else
        headerArr = Object.keys(hit);

      if ((payload.country && payload.trade && payload.country.toLowerCase() == 'india' && payload.trade.toLowerCase() == 'import')
        || (payload.indexNamePrefix && payload.indexNamePrefix.includes("ind") && payload.indexNamePrefix.includes("import"))) {
        let finalHeader = [];
        for (let key of headerArr) {
          if (key.toLowerCase() == "be_no")
            continue;
          if (INDIA_IMPORT_COLUMN_NAME[key]) {
            finalHeader.push(INDIA_IMPORT_COLUMN_NAME[key]);
          }
          else {
            finalHeader.push(key);
          }
        }
        headerArr = [...finalHeader];
      }
      else if ((payload.country && payload.trade && payload.country.toLowerCase() == 'india' && payload.trade.toLowerCase() == 'export')
        || (payload.indexNamePrefix && payload.indexNamePrefix.includes("ind") && payload.indexNamePrefix.includes("export"))) {
        let finalHeader = [];
        for (let key of headerArr) {
          if (key.toLowerCase() == "bill_no")
            continue;
          if (INDIA_EXPORT_COLUMN_NAME[key]) {
            finalHeader.push(INDIA_EXPORT_COLUMN_NAME[key]);
          }
          else {
            finalHeader.push(key);
          }
        }
        headerArr = [...finalHeader];

      }
      headerArr.forEach((key, index) => {
        shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_FIELD_HEADERS].push(key.replace("_", " "));
      });
    }
    isHeaderFieldExtracted = true;
  });
  let bundle = {};

  bundle.data = shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_RECORDS];
  bundle.headers =
    shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_FIELD_HEADERS];

  try {
    var text = " DATA";
    var workbook = new ExcelJS.Workbook();
    let worksheet = workbook.addWorksheet("Trade Data");
    var getCellCountryText = worksheet.getCell("C2");
    var getCellRecordText = worksheet.getCell("C4");

    worksheet.getCell("A5").value = "";

    getCellCountryText.value = text;
    getCellCountryText.font = {
      name: "Calibri",
      size: 22,
      underline: "single",
      bold: true,
      color: { argb: "005d91" },
      height: "auto",
    }
    worksheet.mergeCells("C2", "E3");
    getCellRecordText.font = {
      name: "Calibri",
      size: 14,
      bold: true,
      color: { argb: "005d91" },
    }
    getCellCountryText.alignment = { vertical: "middle", horizontal: "center" };
    getCellRecordText.alignment = { vertical: "middle", horizontal: "center" };
    worksheet.mergeCells("C4", "E4");

    //Add Image
    let myLogoImage = workbook.addImage({
      filename: "./public/images/logo-new.jpg",
      extension: "jpeg",
    });

    worksheet.addImage(myLogoImage, "A1:A4");
    worksheet.add;
    let headerRow = worksheet.addRow(bundle.headers);

    var colLength = [];
    let highlightCell = 0;
    headerRow.eachCell((cell, number) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "005d91" },
        bgColor: { argb: "" },
      }
      cell.font = {
        bold: true,
        color: { argb: "FFFFFF" },
        size: 12,
      }
      if (cell.value == "HS CODE") {
        highlightCell = number;
      }
      colLength.push(cell.value ? cell.value.toString().length : 10);
    });
    worksheet.columns.forEach(function (column, i) {
      if (colLength[i] < 10) {
        colLength[i] = 10;
      }
      column.width = colLength[i] * 2;
    });

    // Adding Data with Conditional Formatting
    bundle.data.forEach((d) => {
      var rowValue = [];
      for (let value of d) {
        if (typeof value == "string" || typeof value == "number")
          rowValue.push(value);
        else if (!Array.isArray(value) &&
          typeof value == "object" &&
          value.hasOwnProperty("value"))
          rowValue.push(value.value);
      }
      let row = worksheet.addRow(rowValue);
      if (highlightCell != 0) {
        let color = "FF99FF99";
        let sales = row.getCell(highlightCell);
        if (+sales.value < 200000) {
          color = "FF9999";
        }

        sales.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: color },
        };
      }
    });

    worksheet.getColumn(1).width = 35;
    wbOut = await workbook.xlsx.writeBuffer();

    return await fetchAndAddDataToS3(wbOut, workspaceId, workspaceName);
  } catch (err) {
    console.log(err);
    throw error;
  }
}

async function fetchAndAddDataToS3(fileObj, workspaceId, workspaceName) {
  try {
    const filePath = workspaceId + "/" + workspaceName + ".xlsx";

    var uploadParams = {
      Bucket: "eximpedia-workspaces",
      Key: filePath,
      ACL: 'public-read',
      Body: fileObj,
      ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }

    await s3Config.s3ConnectionConfig.upload(uploadParams).promise()
    console.log("File uploaded Successfully");

    var getUrlParams = {
      Bucket: "eximpedia-workspaces",
      Key: filePath,
      Expires: s3Config.EXPIRATION_FOR_UNSIGNED_URL_IN_SEC
    }
    
    const s3DownloadUrl = s3Config.s3ConnectionConfig.getSignedUrl("getObject" , getUrlParams);
    console.log("url :" + s3DownloadUrl);
    return s3DownloadUrl;

  } catch (error) {
    console.log("Error at uploadCSVFileOnS3Bucket function", error);
    throw error;
  }
}

async function addQueryToActivityTrackerForUser(aggregationParams, accountId, userId, tradeType, country, queryResponseTime) {

  var workspace_search_query_input = {
    query: JSON.stringify(aggregationParams.matchExpressions),
    account_id: ObjectID(accountId),
    user_id: ObjectID(userId),
    tradeType: tradeType,
    country: country,
    queryResponseTime: queryResponseTime,
    isWorkspaceQuery: true,
    created_ts: Date.now(),
    modified_ts: Date.now()
  }

  try {
    await ActivityModel.addActivity(workspace_search_query_input);
  }
  catch (error) {
    throw error;
  }
}

const updateRecordMetrics = (workspaceId, workspaceDataBucket, recordsYear, recordsCount, s3FilePath, cb) => {
  let filterClause = {
    _id: ObjectID(workspaceId)
  }

  let updateClause = {
    $set: {
      records: recordsCount,
      s3_path: s3FilePath,
      start_date: "",
      end_date: "",
    },
    $addToSet: {
      years: recordsYear
    }
  }

  if (workspaceDataBucket != null) {
    updateClause.$set.data_bucket = workspaceDataBucket;
  }

  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.workspace)
    .updateOne(filterClause, updateClause, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
}

const updatePurchaseRecordsKeeper = (workspacePurchase, cb) => {
  let filterClause = {
    taxonomy_id: ObjectID(workspacePurchase.taxonomy_id),
    account_id: ObjectID(workspacePurchase.account_id),
    code_iso_3: workspacePurchase.country,
    trade: workspacePurchase.trade,
  };

  let updateClause = {};

  updateClause.$set = {
    country: workspacePurchase.country,
    flag_uri: workspacePurchase.flag_uri,
    code_iso_2: workspacePurchase.code_iso_2,
  };

  updateClause.$addToSet = {
    records: {
      $each: workspacePurchase.records,
    },
  };

  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.purchased_records_keeper)
    .updateOne(
      filterClause,
      updateClause,
      {
        upsert: true,
      },
      function (err, result) {
        if (err) {
          cb(err);
        } else {
          cb(null, result);
        }
      }
    );
};

const findByFilters = (filters, cb) => {
  let filterClause = buildFilters(filters);
  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.workspace)
    .find(filterClause)
    .project({
      _id: 1,
      taxonomy_id: 1,
      account_id: 1,
      user_id: 1,
      country: 1,
      code_iso_3: 1,
      code_iso_2: 1,
      trade: 1,
      years: 1,
      records: 1,
      data_bucket: 1,
      name: 1,
      created_ts: 1,
    })
    .toArray(function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
};

const findByUser = (userId, filters, cb) => {
  let filterClause = buildFilters(filters);
  filterClause.user_id = ObjectID(userId);

  //
  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.workspace)
    .find(filterClause)
    .project({
      _id: 1,
      taxonomy_id: 1,
      account_id: 1,
      user_id: 1,
      country: 1,
      code_iso_3: 1,
      code_iso_2: 1,
      trade: 1,
      years: 1,
      records: 1,
      data_bucket: 1,
      name: 1,
      flag_uri: 1,
      created_ts: 1,
      end_date: 1,
      start_date: 1,
      s3_path: 1
    })
    .toArray(function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
};

const findTemplates = (accountId, userId, tradeType, country, cb) => {
  let filterClause = {};
  if (accountId) filterClause.account_id = ObjectID(accountId);
  if (userId) filterClause.user_id = ObjectID(userId);
  if (tradeType) filterClause.trade = tradeType;
  if (country) filterClause.country = country;

  //

  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.workspace)
    .find(filterClause)
    .project({
      _id: 1,
      taxonomy_id: 1,
      name: 1,
    })
    .toArray(function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
};

const findByName = (accountId, userId, tradeType, countryCode, workspaceName, cb) => {
  let filterClause = {};
  if (accountId) filterClause.account_id = ObjectID(accountId);
  if (userId) filterClause.user_id = ObjectID(userId);
  if (tradeType) filterClause.trade = tradeType;
  if (countryCode) filterClause.code_iso_3 = countryCode;
  if (workspaceName) filterClause.name = workspaceName;

  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.workspace)
    .findOne(filterClause, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
};

const findShipmentRecordsIdentifierAggregation = (
  aggregationParams,
  dataBucket,
  cb
) => {
  if (
    aggregationParams.recordsSelections &&
    aggregationParams.recordsSelections.length > 0
  ) {
    let shipmentRecordsIds = aggregationParams.recordsSelections.map(
      (shipmentRecordsId) => ObjectID(shipmentRecordsId)
    );
    let aliasResult = {
      shipmentRecordsIdentifier: shipmentRecordsIds,
    };
    cb(null, aliasResult);
  } else {
    let clause =
      WorkspaceSchema.formulateShipmentRecordsIdentifierAggregationPipeline(
        aggregationParams
      );

    let aggregationExpression = [
      {
        $match: clause.match,
      },
      {
        $group: clause.group,
      },
      {
        $project: clause.project,
      },
    ];

    //

    MongoDbHandler.getDbInstance()
      .collection(dataBucket)
      .aggregate(
        aggregationExpression,
        {
          allowDiskUse: true,
        },
        function (err, cursor) {
          if (err) {
            cb(err);
          } else {
            cursor.toArray(function (err, documents) {
              if (err) {
                cb(err);
              } else {
                cb(null, documents ? documents[0] : null);
              }
            });
          }
        }
      );
  }
};

const findShipmentRecordsIdentifierAggregationEngine = async (
  aggregationParams,
  accountId,
  dataBucket,
  cb
) => {
  aggregationParams = await ElasticsearchDbQueryBuilderHelper.addAnalyzer(aggregationParams)
  if (aggregationParams.recordsSelections && aggregationParams.recordsSelections.length > 0) {

    let aliasResult = {
      shipmentRecordsIdentifier: aggregationParams.recordsSelections,
    };
    cb(null, aliasResult);
  } else {
    let clause =
      WorkspaceSchema.formulateShipmentRecordsIdentifierAggregationPipelineEngine(
        aggregationParams, accountId
      );

    // from: clause.offset,
    // size: clause.limit,
    let aggregationExpression = {
      from: 0, //clause.offset,
      size: recordsLimitPerWorkspace, //clause.limit,
      sort: clause.sort,
      query: clause.query,
      aggs: clause.aggregation,
    };


    console.log("AccountID ==============", accountId, "\nAggregationExpression ==============", JSON.stringify(aggregationExpression));


    try {
      var result = await ElasticsearchDbHandler.getDbInstance().search({
        index: dataBucket,
        track_total_hits: true,
        body: aggregationExpression,
      });
      let mappedResult = {};
      mappedResult[WorkspaceSchema.IDENTIFIER_SHIPMENT_RECORDS] = [];
      result.body.hits.hits.forEach((hit) => {
        mappedResult[WorkspaceSchema.IDENTIFIER_SHIPMENT_RECORDS].push(hit._id);
      });

      cb(null, mappedResult ? mappedResult : null);
    } catch (error) {
      console.log("Error ====================", error);
      cb(error);
    }
  }
};

const findShipmentRecordsPurchasableCountAggregation = (
  accountId,
  tradeType,
  country,
  shipmentRecordsIds,
  cb
) => {
  // shipmentRecordsIds = shipmentRecordsIds.map(shipmentRecordsId => ObjectID(shipmentRecordsId));

  let aggregationExpression = [
    {
      $match: {
        account_id: ObjectID(accountId),
        country: country,
        trade: tradeType,
      },
    },
    {
      $project: {
        _id: 0,
        purchase_records: {
          $filter: {
            input: shipmentRecordsIds,
            as: "record",
            cond: {
              $not: {
                $in: ["$$record", "$records"],
              },
            },
          },
        },
      },
    },
    {
      $addFields: {
        purchasable_records_count: {
          $size: "$purchase_records",
        },
      },
    },
    {
      $project: {
        purchasable_records_count: 1,
      },
    },
  ];
  //
  //
  //
  console.log("AccountID =======================", accountId, "\nshipmentRecordsIds =====================", shipmentRecordsIds.length);

  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.purchased_records_keeper)
    .aggregate(
      aggregationExpression,
      {
        allowDiskUse: true,
      },
      function (err, cursor) {
        if (err) {
          cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              cb(err);
            } else {
              //
              cb(null, documents ? documents[0] : null);
            }
          });
        }
      }
    );
};

const findShipmentRecordsPurchasableAggregation = (
  accountId,
  tradeType,
  country,
  shipmentRecordsIds,
  cb
) => {
  let aggregationExpression = [
    {
      $match: {
        account_id: ObjectID(accountId),
        country: country,
        trade: tradeType,
      },
    },
    {
      $project: {
        _id: 0,
        purchase_records: {
          $filter: {
            input: shipmentRecordsIds,
            as: "record",
            cond: {
              $not: {
                $in: ["$$record", "$records"],
              },
            },
          },
        },
      },
    },
    {
      $addFields: {
        purchasable_records_count: {
          $size: "$purchase_records",
        },
      },
    },
    {
      $project: {
        purchase_records: 1,
        purchasable_records_count: 1,
      },
    },
  ];
  //
  //
  //

  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.purchased_records_keeper)
    .aggregate(
      aggregationExpression,
      {
        allowDiskUse: true,
      },
      function (err, cursor) {
        if (err) {
          cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              cb(err);
            } else {
              //
              cb(null, documents ? documents[0] : null);
            }
          });
        }
      }
    );
};

const findShipmentRecordsCount = (dataBucket, cb) => {
  MongoDbHandler.getDbInstance()
    .collection(dataBucket)
    .estimatedDocumentCount({}, function (err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, result);
      }
    });
};

const findShipmentRecordsCountEngine = async (dataBucket, cb) => {
  var result = await ElasticsearchDbHandler.getDbInstance().count({
    index: dataBucket,
  });
  //cb(err);
  cb(null, result.body.count);
};

const getDatesByIndices = async (dataBucket, id, dateColumn) => {
  try {
    var result = await ElasticsearchDbHandler.getDbInstance().search({
      index: dataBucket,
      track_total_hits: true,
      body: {
        size: 0,
        aggs: {
          start_date: {
            min: {
              field: dateColumn,
            },
          },
          end_date: {
            max: {
              field: dateColumn,
            },
          },
        },
      },
    });
    const end_date =
      result.body.aggregations.end_date.value_as_string.split("T")[0];
    const start_date =
      result.body.aggregations.start_date.value_as_string.split("T")[0];
    MongoDbHandler.getDbInstance()
      .collection(MongoDbHandler.collections.workspace)
      .updateOne(
        {
          _id: id,
        },
        {
          $set: {
            start_date: start_date,
            end_date: end_date,
          },
        },
        function (err, result) {
          if (err) {
          } else {
          }
        }
      );
    return { start_date, end_date };
  } catch (err) {
    console.log(JSON.stringify(err));
    return null;
  }
};

const findAnalyticsSpecificationByUser = (userId, workspaceId, cb) => {
  let matchBlock = {};
  if (workspaceId) {
    matchBlock._id = ObjectID(workspaceId);
  }

  if (userId) {
    matchBlock.user_id = ObjectID(userId);
  }

  MongoDbHandler.getDbInstance()
    .collection(MongoDbHandler.collections.workspace)
    .aggregate(
      [
        {
          $match: matchBlock,
        },
        {
          $lookup: {
            from: "taxonomies",
            localField: "taxonomy_id",
            foreignField: "_id",
            as: "taxonomy_map",
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [
                {
                  $arrayElemAt: ["$taxonomy_map", 0],
                },
                "$$ROOT",
              ],
            },
          },
        },
        {
          $project: {
            _id: 0,
            taxonomy_id: 1,
            country: 1,
            trade: 1,
            code_iso_3: 1,
            code_iso_2: 1,
            flag_uri: 1,
            mode: 1,
            hs_code_digit_classification: 1,
            explore_fields: "$fields.explore",
            search_fields: "$fields.search",
            filter_fields: "$fields.filter",
            all_fields: "$fields.all",
            dataTypes_fields: "$fields.dataTypes",
            search_field_semantic: "$fields.search_semantic",
            filter_field_semantic: "$fields.filter_semantic",
            traders_aggregation: "$fields.traders_aggregation",
            records_aggregation: "$fields.records_aggregation",
            explore_aggregation: "$fields.explore_aggregation",
            statistics_aggregation: "$fields.statistics_aggregation",
            analytics_framework: "$fields.analytics_framework",
            data_bucket: 1,
            years: 1,
            totalRecords: "$records",
          },
        },
      ],
      {
        allowDiskUse: true,
      },
      function (err, cursor) {
        if (err) {
          cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              cb(err);
            } else {
              cb(null, documents ? documents[0] : null);
            }
          });
        }
      }
    );
};

const findAnalyticsShipmentRecordsAggregation = (
  aggregationParams,
  dataBucket,
  offset,
  limit,
  cb
) => {
  aggregationParams.offset = offset;
  aggregationParams.limit = limit;
  let clause =
    WorkspaceSchema.formulateShipmentRecordsAggregationPipeline(
      aggregationParams
    );

  let aggregationExpression = [
    {
      $match: clause.match,
    },
    {
      $facet: clause.facet,
    },
    {
      $project: clause.project,
    },
  ];

  //

  MongoDbHandler.getDbInstance()
    .collection(dataBucket)
    .aggregate(
      aggregationExpression,
      {
        allowDiskUse: true,
      },
      function (err, cursor) {
        if (err) {
          cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              cb(err);
            } else {
              cb(null, documents ? documents[0] : null);
            }
          });
        }
      }
    );
};

const findAnalyticsShipmentRecordsAggregationEngine = async (
  aggregationParams,
  dataBucket,
  offset,
  limit,
  cb
) => {
  aggregationParams.offset = offset;
  aggregationParams.limit = limit;
  aggregationParams = await ElasticsearchDbQueryBuilderHelper.addAnalyzer(aggregationParams)
  let clause =
    WorkspaceSchema.formulateShipmentRecordsAggregationPipelineEngine(
      aggregationParams
    );

  let aggregationExpression = {
    from: clause.offset,
    size: clause.limit,
    sort: clause.sort,
    query: clause.query,
    aggs: clause.aggregation,
  };
  //
  try {
    var result = await ElasticsearchDbHandler.getDbInstance().search({
      index: dataBucket,
      track_total_hits: true,
      body: aggregationExpression,
    });
    //cb(err);
    //
    //
    let mappedResult = {};
    mappedResult[WorkspaceSchema.RESULT_PORTION_TYPE_SUMMARY] = [
      {
        _id: null,
        count: result.body.hits.total.value,
      },
    ];
    mappedResult[WorkspaceSchema.RESULT_PORTION_TYPE_RECORDS] = [];
    result.body.hits.hits.forEach((hit) => {
      mappedResult[WorkspaceSchema.RESULT_PORTION_TYPE_RECORDS].push(
        hit._source
      );
    });
    for (const prop in result.body.aggregations) {
      if (result.body.aggregations.hasOwnProperty(prop)) {
        if (prop.indexOf("FILTER") === 0) {
          let mappingGroups = [];
          //let mappingGroupTermCount = 0;
          let groupExpression = aggregationParams.groupExpressions.filter(
            (expression) => expression.identifier == prop
          )[0];

          /*if (groupExpression.isSummary) {
            mappingGroupTermCount = result.body.aggregations[prop].buckets.length;
            mappedResult[prop.replace('FILTER', 'SUMMARY')] = mappingGroupTermCount;
          }*/

          if (groupExpression.isFilter) {
            if (result.body.aggregations[prop].buckets) {
              result.body.aggregations[prop].buckets.forEach((bucket) => {
                if (bucket.doc_count != null && bucket.doc_count != undefined) {
                  let groupedElement = {
                    _id:
                      bucket.key_as_string != null &&
                        bucket.key_as_string != undefined
                        ? bucket.key_as_string
                        : bucket.key,
                    count: bucket.doc_count,
                  };

                  if (
                    bucket.minRange != null &&
                    bucket.minRange != undefined &&
                    bucket.maxRange != null &&
                    bucket.maxRange != undefined
                  ) {
                    groupedElement.minRange = bucket.minRange.value;
                    groupedElement.maxRange = bucket.maxRange.value;
                  }

                  mappingGroups.push(groupedElement);
                }
              });
            }

            let propElement = result.body.aggregations[prop];
            if (
              propElement.min != null &&
              propElement.min != undefined &&
              propElement.max != null &&
              propElement.max != undefined
            ) {
              let groupedElement = {};
              if (propElement.meta != null && propElement.meta != undefined) {
                groupedElement = propElement.meta;
              }
              groupedElement._id = null;
              groupedElement.minRange = propElement.min;
              groupedElement.maxRange = propElement.max;
              mappingGroups.push(groupedElement);
            }

            mappedResult[prop] = mappingGroups;
          }
        }

        if (
          prop.indexOf("SUMMARY") === 0 &&
          result.body.aggregations[prop].value
        ) {
          mappedResult[prop] = result.body.aggregations[prop].value;
        }
      }
    }
    //
    cb(null, mappedResult ? mappedResult : null);
  } catch (err) {
    cb(err);
  }
};

const findShipmentRecordsDownloadAggregationEngine = async (dataBucket,offset,limit,payload,cb) => {
  let aggregationExpression = {
    from: offset,
    size: limit,
    query: {
      match_all: {},
    }
  }

  try {
    var result = await ElasticsearchDbHandler.getDbInstance().search({
      index: dataBucket,
      track_total_hits: true,
      body: aggregationExpression,
    });
    let mappedResult = [];

    result.body.hits.hits.forEach((hit) => {
      delete hit._source["id"];
      mappedResult.push(hit._source);
    });

    cb(null, mappedResult ? mappedResult : null, payload.country);
  } catch (err) {
    console.log(JSON.stringify(err));
    cb(err);
  }
}

const findAnalyticsShipmentRecordsDownloadAggregationEngine = async (aggregationParams,dataBucket,cb) => {
  aggregationParams = await ElasticsearchDbQueryBuilderHelper.addAnalyzer(aggregationParams)
  let clause =WorkspaceSchema.formulateShipmentRecordsAggregationPipelineEngine(aggregationParams);
  let aggregationExpression = {
    from: clause.offset,
    size: clause.limit,
    sort: clause.sort,
    query: clause.query,
  }
  
  try {
    var result = await ElasticsearchDbHandler.getDbInstance().search({
      index: dataBucket,
      track_total_hits: true,
      body: aggregationExpression,
    });
    

    let mappedResult = [];
    result.body.hits.hits.forEach((hit) => {
      delete hit._source["id"];
      mappedResult.push(hit._source);
    });

    cb(null, mappedResult ? mappedResult : null);
  } catch (err) {
    cb(err);
  }
}

const findAnalyticsShipmentStatisticsAggregation = (
  aggregationParams,
  dataBucket,
  offset,
  limit,
  cb
) => {
  aggregationParams.offset = offset;
  aggregationParams.limit = limit;
  let clause =
    WorkspaceSchema.formulateShipmentStatisticsAggregationPipeline(
      aggregationParams
    );

  let aggregationExpression = [
    {
      $match: clause.match,
    },
    {
      $facet: clause.facet,
    },
    {
      $project: clause.project,
    },
  ];

  //

  MongoDbHandler.getDbInstance()
    .collection(dataBucket)
    .aggregate(
      aggregationExpression,
      {
        allowDiskUse: true,
      },
      function (err, cursor) {
        if (err) {
          cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              cb(err);
            } else {
              cb(null, documents ? documents[0] : null);
            }
          });
        }
      }
    );
};

const findAnalyticsShipmentsTradersByPattern = (
  searchTerm,
  searchField,
  dataBucket,
  cb
) => {
  let regExpSearchTermGroups = "";
  const searchTermWords = searchTerm.split(" ");
  searchTermWords.forEach((searchElement) => {
    //regExpSearchTermGroups = regExpSearchTermGroups + `(?=.*\\b${searchElement}\\b)`; // APPLY WORD BOUNDARY
    regExpSearchTermGroups = regExpSearchTermGroups + `(?=.*${searchElement})`;
  });
  let regExpSearchTerm = new RegExp(regExpSearchTermGroups + ".+");

  let matchClause = {};
  matchClause[searchField] = {
    $regex: regExpSearchTerm, //searchTerm,
    $options: "i",
  };
  /*matchClause[searchField] = {
    $regex: searchTerm,
    $options: 'i'
  };*/

  let groupClause = {};
  groupClause._id = `$${searchField}`;

  /*let aggregationExpression = [{
    $match: matchClause
  }, {
    $group: groupClause
  }];*/

  let aggregationExpression = [
    {
      $match: matchClause,
    },
    {
      $group: groupClause,
    },
    {
      $skip: 0,
    },
    {
      $limit: 100,
    },
    {
      $project: {
        _id: `$_id`,
      },
    },
  ];


  MongoDbHandler.getDbInstance()
    .collection(dataBucket)
    .aggregate(
      aggregationExpression,
      {
        allowDiskUse: true,
      },
      function (err, cursor) {
        if (err) {
          cb(err);
        } else {
          cursor.toArray(function (err, documents) {
            if (err) {
              cb(err);
            } else {
              cb(null, documents ? documents : null);
            }
          });
        }
      }
    );
};

const findAnalyticsShipmentsTradersByPatternEngine = async (
  searchTerm,
  searchField,
  tradeMeta,
  dataBucket,
  cb
) => {
  let aggregationExpressionFuzzy = {
    size: 0,
    query: {
      bool: {
        must: [],
        should: [],
        filter: [],
      },
    },
    aggs: {},
  };
  var matchExpression = {
    match: {},
  };
  matchExpression.match[searchField] = {
    query: searchTerm,
    operator: "and",
    fuzziness: "auto",
  };
  aggregationExpressionFuzzy.query.bool.must.push({ ...matchExpression });
  var rangeQuery = {
    range: {},
  };
  rangeQuery.range[tradeMeta.dateField] = {
    gte: tradeMeta.startDate,
    lte: tradeMeta.endDate,
  };
  aggregationExpressionFuzzy.query.bool.must.push({ ...rangeQuery });
  aggregationExpressionFuzzy.aggs["searchText"] = {
    terms: {
      field: searchField + ".keyword",
      script: `doc['${searchField}.keyword'].value.trim().toLowerCase()`,
    },
  };

  let aggregationExpressionPrefix = {
    size: 0,
    query: {
      bool: {
        must: [],
        should: [],
        filter: [],
      },
    },
    aggs: {},
  };
  var matchPhraseExpression = {
    match_phrase_prefix: {},
  };
  matchPhraseExpression.match_phrase_prefix[searchField] = {
    query: searchTerm,
  };
  aggregationExpressionPrefix.query.bool.must.push({
    ...matchPhraseExpression,
  });
  aggregationExpressionPrefix.query.bool.must.push({ ...rangeQuery });
  aggregationExpressionPrefix.aggs["searchText"] = {
    terms: {
      field: searchField + ".keyword",
      script: `doc['${searchField}.keyword'].value.trim().toLowerCase()`,
    },
  };

  try {
    let resultPrefix = ElasticsearchDbHandler.dbClient.search({
      index: dataBucket,
      track_total_hits: true,
      body: aggregationExpressionPrefix,
    });
    let result = await ElasticsearchDbHandler.dbClient.search({
      index: dataBucket,
      track_total_hits: true,
      body: aggregationExpressionFuzzy,
    });
    var output = [];
    var dataSet = [];
    if (result.body.aggregations.hasOwnProperty("searchText")) {
      if (result.body.aggregations.searchText.hasOwnProperty("buckets")) {
        for (const prop of result.body.aggregations.searchText.buckets) {
          // console.log(prop);
          if (!dataSet.includes(prop.key.trim())) {
            output.push({ _id: prop.key.trim() });
            dataSet.push(prop.key.trim());
          }
        }
      }
    }
    resultPrefix = await resultPrefix;
    if (await resultPrefix.body.aggregations.hasOwnProperty("searchText")) {
      if (resultPrefix.body.aggregations.searchText.hasOwnProperty("buckets")) {
        for (const prop of resultPrefix.body.aggregations.searchText.buckets) {
          // console.log(prop);
          if (!dataSet.includes(prop.key.trim())) {
            output.push({ _id: prop.key.trim() });
            dataSet.push(prop.key.trim());
          }
        }
      }
    }

    cb(null, output ? output : null);
  } catch (err) {
    cb(err);
  }
}

async function findRecordsByID(workspaceId) {
  try {
    const aggregationExpression = [
      {
        $match: {
          _id: ObjectID(workspaceId)
        }
      },
      {
        $project: {
          _id: 0,
          records: 1
        }
      }
    ]

    const workspaceRecords = await MongoDbHandler.getDbInstance().collection(MongoDbHandler.collections.workspace)
      .aggregate(aggregationExpression).toArray();

    return workspaceRecords[0];
  } catch (error) {
    throw error;
  }
}

module.exports = {
  add,
  remove,
  addRecordsAggregationEngine,
  updateRecordMetrics,
  updatePurchaseRecordsKeeper,
  findByFilters,
  findByUser,
  findTemplates,
  findByName,
  findShipmentRecordsIdentifierAggregation,
  findShipmentRecordsIdentifierAggregationEngine,
  findShipmentRecordsPurchasableCountAggregation,
  findShipmentRecordsPurchasableAggregation,
  findShipmentRecordsCount,
  findShipmentRecordsCountEngine,
  findAnalyticsSpecificationByUser,
  findAnalyticsShipmentRecordsAggregation,
  findAnalyticsShipmentRecordsAggregationEngine,
  findShipmentRecordsDownloadAggregationEngine,
  findAnalyticsShipmentRecordsDownloadAggregationEngine,
  findAnalyticsShipmentStatisticsAggregation,
  findAnalyticsShipmentsTradersByPattern,
  findAnalyticsShipmentsTradersByPatternEngine,
  getDatesByIndices,
  findRecordsByID,
  fetchPurchasedRecords
}
