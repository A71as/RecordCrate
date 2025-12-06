// Recommendation Service - Suggests music based on user's review history
import type { SpotifyAlbum, SpotifyArtist, AlbumReview } from '../types';
import { spotifyService } from './spotify';

export interface RecommendationScore {
  item: SpotifyAlbum | SpotifyArtist;
  score: number;
  reason: string;
}

class RecommendationService {
  /**
   * Get album recommendations based on user's review history
   */
  async getAlbumRecommendations(limit: number = 20): Promise<RecommendationScore[]> {
    const reviews = this.getUserReviews();
    
    if (reviews.length === 0) {
      // No reviews yet, return popular albums
      const popular = await spotifyService.getPopularAlbums();
      return popular.slice(0, limit).map((album, index) => ({
        item: album,
        score: 100 - (index * 2),
        reason: 'Popular recommendation'
      }));
    }

    const recommendations: RecommendationScore[] = [];

    // Get recommendations based on highly-rated albums' artists
    const topReviews = reviews
      .filter(r => r.overallRating >= 7)
      .sort((a, b) => b.overallRating - a.overallRating)
      .slice(0, 5);

    for (const review of topReviews) {
      if (!review.album) continue;
      
      // Get albums by same artists
      for (const artist of review.album.artists) {
        try {
          const artistAlbums = await spotifyService.searchAlbums(artist.name);
          
          artistAlbums.forEach(album => {
            // Don't recommend albums the user has already reviewed
            if (reviews.some(r => r.albumId === album.id)) return;
            
            const existingRec = recommendations.find(r => r.item.id === album.id);
            if (existingRec) {
              existingRec.score += 10;
            } else {
              recommendations.push({
                item: album,
                score: 70 + (review.overallRating * 2),
                reason: `Because you rated ${review.album?.name || 'this album'} ${review.overallRating}/10`
              });
            }
          });
        } catch (error) {
          console.error('Error fetching artist albums:', error);
        }
      }
    }

    // Add some discovery - new releases for variety
    try {
      const newReleases = await spotifyService.getNewReleases(10);
      newReleases.forEach((album, index) => {
        if (!reviews.some(r => r.albumId === album.id)) {
          recommendations.push({
            item: album,
            score: 50 - index,
            reason: 'New release you might like'
          });
        }
      });
    } catch (error) {
      console.error('Error fetching new releases:', error);
    }

    // Sort by score and return top recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get artist recommendations based on listening history
   */
  async getArtistRecommendations(limit: number = 15): Promise<RecommendationScore[]> {
    const reviews = this.getUserReviews();
    
    if (reviews.length === 0) {
      const topArtists = await spotifyService.getTopArtists();
      return topArtists.slice(0, limit).map((artist, index) => ({
        item: artist,
        score: 100 - (index * 3),
        reason: 'Popular artist'
      }));
    }

    const artistFrequency = new Map<string, { artist: SpotifyArtist; count: number; avgRating: number }>();

    // Count and rate artists from reviews
    reviews.forEach(review => {
      if (!review.album) return;
      
      review.album.artists.forEach(artist => {
        const existing = artistFrequency.get(artist.id);
        if (existing) {
          existing.count++;
          existing.avgRating = (existing.avgRating + review.overallRating) / 2;
        } else {
          artistFrequency.set(artist.id, {
            artist: artist as SpotifyArtist,
            count: 1,
            avgRating: review.overallRating
          });
        }
      });
    });

    // Convert to recommendations
    const recommendations: RecommendationScore[] = Array.from(artistFrequency.values())
      .map(({ artist, count, avgRating }) => ({
        item: artist,
        score: (count * 10) + (avgRating * 5),
        reason: `You've reviewed ${count} album${count > 1 ? 's' : ''} by this artist`
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return recommendations;
  }

  /**
   * Get genre-based recommendations
   */
  async getGenreBasedRecommendations(limit: number = 20): Promise<RecommendationScore[]> {
    const reviews = this.getUserReviews();
    const topReviews = reviews
      .filter(r => r.overallRating >= 8)
      .slice(0, 3);

    if (topReviews.length === 0) {
      const popular = await spotifyService.getPopularAlbums();
      return popular.slice(0, limit).map((album, index) => ({
        item: album,
        score: 80 - index,
        reason: 'Based on popular music'
      }));
    }

    const recommendations: RecommendationScore[] = [];

    // Use artist names from top-rated albums to find similar music
    for (const review of topReviews) {
      if (!review.album) continue;
      
      const artistName = review.album.artists[0]?.name;
      if (!artistName) continue;

      try {
        // Search for albums with similar characteristics
        const similar = await spotifyService.searchAlbums(artistName);
        
        similar.forEach(album => {
          if (reviews.some(r => r.albumId === album.id)) return;
          
          const existingRec = recommendations.find(r => r.item.id === album.id);
          if (existingRec) {
            existingRec.score += 5;
          } else {
            recommendations.push({
              item: album,
              score: 60 + review.overallRating,
              reason: `Similar to ${review.album?.name || 'your favorite albums'}`
            });
          }
        });
      } catch (error) {
        console.error('Error fetching similar albums:', error);
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get user reviews from localStorage
   */
  private getUserReviews(): AlbumReview[] {
    try {
      const reviews = localStorage.getItem('albumReviews');
      return reviews ? JSON.parse(reviews) : [];
    } catch (error) {
      console.error('Error loading reviews:', error);
      return [];
    }
  }

  /**
   * Get "For You" recommendations - mixed approach
   */
  async getPersonalizedFeed(limit: number = 30): Promise<{
    albums: RecommendationScore[];
    artists: RecommendationScore[];
  }> {
    const [albumRecs, artistRecs] = await Promise.all([
      this.getAlbumRecommendations(limit),
      this.getArtistRecommendations(Math.floor(limit / 2))
    ]);

    return {
      albums: albumRecs,
      artists: artistRecs
    };
  }
}

export const recommendationService = new RecommendationService();
