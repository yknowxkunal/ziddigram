import axios from "axios";

// Same-origin by default (client is served by the same Express server in
// production). Only set VITE_API_URL if you're running client/server on
// different hosts (e.g. separate local dev servers).
const BASE_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send httpOnly cookies
});

// Auto-refresh access token once on a 401, then retry the original request
let isRefreshing = false;
let queue = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !original.url.includes("/auth/")) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then(() => api(original));
      }

      isRefreshing = true;
      try {
        await api.post("/auth/refresh");
        queue.forEach((p) => p.resolve());
        queue = [];
        return api(original);
      } catch (err) {
        queue.forEach((p) => p.reject(err));
        queue = [];
        throw err;
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
