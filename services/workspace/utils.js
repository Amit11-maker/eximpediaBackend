// @ts-check
const { formulateAdxSummaryRecordsQueries, mapAdxRowsAndColumns } = require("../../models/tradeModel");
const { WORKSPACE_ID } = require("./constants");
const AccountModel = require("../../models/accountModel");
const UserModel = require("../../models/userModel");
const { getADXAccessToken } = require("../../db/accessToken");
const { query: adxQueryExecuter } = require("../../db/adxDbApi");

/**
 * update purchase points by role
 * @param {import("express").Request & { user: { account_id: any; user_id: any; role: any; } }} req
 * @param {-1 | 1} consumeType
 * @param {any} purchasableRecords
 * @param {(error: any, value?: number | undefined ) => void} cb
 */
function updatePurchasePointsByRole(req, consumeType, purchasableRecords, cb) {
    let accountId = req.user.account_id;
    let userId = req.user.user_id;
    let role = req.user.role;
    if (purchasableRecords) {
        AccountModel.findPurchasePoints(accountId, (error, purchasePoints) => {
            if (error) {
                cb(error);
            } else {
                UserModel.findById(userId, null, (error, user) => {
                    if (error) {
                        cb(error);
                    } else {
                        if (role == "ADMINISTRATOR" || (user?.available_credits && user?.available_credits == purchasePoints)) {
                            AccountModel.updatePurchasePoints(accountId, consumeType, purchasableRecords, async (error) => {
                                if (error) {
                                    cb(error);
                                } else {
                                    // await addPointDeductionNotification(
                                    //     req.body,
                                    //     purchasableRecords
                                    // );
                                    UserModel.findByAccount(accountId, null, (error, users) => {
                                        if (error) {
                                            cb(error);
                                        } else {
                                            let modifiedCount = 0;
                                            users.forEach((user) => {
                                                if (user.available_credits == purchasePoints) {
                                                    UserModel.updateUserPurchasePoints(user._id, consumeType, purchasableRecords, (error) => {
                                                        if (error) {
                                                            cb(error);
                                                        } else {
                                                            modifiedCount++;
                                                        }
                                                    }
                                                    );
                                                }
                                            });
                                            cb(null, modifiedCount);
                                        }
                                    });
                                }
                            }
                            );
                        } else {
                            UserModel.updateUserPurchasePoints(userId, consumeType, purchasableRecords, (error, result) => {
                                if (error) {
                                    cb(error);
                                } else {
                                    cb(null, result);
                                }
                            }
                            );
                        }
                    }
                });
            }
        });
    }
}

/**
 * returning indices from cognitive search, optimized function.
 * @param {string} recordDataQuery
 * @param {any} limit
 * @param {number} offset
 * @param {*} payload
 */
async function RetrieveWorkspaceRecords(recordDataQuery, limit, offset, payload) {
    try {
        recordDataQuery += ` | serialize index = row_number() | where index between (${offset + 1} .. ${limit + offset})`

        // Adding sorting
        recordDataQuery += " | order by " + payload["sortTerms"][0]["sortField"] + " " + payload["sortTerms"][0]["sortType"]

        let accessToken = await getADXAccessToken();
        let recordDataQueryResponse = await adxQueryExecuter(recordDataQuery, accessToken)
        recordDataQueryResponse = JSON.parse(recordDataQueryResponse);

        let recordDataQueryResult = mapAdxRowsAndColumns(recordDataQueryResponse.Tables[0].Rows, recordDataQueryResponse.Tables[0].Columns);

        let finalResult = {
            "data": recordDataQueryResult,
        }

        return finalResult;
    } catch (error) {
        throw error
    }
}

/**
 * @param {any} worskpaceRecordQuery
 * @param {string} recordDataQuery
 * @param {any} payload
 */
async function SummarizeWorkspaceRecords(worskpaceRecordQuery, recordDataQuery, payload) {
    try {
        let adxToken = await getADXAccessToken()
        let summaryDataQuery = "let recordIds = " + worskpaceRecordQuery + recordDataQuery +
            " | summarize SUMMARY_RECORDS = count()" + formulateAdxSummaryRecordsQueries(payload);

        let summaryResponse = await adxQueryExecuter(summaryDataQuery, adxToken)
        summaryResponse = JSON.parse(summaryResponse)
        let summaryResult = mapAdxRowsAndColumns(summaryResponse.Tables[0].Rows, summaryResponse.Tables[0].Columns)
        return summaryResult[0]
    } catch (error) {
        throw error
    }
}

