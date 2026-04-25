export interface User {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}
