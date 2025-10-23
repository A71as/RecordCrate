import cors from "cors";
import express from "express";
import auth from "express-oauth2-jwt-bearer";

const env = dotenv.config({override: false, quiet: true}).parsed;
const app = express();

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

export default app;