const TAG = 'tokenConfig';

const TokenHelper = require('../helpers/tokenHelper');
const NotificationModel = require('../models/notificationModel');

function authorizeAccess(req, res, next) {

  let bundle = {};
  if(req.headers.react && req.headers.react === 'true'){
    bundle.token = req.headers.cookies ;
  }
  else {
    bundle = req.cookies;
  }

  if (bundle && bundle.token) {
    TokenHelper.verifyJWTAccessToken(bundle, function (error, payload) {
      if (error) {
        return res.status(500).json({
          message: 'Internal Server Error',
        });
      } else {
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
}
