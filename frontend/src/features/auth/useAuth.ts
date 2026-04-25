import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { login, register, logout, clearError, initializeAuth } from "./authSlice";
import type { LoginCredentials, RegisterCredentials } from "@/types/auth.types";

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading, isInitialized, error } = useAppSelector(
    (state) => state.auth
  );

  return {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    initializeAuth: () => dispatch(initializeAuth()),
    login: (credentials: LoginCredentials) => dispatch(login(credentials)),
    register: (credentials: RegisterCredentials) =>
      dispatch(register(credentials)),
    logout: () => dispatch(logout()),
    clearError: () => dispatch(clearError()),
  };
}
