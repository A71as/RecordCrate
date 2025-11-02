import SpotifyService from "../services/spotifyServices.js";
import checkJwt from "../middleware/checkJwt.js";
import Users from "../models/Users.js";
import express from "express";

const router = express.Router();

router.get("/profile/:user_id", checkJwt, async (req, res) => {
  try {
    const user = await Users.findOne({ user_id: req.params.user_id });
    if (!user) return res.status(404).json({ error: "User not found" });

    const spotify = new SpotifyService(user);
    const profile = await spotify.getSpotifyProfile();

    res.json(profile);
  } catch (err) {
    console.error("Spotify profile fetch failed:", err);
    res.status(500).json({ error: err.message });
  }
});
router.get("/top-artists", checkJwt, async (req, res) => {
  const user = await Users.findOne({ user_id: req.auth.payload.sub });
  if (!user) return res.status(404).json({ error: "User not found" });

  try {
    const spotify = new SpotifyService(user);
    const artists = await spotify.getUserTopArtists();
    res.json(artists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;