// @ts-check

/**
 * ***Send json response***
 * @param {import("express").Response} res 
 * @param {number} statusCode 
 * @param {*} data 
 * @param {string=} message
 */
const sendResponse = (res, statusCode, data, message = "") => {
    return res.status(statusCode).json({ ...data, message, statusCode });
}

module.exports = sendResponse