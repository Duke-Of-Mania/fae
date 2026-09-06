// Import useState so React can keep track of
// the values entered into our form fields.
import { useState } from "react";

// Import Link and useNavigate for navigation between pages.
import { Link, useNavigate } from "react-router-dom";

// Import our shared page layout.
import PageLayout from "../components/PageLayout";

import { register } from "../services/api";

// This component displays and manages the account creation form.
function RegisterPage() {
  // Store the values entered by the user.
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Store an error message that we can display
  // when registration fails.
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // This function runs when the user submits the form.
  async function handleSubmit(event) {
    // Prevent the browser from performing its normal
    // form submission, which would reload the page.
    event.preventDefault();

    // Clear any error from a previous attempt.
    setError("");

    try {
      // Send the new account's information to our Express API.
      //
      // Registration does not log the user in, so we send
      // them to the login page afterward.
      await register(username, email, password);

      navigate("/login", { state: { justRegistered: true } });
    } catch (error) {
      // Display the error returned by our API helper.
      setError(error.message);
    }
  };

  return (
    <PageLayout>
      <section className="login-page">
        <div className="login-card">

          <h1>Create Account</h1>

          <p>
            Join FAE to start building characters and campaigns.
          </p>

          {/* Display the error message when one exists. */}
          {error && (
            <p className="form-error">
              {error}
            </p>
          )}

          {/* handleSubmit runs when the user submits this form. */}
          <form onSubmit={handleSubmit}>

            {/* Username field */}
            <div className="form-field">
              <label htmlFor="username">
                Username
              </label>

              <input
                id="username"
                name="username"
                type="text"
                value={username}
                placeholder="Choose a username"
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
              />
            </div>

            {/* Email field */}
            <div className="form-field">
              <label htmlFor="email">
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={email}
                placeholder="Enter your email"
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </div>

            {/* Password field */}
            <div className="form-field">
              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                value={password}
                placeholder="Choose a password"
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
              />
            </div>

            {/* Submit the registration form. */}
            <button
              className="button button-primary"
              type="submit"
            >
              Create Account
            </button>
          </form>

          {/* Give the user a way to return to the landing page. */}
          <Link to="/">
            Back to FAE
          </Link>

        </div>
      </section>
    </PageLayout>
  );
}

// Export the component so React Router can display it
// when the user visits /register.
export default RegisterPage;
