import axios, { InternalAxiosRequestConfig } from "axios";
import {
  ACCESS_TOKEN_KEY,
  BASE_API_URL,
  LOGIN_ENDPOINT,
  REFRESH_ENDPOINT,
} from "@/lib/constants";
let isRefreshing = false;
let refreshSubscribers: ((newToken: string) => void)[] = [];

const onRefresh = (token: string) => {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
};

const api = axios.create({
  baseURL: BASE_API_URL,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error: Error) => {
    return Promise.reject(error);
  }
);

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
interface CustomRequestConfig<D = any> extends InternalAxiosRequestConfig<D> {
  _retried?: boolean;
}

api.interceptors.response.use(
  (res) => res,
  async (error: Error) => {
    if (axios.isAxiosError(error)) {
      const originalRequest: CustomRequestConfig | undefined = error.config;
      if (error.response && originalRequest) {
        if (
          error.response.status === 401 &&
          localStorage.getItem(ACCESS_TOKEN_KEY) &&
          !originalRequest._retried &&
          originalRequest.url !== REFRESH_ENDPOINT &&
          originalRequest.url !== LOGIN_ENDPOINT
        ) {
          if (!isRefreshing) {
            isRefreshing = true;
            originalRequest._retried = true;
            try {
              const response = await api.post<{ token: string }>(
                REFRESH_ENDPOINT
              );
              const accessToken = response.data.token;
              localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

              onRefresh(accessToken);
              isRefreshing = false;

              originalRequest.headers["Authorization"] =
                `Bearer ${accessToken}`;
              return api(originalRequest);
            } catch (error) {
              localStorage.removeItem(ACCESS_TOKEN_KEY);
              isRefreshing = false;
              refreshSubscribers = [];
              window.location.reload();
              return Promise.reject(error as Error);
            }
          } else {
            return new Promise((resolve) => {
              refreshSubscribers.push((newToken) => {
                originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
                resolve(api(originalRequest));
              });
            });
          }
        } else if (error.response.status === 429) {
          return Promise.reject(new Error("Too many requests"));
        }
      } else if (error.code === "ERR_NETWORK") {
        return Promise.reject(new Error("Server connection failed"));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
