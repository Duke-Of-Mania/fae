// Import Link from React Router.
// Link allows navigation without reloading the entire application.
import { Link } from "react-router-dom";

// Import our shared page layout.
import PageLayout from "../components/PageLayout";

// This component displays the main FAE landing page.
function LandingPage({ handleLogout }) {
  return (
    <PageLayout>
      {/* Hero section introduces FAE to new visitors. */}
      <section className="hero">

        <p className="hero-eyebrow">
          Dungeons & Dragons
        </p>

        <h1>
          FAE
        </h1>

        <p className="hero-description">
          Your adventure starts here.
          Create characters, build campaigns,
          and bring your next story to life.
        </p>

        {/* These links provide the primary actions
            available to a visitor. */}
        <div className="hero-actions">

          {/* Navigate to the login page. */}
          <Link
            className="button button-primary"
            to="/login"
          >
            Log In
          </Link>

          {/* Registration will be implemented later.
              For now this link does not point anywhere. */}
          <button
            className="button button-secondary"
            type="button"
          >
            Create Account
          </button>
          {/* 
            Calls the logout function supplied by App.
            App handles the API request and authentication state.
          */}
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </section>
    </PageLayout>
  );
}

// Export the component so App.jsx can render it.
export default LandingPage;