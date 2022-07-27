const TAG = "activitySchema";
const http = require("http");

/*
    var userIp = "";
    http.get({ host: "api.ipify.org", port: 80, path: "/" }, function (resp) {
      resp.on("data", function (ip) {
        userIp = ip.toString();
      });
    });
*/

const activity = {
    account_id: '',
    user_id: '',
    tradeType: '',
    country: '',
    role:'',
    email_id:'',
    query: '',
    queryResponseTime: '',
    isWorkspaceQuery:true,
    // userIp : '', We can add this as per requirement
    created_ts: 0,
    modified_ts: 0,
}

const buildActivity = (data) => {
    let currentTimestamp = Date.now();
    let content = JSON.parse(JSON.stringify(activity));

    content.account_id = data.account_id ?? "" ;
    content.user_id = data.user_id ?? "" ;
    content.tradeType = data.tradeType ?? "" ;
    content.country = data.country ?? "" ;
    content.role = data.role ?? "" ;
    content.email_id = data.emailId ?? "" ;
    content.query = data.query ?? "" ;
    content.queryResponseTime = data.queryResponseTime ?? "" ;
    content.isWorkspaceQuery = data.isWorkspaceQuery ?? false,
    //content.userIp = userIp;  We can add this as per requirement
    content.created_ts = currentTimestamp;
    content.modified_ts = currentTimestamp;

    return content;
}

module.exports = {
    buildActivity
}