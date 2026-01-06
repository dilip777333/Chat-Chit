import axios from "axios";

// Base URL should point to your backend server root.
// Backend (Express) runs on PORT 5001 and already prefixes routes with `/v1/api`.
// Automatically detect network IP if accessing via network, otherwise use localhost
const getBaseURL = () => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  
  // If running in browser, check if we're accessing via network IP
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    // If hostname is not localhost, use the same hostname for backend
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `http://${hostname}:5001`;
    }
  }
  
  return "http://localhost:5001";
};

const baseURL = getBaseURL();

const API = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use(
  (config) => {
    console.log("Making request to:", config.baseURL, config.url);

    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers = config.headers || {};
        (config.headers as any).Authorization = `Bearer ${token}`;
        console.log("Authorization header set with token");
      } else {
        console.warn("No authentication token found");
      }
    }

    console.log("Request headers:", config.headers);
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response) => {
    console.log("Response received:", {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    // Keep Axios default behavior: return the full response object.
    return response;
  },
  (error) => {
    console.error("Response error:", {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    return Promise.reject(error);
  }
);

export default API;
