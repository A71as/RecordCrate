import express from 'express';
import axios from 'axios';

const router = express.Router();

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || process.env.VITE_SPOTIFY_CLIENT_ID || '';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || process.env.VITE_SPOTIFY_CLIENT_SECRET || '';
const DEFAULT_MARKET = 'US';

let appAccessToken = null;
let appAccessTokenExpiry = 0;
function sampleEntries(limit = 10) {
  const samples = [
    { id: '3n3Ppam7vgaVa1iaRUc9Lp', name: 'Hey Ya!', artists: ['Outkast'] },
    { id: '7GhIk7Il098yCjg4BQjzvb', name: 'Never Gonna Give You Up', artists: ['Rick Astley'] },
    { id: '0VjIjW4GlUZAMYd2vXMi3b', name: 'Blinding Lights', artists: ['The Weeknd'] },
    { id: '2VxeLyX666F8uXCJ0dZF8B', name: 'Levitating', artists: ['Dua Lipa'] },
    { id: '4Oun2ylbjFKMPTiaSbbCih', name: 'good 4 u', artists: ['Olivia Rodrigo'] },
    { id: '1fDsrQ23eTAVFElUMaf38X', name: 'As It Was', artists: ['Harry Styles'] },
    { id: '1rqqCSm0Qe4I9rUvWncaom', name: 'Dance Monkey', artists: ['Tones And I'] },
    { id: '4uUG5RXrOk84mYEfFvj3cK', name: 'Bad Guy', artists: ['Billie Eilish'] },
    { id: '2bgTY4UwhfBYhGT4HUYStN', name: 'Flowers', artists: ['Miley Cyrus'] },
    { id: '0ZcohShptsJ8ovC9UZk7Xw', name: 'Stay', artists: ['The Kid LAROI', 'Justin Bieber'] },
  ];
  return samples.slice(0, limit).map((s) => ({
    id: s.id,
    type: 'track',
    name: s.name,
    artists: s.artists.map((n) => ({ id: '', name: n })),
    imageUrl: null,
    releaseDate: '',
    releaseYear: 0,
    popularity: 0,
    explicit: false,
    albumName: undefined,
    genres: [],
    externalUrl: `https://open.spotify.com/track/${s.id}`,
  }));
}

async function fetchOEmbedDetails(trackIds, max = 30) {
  const map = new Map();
  const ids = Array.from(new Set(trackIds)).slice(0, max);
  await Promise.all(
    ids.map(async (id) => {
      try {
        const resp = await axios.get('https://open.spotify.com/oembed', {
          params: { url: `https://open.spotify.com/track/${id}` },
        });
        if (resp.data) {
          map.set(id, {
            thumbnail: resp.data.thumbnail_url || null,
            title: resp.data.title || null,
            author: resp.data.author_name || null,
          });
        }
      } catch {
        // ignore individual failures
      }
    })
  );
  return map;
}

async function getAppAccessToken() {
  if (appAccessToken && Date.now() < appAccessTokenExpiry) return appAccessToken;
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error('Missing Spotify credentials. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in server/.env');
  }
  const resp = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({ grant_type: 'client_credentials' }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
      },
    }
  );
  appAccessToken = resp.data.access_token;
  appAccessTokenExpiry = Date.now() + (resp.data.expires_in || 3600) * 1000 - 30000; // 30s buffer
  return appAccessToken;
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  values.push(current);
  return values.map((v) => v.trim());
}

function extractTrackIdsFromCsv(csv, limit) {
  const lines = csv
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const dataLines = lines.filter((l) => !l.toLowerCase().startsWith('"position"')).slice(0, limit);
  const ids = [];
  for (const line of dataLines) {
    const cols = parseCsvLine(line);
    if (cols.length < 5) continue;
    const url = cols[4];
    const m = url.match(/track\/([a-zA-Z0-9]+)/);
    if (m && m[1]) ids.push(m[1]);
    if (ids.length >= limit) break;
  }
  return ids;
}

async function fetchTracksDetails(ids) {
  const token = await getAppAccessToken();
  const out = [];
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const resp = await axios.get('https://api.spotify.com/v1/tracks', {
      headers: { Authorization: `Bearer ${token}` },
      params: { ids: chunk.join(','), market: DEFAULT_MARKET },
    });
    out.push(...(resp.data?.tracks || []).filter((t) => t && t.id));
  }
  return out;
}

async function fetchArtistsGenres(artistIds) {
  const token = await getAppAccessToken();
  const map = new Map();
  for (let i = 0; i < artistIds.length; i += 50) {
    const chunk = artistIds.slice(i, i + 50);
    try {
      const resp = await axios.get('https://api.spotify.com/v1/artists', {
        headers: { Authorization: `Bearer ${token}` },
        params: { ids: chunk.join(',') },
      });
      for (const artist of resp.data.artists || []) {
        if (artist?.id) map.set(artist.id, artist.genres || []);
      }
    } catch (e) {
      // continue
    }
  }
  return map;
}

router.get('/genres', async (_req, res) => {
  try {
    const token = await getAppAccessToken();
    const resp = await axios.get('https://api.spotify.com/v1/recommendations/available-genre-seeds', {
      headers: { Authorization: `Bearer ${token}` },
    });
    res.json({ genres: resp.data?.genres || [] });
  } catch (e) {
    console.error('genres error', e?.response?.data || e.message);
    res.status(503).json({ error: 'failed_to_fetch_genres' });
  }
});

