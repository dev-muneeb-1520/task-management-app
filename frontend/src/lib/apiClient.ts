import axios from "axios";
import { authTokenStorage } from "@/lib/authTokens";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/+$/, "");

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const isRefreshRoute = (url?: string) => {
  if (!url) return false;
  return url.includes("/auth/refresh");
};

// Attach JWT token to every request
apiClient.interceptors.request.use((config) => {
  if (isRefreshRoute(config.url)) {
    return config;
  }

  const token = authTokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

const resolvePendingQueue = (token: string | null) => {
  pendingQueue.forEach((callback) => callback(token));
  pendingQueue = [];
};

const isAuthRoute = (url?: string) => {
  if (!url) return false;
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/logout")
  );
};

// Unwrap the backend's { success, data, timestamp } envelope so callers get data directly.
apiClient.interceptors.response.use(
  (response) => {
    if (
      response.data &&
      typeof response.data === "object" &&
      "success" in response.data &&
      "data" in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => Promise.reject(error)
);

// Handle 401 by refreshing access token once, then replaying the request.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as {
      headers?: Record<string, string>;
      url?: string;
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry || isAuthRoute(originalRequest.url)) {
      return Promise.reject(error);
    }

    const refreshToken = authTokenStorage.getRefreshToken();
    if (!refreshToken) {
      authTokenStorage.clearTokens();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push((newToken) => {
          if (!newToken) {
            reject(error);
            return;
          }

          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(apiClient(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshResponse = await axios.post<{
        success: boolean;
        data: { access_token: string; refresh_token: string };
      }>(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const { access_token, refresh_token } = refreshResponse.data.data;
      authTokenStorage.setTokens({ access_token, refresh_token });
      resolvePendingQueue(access_token);

      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${access_token}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      resolvePendingQueue(null);
      authTokenStorage.clearTokens();
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;
