import { auth } from "express-oauth2-jwt-bearer";
import dotenv from "dotenv";

const env = dotenv.config({override: false, quiet: true}).parsed;

const checkJwt = auth({
  audience: env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${env.AUTH0_DOMAIN}`,
  tokenSigningAlg: "RS256",
});

export default checkJwt;
