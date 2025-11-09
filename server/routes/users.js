import checkJwt from "../middleware/checkJwt.js";
import express from "express";
import management from "../middleware/management.js";
import Users from "../models/Users.js";

const router = express.Router();

// Adds creation date to Auth0's user database
// This is used as a check for front-end to know user has been created in MongoDB
async function addCreatedDate(user_id, created_date) {
    await management.users.update(
        user_id,
        { app_metadata: { created: created_date } }
    );
}

// Checks if user already exists in database
router.get("/check-user/:user_id", checkJwt, async (req, res) => {
    try {
        const user = await Users.findOne({ user_id: req.params.user_id });
        if (!user)
            res.status(204).json({ message: "User doesn't exist" });
        else
            res.status(200).json({ message: "User exists" });
    } catch {
        res.status(500).json({ message: "Search Failed" });
    }
})

// If new user, this api should be called to add the new user to the database
router.post("/new-user", checkJwt, async (req, res) => {
    try {
        const { user_id, name, username, email, picture } = req.body;
        const created_at = Date.now();
        // Create new user
        const newUser = new Users({
            user_id,
            name,
            username,
            email,
            picture,
            created_at
        });
        // Save new user
        await newUser.save();
        addCreatedDate(user_id, (new Date(created_at)).toISOString());
        res.status(201).json(newUser);
    } catch (error) {
        console.error("Database connection error:", error);
        res.status(500).json({ message: "Save failed" });
    }
})

router.post("/user/save-spotify", checkJwt, async (req, res) => {
    try {
        const { user_id, spotify_token, spotify_refresh } = req.body;
        await Users.updateOne(
            { user_id },
            {
                spotify: {
                    'spotify_token': spotify_token,
                    'spotify_refresh': spotify_refresh,
                },
            },
            { upsert: true }
        );
        res.status(201).json({ message: "Spotify token saved" });
    } catch (error) {
        console.error("Database connected error:", (error));
        res.status(500).json({ message: "Save failed" });
    }
});

// Delete user route
router.delete("/delete-user/:user_id", async (req, res) => {
    const user_id = req.params.user_id;
    try {
        const deletedCount = (await Users.deleteOne({ user_id })).deletedCount;
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