// @ts-check

const WorkspaceModel = require("../../models/workspaceModel");
const { logger } = require("../../config/logger");
const WorkspaceSchema = require("../../schemas/workspaceSchema");
const { RetrieveWorkspaceRecordsAdx, SummarizeWorkspaceRecordsAdx, RetrieveAdxDataFiltersAdx } = require("./utils");
const { ObjectId } = require("mongodb");
const getLoggerInstance = require("../logger/Logger");
const sendResponse = require("../SendResponse.util");
const MongoDbHandler = require("../../db/mongoDbHandler");
const { RetrieveAdxDataFilters } = require("../../models/tradeModel");

/**
 * 
 * @param {import("express").Request & {user: *}} req 
 * @param {import("express").Response} res 
 */
const fetchAnalyticsShipmentsRecords = (req, res) => {
  let payload = req.body;

  const dataBucket = "SHIPMENTS"

  let workspaceTotalRecords = payload.workspaceTotalRecords
    ? payload.workspaceTotalRecords
    : null;

  let pageKey = payload.draw && payload.draw != 0 ? payload.draw : null;
  let offset = null;
  let limit = null;

  //Datatable JS Mode
  if (pageKey != null) {
    offset = payload.start != null ? payload.start : 0;
    limit = payload.length != null ? payload.length : 10;
  } else {
    offset = payload.offset != null ? payload.offset : 0;
    limit = payload.limit != null ? payload.limit : 10;
  }

  /**
   * {
    "recordsTotal": 620,
    "recordsFiltered": 620,
    "summary": {
        "SUMMARY_RECORDS": 620,
        "SUMMARY_SHIPMENTS": 280,
        "SUMMARY_HS_CODE": 1,
        "SUMMARY_BUYERS": 143,
        "SUMMARY_SELLERS": 166
    },
    "draw": 1,
    "data": []
}
   */
  WorkspaceModel.findAnalyticsShipmentRecordsAggregationEngine(payload, dataBucket, offset, limit, (error, shipmentDataPack) => {
    if (error) {
      logger.log(
        req.user.user_id,
        ` WORKSPACE CONTROLLER == ${JSON.stringify(error)}`
      );
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      let bundle = {};

      if (!shipmentDataPack) {
        bundle.recordsTotal = 0;
        bundle.recordsFiltered = 0;
        bundle.error = "Unrecognised Shipments Response"; //Show if to be interpreted as error on client-side
      } else {
        let recordsTotal =
          shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_SUMMARY]
            .length > 0
            ? shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_SUMMARY][0]
              .count
            : 0;
        bundle.recordsTotal =
          workspaceTotalRecords != null
            ? workspaceTotalRecords
            : recordsTotal;
        bundle.recordsFiltered = recordsTotal;

        bundle.summary = {};

        for (const prop in shipmentDataPack) {
          if (shipmentDataPack.hasOwnProperty(prop)) {
            if (prop.indexOf("SUMMARY") === 0) {
              if (prop === "SUMMARY_RECORDS") {
                bundle.summary[prop] = recordsTotal;
              } else {
                bundle.summary[prop] = shipmentDataPack[prop];
              }
            }
          }
        }
      }

      if (pageKey) {
        bundle.draw = pageKey;
      }

      bundle.data =
        shipmentDataPack[WorkspaceSchema.RESULT_PORTION_TYPE_RECORDS];
      res.status(200).json(bundle);

    }
  }
  );
};


/**
 * service to fetch the analytics shipments records
 */
class FetchAnalyseWorkspaceRecordsAndSend {

