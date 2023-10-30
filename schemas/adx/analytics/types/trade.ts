import { ObjectID } from "mongodb";

/**
 * trade collection schema
 */
export interface trade {
    tradeType: String;
    country: String;
    searchTerm: String;
    blCountry: String;
    dateRange : {
        startMonthDate : String;
        endMonthDate : String;
    };
    searchField: String;
    taxonomy_id: String;
    user : {    
        account_id: String;
        user_id: String;
    };
}


