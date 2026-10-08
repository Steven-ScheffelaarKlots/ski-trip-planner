// Usage: node scripts/build-zip-centroids.mjs <path-to-Gaz_zcta_national.txt>
// Source: US Census Bureau Gazetteer (ZCTA), public domain. Keeps New England ZIPs (prefixes 010–069).
import { readFileSync, writeFileSync } from 'node:fs';

const [input] = process.argv.slice(2);
if (!input) {
  console.error('Usage: node scripts/build-zip-centroids.mjs <Gaz_zcta_national.txt>');
  process.exit(1);
}

const lines = readFileSync(input, 'utf8').trim().split(/\r?\n/);
const header = lines[0].split('|').map((h) => h.trim());
const iZip = header.indexOf('GEOID');
const iLat = header.indexOf('INTPTLAT');
const iLng = header.indexOf('INTPTLONG');
if ([iZip, iLat, iLng].includes(-1)) throw new Error(`Unexpected header: ${lines[0]}`);

const table = {};
for (const line of lines.slice(1)) {
  const cols = line.split('|');
  const zip = cols[iZip].trim();
  if (!/^0[1-6]\d{3}$/.test(zip)) continue;
  table[zip] = [Number(Number(cols[iLat]).toFixed(4)), Number(Number(cols[iLng]).toFixed(4))];
}

writeFileSync('src/data/zip-centroids.json', JSON.stringify(table) + '\n');
console.log(`Wrote ${Object.keys(table).length} ZIPs to src/data/zip-centroids.json`);
