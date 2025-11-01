import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useSpotify } from '../hooks/useSpotify';
import type { DiscographyEntry } from '../types';
import { MusicFilterBar, type MusicFilterState } from '../components/MusicFilterBar';

const formatReleaseDate = (dateString: string) => {
  if (!dateString) {
    return 'Unknown';
  }

  if (dateString.length === 4) {
    return dateString;
  }

  if (dateString.length === 7) {
    const [year, month] = dateString.split('-');
    const monthIndex = Number(month) - 1;
    const monthName = new Date(2000, monthIndex, 1).toLocaleString(undefined, {
      month: 'long',
    });
    return `${monthName} ${year}`;
  }

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return dateString;
  }

  return parsed.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const DEFAULT_DECADES = ['2020s', '2010s', '2000s', '1990s', '1980s', '1970s', '1960s', '1950s', '1940s'];
const PAGE_SIZE = 50;

export const Discography: React.FC = () => {
  const { loading, error, getPopularTracks, getAvailableGenres } = useSpotify();
  const [entries, setEntries] = useState<DiscographyEntry[]>([]);
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [filters, setFilters] = useState<MusicFilterState>({
    genre: 'all',
    decade: 'all',
    rating: 'all',
    explicit: 'all',
  });
  const [hasMore, setHasMore] = useState(true);
  const [nextPage, setNextPage] = useState(0);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const trackIdsRef = React.useRef<Set<string>>(new Set());
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);

  const filterNewEntries = useCallback(
    (incoming: DiscographyEntry[], reset: boolean = false) => {
      if (reset) {
        trackIdsRef.current.clear();
      }

      const unique: DiscographyEntry[] = [];

      incoming.forEach((entry) => {
        if (!trackIdsRef.current.has(entry.id)) {
          trackIdsRef.current.add(entry.id);
          unique.push(entry);
        }
      });

      return unique;
    },
    []
  );

  const loadInitialEntries = useCallback(async () => {
    const result = await getPopularTracks(0, PAGE_SIZE);
    const unique = filterNewEntries(result.entries, true);
    setEntries(unique);
    setHasMore(result.hasMore);
    setNextPage(1);
  }, [filterNewEntries, getPopularTracks]);

  useEffect(() => {
    loadInitialEntries();
  }, [loadInitialEntries]);

  useEffect(() => {
    let isActive = true;

    const loadGenres = async () => {
      const seeds = await getAvailableGenres();
      if (isActive && seeds.length > 0) {
        setAvailableGenres(seeds);
      }
    };

    loadGenres();

    return () => {
      isActive = false;
    };
  }, [getAvailableGenres]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isFetchingMore || loading) {
      return;
    }

    setIsFetchingMore(true);

    try {
      const result = await getPopularTracks(nextPage, PAGE_SIZE);
      const unique = filterNewEntries(result.entries);

      if (unique.length > 0) {
        setEntries((prev) => [...prev, ...unique]);
      }

      setHasMore(result.hasMore);
      setNextPage((prev) => prev + 1);
    } finally {
      setIsFetchingMore(false);
    }
  }, [filterNewEntries, getPopularTracks, hasMore, isFetchingMore, loading, nextPage]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;

    if (!sentinel || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (entry.isIntersecting) {
          loadMore();
        }
      },
      {
        rootMargin: '200px',
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadMore]);

  const genreOptions = useMemo<string[]>(() => {
    if (availableGenres.length > 0) {
      return availableGenres;
    }

    const genreSet = new Set<string>();
    entries.forEach((entry) => {
      entry.genres.forEach((genre) => {
        if (genre) {
          genreSet.add(genre);
        }
      });
    });

    return Array.from(genreSet).sort((a, b) => a.localeCompare(b));
  }, [availableGenres, entries]);

  const decadeOptions = useMemo<string[]>(() => {
    const decades = new Set<string>(DEFAULT_DECADES);

    entries.forEach((entry) => {
      if (entry.releaseYear > 0) {
        const decade = Math.floor(entry.releaseYear / 10) * 10;
        decades.add(`${decade}s`);
      }
    });

    return Array.from(decades).sort((a, b) => b.localeCompare(a));
  }, [entries]);

  const handleFilterChange = useCallback((key: keyof MusicFilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const filteredEntries = useMemo(() => {
    const matchesFilters = (entry: DiscographyEntry) => {
      if (filters.genre !== 'all' && !entry.genres.includes(filters.genre)) {
        return false;
      }

      if (filters.decade !== 'all') {
        const entryDecade = entry.releaseYear > 0 ? `${Math.floor(entry.releaseYear / 10) * 10}s` : null;
        if (!entryDecade || filters.decade !== entryDecade) {
          return false;
        }
      }

      switch (filters.rating) {
        case '5':
          if (entry.popularity < 95) return false;
          break;
        case '4':
          if (entry.popularity < 85 || entry.popularity > 94) return false;
          break;
        case '3':
          if (entry.popularity < 70 || entry.popularity > 84) return false;
          break;
        case '2':
          if (entry.popularity < 55 || entry.popularity > 69) return false;
          break;
        default:
          break;
      }

      if (filters.explicit === 'explicit' && !entry.explicit) {
        return false;
      }

      if (filters.explicit === 'clean' && entry.explicit) {
        return false;
      }

      return true;
    };

    return [...entries.filter(matchesFilters)].sort((a, b) => b.popularity - a.popularity);
  }, [entries, filters]);

  return (
    <div className="discography-page">
      <div className="container">
        <header className="discography-header">
          <h1>Discography</h1>
          <p>
            Explore Spotify's most popular tracks from global charts. Use the music-first filters to
            zero in on the era, vibe, and type of release you want to explore.
          </p>
        </header>

        <MusicFilterBar filters={filters} onChange={handleFilterChange} genres={genreOptions} decades={decadeOptions} />

        {loading && entries.length === 0 ? (
          <div className="loading">Loading discography...</div>
        ) : (
          <section className="discography-results">
            <div className="discography-results-header">
              <span className="discography-results-count">
                Showing {filteredEntries.length} of {entries.length}{' '}
                {filteredEntries.length === 1 ? 'loaded track' : 'loaded tracks'}
              </span>
              <span className="discography-results-window">Source: Spotify toplists</span>
            </div>

            {error && (
              <div className="error">Error: {error}</div>
            )}

            {filteredEntries.length === 0 ? (
              <div className="empty-state">
                <p>
                  {entries.length === 0
                    ? 'No tracks are available right now. Try again in a moment.'
                    : 'No entries match the selected filters. Try widening your search criteria.'}
                </p>
              </div>
            ) : (
              <div className="discography-grid">
                {filteredEntries.map((entry) => (
                  <article key={`${entry.type}-${entry.id}`} className="discography-card">
                    <div className="discography-card-media">
                      {entry.imageUrl ? (
                        <img src={entry.imageUrl} alt={entry.name} />
                      ) : (
                        <div className="discography-card-placeholder">{entry.type}</div>
                      )}
                      <span className={`discography-card-type ${entry.type}`}>
                        {entry.type === 'album' ? 'Album' : 'Track'}
                      </span>
                    </div>
                    <div className="discography-card-content">
                      <h3>{entry.name}</h3>
                      <p className="discography-card-artists">
                        {entry.artists.map((artist) => artist.name).join(', ')}
                      </p>
                      <div className="discography-card-meta">
                        <span>{formatReleaseDate(entry.releaseDate)}</span>
                        <span>Popularity {entry.popularity}</span>
                        {entry.type === 'track' && entry.albumName && (
                          <span title={entry.albumName}>Album: {entry.albumName}</span>
                        )}
                        {entry.type === 'track' && (
                          <span>{entry.explicit ? 'Explicit' : 'Clean'}</span>
                        )}
                      </div>
                      {entry.genres.length > 0 && (
                        <div className="discography-card-genres">
                          {entry.genres.slice(0, 4).map((genre) => (
                            <span key={`${entry.id}-${genre}`} className="discography-genre-tag">
                              {genre}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="discography-card-footer">
                      <a
                        href={entry.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="discography-card-link"
                      >
                        View on Spotify
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="discography-load-more">
              <div
                ref={loadMoreRef}
                className="discography-load-more-sentinel"
                style={{ height: '1px' }}
              />
              {isFetchingMore && <div className="loading">Loading more tracks...</div>}
              {!hasMore && entries.length > 0 && (
                <div className="discography-limit-message">
                  You have reached the current toplist limit.
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
