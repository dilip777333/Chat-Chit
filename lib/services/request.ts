import API from "./api";

interface ApiError {
  message: string;
  status?: number;
  data?: any;
  isAxiosError?: boolean;
}

export const request = {
  get: async <T = any>(url: string, params?: object, config?: object): Promise<T> => {
    try {
      const response = await API.get<T>(url, { params, ...(config || {}) });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  post: async <T = any>(url: string, data?: object, config?: object): Promise<T> => {
    try {
      const response = await API.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  put: async <T = any>(url: string, data?: object, config?: object): Promise<T> => {
    try {
      const response = await API.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  patch: async <T = any>(url: string, data?: object, config?: object): Promise<T> => {
    try {
      const response = await API.patch<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  delete: async <T = void>(url: string, config?: object): Promise<T> => {
    try {
      const response = await API.delete<T>(url, config);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },
};

const handleError = (error: any): ApiError => {
  console.error("API Error:", error);

  if (error.response) {
    return {
      message: error.response.data?.message || error.response.statusText,
      status: error.response.status,
      data: error.response.data,
      isAxiosError: true,
    };
  } else if (error.request) {
    return {
      message: "Network Error: No response received from server",
      isAxiosError: true,
    };
  }

  return {
    message: error.message || "Unknown API error occurred",
    isAxiosError: false,
  };
};

export const handleServiceError = (error: any, defaultMessage: string): never => {
  const err = error as ApiError;
  throw new Error(
    err.data?.message || err.message || defaultMessage
  );
};
