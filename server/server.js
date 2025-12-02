import app from "./app.js"
import dotenv from "dotenv";
import mongoose from "mongoose";

// Get environment file
const env = dotenv.config({override: false, quiet: true}).parsed;

// Connect to RecordCrate database (optional)
if (env.MONGODB_URI) {
  mongoose.
      connect(env.MONGODB_URI)
      .then(() => console.log('MongoDB connected'))
      .catch((err) => {
          console.error("MongoDB connection error:", err);
          // Change this if you want another program to catch db error (just in case)
          process.exit(1);
      });
} else {
  console.log('MongoDB not configured, running without database');
}

// Global error handler
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Confirm server is running
const port = env.SERVER_PORT || env.PORT || 4000;
app.listen(port, () =>{
    console.log(`Server is running on port ${port}`);
});
