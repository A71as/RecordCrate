import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

export class SpotifyService {
  constructor(user) {
    this.user = user; // MongoDB user document
  }

  async getUserAccessToken() {
    const spotify = this.user.spotify;
    if (!spotify?.access_token) return null;

    // Check expiration
    if (spotify.expires_at && spotify.expires_at < new Date()) {
      return await this.refreshAccessToken();
    }

    return spotify.access_token;
  }

  async refreshAccessToken() {
    if (!this.user.spotify?.refresh_token) return null;

    try {
      const res = await axios.post(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: this.user.spotify.refresh_token,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization:
              "Basic " +
              Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
          },
        }
      );

      // Update MongoDB with new token
      this.user.spotify.access_token = res.data.access_token;
      this.user.spotify.expires_at = new Date(
        Date.now() + res.data.expires_in * 1000
      );
      await this.user.save();

      return res.data.access_token;
    } catch (err) {
      console.error("Failed to refresh Spotify token:", err.response?.data);
      return null;
    }
  }

  async getSpotifyProfile() {
    const token = await this.getUserAccessToken();
    if (!token) throw new Error("No valid Spotify token");

    const { data } = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  }

  async getUserTopArtists() {
    const token = await this.getUserAccessToken();
    const { data } = await axios.get(
      "https://api.spotify.com/v1/me/top/artists?limit=20",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data.items;
  }

  async getUserTopTracks() {
    const token = await this.getUserAccessToken();
    const { data } = await axios.get(
      "https://api.spotify.com/v1/me/top/tracks?limit=20",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data.items;
  }
}