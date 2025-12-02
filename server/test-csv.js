import 'dotenv/config';
import axios from 'axios';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

console.log('Testing Spotify Charts CSV fetch...\n');

async function testCsvFetch() {
  try {
    const resp = await axios.get('https://spotifycharts.com/regional/global/daily/latest/download', { 
      responseType: 'text',
      timeout: 10000
    });
    
    const lines = resp.data.split('\n').filter(l => l.trim().length > 0);
    console.log(`Total lines in CSV: ${lines.length}`);
    console.log(`First line: ${lines[0]}`);
    console.log(`Second line: ${lines[1]}`);
    
    // Count data lines (excluding header)
    const dataLines = lines.filter(l => !l.toLowerCase().startsWith('"position"'));
    console.log(`\nData lines (tracks): ${dataLines.length}`);
    
    return dataLines.length;
  } catch (err) {
    console.error('Error fetching CSV:', err.message);
    return 0;
  }
}

testCsvFetch().then(count => {
  console.log(`\nResult: ${count} tracks available`);
  process.exit(count > 0 ? 0 : 1);
});
