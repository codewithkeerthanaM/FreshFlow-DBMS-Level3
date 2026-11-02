
import axios from "axios";

// Base API configuration
const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach authentication token to requests
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("freshflow_token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Extract response data
export const dataOf = (response) =>
  response?.data?.data ?? response?.data ?? {};

// Authentication APIs
export const auth = {
  login: (payload) => api.post("/auth/login", payload),
  me: () => api.get("/auth/me"),
};

// API endpoints
export const endpoints = {
  products: "/products",
  suppliers: "/suppliers",
  inventory: "/inventory",
  alerts: "/alerts",
  waste: "/waste",
  purchases: "/purchases",
  locations: "/locations",
};

// Dashboard API
export const dashboard = () =>
  api.get("/reports/dashboard");

// Generic CRUD APIs
export const getList = (path) =>
  api.get(path);

export const create = (path, payload) =>
  api.post(path, payload);

export const update = (path, id, payload) =>
  api.put(`${path}/${id}`, payload);

export const remove = (path, id) =>
  api.delete(`${path}/${id}`);

// Inventory APIs
export const inventoryApi = {
  list: () => api.get("/inventory"),
  create: (payload) => api.post("/inventory", payload),
  adjust: (id, payload) =>
    api.put(`/inventory/${id}/adjust`, payload),
};

// Alert APIs
export const alertApi = {
  list: () => api.get("/alerts"),
  updateStatus: (id, status) =>
    api.patch(`/alerts/${id}/status`, { status }),
};

// History APIs - MongoDB event history
export const historyApi = {
  stock: () => api.get("/history/stock"),
  alerts: () => api.get("/history/alerts"),
  monitoring: () => api.get("/history/monitoring"),
};

// Export configured Axios instance
export default api;
