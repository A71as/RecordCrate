import checkJwt from "../middleware/checkJwt.js";
import express from "express";
import User from "../models/Users.js";

const router = express.Router();

// Checks if user already exists in database. Used to check for new users
router.get("/check-user/:user_id", checkJwt, async (req, res) => {
    try {
        const user = await User.findOne({ user_id: req.params.user_id });
        if (!user)
            res.status(204).json({ message: "User doesn't exist" });
        res.json({ message: "User exists" });
    } catch {
        res.status(500).json({ message: "Search Failed" });
    }
})

// If new user, this api should be called to add the new user to the database
router.post("/new-user", checkJwt, async (req, res) => {
    try {
        const { user_id, name, username, email, picture } = req.body;
        // Create new user
        const newUser = new User({
            user_id,
            name,
            username,
            email,
            picture
        });

        // Save new user
        await newUser.save();
        res.status(201).json({ message: "New user saved" });
    } catch (error) {
        console.error("Database connection error:", error);
        res.status(500).json({ message: "Save failed" });
    }
})

// Delete user route
router.delete("/user/:user_id", async (req, res) => {
    const user_id = req.params.id;
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