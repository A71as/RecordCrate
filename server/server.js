import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

const app = express();
app.use(express.json());

// There are better ways of doing this, but I don't want waste any more time
const env = dotenv.config({override: false, quiet: true}).parsed;
// Change port in env and not here
const SERVER_PORT = env.SERVER_PORT;
const MONGODB_URL = env.MONGODB_URL;


// MongoDB Logic
mongoose.
    connect(env.MONGODB_URI)
    .catch((err) => {
        console.error("MongoDB connection error:", err);
        // Change this if you want another program to catch db error (just in case)
        process.exit();
    })

app.listen(SERVER_PORT, () =>{
    console.log(`Server is running on port ${SERVER_PORT}`);
});