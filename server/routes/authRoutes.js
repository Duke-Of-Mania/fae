// Import Express so we can create routes for authentication.
import express from "express";

// Import the login controller.
// The controller contains the actual logic for processing
// a login request.
import { registerUser, loginUser } from "../controllers/authController.js";

// Create a router specifically for authentication routes.
const router = express.Router();

// Handle POST requests to /login.
// The controller will receive the request and process
// the user's email and password.
router.post("/login", loginUser);

// Handle POST requests to /register.
// The controller creates the new user account.
router.post("/register", registerUser);

// Export the router so server.js can attach it
// to the main Express application.
export default router;