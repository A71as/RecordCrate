import app from "../app.js";
import axios from "axios";
import dotenv from "dotenv";
import request from "supertest";

const env = dotenv.config({ override: false, quiet: true }).parsed;

const getAuth0Token = async () => {
    const res = await axios.post(`https://${env.AUTH0_DOMAIN}/oauth/token`, {
        client_id: env.AUTH0_CLIENT_ID,
        client_secret: env.AUTH0_CLIENT_SECRET,
        audience: env.AUTH0_AUDIENCE,
        grant_type: "client_credentials",
    });
    return res.data.access_token;
};

describe('protected api', () => {
    it('Try to access protected api without authentication', async () =>
        await request(app)
            .get("/protected")
            .expect(400)
    );
    it('Access protected api with authentication', async () => {
        // Warning, test will fail if token is expired
        // If test token is expired, replace env.TEST_TOKEN with getAuth0Token() 
        // and use console.log(token) to save the new token in .env
        const token = env.TEST_TOKEN;
        await request(app)
            .get("/protected")
            .set("Authorization", `Bearer ${token}`)
            .expect(200)
    });
});
