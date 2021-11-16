const TAG = 'tokenConfig';

const TokenHelper = require('../helpers/tokenHelper');
const ActivityModel = require('../models/activityModel');
const NotificationModel = require('../models/notificationModel');

function authorizeAccess(req, res, next) {

  let bundle = req.cookies;

  if (bundle && bundle.token) {
    TokenHelper.verifyJWTAccessToken(bundle, function (error, payload) {
      if (error) {
        return res.status(500).json({
          message: 'Internal Server Error',
        });
      } else {
        if (req.get("browser") && req.originalUrl != "/notification") {
          ActivityModel.update(payload.user.account_id, payload.user.user_id, {
            browser: req.get("browser"),
            login: new Date().getTime(),
            url: req.originalUrl
          })
        }
        req.user = payload.user;
        req.plan = payload.plan;
        if (new Date(payload.plan.access_validity_interval.end_date) < new Date()) {
          return res.status(401).json({
            data: {
              type: 'UNAUTHORISED',
              msg: 'Plan Expired! Please reach out to provider',
              desc: 'Invalid Access'
            }
          });
        }
        var timeStamp = undefined
        var flagValue = undefined
        var fiveFlag = false
        var tenFlag = false
        if (((new Date(payload.plan.access_validity_interval.end_date) - new Date())
          / 86400000) <= 5) {
          timeStamp = new Date().getTime()
          fiveFlag = true
          flagValue = "five"
        }
        else if ((((new Date(payload.plan.access_validity_interval.end_date) - new Date())
        / 86400000) <= 10) && !fiveFlag) {
          timeStamp = new Date().getTime()
          tenFlag = true
          flagValue = "ten"
        }
        else if ((((new Date(payload.plan.access_validity_interval.end_date) - new Date())
        / 86400000) <= 15) && !tenFlag) {
          timeStamp = new Date().getTime()
          flagValue = "fifteen"
        }
        NotificationModel.fetchAccountNotification(payload.user.account_id, timeStamp, flagValue)
        next();
      }
    });
  } else {
    return res.status(401).json({
      data: {
        type: 'UNAUTHORISED',
        msg: 'Access Denied',
        desc: 'Invalid Access'
      }
    });
  }

}

module.exports = {
  authorizeAccess
};
