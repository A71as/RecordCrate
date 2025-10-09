import cors from "cors";
import dotenv from "dotenv";
import express from "express";
//import helmet from "helmet";
import mongoose from "mongoose";

const app = express();
app.use(express.json());
app.use(cors());
//app.use(helmet());

// There are better ways of doing this, but I don't want waste any more time
const env = dotenv.config({override: false, quiet: true}).parsed;
// Change port in env and not here
const SERVER_PORT = env.SERVER_PORT;
const MONGODB_URI = env.MONGODB_URI;


// MongoDB Logic
mongoose.
    connect(MONGODB_URI)
    .catch((err) => {
        console.error("MongoDB connection error:", err);
        // Change this if you want another program to catch db error (just in case)
        process.exit(1);
    })

// Routes

import userRoutes from "./routes/users.js";

app.use("/api", userRoutes);

app.listen(SERVER_PORT, () =>{
    console.log(`Server is running on port ${SERVER_PORT}`);
});