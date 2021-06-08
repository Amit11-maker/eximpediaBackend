const TAG = 'userController';

const EnvConfig = require('../config/envConfig');

const UserModel = require('../models/userModel');
const UserSchema = require('../schemas/userSchema');

const CryptoHelper = require('../helpers/cryptoHelper');
const EmailHelper = require('../helpers/emailHelper');

const QUERY_PARAM_TERM_VERIFICATION_EMAIL = 'verification_email';

const create = (req, res) => {
  let payload = req.body;


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

        const userData = UserSchema.buildUser(payload);

        CryptoHelper.generateAutoSaltHashedPassword(payload.password, function (err, hashedPassword) {
          if (err) {
            res.status(500).json({
              message: 'Internal Server Error',
            });
          } else {
            userData.password = hashedPassword;
            userData.is_account_owner = 0;

            UserModel.add(userData, (error, user) => {
              if (error) {
                res.status(500).json({
                  message: 'Internal Server Error',
                });
              } else {

                let templateData = {
                  activationUrl: EnvConfig.HOST_WEB_PANEL + 'consumers/accounts/email/verification?' + QUERY_PARAM_TERM_VERIFICATION_EMAIL + '=' + userData.email_id,
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

};

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
  UserModel.delete(userId, (error, userEntry) => {
    if (error) {
      console.log(error);
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        data: (userEntry.deletedCount != 0) ? userId : null
      });
    }
  });
};

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

  UserModel.find(filter, offset, limit, (error, users) => {
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
  fetchUser
};
