// frontend/src/lib/api.js
import axios from "axios";
import { getIdToken } from "@/firebase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
if (!API_BASE) {
  console.warn("⚠️ NEXT_PUBLIC_API_BASE is not set");
}

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Inject auth token before each request
api.interceptors.request.use(async (config) => {
  const token = await getIdToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle blocked account globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 403 &&
      error.response?.data?.code === "ACCOUNT_BLOCKED"
    ) {
      error.isBlocked = true;
      error.blockReason = error.response.data.reason;
    }
    return Promise.reject(error);
  }
);

// Optional helper wrappers
export const apiGet = (url) => api.get(url).then((r) => r.data);
export const apiPost = (url, data) => api.post(url, data).then((r) => r.data);
export const apiPut = (url, data) => api.put(url, data).then((r) => r.data);
export const apiDelete = (url) => api.delete(url).then((r) => r.data);

export default api;
