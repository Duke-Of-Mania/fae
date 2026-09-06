import pool from "./database.js";

// How often to sweep expired sessions out of PostgreSQL.
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

/*
 * deleteExpiredSessions
 *
 * Removes session rows whose expires_at has already passed.
 * Login and authenticateUser already ignore expired sessions,
 * so this just keeps the table from growing forever.
 */
export async function deleteExpiredSessions() {
  const result = await pool.query(
    `
      DELETE FROM appdata.sessions
      WHERE expires_at < CURRENT_TIMESTAMP
    `
  );

  if (result.rowCount > 0) {
    console.log(`Removed ${result.rowCount} expired session(s).`);
  }
}

/*
 * startSessionCleanup
 *
 * Runs an initial cleanup pass, then repeats it on an interval
 * for as long as the server process stays running.
 */
export function startSessionCleanup() {
  deleteExpiredSessions().catch((error) =>
    console.error("Session cleanup failed:", error)
  );

  setInterval(() => {
    deleteExpiredSessions().catch((error) =>
      console.error("Session cleanup failed:", error)
    );
  }, CLEANUP_INTERVAL_MS);
}
