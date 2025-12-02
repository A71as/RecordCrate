import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

const router = express.Router();

/**
 * GET /api/billboard/hot-100
 * Scrapes Billboard Hot 100 from RSS feed or HTML
 */
router.get('/hot-100', async (req, res) => {
  try {
    console.log('[Billboard] Fetching Billboard Hot 100...');
    
    // Try RSS feed first (most reliable)
    try {
      const rssUrl = 'https://www.billboard.com/charts/hot-100/feed/';
      const rssResponse = await axios.get(rssUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const xml = rssResponse.data;
      const tracks = [];

      // Parse RSS XML - each item has title in format "Rank: Title - Artist"
      const itemPattern = /<item>([\s\S]*?)<\/item>/gi;
      const itemMatches = xml.matchAll(itemPattern);
      
      for (const itemMatch of itemMatches) {
        const itemContent = itemMatch[1];
        
        // Extract title which contains: "Rank: Song Title - Artist"
        const titleMatch = itemContent.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) ||
                          itemContent.match(/<title>([\s\S]*?)<\/title>/i);
        
        if (titleMatch) {
          const fullTitle = titleMatch[1].trim();
          
          // Parse format: "1: Song Title - Artist Name"
          const parseMatch = fullTitle.match(/^(\d+):\s*(.+?)\s*-\s*(.+)$/);
          
          if (parseMatch) {
            const rank = parseInt(parseMatch[1], 10);
            const title = parseMatch[2].trim();
            const artist = parseMatch[3].trim();
            
            tracks.push({ rank, title, artist });
            
            if (tracks.length >= 100) break;
          }
        }
      }

      if (tracks.length > 0) {
        console.log(`[Billboard] ✅ Fetched ${tracks.length} tracks from Billboard RSS`);
        return res.json({ success: true, tracks, source: 'rss' });
      }
    } catch (rssError) {
      console.log('[Billboard] RSS feed failed, trying HTML scraping...', rssError.message);
    }

    // Fallback to HTML scraping with Cheerio
    console.log('[Billboard] Attempting HTML scraping...');
    const htmlUrl = 'https://www.billboard.com/charts/hot-100/';
    const htmlResponse = await axios.get(htmlUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const $ = cheerio.load(htmlResponse.data);
    const tracks = [];

    // Try to find chart items using multiple selectors
    let rank = 1;
    
    // Strategy 1: Look for list items in chart results
    $('ul.o-chart-results-list-row li.o-chart-results-list__item').each((index, element) => {
      if (rank > 100) return false;
      
      const $el = $(element);
      let title = $el.find('h3#title-of-a-story').text().trim() || $el.find('h3').first().text().trim();
      let artist = $el.find('span.c-label.a-no-trucate').text().trim() || $el.find('span.c-label').first().text().trim();
      
      title = title.replace(/\s+/g, ' ').trim();
      artist = artist.replace(/\s+/g, ' ').trim();
      
      if (title && artist && !artist.match(/^(LW|PEAK|WEEKS|NEW|RE-ENTRY)$/i)) {
        tracks.push({ rank: rank++, title, artist });
      }
    });

    if (tracks.length > 0) {
      console.log(`[Billboard] ✅ Fetched ${tracks.length} tracks from Billboard HTML (Cheerio)`);
      return res.json({ success: true, tracks, source: 'html-cheerio' });
    }

    // Strategy 2: Fallback regex parsing
    console.log('[Billboard] Cheerio parsing yielded no results, trying regex fallback...');
    const html = htmlResponse.data;
    // Parse HTML chart entries with regex
    const chartEntryRegex = /<ul[^>]*class="[^"]*o-chart-results-list-row[^"]*"[^>]*>([\s\S]*?)<\/ul>/gi;
    let entryMatches = html.matchAll(chartEntryRegex);
    
    let regexRank = 1;
    for (const entryMatch of entryMatches) {
      if (regexRank > 100) break;
      
      const entryHtml = entryMatch[1];
      
      // Extract title
      let titleMatch = entryHtml.match(/<h3[^>]*id="title-of-a-story"[^>]*>\s*([^<]+?)\s*<\/h3>/i);
      if (!titleMatch) {
        titleMatch = entryHtml.match(/<h3[^>]*>\s*([^<]+?)\s*<\/h3>/i);
      }
      
      // Extract artist
      let artistMatch = entryHtml.match(/<span[^>]*class="[^"]*c-label[^"]*a-no-trucate[^"]*"[^>]*>\s*([^<]+?)\s*<\/span>/i);
      if (!artistMatch) {
        artistMatch = entryHtml.match(/<span[^>]*class="[^"]*a-font-primary-s[^"]*"[^>]*>\s*([^<]+?)\s*<\/span>/i);
      }
      
      if (titleMatch && artistMatch) {
        const title = titleMatch[1].trim().replace(/\s+/g, ' ');
        const artist = artistMatch[1].trim().replace(/\s+/g, ' ');
        
        // Filter out UI labels
        if (!artist.match(/^(LW|PEAK|WEEKS|NEW|RE-ENTRY)$/i)) {
          tracks.push({ rank: regexRank++, title, artist });
        }
      }
    }

    if (tracks.length > 0) {
      console.log(`[Billboard] ✅ Fetched ${tracks.length} tracks from Billboard HTML (regex)`);
      return res.json({ success: true, tracks, source: 'html' });
    }

    throw new Error('Could not parse Billboard data from any source');
    
  } catch (error) {
    console.error('[Billboard] ❌ Failed to fetch Billboard Hot 100:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch Billboard Hot 100',
      message: error.message 
    });
  }
});

export default router;
