const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;
const http = require("http");

const Config = require("./config/dbConfig").dbMongo;
const ElasticsearchDbHandler = require("./db/elasticsearchDbHandler");
ElasticsearchDbHandler.intialiseDbClient();
const collections = {
  taxonomy: "taxonomies",
  ledger: "ledger",
  workspace: "workspaces",
  account: "accounts",
  user: "users",
  subscription: "subscriptions",
  order: "orders",
  payment: "payments",
  purchased_records_keeper: "purchased_records_keeper",
  activity_tracker: "activity_tracker",
  country_date_range: "country_date_range",
  reset_password: "reset_password",
  explore_search_query: "explore_search_query",
  workspace_query_save: "workspace_query_save",
  general_notification_details: "general_notification_details",
  user_notification_details: "user_notification_details",
  account_notification_details: "account_notification_details",
};

var purchase = [
  "ENTRY_NO",
  "MANIFESTO_NO",
  "IMP_DECL_FORM_NO",
  "BILL_OF_LADING",
  "IMPORTER_PI",
  "IMPORTER_NAME",
  "IMPORTER_ADDRESS",
  "SUPPLIER_NAME",
  "SUPPLIER_ADDRESS",
];

var country = "Kenya";
var trade = "IMPORT";

let filterClause = {};

let updateClause = {
  $set: {},
};

updateClause.$set = {
  "fields.purchasable": purchase,
};

const dbClient = new MongoClient(Config.connection_url, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});
dbClient.connect((err) => {
  console.log("Connected to MongoDB server...");
  const ids = dbClient
    .db(Config.database)
    .collection(collections.user) // substitute your database and collection names
    .find(filterClause)
    .toArray(function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
        http.get({ host: "api.ipify.org", port: 80, path: "/" }, (resp) => {
          resp.on("data", (ip) => {
            console.log(ip.toString());
          });
        });
        const ip = await http.get({
          host: "api.ipify.org",
          port: 80,
          path: "/",
        });
        for (let userData of result) {
          let activityDetails = {
            firstName: userData.first_name,
            lastName: userData.last_name,
            email: userData.email_id,
            login: Date.now(),
            ip: ip,
            browser: "chrome",
            url: "/user",
            role: userData.role,
            alarm: "false",
            scope: userData.scope,
            account_id: ObjectID(userData.account_id),
            userId: ObjectID(userData._id.toString()),
          };
          dbClient
            .db(Config.database)
            .collection(collections.activity_tracker)
            .insertOne(activityDetails, function (err, result) {
              if (err) {
                console.log(err);
              } else {
              }
            });
        }
      }
    });
  return;
});
