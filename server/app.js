import cors from "cors";
import dotenv from "dotenv";
import express from "express";
//import helmet from "helmet";
import mongoose from "mongoose";

const app = express();

app.use(express.json());
app.use(cors());
//app.use(helmet());

// Routes

import userRoutes from "./routes/users.js";

app.use("/api", userRoutes);


export default app;