// Actualiza data/eventos.json para el calendario del planetario. Lo ejecuta GitHub Actions cada 6 horas.
//  · Vídeos del canal DarwinCaos (RSS público de YouTube, sin clave)
//  · Próximos lanzamientos espaciales (Launch Library 2, The Space Devs, sin clave)
//  · Noticias relevantes de espacio y astronomía: Spaceflight News API (inglés) y Agencia SINC (español, RSS)
//  · Eventos y noticias manuales de data/eventos-manuales.json
// Si una fuente falla, se conservan sus datos anteriores.
import { readFile, writeFile, mkdir, readdir, unlink, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';

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
const ASSIGN = 'data/videos-asignados.json'; // asignaciones manuales de vídeos a astros y temas
const INFO = 'data/videos-info.json'; // descripciones de los vídeos (solo para el robot)

// Palabras clave para enlazar cada astro de la app con el último vídeo del canal que habla de él
const KEYWORDS = {
  sun: ['el sol', 'del sol', 'al sol', 'manchas solares', 'tormenta solar', 'eclipse solar', 'eclipse de sol'],
  moon: ['luna', 'lunar'], mercury: ['mercurio'], venus: ['venus'], mars: ['marte'], jupiter: ['júpiter', 'jupiter'],
  saturn: ['saturno'], uranus: ['urano'], neptune: ['neptuno'], pluto: ['plutón', 'pluton'],
  iss: ['estación espacial', 'estacion espacial', ' iss'], m31: ['andrómeda', 'andromeda'], m42: ['nebulosa de orión', 'nebulosa de orion'],
  m45: ['pléyades', 'pleyades'], sgra: ['sagitario a', 'agujero negro de la vía láctea', 'centro de la galaxia'], cygx1: ['cygnus x-1'],
  's:Betelgeuse': ['betelgeuse'], 's:Sirius': ['sirio'], 's:Polaris': ['estrella polar'], 's:Vega': ['vega'], 's:Antares': ['antares'],
  'c:Ori': ['orión', 'orion'], 'c:UMa': ['osa mayor', 'el carro'], 'c:Cas': ['casiopea'], 'c:Sco': ['escorpio', 'escorpión'], 'c:Gem': ['géminis', 'gemínidas', 'geminidas'],
  'c:Per': ['perseo', 'perseidas'], 'c:Leo': ['leónidas', 'leonidas', 'constelación de leo'], 'c:Lyr': ['líridas', 'liridas'], 'c:Cyg': ['cisne'], 'c:Tau': ['tauro'], 'c:And': ['andrómeda'],
};

const decode = s => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));
const tag = (xml, name) => { const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`)); return m ? decode(m[1].trim()) : ''; };

export function parseYouTubeRss(xml) {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => {
    const id = tag(e, 'yt:videoId');
    const corto = /youtube\.com\/shorts\//.test(e);
    return { id, titulo: tag(e, 'title'), fecha: tag(e, 'published'), corto, url: corto ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`,
      miniatura: (e.match(/<media:thumbnail url="([^"]+)"/) || [])[1] || `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
      descripcion: tag(e, 'media:description').slice(0, 600) };
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
const NEWS_DAYS = 7, NEWS_DAYS_ES = 21, NEWS_MAX = 8; // en español hay menos noticias de espacio: ventana más larga
const SPACE_ES = ['espacio', 'espacial', 'astronom', 'astrofís', 'planeta', 'exoplaneta', 'estrella', 'galaxia', 'telescopio', 'nasa', 'esa ', 'agencia espacial',
  'marte', 'luna ', 'lunar', 'júpiter', 'saturno', 'venus', 'mercurio', 'urano', 'neptuno', 'plutón', 'cometa', 'asteroide', 'meteor', 'eclipse', 'agujero negro',
  'supernova', 'nebulosa', 'cosmo', 'universo', 'sonda', 'astronauta', 'satélite', 'cohete', 'órbita', 'webb', 'hubble', 'artemis', 'vía láctea', 'sistema solar', 'sol '];