/**
 * @param {string} recordDataQuery
 * @param {{groupExpressions: any[];}} payload
 * @param {any} worskpaceRecordQuery
 */
async function RetrieveAdxDataFilters(worskpaceRecordQuery, recordDataQuery, payload) {
    try {
        let adxToken = await getADXAccessToken();

        let priceObject = payload.groupExpressions.find(
            (o) => o.identifier === "FILTER_CURRENCY_PRICE_USD"
        );

        let hscode = "";
        let country = "";
        let port = "";
        let foreignPorts = "";
        let months = "";
        let quantity = "";
        // let duty = "";
        // let currencyInr = "";
        // let currencyUsd = "";

        let project = " | project " + priceObject.fieldTerm + ", "

        if (payload.groupExpressions) {
            for (let groupExpression of payload.groupExpressions) {
                if (groupExpression.identifier == "FILTER_HS_CODE") {
                    project += groupExpression.fieldTerm + ", ";
                    hscode += "filteredData | summarize totalAmount = sum(" + priceObject["fieldTerm"] + ") , count = count() by FILTER_HS_CODE = " + groupExpression.fieldTerm + ";";
                }
                if (groupExpression.identifier == "FILTER_PORT") {
                    project += groupExpression.fieldTerm + ", ";
                    port = 'filteredData| summarize totalAmount = sum(' + priceObject["fieldTerm"] + ') , count = count() by FILTER_PORT = ' + groupExpression.fieldTerm + ';';
                }
                if (groupExpression.identifier == "FILTER_COUNTRY") {
                    project += groupExpression.fieldTerm + ", ";
                    country = 'filteredData | summarize count = count(), totalAmount = sum(' + priceObject["fieldTerm"] + ') by FILTER_COUNTRY = ' + groupExpression.fieldTerm + ';';
                }
                if (groupExpression.identifier == "FILTER_FOREIGN_PORT") {
                    project += groupExpression.fieldTerm + ", ";
                    foreignPorts = 'filteredData | summarize count = count(), totalAmount =sum(' + priceObject["fieldTerm"] + ') by FILTER_FOREIGN_PORT = ' + groupExpression.fieldTerm + ';';
                }
                if (groupExpression.identifier == "FILTER_MONTH") {
                    project += groupExpression.fieldTerm + ", ";
                    months = 'filteredData | extend FILTER_MONTH = format_datetime(' + groupExpression.fieldTerm + ', "yyyy-MM") | summarize count = count(), totalAmount = sum(' + priceObject["fieldTerm"] + ') by FILTER_MONTH;';
                }

                if (groupExpression.identifier == "FILTER_UNIT_QUANTITY") {
                    project += groupExpression.fieldTermPrimary + ", " + groupExpression.fieldTermSecondary + ", ";
                    quantity = `filteredData | summarize minRange = min(${groupExpression.fieldTermSecondary}), maxRange = max(${groupExpression.fieldTermSecondary}) by FILTER_UNIT_QUANTITY = ${groupExpression.fieldTermPrimary};`
                }

                // if (groupExpression.identifier == "FILTER_CURRENCY_PRICE_INR") {
                //   currencyInr = " filteredData | " + " summarize minRange = min(" + priceObject["fieldTerm"] + "), maxRange = max(" + groupExpression["fieldTerm"] + "), totalAmount = sum(" + priceObject["fieldTerm"] + ") by " + " FILTER_CURRENCY_PRICE_INR = " + priceObject["fieldTerm"] + ";";
                // }

                // if (groupExpression.identifier == "FILTER_CURRENCY_PRICE_USD") {
                //   currencyUsd = " filteredData | " + " summarize minRange = min(" + priceObject["fieldTerm"] + "), maxRange = max(" + groupExpression["fieldTerm"] + "), totalAmount = sum(" + priceObject["fieldTerm"] + ") by " + " FILTER_CURRENCY_PRICE_USD = " + priceObject["fieldTerm"] + ";";
                // }

                // if (groupExpression.identifier == "FILTER_DUTY") {
                //   duty = " filteredData | " + " summarize minRange = min(" + priceObject["fieldTerm"] + "), maxRange = max(" + groupExpression["fieldTerm"] + "), totalAmount = sum(" + priceObject["fieldTerm"] + ") by " + " FILTER_DUTY = " + priceObject["fieldTerm"] + ";";
                // }
                else {
                    continue;
                }
            }
        }

        recordDataQuery += (project.substring(0, project.length - 2));

        let clause = ` set query_results_cache_max_age = time(15m); 
        let recordIds = ${worskpaceRecordQuery}
        let filteredData = materialize(${recordDataQuery});`;

        if (payload.groupExpressions) {
            for (let groupExpression of payload.groupExpressions) {
                if (groupExpression.identifier == "FILTER_HS_CODE") {
                    clause += `let hscode = ${hscode}`
                }
                if (groupExpression.identifier == "FILTER_COUNTRY") {
                    clause += `let country = ${country}`
                }
                if (groupExpression.identifier == "FILTER_PORT") {
                    clause += `let port = ${port}`
                }
                if (groupExpression.identifier == "FILTER_FOREIGN_PORT") {
                    clause += `let foreignPorts = ${foreignPorts}`
                }
                if (groupExpression.identifier == "FILTER_MONTH") {
                    clause += `let months = ${months}`
                }
                if (groupExpression.identifier == "FILTER_UNIT_QUANTITY") {
                    clause += `let quantity = ${quantity}`
                }
            }
        }

        // union according to the specified columns
        clause += `union` + ` `
        let identifiers = [];
        for (let groupExpression of payload.groupExpressions) {
            if (groupExpression.identifier == "FILTER_COUNTRY") {
                identifiers.push('country');
            }
            if (groupExpression.identifier == "FILTER_PORT") {
                identifiers.push('port');
            }
            if (groupExpression.identifier == "FILTER_FOREIGN_PORT") {
                identifiers.push('foreignPorts');
            }
            if (groupExpression.identifier == "FILTER_MONTH") {
                identifiers.push('months');
            }
            if (groupExpression.identifier == "FILTER_UNIT_QUANTITY") {
                identifiers.push('quantity');
            }
            if (groupExpression.identifier == "FILTER_HS_CODE") {
                identifiers.push('hscode');
            }
        }

        // Join the identifiers with commas and add to the clause
        clause += identifiers.join(',');

        let results = await adxQueryExecuter(clause, adxToken);
        results = JSON.parse(results);

        let mappedResults = mapMaterializedAdxRowsAndColumns(results.Tables[0].Columns, results.Tables[0].Rows)

        return {
            "filter": mappedResults
        }
    } catch (error) {
        throw error;
    }
}

