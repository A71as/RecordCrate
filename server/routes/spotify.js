import { SpotifyService  } from "../services/spotifyServices";
import Users from "../models/Users";
import express from "express";

const router = express.Router();

router.get("/profile", checkJwt, async (req, res) => {
  const user = await Users.findOne({ user_id: req.auth.payload.sub });
  if (!user) return res.status(404).json({ error: "User not found" });

  try {
    const spotify = new SpotifyService(user);
    const profile = await spotify.getSpotifyProfile();
    res.json(profile);
  } catch (err) {
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