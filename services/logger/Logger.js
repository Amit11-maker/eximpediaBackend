// @ts-check
// const { KustoAuthenticationError } = require('azure-kusto-data/types/src/errors');
const { TokenExpiredError } = require('jsonwebtoken');
const fs = require('fs');
const { MongoError } = require('mongodb/lib/core');

/**
 * Custom Class to log errors in log/error.log file
 * @class Logger
 */
class Logger {

    /**
     * @param {unknown} error 
     * @param {string} fileName 
     * @param {string=} method
     */
    constructor(error, fileName, method) {
        // [TIMESTAMP] [LEVEL] [MODULE] [MESSAGE]
        let errorTemplate = `[method-${method ? method : ""}] [${new Date().toISOString()}] [ERROR] [${fileName}] \n [${error}] \n \n`

        // create logs directory if not exists and write error in error.log file
        if (fs.existsSync("logs")) {
            fs.appendFileSync("logs/error.log", errorTemplate + "\n");
        } else {
            fs.writeFileSync("logs/error.log", errorTemplate + "\n");
        }

        /** @private */
        this.fileName = fileName

        this.getErrorMessage(error)

    }

    /**
     * get error message based on error type
     * @param {unknown} error
     * @private
     * @returns {void}
     * */
    getErrorMessage(error) {
        this.errorMessage = "Something went wrong. Please try again later."

        // if error is MongoError
        if (error instanceof MongoError) {
            this.errorMessage = error.message
            this.log(error.message, "MongoError")
        }
        // if error is MongoAPIError or MongoAWSError
        // else if (error instanceof MongoAPIError) {
        //     this.errorMessage = error.message
        //     this.log(error.message, "MongoAPIError")
        // }
        // if error is MongoAWSError
        // else if (error instanceof MongoAWSError) {
        //     this.errorMessage = error.message
        //     this.log(error.message, "MongoAWSError")
        // }

        // if error is KustoDataErrors
        // else if (error instanceof KustoAuthenticationError) {
        //     this.errorMessage = error.message
        //     this.log(error.message, "KustoAuthenticationError")
        // }

        else if (error instanceof TokenExpiredError) {
            this.errorMessage = error.message;
            this.log(error.message, "TokenExpiredError")
        }

        // if error is native javascript error
        else if (error instanceof Error) {
            this.errorMessage = error.message
            this.log(error.message, "Error")
        }

    }

    /**
     * take message as input and log it
     * @param {string} message
     * @param {string} errorType
     */
    log(message, errorType) {
        let logTemplate = `\n [file -:- ${this.fileName}] [${errorType}] ---- [${message}] \n`
        console.log(logTemplate)
    }
}


/**
 * @param {unknown} error 
 * @param {string} fileName 
 * @param {string=} method 
 */
const getLoggerInstance = (error, fileName, method) => {
    return new Logger(error, fileName, method)
}

module.exports = getLoggerInstance
