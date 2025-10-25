import cors from "cors";
import express from "express";

const app = express();

app.use(express.json());
app.use(cors());
//app.use(helmet());

// Routes

import defaultRoutes from "./routes/default.js";
import userRoutes from "./routes/users.js";
import reviewRoutes from "./routes/reviews.js";
import spotifyRoutes from "./routes/spotify.js";

app.use("/", defaultRoutes);
app.use("/api", userRoutes);
app.use("/api", reviewRoutes);
app.use("/spotify", spotifyRoutes);

export default app;