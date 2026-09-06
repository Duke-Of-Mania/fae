import { apiRequest } from "./apiClient.js";

/*
 * login
 *
 * Sends the user's email and password to the Express login
 * endpoint.
 *
 * The server handles password verification and creates the
 * HTTP-only session cookie. React never needs to see or store
 * the session token.
 */
export async function login(email, password) {
  return apiRequest("/auth/login", {
    method: "POST",

    // Convert the JavaScript object into JSON for Express.
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

/*
 * register
 *
 * Sends a new account's username, email, and password to the
 * Express registration endpoint. Does not log the user in;
 * they still need to log in afterward.
 */
export async function register(username, email, password) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      username,
      email,
      password,
    }),
  });
}

/*
 * getCurrentUser
 *
 * Asks the Express API who is currently authenticated.
 *
 * The browser automatically includes the HTTP-only session
 * cookie because apiRequest() uses credentials: "include".
 */
export async function getCurrentUser() {
  return apiRequest("/auth/me");
}

/*
 * logout
 *
 * Tells Express to destroy the current server-side session
 * and clear the HTTP-only authentication cookie.
 */
export async function logout() {
  return apiRequest("/auth/logout", {
    method: "POST",
  });
}