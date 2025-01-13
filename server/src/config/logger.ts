import winston, { format } from "winston";
import { PROD } from "@/config/environment";
import { HttpError } from "./errors";

const logLevels = {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
    trace: 5,
};

const customFormatter = format.printf(({ level, message, timestamp }) => {
    return `[${timestamp as string}] => ${level}: ${message as string}`;
});

const logger = winston.createLogger({
    levels: logLevels,
    transports: [new winston.transports.File({ filename: "./logs/log.txt" })],
    format: format.combine(
        format.timestamp({
            format: "DD-MM-YYYY T hh:mm:ss.sss A",
        }),
        format.splat()
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
