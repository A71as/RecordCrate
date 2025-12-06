import axios from 'axios';
import type { SpotifyAlbum } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface DailyRecommendation {
  album: {
    name: string;
    artist: string;
    searchQuery: string;
  };
  reason: string;
  date: string;
  userId: string;
  spotifyAlbum?: SpotifyAlbum; // Populated after Spotify search
}

export interface DailyAlbumLog {
  [date: string]: {
    albumId: string;
    albumName: string;
    artistName: string;
    reason: string;
    reviewed: boolean;
    reviewId?: string;
  };
}

/**
 * Daily Recommendation Service
 * Manages the "Album of the Day" feature with AI recommendations
 */
class DailyRecommendationService {
  private readonly STORAGE_KEY = 'aiDailyAlbumLog';

  /**
   * Get today's AI-recommended album for a user
   * Fetches from backend API and caches in localStorage
   */
  async getTodayRecommendation(userId: string): Promise<DailyRecommendation | null> {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Check if we already have today's recommendation in localStorage
      const cached = this.getCachedRecommendation(today);
      if (cached) {
        return cached;
      }

      // Fetch from backend API
      const response = await axios.get<DailyRecommendation>(
        `${API_BASE_URL}/api/daily-recommendation/${userId}`
      );

      const recommendation = response.data;
      
      // Cache the recommendation
      this.cacheRecommendation(recommendation);
      
      return recommendation;
    } catch (error) {
      console.error('Failed to fetch daily recommendation:', error);
      return null;
    }
  }

  /**
   * Get cached recommendation for a specific date
   */
  getCachedRecommendation(date: string): DailyRecommendation | null {
    try {
      const log = this.getDailyLog();
      const entry = log[date];
      
      if (!entry) return null;
      
      return {
        album: {
          name: entry.albumName,
          artist: entry.artistName,
          searchQuery: `album:${entry.albumName} artist:${entry.artistName}`
        },
        reason: entry.reason,
        date,
        userId: '', // Not stored in localStorage
      };
    } catch {
      return null;
    }
  }

  /**
   * Cache a recommendation in localStorage
   */
  private cacheRecommendation(recommendation: DailyRecommendation): void {
    try {
      const log = this.getDailyLog();
      
      log[recommendation.date] = {
        albumId: '', // Will be populated when user searches/finds the album
        albumName: recommendation.album.name,
        artistName: recommendation.album.artist,
        reason: recommendation.reason,
        reviewed: false,
      };
      
      this.saveDailyLog(log);
    } catch (error) {
      console.error('Failed to cache recommendation:', error);
    }
  }

  /**
   * Mark today's recommendation as reviewed
   * Called when user posts a review for the recommended album
   */
  markAsReviewed(date: string, albumId: string, reviewId?: string): void {
    try {
      const log = this.getDailyLog();
      
      if (log[date]) {
        log[date].reviewed = true;
        log[date].albumId = albumId;
        if (reviewId) {
          log[date].reviewId = reviewId;
        }
        this.saveDailyLog(log);
      }
    } catch (error) {
      console.error('Failed to mark recommendation as reviewed:', error);
    }
  }

  /**
   * Update the album ID for a recommendation without marking as reviewed
   * Called when we find the Spotify album for the recommendation
   */
  updateAlbumId(date: string, albumId: string): void {
    try {
      const log = this.getDailyLog();
      
      if (log[date]) {
        log[date].albumId = albumId;
        this.saveDailyLog(log);
      }
    } catch (error) {
      console.error('Failed to update album ID:', error);
    }
  }

  /**
   * Check if a specific album was today's recommendation
   */
  isTodayRecommendation(albumId: string): boolean {
    const today = new Date().toISOString().split('T')[0];
    return this.isRecommendationForDate(today, albumId);
  }

  /**
   * Check if an album was the recommendation for a specific date
   */
  isRecommendationForDate(date: string, albumId: string): boolean {
    try {
      const log = this.getDailyLog();
      const entry = log[date];
      return entry?.albumId === albumId;
    } catch {
      return false;
    }
  }

  /**
   * Get the daily log from localStorage
   */
  getDailyLog(): DailyAlbumLog {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  /**
   * Save the daily log to localStorage
   */
  private saveDailyLog(log: DailyAlbumLog): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(log));
      // Trigger storage event for other components
      window.dispatchEvent(new StorageEvent('storage', {
        key: this.STORAGE_KEY,
        newValue: JSON.stringify(log),
      }));
    } catch (error) {
      console.error('Failed to save daily log:', error);
    }
  }

  /**
   * Get calendar entries for a specific month
   * Returns status for each day (completed = reviewed, pending = not reviewed, empty = no recommendation)
   */
  getCalendarEntries(year: number, month: number): Array<{ date: string; status: 'completed' | 'pending' | 'empty' }> {
    const log = this.getDailyLog();
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    
    const entries: Array<{ date: string; status: 'completed' | 'pending' | 'empty' }> = [];
    
    // Get all dates in the log for this month
    Object.keys(log)
      .filter(date => date.startsWith(monthPrefix))
      .forEach(date => {
        const entry = log[date];
        entries.push({
          date,
          status: entry.reviewed ? 'completed' : 'pending'
        });
      });
    
    return entries;
  }

  /**
   * Check if user has reviewed the recommended album for a specific date
   */
  hasReviewedForDate(date: string): boolean {
    try {
      const log = this.getDailyLog();
      return log[date]?.reviewed || false;
    } catch {
      return false;
    }
  }
}

export const dailyRecommendationService = new DailyRecommendationService();
