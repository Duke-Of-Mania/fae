import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, logout } from "../services/api.js";

/*
 * AuthContext
 *
 * Provides authentication information and authentication
 * actions to components throughout the application.
 */
const AuthContext = createContext(null);

/*
 * AuthProvider
 *
 * Owns the application's authentication state.
 */
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  /*
   * Check whether the browser already has a valid
   * server-side session when the application starts.
   */
  useEffect(() => {
    async function checkAuthentication() {
      try {
        const data = await getCurrentUser();

        setCurrentUser(data.user);
      } catch (error) {
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    }

    checkAuthentication();
  }, []);

  /*
   * Log the current user out.
   */
  async function handleLogout() {
    try {
      await logout();

      setCurrentUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  /*
   * Make authentication state and actions available
   * to any component beneath AuthProvider.
   */
  const value = {
    currentUser,
    setCurrentUser,
    authLoading,
    handleLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/*
 * useAuth
 *
 * Convenience hook that allows components to access
 * the authentication context.
 */
export function useAuth() {
  return useContext(AuthContext);
}