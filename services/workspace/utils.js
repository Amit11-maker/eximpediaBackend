// @ts-check
const kustoClient = require("../../db/adxDbHandler");
const { formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax, formulateAdxSummaryRecordsQueries, mapAdxRowsAndColumns, getADXFilterResults } = require("../../models/tradeModel");
const getLoggerInstance = require("../logger/Logger");
const { WORKSPACE_ID } = require("./constants");
const AccountModel = require("../../models/accountModel");
const UserModel = require("../../models/userModel");
const { query: executeAdxQuery } = require("../../db/adxDbApi");
const { getADXAccessToken } = require("../../db/accessToken");

/** returning indices from cognitive search, optimized function. */
async function findShipmentRecordsIdentifier(payload) {
    try {
        let recordDataQuery = formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax(payload)
        console.log(recordDataQuery);
        recordDataQuery += " | project " + WORKSPACE_ID

        let recordDataQueryResponse = await kustoClient.execute(String(process.env.AdxDbName), recordDataQuery)
        let recordDataQueryResult = mapAdxRowsAndColumns(recordDataQueryResponse["primaryResults"][0]["_rows"], recordDataQueryResponse["primaryResults"][0]["columns"]);

        return recordDataQueryResult?.map(result => result.WORKSPACE_ID);
    } catch (error) {
        const { errorMessage } = getLoggerInstance(error, __filename)
        console.log(errorMessage)
        throw error
    }
}

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
        let recordDataQueryResponse = await executeAdxQuery(recordDataQuery, accessToken)
        recordDataQueryResponse = JSON.parse(recordDataQueryResponse);

        let recordDataQueryResult = mapAdxRowsAndColumns(recordDataQueryResponse.Tables[0].Rows, recordDataQueryResponse.Tables[0].Columns);

        let finalResult = {
            "data": recordDataQueryResult,
        }

        return finalResult;
    } catch (error) {
        const { errorMessage } = getLoggerInstance(error, __filename)
        console.log(errorMessage)
        throw error
    }
}

async function SummarizeWorkspaceRecords(recordDataQuery, payload) {
    try {
        let adxToken = await getADXAccessToken()
        let summaryDataQuery = recordDataQuery + " | summarize SUMMARY_RECORDS = count()" + formulateAdxSummaryRecordsQueries(payload);

        let summaryResponse = await executeAdxQuery(summaryDataQuery, adxToken)
        summaryResponse = JSON.parse(summaryResponse)
        let summaryResult = mapAdxRowsAndColumns(summaryResponse.Tables[0].Rows, summaryResponse.Tables[0].Columns)
        return summaryResult[0]
    } catch (error) {
        const { errorMessage } = getLoggerInstance(error, __filename)
        throw error
    }
}




/**
 * @param {string} recordDataQuery
 * @param {{ groupExpressions: any[]; }} payload
 */
async function RetrieveAdxDataFilters(recordDataQuery, payload) {
    try {
        let accessToken = await getADXAccessToken();
        console.log(new Date().getSeconds())

        let priceObject = payload.groupExpressions.find(
            (o) => o.identifier === "FILTER_CURRENCY_PRICE_USD"
        );
        let filtersResolved = {}

        /** @type {{identifier: string, filter: object}[]} */
        const filtersArr = []
        if (payload.groupExpressions) {
            for (let groupExpression of payload.groupExpressions) {
                let filterQuery = "";
                // filterQuery += "let identifier = '" + groupExpression.identifier + "'";
                let oldKey = groupExpression["fieldTerm"];
                if (groupExpression.identifier == 'FILTER_UNIT_QUANTITY') {
                    oldKey = groupExpression["fieldTermPrimary"];
                    filterQuery = recordDataQuery + " | summarize Count = count(), minRange = min(" + groupExpression["fieldTermSecondary"] + "), maxRange = max(" + groupExpression["fieldTermSecondary"] + ") , TotalAmount = sum(" + priceObject["fieldTerm"] + ") by " + groupExpression["fieldTermPrimary"];
                }
                else if (groupExpression.identifier == 'FILTER_MONTH') {
                    filterQuery = recordDataQuery + " | extend MonthYear = format_datetime(" + groupExpression["fieldTerm"] + ", 'yyyy-MM') | summarize Count = count(), TotalAmount = sum(" + priceObject["fieldTerm"] + ") by MonthYear";
                }
                else if (groupExpression.identifier == "FILTER_CURRENCY_PRICE_INR" || groupExpression.identifier == "FILTER_CURRENCY_PRICE_USD" || groupExpression.identifier == "FILTER_DUTY") {
                    filterQuery = recordDataQuery + " | extend Currency = '" + groupExpression["fieldTerm"].split("_")[1] + "' | summarize minRange = min(" + groupExpression["fieldTerm"] + "), maxRange = max(" + groupExpression["fieldTerm"] + "), TotalAmount = sum(" + groupExpression["fieldTerm"] + ")";
                }
                else if (groupExpression.identifier.includes("FILTER")) {
                    filterQuery = recordDataQuery + " | summarize Count = count() , TotalAmount = sum(" + priceObject["fieldTerm"] + ") by " + groupExpression["fieldTerm"];
                }
                else {
                    continue;
                }

                // push filters into filtersArray without resolving them with their identifier!
                filtersArr.push({ filter: executeAdxQuery(filterQuery, accessToken), identifier: groupExpression.identifier })
            };

            // resolve all the filters.
            const filteredResultsResolved = await Promise.all(filtersArr.map((filter) => filter?.filter));

            // loop over group expressions and map the filters.
            for (let expression of payload.groupExpressions) {
                // loop over filters array to match identifier with groupExpression
                let index = 0;
                for (let filter of filtersArr) {
                    // if identifier matches the we will break the loop so I will not iterate till the end of the filtersArray
                    if (filter?.identifier === expression?.identifier) {
                        getADXFilterResults(expression, filteredResultsResolved[index], filtersResolved)
                        index++;
                        break;
                    } else {
                        index++;
                    }
                }
            }
        }

        return filtersResolved;
    } catch (error) {
        console.log(error);
        //For testing
    }
}

const workspaceUtils = {
    findShipmentRecordsIdentifierAdx: findShipmentRecordsIdentifier,
    updatePurchasePointsByRoleAdx: updatePurchasePointsByRole,
    RetrieveWorkspaceRecordsAdx: RetrieveWorkspaceRecords,
    SummarizeWorkspaceRecordsAdx: SummarizeWorkspaceRecords,
    RetrieveAdxDataFiltersAdx: RetrieveAdxDataFilters
}

module.exports = workspaceUtils