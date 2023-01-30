import { format as _format, transports as _transports, createLogger } from 'winston';

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
}
// test
const level = () => {
    const env = process.env.NODE_ENV || 'development'
    const isDevelopment = env === 'development'
    return isDevelopment ? 'debug' : 'warn'
}

const format = _format.combine(

    _format.timestamp({
        format: 'MMM-DD-YYYY HH:mm:ss'
    }),
    _format.colorize({
        all: true
    }),
    _format.printf(

        (info) => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
)

const transports = [
    new _transports.Console({
        level: 'debug',
        handleExceptions: true,
        json: false,
        colorize: true
    }),
    new _transports.File({
        filename: 'logs/error.log',
        level: 'error',
        handleExceptions: true,
        json: true,
        maxsize: 2000000, //MaxSize - 2000000bytes(2MB)
        // maxFiles: 5,
        colorize: false
    }),
    new _transports.File({
        filename: 'logs/all.log',
        json: true,
    }),
]

const logger = createLogger({
    level: level(),
    levels,
    format,
    transports,
})

export const info = logger.info;
export const error = logger.error;

export default logger;
export const stream = {
    write: function (message, encoding) {
        logger.http(message);
    }
};
