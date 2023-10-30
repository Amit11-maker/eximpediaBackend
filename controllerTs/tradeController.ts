import TradeModel from "../models/tradeModel";
import {trade} from "../schemas/adx/analytics/types/trade";
import {logger} from "../config/logger";
import TradeSchema from "../schemas/tradeSchema";
import {Request} from 'express';


interface keyable {
    [key: string]: any  
}

export let fetchSummaryDetails = async (req : Request , res : any ) => {
    
    let payload : trade = req.body as unknown as trade;

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
  
      let bundle: any = {};
      
      let summaryColumn : any = await TradeModel.findCountrySummary(
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
            if (tradeType === "IMPORT") {
              summaryColumn.buyerName = matchExp.fieldTerm;
              summaryColumn.searchField = matchExp.fieldTerm;
            } else {
              summaryColumn.sellerName = matchExp.fieldTerm;
            }
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
            if (tradeType === "IMPORT") {
              summaryColumn.sellerName = matchExp.fieldTerm;
            } else {
              summaryColumn.buyerName = matchExp.fieldTerm;
              summaryColumn.searchField = matchExp.fieldTerm;
            }
            break;
          case "SEARCH_MONTH_RANGE":
            summaryColumn.dateColumn = matchExp.fieldTerm;
            break;
          case "FILTER_UNIT":
            summaryColumn.unitColumn = matchExp.fieldTerm;
            break;
          case "FILTER_QUANTITY":
            summaryColumn.quantityColumn = matchExp.fieldTerm;
            break;
          case "FILTER_COUNTRY":
            summaryColumn.countryColumn = matchExp.fieldTerm;
            break;
        }
      }

      console.log(summaryColumn);
      
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
    
        bundle.consumedCount =
          summaryLimitCountResult.max_summary_limit.alloted_limit -
          summaryLimitCountResult.max_summary_limit.remaining_limit;
        bundle.allotedCount =
          summaryLimitCountResult.max_summary_limit.alloted_limit;

        res.status(200).send(bundle);
      } catch (error) {

        logger.log(` TRADE CONTROLLER ================== ${JSON.stringify(error)}`);
        
        res.status(500).json({
          message: "Internal Server Error",
        });
  }
}
