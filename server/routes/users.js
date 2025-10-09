import express from "express";
import User from "../models/Users.js";

const router = express.Router();

router.post("/new-user", async(req, res) => {
    const { user_id, spotify_id, username, email } = req.body;
    // Check if user already exists
    if (User.findOne({ user_id }))
        return res.status(405);
    // Create new user
    const newUser = new User({
        user_id,
        spotify_id,
        username,
        email
    });
    // Save new user
    try {
        await newUser.save();
        res.status(200);
    } catch (error) {
        console.error("Save new user failed:", error);
        res.status(500);
    }
})

export default router;