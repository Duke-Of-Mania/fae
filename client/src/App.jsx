// Import the components we want to display as pages.
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";

// Import the React Router components that allow us
// to display different pages based on the browser URL.
import { BrowserRouter, Routes, Route } from "react-router-dom";

// This component defines the application's page structure.
// React Router uses the browser's URL to decide which
// component should be displayed.
function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Display LandingPage when the user visits "/". */}
        <Route path="/" element={<LandingPage />} />

        {/* Display LoginPage when the user visits "/login". */}
        <Route path="/login" element={<LoginPage />} />

      </Routes>
    </BrowserRouter>
  );
}

// Export App so main.jsx can render our application.
export default App;