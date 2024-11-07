import winston, { format } from "winston";
import { PROD } from "@/config/environment";

const logLevels = {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
    trace: 5,
};

const customFormatter = format.printf(({ level, message, timestamp }) => {
    if (typeof message !== "string") {
        message = JSON.stringify(message);
    }
    return `[${timestamp}] => ${level}: ${message}`;
});

const logger = winston.createLogger({
    levels: logLevels,
    transports: [
        new winston.transports.File({ filename: "./logs/webapi.log" }),
    ],
    format: format.combine(
        format.timestamp({
            format: "DD-MM-YYYY T hh:mm:ss.sss A",
        }),
        customFormatter
    ),
});

if (!PROD) {
    logger.add(
        new winston.transports.Console({
            level: "trace",
            format: format.combine(
                format.colorize(),
                format.timestamp({
                    format: "DD-MM-YYYY T hh:mm:ss.sss A",
                }),
                customFormatter
            ),
        })
    );
}

export default logger;
