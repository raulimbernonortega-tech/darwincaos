// Actualiza data/eventos.json para el calendario del planetario. Lo ejecuta GitHub Actions cada 6 horas.
//  · Vídeos del canal DarwinCaos (RSS público de YouTube, sin clave)
//  · Próximos lanzamientos espaciales (Launch Library 2, The Space Devs, sin clave)
//  · Noticias relevantes de espacio y astronomía: Spaceflight News API (inglés) y Agencia SINC (español, RSS)
//  · Eventos y noticias manuales de data/eventos-manuales.json
// Si una fuente falla, se conservan sus datos anteriores.
import { readFile, writeFile } from 'node:fs/promises';

const CHANNEL_ID = 'UCkF3sD8dTyY7RW1ySN3CwdQ'; // @darwincaos
const OUT = 'data/eventos.json';
// Fuentes de noticias en español. Se prueban todas; se usan las que funcionen.
//  · feeds: direcciones RSS conocidas (se prueban primero)
//  · home: si ninguna funciona, el robot busca los RSS en esa página
//  · espacio: true si TODA la fuente es de espacio/astronomía (no hace falta filtrar por tema)
const ES_SOURCES = [
  { nombre: 'NASA Ciencia', home: 'https://ciencia.nasa.gov/', feeds: ['https://ciencia.nasa.gov/feed/'], espacio: true },
  { nombre: 'ESA', home: 'https://www.esa.int/Space_in_Member_States/Spain', feeds: ['https://www.esa.int/rssfeed/Space_in_Member_States/Spain'], espacio: true },
  { nombre: 'Agencia SINC', home: 'https://www.agenciasinc.es/', feeds: [], espacio: false },
];
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

// ── Lanzamientos relevantes ──
// Entran: tripulados, suministro a estaciones, Starship/New Glenn/Artemis, ciencia y exploración, primeros vuelos,
// China destacada (Shenzhou, Mengzhou, Tianzhou, Chang'e, Tianwen…) y todo lo europeo (Ariane, Vega, Miura de PLD Space).
// Fuera: constelaciones comerciales rutinarias, satélites secretos y cargas desconocidas.
const LAUNCH_YES = ['crew', 'shenzhou', 'mengzhou', 'soyuz ms', 'gaganyaan', 'axiom', 'ax-', 'polaris', 'progress ms', 'crs-', 'cygnus', 'dream chaser', 'tianzhou', 'htv',
  'starship', 'new glenn', 'artemis', 'sls', 'orion', "chang'e", 'chang’e', 'tianwen', 'chandrayaan', 'aditya', 'hera', 'psyche', 'europa', 'juice', 'roman', 'plato',
  'ariane', 'vega', 'miura', 'pld space', 'maiden', 'first flight', 'flight 1', 'test flight', 'xuntian', 'iss', 'tiangong'];
const LAUNCH_NO = ['starlink', 'oneweb', 'kuiper', 'amazon leo', 'guowang', 'qianfan', 'thousand sails', 'yaogan', 'unknown payload', 'nrol', 'classified', 'sda tranche', 'transporter-', 'bandwagon-'];
const MISSION_YES = /human|resupply|planetary|astrophys|heliophys|lunar|test flight|space science|interplanetary/i;
export function launchRelevance(l) {
  const t = `${l.nombre} ${l.cohete} ${l.proveedor}`.toLowerCase();
  // Palabra completa («iss» no debe coincidir con «Mission»); las terminadas en «-» son prefijos (crs-, ax-)
  const yes = w => (w.endsWith('-') ? t.includes(w) : wholeWord(t, w));
  if (LAUNCH_YES.some(yes) || MISSION_YES.test(l.tipo || '')) {
    if (/ariane|vega/i.test(t) || !LAUNCH_NO.some(w => t.includes(w))) return true; // lo europeo entra aunque lleve satélites comerciales
  }
  return false;
}
export function mapLaunches(json) {
  return (json.results || []).map(l => ({
    nombre: l.name, fecha: l.net, estado: l.status?.abbrev || l.status?.name || '',
    proveedor: l.launch_service_provider?.name || l.lsp_name || '',
    cohete: l.rocket?.configuration?.full_name || l.rocket?.configuration?.name || '',
    lugar: l.pad?.location?.name || l.location || '',
    mision: l.mission?.description || '',
    tipo: l.mission?.type || '',
    imagen: l.image?.thumbnail_url || l.image?.image_url || (typeof l.image === 'string' ? l.image : null),
    enlace: l.vid_urls?.[0]?.url || null,
  })).filter(l => l.nombre && l.fecha).map(l => ({ ...l, relevante: launchRelevance(l) }));
}

