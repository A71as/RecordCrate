import mongoose from 'mongoose';

const SongRatingSchema = new mongoose.Schema(
  {
    trackId: { type: String, required: true },
    trackName: { type: String, default: '' },
    rating: { type: Number, required: true }, // 0..5 star (or half-star) as used in UI
  },
  { _id: false }
);

const ScoreModifiersSchema = new mongoose.Schema(
  {
    emotionalStoryConnection: { type: Number, default: 0 },
    cohesionAndFlow: { type: Number, default: 0 },
    artistIdentityOriginality: { type: Number, default: 0 },
    visualAestheticEcosystem: { type: Number, default: 0 },
  },
  { _id: false }
);

const AlbumReviewSchema = new mongoose.Schema(
  {
    userSpotifyId: { type: String, required: true, index: true },
    albumId: { type: String, required: true, index: true },
    // ratings in percent 0..100
    overallRating: { type: Number, required: true },
    baseOverallRating: { type: Number },
    adjustedOverallRating: { type: Number },
    scoreModifiers: { type: ScoreModifiersSchema, default: {} },
    // per-track ratings
    songRatings: { type: [SongRatingSchema], default: [] },
    writeup: { type: String, default: '' },
    // some album metadata for convenience in feeds
    albumName: { type: String },
    albumArtists: { type: [String], default: [] },
    albumImage: { type: String },
  },
  { timestamps: true }
);

AlbumReviewSchema.index({ userSpotifyId: 1, albumId: 1 }, { unique: true });

export const AlbumReview =
  mongoose.models.AlbumReview || mongoose.model('AlbumReview', AlbumReviewSchema);
