import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import pool from "./db/database.js";

dotenv.config();

// Create the Express application.
const app = express();
const allowedOrigin = "http://localhost:5173"

app.use(express.json());
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
})
);
app.use(cookieParser())

// Attach authentication routes under /api/auth.
// This means /login in authRoutes becomes
// /api/auth/login in our application.
app.use("/api/auth", authRoutes);


// --------------------------------------------------
// API HEALTH CHECK
// --------------------------------------------------

// This route allows us to quickly check whether
// the Express server is running.
app.get("/api/health", (req, res) => {
  // Send a JSON response back to whoever requested this route.
  res.json({
    success: true,
    message: "FAE API is running",
  });
});


// --------------------------------------------------
// DATABASE HEALTH CHECK
// --------------------------------------------------

// This route checks whether Express can successfully
// communicate with our PostgreSQL database.
app.get("/api/health/database", async (req, res) => {
  try {
    // Ask PostgreSQL for its current date and time.
    // "await" pauses this function until PostgreSQL responds.
    const result = await pool.query("SELECT NOW()");

    // Send the database result back to the browser.
    res.json({
      success: true,
      message: "PostgreSQL connection is working",
      databaseTime: result.rows[0].now,
    });
  } catch (error) {
    // Log the actual database error on the server.
    // We don't send the full error to the browser because
    // database errors can contain information we don't want
    // to expose publicly.
    console.error("Database health check failed:", error);

    // Tell the browser that something went wrong.
    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});


// --------------------------------------------------
// START SERVER
// --------------------------------------------------

// Use the PORT value from .env.
// If PORT doesn't exist, use 5000 instead.
const PORT = process.env.PORT || 5000;

// Start listening for HTTP requests.
app.listen(PORT, () => {
  // Print a message so we know the server successfully started.
  console.log(`FAE API running on port ${PORT}`);
});