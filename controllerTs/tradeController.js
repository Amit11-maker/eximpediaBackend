// const date = require("date-and-time");
const TradeModel = require("../models/tradeModel");
const { logger } = require("../config/logger");


// interface keyable {
//     [key: string]: any  
// }

let fetchSummaryDetails = async (req , res ) => {
    
    let payload = req.body;
    payload.user = req.user;
    
    let tradeType = payload.tradeType.trim().toUpperCase();
    let country = payload.country.trim().toUpperCase();
    let searchTerm = payload.searchTerm.trim().toUpperCase();
    let blCountry = payload.blCountry;
    let startDate = payload.dateRange.startMonthDate ?? null;
    let endDate = payload.dateRange.endMonthDate ?? null;
    let searchField = payload.searchField;
    
    if (blCountry != null) {
      blCountry = blCountry.replace(/_/g, " ");
    }

    try {
      
      var summaryLimitCountResult = await TradeModel.getSummaryLimit(
        payload.user.account_id
      );

      if (summaryLimitCountResult?.max_summary_limit?.remaining_limit <= 0) {
        return res.status(409).json({
          message: "Out of View Summary Limit , Please Contact Administrator.",
        });
      }
  
      let bundle = {};
      
      let summaryColumn = await TradeModel.findCountrySummary(
        payload.taxonomy_id
      );
      
      if (summaryColumn && summaryColumn.length === 0) {
        summaryColumn = await TradeModel.createSummaryForNewCountry(
          payload.taxonomy_id
        );
      }

      for (let matchExp of summaryColumn[0].matchExpression) {
        switch (matchExp.identifier) {
          case "SEARCH_HS_CODE":
            summaryColumn.codeColumn = matchExp.fieldTerm;
            break;
          case "SEARCH_BUYER":
            summaryColumn.searchField = searchField;
            break;
          case "FILTER_PRICE":
            if (matchExp.metaTag === "USD") {
              summaryColumn.priceColumn = matchExp.fieldTerm;
            }
            break;
          case "FILTER_PORT":
            summaryColumn.portColumn = matchExp.fieldTerm;
            break;
          case "SEARCH_SELLER":
            summaryColumn.searchField = searchField;
            break;
          case "SEARCH_MONTH_RANGE":
            summaryColumn.dateColumn = matchExp.fieldTerm;
            break;
          case "FILTER_UNIT":
            summaryColumn.unitColumn = matchExp.fieldTerm;//matchExp.fieldTerm;
            break;
          case "FILTER_QUANTITY":
            summaryColumn.quantityColumn = matchExp.fieldTerm;
            break;
          case "FILTER_COUNTRY":
            summaryColumn.countryColumn = matchExp.fieldTerm;
            break;
        }
      }

      let tradeCompanies = await TradeModel.findCompanyDetailsByPatternEngineADX(
        { country, tradeType },
        searchTerm,
        startDate,
        endDate,
        summaryColumn
      );
  
      try {
        summaryLimitCountResult.max_summary_limit.remaining_limit =
          summaryLimitCountResult?.max_summary_limit?.remaining_limit - 1;
        await TradeModel.updateDaySearchLimit(
          payload.user.account_id,
          summaryLimitCountResult
        );
      } catch (error) {
        logger.log(
          payload.user.user_id,
          ` TRADE CONTROLLER ================== ${JSON.stringify(error)}`
        );
      }

      // getBundleData(tradeCompanies, bundle, country);
    
        tradeCompanies.consumedCount =
          summaryLimitCountResult.max_summary_limit.alloted_limit -
          summaryLimitCountResult.max_summary_limit.remaining_limit;
        tradeCompanies.allotedCount =
          summaryLimitCountResult.max_summary_limit.alloted_limit;

        res.status(200).send(tradeCompanies);
      } catch (error) {
        console.log(error);
        logger.log(` TRADE CONTROLLER ================== ${JSON.stringify(error)}`);
        
        res.status(500).json({
          message: "Internal Server Error",
        });
  }
}

module.exports = {fetchSummaryDetails}
