// Import Node's built-in cryptography module.
// We use SHA-256 to hash the session token received
// from the browser before looking it up in PostgreSQL.
import crypto from "crypto";

// Import our shared PostgreSQL connection pool.
import pool from "../db/database.js";

/*
 * authenticateUser
 *
 * This middleware checks whether the incoming request
 * contains a valid FAE session cookie.
 *
 * If the session is valid, we attach the user's information
 * to req.user and allow the request to continue.
 *
 * If the session is missing, invalid, or expired, we stop
 * the request and return a 401 Unauthorized response.
 */
export async function authenticateUser(req, res, next) {
  try {
    // Read the raw session token from the HTTP-only cookie.
    // cookie-parser makes cookies available through req.cookies.
    const sessionToken = req.cookies.fae_session;

    // If there is no session cookie, the user is not authenticated.
    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // Hash the session token using SHA-256.
    // This produces the same hash that we stored during login.
    const sessionTokenHash = crypto
      .createHash("sha256")
      .update(sessionToken)
      .digest("hex");

    // Find the session and associated user.
    //
    // We join sessions to users so that the middleware
    // can identify the authenticated user in one database query.
    const result = await pool.query(
      `
        SELECT
          s.user_id,
          s.expires_at,
          u.username,
          u.email,
          u.premium,
          u.verified
        FROM appdata.sessions AS s
        INNER JOIN appdata.users AS u
          ON s.user_id = u.user_id
        WHERE s.session_token_hash = $1
          AND s.expires_at > CURRENT_TIMESTAMP
      `,
      [sessionTokenHash]
    );

    // If no matching session exists, the cookie is invalid
    // or the session has already been removed.
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session.",
      });
    }

    // Store the authenticated user's information on req.user.
    //
    // Any route that uses this middleware can now access
    // req.user without having to authenticate the user again.
    req.user = result.rows[0];

    // Update the session's last-used timestamp.
    // This records when the authenticated session was most
    // recently used by the application.
    await pool.query(
    `
        UPDATE appdata.sessions
        SET last_used_at = CURRENT_TIMESTAMP
        WHERE session_token_hash = $1
    `,
    [sessionTokenHash]
    );

    // Continue processing the original request.
    next();
  } catch (error) {
    // Log the actual error on the server for debugging.
    // We do not expose database or implementation details
    // to the client.
    console.error("Authentication middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred.",
    });
  }
}