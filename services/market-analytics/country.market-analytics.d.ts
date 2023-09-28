// export declare module companiesMarketAnalytics {
// }
export interface Payload {
    destinationCountry: string;
    matchExpressions: Record<string, any>;
    offset: number;
    limit: number;
    startDate: string;
    endDate: string;
    startDateTwo: string;
    endDateTwo: string;
    tradeType: "IMPORT" | "EXPORT"
    originCountry: string
    dataBucket: string
}