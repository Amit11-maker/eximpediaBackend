// @ts-check

const NotificationModel = require("../../models/notificationModel");
const getLoggerInstance = require("../logger/Logger");

/**
 * ### send workspace creation error notification to user
 * @param {*} userID 
 * @param {string | undefined} message
 */
const sendWorkspaceErrorNotification = async (userID, message) => {
    try {
        let notificationInfo = {};
        notificationInfo.user_id = [userID];
        notificationInfo.heading = "Workspace Creation Failed";
        notificationInfo.description = message ?? "Workspace creation failed due to some internal error. Please try again later.";
        await NotificationModel.add(notificationInfo, "user");
    } catch (error) {
        throw error;
    }
}

/**
 * ### send workspace creation success notification to user
 * @param {*} userID 
 * @param {string | undefined} message 
 */
const sendWorkspaceCreatedNotification = async (userID, message) => {
    try {
        let notificationInfo = {};
        notificationInfo.user_id = [userID];
        notificationInfo.heading = "Workspace Created";
        notificationInfo.description = message ?? "Workspace created successfully, you can analyse your data now.";
        await NotificationModel.add(notificationInfo, "user");
    } catch (error) {
        throw error;
    }
}

module.exports = {
    sendWorkspaceErrorNotification,
    sendWorkspaceCreatedNotification
}