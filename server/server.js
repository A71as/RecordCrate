import app from "./app.js"
import dotenv from "dotenv";
import mongoose from "mongoose";

// Get environment file
const env = dotenv.config({override: false, quiet: true}).parsed;

// Connect to RecordCrate database
mongoose.
    connect(env.MONGODB_URI)
    .catch((err) => {
        console.error("MongoDB connection error:", err);
        // Change this if you want another program to catch db error (just in case)
        process.exit(1);
    })

// Confirm server is running
app.listen(env.SERVER_PORT, () =>{
    console.log(`Server is running on port ${env.SERVER_PORT}`);
});
