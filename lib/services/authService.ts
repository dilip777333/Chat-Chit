const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/v1/api';

export interface SendOtpRequest {
  email?: string;
  phone?: string;
}

export interface VerifyOtpRequest {
  email?: string;
  phone?: string;
  otp: string;
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
  user?: {
    id: number;
    name: string;
    email?: string;
    phone_number?: string;
    user_name: string;
    profile_picture?: string;
    first_name?: string;
    last_name?: string;
  };
  otp?: string; // Only in development
  isNewUser?: boolean;
}

export const authService = {
  async sendOtp(data: SendOtpRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send OTP');
      }

      return result;
    } catch (error) {
      console.error('Send OTP error:', error);
      throw error;
    }
  },

  async verifyOtp(data: VerifyOtpRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to verify OTP');
      }

      return result;
    } catch (error) {
      console.error('Verify OTP error:', error);
      throw error;
    }
  },

  async updateUserDetails(userId: number, data: UpdateUserDetailsRequest, token: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update user details');
      }

      return result;
    } catch (error) {
      console.error('Update user details error:', error);
      throw error;
    }
  },

  async getProfile(token?: string): Promise<AuthResponse> {
    try {
      // Get token from parameter or localStorage
      const authToken = token || localStorage.getItem('token');
      
      const headers: any = {
        'Content-Type': 'application/json',
      };

      // Add Authorization header if token is available
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'GET',
        headers,
        credentials: 'include', // Include cookies in request
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch profile');
      }

      return result;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  async updateProfile(token: string, data: any): Promise<AuthResponse> {
    try {
      // Get token from parameter or localStorage
      const authToken = token || localStorage.getItem('token');
      
      console.log('📤 updateProfile called with token:', token ? 'passed' : 'not passed');
      console.log('📤 authToken from localStorage:', authToken ? authToken.substring(0, 20) + '...' : 'NOT FOUND');
      
      const headers: any = {
        'Content-Type': 'application/json',
      };

      // Add Authorization header if token is available
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
        console.log('📤 Authorization header added');
      } else {
        console.log('⚠️  NO TOKEN - Authorization header NOT added');
      }

      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
        credentials: 'include', // Include cookies in request
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update profile');
      }

      return result;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
};
