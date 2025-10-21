import mongoose from "mongoose";
const { Schema } = mongoose;

const reviewSchema = new Schema({
  user_id: {
    type: String,
    required: true,
  },
  album_id: {
    type: String,
    required: true,
  },

  // Optional: song-by-song grading (1–10, including halves)
  song_ratings: [
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
  overall_rating: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
  },

  review_text: {
    type: String,
    maxlength: 350,
  },
},
  { 
    collection: "Reviews",
    timestamps: true 
  },
);

// Enforce one review per album per user
reviewSchema.index({ album: 1, user: 1 }, { unique: true });

const Reviews = mongoose.model("Reviews", reviewSchema);

export default Reviews;