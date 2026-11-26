// Descarga las órbitas (TLE) y los datos de catálogo (fecha de lanzamiento, propietario) de los
// satélites destacados y de Starlink, desde CelesTrak, y los guarda para la app.
//  · data/satelites.json  → satélites destacados (pocos, con ficha)
//  · data/starlink.tle    → todos los Starlink (solo se descarga si se activa su capa en la app)
// CelesTrak pide no descargar los mismos datos más de una vez cada 2 horas: el robot va cada 6.
import { readFile, writeFile } from 'node:fs/promises';

const OUT = 'data/satelites.json', STARLINK = 'data/starlink.tle';
// Satélites destacados: por número NORAD o por nombre (CelesTrak busca el nombre que contiene ese texto)
export const SATS = [
  { id: 'tiangong', q: { CATNR: 48274 } },
  { id: 'hubble', q: { CATNR: 20580 } },
  { id: 'landsat9', q: { CATNR: 49260 } },
  { id: 'terra', q: { CATNR: 25994 } },
  { id: 'aqua', q: { CATNR: 27424 } },
  { id: 'suomi', q: { CATNR: 37849 } },
  { id: 'sentinel6', q: { CATNR: 46984 } },
  { id: 'icesat2', q: { CATNR: 43613 } },
  { id: 'chandra', q: { CATNR: 25867 } },
  { id: 'tdrs13', q: { NAME: 'TDRS 13' } },
  { id: 'goes19', q: { NAME: 'GOES 19' } },
  { id: 'meteosat12', q: { NAME: 'MTG-I1' } },
  { id: 'gps3', q: { NAME: 'GPS BIII-1' } },
  { id: 'galileo', q: { CATNR: 37846 } },
  { id: 'bluewalker3', q: { CATNR: 53807 } },
  { id: 'bluebird', q: { NAME: 'BLUEBIRD' } },
];
const UA = { 'User-Agent': 'planetario-darwincaos/1.0 (GitHub Actions; actualizacion cada 6 h)' };
async function get(url) {
  const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return r.text();
}
export function parseTle(txt) {
  const l = txt.trim().split(/\r?\n/).map(s => s.trimEnd());
  const out = [];
  for (let i = 0; i + 2 < l.length + 1; i += 3) if (l[i + 1]?.startsWith('1 ') && l[i + 2]?.startsWith('2 ')) out.push({ nombre: l[i].trim(), l1: l[i + 1], l2: l[i + 2], norad: +l[i + 1].slice(2, 7) });
  return out;
}
const qs = q => Object.entries(q).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');

async function main() {
  const prev = JSON.parse(await readFile(OUT, 'utf8').catch(() => '{}'));
  const prevById = Object.fromEntries((prev.sats || []).map(s => [s.id, s]));
  const sats = [];
  for (const s of SATS) {
    try {
      const tles = parseTle(await get(`https://celestrak.org/NORAD/elements/gp.php?${qs(s.q)}&FORMAT=TLE`));
      if (!tles.length) throw new Error('sin resultados');
      const list = s.q.NAME === 'BLUEBIRD' ? tles : [tles[0]]; // los BlueBird son varios
      for (const [k, t] of list.entries()) {
        let cat = {};
        try { cat = JSON.parse(await get(`https://celestrak.org/satcat/records.php?CATNR=${t.norad}&FORMAT=JSON`))[0] || {}; } catch { }
        sats.push({ id: list.length > 1 ? `${s.id}${k + 1}` : s.id, tipo: s.id, nombre: t.nombre, norad: t.norad, l1: t.l1, l2: t.l2,
          lanzamiento: cat.LAUNCH_DATE || prevById[s.id]?.lanzamiento || null, propietario: cat.OWNER || null, cospar: cat.OBJECT_ID || null });
      }
      console.log(`✔ ${s.id}: ${list.map(t => `${t.nombre} (${t.norad})`).join(', ')}`);
    } catch (e) {
      console.warn(`✘ ${s.id}: ${e.message} — se conserva el anterior`);
      for (const p of prev.sats || []) if (p.tipo === s.id) sats.push(p);
    }
  }
  await writeFile(OUT, JSON.stringify({ actualizado: new Date().toISOString(), fuente: 'CelesTrak (celestrak.org)', sats }, null, 1) + '\n');
  try {
    const txt = await get('https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=TLE');
    const n = parseTle(txt).length;
    if (n > 1000) { await writeFile(STARLINK, txt.trim() + '\n'); console.log(`Starlink: ${n} satélites`); }
    else console.warn(`Starlink: solo ${n}, se conserva el anterior`);
  } catch (e) { console.warn('Starlink: se conserva el anterior →', e.message); }
}
if (import.meta.url === `file://${process.argv[1]}`) main();
