// The base URL for our Express API.
// Set via VITE_API_BASE_URL in .env so it doesn't have to be
// hardcoded, e.g. when the machine's LAN IP changes.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/*
 * apiRequest
 *
 * This is our general-purpose helper for making requests
 * from React to the Express API.
 *
 * It automatically:
 * - Builds the complete API URL.
 * - Sends JSON data when provided.
 * - Includes our HTTP-only authentication cookie.
 * - Converts the response into JavaScript data.
 * - Throws an error when the API returns a failure status.
 */
async function apiRequest(endpoint, options = {}) {
  // Send the request to our Express API.
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,

    // Tell the browser to include cookies with this request.
    // This is required for our HTTP-only fae_session cookie.
    credentials: "include",

    // Tell Express that we're sending JSON when a request body exists.
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  // Convert the JSON response from Express into a JavaScript object.
  const data = await response.json();

  // If Express returned an HTTP error status, throw an error.
  // This allows our React components to handle failed requests
  // using normal try/catch logic.
  if (!response.ok) {
    throw new Error(data.message || "An unexpected error occurred.");
  }

  // Return the API response to the calling function.
  return data;
}

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