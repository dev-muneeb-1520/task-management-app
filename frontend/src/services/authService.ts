import apiClient from "@/lib/apiClient";
import type {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  User,
  RefreshTokenPayload,
} from "@/types/auth.types";

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>("/auth/login", credentials);
    return data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>("/auth/register", credentials);
    return data;
  },

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    const payload: RefreshTokenPayload = { refreshToken };
    const { data } = await apiClient.post<AuthResponse>("/auth/refresh", payload);
    return data;
  },

  profile: async (): Promise<User> => {
    const { data } = await apiClient.get<User>("/auth/profile");
    return data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },
};
