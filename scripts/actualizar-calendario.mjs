// Actualiza data/eventos.json para el calendario del planetario. Lo ejecuta GitHub Actions cada 6 horas.
//  · Vídeos del canal DarwinCaos (RSS público de YouTube, sin clave)
//  · Próximos lanzamientos espaciales (Launch Library 2, The Space Devs, sin clave)
//  · Eventos y noticias manuales de data/eventos-manuales.json
// Si una fuente falla, se conservan sus datos anteriores.
import { readFile, writeFile } from 'node:fs/promises';

const CHANNEL_ID = 'UCkF3sD8dTyY7RW1ySN3CwdQ'; // @darwincaos
const OUT = 'data/eventos.json';
const MANUAL = 'data/eventos-manuales.json';

// Palabras clave para enlazar cada astro de la app con el último vídeo del canal que habla de él
const KEYWORDS = {
  sun: ['el sol', 'del sol', 'al sol', 'manchas solares', 'tormenta solar', 'eclipse solar', 'eclipse de sol'],
  moon: ['luna', 'lunar'], mercury: ['mercurio'], venus: ['venus'], mars: ['marte'], jupiter: ['júpiter', 'jupiter'],
  saturn: ['saturno'], uranus: ['urano'], neptune: ['neptuno'], pluto: ['plutón', 'pluton'],
  iss: ['estación espacial', 'estacion espacial', ' iss'], m31: ['andrómeda', 'andromeda'], m42: ['nebulosa de orión', 'nebulosa de orion'],
  m45: ['pléyades', 'pleyades'], sgra: ['sagitario a', 'agujero negro de la vía láctea', 'centro de la galaxia'], cygx1: ['cygnus x-1'],
  's:Betelgeuse': ['betelgeuse'], 's:Sirius': ['sirio'], 's:Polaris': ['estrella polar'], 's:Vega': ['vega'],
};

const decode = s => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));
const tag = (xml, name) => { const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`)); return m ? decode(m[1].trim()) : ''; };

export function parseYouTubeRss(xml) {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => {
    const id = tag(e, 'yt:videoId');
    return { id, titulo: tag(e, 'title'), fecha: tag(e, 'published'), url: `https://www.youtube.com/watch?v=${id}`,
      miniatura: (e.match(/<media:thumbnail url="([^"]+)"/) || [])[1] || `https://i.ytimg.com/vi/${id}/mqdefault.jpg` };
  }).filter(v => v.id);
}

export function mapLaunches(json) {
  return (json.results || []).map(l => ({
    nombre: l.name, fecha: l.net, estado: l.status?.abbrev || l.status?.name || '',
    proveedor: l.launch_service_provider?.name || l.lsp_name || '',
    cohete: l.rocket?.configuration?.full_name || l.rocket?.configuration?.name || '',
    lugar: l.pad?.location?.name || l.location || '',
    mision: l.mission?.description || '',
    imagen: l.image?.thumbnail_url || l.image?.image_url || (typeof l.image === 'string' ? l.image : null),
    enlace: l.vid_urls?.[0]?.url || null,
  })).filter(l => l.nombre && l.fecha);
}

export function videosByObject(videos) {
  const out = {};
  const sorted = [...videos].sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha));
  for (const [obj, words] of Object.entries(KEYWORDS)) {
    const v = sorted.find(v => words.some(w => (' ' + v.titulo.toLowerCase()).includes(w)));
    if (v) out[obj] = { id: v.id, titulo: v.titulo, url: v.url };
  }
  return out;
}

async function get(url, type = 'text') {
  const r = await fetch(url, { headers: { 'User-Agent': 'planetario-calendario/1.0' }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return type === 'json' ? r.json() : r.text();
}

async function main() {
  const prev = JSON.parse(await readFile(OUT, 'utf8').catch(() => '{}'));
  const out = { actualizado: new Date().toISOString(), videos: prev.videos || [], lanzamientos: prev.lanzamientos || [], manuales: [], videosPorObjeto: prev.videosPorObjeto || {} };

  try {
    const nuevos = parseYouTubeRss(await get(`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`));
    const all = new Map([...out.videos, ...nuevos].map(v => [v.id, v]));
    out.videos = [...all.values()].sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha)).slice(0, 120);
    out.videosPorObjeto = videosByObject(out.videos);
    console.log(`Vídeos: ${nuevos.length} en el RSS, ${out.videos.length} guardados`);
  } catch (e) { console.warn('YouTube: se conservan los datos anteriores →', e.message); }

  try {
    out.lanzamientos = mapLaunches(await get('https://ll.thespacedevs.com/2.3.0/launches/upcoming/?limit=15&hide_recent_previous=true', 'json'));
    console.log(`Lanzamientos: ${out.lanzamientos.length}`);
  } catch (e) { console.warn('Lanzamientos: se conservan los datos anteriores →', e.message); }

  try {
    const m = JSON.parse(await readFile(MANUAL, 'utf8'));
    out.manuales = (m.eventos || []).filter(e => e.fecha && e.titulo);
    console.log(`Eventos manuales: ${out.manuales.length}`);
  } catch (e) { console.warn('Eventos manuales: archivo no válido →', e.message); }

  await writeFile(OUT, JSON.stringify(out, null, 1) + '\n');
}

if (import.meta.url === `file://${process.argv[1]}`) main();
