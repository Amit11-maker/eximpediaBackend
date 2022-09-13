const winston = require('winston');

const logger = winston.createLogger({
    transports: [
        new winston.transports.File({
            filename: './error.log',
            level: 'error',
            format: winston.format.combine(
                winston.format.timestamp({ format: 'MMM-DD-YYYY HH:mm:ss' }),
                winston.format.align(),
                winston.format.printf(info => `${info.level}: ${[info.timestamp]}: ${info.message}`),
            )
        }),
        new winston.transports.Http({
            level: 'warn',
            format: winston.format.combine(
                winston.format.timestamp({ format: 'MMM-DD-YYYY HH:mm:ss' }),
                winston.format.align(),
                winston.format.printf(info => `${info.level}: ${[info.timestamp]}: ${info.message}`),
            )
        }),
        new winston.transports.Console({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp({ format: 'MMM-DD-YYYY HH:mm:ss' }),
                winston.format.align(),
                winston.format.printf(info => `${info.level}: ${[info.timestamp]}: ${info.message}`),
            )
        })
    ]
});

// logger.info("hello")
// logger.warn("hello");
// logger.error("hello")

module.exports = {
    logger
}