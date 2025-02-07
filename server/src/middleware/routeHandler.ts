import type express from "express";
import { HttpCode, HttpError } from "@/config/errors.ts";
import type core from "express-serve-static-core";
import { fromError, isZodErrorLike } from "zod-validation-error";

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
        return Promise.resolve(fnReturn).catch((e) => {
            if (isZodErrorLike(e)) {
                return next(
                    new HttpError(
                        HttpCode.BAD_REQUEST,
                        "Invalid parameters",
                        fromError(e).toString()
                    )
                );
            }
            return next(
                new HttpError(
                    HttpCode.INTERNAL_SERVER_ERROR,
                    "An error occurred",
                    (e as Error)?.message
                )
            );
        });
    };
};
