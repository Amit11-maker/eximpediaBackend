import { ObjectID } from "mongodb";

/**
 * Workspace collection schema
 */
export interface Workspace {
    _id: ObjectID;
    name: string;
    taxonomy_id: ObjectID;
    account_id: ObjectID;
    user_id: ObjectID;
    country: string;
    flag_uri: string;
    code_iso_3: string;
    code_iso_2: string;
    trade: string;
    records: number;
    file_path: string;
    workspace_queries: WorkspaceQuery[];
    start_date: string;
    end_date: string;
    created_ts: Date;
    modified_ts: Date;
}

interface WorkspaceQuery {
    query: string;
    query_records: number;
}


// {
//     "_id": {
//       "$oid": "65153764f262dd104446df82"
//     },
//     "taxonomy_id": {
//       "$oid": "5dbc0ddc510615f79666e7e8"
//     },
//     "account_id": {
//       "$oid": "6515285c497dff4060907471"
//     },
//     "user_id": {
//       "$oid": "6515285c497dff4060907472"
//     },
//     "country": "India",
//     "flag_uri": "flag_ind.png",
//     "code_iso_3": "IND",
//     "code_iso_2": "IN",
//     "trade": "EXPORT",
//     "records": 561,
//     "name": "test-2301",
//     "file_path": "https://steximpediacitest.blob.core.windows.net/eximpedia-workspaces/65153764f262dd104446df82_test-2301.xlsx?sv=2023-08-03&se=2024-09-28T04%3A50%3A07Z&sr=b&sp=racwd&sig=rjz5alOqgrH7s0%2B9mI13ohu6IeqhABkBvS5iNDNPGH4%3D",
//     "workspace_queries": [
//       {
//         "query": "indiaExportWP | where tolong(HS_CODE) between (23010000 .. 23019999) | where EXP_DATE between (todatetime('2023-01-01') .. todatetime('2023-03-31'))",
//         "query_records": 0
//       }
//     ],
//     "start_date": "",
//     "end_date": "",
//     "created_ts": {
//       "$date": "2023-09-28T08:20:52.503Z"
//     },
//     "modified_ts": {
//       "$date": "2023-09-28T08:20:52.503Z"
//     }
//   }