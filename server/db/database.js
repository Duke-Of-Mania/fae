import pg from "pg";
import dotenv from "dotenv";

// Load the environment variables from the .env file.
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Listen for unexpected errors on idle database connections.
// This gives us useful information if PostgreSQL disconnects
// unexpectedly while the application is running.
pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL connection error: ", error);
});

export default pool;