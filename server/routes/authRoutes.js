// Import Express so we can create routes for authentication.
import express from "express";

// Import the login controller.
// The controller contains the actual logic for processing
// a login request.
import { registerUser, loginUser, logoutUser } from "../controllers/authController.js";

// Import authentication middleware.
// This verifies the session cookie before allowing
// a protected route to execute.
import { authenticateUser } from "../middleware/authenticate.js";

// Create a router specifically for authentication routes.
const router = express.Router();

// Handle POST requests to /login.
// The controller will receive the request and process
// the user's email and password.
router.post("/login", loginUser);

// Handle POST requests to /register.
// The controller creates the new user account.
router.post("/register", registerUser);

router.post("/logout", logoutUser);

/*
 * GET /api/auth/me
 *
 * This protected endpoint returns information about the
 * currently authenticated user.
 *
 * authenticateUser runs first. If the session is valid,
 * it places the user's information on req.user.
 */
router.get("/me", authenticateUser, (req, res) => {
  // Return the authenticated user's information.
  //
  // We intentionally do not return sensitive information
  // such as the password hash or session token.
  return res.status(200).json({
    success: true,
    user: {
      userId: req.user.user_id,
      username: req.user.username,
      email: req.user.email,
      premium: req.user.premium,
      verified: req.user.verified,
    },
  });
});

// Export the router so server.js can attach it
// to the main Express application.
export default router;