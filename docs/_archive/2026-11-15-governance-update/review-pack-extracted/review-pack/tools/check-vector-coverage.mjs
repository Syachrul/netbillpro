// Memastikan SETIAP vektor di ledger-vectors.json punya tes yang menyebut ID-nya (mencegah drift spec <-> tes).
// Pemakaian: node tools/check-vector-coverage.mjs <ledger-vectors.json> <direktori-tes> [--negatives=13]
// Aturan: ID vektor (mis. "S3-lebih-bayar" atau awalan "S3") harus muncul di berkas *.test.ts / *.spec.ts.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const [, , vecPath, testDir, ...flags] = process.argv;
if (!vecPath || !testDir) { console.error('pemakaian: node check-vector-coverage.mjs <vectors.json> <testDir> [--negatives=13]'); process.exit(2); }
const negatives = +(flags.find(f => f.startsWith('--negatives='))?.split('=')[1] ?? 0);

const walk = (d) => readdirSync(d).flatMap(n => {
  if (n === 'node_modules' || n.startsWith('.')) return [];
  const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : /\.(test|spec)\.[cm]?[tj]sx?$/.test(n) ? [p] : [];
});
const files = walk(testDir); const text = files.map(f => readFileSync(f, 'utf8')).join('\n');
const vectors = JSON.parse(readFileSync(vecPath, 'utf8'));

const missing = vectors.filter(v => !(text.includes(v.id) || new RegExp(`\\b${v.id.split('-')[0]}\\b`).test(text)));
const missingN = [];
for (let i = 1; i <= negatives; i++) if (!new RegExp(`\\bN-${i}\\b`).test(text)) missingN.push(`N-${i}`);

console.log(`berkas tes: ${files.length} | vektor: ${vectors.length} | tertutup: ${vectors.length - missing.length}`);
if (missing.length) console.log('VEKTOR TANPA TES:', missing.map(v => v.id).join(', '));
if (negatives) { console.log(`tes negatif tertutup: ${negatives - missingN.length}/${negatives}`); if (missingN.length) console.log('NEGATIF TANPA TES:', missingN.join(', ')); }
process.exit(missing.length || missingN.length ? 1 : 0);
