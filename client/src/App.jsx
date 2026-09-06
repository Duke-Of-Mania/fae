// Import the components we want to display as pages.
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";

// Import the React Router components that allow us
// to display different pages based on the browser URL.
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Import React's useEffect hook.
// useEffect lets us perform an API request when the
// application first loads.
import { useEffect, useState } from "react";

// Import our API function for checking the current session.
import { getCurrentUser, logout } from "./services/api.js";


// This component defines the application's page structure.
// React Router uses the browser's URL to decide which
// component should be displayed.
function App() {
  // Stores the currently authenticated user.
  // null means that nobody is currently authenticated.
  const [currentUser, setCurrentUser] = useState(null);

  // Tracks whether we have finished checking the server
  // to determine whether the user already has a valid session.
  const [authLoading, setAuthLoading] = useState(true);
  /*
  * Check for an existing authenticated session when the
  * application first loads.
  *
  * The browser automatically sends the HTTP-only fae_session
  * cookie with this request because our API helper uses
  * credentials: "include".
  */
  useEffect(() => {
    /*
    * Check the current authentication session when the
    * application first loads.
    */
    async function checkAuthentication() {
      try {
        // Ask Express who is currently authenticated.
        const data = await getCurrentUser();

        // Display the authenticated user temporarily so
        // we can verify that the API request worked.
        console.log("Authenticated user:", data.user);

        // Store the authenticated user in React state.
        setCurrentUser(data.user);
      } catch (error) {
        // A failed request means there is no valid session.
        console.log("No authenticated session.");

        setCurrentUser(null);
      } finally {
        // The authentication check has finished.
        setAuthLoading(false);
      }
    }

    checkAuthentication();
  }, []
  );

  // Don't render the application until we've determined
  // whether the browser already has a valid session.
  if (authLoading) {
    return <p>Checking authentication...</p>;
  };

  /*
  * handleLogout
  *
  * This function asks the server to invalidate the current
  * authentication session and then removes the user from
  * React's authentication state.
  */
  async function handleLogout() {
      try {
        // Ask Express to invalidate the current server-side session.
        await logout();

        // Remove the user from React state.
        // This causes the application to re-render as logged out.
        setCurrentUser(null);
      } catch (error) {
        // For now, log the error so we can troubleshoot
        // if the server-side logout fails.
        console.error("Logout failed:", error);
      }
    };

  return (
    <BrowserRouter>
      <Routes>

        {/* Display LandingPage when the user visits "/". */}
        <Route path="/" element={<LandingPage handleLogout={handleLogout}/>} />

        {/* Display LoginPage when the user visits "/login". */}
        <Route
          path="/login"
          element={
            currentUser ? (
              <Navigate to="/" replace />
            ) : (
              <LoginPage setCurrentUser={setCurrentUser} />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

// Export App so main.jsx can render our application.
export default App;