// ── Noticias: solo espacio/astronomía y solo relevantes ──
const NEWS_DAYS = 7, NEWS_MAX = 8;
const SPACE_ES = ['espacio', 'espacial', 'astronom', 'astrofís', 'planeta', 'exoplaneta', 'estrella', 'galaxia', 'telescopio', 'nasa', 'esa ', 'agencia espacial',
  'marte', 'luna ', 'lunar', 'júpiter', 'saturno', 'venus', 'mercurio', 'urano', 'neptuno', 'plutón', 'cometa', 'asteroide', 'meteor', 'eclipse', 'agujero negro',
  'supernova', 'nebulosa', 'cosmo', 'universo', 'sonda', 'astronauta', 'satélite', 'cohete', 'órbita', 'webb', 'hubble', 'artemis', 'vía láctea', 'sistema solar', 'sol '];
const MAJOR = ['artemis', 'crew', 'astronaut', 'spacewalk', 'mars', 'moon', 'lunar', 'webb', 'jwst', 'hubble', 'exoplanet', 'black hole', 'galaxy', 'supernova',
  'discover', 'first', 'record', 'eclipse', 'comet', 'asteroid', 'meteor', 'sample return', 'starship flight', 'new glenn', 'europa clipper', 'juice', 'bepicolombo',
  'iss ', 'space station', 'neptune', 'uranus', 'venus', 'mercury ', 'light-day', 'light-year', 'spacecraft', 'probe', 'rover', 'lander', 'telescope', 'nebula', 'star ', 'planet', 'neptuno', 'urano', 'júpiter', 'saturno', 'sonda', 'tiangong', 'shenzhou', "chang'e", 'tianwen', 'gaganyaan', 'chandrayaan', 'voyager', 'jupiter', 'saturn', 'pluto', 'sun ', 'solar storm', 'aurora',
  'marte', 'luna', 'astronauta', 'telescopio', 'agujero negro', 'descubr', 'primer', 'récord', 'cometa', 'asteroide', 'eclipse', 'exoplaneta', 'galaxia',
  'sol ', 'solar', 'estrella', 'planeta', 'universo', 'misión', 'nave', 'estación espacial', 'nebulosa', 'supernova', 'lluvia de estrellas'];
const NOISE = ['starlink group', 'contract', 'funding', 'raises', 'acquire', 'acquisition', 'earnings', 'revenue', 'stock', 'ipo', 'series a', 'series b', 'investor',
  'partnership', 'podcast', 'roundup', 'this week in', 'weekly', 'job', 'hiring', 'webinar', 'conference', 'award', 'sponsor', 'deal', 'merger', 'layoff', 'quarter'];
