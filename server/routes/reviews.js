import express from "express";
import Reviews from "../models/Reviews.js";

const router = express.Router();

router.get("/review/:user_id/:album_id", async (req, res) => {
    const { user_id, album_id } = req.params;

    try {
        const review = await Reviews.findOne({ user_id: user_id, album_id: album_id });
        if (!review)
            return res.status(409).json({ message: "Review does not exist" });
        res.status(201).json(review);
    } catch (error) {
        console.log("Database connection error:", error);
        res.status(500).json({ message: "Get Review failed" });
    }
})

router.post("/new-review", async (req, res) => {
    const { user_id, album_id, song_ratings } = req.body;

    // Calculate Overall Rating based on Song Ratings
    let overall_rating = 0;
    song_ratings.forEach((song) => overall_rating += song.rating);
    overall_rating = Math.round(10 * overall_rating / song_ratings.length);

    try {
        const existing_review = await Reviews.findOneAndUpdate(
            { user_id: user_id, album_id: album_id, },      // Filter
            {                                               
                song_ratings: song_ratings,                 // Update Content
                overall_rating: overall_rating
            }
        );
        // Create new review if review doesn't exist
        if (!existing_review) {
            const review = new Reviews({
                user_id,
                album_id,
                song_ratings,
                overall_rating,
            });
            await review.save();
            res.status(201).json({ message: "Review successfully saved" });
        } else
            res.status(201).json({ message: "Review successfully updated" });
    } catch (error) {
        console.error("Database connection error:", error);
        return res.status(500).json({ message: "Review save failed" });
    }
})

router.post("/delete-review", async (req, res) => {
    const { user_id, album_id } = req.body;

    try {
        const deletedCount = (await Reviews.deleteOne({ user_id: user_id, album_id: album_id })).deletedCount;
        if (deletedCount == 0)
            return res.status(409).json({ message: "Review does not exist" });
        res.status(200).json({ message: "Review deleted" });
    } catch (error) {
        console.error("Database connection error:", error);
        return res.status(500).json({ message: "Review delete failed" });
    }
})

export default router;