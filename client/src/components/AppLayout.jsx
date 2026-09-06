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
    <div className="page-layout">
      <header className="app-header">
        <nav className="app-nav">
          <span className="app-logo">FAE</span>

          <Link to="/app">Dashboard</Link>

          <Link to="/app/campaigns">Campaigns</Link>

          <Link to="/app/characters">Characters</Link>
        </nav>

        <div className="app-user">
          <span>
            Logged in as {currentUser.username}
          </span>

          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="app-main">
        {/*
          React Router renders the matched child route here.
        */}
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
