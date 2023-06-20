const TAG = "userController";

const EnvConfig = require("../config/envConfig");
const POINTS_CONSUME_TYPE_DEBIT = -1;
const POINTS_CONSUME_TYPE_CREDIT = 1;
const UserModel = require("../models/userModel");
const ChartModel = require("../models/chartModel");

const AccountModel = require("../models/accountModel");
const accountModel = require("../models/accountModel");
const ResetPasswordModel = require("../models/resetPasswordModel");
const UserSchema = require("../schemas/userSchema");
const CryptoHelper = require("../helpers/cryptoHelper");
const EmailHelper = require("../helpers/emailHelper");
const NotificationModel = require("../models/notificationModel");
const TradeModel = require("../models/tradeModel");
const { logger } = require("../config/logger");

/** Function to create child user for a account */
async function createUser(req, res) {
  let payload = req.body;
  try {
    if (req.user.role == "ADMINISTRATOR") {
      let userCreationLimits = await UserModel.getUserCreationLimit(
        payload.account_id
      );

      if (userCreationLimits?.max_users?.remaining_limit > 0) {
        userCreationLimits.max_users.remaining_limit =
          userCreationLimits?.max_users?.remaining_limit - 1;

        payload.parentId = req.user.user_id;
        UserModel.findByEmail(
          payload.email_id,
          null,
          async (error, userEntry) => {
            if (error) {
              logger.log(
                req.user.user_id,
                ` USER CONTROLLER ================== ${JSON.stringify(error)}`
              );
              res.status(500).json({
                message: "Internal Server Error",
              });
            } else {
              try {
                if (
                  payload.role != "ADMINISTRATOR" &&
                  payload.allocated_credits
                ) {
                  await updateUserCreationPurchasePoints(payload);
                }
                addAccountUsers(
                  payload,
                  res,
                  userCreationLimits,
                  payload?.bl_selected
                );
              } catch (error) {
                logger.log(
                  ` USER CONTROLLER ================== ${JSON.stringify(error)}`
                );
                if (
                  error == "Insufficient points , please purchase more to use ."
                ) {
                  res.status(409).json({
                    message:
                      "Insufficient points , please purchase more to use .",
                  });
                } else if (error == "Points cant be negative.") {
                  res.status(409).json({
                    message: "Points cant be negative.",
                  });
                } else if (error == "Credits can only be positve Number") {
                  res.status(409).json({
                    message: "Credits can only be positve Number",
                  });
                } else {
                  res.status(500).json({
                    message: "Internal Server Error",
                  });
                }
              }
            }
          }
        );
      } else {
        res.status(409).json({
          message:
            "Max-User-Creation-Limit reached... Please contact administrator for further assistance.",
        });
      }
    } else {
      res.status(401).json({
        data: {
          type: "UNAUTHORISED",
          msg: "You are not allowed to change user info please ask admin to do it",
          desc: "Invalid Access",
        },
      });
    }
  } catch (error) {
    logger.log(` USER CONTROLLER == ${JSON.stringify(error)}`);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

// addCharts;
async function addCharts(req, res) {
  const userId = req.user.user_id;
  try {
    req.body.userId = userId;
    ChartModel.add(req.body, async (error) => {
      if (error) {
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        res.status(200).json({
          message: "Chart Addedd successfully!",
        });
      }
    });
  } catch (error) {
    logger.log(` USER CONTROLLER == ${JSON.stringify(error)}`);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}
async function getCharts(req, res) {
  const userId = req.user.user_id;
  try {
    req.body.userId = userId;
    ChartModel.find({ userId: req.user.user_id }, async (error, data) => {
      if (error) {
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        res.status(200).json({
          message: "Chart list get successfully!",
          data: data,
        });
      }
    });
  } catch (error) {
    logger.log(` USER CONTROLLER == ${JSON.stringify(error)}`);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}
async function addAccountUsers(payload, res, userCreationLimits, isBlIncluded) {
  const userData = UserSchema.buildUser(payload);
  const blCountryArray = await TradeModel.getBlCountriesISOArray();

  // if (userData.available_countries.length >= blCountryArray.length) {
  //   let blFlag = true
  //   for (let i of blCountryArray) {
  //     if (!userData.available_countries.includes(i)) {
  //       blFlag = false
  //     }
  //   }
  //   if (blFlag) {
  //     for (let i of blCountryArray) {
  //       let index = userData.available_countries.indexOf(i);
  //       console.log(index)
  //       if (index > -1) {
  //         userData.available_countries.splice(index, 1);
  //       }
  //     }
  //   }
  // }

  accountModel.findById(payload.account_id, null, (error, account) => {
    if (error) {
      logger.log(
        ` USER CONTROLLER ================== ${JSON.stringify(error)}`
      );
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      if (
        userData.available_countries &&
        !userData.available_countries.length
      ) {
        userData.available_countries =
          account.plan_constraints.countries_available;
      }

      if (isBlIncluded) {
        let blFlag = true;
        for (let i of blCountryArray) {
          if (!userData.available_countries.includes(i)) {
            blFlag = false;
          }
        }
        if (!blFlag) {
          userData.available_countries = [
            ...userData.available_countries,
            ...blCountryArray,
          ];
        }
      }

      if (!userData.available_credits) {
        userData.available_credits = account.plan_constraints.purchase_points;
      }

      userData.is_account_owner = 0;
      UserModel.add(userData, async (error) => {
        if (error) {
          logger.log(
            ` USER CONTROLLER ================== ${JSON.stringify(error)}`
          );
          res.status(500).json({
            message: "Internal Server Error",
          });
        } else {
          let resetPasswordId = 0;
          try {
            //to authenticate user
            resetPasswordId = await getResetPasswordId(userData);
            await sendEmail(
              userData,
              res,
              payload,
              userCreationLimits,
              resetPasswordId
            );
          } catch (error) {
            logger.log(
              "UserController , Method = addEntryInResetPassword , Error = " +
                error
            );
            res.status(500).json({
              message: "Internal Server Error",
            });
          }
        }
      });
    }
  });
}

/** Functin to create a resetPassword id so that we need not to expose our original ids */
async function getResetPasswordId(userData) {
  try {
    let passwordDetails = {
      userId: userData._id,
      updatedPassword: "",
      otp: 0,
    };

    const resetPasswordID = await ResetPasswordModel.createResetPasswordEntry(
      passwordDetails
    );

    return resetPasswordID.toString();
  } catch (error) {
    throw error;
  }
}

async function sendEmail(
  userData,
  res,
  payload,
  userCreationLimits,
  resetPasswordId
) {
  let templateData = {
    activationUrl:
      EnvConfig.HOST_WEB_PANEL +
      "password/reset-link?id" +
      "=" +
      resetPasswordId,
    recipientEmail: userData.email_id,
    recipientName: userData.first_name + " " + userData.last_name,
  };

  let emailTemplate =
    EmailHelper.buildEmailAccountActivationTemplate(templateData);

  let emailData = {
    recipientEmail: userData.email_id,
    subject: "Account Access Email Activation",
    html: emailTemplate,
  };

  EmailHelper.triggerEmail(emailData, async function (error, mailtriggered) {
    if (error) {
      logger.log(` USER CONTROLLER == ${JSON.stringify(error)}`);
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      try {
        await addUserCreationNotification(userData);

        if (mailtriggered) {
          try {
            await UserModel.updateUserCreationLimit(
              payload.account_id,
              userCreationLimits
            );
          } catch (error) {
            logger.log(` USER CONTROLLER == ${JSON.stringify(error)}`);
          }

          res.status(200).json({
            data: {
              activation_email_id: payload.email_id,
              userCreationConsumedLimit:
                userCreationLimits.max_users.alloted_limit -
                userCreationLimits.max_users.remaining_limit,
              userCreationAllotedLimit:
                userCreationLimits.max_users.alloted_limit,
            },
          });
        } else {
          res.status(200).json({
            data: {},
            userCreationConsumedLimit:
              userCreationLimits.max_users.alloted_limit -
              userCreationLimits.max_users.remaining_limit,
            userCreationAllotedLimit:
              userCreationLimits.max_users.alloted_limit,
          });
        }
      } catch (error) {
        logger.log(` USER CONTROLLER == ${JSON.stringify(error)}`);
        res.status(500).json({
          message: "Internal Server Error",
        });
      }
    }
  });
}

async function addUserCreationNotification(userData) {
  try {
    let notificationInfo = {};
    notificationInfo.account_id = [userData.account_id];
    notificationInfo.heading = "Child User";
    notificationInfo.description =
      "You have created a sub-user : " +
      userData.first_name +
      " " +
      userData.last_name;
    let notificationType = "account";
    await NotificationModel.add(notificationInfo, notificationType);
  } catch (error) {
    throw error;
  }
}

async function updateUserCreationPurchasePoints(payload) {
  try {
    const purchasePoints = await accountModel.findPurchasePointsByAccountId(
      payload.account_id
    );

    if (
      (purchasePoints == 0 && payload.allocated_credits != 0) ||
      purchasePoints < payload.allocated_credits
    ) {
      throw "Insufficient points , please purchase more to use .";
    } else if (payload.allocated_credits < 0) {
      throw "Points cant be negative.";
    } else if (purchasePoints > payload.allocated_credits) {
      await accountModel.updatePurchasePointsByAccountId(
        payload.account_id,
        POINTS_CONSUME_TYPE_DEBIT,
        payload.allocated_credits
      );

      UserModel.findByAccount(payload.account_id, null, (error, users) => {
        if (error) {
          logger.log(
            ` USER CONTROLLER ================== ${JSON.stringify(error)}`
          );
          throw error;
        } else {
          users.forEach(async (user) => {
            if (user.available_credits === purchasePoints) {
              await UserModel.updateUserPurchasePointsById(
                user._id,
                POINTS_CONSUME_TYPE_DEBIT,
                payload.allocated_credits
              );
            }
            if (user._id.toString() === payload.userId) {
              await UserModel.insertUserPurchase(
                user._id,
                payload.allocated_credits
              );
            }
          });
        }
      });
    } else {
      throw "Credits can only be positve Number";
    }
  } catch (error) {
    throw error;
  }
}

/** Function to update child user for a account */
async function updateUser(req, res) {
  let userId = req.params.userId;
  let payload = req.body;
  const userUpdates = UserSchema.buildUserUpdate(payload);
  if (payload.hasOwnProperty("email_id") && payload.role == "ADMINISTRATOR") {
    res.status(405).json({
      data: {
        msg: "You are not allowed to change user email please ask admin to do it",
        desc: "Method not allowed",
      },
    });
  } else {
    if (req.user.role == "ADMINISTRATOR") {
      UserModel.update(userId, userUpdates, (error, useUpdateStatus) => {
        if (error) {
          logger.log(
            req.user.user_id,
            ` USER CONTROLLER ================== ${JSON.stringify(error)}`
          );
          res.status(500).json({
            message: "Internal Server Error",
          });
        } else {
          res.status(200).json({
            data: useUpdateStatus,
          });
        }
      });
    } else {
      res.status(401).json({
        data: {
          type: "UNAUTHORISED",
          msg: "Yopu are not allowed to change user info please ask admin to do it",
          desc: "Invalid Access",
        },
      });
    }
  }
}

/** Function to delete child user for a account */
async function removeUser(req, res) {
  try {
    let userId = req.params.userId;
    if (req.user.role == "ADMINISTRATOR") {
      try {
        await updateUserDeletionPurchasePoints(userId, req.user.account_id);
      } catch (error) {
        logger.log(
          req.user.user_id,
          ` USER CONTROLLER ================== ${JSON.stringify(error)}`
        );
        res.status(500).json({
          message: "Internal Server Error",
        });
      }

      const userData = await UserModel.findUserById(userId);

      UserModel.remove(userId, async (error) => {
        if (error) {
          logger.log(
            req.user.user_id,
            ` USER CONTROLLER == ${JSON.stringify(error)}`
          );
          res.status(500).json({
            message: "Internal Server Error",
          });
        } else {
          // Updating account creation limits
          let userCreationLimits = await UserModel.getUserCreationLimit(
            req.user.account_id
          );
          userCreationLimits.max_users.remaining_limit =
            userCreationLimits?.max_users?.remaining_limit + 1;
          await UserModel.updateUserCreationLimit(
            req.user.account_id,
            userCreationLimits
          );

          await addUserDeletionNotification(userData);

          res.status(200).json({
            data: {
              msg: "Deleted Successfully!",
            },
          });
        }
      });
    } else {
      res.status(401).json({
        data: {
          type: "UNAUTHORISED",
          msg: "Yopu are not allowed to change user info please ask admin to do it",
          desc: "Invalid Access",
        },
      });
    }
  } catch (error) {
    logger.log(` USER CONTROLLER ================== ${JSON.stringify(error)}`);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

async function updateUserDeletionPurchasePoints(userID, accountID) {
  try {
    let user = await UserModel.findUserById(userID);

    let creditPointsToBeReversed = user.available_credits;
    const purchasePoints = await accountModel.findPurchasePointsByAccountId(
      accountID
    );

    if (creditPointsToBeReversed != purchasePoints) {
      await accountModel.updatePurchasePointsByAccountId(
        accountID,
        POINTS_CONSUME_TYPE_CREDIT,
        creditPointsToBeReversed
      );

      UserModel.findByAccount(accountID, null, (error, users) => {
        if (error) {
          logger.log(
            ` USER CONTROLLER ================== ${JSON.stringify(error)}`
          );
          throw error;
        } else {
          users.forEach(async (user) => {
            if (user.available_credits === purchasePoints) {
              await UserModel.updateUserPurchasePointsById(
                user._id,
                POINTS_CONSUME_TYPE_CREDIT,
                creditPointsToBeReversed
              );
            }
          });
        }
      });
    }
  } catch (error) {
    throw error;
  }
}

async function addUserDeletionNotification(userData) {
  try {
    let notificationInfo = {};
    notificationInfo.account_id = [userData.account_id];
    notificationInfo.heading = "Child User";
    notificationInfo.description =
      "You have deleted a sub-user : " +
      userData.first_name +
      " " +
      userData.last_name;
    let notificationType = "account";
    await NotificationModel.add(notificationInfo, notificationType);
  } catch (error) {
    throw error;
  }
}

const updateEmailVerification = (req, res) => {
  let emailId = req.body.email_id;
  UserModel.updateEmailVerificationStatus(
    emailId,
    UserSchema.USER_EMAIL_VERIFIED,
    (error, modifiedStatus) => {
      if (error) {
        logger.log(
          ` USER CONTROLLER ================== ${JSON.stringify(error)}`
        );
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        if (modifiedStatus) {
          res.status(200).json({
            data: modifiedStatus,
          });
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
    }
  );
};

const activate = (req, res) => {
  let userId = req.params.userId;
  UserModel.updateActivationStatus(
    userId,
    UserSchema.USER_MODE_ACTIVATE,
    (error, modifiedStatus) => {
      if (error) {
        logger.log(
          ` USER CONTROLLER ================== ${JSON.stringify(error)}`
        );
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        if (modifiedStatus) {
          res.status(200).json({
            data: modifiedStatus,
          });
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
    }
  );
};

const deactivate = (req, res) => {
  let userId = req.params.userId;
  UserModel.updateActivationStatus(
    fileId,
    UserSchema.USER_MODE_DEACTIVATE,
    (error, modifiedStatus) => {
      if (error) {
        logger.log(
          ` USER CONTROLLER ================== ${JSON.stringify(error)}`
        );
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        if (modifiedStatus) {
          res.status(200).json({
            data: modifiedStatus,
          });
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
    }
  );
};

const verifyAccountEmailExistence = (req, res) => {
  let accountId = req.params.accountId;
  let emailId = req.query.emailId ? req.query.emailId.trim() : null;
  UserModel.findByEmailForAccount(
    accountId,
    emailId,
    null,
    (error, emailExistence) => {
      if (error) {
        logger.log(
          ` USER CONTROLLER ================== ${JSON.stringify(error)}`
        );
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        res.status(200).json({
          data: emailExistence ? true : false,
        });
      }
    }
  );
};

const verifyEmailExistence = (req, res) => {
  let emailId = req.query.emailId ? req.query.emailId.trim() : null;
  UserModel.findByEmail(emailId, null, (error, emailExistence) => {
    if (error) {
      logger.log(
        ` USER CONTROLLER ================== ${JSON.stringify(error)}`
      );
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      res.status(200).json({
        data: emailExistence ? true : false,
      });
    }
  });
};

const fetchUsers = (req, res) => {
  // logger.log("insnde fetch usr")
  let payload = req.body;

  const pageKey = payload.draw && payload.draw != 0 ? payload.draw : null;
  let offset = null;
  let limit = null;
  //Datatable JS Mode
  if (pageKey != null) {
    offset = payload.start != null ? payload.start : 0;
    limit = payload.length != null ? payload.length : 10;
  } else {
    offset = payload.offset != null ? payload.offset : 0;
    limit = payload.limit != null ? payload.limit : 10;
  }

  // Temp Full Fetch Mode
  offset = 0;
  limit = 1000;

  UserModel.find(null, offset, limit, (error, users) => {
    if (error) {
      logger.log(
        req.user.user_id,
        ` USER CONTROLLER ================== ${JSON.stringify(error)}`
      );
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      res.status(200).json({
        data: users,
      });
    }
  });
};

const fetchUser = (req, res) => {
  let userId = req.params.userId ? req.params.userId.trim() : null;

  UserModel.findById(userId, null, (error, user) => {
    if (error) {
      logger.log(
        req.user.user_id,
        ` USER CONTROLLER ================== ${JSON.stringify(error)}`
      );
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      if (user) {
        res.status(200).json({
          data: user,
        });
      } else {
        res.status(404).json({
          data: {
            type: "MISSING",
            msg: "Access Unavailable",
            desc: "User Not Found",
          },
        });
      }
    }
  });
};

const sendResetPassworDetails = (req, res) => {
  // logger.log("object", req.body)
  let userEmail = req.body.userEmail ? req.body.userEmail.trim() : null;

  UserModel.findByEmail(userEmail, null, async (error, userData) => {
    if (error) {
      logger.log(
        ` USER CONTROLLER ================== ${JSON.stringify(error)}`
      );
      res.status(500).json({
        message: "Internal Server Error",
      });
    } else {
      if (userData) {
        let resetPasswordId = 0;
        try {
          //to authenticate user
          resetPasswordId = await getResetPasswordId(userData);
        } catch (error) {
          logger.log(
            "UserController , Method = addEntryInResetPassword , Error = " +
              error
          );
        }

        let templateData = {
          activationUrl:
            EnvConfig.HOST_WEB_PANEL +
            "password/reset-link?id" +
            "=" +
            resetPasswordId,
          recipientEmail: userData.email_id,
          recipientName: userData.first_name + " " + userData.last_name,
        };
        let emailTemplate =
          EmailHelper.buildEmailResetPasswordTemplate(templateData);

        let emailData = {
          recipientEmail: userData.email_id,
          subject: "Account Access Email Activation",
          html: emailTemplate,
        };

        EmailHelper.triggerEmail(emailData, function (error, mailtriggered) {
          if (error) {
            logger.log(
              ` USER CONTROLLER ================== ${JSON.stringify(error)}`
            );
            res.status(500).json({
              message: "Internal Server Error",
            });
          } else {
            res.status(200).json({
              data: 1,
            });
          }
        });
      } else {
        res.status(200).json({
          data: {
            type: "MISSING",
            msg: "Access Unavailable",
            desc: "User Not Found",
          },
        });
      }
    }
  });
};

const resetPassword = async (req, res) => {
  let passwordId = req.body.passwordId ? req.body.passwordId.trim() : null;
  let updatedPassword = req.body.password ? req.body.password.trim() : null;
  if (
    !/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/.test(updatedPassword)
  ) {
    res.status(500).json({
      type: "Update the Password",
      msg: "Password must contains least 8 characters, at least one number and both lower and uppercase letters and special characters",
    });
  } else {
    CryptoHelper.generateAutoSaltHashedPassword(
      updatedPassword,
      async (err, hashedPassword) => {
        if (err) {
          logger.log("USER CONTROLLER ==================", JSON.stringify(err));
          res.status(500).json({
            type: "Something went wrong",
            msg: "Got Error while updating password",
          });
        } else {
          try {
            let passwordDetails =
              await ResetPasswordModel.getResetPassWordDetails(passwordId);
            let userData = await UserModel.findUserById(passwordDetails.userId);
            userData.password =
              (userData.password == null) | undefined ? "" : userData.password;
            CryptoHelper.verifyPasswordMatch(
              userData.password,
              updatedPassword,
              async (error, verifiedMatch) => {
                if (error) {
                  logger.log(
                    ` AUTH CONTROLLER ================== ${JSON.stringify(
                      error
                    )}`
                  );
                  res.status(500).json({
                    type: "Something went wrong",
                    msg: "Internal Server Error",
                  });
                } else {
                  if (verifiedMatch) {
                    res.status(500).json({
                      type: "Update the password",
                      msg: "Password can't be same as old one.",
                    });
                  } else {
                    if (passwordDetails) {
                      passwordDetails.updatedPassword = hashedPassword;
                      passwordDetails.otp = Math.floor(
                        100000 + Math.random() * 900000
                      );

                      updatePasswordDetailsResult =
                        await ResetPasswordModel.updateResetPasswordDetails(
                          passwordDetails
                        );

                      let templateData = {
                        otp: passwordDetails.otp,
                        recipientEmail: userData?.email_id,
                        recipientName:
                          userData?.first_name + " " + userData?.last_name,
                      };

                      let emailTemplate =
                        EmailHelper.buildEmailResetPasswordOTPTemplate(
                          templateData
                        );

                      let emailData = {
                        recipientEmail: userData.email_id,
                        subject: "Account Access Email Activation",
                        html: emailTemplate,
                      };

                      EmailHelper.triggerEmail(emailData, async (error) => {
                        if (error) {
                          await ResetPasswordModel.deleteResetPassWordDetails(
                            passwordId
                          );
                          logger.log(
                            ` USER CONTROLLER ================== ${JSON.stringify(
                              error
                            )}`
                          );
                          res.status(500).json({
                            type: "Something went wrong",
                            msg: "Error while sending mail , please recreate password reset link.",
                          });
                        } else {
                          res.status(200).json({
                            msg: "Otp sent successfully to registered email-id",
                          });
                        }
                      });
                    } else {
                      res.status(401).json({
                        type: "UNAUTHORISED",
                        msg: "Password link expired !!",
                        desc: "Invalid Access",
                      });
                    }
                  }
                }
              }
            );
          } catch (error) {
            await ResetPasswordModel.deleteResetPassWordDetails(passwordId);
            logger.log(
              "UserController , Method = resetPassword , Error = " + error
            );
            res.status(500).json({
              type: "Something went wrong",
              msg: "Error while sending mail , please recreate password reset link.",
            });
          }
        }
      }
    );
  }
};

async function verifyResetPassword(req, res) {
  let passwordId = req.body.passwordId ? req.body.passwordId.trim() : null;
  let otp = req.body.otp ? req.body.otp : 0;

  try {
    let passwordDetails = await ResetPasswordModel.getResetPassWordDetails(
      passwordId
    );

    if (passwordDetails && passwordDetails.otp == otp) {
      await ResetPasswordModel.deleteResetPassWordDetails(passwordId);

      let userUpdatedData = {};
      userUpdatedData.password = passwordDetails.updatedPassword;
      userUpdatedData.is_email_verified = 1;
      userUpdatedData.is_active = 1;

      UserModel.update(
        passwordDetails.userId,
        userUpdatedData,
        async (error, userUpdateStatus) => {
          if (error) {
            await ResetPasswordModel.deleteResetPassWordDetails(passwordId);
            logger.log(
              "UserController , Method = verifyResetPassword , Error = " + error
            );
            res.status(500).json({
              message:
                "Error while verifying user , please recreate password reset link.",
            });
          } else {
            if (userUpdateStatus) {
              let notificationInfo = {};
              notificationInfo.user_id = [passwordDetails.userId];
              notificationInfo.heading = "Change Password";
              notificationInfo.description =
                "Dear User, your password has been changed/updated succesfully";
              let notificationType = "user";
              await NotificationModel.add(notificationInfo, notificationType);

              await AccountModel.addUserSessionFlag(
                passwordDetails.userId,
                false
              );
              res.status(200).json({
                message: "Password updated successfully.",
              });
            } else {
              await ResetPasswordModel.deleteResetPassWordDetails(passwordId);
              res.status(409).json({
                data: {
                  type: "MISSING",
                  msg: "User not found",
                  desc: "Invalid Access",
                },
              });
            }
          }
        }
      );
    } else {
      if (passwordDetails) {
        await ResetPasswordModel.deleteResetPassWordDetails(passwordId);
      }
      res.status(401).json({
        data: {
          type: "UNAUTHORISED",
          msg: "Password link expired !!",
          desc: "Invalid Access",
        },
      });
    }
  } catch (error) {
    await ResetPasswordModel.deleteResetPassWordDetails(passwordId);
    logger.log(
      "UserController , Method = verifyResetPassword , Error = " + error
    );
    res.status(500).json({
      message:
        "Error while verifying user , please recreate password reset link.",
    });
  }
}

//Controller function to update account users credit
async function addCreditsToAccountUsers(req, res) {
  let userId = req.params.userId;
  let payload = req.body;
  payload.userId = userId;

  try {
    await updateUserCreationPurchasePoints(payload);
    res.status(200).json({
      message: "Points added successfully",
    });
    // await UserModel.updateUserPurchasePointsById(userId, POINTS_CONSUME_TYPE_CREDIT, payload.allocated_credits);
  } catch (error) {
    logger.log(` USER CONTROLLER ================== ${JSON.stringify(error)}`);
    if (error == "Insufficient points , please purchase more to use .") {
      res.status(409).json({
        message: "Insufficient points , please purchase more to use .",
      });
    } else if (error == "Credits can only be positve Number") {
      res.status(409).json({
        message: "Credits can only be positve Number",
      });
    } else if (error == "Points cant be negative.") {
      res.status(409).json({
        message: "Points cant be negative.",
      });
    } else {
      res.status(500).json({
        message: "Internal Server Error",
      });
    }
  }
}

module.exports = {
  createUser,
  updateUser,
  removeUser,
  updateEmailVerification,
  activate,
  deactivate,
  verifyAccountEmailExistence,
  verifyEmailExistence,
  fetchUsers,
  fetchUser,
  resetPassword,
  sendResetPassworDetails,
  verifyResetPassword,
  getResetPasswordId,
  addCreditsToAccountUsers,
  addCharts,
  getCharts,
};
