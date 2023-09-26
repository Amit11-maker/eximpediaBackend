// @ts-check
const MongoDbHandler = require("../../db/mongoDbHandler")

/**
 * @class MongodbQueryService
 * @description Mongodb class to handle all mongodb related operations
 */
class MongodbQueryService {
    constructor() {
        /**
         * @private
         */
        this.mongodb = MongoDbHandler.getDbInstance();
    }

    /**
     * @param {string} collectionName
     * @param {{}} filterClause
     * @param {{}} projectionClause
     * @returns {Promise<any[]>}
     */
    async findAllWithProjection(collectionName, filterClause, projectionClause) {
        const result = await this.mongodb.collection(collectionName).find(filterClause, { projection: projectionClause }).toArray();
        return result;
    }
}

module.exports = MongodbQueryService;