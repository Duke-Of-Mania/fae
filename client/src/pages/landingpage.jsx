// This component displays the main landing page
// that visitors see when they first arrive at FAE.
function LandingPage() {
  return (
    <main>
      <h1>FAE</h1>

      <p>
        Your Dungeons & Dragons adventure starts here.
      </p>

      <button>
        Log In
      </button>

      <button>
        Create Account
      </button>
    </main>
  );
}

// Export the component so other React files
// can import and display the landing page.
export default LandingPage;