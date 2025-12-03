import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const billboard = require('billboard-top-100');

billboard.getChart('hot-100', (err, chart) => {
  if (err) {
    console.error('Error fetching Billboard:', err);
    process.exit(1);
  }
  
  console.log('Chart week:', chart.week);
  console.log('Number of songs:', chart.songs?.length || 0);
  
  if (chart.songs && chart.songs.length > 0) {
    console.log('\nFirst 3 songs:');
    chart.songs.slice(0, 3).forEach(song => {
      console.log(`${song.rank}. "${song.title}" by ${song.artist}`);
    });
  }
  
  process.exit(0);
});