const OFFICIAL = ['NASA', 'ESA', 'JPL', 'European Space Agency', 'SINC'];
// Coincidencia por palabras (no por trozos: «equipo» no debe contar como «ipo»).
// Las palabras clave son raíces: deben empezar palabra; las de exclusión deben ser palabra completa.
const L = 'a-z0-9áéíóúüñ';
const esc = w => w.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const startsWord = (t, w) => new RegExp(`(^|[^${L}])${esc(w)}`, 'i').test(t);
const wholeWord = (t, w) => new RegExp(`(^|[^${L}])${esc(w)}($|[^${L}])`, 'i').test(t);
const hit = (t, w) => (w.endsWith(' ') ? wholeWord(t, w) : startsWord(t, w)); // «palabra » con espacio final = palabra exacta
export function newsScore(n) {
  const t = `${n.titulo} ${n.resumen || ''}`.toLowerCase(), title = n.titulo.toLowerCase();
  if (NOISE.some(w => wholeWord(title, w))) return 0;
  if (n.idioma === 'es' && !n.espacio && !SPACE_ES.some(w => hit(t, w))) return 0; // fuentes de ciencia general: solo espacio
  let s = 0, inTitle = 0;
  for (const w of MAJOR) if (hit(title, w)) { s += 2; inTitle++; } else if (hit(t, w)) s += 1;
  if (!inTitle && !n.destacado && !n.espacio && n.idioma !== 'es') return 0; // el titular debe hablar de espacio (fuera fotos de la Tierra, selfis…)
  if (n.destacado) s += 3;
  if (OFFICIAL.some(o => (n.fuente || '').includes(o))) s += 1;
  if (n.idioma === 'es') s += 2; // preferimos noticias en español
  return s;
}
// Palabras significativas de un titular (para detectar la misma noticia contada por dos webs)
const STOP = new Set('the a an of to in on for and is are its it from by with at as after near nasa nasas new el la los las de del en un una y que se por con su sus al'.split(' '));
const words = t => new Set(t.toLowerCase().replace(/[’']s\b/g, '').split(/[^a-z0-9áéíóúüñ]+/).filter(w => w && !STOP.has(w)));
const sameStory = (a, b) => { const A = words(a), B = words(b); let k = 0; for (const w of A) if (B.has(w)) k++; return k / Math.min(A.size, B.size) >= 0.6; };
// Misma noticia en dos idiomas: comparten una misión/objeto concreto y (un número o fecha cercana)
const ENTITIES = ['voyager', 'artemis', 'webb', 'jwst', 'hubble', 'juno', 'juice', 'europa clipper', 'perseverance', 'curiosity', 'ingenuity', 'starship',
  'new glenn', 'orion', 'shenzhou', 'tianzhou', 'tianwen', "chang'e", 'tiangong', 'bepicolombo', 'psyche', 'osiris', 'hera', 'parker', 'solar orbiter', 'euclid',
  'gaia', 'plato', 'chandra', 'spherex', 'roman', 'andromeda', 'betelgeuse', 'iss', 'dragon', 'crew-', 'soyuz', 'ariane', 'vega', 'kepler', 'tess', 'cassini', 'new horizons'];
const fold = t => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const entitiesOf = t => ENTITIES.filter(e => wholeWord(fold(t), e) || (e.endsWith('-') && fold(t).includes(e)));
const numbersOf = t => new Set((t.match(/\d+/g) || []).filter(n => !/^20\d\d$/.test(n)));
export function sameStoryAnyLang(a, b) {
  if (sameStory(a.titulo, b.titulo)) return true;
  if (a.idioma === b.idioma) return false;
  if (/^apod\b/i.test(a.titulo) || /^apod\b/i.test(b.titulo)) return false; // la foto del día va aparte
  const ea = entitiesOf(a.titulo), eb = new Set(entitiesOf(b.titulo));
  if (!ea.some(e => eb.has(e))) return false;
  const na = numbersOf(a.titulo), nb = numbersOf(b.titulo);
  const shareNum = [...na].some(n => nb.has(n));
  return shareNum || Math.abs(Date.parse(a.fecha) - Date.parse(b.fecha)) < 36 * 3600e3;
}
export function pickNews(items, now = Date.now()) {
  const kept = [], urls = new Set();
  let apod = 0;
  items
    .filter(n => n.titulo && n.url && now - Date.parse(n.fecha) < NEWS_DAYS * 864e5)
    .filter(n => !urls.has(n.url) && urls.add(n.url)) // la misma noticia en varios canales RSS
    .map(n => ({ ...n, puntos: newsScore(n) }))
    .filter(n => n.puntos >= 3)
    .sort((a, b) => b.puntos - a.puntos || Date.parse(b.fecha) - Date.parse(a.fecha))
    .forEach(n => {
      if (/^apod\b/i.test(n.titulo) && apod++ >= 1) return;        // la foto del día de la NASA: como mucho una
      const dup = kept.findIndex(k => sameStoryAnyLang(k, n));     // misma noticia en otra web u otro idioma
      if (dup >= 0) { if (n.idioma === 'es' && kept[dup].idioma !== 'es') kept[dup] = n; return; } // preferimos la versión en español
      kept.push(n);
    });
  return kept
    .slice(0, NEWS_MAX)
    .sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha));
}
export function mapSnapi(json) {
  return (json.results || []).map(a => ({ titulo: a.title, resumen: (a.summary || '').slice(0, 280), url: a.url, imagen: a.image_url || null,
    fuente: a.news_site || '', fecha: a.published_at, destacado: !!a.featured, idioma: 'en' }));
}
export function parseRssItems(xml, fuente, espacio = false) {
  return [...xml.matchAll(/<item[\s>]([\s\S]*?)<\/item>/g)].map(([, it]) => {
    const enc = (it.match(/<enclosure[^>]+url="([^"]+)"/) || [])[1] || (it.match(/<media:content[^>]+url="([^"]+)"/) || [])[1] || null;
    const desc = tag(it, 'description').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const cats = [...it.matchAll(/<category[^>]*>([\s\S]*?)<\/category>/g)].map(m => decode(m[1]).trim()).join(' ');
    return { titulo: tag(it, 'title'), resumen: (desc + ' ' + cats).slice(0, 280), url: tag(it, 'link'), imagen: enc,
      fuente, fecha: new Date(tag(it, 'pubDate') || tag(it, 'dc:date') || Date.now()).toISOString(), destacado: false, idioma: 'es', espacio };
  }).filter(n => n.titulo && n.url);
}
// Encuentra los RSS de una web a partir de su página principal (<link rel="alternate" type="application/rss+xml">)
export function discoverFeeds(html, base) {
  return [...html.matchAll(/<link[^>]+type="application\/(?:rss|atom)\+xml"[^>]*>/gi)]
    .map(([l]) => (l.match(/href="([^"]+)"/) || [])[1]).filter(Boolean).map(h => new URL(h.replace(/&amp;/g, '&'), base).href);
}
// Enlaces de la página que parecen llevar a RSS (p. ej. «RSS» en el pie de página)
export function rssLinks(html, base) {
  const out = new Set();
  for (const [, href, text] of html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const t = text.replace(/<[^>]+>/g, ' ');
    if (/rss|feed|\.xml/i.test(href) || /\brss\b/i.test(t)) { try { out.add(new URL(href.replace(/&amp;/g, '&'), base).href); } catch { } }
  }
  return [...out];
}
const looksLikeFeed = body => /<(rss|feed|rdf:RDF)[\s>]/i.test(body.slice(0, 2000));
// Búsqueda de RSS en dos niveles: portada → páginas «RSS» → feeds reales. Devuelve [{url, xml}]
export async function findFeeds(home) {
  const found = new Map(), tried = new Set();
  const visit = async (url, depth) => {
    if (tried.has(url) || tried.size > 25) return;
    tried.add(url);
    let body; try { body = await get(url); } catch { return; }
    if (looksLikeFeed(body)) { found.set(url, body); return; }
    if (depth >= 2) return;
    for (const f of [...discoverFeeds(body, url), ...rssLinks(body, url)]) await visit(f, depth + 1);
  };
  await visit(home, 0);
  for (const guess of ['rss', 'RSS', 'rss.xml', 'feed']) if (!found.size) await visit(new URL(guess, home).href, 1);
  return [...found].map(([url, xml]) => ({ url, xml }));
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
  const out = { actualizado: new Date().toISOString(), videos: prev.videos || [], lanzamientos: prev.lanzamientos || [], noticias: prev.noticias || [], manuales: [], videosPorObjeto: prev.videosPorObjeto || {} };

  try {
    const nuevos = parseYouTubeRss(await get(`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`));
    const all = new Map([...out.videos, ...nuevos].map(v => [v.id, v]));
    out.videos = [...all.values()].sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha)).slice(0, 120);
    out.videosPorObjeto = videosByObject(out.videos);
    console.log(`Vídeos: ${nuevos.length} en el RSS, ${out.videos.length} guardados`);
  } catch (e) { console.warn('YouTube: se conservan los datos anteriores →', e.message); }

  try {
    out.lanzamientos = mapLaunches(await get('https://ll.thespacedevs.com/2.3.0/launches/upcoming/?limit=40&hide_recent_previous=true', 'json'));
    console.log(`Lanzamientos: ${out.lanzamientos.length} (relevantes: ${out.lanzamientos.filter(l => l.relevante).length})`);
    out.lanzamientos.forEach(l => console.log(`  ${l.relevante ? '✔' : '·'} ${l.fecha.slice(0, 10)} ${l.nombre} [${l.tipo}]`));
  } catch (e) { console.warn('Lanzamientos: se conservan los datos anteriores →', e.message); }

  // Noticias: cada fuente por separado; si todas fallan se conservan las anteriores
  const news = [];
  try {
    const since = new Date(Date.now() - NEWS_DAYS * 864e5).toISOString();
    const j = await get(`https://api.spaceflightnewsapi.net/v4/articles/?limit=80&ordering=-published_at&published_at_gte=${since}`, 'json');
    const items = mapSnapi(j); news.push(...items); console.log(`Spaceflight News: ${items.length} artículos`);
  } catch (e) { console.warn('Spaceflight News: no disponible →', e.message); }
  for (const src of ES_SOURCES) { // fuentes en español: cada una por separado
    try {
      let feeds = [];
      for (const url of src.feeds) { try { const xml = await get(url); if (looksLikeFeed(xml)) feeds.push({ url, xml }); } catch { } }
      if (!feeds.length) {
        feeds = await findFeeds(src.home);
        const pref = feeds.filter(f => /espacio|astro|cosmo|universo|space/i.test(f.url));
        feeds = (pref.length ? pref : feeds).slice(0, 3);
      }
      if (!feeds.length) { console.log(`${src.nombre}: sin RSS disponible`); continue; }
      for (const f of feeds) { const items = parseRssItems(f.xml, src.nombre, src.espacio); news.push(...items); console.log(`${src.nombre}: ${items.length} noticias en ${f.url}`); }
    } catch (e) { console.warn(`${src.nombre}: no disponible →`, e.message); }
  }
  if (news.length) {
    out.noticias = pickNews(news);
    console.log(`Noticias relevantes seleccionadas: ${out.noticias.length}`);
    out.noticias.forEach(n => console.log(`  [${n.puntos}] ${n.fuente}: ${n.titulo}`));
  }

  try {
    const m = JSON.parse(await readFile(MANUAL, 'utf8'));
    out.manuales = (m.eventos || []).filter(e => e.fecha && e.titulo);
    console.log(`Eventos manuales: ${out.manuales.length}`);
  } catch (e) { console.warn('Eventos manuales: archivo no válido →', e.message); }

  await writeFile(OUT, JSON.stringify(out, null, 1) + '\n');
}

if (import.meta.url === `file://${process.argv[1]}`) main();
