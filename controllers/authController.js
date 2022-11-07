const TAG = "authController";

const UserModel = require("../models/userModel");
const AccountModel = require("../models/accountModel");
const UserSchema = require("../schemas/userSchema");
const CryptoHelper = require("../helpers/cryptoHelper");
const TokenHelper = require("../helpers/tokenHelper");
const NotificationModel = require('../models/notificationModel');
const ObjectID = require('mongodb').ObjectID;
const { logger } = require("../config/logger");


// Test Simulation
const logPassword = (req, res) => {
  let password = "KRONOS";
  CryptoHelper.generateAutoSaltHashedPassword(
    password,
    function (error, hashedPassword) {
      if (error) {
        logger.error(` AUTH CONTROLLER ================== ${JSON.stringify(error)}`);
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        res.status(200).json({
          hashedPassword: hashedPassword,
        });
      }
    }
  );
}

const login = (req, res) => {
  let emailId = req.body.email_id ? req.body.email_id.toLowerCase().trim() : null;
  let password = req.body.password ? req.body.password.trim() : null;
  let scope = req.body.scope ? req.body.scope.trim() : null;
  let filters = {
    scope: scope, // For Provider Access Simulation
  }
  if (emailId && password) {
    UserModel.findByEmail(emailId, filters, (error, userEntry) => {
      if (error) {
        logger.error(` AUTH CONTROLLER ================== ${JSON.stringify(error)}`);
        //throw error;
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        if (userEntry != null) {
          if (userEntry.is_email_verified) {
            CryptoHelper.verifyPasswordMatch(
              userEntry.password,
              password,
              function (error, verifiedMatch) {
                if (error) {
                  logger.error(` AUTH CONTROLLER ================== ${JSON.stringify(error)}`);
                  res.status(500).json({
                    message: "Internal Server Error",
                  });
                } else {
                  if (verifiedMatch) {
                    AccountModel.findPlanConstraints(
                      userEntry.account_id,
                      async function (error, planContraints) {
                        if (error) {
                          logger.error(` AUTH CONTROLLER ================== ${JSON.stringify(error)}`);

                          res.status(500).json({
                            message: "Internal Server Error",
                          });
                        } else {

                          if (userEntry.role != "ADMINISTRATOR") {
                            planContraints.plan_constraints.countries_available = userEntry.available_countries
                            planContraints.plan_constraints.purchase_points = userEntry.available_credits
                          }
                          let userSessionFlag = await AccountModel.getUserSessionFlag(userEntry._id)
                          let tokenPayload = {
                            user: UserSchema.buildUserMeta(userEntry),
                            plan: planContraints.plan_constraints
                          };
                          if (userSessionFlag.length === 0) {
                            let addUser = await AccountModel.addUserSessionFlag(userEntry._id)
                          } else if (userSessionFlag[0].hasOwnProperty('islogin')) {
                            tokenPayload.islogin = userSessionFlag[0].islogin
                          }

                          TokenHelper.generateJWTAccessToken(
                            tokenPayload,
                            function (error, jwtToken) {
                              if (error) {
                                logger.error(` AUTH CONTROLLER ================== ${JSON.stringify(error)}`);

                                res.status(500).json({
                                  message: "Internal Server Error",
                                });
                              } else {
                                // Map Refresh Token Functionality - Update DB

                                res.cookie("token", jwtToken, {
                                  httpOnly: true,
                                });

                                // Added In Token Payload
                                /*let userMeta = UserSchema.buildUserMeta(userEntry);
                          res.cookie('user', userMeta, {
                            httpOnly: true
                          });*/
                                res.set(
                                  "Access-Control-Allow-Credentials",
                                  "true"
                                );
                                res.status(200).json({
                                  data: {
                                    type: "MATCHED",
                                    msg: "Access Granted",
                                    desc: "Matched Access Credentials",
                                    customer_id: userEntry.account_id,
                                    token: jwtToken,
                                    firstName: userEntry.first_name,
                                    account_id: userEntry.account_id,
                                    user_id: userEntry._id,
                                    lastName: userEntry.last_name,
                                    email_id: userEntry.email_id
                                  },
                                });
                              }
                            }
                          );

                          AccountModel.updateIsActiveForAccounts(planContraints, function (err, result) {
                            if (err) {
                              logger.error(` AUTH CONTROLLER ================== ${JSON.stringify(err)}`);

                              res.status(500).json({
                                message: "Internal Server Error",
                              });
                            } else {
                              return result;
                            }
                          });

                        }
                      }
                    );
                  } else {
                    res.status(401).json({
                      data: {
                        type: "UNAUTHORISED",
                        msg: "Access Denied",
                        desc: "Incorrect Access Credentials",
                      },
                    });
                  }
                }
              }
            );
          } else {
            res.status(403).json({
              data: {
                type: "FORBIDDEN",
                msg: "Access Forbidden",
                desc: "Email Not Verified. Check your email and click on the activation link",
              }
            });
          }
        } else {
          res.status(404).json({
            data: {
              type: "MISSING",
              msg: "Access Unavailable",
              desc: "Email Not Found",
            },
          });
        }
      }
    });
  } else {
    res.status(200).json({
      data: {
        type: "ERROR",
        msg: "Email Or password cannot be null."
      }
    });
  }
}

const logout = async (req, res) => {
  
  if (req.params.userId) {
    res.clearCookie("token");
    res.clearCookie("user");
    res.status(200).json({
      data: {
        type: "CLEARED",
        msg: "Access Cleared",
        desc: "Login to Continue",
      },
    });
  } else {
    res.status(404).json({
      data: {
        type: "MISSING",
        msg: "User Unavailable",
        desc: "User Access Not Found",
      },
    });
  }
}

const updatePassword = (req, res) => {
  let password = req.body.updated_password;
  const emailId = req.body.email_id;
  CryptoHelper.generateAutoSaltHashedPassword(
    password,
    function (error, hashedPassword) {
      if (error) {
        logger.error(` AUTH CONTROLLER ================== ${JSON.stringify(error)}`);
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        const updatedPassword = { password: hashedPassword }
        UserModel.updateByEmail(emailId, updatedPassword, () => {
          if (error) {
            logger.error(` AUTH CONTROLLER ================== ${JSON.stringify(error)}`);
            res.status(500).json({
              message: "Internal Server Error",
            });
          }
          else {
            res.status(200).json({
              hashedPassword: hashedPassword,
            });
          }
        });
      }
    }
  );
}

module.exports = {
  logPassword,
  login,
  logout,
  updatePassword
}
