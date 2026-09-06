// Import the components we want to display as pages.
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// Import the React Router components that allow us
// to display different pages based on the browser URL.
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Campaigns from "./pages/Campaigns.jsx";
import CampaignDetail from "./pages/CampaignDetail.jsx";
import AppLayout from "./components/AppLayout.jsx";
import { useAuth } from "./context/AuthContext.jsx";


// This component defines the application's page structure.
// React Router uses the browser's URL to decide which
// component should be displayed.
function App() {

  // AuthContext already checks for an existing session
  // (using the HTTP-only fae_session cookie) when the
  // application first loads, so App just reads the result.
  const { currentUser, authLoading, setCurrentUser, handleLogout } = useAuth();

  // Don't render the application until we've determined
  // whether the browser already has a valid session.
  if (authLoading) {
    return <p>Checking authentication...</p>;
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
              <Navigate to="/app" replace />
            ) : (
              <LoginPage setCurrentUser={setCurrentUser} />
            )
          }
        />

        {/* Display RegisterPage when the user visits "/register". */}
        <Route
          path="/register"
          element={
            currentUser ? (
              <Navigate to="/app" replace />
            ) : (
              <RegisterPage />
            )
          }
        />

        <Route 
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={<Dashboard currentUser={currentUser}/>}
          />

          <Route path="campaigns" element={<Campaigns />} />
          <Route path="campaigns/:campaignId" element={<CampaignDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

// Export App so main.jsx can render our application.
export default App;