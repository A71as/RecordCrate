const mongoose = require("mongoose");
const { Schema } = mongoose;

const albumSchema = new Schema({
    spotifyId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    artist: { type: String, required: true, trim: true },
    releaseYear: Number,
    genre: [String],
    coverUrl: String,

    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const albums = mongoose.model("albums", albumSchema);

export default albums;