export const ACCESS_TOKEN_KEY = "amogus_token";

if (typeof import.meta.env.VITE_GOOGLE_CLIENT_ID !== "string")
  throw new Error("VITE_GOOGLE_CLIENT_ID required");

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const DEV_URL = "http://localhost:9000/";
const PROD_URL = import.meta.env.VITE_PROD_SERVER_URL as string;
export const BASE_URL =
  process.env.NODE_ENV === "production" ? PROD_URL : DEV_URL;
export const BASE_API_URL = BASE_URL;

export const LOGIN_ENDPOINT = "auth/login";
export const REFRESH_ENDPOINT = "auth/refresh";

export const DEPARTMENT_NAME = import.meta.env.VITE_DEPARTMENT_NAME as string;
