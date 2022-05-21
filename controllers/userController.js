const TAG = 'userController';

const EnvConfig = require('../config/envConfig');

const POINTS_CONSUME_TYPE_DEBIT = -1;
const POINTS_CONSUME_TYPE_CREDIT = 1;

const UserModel = require('../models/userModel');
const accountModel = require('../models/accountModel');
const ResetPasswordModel = require('../models/resetPasswordModel');
const ActivityModel = require('../models/activityModel');
const UserSchema = require('../schemas/userSchema');
const ObjectID = require('mongodb').ObjectID;

const CryptoHelper = require('../helpers/cryptoHelper');
const EmailHelper = require('../helpers/emailHelper');

const QUERY_PARAM_TERM_VERIFICATION_EMAIL = 'verification_email';

const create = (req, res) => {
  let payload = req.body;
  payload.parentId = req.user.user_id;
  let ips = req.connection.remoteAddress.split(":")


  UserModel.findByEmail(payload.email_id, null, (error, userEntry) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      if (userEntry && userEntry.email_id) {

        res.status(409).json({
          data: {
            type: 'CONFLICT',
            msg: 'Resource Conflict',
            desc: 'Email Already Registered For Another User'
          }
        });

      } else {

        if (payload.role != "ADMINISTRATOR" && payload.allocated_credits) {
          updatePurchasePoints(payload , res);
        }
        const userData = UserSchema.buildUser(payload);
        if(!userData.available_credits){
          userData.available_credits = req.plan.purchase_points;
        }
        if(userData.available_countries && !(userData.available_countries).length){
          userData.available_countries = req.plan.countries_available ;
        }
        userData.is_account_owner = 0;
        UserModel.add(userData, (error, user) => {
          if (error) {
            res.status(500).json({
              message: 'Internal Server Error',
            });
          } else {

            let templateData = {
              activationUrl: EnvConfig.HOST_WEB_PANEL + 'password/reset-link?id' + '=' + userData._id,
              recipientEmail: userData.email_id,
              recipientName: userData.first_name + " " + userData.last_name,
            };
            let emailTemplate = EmailHelper.buildEmailAccountActivationTemplate(templateData);

            let emailData = {
              recipientEmail: userData.email_id,
              subject: 'Account Access Email Activation',
              html: emailTemplate
            };

            EmailHelper.triggerEmail(emailData, function (error, mailtriggered) {
              if (error) {
                res.status(500).json({
                  message: 'Internal Server Error',
                });
              } else {
                var activityDetails = {
                  "firstName": userData.first_name,
                  "lastName": userData.last_name,
                  "email": userData.email_id,
                  "login": Date.now(),
                  "ip": ips[ips.length - 1],
                  "browser": req.headers['user-agent'],
                  "url": "/user",
                  "role": userData.role,
                  "alarm": "false",
                  "scope": userData.scope,
                  "account_id": ObjectID(userData.account_id.toString()),
                  "userId": ObjectID(userData._id.toString()),

                }

                // Add user details in activity tracker
                ActivityModel.add(activityDetails, function (error, result) {
                  if (error) {
                    res.status(500).json({
                      message: 'Internal Server Error',
                    });
                  } else {
                    if (mailtriggered) {
                      res.status(200).json({
                        data: {
                          activation_email_id: payload.email_id
                        }
                      });
                    } else {
                      res.status(200).json({
                        data: {}
                      });
                    }
                  }
                });
              }
            });
          }
        });
      }
    }
  });
}

function updatePurchasePoints(payload , res) {
  accountModel.findPurchasePoints(payload.account_id, (error, purchasePoints) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    }
    else {
      if ((purchasePoints == 0 && payload.allocated_credits != 0) || purchasePoints < payload.allocated_credits) {
        res.status(400).json({
          message: 'Insufficient points , please purchase more to use .',
        });
      } else if (purchasePoints > payload.allocated_credits) {
        accountModel.updatePurchasePoints(payload.account_id, POINTS_CONSUME_TYPE_DEBIT, payload.allocated_credits, (error) => {
          if (error) {
            res.status(500).json({
              message: "Internal Server Error",
            });
          }
        });
      }
    }
  });
}

const update = (req, res) => {
  let userId = req.params.userId;
  let payload = req.body;
  const userUpdates = UserSchema.buildUserUpdate(payload);
  UserModel.update(userId, userUpdates, (error, useUpdateStatus) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        data: useUpdateStatus
      });
    }
  });
};

const remove = (req, res) => {
  let userId = req.params.userId;
  UserModel.remove(userId, (error, userEntry) => {
    if (error) {
      console.log(error);
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        data: {
          msg: 'Deleted Successfully!',
        }
      });
    }
  });
}

const updateEmailVerification = (req, res) => {
  let emailId = req.body.email_id;
  UserModel.updateEmailVerificationStatus(emailId, UserSchema.USER_EMAIL_VERIFIED, (error, modifiedStatus) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      if (modifiedStatus) {
        res.status(200).json({
          data: modifiedStatus
        });
      } else {
        res.status(404).json({
          data: {
            type: 'MISSING',
            msg: 'Access Unavailable',
            desc: 'Email Not Found'
          }
        });
      }
    }
  });
};

