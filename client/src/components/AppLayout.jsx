import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/*
 * AppLayout
 *
 * Provides the shared structure for authenticated
 * pages in the FAE application.
 *
 * Outlet is where React Router will render the
 * currently selected child route.
 */
function AppLayout() {
    const {currentUser, handleLogout} = useAuth();
    
  return (
    <div>
      <header>
        <nav>
          <strong>FAE</strong>

          <Link to="/app">Dashboard</Link>

          <Link to="/app/campaigns">Campaigns</Link>

          <span>
            Logged in as {currentUser.username}
          </span>

          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </header>

      <main>
        {/* 
          React Router renders the matched child route here.
        */}
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;