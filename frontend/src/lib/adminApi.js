import axios from "axios";

const adminApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE + "/api",
  headers: { "Content-Type": "application/json" },
});

// Add token from localStorage automatically
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers["x-admin-token"] = token;
  }

  // prevent caching in dev
  config.headers['Cache-Control'] = 'no-cache';
  config.params = {...config.params, t: Date.now()};
  
  return config;
});

// Handle responses globally
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // only clean token, DO NOT redirect globally
      localStorage.removeItem("admin_token");
    }
    return Promise.reject(error);
  }
);


export default adminApi;
