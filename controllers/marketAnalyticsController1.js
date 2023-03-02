const TAG = "MarketAnalyticsController1";

const ExcelJS = require("exceljs");
const marketAnalyticsModel = require("../models/marketAnalyticsModel");
const marketAnalyticsModel1 = require("../models/marketAnalyticsModel1");
const TradeSchema = require("../schemas/tradeSchema");

function convertToInternationalCurrencySystem(labelValue) {

    // Nine Zeroes for Billions
    return Math.abs(Number(labelValue)) >= 1.0e+9

        ? (Math.abs(Number(labelValue)) / 1.0e+9).toFixed(2) + "B"
        // Six Zeroes for Millions 
        : Math.abs(Number(labelValue)) >= 1.0e+6

            ? (Math.abs(Number(labelValue)) / 1.0e+6).toFixed(2) + "M"
            // Three Zeroes for Thousands
            : Math.abs(Number(labelValue)) >= 1.0e+3

                ? (Math.abs(Number(labelValue)) / 1.0e+3).toFixed(2) + "K"

                : Math.abs(Number(labelValue));

}

function convertToYearMonthFormat(date) {
    let d = date.split("-");
    let x = d[1]

    let month = "";
    switch (x) {
        case "01":
            month = "Jan";
            break;
        case "02":
            month = "Feb";
            break;
        case "03":
            month = "Mar";
            break;
        case "04":
            month = "Apr";
            break;
        case "05":
            month = "May";
            break;
        case "06":
            month = "Jun";
            break;
        case "07":
            month = "Jul";
            break;
        case "08":
            month = "Aug";
            break;
        case "09":
            month = "Sep";
            break;
        case "10":
            month = "Oct";
            break;
        case "11":
            month = "Nov";
            break;
        case "12":
            month = "Dec";
            break;

    }
    let newDate = month + " " + d[0];
    return newDate;
}

// Controller functions to analyse country vs importer/exporter market data
async function fetchTradeWiseMarketAnalyticsData(req, res) {
    try {
        // Parameters to be passed
        let finaltradeWiseMarketAnalyticsData = await getTradeWiseMarketAnalyticsData(req);

        res.send(finaltradeWiseMarketAnalyticsData);
    } catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
}

async function getTradeWiseMarketAnalyticsData(req) {
    try {

        let payload = req.body;
        const startDate = payload.dateRange.startDate ?? null;
        const endDate = payload.dateRange.endDate ?? null;
        const startDateTwo = payload.dateRange.startDateTwo ?? null;
        const endDateTwo = payload.dateRange.endDateTwo ?? null;

        let tradeWiseMarketAnalyticsDataForDateRange1 = await marketAnalyticsModel1.tradeWiseMarketAnalytics(payload, startDate, endDate, isCurrentDate = true);

        payload.dateRange1Data = tradeWiseMarketAnalyticsDataForDateRange1;
        let finaltradeWiseMarketAnalyticsData = await marketAnalyticsModel1.tradeWiseMarketAnalytics(payload, startDateTwo, endDateTwo, isCurrentDate = false);
        return finaltradeWiseMarketAnalyticsData;

    } catch (error) {
        throw error;
    }
}

async function fetchTradeWiseMarketAnalyticsFilters(req, res) {
    try {

        let payload = req.body;

        const TradeWiseMarketAnalyticsFilters = await marketAnalyticsModel1.fetchTradeMarketAnalyticsFilters(payload);
        
        let resultFilter = [];
        let filter = {};
        for (let prop in TradeWiseMarketAnalyticsFilters.body.aggregations) {
            if (TradeWiseMarketAnalyticsFilters.body.aggregations.hasOwnProperty(prop)) {
                let hs_Code = [];
                if (TradeWiseMarketAnalyticsFilters.body.aggregations[prop].buckets) {
                    for (let bucket of TradeWiseMarketAnalyticsFilters.body.aggregations.FILTER_HS_CODE_PRICE_QUANTITY.buckets) {
                        if (bucket.doc_count != null && bucket.doc_count != undefined) {
                            let hsCode = {};
                            hsCode._id = bucket.key
                            segregateAggregationData(hsCode, bucket)
                            hs_Code.push(hsCode);
                        }
                    }
                }
                filter[prop] = hs_Code;
            }
        }

        resultFilter.push(filter);
        res.send(resultFilter);
        // res.send(hs_codes);
    } catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
}

function segregateAggregationData(groupedElement, bucket) {

    if (bucket.hasOwnProperty("SHIPMENTS")) {
        groupedElement.shipments = bucket['SHIPMENTS'].value;
    }
    if (bucket.hasOwnProperty("QUANTITY")) {
        groupedElement.quantity = bucket['QUANTITY'].value;
    }
    if (bucket.hasOwnProperty("PRICE")) {
        groupedElement.price = bucket['PRICE'].value;
    }
    if (bucket.hasOwnProperty("COMPANIES")) {
        groupedElement.companies = bucket['COMPANIES'].value;
    }
    if (bucket.hasOwnProperty("doc_count")) {
        groupedElement.count = bucket['doc_count'];
    }

}

