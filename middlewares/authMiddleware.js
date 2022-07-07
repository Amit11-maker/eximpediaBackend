const TAG = "tokenConfig";
const TokenHelper = require("../helpers/tokenHelper");
const ActivityModel = require("../models/activityModel");
const NotificationModel = require("../models/notificationModel");
const UserModel = require("../models/userModel");
const parseCookie = (str) =>
  str
    .split(";")
    .map((v) => v.split("="))
    .reduce((acc, v) => {
      acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
      return acc;
    }, {});

function authorizeAccess(req, res, next) {
  let bundle;
  if (req.headers.react === "true") {
    bundle = parseCookie(req.headers.cookies);
  } else {
    bundle = req.cookies;
  }

  if (bundle && bundle.token) {
    TokenHelper.verifyJWTAccessToken(bundle, function (error, payload) {
      if (error) {
        return res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        UserModel.findByEmail(payload.user.email_id, {}, (error, userEntry) => {
          if (error) {
            return res.status(401).json({
              data: {
                type: "UNAUTHORISED",
                msg: "Access Denied",
                desc: "Invalid Access",
              },
            });
          } else {
            if (userEntry !== null) {
              if (userEntry.password !== payload.user.password) {
                return res.status(401).json({
                  data: {
                    type: "UNAUTHORISED",
                    msg: "Access Denied",
                    desc: "Password is Updated!",
                  },
                });
              } else {
                if (req.get("browser") && req.originalUrl != "/notification") {
                  ActivityModel.update(
                    payload.user.account_id,
                    payload.user.user_id,
                    {
                      browser: req.get("browser"),
                      login: new Date().getTime(),
                      url: req.originalUrl,
                    }
                  );
                }
                req.user = payload.user;
                req.plan = payload.plan;
                if (
                  new Date(payload.plan.access_validity_interval.end_date) <
                  new Date()
                ) {
                  return res.status(401).json({
                    data: {
                      type: "UNAUTHORISED",
                      msg: "Plan Expired! Please reach out to provider",
                      desc: "Invalid Access",
                    },
                  });
                }
                var timeStamp = undefined;
                var flagValue = undefined;
                var fiveFlag = false;
                var tenFlag = false;
                if (
                  (new Date(payload.plan.access_validity_interval.end_date) -
                    new Date()) /
                    86400000 <=
                  5
                ) {
                  timeStamp = new Date().getTime();
                  fiveFlag = true;
                  flagValue = "five";
                } else if (
                  (new Date(payload.plan.access_validity_interval.end_date) -
                    new Date()) /
                    86400000 <=
                    10 &&
                  !fiveFlag
                ) {
                  timeStamp = new Date().getTime();
                  tenFlag = true;
                  flagValue = "ten";
                } else if (
                  (new Date(payload.plan.access_validity_interval.end_date) -
                    new Date()) /
                    86400000 <=
                    15 &&
                  !tenFlag
                ) {
                  timeStamp = new Date().getTime();
                  flagValue = "fifteen";
                }
                NotificationModel.fetchAccountNotification(
                  payload.user.account_id,
                  timeStamp,
                  flagValue
                );

                next();
              }
            }
          }
        });
      }
    });
  } else {
    return res.status(401).json({
      data: {
        type: "UNAUTHORISED",
        msg: "Access Denied",
        desc: "Invalid Access",
      },
    });
  }
}

module.exports = {
  authorizeAccess,
};