router.get('/top-tracks', async (req, res) => {
  const page = Number(req.query.page || '0');
  const limit = Math.min(100, Number(req.query.limit || '50'));
  if (page > 0) return res.json({ entries: [], hasMore: false });
  try {
    let csvText = '';
    try {
      const csvResp = await axios.get('https://spotifycharts.com/regional/global/daily/latest/download', { responseType: 'text' });
      csvText = csvResp.data;
    } catch (csvErr) {
      // If CSV fetch fails entirely, provide static samples so UI still renders
      return res.json({ entries: sampleEntries(limit), hasMore: false });
    }

    // If Spotify credentials are not set, return a minimal fallback from CSV (names + links only)
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      const lines = csvText
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.toLowerCase().startsWith('"position"'))
        .slice(0, limit);
      const safeLines = lines.filter((line) => {
        const cols = parseCsvLine(line);
        return cols[4] && /track\/[a-zA-Z0-9]+/.test(cols[4]);
      });
      if (safeLines.length === 0) {
        // Try to enrich samples with thumbnails via oEmbed
        const samples = sampleEntries(limit);
        const idList = samples.map((e) => e.id).filter(Boolean);
        const details = await fetchOEmbedDetails(idList);
        const withEnrichment = samples.map((e) => {
          const d = details.get(e.id);
          // Prefer oEmbed title/author when available to avoid CSV name/link mismatches
          const oTitle = (d?.title && typeof d.title === 'string') ? d.title : e.name;
          const oAuthor = (d?.author && typeof d.author === 'string') ? d.author : null;
          return {
            ...e,
            name: oTitle,
            artists: oAuthor ? [{ id: '', name: oAuthor }] : e.artists,
            imageUrl: d?.thumbnail || e.imageUrl,
          };
        });
        return res.json({ entries: withEnrichment, hasMore: false });
      }
      const rowsRaw = safeLines.map((line) => {
        const cols = parseCsvLine(line);
        // CSV columns: Position, Track Name, Artist, Streams, URL
        const position = Number(cols[0] || '0') || 0;
        const name = cols[1] || 'Unknown';
        const artistField = cols[2] || '';
        const streamsRaw = (cols[3] || '').replace(/,/g, '');
        const streams = Number(streamsRaw) || 0;
        const url = cols[4] || '';
        const idMatch = url.match(/track\/([a-zA-Z0-9]+)/);
        const id = idMatch ? idMatch[1] : url || name;
        const artistNames = artistField
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        return {
          id,
          type: 'track',
          name,
          artists: artistNames.map((n) => ({ id: '', name: n })),
          imageUrl: null,
          releaseDate: '',
          releaseYear: 0,
          popularity: 0, // set below
          explicit: false,
          albumName: undefined,
          genres: [],
          externalUrl: id ? `https://open.spotify.com/track/${id}` : url,
          __position: position,
          __streams: streams,
        };
      });
      // Normalize popularity using streams if available; else fallback to position
      const rows = (() => {
        const withStreams = rowsRaw.filter((r) => r.__streams > 0);
        if (withStreams.length > 1) {
          const minS = Math.min(...withStreams.map((r) => r.__streams));
          const maxS = Math.max(...withStreams.map((r) => r.__streams));
          const span = Math.max(1, maxS - minS);
          return rowsRaw.map((r) => ({
            ...r,
            popularity: Math.round(60 + ((r.__streams - minS) / span) * 40), // 60..100
          }));
        }
        const n = Math.max(1, rowsRaw.length);
        return rowsRaw.map((r) => ({
          ...r,
          popularity: Math.max(1, Math.min(100, Math.round(100 - ((r.__position - 1) * (100 / n))))),
        }));
      })();
      // Enrich with thumbnails via oEmbed (no auth required)
  const idList = rows.map((e) => e.id).filter(Boolean);
  const details = await fetchOEmbedDetails(idList, rows.length);
      const entries = rows.map((e) => {
        const d = details.get(e.id);
        const oTitle = (d?.title && typeof d.title === 'string') ? d.title : e.name;
        const oAuthor = (d?.author && typeof d.author === 'string') ? d.author : null;
        return {
          ...e,
          name: oTitle,
          artists: oAuthor ? [{ id: '', name: oAuthor }] : e.artists,
          imageUrl: d?.thumbnail || e.imageUrl,
        };
      });

      return res.json({ entries, hasMore: false });
    }

    // Full enrichment path using Spotify API
  const trackIds = extractTrackIdsFromCsv(csvText, limit);
  if (trackIds.length === 0) return res.json({ entries: sampleEntries(limit), hasMore: false });

    const tracks = await fetchTracksDetails(trackIds);
    if (tracks.length === 0) return res.json({ entries: [], hasMore: false });

    const artistIds = Array.from(new Set(tracks.flatMap((t) => (t.artists || []).map((a) => a.id).filter(Boolean))));
    const artistGenres = await fetchArtistsGenres(artistIds);

    const entries = tracks.map((track) => {
      const releaseDate = track.album?.release_date || '';
      const releaseYear = releaseDate ? Number(releaseDate.slice(0, 4)) || 0 : 0;
      const genres = Array.from(new Set((track.artists || []).flatMap((a) => artistGenres.get(a.id) || []))).slice(0, 6);
      return {
        id: track.id,
        type: 'track',
        name: track.name,
        artists: (track.artists || []).map((a) => ({ id: a.id, name: a.name })),
        imageUrl: track.album?.images?.[0]?.url || null,
        releaseDate,
        releaseYear,
        popularity: track.popularity || 0,
        explicit: !!track.explicit,
        albumName: track.album?.name || undefined,
        genres,
        externalUrl: track.external_urls?.spotify || '',
      };
    });

    res.json({ entries, hasMore: false });
  } catch (e) {
    console.error('top-tracks error', e?.response?.data || e.message);
    res.status(503).json({ entries: [], hasMore: false, error: 'failed_to_fetch_top_tracks' });
  }
});

export default router;
