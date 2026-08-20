// This component displays the login page.
// For now, it only provides the visual structure of the form.
// We will connect the form to our Express authentication API later.
function LoginPage() {
  return (
    <main>
      <h1>Log In</h1>

      <form>
        {/* This label tells the user what information belongs in the input. */}
        <label htmlFor="email">
          Email
        </label>

        {/* This input allows the user to enter their email address. */}
        <input
          id="email"
          name="email"
          type="email"
          placeholder="Enter your email"
        />

        {/* This label tells the user what information belongs in the input. */}
        <label htmlFor="password">
          Password
        </label>

        {/* This input hides the user's password while they type it. */}
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Enter your password"
        />

        {/* This button will eventually submit the login request
            to our Express authentication API. */}
        <button type="submit">
          Log In
        </button>
      </form>
    </main>
  );
}

// Export the component so React Router can display it
// when the user visits the /login URL.
export default LoginPage;