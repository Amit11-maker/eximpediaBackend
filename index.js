const TAG = "index";

const dotenv = require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const http = require("http");
const winston = require("winston");
const ecsFormat = require("@elastic/ecs-winston-format");
const port = process.env.PORT;
const { logger } = require("./config/logger");
const DashboardRoute = require("./routes/dashboardRoute");
const TaxonomyRoute = require("./routes/taxonomyRoute");
const LedgerRoute = require("./routes/ledgerRoute");
const TradeRoute = require("./routes/tradeRoute");
const WorkspaceRoute = require("./routes/workspaceRoute");
const WokspaceAnalyticsRoute = require("./routes/analyticsRoute");
const UserRoute = require("./routes/userRoute");
const marketAnalyticsRoute = require("./routes/marketAnalyticsRoute");
const AccountRoute = require("./routes/accountRoute");
const ActivityRoute = require("./routes/activityRoute");
const IndiaExportConsigneeDetailsRoute = require("./routes/indiaExpConsigneeDetailsRoute");
const GlobalSearchRoute = require("./routes/globalSearchRoute");
const SignUpUserRoute = require("./routes/signUpUserRoute");
const IECRoute = require("./routes/iecRoute");
const DownloadCheckRoute = require("./routes/downloadCheckRoute");

// const WebSiteDataRoute = require("./routes/webSiteDataRoute");
const CountryTaxonomiesDetailsRoute = require("./routes/countryTaxonomiesDetailsRoute");
const BlogContentRoute = require("./routes/blogContentRoute");
const otpRoute = require("./routes/otpRoute");
const OrderRoute = require("./routes/orderRoute");
const PaymentRoute = require("./routes/paymentRoute");
const SubscriptionRoute = require("./routes/subscriptionRoute");
const AuthRoute = require("./routes/authRoute");
const RecommendationRoute = require("./routes/recommendationRoute");
const NotificationRoute = require("./routes/notificationRoute");
const SaveQueryRoute = require("./routes/saveQueryRoute");
const FavouriteRoute = require("./routes/favouriteRoute");
const MongoDbHandler = require("./db/mongoDbHandler");
const ElasticSearchDbHandler = require("./db/elasticsearchDbHandler");
const supportRoute = require("./routes/supportRoute");
const logger2 = winston.createLogger({
  level: "debug",
  format: ecsFormat({ convertReqRes: true }),
  transports: [
    //new winston.transports.Console(),
    new winston.transports.File({
      //path to log file
      filename: "logs/log.json",
      level: "debug",
    }),
  ],
});
const corsOptions = {
  origin: (origin, callback) => {
    if (origin == undefined) {
      callback(null, true);
      return;
    }
    if (
      process.env.HOST.split("|").some((e) => origin.includes(e)) ||
      !origin
    ) {
      callback(null, true);
      return;
    } else {
      callback(null, true);
      return;
    }
  },
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  credentials: true,
};
process.setMaxListeners(0);
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(helmet());
// app.use(express.static(__dirname + "/public"));
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(bodyParser.json());
app.use(cookieParser());

app.use("/subscriptions", SubscriptionRoute);
app.use("/signUp", SignUpUserRoute);
app.use("/auths", AuthRoute);
app.use("/dashboard", DashboardRoute);
app.use("/accounts", AccountRoute);
app.use("/users", UserRoute);
app.use("/trade", TradeRoute);
app.use("/iec", IECRoute); //for India case only
app.use("/consignee", IndiaExportConsigneeDetailsRoute); //for india export case only
app.use("/ledger", LedgerRoute);
app.use("/activity", ActivityRoute);
app.use("/workspaces", WorkspaceRoute);
app.use("/users/:userId/workspaces", WorkspaceRoute);
app.use("/accounts/:accountId/workspaces", WorkspaceRoute);
app.use("/analytics", WokspaceAnalyticsRoute);
app.use("/orders", OrderRoute);
app.use("/accounts/:accountId/orders", OrderRoute);
app.use("/accounts/:accountId/subscriptions", SubscriptionRoute);
app.use("/query", SaveQueryRoute);
app.use("/recommendation", RecommendationRoute);
app.use("/favourite", FavouriteRoute);
app.use("/marketanalytics", marketAnalyticsRoute);
app.use("/taxonomies", TaxonomyRoute);
app.use("/support", supportRoute);

/** Start - Unusable routes , can delete after proper testing */

app.use("/", DashboardRoute);
app.use("", otpRoute);
app.use("/payments", PaymentRoute);
app.use("/accounts/:accountId/payments", PaymentRoute);
app.use("/notification", NotificationRoute);
app.use("/globalSearch", GlobalSearchRoute);
app.use("/download", DownloadCheckRoute);
app.use("/blog", BlogContentRoute);
app.use("/countryTaxonomiesDetails", CountryTaxonomiesDetailsRoute);

// Temporarily commenting this integration
// app.use("/web", WebSiteDataRoute);

/** End */

app.all("*", function (req, res) {
  res.status(404).send({
    errors: {
      message: "Requested Resource Non-Existence",
      code: "404 Not Found",
    },
  });
});

MongoDbHandler.intialiseDbClient();
ElasticSearchDbHandler.intialiseDbClient();

process.on("SIGINT", () => {
  logger.log("Application Shutdown Initiated!");
  logger.log("Application Shutdown Initiated!");
  MongoDbHandler.graceShutDb();
  ElasticSearchDbHandler.graceShutDb();
  process.exit();
});

app.listen(port, () => {
  logger.log(`Example app listening on port ${port}!`);

  logger.log("Application Shutdown Initiated!");
});
