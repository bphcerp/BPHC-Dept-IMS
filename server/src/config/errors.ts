export class HttpError extends Error {
    constructor(
        public status: HttpCode,
        public msg: string,
        public feedback?: string,
        public route?: string
    ) {
        super(msg);
        Object.setPrototypeOf(this, HttpError.prototype);
        Error.captureStackTrace(this);
    }
}

export enum HttpCode {
    OK = 200,
    NO_CONTENT = 204,
    NOT_MODIFIED = 304,
    BAD_REQUEST = 400,
    CONFLICT = 409,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,

    INTERNAL_SERVER_ERROR = 500,
}
