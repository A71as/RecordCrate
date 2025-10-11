import cors from "cors";
import express from "express";

const app = express();

app.use(express.json());
app.use(cors());
//app.use(helmet());

// Routes

import userRoutes from "./routes/users.js";
import reviewRoutes from "./routes/reviews.js"

app.use("/api", userRoutes);
app.use("/api", reviewRoutes);

export default app;