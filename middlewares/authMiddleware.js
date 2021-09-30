const TAG = 'tokenConfig';

const TokenHelper = require('../helpers/tokenHelper');
const ActivityModel = require('../models/activityModel');

function authorizeAccess(req, res, next) {

  let bundle = req.cookies;

  if (bundle && bundle.token) {
    TokenHelper.verifyJWTAccessToken(bundle, function (error, payload) {
      if (error) {
        return res.status(500).json({
          message: 'Internal Server Error',
        });
      } else {
        if (req.get("browser")) {
          ActivityModel.update(payload.user.account_id, payload.user.user_id, {
            browser: req.get("browser"),
            login: new Date().getTime(),
            url: req.originalUrl
          })
        }
        req.user = payload.user;
        req.plan = payload.plan;
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
