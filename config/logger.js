const winston = require('winston');
/* logger implementation
USE :-
logger.info("for info logs")
logger.warn("for warn logs")
logger.error("for error logs"))*/
const logger = winston.createLogger({
    level: 'info',
    exitOnError: false,
    handleExceptions: true,
    format: winston.format.combine(
        winston.format.json(),
        winston.format.timestamp({
            format: 'MMM-DD-YYYY HH:mm:ss'
        }),
        winston.format.printf(info => `${info.level}:${[info.timestamp]}:${info.message}`),
    ),
    transports: [
        new winston.transports.File({ filename: '../logs/error.log', level: 'error' ,format:winston.format.json()}),
        new winston.transports.Console({
            level: 'info',
            format:winston.format.json()
        })
    ],
});
// logger.info("for info logs")
// logger.warn("for warn logs")
// logger.error("for error logs")
module.exports ={
    logger,
}