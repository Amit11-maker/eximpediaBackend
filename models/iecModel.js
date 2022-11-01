const TAG = "iecModel" ;
const MongoDbHandler = require("../db/mongoDbHandler");

const fetchIECDetails = async (iecNumber) => {
    try {
      let filterClause = {"IEC" : iecNumber}
      const iecData = await MongoDbHandler.getDbInstance()
                            .collection(MongoDbHandler.collections.iecData)
                            .find(filterClause).toArray() ;
      return iecData ;
    }
    catch (error) {
      throw error ;
    }
}

module.exports = {
    fetchIECDetails
}