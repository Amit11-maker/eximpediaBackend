const TAG = 'activityController';
const ActivityModel = require('../models/activityModel');
const ActivitySchema = require('../schemas/acitivitySchema');
const ExcelJS = require("exceljs");

/* controller to create user activity */
async function createActivity(req, res) {
  let payload = req.body;
  const activity = ActivitySchema.buildActivity(payload);
  try {
    const addActivityResult = await ActivityModel.addActivity(activity);

    res.status(200).json({
      id: account.insertedId
    });
  }
  catch (error) {
    res.status(200).json({
      message: 'Internal Server Error',
    });
  }
}

/* controller to fetch account activity data */
async function fetchAccountActivityData(req, res) {
  let accountId = req.params.accountId;
  try {
    const accountActivityData = await ActivityModel.fetchAccountActivityData(accountId);

    res.status(200).json({
      data: accountActivityData
    });
  }
  catch (error) {
    res.status(200).json({
      message: 'Internal Server Error',
    });
  }
}

/* controller to fetch particular user activity data */
async function fetchUserActivityData(req, res) {
  let userId = req.params.userId;
  try {
    const userActivityData = await ActivityModel.fetchUserActivityData(userId);

    res.status(200).json({
      data: userActivityData
    });
  }
  catch (error) {
    res.status(200).json({
      message: 'Internal Server Error',
    });
  }
}

/* controller to fetch particular user activity data by emailId*/
async function fetchUserActivityDataByEmailId(req, res) {
  let emailId = req.params.emailId;
  try {
    const userActivityData = await ActivityModel.fetchUserActivityDataByEmailId(emailId);

    res.status(200).json({
      data: userActivityData
    });
  }
  catch (error) {
    res.status(200).json({
      message: 'Internal Server Error',
    });
  }
}

/* controller function to fetch all accounts list for activity tracking */
async function fetchAllCustomerAccountsForActivity(req, res) {
  let offset = req.body.offset ?? 0;
  let limit = req.body.limit ?? 1000;
  try {
    const accounts = await ActivityModel.getAllAccountsDetails(offset, limit);
    if (accounts && accounts.accountDetails && accounts.accountDetails.length > 0) {
      let updatedAccountDetails = []
      for (let account of accounts.accountDetails) {
        let updatedAccount = { ...account }
        updatedAccount.activity_count = await ActivityModel.findActivitySearchQueryCount(account.userData[0].account_id ,false);
        updatedAccountDetails.push(updatedAccount);
      }
      accounts.accountDetails = updatedAccountDetails
      accounts.accountDetails.sort((data1, data2) => { return sortArrayUsingObjectKey(data1, data2, 'activity_count') });
      res.status(200).json({
        data: accounts.accountDetails,
        recordsFiltered: accounts.totalAccountCount,
        totalAccountCount: accounts.totalAccountCount
      });
    }
    else {
      res.status(200).json({
        data: "No accounts available."
      });
    }
  }
  catch (error) {
    res.status(200).json({
      message: "Internal Server Error",
    });
  }
}

/** controller function to fetch all accounts list for activity tracking */
async function fetchAllAccountUsersForActivity(req, res) {
  let accountId = req.params.accountId;
  try {
    const accountUsers = await ActivityModel.getAllAccountUsersDetails(accountId);
    if (accountUsers && accountUsers.length > 0) {
      let updatedAccountUsersDetails = []
      for (let user of accountUsers) {
        let updatedUser = { ...user }
        updatedUser.activity_count = await ActivityModel.findActivitySearchQueryCount(user._id , true);
        updatedAccountUsersDetails.push(updatedUser);
      }
      accountUsers = updatedAccountUsersDetails
      accountUsers.sort((data1, data2) => { return sortArrayUsingObjectKey(data1, data2, 'activity_count') });
      res.status(200).json({
        data: accountUsers
      });
    }
    else {
      res.status(409).json({
        data: "No users available for this account ."
      });
    }
  }
  catch (error) {
    res.status(200).json({
      message: "Internal Server Error",
    });
  }
}

function sortArrayUsingObjectKey(object1, object2, key) {
  const data1 = object1[key];
  const data2 = object2[key];

  if (data1 > data2) {
    return -1
  }
  if (data1 < data2) {
    return 1
  }
  return 0
}

/** Controller function to download activity data for user */
async function downloadActivityTableForUser(req, res) {
  let userId = req.body.userId;
  let emailId = req.body.emailId;
  var userActivityData;
  if (!userId || userId == null) {
    userActivityData = await ActivityModel.fetchUserActivityDataByEmailId(emailId);
  }
  else {
    userActivityData = await ActivityModel.fetchUserActivityData(userId);
  }
  convertUserDataToExcel(userActivityData, res);
}

/** Function to convert user activity data into Excel format */
async function convertUserDataToExcel(userActivityData, res) {
  console.log("Method = convertUserDataToExcel , Entry");
  try {
    var text = "Activity Data";
    var workbook = new ExcelJS.Workbook();
    let worksheet = workbook.addWorksheet("User Activity");
    var getCellCountryText = worksheet.getCell("C2");
    worksheet.getCell("A5").value = "";
    getCellCountryText.value = text;
    getCellCountryText.font = {
      name: "Calibri",
      size: 22,
      underline: "single",
      bold: true,
      color: { argb: "005d91" },
      height: "auto",
    }
    getCellCountryText.alignment = { vertical: "middle", horizontal: "center" }
    worksheet.mergeCells("C2", "E3");

    //Add Image
    let myLogoImage = workbook.addImage({
      filename: "./public/images/logo-new.jpg",
      extension: "jpeg",
    });
    // worksheet.mergeCells("A1:B4");
    worksheet.addImage(myLogoImage, "A1:A4");
    worksheet.add;

    const headers = ["Email", "Role", "Country", "Trade Type", "Query", "QueryResponseTime", "QueryCreatedAt", "WorkspaceCreationQuery"]
    let headerRow = worksheet.addRow(headers);

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "005d91" },
        bgColor: { argb: "" },
      }
      cell.font = {
        bold: true,
        color: { argb: "FFFFFF" },
        size: 12
      }
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'left'
      }
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
    ]
    userActivityData.forEach(user => {
      user.workspaceCreationQuery = user.workspaceCreationQuery ?? "FALSE";
      user.email_id = user.email_id[0];
      user.role = user.role[0];
      user.queryCreatedAt = (new Date(user.queryCreatedAt)).toString();
      user.queryResponseTime = Math.abs(user.queryResponseTime) + " s";
      let userRow = worksheet.addRow(user);

      userRow.eachCell((cell) => {
        if (cell._column._key == "queryResponseTime" || cell._column._key == "workspaceCreationQuery") {
          cell.alignment = {
            vertical: 'middle',
            horizontal: 'center'
          }
        } else {
          cell.alignment = {
            vertical: 'middle',
            horizontal: 'left'
          }
        }
      });
    });

    worksheet.getColumn(1).width = 35;
    workbook.xlsx.write(res, function () {
      res.end();
    });
  }
  catch (error) {
    console.log("Method = convertUserDataToExcel , Error = ", error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
  finally {
    console.log("Method = convertUserDataToExcel , Exit");
  }
}

module.exports = {
  createActivity,
  fetchAccountActivityData,
  fetchUserActivityData,
  fetchUserActivityDataByEmailId,
  fetchAllCustomerAccountsForActivity,
  fetchAllAccountUsersForActivity,
  downloadActivityTableForUser
}
