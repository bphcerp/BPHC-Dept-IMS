export enum HttpCode {
    OK = 200,
    NO_CONTENT = 204,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    INTERNAL_SERVER_ERROR = 500,
}

export interface AppErrorArgs {
    name?: string;
    httpCode: HttpCode;
    description: string;
    feedback?: string;
}

export class AppError extends Error {
    public name: string;
    public httpCode: HttpCode;
    public feedback?: string;

    constructor(args: AppErrorArgs) {
        super(args.description);
        Object.setPrototypeOf(this, new.target.prototype);
        this.httpCode = args.httpCode;
        this.feedback = args.feedback;
        this.name = args.name ?? "Error";

        Error.captureStackTrace(this);
    }
}
