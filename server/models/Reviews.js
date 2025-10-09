const mongoose = require("mongoose");
const { Schema } = mongoose;

const reviewSchema = new Schema({
     user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    album: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Album",
      required: true,
    },

    // Optional: song-by-song grading (1–10, including halves)
    songRatings: [
      {
        trackTitle: String,
        rating: {
          type: Number,
          min: 1,
          max: 10,
          set: (v) => Math.round(v * 2) / 2, // allows half points (e.g. 7.5)
        },
      },
    ],

    // Automatically averaged 1–10 scale -> stored as percentage
    overallRating: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },

    reviewText: {
      type: String,
      maxlength: 350,
    },
  },
  { timestamps: true }
);

// Enforce one review per album per user
reviewSchema.index({ album: 1, user: 1 }, { unique: true });

const Reviews = mongoose.model("Reviews", reviewSchema);
export default Reviews;