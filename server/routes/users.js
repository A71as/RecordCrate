import express from "express";
import User from "../models/Users.js";

const router = express.Router();

// Router.get user will need authentication to be working first.
// router.get("user", async (req, res) => {})

router.post("/new-user", async (req, res) => {
    const { user_id, spotify_id, username, email } = req.body;

    try {
        // Check if user already exists
        const existing_user = await User.findOne({ user_id });
        if (existing_user)
            return res.status(409).json({ message: "User already exists" });

        // Create new user
        const newUser = new User({
            user_id,
            spotify_id,
            username,
            email
        });

        // Save new user
        await newUser.save();
        res.status(201).json({ message: "New user saved" });
        // If not, return error code 500
    } catch (error) {
        console.error("Database connection error:", error);
        res.status(500).json({ message: "Save failed" });
    }
})

router.post("/delete-user", async (req, res) => {
    const { user_id } = req.body;
    try {
        const deletedCount = (await User.deleteOne({ user_id })).deletedCount;
        if (deletedCount == 0)
            return res.status(409).json({ message: "User does not exist" });
        res.status(200).json({ message: "User deleted" });
    }
    catch (error) {
        console.error("Database connection error:", error);
        res.status(500).json({ message: "Delete failed" });
    }
})

export default router;