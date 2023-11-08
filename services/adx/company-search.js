// @ts-check

const getLoggerInstance = require("../logger/Logger");
const TradeModel = require("../../models/tradeModel")
const TradeSchema = require("../../schemas/tradeSchema")

/** Function to get company details for summary and recommendation 
 * @typedef {import("../../types/session-user").CompanySearchPayload} ReqBody
 * @param {import('../../types/session-user').RequestWithUser<ReqBody>} req
 * @param {import('express').Response} res
 * @param {boolean} isrecommendationDataRequest
*/
const fetchCompanyDetails = async (req, res, isrecommendationDataRequest) => {
    const payload = req.body;
    let tradeType = payload.tradeType.trim().toUpperCase();
    let country = payload.country.trim().toUpperCase();
    let searchTerm = payload.searchTerm.trim().toUpperCase();
    let blCountry = payload.blCountry;
    let startDate = payload.dateRange.startDate ?? null;
    let endDate = payload.dateRange.endDate ?? null;
    if (blCountry != null) {
        blCountry = blCountry.replace(/_/g, " ");
    }
    try {
        /** @type {Awaited<ReturnType<import("../../models/tradeModel").getSummaryLimit>> | undefined} */
        let summaryLimitCountResult = undefined;
        if (!isrecommendationDataRequest) {
            summaryLimitCountResult = await TradeModel.getSummaryLimit(req.user.account_id);
            if (summaryLimitCountResult?.max_summary_limit?.remaining_limit <= 0) {
                return res.status(409).json({
                    message: "Out of View Summary Limit , Please Contact Administrator.",
                });
            }
        }

        let bundle = {};
        let searchingColumns = {};

        let dataBucket = TradeSchema.deriveDataBucket(tradeType, country);
        let tradeMeta = {
            tradeType: tradeType,
            countryCode: country,
            indexNamePrefix: dataBucket,
            blCountry,
        };

        /** @type {any} */
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
                    searchingColumns.codeColumn = matchExp.fieldTerm;
                    break;
                case "SEARCH_BUYER":
                    if (tradeType === "IMPORT") {
                        searchingColumns.buyerName = matchExp.fieldTerm;
                        searchingColumns.searchField = matchExp.fieldTerm;
                    } else {
                        searchingColumns.sellerName = matchExp.fieldTerm;
                    }
                    break;
                case "FILTER_PRICE":
                    if (matchExp.metaTag === "USD") {
                        searchingColumns.priceColumn = matchExp.fieldTerm;
                    }
                    break;
                case "FILTER_PORT":
                    searchingColumns.portColumn = matchExp.fieldTerm;
                    break;
                case "SEARCH_SELLER":
                    if (tradeType === "IMPORT") {
                        searchingColumns.sellerName = matchExp.fieldTerm;
                    } else {
                        searchingColumns.buyerName = matchExp.fieldTerm;
                        searchingColumns.searchField = matchExp.fieldTerm;
                    }
                    break;
                case "SEARCH_MONTH_RANGE":
                    searchingColumns.dateColumn = matchExp.fieldTerm;
                    break;
                case "FILTER_UNIT":
                    searchingColumns.unitColumn = matchExp.fieldTerm;
                    break;
                case "FILTER_QUANTITY":
                    searchingColumns.quantityColumn = matchExp.fieldTerm;
                    break;
                case "FILTER_COUNTRY":
                    searchingColumns.countryColumn = matchExp.fieldTerm;
                    break;
            }
        }

        const tradeCompanies = await TradeModel.findCompanyDetailsByPatternEngineADX(
            { country, tradeType },
            searchTerm,
            tradeMeta,
            startDate,
            endDate,
            searchingColumns,
            isrecommendationDataRequest
        );

        // res.send(tradeCompanies);

        if (isrecommendationDataRequest) {
            return tradeCompanies.FILTER_BUYER_SELLER;
        } else {

            if (!summaryLimitCountResult) return;

            summaryLimitCountResult.max_summary_limit.remaining_limit =
                summaryLimitCountResult?.max_summary_limit?.remaining_limit - 1;
            await TradeModel.updateDaySearchLimit(
                req.user.account_id,
                summaryLimitCountResult
            );
            getBundleData(tradeCompanies, bundle, country);

            bundle.consumedCount =
                summaryLimitCountResult.max_summary_limit.alloted_limit -
                summaryLimitCountResult.max_summary_limit.remaining_limit;
            bundle.allotedCount =
                summaryLimitCountResult.max_summary_limit.alloted_limit;
            res.status(200).json(bundle);
        }
    } catch (error) {
        const { errorMessage, log } = getLoggerInstance(error, __filename, this.fetchCompanyDetailsADX.name)
        log(errorMessage, "ERROR")
        if (isrecommendationDataRequest) {
            throw error;
        } else {
            res.status(500).json({
                message: "Internal Server Error",
            });
        }
    }
};

function getBundleData(tradeCompanies, bundle, country) {
    let recordsTotal = tradeCompanies[TradeSchema.RESULT_PORTION_TYPE_SUMMARY].length > 0
        ? tradeCompanies[TradeSchema.RESULT_PORTION_TYPE_SUMMARY][0].count
        : 0;
    bundle.recordsTotal = recordsTotal;
    bundle.summary = {};
    bundle.filter = {};
    bundle.chart = {};
    bundle.data = tradeCompanies.RECORD_SET[0];
    for (const prop in tradeCompanies) {
        if (tradeCompanies.hasOwnProperty(prop)) {
            if (prop.indexOf("SUMMARY") === 0) {
                if (prop === "SUMMARY_RECORDS") {
                    bundle.summary[prop] = recordsTotal;
                } else {
                    if (
                        prop.toLowerCase() == "summary_shipments" &&
                        country.toLowerCase() == "indonesia"
                    ) {
                        bundle.summary[prop] = recordsTotal;
                    } else {
                        bundle.summary[prop] = tradeCompanies[prop];
                    }
                }
            } else if (prop.indexOf("FILTER") === 0) {
                bundle.filter[prop] = tradeCompanies[prop];
            }
        }
    }
}

module.exports = {
    fetchCompanyDetailsADX: fetchCompanyDetails
}