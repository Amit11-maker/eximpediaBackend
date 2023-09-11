// @ts-check

const NotificationModel = require("../../models/notificationModel");
const getLoggerInstance = require("../logger/Logger");

/**
 * ### send workspace creation error notification to user
 * @param {*} payload 
 * @param {string | undefined} message 
 * @param {string} filename 
 */
const sendWorkspaceErrorNotification = async (payload, message, filename) => {
    try {
        let notificationInfo = {};
        notificationInfo.user_id = [payload.userId];
        notificationInfo.heading = "Workspace Creation Failed";
        notificationInfo.description = message ?? "Workspace creation failed due to some internal error. Please try again later.";
        await NotificationModel.add(notificationInfo, "user");
    } catch (error) {
        getLoggerInstance(error, filename);
        throw error;
    }
}

/**
 * ### send workspace creation success notification to user
 * @param {*} payload 
 * @param {string | undefined} message 
 * @param {string} filename 
 */
const sendWorkspaceCreatedNotification = async (payload, message, filename) => {
    try {
        let notificationInfo = {};
        notificationInfo.user_id = [payload.userId];
        notificationInfo.heading = "Workspace Created";
        notificationInfo.description = message ?? "Workspace created successfully, you can analyse your data now.";
        await NotificationModel.add(notificationInfo, "user");
    } catch (error) {
        getLoggerInstance(error, filename);
        throw error;
    }
}

module.exports = {
    sendWorkspaceErrorNotification,
    sendWorkspaceCreatedNotification
}