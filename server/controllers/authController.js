import pool from "../db/database.js";
import argon2 from "argon2";
import crypto from "crypto";


// This function handles login requests.
// It receives the user's email and password,
// looks up the account, and verifies the password.
export async function loginUser(req, res) {
  try {
    // Get the email and password from the JSON request body.
    const { email, password } = req.body;

    // Make sure both values were provided.
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // Look up the user by email.
    //
    // The $1 placeholder prevents SQL injection because
    // PostgreSQL treats the email as data rather than
    // executable SQL.
    const result = await pool.query(
      `
        SELECT
          user_id,
          username,
          email,
          verified,
          pass_hash
        FROM appdata.users
        WHERE email = $1
      `,
      [email]
    );

    // If PostgreSQL didn't find a matching user,
    // the login credentials are invalid.
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Get the user record returned by PostgreSQL.
    const user = result.rows[0];

    // Compare the password provided by the user
    // against the Argon2 hash stored in PostgreSQL.
    const passwordIsValid = await argon2.verify(
      user.pass_hash,
      password
    );

    // If the password doesn't match the stored hash,
    // reject the login attempt.
    if (!passwordIsValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Generate a cryptographically secure random session token.
    // This raw token will eventually be given to the browser
    // through an HTTP-only cookie.
    const sessionToken = crypto.randomBytes(32).toString("hex");

    // Hash the session token before storing it in PostgreSQL.
    // The database therefore never contains the actual
    // credential that the browser possesses.
    const sessionTokenHash = crypto
      .createHash("sha256")
      .update(sessionToken)
      .digest("hex");

    // Create an expiration time seven days from now.
    // We will move this value into environment configuration
    // later so it can be changed without modifying code.
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    // Store the hashed session token in PostgreSQL.
    await pool.query(
      `
        INSERT INTO appdata.sessions (
          session_token_hash,
          user_id,
          expires_at
        )
        VALUES ($1, $2, $3)
      `,
      [
        sessionTokenHash,
        user.user_id,
        expiresAt,
      ]
    );

    // Send the raw session token to the browser as an HTTP-only cookie.
    // HTTP-only prevents JavaScript running in the browser from
    // reading the cookie, which helps protect the session from
    // client-side script attacks.
    res.cookie("fae_session", sessionToken, {
      // Prevent browser JavaScript from accessing the cookie.
      httpOnly: true,

      // Only send the cookie over HTTPS in production.
      // We keep this false during local HTTP development.
      secure: process.env.NODE_ENV === "production",

      // Prevent the browser from sending the cookie
      // with most cross-site requests.
      sameSite: "lax",

      // Make the cookie expire when our server-side session expires.
      expires: expiresAt,

      // Make the cookie available to the entire application.
      path: "/",
    });

    // The credentials are valid.
    //
    // We are intentionally not creating an authentication
    // cookie yet. That will be the next part of our
    // authentication implementation.
    return res.status(200).json({
      success: true,
      message: "Login successful.",
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    // Log the actual error on the server so we can
    // troubleshoot database or Argon2 problems.
    console.error("Login error:", error);

    // Don't expose the actual database or server error
    // to the browser.
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred.",
    });
  }
}

// This function handles new user registration.
// It validates the submitted information, hashes the password,
// and stores the new account in PostgreSQL.
export async function registerUser(req, res) {
  try {
    // Get the registration information from the request body.
    const { username, email, password } = req.body;

    // Make sure all required fields were provided.
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required.",
      });
    }

    // Check whether an account already exists with this email.
    const existingUser = await pool.query(
      `
        SELECT user_id
        FROM appdata.users
        WHERE email = $1
      `,
      [email]
    );

    // Prevent duplicate email addresses.
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An account with that email already exists.",
      });
    }

    // Hash the user's password using Argon2id.
    //
    // The original password is never stored in PostgreSQL.
    // Argon2 creates a one-way password hash that can later
    // be checked using argon2.verify().
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    // Generate a unique user ID.
    // crypto.randomUUID() creates a UUID that we can
    // use as the application's public user identifier.
    const userId = crypto.randomUUID();

    // Insert the new account into PostgreSQL.
    const result = await pool.query(
      `
        INSERT INTO appdata.users (
          user_id,
          username,
          premium,
          email,
          verified,
          pass_hash,
          created
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          CURRENT_TIMESTAMP
        )
        RETURNING
          user_id,
          username,
          email,
          premium,
          verified,
          created
      `,
      [
        userId,
        username,
        false,
        email,
        false,
        passwordHash,
      ]
    );

    // Return the newly created user without ever
    // returning the password or password hash.
    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: result.rows[0],
    });
  } catch (error) {
    // Log the actual error on the server for troubleshooting.
    console.error("Registration error:", error);

    // Return a generic message to the browser.
    // Database details should not be exposed to clients.
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred.",
    });
  }
}