/**
 * @param {any[]} cols
 * @param {any[]} rows
 */
function mapMaterializedAdxRowsAndColumns(cols, rows) {
    let columnsObj = {
        FILTER_COUNTRY: [],
        FILTER_FOREIGN_PORT: [],
        FILTER_PORT: [],
        FILTER_MONTH: [],
        FILTER_HS_CODE: [],
        FILTER_UNIT_QUANTITY: [],
    }

    let countIndex = 0;
    let amountIndex = 0;
    let minRange = 0;
    let maxRange = 0;

    cols.map((col, i) => {
        if (col.ColumnName == 'count') {
            countIndex = i;
        }
        if (col.ColumnName == 'totalAmount') {
            amountIndex = i;
        }
        if (col.ColumnName == 'minRange') {
            minRange = i;
        }
        if (col.ColumnName == 'maxRange') {
            maxRange = i;
        }
    });

    cols?.map((col, i) => {
        rows?.forEach((row) => {
            if (!(col.ColumnName == 'count' || col.ColumnName == 'totalAmount')) {
                if (row[i] != '') {
                    let obj = {
                        _id: row[i],
                        count: row[countIndex],
                        totalSum: row[amountIndex]
                    }
                    if (row?.[minRange]) {
                        obj.minRange = row[minRange]
                    }
                    if (row?.[maxRange]) {
                        obj.maxRange = row[maxRange]
                    }
                    columnsObj?.[col?.ColumnName]?.push(obj)
                }
                // }
            }
        })
    });

    return columnsObj;
}

const workspaceUtils = {
    updatePurchasePointsByRoleAdx: updatePurchasePointsByRole,
    RetrieveWorkspaceRecordsAdx: RetrieveWorkspaceRecords,
    SummarizeWorkspaceRecordsAdx: SummarizeWorkspaceRecords,
    RetrieveAdxDataFiltersAdx: RetrieveAdxDataFilters
}

module.exports = workspaceUtils