const activate = (req, res) => {
  let userId = req.params.userId;
  UserModel.updateActivationStatus(userId, UserSchema.USER_MODE_ACTIVATE, (error, modifiedStatus) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      if (modifiedStatus) {
        res.status(200).json({
          data: modifiedStatus
        });
      } else {
        res.status(404).json({
          data: {
            type: 'MISSING',
            msg: 'Access Unavailable',
            desc: 'Email Not Found'
          }
        });
      }
    }
  });
};

const deactivate = (req, res) => {
  let userId = req.params.userId;
  UserModel.updateActivationStatus(fileId, UserSchema.USER_MODE_DEACTIVATE, (error, modifiedStatus) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      if (modifiedStatus) {
        res.status(200).json({
          data: modifiedStatus
        });
      } else {
        res.status(404).json({
          data: {
            type: 'MISSING',
            msg: 'Access Unavailable',
            desc: 'Email Not Found'
          }
        });
      }
    }
  });
};

const verifyAccountEmailExistence = (req, res) => {
  let accountId = req.params.accountId;
  let emailId = (req.query.emailId) ? req.query.emailId.trim() : null;
  UserModel.findByEmailForAccount(accountId, emailId, null, (error, emailExistence) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        data: (emailExistence) ? true : false
      });
    }
  });
};

const verifyEmailExistence = (req, res) => {
  let emailId = (req.query.emailId) ? req.query.emailId.trim() : null;
  UserModel.findByEmail(emailId, null, (error, emailExistence) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        data: (emailExistence) ? true : false
      });
    }
  });
};

const fetchUsers = (req, res) => {
  // console.log("insnde fetch usr")
  let payload = req.body;

  const pageKey = (payload.draw && payload.draw != 0) ? payload.draw : null;
  let offset = null;
  let limit = null;
  //Datatable JS Mode
  if (pageKey != null) {
    offset = (payload.start != null) ? payload.start : 0;
    limit = (payload.length != null) ? payload.length : 10;
  } else {
    offset = (payload.offset != null) ? payload.offset : 0;
    limit = (payload.limit != null) ? payload.limit : 10;
  }

  // Temp Full Fetch Mode
  offset = 0;
  limit = 1000;

  UserModel.find(null, offset, limit, (error, users) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        data: users
      });
    }
  });
};

const fetchUser = (req, res) => {

  let userId = (req.params.userId) ? req.params.userId.trim() : null;

  UserModel.findById(userId, null, (error, user) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      if (user) {
        res.status(200).json({
          data: user
        });
      } else {
        res.status(404).json({
          data: {
            type: 'MISSING',
            msg: 'Access Unavailable',
            desc: 'User Not Found'
          }
        });
      }
    }
  });
};

const sendResetPassworDetails = (req, res) => {
  // console.log("object", req.body)
  let userEmail = (req.body.userEmail) ? req.body.userEmail.trim() : null;

  UserModel.findByEmail(userEmail, null, (error, userData) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      if (userData) {
        let templateData = {
          activationUrl: EnvConfig.HOST_WEB_PANEL + 'password/reset-link?id' + '=' + userData._id,
          recipientEmail: userData.email_id,
          recipientName: userData.first_name + " " + userData.last_name,
        };
        let emailTemplate = EmailHelper.buildEmailResetPasswordTemplate(templateData);

        let emailData = {
          recipientEmail: userData.email_id,
          subject: 'Account Access Email Activation',
          html: emailTemplate
        };

        EmailHelper.triggerEmail(emailData, function (error, mailtriggered) {
          if (error) {
            res.status(500).json({
              message: 'Internal Server Error',
            });
          } else {
            ResetPasswordModel.add({ user_id: userData._id }, (error, resetDetails) => {
              if (error) {
                res.status(500).json({
                  message: 'Internal Server Error',
                });
              } else {
                res.status(200).json({
                  data: resetDetails
                });
              }
            });
          }
        });
      } else {
        res.status(404).json({
          data: {
            type: 'MISSING',
            msg: 'Access Unavailable',
            desc: 'User Not Found'
          }
        });
      }
    }
  });
};

const resetPassword = (req, res) => {

  let userId = (req.body.userId) ? req.body.userId.trim() : null;
  let updatedPassword = (req.body.password) ? req.body.password.trim() : null;

  CryptoHelper.generateAutoSaltHashedPassword(updatedPassword, function (err, hashedPassword) {
    if (err) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      userUpdates = {}
      userUpdates.password = hashedPassword
      userUpdates.is_email_verified = 1
      userUpdates.is_active = 1
      ResetPasswordModel.remove(userId, (error, user) => {
        if (error) {
          res.status(500).json({
            message: 'Internal Server Error',
          });
        } else {
          UserModel.update(userId, userUpdates, (error, useUpdateStatus) => {
            if (error) {
              res.status(500).json({
                message: 'Internal Server Error',
              });
            } else {
              if (user) {
                res.status(200).json({
                  data: useUpdateStatus
                });
              } else {
                res.status(404).json({
                  data: {
                    type: 'MISSING',
                    msg: 'Access Unavailable',
                    desc: 'User Not Found'
                  }
                });
              }
            }
          });
        }
      });
    }
  });
};

module.exports = {
  create,
  update,
  updateEmailVerification,
  remove,
  activate,
  deactivate,
  verifyAccountEmailExistence,
  verifyEmailExistence,
  fetchUsers,
  fetchUser,
  resetPassword,
  sendResetPassworDetails
};
