import API from "./api";

export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterRequest {
  email?: string;
  phone?: string;
  password: string;
  user_name: string;
  profile_picture?: string;
}

export interface UpdateUserDetailsRequest {
  first_name: string;
  last_name: string;
  user_name?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: any;
  isNewUser?: boolean;
}

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await API.post<AuthResponse>("/v1/api/auth/login", data);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await API.post<AuthResponse>("/v1/api/auth/register", data);
    return response.data;
  },

  async updateUserDetails(userId: string, data: UpdateUserDetailsRequest): Promise<AuthResponse> {
    const response = await API.put<AuthResponse>(`/v1/api/users/${userId}`, data);
    return response.data;
  },

  async getProfile(): Promise<AuthResponse> {
    const response = await API.get<AuthResponse>("/v1/api/users/profile");
    return response.data;
  },

  async updateProfile(data: any): Promise<AuthResponse> {
    const response = await API.put<AuthResponse>("/v1/api/users/profile", data);
    return response.data;
  },

  async uploadProfilePicture(formData: FormData): Promise<AuthResponse> {
    const response = await API.put<AuthResponse>("/v1/api/users/profile", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
};