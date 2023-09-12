// @ts-check
const kustoClient = require("../../db/adxDbHandler");
const { formulateFinalAdxRawSearchRecordsQueriesWithoutToLongSyntax, formulateAdxSummaryRecordsQueries, mapAdxRowsAndColumns } = require("../../models/tradeModel");
const getLoggerInstance = require("../logger/Logger");
const { WORKSPACE_ID } = require("./constants");
const AccountModel = require("../../models/accountModel");
const UserModel = require("../../models/userModel");

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

const workspaceUtils = {
    findShipmentRecordsIdentifierAdx: findShipmentRecordsIdentifier,
    updatePurchasePointsByRoleAdx: updatePurchasePointsByRole
}

module.exports = workspaceUtils