import checkJwt from "../middleware/checkJwt.js";
import express from "express";
import User from "../models/Users.js";

const router = express.Router();

// Work in progress
router.get("user", checkJwt, async (req, res) => {
    const user_id = req.auth.payload.sub;
    const user = await User.findOne({ user_id: user_id });
})

// This will handle auth0 registration
router.post("/new-user", checkJwt, async (req, res) => {
    const payload = req.auth.payload;
    const sub = payload.sub;
    const name = payload["https://your-api/name"];
    const email = payload["https://your-api/email"];
    const picture = payload["https://your-api/picture"];

    try {
        // Check if user already exists
        const existing_user = await User.findOne({ sub });
        if (existing_user)
            return res.status(409).json({ message: "User already exists" });

        // Create new user
        const newUser = new User({
            user_id: sub,
            name,
            email,
            picture
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