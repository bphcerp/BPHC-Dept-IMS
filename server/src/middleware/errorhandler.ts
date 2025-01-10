import type { Request, Response } from "express";
import type express from "express";
import { AppError, HttpCode } from "@/config/errors";
import logger from "@/config/logger";
import { PROD } from "@/config/environment";
import type core from "express-serve-static-core";

class ErrorHandler {
    private isTrustedError(error: Error): boolean {
        if (error instanceof AppError) {
            return true;
        }
        return false;
    }
    private handleTrustedError(
        error: AppError,
        request?: Request,
        response?: Response
    ): void {
        if (!PROD || error.httpCode === HttpCode.INTERNAL_SERVER_ERROR)
            logger.error(
                `${request ? request.path + " " : ""}[${error.httpCode}]: ${error.message}${error.feedback ? " | " + error.feedback : ""}`
            );
        if (response)
            response.status(error.httpCode).json({ message: error.message });
    }
    private handleCriticalError(
        error: Error | AppError,
        request?: Request,
        response?: Response
    ): void {
        if (response) {
            response
                .status(HttpCode.INTERNAL_SERVER_ERROR)
                .json({ message: "Internal server error" });
        }
        logger.error(`${request ? request.path + ": " : ""}${error.stack}`);
        logger.error("Application encountered a critical error. Exiting");
        process.exit(1);
    }
    public handleError(
        error: Error | AppError,
        request?: Request,
        response?: Response
    ): void {
        if (this.isTrustedError(error)) {
            this.handleTrustedError(error as AppError, request, response);
        } else {
            this.handleCriticalError(error, request, response);
        }
    }
}

export const asyncHandler = <
    P = core.ParamsDictionary,
    ResBody = unknown,
    ReqBody = unknown,
    ReqQuery = core.Query,
>(
    fn: (
        ...args: Parameters<
            express.RequestHandler<P, ResBody, ReqBody, ReqQuery>
        >
    ) => void | Promise<void>
): express.RequestHandler<P, ResBody, ReqBody, ReqQuery> => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    return function asyncUtilWrap(
        ...args: Parameters<
            express.RequestHandler<P, ResBody, ReqBody, ReqQuery>
        >
    ) {
        const fnReturn = fn(...args);
        const next = args[args.length - 1] as express.NextFunction;
        return Promise.resolve(fnReturn).catch((e) =>
            next(
                new AppError({
                    description: "An error occurred",
                    httpCode: HttpCode.INTERNAL_SERVER_ERROR,
                    feedback: `${(e as Error).stack}`,
                })
            )
        );
    };
};

export const errorHandler = new ErrorHandler();
