import dotenv from "dotenv";
dotenv.config({ path: ".env" });
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import corsOptions from "@/config/cors.ts";
import type { ErrorRequestHandler } from "express";
import api from "@/api/index.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import logger from "@/config/logger.ts";

const app = express();

app.use(cors(corsOptions));
app.use(helmet());
app.set("view engine", "jade");
app.disable("x-powered-by");
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/api/", api);

// catch 404
app.use((_req, _res, next) => {
    next(
        new HttpError(HttpCode.NOT_FOUND, "Requested endpoint does not exist")
    );
});

const expressErrorHandler: ErrorRequestHandler = (err, req, res, _next) => {
    if (err instanceof HttpError && !err.route) err.route = req.url;
    if (err instanceof HttpError) {
        const log =
            err.status === HttpCode.INTERNAL_SERVER_ERROR
                ? logger.error
                : logger.info;
        log("%o", {
            status: err.status,
            message: err.message,
            route: err.route,
            feedback: err.feedback,
        });
    } else {
        logger.error("%o", err);
    }
    res.status((err as HttpError)?.status ?? 500).send(
        (err as HttpError | Error)?.message ?? "Internal server error"
    );
};
app.use(expressErrorHandler);

export default app;
