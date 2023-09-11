// @ts-check

const { ObjectId } = require("mongodb");
const MongoDbHandler = require("../../db/mongoDbHandler");
const getLoggerInstance = require("../logger/Logger");

const WORKSPACE_ID = "WORKSPACE_ID"

/**
 * Class to keep records of purchased records
 */
class WorkspaceRecordKeeper {
    constructor() {
        // Array to store records
        this.records = [];

        /** @private */
        this.recordIdentifier = WORKSPACE_ID;

        /** adx purchased records keeper schema */
        this.adxPurchasedRecordKeeperSchema = {
            account_id: "",
            code_iso_3: "",
            taxonomy_id: "",
            trade: "",
            code_iso_2: "",
            country: "",
            flag_uri: "",
            records: [""],
        }
    }

    /**
     * creating purchased records keeper schema and replacing null | undefined values
     * @param {typeof this.adxPurchasedRecordKeeperSchema} payload
     * @param {string[]} recordsArr
     * @private
    */
    createAdxPurchasedRecordsKeeperSchema(payload, recordsArr) {
        this.adxPurchasedRecordKeeperSchema.account_id = payload.accountId ?? "";
        this.adxPurchasedRecordKeeperSchema.code_iso_3 = payload.countryCodeISO3 ?? "";
        this.adxPurchasedRecordKeeperSchema.taxonomy_id = payload.taxonomyId ?? "";
        this.adxPurchasedRecordKeeperSchema.trade = payload.tradeType ?? "";
        this.adxPurchasedRecordKeeperSchema.code_iso_2 = payload.countryCodeISO2 ?? "";
        this.adxPurchasedRecordKeeperSchema.country = payload.country ?? "";
        this.adxPurchasedRecordKeeperSchema.flag_uri = payload.flagUri ?? "";
        this.adxPurchasedRecordKeeperSchema.records = recordsArr.map(record => record[WORKSPACE_ID]) ?? [];
    };

    /**
     * insert record in purchased records keeper collection
     * @param {*} payload 
     * @param {string[]} records 
     * @returns {Promise<import("mongodb").InsertOneResult<import("mongodb").Document> | Promise<import("mongodb").UpdateResult> | null>}
     */
    async insertRecord(payload, records) {
        try {
            const existingRecordKeeper = await this.isPurchasedRecordExists({ country: payload.country, accountID: payload.accountId, tradeType: payload.tradeType })
            if (existingRecordKeeper) {
                // insert record in purchased records keeper collection
                const recordsToInsert = await this.filterExistingRecords(records, existingRecordKeeper.records)

                // map records to insert
                this.createAdxPurchasedRecordsKeeperSchema(payload, recordsToInsert);
                const { records: omitRecords, ...otherDetails } = this.adxPurchasedRecordKeeperSchema
                // if record keeper exists then update records array
                const response = await MongoDbHandler
                    .getDbInstance()
                    .collection(MongoDbHandler.collections.purchased_records_keeper_adx)
                    .updateOne({ _id: new ObjectId(existingRecordKeeper._id) }, { $set: { ...otherDetails }, $push: { records: { $each: this.adxPurchasedRecordKeeperSchema.records } } })

                return response;
            } else {
                this.createAdxPurchasedRecordsKeeperSchema(payload, records);
                // insert records
                const response = await MongoDbHandler
                    .getDbInstance()
                    .collection(MongoDbHandler.collections.purchased_records_keeper_adx)
                    .insertOne(this.adxPurchasedRecordKeeperSchema);

                return response;
            }
        } catch (error) {
            getLoggerInstance(error, __filename)
            throw error;
        }
    }

    /**
     * filtering existing records from records array
     * @param {*[]} records 
     * @param {string[]} existingRecords 
     * @private
     */
    async filterExistingRecords(records, existingRecords) {
        try {
            let filteredRecords = [];

            records.forEach(record => {
                // check if record id is not in existing records id array
                for (let id of existingRecords) {
                    // if record id is not in existing records id array then push it to filtered records array
                    if (id !== record[WORKSPACE_ID]) {
                        filteredRecords.push(record)
                        break;
                    }
                }
            })

            return filteredRecords;
        } catch (error) {
            getLoggerInstance(error, __filename)
            throw error;
        }
    }

    /**
     * find existing records based on country, account id and trade type
     * @param {string} country 
     * @param {string} accountID 
     * @param {string} tradeType
     * @private
     */
    async findExistingRecords(country, accountID, tradeType) {
        try {
            const response = await MongoDbHandler
                .getDbInstance()
                .collection(MongoDbHandler.collections.purchased_records_keeper_adx)
                .aggregate([
                    {
                        // match records based on country, account id and trade type
                        $match: {
                            account_id: accountID,
                            country: country,
                            trade: tradeType
                        }
                    },
                    {
                        // project records
                        $project: {
                            records: 1,
                            _id: 0
                        }
                    }
                ])

            return response;
        } catch (error) {
            getLoggerInstance(error, __filename)
            throw error;
        }
    }

    /**
     * check whether purchased record exists or not based on country, account id and trade type
     * @param {{country: string, accountID: string, tradeType: "IMPORT" | "EXPORT"}} param 
     * @returns 
     */
    async isPurchasedRecordExists({ country, accountID, tradeType }) {
        try {
            const response = await MongoDbHandler
                .getDbInstance()
                .collection(MongoDbHandler.collections.purchased_records_keeper_adx)
                .findOne({ country, account_id: accountID, trade: tradeType })

            return response;
        } catch (error) {
            getLoggerInstance(error, __filename)
            throw error;
        }
    }

}

module.exports = WorkspaceRecordKeeper
