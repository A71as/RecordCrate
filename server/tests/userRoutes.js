import mongoose from "mongoose";
import App from "../server.js";
import User from "../models/Users";

beforeAll(async () => 
    await mongoose.connect(process.env.MONGO)
)