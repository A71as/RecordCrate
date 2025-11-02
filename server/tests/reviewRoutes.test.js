import app from "../app.js";
import dotenv from "dotenv";
import mongoose from "mongoose";
import request from "supertest";

dotenv.config();

beforeAll(async () => {
    mongoose.
        connect(process.env.MONGODB_TEST_URI)
        .catch((err) => {
            console.error("MongoDB connection error:", err);
            process.exit(2);
        })
});


describe('new-review api', () => {
    let data = {
        user_id: -1,
        album_id: -1,
        song_ratings: [
            { trackTitle: "track1", rating: 1.5 },
            { trackTitle: "track2", rating: 3 },
            { trackTitle: "track15", rating: 7 }
        ],
        review_text: "Something something, album is cool"
    };
    let mock_review;
    it('Create mock review', async () => {
        await request(app)
            .post("/api/new-review")
            .send(data)
            .expect(201);
    })
    it('Get mock review', async () => {
        const response = await request(app)
            .get("/api/review/" + data.user_id + "/" + data.album_id)
            .expect(201);
        mock_review = response.body;
    })
    data.song_ratings = [
        { trackTitle: "track1", rating: 5.5 },
        { trackTitle: "track2", rating: 7 },
        { trackTitle: "track15", rating: 9.5 }
    ],
        it('Update review', async () => {
            await request(app)
                .post("/api/new-review")
                .send(data)
                .expect(201);
        })
    it('Get updated review', async () => {
        await request(app)
            .get("/api/review/" + data.user_id + "/" + data.album_id)
            .expect(201)
            .expect(res => {
                if (res.body == mock_review)
                    throw new Error('Review did not update');
            });
    })
});


describe('delete-review api', () => {
    it("Delete mock review", async () => {
        await request(app)
            .post("/api/delete-review")
            .send({ user_id: -1, album_id: -1 })
            .expect(200)
    })
    it("Review doesn't exist", async () => {
        await request(app)
            .post("/api/delete-review")
            .send({ user_id: -1, album_id: -1 })
            .expect(409)
    })
});
