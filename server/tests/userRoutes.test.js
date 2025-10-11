import app from "../app.js";
import dotenv from "dotenv";
import mongoose from "mongoose";
import request from "supertest";

const env = dotenv.config({ override: false, quiet: true }).parsed;

beforeAll(async () => {
    mongoose.
        connect(env.MONGODB_TEST_URI)
        .catch((err) => {
            console.error("MongoDB connection error:", err);
            process.exit(2);
        })
});

describe('new-user api', () => {
    const data = {
        user_id: -1,
        spotify_id: -1,
        username: "mockuser",
        email: "mockuser@email.com"
    };
    it('Create mock User', async () => {
        await request(app)
            .post("/api/new-user")
            .send(data)
            .expect(201);
    })
    it('Duplicate user error', async () => {
        await request(app)
            .post("/api/new-user")
            .send(data)
            .expect(409);
    })
});

describe('delete-user api', () => {
    const data = { user_id: -1 };
    it('Delete mock User', async () => {
        await request(app)
            .post("/api/delete-user")
            .send(data)
            .expect(200)
    })
    it('User does\'t exist error', async () => {
        await request(app)
            .post("/api/delete-user")
            .send(data)
            .expect(409)
    })
})
