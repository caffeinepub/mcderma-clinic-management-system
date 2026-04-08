import { useInternetIdentity } from "./useInternetIdentity";

/**
 * Convenience hook exposing authentication state and actions.
 * Internally delegates to Internet Identity via core-infrastructure.
 */
export function useAuth() {
  const { identity, login, clear, loginStatus, isInitializing, isLoggingIn } =
    useInternetIdentity();

  const isAuthenticated = !!identity;

  return {
    isAuthenticated,
    identity,
    isInitializing,
    isLoggingIn,
    loginStatus,
    login,
    logout: clear,
  };
}
