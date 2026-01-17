import API from "./api";

export const request = {
  get: async <T = any>(url: string, params?: object, config?: object): Promise<T> => {
    const response = await API.get<T>(url, { params, ...(config || {}) });
    return response.data;
  },

  post: async <T = any>(url: string, data?: object, config?: object): Promise<T> => {
    const response = await API.post<T>(url, data, config);
    return response.data;
  },

  put: async <T = any>(url: string, data?: object, config?: object): Promise<T> => {
    const response = await API.put<T>(url, data, config);
    return response.data;
  },

  patch: async <T = any>(url: string, data?: object, config?: object): Promise<T> => {
    const response = await API.patch<T>(url, data, config);
    return response.data;
  },

  delete: async <T = void>(url: string, config?: object): Promise<T> => {
    const response = await API.delete<T>(url, config);
    return response.data;
  },
};