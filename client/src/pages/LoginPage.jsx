// Import useState so React can keep track of
// the values entered into our form fields.
import { useState } from "react";

// Import Link so the user can return to the landing page.
import { Link } from "react-router-dom";

// Import our shared page layout.
import PageLayout from "../components/PageLayout";

// This component displays and manages the login form.
function LoginPage() {
  // Store the email entered by the user.
  // email contains the current value.
  // setEmail changes the value of email.
  const [email, setEmail] = useState("");

  // Store the password entered by the user.
  // password contains the current value.
  // setPassword changes the value of password.
  const [password, setPassword] = useState("");

  // Store an error message that we can display
  // when the form contains invalid information.
  const [error, setError] = useState("");

  // This function runs when the user submits the form.
  function handleSubmit(event) {
    // Prevent the browser from performing its normal
    // form submission, which would reload the page.
    event.preventDefault();

    // Clear any previous error message.
    setError("");

    // Check that the user entered an email address.
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    // Check that the user entered a password.
    if (!password) {
      setError("Please enter your password.");
      return;
    }
  }

  return (
    <PageLayout>
      <section className="login-page">
        <div className="login-card">

          <h1>Log In</h1>

          <p>
            Welcome back to FAE.
          </p>

          {/* Display the error message when one exists. */}
          {error && (
            <p className="form-error">
              {error}
            </p>
          )}

          {/* handleSubmit runs when the user submits this form. */}
          <form onSubmit={handleSubmit}>

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
                placeholder="Enter your password"
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </div>

            {/* Submit the login form. */}
            <button
              className="button button-primary"
              type="submit"
            >
              Log In
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
// when the user visits /login.
export default LoginPage;