async function downloadTradeWiseMarketAnalyticsData(req, res) {
    try {
        let payload = req.body;
        const startDate = payload.dateRange.startDate ?? null;
        const endDate = payload.dateRange.endDate ?? null;
        const startDateTwo = payload.dateRange.startDateTwo ?? null;
        const endDateTwo = payload.dateRange.endDateTwo ?? null;
        let analyticsDataset = await getTradeWiseMarketAnalyticsData(req);

        let workbook = new ExcelJS.Workbook();
        let worksheet = workbook.addWorksheet("Trade analytics Data");

        let getCellCountryText = worksheet.getCell("B2");

        worksheet.getCell("A5").value = "";

        getCellCountryText.value = "DATA";
        getCellCountryText.font = {
            name: "Calibri",
            size: 22,
            underline: "single",
            bold: true,
            color: { argb: "005d91" },
            height: "auto",
        }

        worksheet.mergeCells("B2", "D3");
        getCellCountryText.alignment = { vertical: "middle", horizontal: "center" }

        //Add Image
        let myLogoImage = workbook.addImage({
            filename: "./public/images/logo-new.jpg",
            extension: "jpeg",
        });

        worksheet.addImage(myLogoImage, "A1:A4");
        worksheet.add;

        let headerRow = worksheet.addRow(["Company Name", "Compared Date", "Shipments", "Price", "Quantity"]);
        let colLength = [];
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "005d91" },
                bgColor: { argb: "" },
            };
            cell.font = {
                bold: true,
                color: { argb: "FFFFFF" },
                size: 12,
            };
            colLength.push(cell.value ? cell.value.toString().length : 10);
        });

        worksheet.columns.forEach(function (column, i) {
            if (colLength[i] < 10) {
                colLength[i] = 10;
            }
            column.width = colLength[i] * 2;
        });

        let rowCount = 0;
        let cellCount = 7;
        let analyticsDatasetLength = analyticsDataset.trade_data.length;
        while (rowCount < analyticsDatasetLength) {
            let analyticsData = analyticsDataset.trade_data[rowCount];

            let startCell = "A" + cellCount;
            let endCell = "A" + (cellCount + 2);

            let companyCell = worksheet.getCell(startCell);
            companyCell.value = analyticsData.company_name;
            worksheet.mergeCells(startCell, endCell);
            companyCell.alignment = { vertical: "middle", horizontal: "left" }

            let data = [analyticsData.company_data.date1, analyticsData.company_data.date2];
            for (let i = 0; i < data.length + 1; i++) {
                let dateCell = worksheet.getCell("B" + cellCount);
                let shipmentCell = worksheet.getCell("C" + cellCount);
                let priceCell = worksheet.getCell("D" + cellCount);
                let quantityCell = worksheet.getCell("E" + cellCount);
                if (i < data.length) {
                    if (i == 0) {
                        dateCell.value = startDate + "-" + endDate;
                    } else {
                        dateCell.value = startDateTwo + "-" + endDateTwo;
                    }
                    dateCell.alignment = { vertical: "middle", horizontal: "center" }

                    shipmentCell.value = data[i]?.shipments ? convertToInternationalCurrencySystem(data[i].shipments.toFixed(2)) : 0;
                    shipmentCell.alignment = { vertical: "middle", horizontal: "right" }

                    priceCell.value = data[i]?.price ? convertToInternationalCurrencySystem(data[i].price.toFixed(2)) : 0;
                    priceCell.alignment = { vertical: "middle", horizontal: "right" }

                    quantityCell.value = data[i]?.quantity ? convertToInternationalCurrencySystem(data[i].quantity.toFixed(2)) : 0;
                    quantityCell.alignment = { vertical: "middle", horizontal: "right" }
                }
                else {
                    dateCell.value = "Growth(%)";
                    dateCell.alignment = { vertical: "middle", horizontal: "center" }
                    dateCell.font = { bold: true }

                    let shipmentCurrentYearData = data[0]?.shipments ? data[0].shipments : 0;
                    let shipmentLastYearData = data[1]?.shipments ? data[1].shipments : 0;
                    let shipmentCellValue = (shipmentCurrentYearData - shipmentLastYearData) / (shipmentCurrentYearData + shipmentLastYearData);
                    shipmentCell.value = parseFloat(shipmentCellValue * 100).toFixed(2) + "%";
                    shipmentCell.alignment = { vertical: "middle", horizontal: "right" }
                    let shipmentColor = shipmentCellValue > 0 ? "008000" : "FF0000";
                    shipmentCell.font = { color: { argb: shipmentColor }, bold: true }

                    let priceCurrentYearData = data[0]?.price ? data[0].price : 0;
                    let priceLastYearData = data[1]?.price ? data[1].price : 0;
                    let priceCellValue = (priceCurrentYearData - priceLastYearData) / (priceCurrentYearData + priceLastYearData);
                    priceCell.value = parseFloat(priceCellValue * 100).toFixed(2) + "%";
                    priceCell.alignment = { vertical: "middle", horizontal: "right" }
                    let priceColor = priceCellValue > 0 ? "008000" : "FF0000";
                    priceCell.font = { color: { argb: priceColor }, bold: true }

                    let quantityCurrentYearData = data[0]?.quantity ? data[0].quantity : 0;
                    let quantityLastYearData = data[1]?.quantity ? data[1].quantity : 0;
                    let quantityCellValue = (quantityCurrentYearData - quantityLastYearData) / (quantityCurrentYearData + quantityLastYearData);
                    quantityCell.value = parseFloat(quantityCellValue * 100).toFixed(2) + "%";
                    quantityCell.alignment = { vertical: "middle", horizontal: "right" }
                    let quantityColor = quantityCellValue > 0 ? "008000" : "FF0000";
                    quantityCell.font = { color: { argb: quantityColor }, bold: true }
                }
                cellCount++;
            }
            rowCount++;
        }
        // workbook.xlsx.write(res, function () {
        //     res.end();
        // })
        workbook.xlsx.writeFile("C:\\Users\\kaush\\Downloads\\datacompany.xlsx");
        // res.end()

    } catch (error) {
        JSON.stringify(error);
    }
}

module.exports = {
    fetchTradeWiseMarketAnalyticsData,
    fetchTradeWiseMarketAnalyticsFilters,
    downloadTradeWiseMarketAnalyticsData
}