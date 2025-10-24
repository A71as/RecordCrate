import { auth } from "express-oauth2-jwt-bearer";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";

const app = express();
const env = dotenv.config({override: false, quiet: true}).parsed;

app.use(express.json());
app.use(cors());
//app.use(helmet());

const checkJwt = auth({
  audience: env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${env.AUTH0_DOMAIN}`,
  tokenSigningAlg: "RS256",
});

// Routes

import userRoutes from "./routes/users.js";
import reviewRoutes from "./routes/reviews.js"

app.use("/api", userRoutes);
app.use("/api", reviewRoutes);

app.get("/protected", checkJwt, (req, res) => {
  res.json({ message: "This is a protected route", user: req.auth });
});

export default app;