  /**
   * function to fetch the analytics shipments records
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async fetchRecords(req, res) {
    try {
      // let workspaceId = req.params.workspaceId ?? null;
      let workspaceId = new ObjectId('65153764f262dd104446df82');

      // if workspace id is not present then throw an error
      if (!workspaceId) {
        throw new Error("Workspace Id is required");
      }

      let payload = req.body;

      let workspaceTotalRecords = payload.workspaceTotalRecords ? payload.workspaceTotalRecords : null;

      let pageKey = payload.draw && payload.draw != 0 ? payload.draw : null;
      let offset = null;
      let limit = null;

      //Data Table JS Mode
      if (pageKey != null) {
        offset = payload.start != null ? payload.start : 0;
        limit = payload.length != null ? payload.length : 10;
      } else {
        offset = payload.offset != null ? payload.offset : 0;
        limit = payload.limit != null ? payload.limit : 10;
      }

      let bundle = {}

      // workspace queries
      let workspaceQueries = await this.fetchWorkspaceQueries(workspaceId);

      let totalRecords = 0;

      for (let query of workspaceQueries) {

        // change offset according to the query
        if (offset > query.query_records) {
          offset = offset - query.query_records; // 50 - 30 = 20
          continue;
        }

        // if limit is 0 then break the loop
        if (limit == 0) {
          break;
        }

        let { data } = await RetrieveWorkspaceRecordsAdx(query.query, limit, offset, req.body)

        if (bundle.data) {
          bundle.data.push(...data)
        } else {
          bundle.data = data
        }

        // update the  limit
        limit = limit - data.length

        totalRecords = totalRecords + data.length
      }

      bundle.recordsTotal = totalRecords;
      bundle.recordsFiltered = totalRecords;
      bundle.draw = pageKey;
      bundle.summary = await this.summarizeRecords(workspaceQueries, req);

      return sendResponse(res, 200, bundle);

    } catch (error) {
      const { errorMessage } = getLoggerInstance(error, __filename);
      return sendResponse(res, 500, { message: errorMessage });
    }
  }

  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async fetchFilters(req, res) {
    try {
      // let workspaceId = req.params.workspaceId ?? null;
      let workspaceId = new ObjectId('65153764f262dd104446df82');

      let workspaceQueries = await this.fetchWorkspaceQueries(workspaceId);

      let filters = []
      let mergedFilters = { filter: {} };

      for (let query of workspaceQueries) {
        let filter = RetrieveAdxDataFiltersAdx(query.query, req.body)
        filters.push(filter)
      }

      let results = await Promise.all(filters);

      for (const filter of results) {
        if (filter) {
          for (let key of Object.keys(filter)) {
            if (mergedFilters.filter[key]) {
              if (JSON.stringify(filter[key]) === JSON.stringify(mergedFilters.filter[key])) continue;
              mergedFilters.filter[key] = [...mergedFilters.filter[key], ...filter[key]]
            } else {
              mergedFilters.filter[key] = filter[key]
            }
          }
        }
      }

      return sendResponse(res, 200, mergedFilters);
    } catch (error) {
      const { errorMessage } = getLoggerInstance(error, __filename);
      return sendResponse(res, 500, { message: errorMessage });
    }
  }

  /**
   * find workspace queries
   * @param {string} workspaceId 
   * @returns {Promise<{
   *  query: string,
   *  query_records: number
   * }[]>}
   * @private
   */
  async fetchWorkspaceQueries(workspaceId) {
    try {
      let workspaceQueries = await MongoDbHandler
        .getDbInstance()
        .collection(MongoDbHandler.collections.workspace)
        .findOne({ _id: new ObjectId(workspaceId) }, { projection: { workspace_queries: 1 } });

      return workspaceQueries?.workspace_queries;
    } catch (error) {
      const { errorMessage } = getLoggerInstance(error, __filename);
      throw errorMessage;
    }
  }

  /**
   * @private
   * @param {{query: string, query_records: number}[]} workspaceQueries 
   * @param {import("express").Request} req 
   */
  async summarizeRecords(workspaceQueries, req) {
    let summaries = []
    for (let query of workspaceQueries) {
      let summary = SummarizeWorkspaceRecordsAdx(query.query, req.body)
      summaries.push(summary)
    }
    let results = await Promise.all(summaries);

    let summaryRecords = {
      SUMMARY_RECORDS: 0,
      SUMMARY_HS_CODE: 0,
      SUMMARY_BUYERS: 0,
      SUMMARY_SELLERS: 0,
      SUMMARY_SHIPMENTS: 0,
    }

    results.forEach((current) => {
      const currentObj = current;
      summaryRecords.SUMMARY_RECORDS += currentObj?.SUMMARY_RECORDS
      summaryRecords.SUMMARY_HS_CODE += currentObj?.SUMMARY_HS_CODE
      summaryRecords.SUMMARY_BUYERS += currentObj?.SUMMARY_BUYERS
      summaryRecords.SUMMARY_SELLERS += currentObj?.SUMMARY_SELLERS
      summaryRecords.SUMMARY_SHIPMENTS += currentObj?.SUMMARY_SHIPMENTS
    })

    return summaryRecords;
  }


}

module.exports = {
  FetchAnalyseWorkspaceRecordsAndSend: FetchAnalyseWorkspaceRecordsAndSend,
};
