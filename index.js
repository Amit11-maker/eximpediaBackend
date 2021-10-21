const TAG = 'index';

const express = require('express');
const app = express();
const port = 4300;
const cors = require('cors');

const helmet = require('helmet');
//const session = require('express-session'); //Legacy to shift to var csurf = require('csurf')
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const DashboardRoute = require('./routes/dashboardRoute');
const TaxonomyRoute = require('./routes/taxonomyRoute');
const LedgerRoute = require('./routes/ledgerRoute');
const TradeRoute = require('./routes/tradeRoute');
const WorkspaceRoute = require('./routes/workspaceRoute');
const AnalyticsRoute = require('./routes/analyticsRoute');
const UserRoute = require('./routes/userRoute');
const AccountRoute = require('./routes/accountRoute');
const ActivityRoute = require('./routes/activityRoute');

const OrderRoute = require('./routes/orderRoute');
const PaymentRoute = require('./routes/paymentRoute');
const SubscriptionRoute = require('./routes/subscriptionRoute');
const AuthRoute = require('./routes/authRoute');
const NotificationRoute = require('./routes/notificationRoute');

const MongoDbHandler = require('./db/mongoDbHandler');
const ElasticSearchDbHandler = require('./db/elasticsearchDbHandler');

// CORS Restricted Access
const whitelistOrigins = ['https://web.eximpedia.app:8000', 'https://web.eximpedia.app', 'http://localhost:4300', 'http://localhost:4200'];
var corsOptions = {
  origin: whitelistOrigins,
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  credentials: true
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

/*app.use(session({
  secret: 'ZEUSJUPITERROMAN',
  resave: true,
  saveUninitialized: true
}));*/

app.use(helmet());
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());
app.use(cookieParser());

/*
app.get('/auth', (req, res) => {
  res.sendFile('auth-guard.html', {
    root: './views'
  });
});

app.get('/login', (req, res) => {
  if (req.query.pass_code == 'ZEUSJUPITERROMAN') {
    req.session.loggedin = true;
    res.status(200).json({
      data: true
    });
  } else {
    res.status(200).json({
      data: false
    });
  }
});

app.use(function (req, res, next) {
  if (!req.session.loggedin) {
    //console.log('Time:', Date.now());
    next();
  } else {
    res.redirect('/auth');
  }

});
*/

app.use('/', DashboardRoute);
app.use('/dashboard', DashboardRoute);
app.use('/taxonomies', TaxonomyRoute);
app.use('/ledger', LedgerRoute);
app.use('/trade', TradeRoute);
app.use('/analytics', AnalyticsRoute);

app.use('/workspaces', WorkspaceRoute);
app.use('/users/:userId/workspaces', WorkspaceRoute);
app.use('/accounts/:accountId/workspaces', WorkspaceRoute);

app.use('/orders', OrderRoute);
app.use('/accounts/:accountId/orders', OrderRoute);

app.use('/payments', PaymentRoute);
app.use('/accounts/:accountId/payments', PaymentRoute);

app.use('/subscriptions', SubscriptionRoute);
app.use('/accounts/:accountId/subscriptions', SubscriptionRoute);

app.use('/users', UserRoute);
app.use('/accounts', AccountRoute);
app.use('/activity', ActivityRoute);

app.use('/auths', AuthRoute);
app.use('/notification', NotificationRoute);

// Invalid URL Handlers
app.all('*', function (req, res) {
  res.status(404).send({
    errors: {
      message: "Requested Resource Non-Existence",
      code: "404 Not Found",
    },
  });
});

MongoDbHandler.intialiseDbClient();
ElasticSearchDbHandler.intialiseDbClient();

process.on('SIGINT', () => {
  console.log("Application Shutdown Initiated!");
  MongoDbHandler.graceShutDb();
  ElasticSearchDbHandler.graceShutDb();
  process.exit();
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
