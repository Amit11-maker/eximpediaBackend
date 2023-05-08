const TAG = "activityController";
const ActivityModel = require("../models/activityModel");
const UserModel = require("../models/userModel");
const ActivitySchema = require("../schemas/acitivitySchema");
const ExcelJS = require("exceljs");
const { logger } = require("../config/logger");

/* controller to create user activity */
async function createActivity(req, res) {
  let payload = req.body;
  let activity = ActivitySchema.buildActivity(payload);
  try {
    let addActivityResult = await ActivityModel.addActivity(activity);

    res.status(200).json({
      id: account.insertedId,
    });
  } catch (error) {
    logger.error(
      `ACTIVITY CONTROLLER ================== ${JSON.stringify(error)}`
    );
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

/* controller to fetch account activity data */
async function fetchAccountActivityData(req, res) {
  let accountId = req.params.accountId;
  let dateFrom = req.params.date_from ? req.params.date_from : null;
  let dateTo = req.params.date_to ? req.params.date_to : null;

  try {
    let accountActivityData = await ActivityModel.fetchAccountActivityData(
      accountId,
      dateFrom,
      dateTo
    );

    res.status(200).json({
      data: accountActivityData,
    });
  } catch (error) {
    logger.error(
      `ACTIVITY CONTROLLER ================== ${JSON.stringify(error)}`
    );
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

/* controller to fetch particular user activity data */
async function fetchUserActivityData(req, res) {
  let userId = req.params.userId;
  let dateFrom = req.params.date_from ? req.params.date_from : null;
  let dateTo = req.params.date_to ? req.params.date_to : null;

  if (req.user.user_id == userId || req?.user?.scope == "PROVIDER") {
    try {
      let userActivityData = await ActivityModel.fetchUserActivityData(
        userId,
        dateFrom,
        dateTo
      );

      res.status(200).json({
        data: userActivityData,
      });
    } catch (error) {
      logger.error(
        `ACTIVITY CONTROLLER ================== ${JSON.stringify(error)}`
      );
      res.status(500).json({
        message: "Internal Server Error",
      });
    }
  } else {
    res.status(401).json({
      data: {
        type: "UNAUTHORIZED",
        desc: "Invalid Access",
      },
    });
  }
}

/* controller to fetch particular user activity data by emailId*/
async function fetchUserActivityDataByEmailId(req, res) {
  let emailId = req.params.emailId;
  try {
    let userActivityData = await ActivityModel.fetchUserActivityDataByEmailId(
      emailId
    );

    res.status(200).json({
      data: userActivityData,
    });
  } catch (error) {
    logger.error(
      `ACTIVITY CONTROLLER ================== ${JSON.stringify(error)}`
    );
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

/* controller function to fetch all accounts list for activity tracking */
async function fetchAllCustomerAccountsForActivity(req, res) {
  let offset = req.body.offset ?? 0;
  let limit = req.body.limit ?? 1000;
  let dateFrom = req.body.date_from ? req.body.date_from : null;
  let dateTo = req.body.date_to ? req.body.date_to : null;

  try {
    let activityData = [];
    let activityDetailsForAccounts =
      await ActivityModel.getActivityDetailsForAccounts(offset, limit, dateFrom, dateTo);
    for (let activity of activityDetailsForAccounts) {
      let accountActivity = {};
      let userData = await UserModel.findUserByAccountId(
        activity["account"][0]["_id"]
      );
      accountActivity.activity_count = activity["count"];
      accountActivity.userData = userData;
      accountActivity.email_id = activity["account"][0]["access"]["email_id"];

      activityData.push(accountActivity);
    }
    // activityData.sort((data1, data2) => { return sortArrayUsingObjectKey(data1, data2, 'activity_count') });
    let accounts = await ActivityModel.getAllAccountsDetails();
    res.status(200).json({
      data: activityData,
      recordsFiltered: accounts.totalAccountCount,
      totalAccountCount: accounts.totalAccountCount,
    });
  } catch (error) {
    logger.error(
      `ACTIVITY CONTROLLER ================== ${JSON.stringify(error)}`
    );
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

/** controller function to fetch all accounts list for activity tracking */
async function fetchAllAccountUsersForActivity(req, res) {
  let accountId = req.params.accountId;
  let dateFrom = req.params.date_from ? req.params.date_from : null;
  let dateTo = req.params.date_to ? req.params.date_to : null;

  try {
    let accountUsers = await ActivityModel.getAllAccountUsersDetails(accountId);
    if (accountUsers && accountUsers.length > 0) {
      let updatedAccountUsersDetails = [];
      for (let user of accountUsers) {
        let updatedUser = { ...user };
        updatedUser.activity_count =
          await ActivityModel.findActivitySearchQueryCount(user.user_id, true, dateFrom, dateTo);
        updatedAccountUsersDetails.push(updatedUser);
      }
      accountUsers = updatedAccountUsersDetails;
      accountUsers.sort((data1, data2) => {
        return sortArrayUsingObjectKey(data1, data2, "activity_count");
      });
      res.status(200).json({
        data: accountUsers,
      });
    } else {
      res.status(409).json({
        data: "No users available for this account .",
      });
    }
  } catch (error) {
    logger.error(
      `ACTIVITY CONTROLLER ================== ${JSON.stringify(error)}`
    );
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

function sortArrayUsingObjectKey(object1, object2, key) {
  let data1 = object1[key];
  let data2 = object2[key];

  if (data1 > data2) {
    return -1;
  }
  if (data1 < data2) {
    return 1;
  }
  return 0;
}

/** Controller function to download activity data for user */
async function downloadActivityTableForUser(req, res) {
  let userId = req.body.userId;
  let emailId = req.body.emailId;
  let dateFrom = req.body.date_from ? req.body.date_from : null;
  let dateTo = req.body.date_to ? req.body.date_to : null;

  let userActivityData;
  if (!userId || userId == null) {
    userActivityData = await ActivityModel.fetchUserActivityDataByEmailId(
      emailId
    );
  } else {
    userActivityData = await ActivityModel.fetchUserActivityData(userId , dateFrom , dateTo);
  }
  convertUserDataToExcel(userActivityData, res);
}

/** Function to convert user activity data into Excel format */
async function convertUserDataToExcel(userActivityData, res) {
  logger.info("Method = convertUserDataToExcel , Entry");
  try {
    let text = "Activity Data";
    let workbook = new ExcelJS.Workbook();
    let worksheet = workbook.addWorksheet("User Activity");
    let getCellCountryText = worksheet.getCell("C2");
    worksheet.getCell("A5").value = "";
    getCellCountryText.value = text;
    getCellCountryText.font = {
      name: "Calibri",
      size: 22,
      underline: "single",
      bold: true,
      color: { argb: "005d91" },
      height: "auto",
    };
    getCellCountryText.alignment = { vertical: "middle", horizontal: "center" };
    worksheet.mergeCells("C2", "E3");

    //Add Image
    let myLogoImage = workbook.addImage({
      filename: "./public/images/logo-new.jpg",
      extension: "jpeg",
    });
    // worksheet.mergeCells("A1:B4");
    worksheet.addImage(myLogoImage, "A1:A4");
    worksheet.add;

    let headers = [
      "Email",
      "Role",
      "Country",
      "Trade Type",
      "Query",
      "QueryResponseTime",
      "QueryCreatedAt",
      "WorkspaceCreationQuery",
    ];
    let headerRow = worksheet.addRow(headers);

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "005d91" },
        bgColor: { argb: "" },
      };
      cell.font = {
        bold: true,
        color: { argb: "FFFFFF" },
        size: 12,
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: "left",
      };
    });

    worksheet.columns = [
      { key: "email_id", width: 30 },
      { key: "role", width: 30 },
      { key: "country", width: 30 },
      { key: "tradeType", width: 30 },
      { key: "query", width: 30 },
      { key: "queryResponseTime", width: 30 },
      { key: "queryCreatedAt", width: 30 },
      { key: "workspaceCreationQuery", width: 30 },
    ];
    userActivityData.forEach((user) => {
      user.workspaceCreationQuery = user.workspaceCreationQuery ?? "FALSE";
      user.email_id = user.email_id[0];
      user.role = user.role[0];
      user.queryCreatedAt = new Date(user.queryCreatedAt).toString();
      user.queryResponseTime = Math.abs(user.queryResponseTime) + " s";
      let userRow = worksheet.addRow(user);

      userRow.eachCell((cell) => {
        if (
          cell._column._key == "queryResponseTime" ||
          cell._column._key == "workspaceCreationQuery"
        ) {
          cell.alignment = {
            vertical: "middle",
            horizontal: "center",
          };
        } else {
          cell.alignment = {
            vertical: "middle",
            horizontal: "left",
          };
        }
      });
    });

    worksheet.getColumn(1).width = 35;
    workbook.xlsx.write(res, function () {
      res.end();
    });
  } catch (error) {
    logger.error(`Method = convertUserDataToExcel , Error = ${error}`);
    res.status(500).json({
      message: "Internal Server Error",
    });
  } finally {
    logger.info("Method = convertUserDataToExcel , Exit");
  }
}

// Function to fetch user by email_id
const fetchUserByEmailId = async (req, res) => {
  try {
    let emailId = req.body.email_id.toLowerCase().trim();
    let fromDate = req.body.fromDate ? req.body.fromDate : null;
    let todate = req.body.toDate ? req.body.toDate : null;

    const userDetail = await ActivityModel.findUserByEmailInActivity(emailId);
    if (!userDetail) {
      res.status(404).json({
        message: "Email does not exists",
      });
    }

    const userActivityCount = await ActivityModel.findActivitySearchQueryCount(
      userDetail.account_id,
      false,
      fromDate,
      todate
    );

    return res.json({
      activity_count: userActivityCount,
      email_id: emailId,
      userData: [userDetail],
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

/* Fetch email suggestions for user activity data */
async function fetchUserByEmailSuggestion(req, res) {
  try {
    const users = await ActivityModel.getUsersByEmailSuggestion(
      req.params.emailId
    );
    if (users.userDetails && users.userDetails.length > 0) {
      let suggestedEmails = [];
      for (let emailSuggestion of users.userDetails) {
        suggestedEmails.push(emailSuggestion.access.email_id)
      }
      res.status(200).json({
        data: suggestedEmails,
      });
    } else {
      res.status(200).json({
        msg: "No user available.",
      });
    }
  } catch (error) {
    logger.error(
      `ACTIVITY CONTROLLER ================== ${JSON.stringify(error)}`
    );
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

module.exports = {
  createActivity,
  fetchAccountActivityData,
  fetchUserActivityData,
  fetchUserActivityDataByEmailId,
  fetchUserByEmailId,
  fetchAllCustomerAccountsForActivity,
  fetchAllAccountUsersForActivity,
  downloadActivityTableForUser,
  fetchUserByEmailSuggestion,
};
