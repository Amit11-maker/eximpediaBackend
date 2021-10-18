const MongoClient = require('mongodb').MongoClient;



const Config = require('./config/dbConfig').dbMongo;
const ElasticsearchDbHandler = require('./db/elasticsearchDbHandler');
ElasticsearchDbHandler.intialiseDbClient()
const collections = {
    taxonomy: 'taxonomies',
    ledger: 'ledger',
    workspace: 'workspaces',
    account: 'accounts',
    user: 'users',
    subscription: 'subscriptions',
    order: 'orders',
    payment: 'payments',
    purchased_records_keeper: 'purchased_records_keeper',
    activity_tracker: 'activity_tracker',
    country_date_range: 'country_date_range',
    reset_password: 'reset_password',
    explore_search_query: 'explore_search_query',
    workspace_query_save: 'workspace_query_save',
    general_notification_details: 'general_notification_details',
    user_notification_details: 'user_notification_details',
    account_notification_details: 'account_notification_details'
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
    "SUPPLIER_ADDRESS"
]


var country = "Kenya"
var trade = "IMPORT"

let filterClause = {
    country,
    trade
};

let updateClause = {
    $set: {}
};

updateClause.$set = {
    "fields.purchasable": purchase
};

const dbClient = new MongoClient(Config.connection_url, {
    useUnifiedTopology: true,
    useNewUrlParser: true
});
dbClient.connect(err => {
    console.log("Connected to MongoDB server...");
    const ids = dbClient.db(Config.database).collection(collections.taxonomy) // substitute your database and collection names
        .updateOne(filterClause, updateClause,
            function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(null, result.modifiedCount);
                }
                return
            });
    return
});

