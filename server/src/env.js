// Environment configuration - must be imported first in index.js
import dotenv from "dotenv";

// Load .env.local file
dotenv.config({ path: ".env.local" });

// Debug logging
console.log("Environment loaded:", {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ? "✓ FOUND" : "✗ NOT FOUND",
  MONGODB_URI: process.env.MONGODB_URI ? "✓ FOUND" : "✗ NOT FOUND",
  PORT: process.env.PORT || "4000 (default)",
  NODE_ENV: process.env.NODE_ENV || "development (default)",
});

export default process.env;