// Para fuentes de ciencia general (SINC): el TITULAR debe tener un término claramente espacial.
// Sin «planeta», «satélite» o «sol» sueltos: en noticias de clima o geología se refieren a la Tierra.
const SPACE_TITLE_ES = ['espacio', 'espacial', 'astronom', 'astrofís', 'exoplaneta', 'galaxia', 'telescopio', 'nasa', 'esa ', 'marte', 'marciano', 'luna ', 'lunar',
  'júpiter', 'saturno', 'venus', 'mercurio ', 'urano', 'neptuno', 'plutón', 'cometa', 'asteroide', 'meteor', 'eclipse', 'agujero negro', 'supernova', 'nebulosa',
  'cosmo', 'universo', 'sonda', 'astronauta', 'cohete', 'vía láctea', 'sistema solar', 'estrella', 'estelar', 'órbita', 'big bang', 'materia oscura', 'quásar', 'cuásar', 'púlsar'];
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
  if (n.idioma === 'es' && !n.espacio && !SPACE_TITLE_ES.some(w => hit(title + ' ', w))) return 0; // fuentes de ciencia general: solo si el titular es de espacio
  let s = 0, inTitle = 0;
  for (const w of MAJOR) if (hit(title, w)) { s += 2; inTitle++; } else if (hit(t, w)) s += 1;
  if (!inTitle && !n.destacado && !n.espacio && n.idioma !== 'es') return 0; // el titular debe hablar de espacio (fuera fotos de la Tierra, selfis…)
  if (n.destacado) s += 3;
  if (OFFICIAL.some(o => (n.fuente || '').includes(o))) s += 1;
  if (n.idioma === 'es') s += 2; // preferimos noticias en español
  if (n.espacio) s += 1; // fuentes 100 % de espacio y oficiales (NASA Ciencia, ESA): entran sus noticias de la semana
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
const fold = t => (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const entitiesOf = t => ENTITIES.filter(e => wholeWord(fold(t), e) || (e.endsWith('-') && fold(t).includes(e)));
const numbersOf = t => new Set((t.match(/\d+/g) || []).filter(n => !/^20\d\d$/.test(n)));
export function sameStoryAnyLang(a, b) {
  if (sameStory(a.titulo, b.titulo)) return true;
  if (/^apod\b/i.test(a.titulo) || /^apod\b/i.test(b.titulo)) return false; // la foto del día va aparte
  const ea = entitiesOf(a.titulo), eb = new Set(entitiesOf(b.titulo));
  if (!ea.some(e => eb.has(e))) return false;
  const na = numbersOf(a.titulo), nb = numbersOf(b.titulo);
  const shareNum = [...na].some(n => nb.has(n));
  return shareNum || Math.abs(Date.parse(a.fecha) - Date.parse(b.fecha)) < 36 * 3600e3;
}
export function pickNews(items, now = Date.now(), days = NEWS_DAYS) {
  const kept = [], urls = new Set();
  let apod = 0;
  items
    .filter(n => n.titulo && n.url && now - Date.parse(n.fecha) < days * 864e5)
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
    const desc = tag(it, 'description').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      .replace(/^Read this story in English here\.?\s*/i, '').replace(/\s*The post .{0,200}? appeared first on [^.]+\.?\s*$/i, '').trim(); // coletillas de WordPress/NASA
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

// ── Vídeos del canal ↔ astros y temas ──
// Se puntúa cada vídeo: el astro en el título principal vale más que mencionado entre paréntesis
// o de pasada; la descripción suma poco. «la luna de Marte» es de Marte, no de la Luna.
// data/videos-asignados.json permite forzar («asignar») o quitar («quitar») vídeos a mano.
const PLANETS_RX = '(mercurio|venus|marte|jupiter|saturno|urano|neptuno|pluton)';
export const OBJECTS = {
  sun: { kw: ['el sol', 'del sol', 'al sol', 'manchas solares', 'tormenta solar', 'eclipse solar', 'eclipse de sol', 'viento solar'] },
  moon: { kw: ['luna', 'lunar'], weak: ['artemis'], not: [new RegExp(`lunas? de ${PLANETS_RX}`, 'g'), /lunas? de (otro|otros) planetas?/g] },
  mercury: { kw: ['mercurio', 'bepicolombo'] },
  venus: { kw: ['venus'] },
  mars: { kw: ['marte', 'planeta rojo', 'fobos', 'deimos', 'mark watney', 'the martian'] },
  jupiter: { kw: ['jupiter'], weak: ['europa clipper', ' io ', 'ganimedes', 'calisto'] },
  saturn: { kw: ['saturno', 'titan', 'encelado'] },
  uranus: { kw: ['urano'] }, neptune: { kw: ['neptuno'] }, pluto: { kw: ['pluton'] },
  iss: { kw: ['estacion espacial', ' iss '], not: [/estacion espacial (china|tiangong)/g, /tiangong/g] },
  m31: { kw: ['andromeda'], not: [/constelacion de andromeda/g] }, m42: { kw: ['nebulosa de orion'] }, m45: { kw: ['pleyades'] },
  sgra: { kw: ['sagitario a', 'agujero negro de la via lactea', 'centro de la galaxia', 'centro de la via lactea'] }, cygx1: { kw: ['cygnus x-1'] },
  's:Betelgeuse': { kw: ['betelgeuse'] }, 's:Sirius': { kw: ['sirio'] }, 's:Polaris': { kw: ['estrella polar'] }, 's:Vega': { kw: ['vega'] }, 's:Antares': { kw: ['antares'] },
  'c:Ori': { kw: ['constelacion de orion', 'cinturon de orion'] }, 'c:UMa': { kw: ['osa mayor', 'el carro'] }, 'c:Cas': { kw: ['casiopea'] }, 'c:Sco': { kw: ['escorpio', 'escorpion'] },
  'c:Gem': { kw: ['geminis', 'geminidas'] }, 'c:Per': { kw: ['perseo', 'perseidas'] }, 'c:Leo': { kw: ['leonidas', 'constelacion de leo'] }, 'c:Lyr': { kw: ['liridas'] },
  'c:Cyg': { kw: ['constelacion del cisne'] }, 'c:Tau': { kw: ['tauro', 'taurides'] }, 'c:And': { kw: ['constelacion de andromeda'] },
};
// Temas para enlazar eventos del calendario (lanzamientos y fenómenos del cielo) con vídeos
export const TOPICS = {
  starship: ['starship'], artemis: ['artemis'], 'new-glenn': ['new glenn', 'blue origin', 'bezos'], smile: ['smile'], bepicolombo: ['bepicolombo'],
  'europa-clipper': ['europa clipper'], tiangong: ['tiangong', 'shenzhou', 'estacion espacial china'], roman: ['roman'], webb: ['webb'], hubble: ['hubble'],
  'eclipse-solar': ['eclipse solar', 'eclipse de sol'], 'eclipse-lunar': ['eclipse lunar', 'eclipse de luna'], superluna: ['superluna'],
  conjuncion: ['dos estrellas juntas', 'desfile de planetas', 'conjuncion', 'planetas a la vez', 'alineacion de planetas'],
  liridas: ['liridas'], perseidas: ['perseidas'], geminidas: ['geminidas'], leonidas: ['leonidas'], cuadrantidas: ['cuadrantidas'], orionidas: ['orionidas'], 'eta-acuaridas': ['acuaridas'],
  'paso-iss': ['ver la estacion espacial', 'ver la iss'],
};
const has = (text, w) => text.includes(w);
function scoreFor(v, def, info) {
  const strip = t => (def.not || []).reduce((acc, rx) => acc.replace(rx, ' '), t);
  const title = strip(' ' + fold(v.titulo).replace(/[¿?¡!"“”«»:]/g, ' ') + ' ');
  const raw = fold(v.titulo);
  const cut = raw.search(/[(\[]/);
  const main = strip(' ' + (cut > 0 ? raw.slice(0, cut) : raw).replace(/[¿?¡!"“”«»:]/g, ' ') + ' ');
  const first = main.trim().split(/\s+/).slice(0, 4).join(' ');
  let sc = 0;
  for (const w of def.kw) {
    if (has(main, w)) sc = Math.max(sc, 5 + (first.includes(w.trim()) ? 2 : 0));
    else if (has(title, w)) sc = Math.max(sc, 3);
  }
  for (const w of def.weak || []) if (has(title, w)) sc = Math.max(sc, 2);
  if (!sc && info?.descripcion) { const d = strip(' ' + fold(info.descripcion) + ' '); if (def.kw.some(w => has(d, w))) sc = 1; }
  return sc;
}
const pub = v => ({ id: v.id, titulo: v.titulo, url: v.url, miniatura: v.miniatura, fecha: v.fecha, corto: !!v.corto });
export function relatedVideos(videos, manual = {}, info = {}, max = 6) {
  const out = {};
  for (const [obj, def] of Object.entries(OBJECTS)) {
    const forced = new Set(manual.asignar?.[obj] || []), removed = new Set(manual.quitar?.[obj] || []);
    const list = videos.filter(v => !removed.has(v.id))
      .map(v => ({ v, sc: forced.has(v.id) ? 100 : scoreFor(v, def, info[v.id]) }))
      .filter(x => x.sc >= 2)
      .sort((a, b) => b.sc - a.sc || (a.v.corto - b.v.corto) || Date.parse(b.v.fecha) - Date.parse(a.v.fecha))
      .slice(0, max).map(x => ({ ...pub(x.v), puntos: x.sc }));
    if (list.length) out[obj] = list;
  }
  return out;
}
export function videosByObject(rel) { // compatibilidad: el mejor vídeo de cada astro
  return Object.fromEntries(Object.entries(rel).map(([k, l]) => [k, { id: l[0].id, titulo: l[0].titulo, url: l[0].url }]));
}
export function topicVideos(videos, manual = {}) { // el mejor vídeo de cada tema (prioriza largos y recientes)
  const out = {};
  for (const [topic, kws] of Object.entries(TOPICS)) {
    const forced = manual.temas?.[topic];
    const v = (forced && videos.find(x => x.id === forced)) || videos
      .map(v => ({ v, sc: scoreFor(v, { kw: kws }) }))
      .filter(x => x.sc >= 3)
      .sort((a, b) => b.sc - a.sc || (a.v.corto - b.v.corto) || Date.parse(b.v.fecha) - Date.parse(a.v.fecha))[0]?.v;
    if (v) out[topic] = pub(v);
  }
  return out;
}
const LAUNCH_TOPICS = ['starship', 'artemis', 'new-glenn', 'smile', 'bepicolombo', 'europa-clipper', 'tiangong', 'roman'];
export function launchTopic(l, temas) { // tema de un lanzamiento si hay vídeo para él
  const t = fold([l.nombre, l.proveedor].filter(Boolean).join(' ')); // el nombre del lanzamiento, sin la descripción larga (evita falsos positivos)
  return LAUNCH_TOPICS.find(k => temas[k] && TOPICS[k].some(w => new RegExp(`(^|[^a-z0-9])${w.trim().replace(/[-]/g, '\\-')}($|[^a-z0-9])`).test(t))) || null;
}

// Miniaturas ligeras de las noticias (≈10 KB). Las imágenes originales pesan varios MB y en iPhone,
// al reducirlas a 96 px dentro de una lista con scroll, se vaciaban y bloqueaban la ventana.
const THUMB_DIR = 'data/miniaturas';
const IS_IMAGE = u => typeof u === 'string' && /^https?:\/\//.test(u) && !/\.(mp4|mov|webm|m4v|mp3|pdf)(\?|$)/i.test(u);
export async function makeThumbs(lists) {
  const sharp = (await import('sharp').catch(() => null))?.default;
  if (!sharp) { console.log('Miniaturas: sharp no disponible, se omiten'); return; }
  await mkdir(THUMB_DIR, { recursive: true });
  const keep = new Set(), bad = new Set();
  let made = 0, reused = 0, failed = 0;
  for (const list of lists) for (const n of list) {
    delete n.mini;
    if (!IS_IMAGE(n.imagen)) continue;
    const file = `${THUMB_DIR}/${createHash('sha1').update(n.imagen).digest('hex').slice(0, 14)}.jpg`;
    if (keep.has(file)) { n.mini = file; continue; }
    if (bad.has(file)) continue;
    try {
      try { await access(file); reused++; } catch {
        const r = await fetch(n.imagen, { headers: { 'User-Agent': 'planetario-calendario/1.0' }, signal: AbortSignal.timeout(25000) });
        if (!r.ok) throw new Error(r.status);
        const buf = Buffer.from(await r.arrayBuffer());
        if (buf.length > 40e6) throw new Error('demasiado grande');
        await writeFile(file, await sharp(buf, { limitInputPixels: 1e9 }).rotate().resize(240, 135, { fit: 'cover', position: 'attention' }).jpeg({ quality: 72, mozjpeg: true }).toBuffer());
        made++;
      }
      keep.add(file); n.mini = file;
    } catch (e) { bad.add(file); failed++; console.log(`  miniatura fallida (${e.message}): ${n.imagen}`); }
  }
  for (const f of await readdir(THUMB_DIR)) if (!keep.has(`${THUMB_DIR}/${f}`)) await unlink(`${THUMB_DIR}/${f}`).catch(() => {});
  console.log(`Miniaturas: ${made} nuevas, ${reused} reutilizadas, ${failed} fallidas`);
}

async function get(url, type = 'text') {
  const r = await fetch(url, { headers: { 'User-Agent': 'planetario-calendario/1.0' }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return type === 'json' ? r.json() : r.text();
}

async function main() {
  const prev = JSON.parse(await readFile(OUT, 'utf8').catch(() => '{}'));
  const out = { actualizado: new Date().toISOString(), videos: prev.videos || [], lanzamientos: prev.lanzamientos || [], noticias: prev.noticias || [], noticiasPorIdioma: prev.noticiasPorIdioma || {}, manuales: [], videosPorObjeto: prev.videosPorObjeto || {}, videosRelacionados: prev.videosRelacionados || {}, videosTemas: prev.videosTemas || {} };

  try {
    const nuevos = parseYouTubeRss(await get(`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`));
    const all = new Map([...out.videos, ...nuevos].map(v => [v.id, v]));
    out.videos = [...all.values()].sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha)).slice(0, 2000); // todo el catálogo del canal
    const asignados = JSON.parse(await readFile(ASSIGN, 'utf8').catch(() => '{}'));
    const info = JSON.parse(await readFile(INFO, 'utf8').catch(() => '{}'));
    for (const v of nuevos) if (v.descripcion) info[v.id] = { descripcion: v.descripcion };
    for (const v of out.videos) delete v.descripcion; // la descripción solo la usa el robot (no engorda el archivo de la app)
    await writeFile(INFO, JSON.stringify(info, null, 1) + '\n');
    out.videosRelacionados = relatedVideos(out.videos, asignados, info);
    out.videosPorObjeto = videosByObject(out.videosRelacionados);
    out.videosTemas = topicVideos(out.videos, asignados);
    for (const [k, l] of Object.entries(out.videosRelacionados)) console.log(`  ${k}: ${l.map(v => `[${v.puntos}] ${v.titulo}`).join(' · ')}`);
    console.log(`  temas: ${Object.entries(out.videosTemas).map(([k, v]) => `${k} → ${v.titulo}`).join(' · ')}`);
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
      for (const f of feeds) {
        const items = parseRssItems(f.xml, src.nombre, src.espacio); news.push(...items);
        const recent = items.filter(n => Date.now() - Date.parse(n.fecha) < NEWS_DAYS_ES * 864e5);
        console.log(`${src.nombre}: ${items.length} noticias en ${f.url} (${recent.length} de los últimos ${NEWS_DAYS_ES} días)`);
        recent.filter(n => newsScore(n) >= 3).forEach(n => console.log(`    ✔ [${newsScore(n)}] ${n.fecha.slice(0, 10)} ${n.titulo}`));
      }
    } catch (e) { console.warn(`${src.nombre}: no disponible →`, e.message); }
  }
  if (news.length) {
    out.noticias = pickNews(news);
    out.noticiasPorIdioma = { es: pickNews(news.filter(n => n.idioma === 'es'), Date.now(), NEWS_DAYS_ES), en: pickNews(news.filter(n => n.idioma === 'en')) };
    console.log(`Noticias por idioma: ${out.noticiasPorIdioma.es.length} en español, ${out.noticiasPorIdioma.en.length} en inglés`);
    await makeThumbs([out.noticias, out.noticiasPorIdioma.es, out.noticiasPorIdioma.en]).catch(e => console.log('Miniaturas: ' + e.message));
    console.log(`Noticias relevantes seleccionadas: ${out.noticias.length}`);
    out.noticias.forEach(n => console.log(`  [${n.puntos}] ${n.fuente}: ${n.titulo}`));
  }

  for (const l of out.lanzamientos) { const k = launchTopic(l, out.videosTemas); if (k) l.tema = k; else delete l.tema; }
  try {
    const m = JSON.parse(await readFile(MANUAL, 'utf8'));
    out.manuales = (m.eventos || []).filter(e => e.fecha && e.titulo);
    console.log(`Eventos manuales: ${out.manuales.length}`);
  } catch (e) { console.warn('Eventos manuales: archivo no válido →', e.message); }

  await writeFile(OUT, JSON.stringify(out, null, 1) + '\n');
}

if (import.meta.url === `file://${process.argv[1]}`) main();
