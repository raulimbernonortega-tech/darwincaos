// Planetario DarwinCaos v2
// Cielo real: efemérides (Astronomy Engine), catálogo Hipparcos, ISS por TLE (satellite.js),
// 88 constelaciones IAU con ilustraciones de Stellarium y texturas planetarias fotográficas.
import * as THREE from './vendor/three.module.min.js';

const A = window.Astronomy;
const SAT = window.satellite;

// ───────────── Configuración del canal ─────────────
const CHANNEL_URL = 'https://www.youtube.com/@DarwinCaos'; // ← verificar el handle real
// Vídeos del canal por objeto. Si falta, se abre la búsqueda del canal con el nombre del objeto.
const VIDEOS = {
  // jupiter: 'https://youtu.be/XXXXXXXXXXX',
};

const D2R = Math.PI / 180, R2D = 180 / Math.PI;
const R = { dome: 950, ground: 930, stars: 900, lines: 895, art: 890, dso: 870, meteor: 860, body: 500, iss: 450 };
const SKY_LIMIT = [3.5, 5.0, 6.5]; // magnitud límite: ciudad, pueblo, campo

// ───────────── Textos ─────────────
const I18N = {
  es: {
    loading: 'Cargando el cielo…', above: 'Sobre el horizonte', below: 'Bajo el horizonte',
    skyNow: '🔭 Qué hay en el cielo', layers: '🗂️ Capas', redMode: 'Modo nocturno rojo', about: 'Acerca de',
    placeTitle: '📍 Tu ubicación', useMyLocation: '📡 Usar mi ubicación', search: 'Buscar', cityPh: 'Busca una ciudad: Tokio, Lima…',
    timeTitle: '🕒 Viajar en el tiempo', plusDay: '+1 día', now: 'Ahora',
    timeNote: 'El cielo gira en tiempo real. Úsalo para ver cómo estará el cielo esta noche o durante un evento.',
    aboutText: 'Posiciones calculadas en tiempo real para tu ubicación: Sol, Luna y planetas con efemérides de precisión, más de 5.000 estrellas del catálogo Hipparcos, las 88 constelaciones oficiales y la ISS con sus elementos orbitales actuales.',
    subscribe: '▶ Suscríbete al canal', credits: 'Créditos',
    pointTo: '🎯 Apuntar', share: '🔗 Compartir', watchVideo: '▶ Ver en el canal',
    searchPh: 'Busca Saturno, Orión, Sirio, ISS…', sensor: '🧭 Seguir el móvil', camera: '📷 Cámara',
    N: 'N', E: 'E', S: 'S', W: 'O', NE: 'NE', SE: 'SE', SW: 'SO', NW: 'NO',
    solar: 'Sistema solar', satellites: 'Satélites', stars: 'Estrellas brillantes', deep: 'Cielo profundo',
    consts: 'Constelaciones', meteors: 'Lluvias de meteoros', cities: 'Ciudades',
    star: 'Estrella', constellation: 'Constelación', planet: 'Planeta', dwarf: 'Planeta enano', ourStar: 'Nuestra estrella', satellite: 'Satélite natural',
    station: 'Estación espacial', notNaked: 'no visible a simple vista', inConst: 'en',
    alt: 'Altura', az: 'Acimut', rise: 'Salida', set: 'Puesta', transit: 'Culmina', mag: 'Magnitud', dist: 'Distancia',
    phase: 'Iluminada', lightTime: 'Luz tarda', speed: 'Velocidad', height: 'Altitud', nextPass: 'Próximo paso visible',
    noPass: 'Sin pasos visibles en 48 h', sunlit: 'iluminada por el Sol', shadow: 'en la sombra de la Tierra',
    circumpolar: 'Nunca se pone', neverRises: 'No sale', visibleNow: 'sobre el horizonte', belowNow: 'bajo el horizonte',
    issLoading: 'Cargando órbita de la ISS…', issOffline: 'No se pudo cargar la órbita de la ISS',
    activeShower: 'Lluvia activa', nextShower: 'Próxima', peak: 'pico', radiantBelow: 'radiante bajo el horizonte',
    sporadic: 'Solo meteoros esporádicos esta noche',
    linkCopied: 'Enlace copiado ✔', gpsFail: 'No se pudo obtener tu ubicación', myLocation: 'Mi ubicación',
    camFail: 'No se pudo abrir la cámara. Sigues en modo sensor.', sensorFail: 'Este dispositivo no ofrece brújula/giroscopio.',
    noResults: 'Sin resultados. Pulsa Intro para buscarlo como ciudad.', searchCity: 'Buscar como ciudad',
    hintPlace: 'Toca 📍 para ver el cielo desde tu ubicación',
    L: { planets: 'Sol, Luna y planetas', iss: 'Estación Espacial (ISS)', lines: 'Líneas de constelaciones', art: 'Ilustraciones mitológicas',
      conNames: 'Nombres de constelaciones', starNames: 'Nombres de estrellas', deep: 'Galaxias, nebulosas y agujeros negros',
      ecliptic: 'Eclíptica', grid: 'Cuadrícula altura/acimut', meteors: 'Estrellas fugaces (lluvias reales)', atmosphere: 'Luz del día y crepúsculo' },
    skyQ: 'Calidad del cielo', skyQOpts: ['🏙️ Ciudad', '🏘️ Pueblo', '🌲 Campo'],
    min: 'min', today: 'hoy', tomorrow: 'mañana',
  },
  en: {
    loading: 'Loading the sky…', above: 'Above horizon', below: 'Below horizon',
    skyNow: '🔭 What\'s in the sky', layers: '🗂️ Layers', redMode: 'Red night mode', about: 'About',
    placeTitle: '📍 Your location', useMyLocation: '📡 Use my location', search: 'Search', cityPh: 'Search a city: Tokyo, Lima…',
    timeTitle: '🕒 Time travel', plusDay: '+1 day', now: 'Now',
    timeNote: 'The sky moves in real time. Use this to preview tonight\'s sky or an upcoming event.',
    aboutText: 'Real-time positions for your location: Sun, Moon and planets from precise ephemerides, 5,000+ Hipparcos stars, all 88 official constellations and the ISS from its current orbital elements.',
    subscribe: '▶ Subscribe to the channel', credits: 'Credits',
    pointTo: '🎯 Point', share: '🔗 Share', watchVideo: '▶ Watch on the channel',
    searchPh: 'Search Saturn, Orion, Sirius, ISS…', sensor: '🧭 Follow phone', camera: '📷 Camera',
    N: 'N', E: 'E', S: 'S', W: 'W', NE: 'NE', SE: 'SE', SW: 'SW', NW: 'NW',
    solar: 'Solar system', satellites: 'Satellites', stars: 'Bright stars', deep: 'Deep sky',
    consts: 'Constellations', meteors: 'Meteor showers', cities: 'Cities',
    star: 'Star', constellation: 'Constellation', planet: 'Planet', dwarf: 'Dwarf planet', ourStar: 'Our star', satellite: 'Natural satellite',
    station: 'Space station', notNaked: 'not visible to the naked eye', inConst: 'in',
    alt: 'Altitude', az: 'Azimuth', rise: 'Rise', set: 'Set', transit: 'Transit', mag: 'Magnitude', dist: 'Distance',
    phase: 'Illuminated', lightTime: 'Light time', speed: 'Speed', height: 'Altitude', nextPass: 'Next visible pass',
    noPass: 'No visible passes in 48 h', sunlit: 'sunlit', shadow: 'in Earth\'s shadow',
    circumpolar: 'Never sets', neverRises: 'Never rises', visibleNow: 'above horizon', belowNow: 'below horizon',
    issLoading: 'Loading ISS orbit…', issOffline: 'Could not load the ISS orbit',
    activeShower: 'Active shower', nextShower: 'Next', peak: 'peak', radiantBelow: 'radiant below horizon',
    sporadic: 'Only sporadic meteors tonight',
    linkCopied: 'Link copied ✔', gpsFail: 'Could not get your location', myLocation: 'My location',
    camFail: 'Could not open the camera. Staying in sensor mode.', sensorFail: 'This device has no compass/gyroscope.',
    noResults: 'No results. Press Enter to search it as a city.', searchCity: 'Search as a city',
    hintPlace: 'Tap 📍 to see the sky from your location',
    L: { planets: 'Sun, Moon & planets', iss: 'Space Station (ISS)', lines: 'Constellation lines', art: 'Mythological artwork',
      conNames: 'Constellation names', starNames: 'Star names', deep: 'Galaxies, nebulae & black holes',
      ecliptic: 'Ecliptic', grid: 'Alt/Az grid', meteors: 'Shooting stars (real showers)', atmosphere: 'Daylight & twilight' },
    skyQ: 'Sky quality', skyQOpts: ['🏙️ City', '🏘️ Town', '🌲 Countryside'],
    min: 'min', today: 'today', tomorrow: 'tomorrow',
  },
};

// ───────────── Catálogos propios ─────────────
// Polos de rotación (RA°, Dec° J2000, IAU) para orientar discos y anillos correctamente.
const BODIES = [
  { id: 'sun', body: 'Sun', es: 'Sol', en: 'Sun', tex: 'sol', deg: 0.267, ref: 40, pole: [286.13, 63.87], glow: '#fde68a',
    fact: ['Contiene el 99,86 % de la masa del sistema solar. Su luz tarda unos 8 minutos y 20 segundos en llegar hasta nosotros.', 'Holds 99.86% of the Solar System\'s mass. Its light takes about 8 minutes 20 seconds to reach us.'] },
  { id: 'moon', body: 'Moon', es: 'Luna', en: 'Moon', tex: 'luna', deg: 0.259, ref: 26, pole: [270, 66.5], glow: '#e2e8f0',
    fact: ['Siempre nos muestra la misma cara porque tarda lo mismo en girar sobre sí misma que en orbitarnos (27,3 días). Se aleja unos 3,8 cm cada año.', 'It always shows us the same face because it spins once per orbit (27.3 days). It drifts away about 3.8 cm per year.'] },
  { id: 'mercury', body: 'Mercury', es: 'Mercurio', en: 'Mercury', tex: 'mercurio', deg: 0.025, ref: 7, pole: [281.01, 61.42], glow: '#d6d3d1',
    fact: ['El planeta más cercano al Sol. Su año dura 88 días, pero un día solar completo dura 176 días terrestres.', 'Closest planet to the Sun. Its year lasts 88 days, but one full solar day lasts 176 Earth days.'] },
  { id: 'venus', body: 'Venus', es: 'Venus', en: 'Venus', tex: 'venus', deg: 0.04, ref: 7, pole: [272.76, 67.16], glow: '#fef3c7',
    fact: ['El planeta más caliente (~465 °C) por su enorme efecto invernadero, y gira al revés que casi todos los demás.', 'The hottest planet (~465 °C) due to its runaway greenhouse effect, and it spins backwards.'] },
  { id: 'mars', body: 'Mars', es: 'Marte', en: 'Mars', tex: 'marte', deg: 0.03, ref: 7, pole: [317.68, 52.89], glow: '#fdba74',
    fact: ['Alberga el Olympus Mons, el mayor volcán conocido del sistema solar: unas 2,5 veces la altura del Everest.', 'Home to Olympus Mons, the largest known volcano in the Solar System: about 2.5× the height of Everest.'] },
  { id: 'jupiter', body: 'Jupiter', es: 'Júpiter', en: 'Jupiter', tex: 'jupiter', deg: 0.06, ref: 7, pole: [268.06, 64.5], glow: '#fde7c2',
    fact: ['Más del doble de masivo que todos los demás planetas juntos. Con unos prismáticos ya se ven sus cuatro lunas galileanas.', 'More than twice as massive as all other planets combined. Binoculars reveal its four Galilean moons.'] },
  { id: 'saturn', body: 'Saturn', es: 'Saturno', en: 'Saturn', tex: 'saturno', deg: 0.05, ref: 7, pole: [40.59, 83.54], glow: '#fde68a', ring: true,
    fact: ['Sus anillos miden unos 280.000 km de diámetro, pero su grosor típico es de apenas decenas de metros. Un telescopio pequeño basta para verlos.', 'Its rings span ~280,000 km yet are typically only tens of metres thick. A small telescope shows them.'] },
  { id: 'uranus', body: 'Uranus', es: 'Urano', en: 'Uranus', tex: 'urano', deg: 0.025, ref: 7, pole: [257.31, -15.18], glow: '#a5f3fc',
    fact: ['Gira “tumbado”: su eje está inclinado unos 98°. Bajo cielos muy oscuros es apenas visible a simple vista.', 'It spins on its side, tilted about 98°. Under very dark skies it is barely visible to the naked eye.'] },
  { id: 'neptune', body: 'Neptune', es: 'Neptuno', en: 'Neptune', tex: 'neptuno', deg: 0.025, ref: 7, pole: [299.36, 43.46], glow: '#93c5fd',
    fact: ['Tiene los vientos más rápidos del sistema solar, de más de 2.000 km/h. Hace falta un telescopio para verlo.', 'It has the fastest winds in the Solar System, over 2,000 km/h. You need a telescope to see it.'] },
  { id: 'pluto', body: 'Pluto', es: 'Plutón', en: 'Pluto', tex: 'pluton', deg: 0.018, ref: 7, pole: [132.99, -6.16], glow: '#e7d3bf', dwarf: true,
    fact: ['Planeta enano del cinturón de Kuiper. La sonda New Horizons lo visitó en 2015 y descubrió una llanura helada en forma de corazón.', 'Dwarf planet in the Kuiper Belt. New Horizons flew by in 2015 and found a heart-shaped icy plain.'] },
];

const DSO = [
  { id: 'm31', es: 'Galaxia de Andrómeda (M31)', en: 'Andromeda Galaxy (M31)', ra: 0.712, dec: 41.27, kind: ['Galaxia espiral', 'Spiral galaxy'], eye: true, ly: 2.5e6,
    fact: ['El objeto más lejano visible a simple vista, a unos 2,5 millones de años luz. Contiene alrededor de un billón de estrellas.', 'The most distant object visible to the naked eye, ~2.5 million light-years away, with about a trillion stars.'] },
  { id: 'm42', es: 'Nebulosa de Orión (M42)', en: 'Orion Nebula (M42)', ra: 5.588, dec: -5.39, kind: ['Nebulosa', 'Nebula'], eye: true, ly: 1344,
    fact: ['Una “guardería” de estrellas a ~1.340 años luz, visible a simple vista bajo el cinturón de Orión.', 'A stellar nursery ~1,340 light-years away, visible to the naked eye below Orion\'s Belt.'] },
  { id: 'm45', es: 'Pléyades (M45)', en: 'Pleiades (M45)', ra: 3.79, dec: 24.12, kind: ['Cúmulo abierto', 'Open cluster'], eye: true, ly: 444,
    fact: ['Cúmulo de estrellas jóvenes a ~440 años luz. A simple vista se distinguen unas 6 o 7 estrellas.', 'A young star cluster ~440 light-years away. The naked eye shows 6 or 7 stars.'] },
  { id: 'm13', es: 'Cúmulo de Hércules (M13)', en: 'Hercules Cluster (M13)', ra: 16.695, dec: 36.46, kind: ['Cúmulo globular', 'Globular cluster'], eye: false, ly: 25000,
    fact: ['Unas 300.000 estrellas apiñadas a ~25.000 años luz. En 1974 se le envió el mensaje de Arecibo.', 'About 300,000 stars packed ~25,000 light-years away. The Arecibo message was sent towards it in 1974.'] },
  { id: 'omegacen', es: 'Omega Centauri', en: 'Omega Centauri', ra: 13.447, dec: -47.48, kind: ['Cúmulo globular', 'Globular cluster'], eye: true, ly: 17000,
    fact: ['El mayor cúmulo globular de la Vía Láctea, con unos 10 millones de estrellas. Se ve desde latitudes bajas y el hemisferio sur.', 'The Milky Way\'s largest globular cluster, ~10 million stars. Visible from low latitudes and the southern hemisphere.'] },
  { id: 'lmc', es: 'Gran Nube de Magallanes', en: 'Large Magellanic Cloud', ra: 5.392, dec: -69.76, kind: ['Galaxia satélite', 'Satellite galaxy'], eye: true, ly: 160000,
    fact: ['Galaxia satélite de la Vía Láctea a ~160.000 años luz. Solo se ve desde el hemisferio sur.', 'A satellite galaxy of the Milky Way ~160,000 light-years away, visible only from the southern hemisphere.'] },
  { id: 'sgra', es: 'Sagitario A*', en: 'Sagittarius A*', ra: 17.761, dec: -29.008, kind: ['Agujero negro supermasivo', 'Supermassive black hole'], eye: false, ly: 26700,
    fact: ['El agujero negro del centro de nuestra galaxia: unos 4 millones de masas solares. El Event Horizon Telescope lo fotografió en 2022.', 'The black hole at our galaxy\'s centre: ~4 million solar masses. Imaged by the Event Horizon Telescope in 2022.'] },
  { id: 'cygx1', es: 'Cygnus X-1', en: 'Cygnus X-1', ra: 19.972, dec: 35.2, kind: ['Agujero negro estelar', 'Stellar black hole'], eye: false, ly: 7200,
    fact: ['Uno de los primeros objetos aceptados como agujero negro. Devora material de una estrella supergigante azul compañera.', 'One of the first objects accepted as a black hole. It feeds on a blue supergiant companion.'] },
  { id: '3c273', es: 'Cuásar 3C 273', en: 'Quasar 3C 273', ra: 12.485, dec: 2.05, kind: ['Cuásar', 'Quasar'], eye: false, ly: 2.4e9,
    fact: ['El primer cuásar identificado (1963). Está a ~2.400 millones de años luz y aun así se ve con telescopios de aficionado.', 'The first quasar identified (1963). It lies ~2.4 billion light-years away yet amateur telescopes can see it.'] },
];

// Lluvias principales (IMO). before/after: días de actividad; b: caída de actividad (dex/día).
const SHOWERS = [
  { id: 'qua', es: 'Cuadrántidas', en: 'Quadrantids', ra: 15.33, dec: 49.5, peak: [1, 3], before: 6, after: 9, zhr: 110, b: 0.8 },
  { id: 'lyr', es: 'Líridas', en: 'Lyrids', ra: 18.07, dec: 34, peak: [4, 22], before: 8, after: 8, zhr: 18, b: 0.35 },
  { id: 'eta', es: 'Eta Acuáridas', en: 'Eta Aquariids', ra: 22.5, dec: -1, peak: [5, 6], before: 17, after: 22, zhr: 50, b: 0.08 },
  { id: 'per', es: 'Perseidas', en: 'Perseids', ra: 3.2, dec: 58, peak: [8, 12], before: 26, after: 12, zhr: 100, b: 0.2 },
  { id: 'ori', es: 'Oriónidas', en: 'Orionids', ra: 6.33, dec: 16, peak: [10, 21], before: 19, after: 17, zhr: 20, b: 0.12 },
  { id: 'leo', es: 'Leónidas', en: 'Leonids', ra: 10.27, dec: 22, peak: [11, 17], before: 11, after: 13, zhr: 15, b: 0.35 },
  { id: 'gem', es: 'Gemínidas', en: 'Geminids', ra: 7.47, dec: 33, peak: [12, 14], before: 10, after: 6, zhr: 150, b: 0.35 },
];

const PRESET_CITIES = [
  { name: 'Ciudad Real, España', lat: 38.9848, lon: -3.9274, tz: 'Europe/Madrid' },
  { name: 'Madrid, España', lat: 40.4168, lon: -3.7038, tz: 'Europe/Madrid' },
  { name: 'Ciudad de México', lat: 19.4326, lon: -99.1332, tz: 'America/Mexico_City' },
  { name: 'Buenos Aires', lat: -34.6037, lon: -58.3816, tz: 'America/Argentina/Buenos_Aires' },
  { name: 'Bogotá', lat: 4.711, lon: -74.0721, tz: 'America/Bogota' },
  { name: 'Lima', lat: -12.0464, lon: -77.0428, tz: 'America/Lima' },
  { name: 'Santiago de Chile', lat: -33.4489, lon: -70.6693, tz: 'America/Santiago' },
  { name: 'New York', lat: 40.7128, lon: -74.006, tz: 'America/New_York' },
];

// ───────────── Estado y persistencia ─────────────
const STORE_KEY = 'dc_planetario_v2';
const saved = (() => { try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch { return {}; } })();
function persist() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ lang: S.lang, place: S.place, layers: S.layers, skyQ: S.skyQ, red: S.red, tle: S.tleCache, hinted: true }));
  } catch { /* almacenamiento no disponible */ }
}
const params = new URLSearchParams(location.search);
const urlPlace = params.has('lat') && params.has('lon')
  ? { name: params.get('name') || `${(+params.get('lat')).toFixed(2)}, ${(+params.get('lon')).toFixed(2)}`, lat: +params.get('lat'), lon: +params.get('lon'), tz: params.get('tz') || undefined }
  : null;

const S = {
  lang: params.get('lang') || saved.lang || ((navigator.language || 'es').startsWith('es') ? 'es' : 'en'),
  place: urlPlace || saved.place || PRESET_CITIES[0],
  layers: Object.assign({ planets: true, iss: true, lines: true, art: true, conNames: true, starNames: true, deep: true, ecliptic: false, grid: false, meteors: true, atmosphere: true }, saved.layers),
  skyQ: saved.skyQ ?? 1,
  red: !!saved.red,
  tleCache: saved.tle || null,
  offset: params.has('t') && !isNaN(Date.parse(params.get('t'))) ? Date.parse(params.get('t')) - Date.now() : 0,
  sensor: false, camera: false,
  fov: 62, viewAz: 180, viewAlt: 25, targetAz: null, targetAlt: null,
  selected: null,
};
const T = () => I18N[S.lang];
const simDate = () => new Date(Date.now() + S.offset);
let observer = new A.Observer(S.place.lat, S.place.lon, 0);

// ───────────── Utilidades de coordenadas ─────────────
// Marco "ecuatorial three": X = RA 6h, Y = polo norte celeste, Z = RA 0h.
function eqVec(raH, decDeg, r = 1) {
  const a = raH * 15 * D2R, d = decDeg * D2R;
  return new THREE.Vector3(r * Math.cos(d) * Math.sin(a), r * Math.sin(d), r * Math.cos(d) * Math.cos(a));
}
// Marco horizontal three: +X = Este, +Y = cenit, −Z = Norte.
function altAzVec(azDeg, altDeg, r = 1) {
  const az = azDeg * D2R, alt = altDeg * D2R;
  return new THREE.Vector3(r * Math.cos(alt) * Math.sin(az), r * Math.sin(alt), -r * Math.cos(alt) * Math.cos(az));
}
function vecToAltAz(v) {
  const n = v.clone().normalize();
  return { alt: Math.asin(THREE.MathUtils.clamp(n.y, -1, 1)) * R2D, az: (Math.atan2(n.x, -n.z) * R2D + 360) % 360 };
}
const astroToThreeEq = v => new THREE.Vector3(v.y, v.z, v.x);
const fold = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// ───────────── Escena ─────────────
const canvas = document.getElementById('sky');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x000000, 0);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(S.fov, innerWidth / innerHeight, 0.1, 3000);
const texLoader = new THREE.TextureLoader();
const loadTex = (url, srgb = true) => {
  const t = texLoader.load(url);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
};

// Grupo del cielo: todo lo celeste vive en coordenadas ecuatoriales J2000 y se orienta
// con una única matriz EQJ→horizonte (incluye precesión, nutación y rotación terrestre).
const skyGroup = new THREE.Group();
skyGroup.matrixAutoUpdate = false;
scene.add(skyGroup);
const horizonGroup = new THREE.Group();
scene.add(horizonGroup);

let skyMatrixTime = 0;
function updateSkyMatrix(date, force = false) {
  if (!force && Math.abs(date - skyMatrixTime) < 1000) return;
  skyMatrixTime = +date;
  const time = A.MakeTime(date);
  const rot = A.Rotation_EQJ_HOR(time, observer);
  const toThreeHor = (x, y, z) => { const h = A.RotateVector(rot, new A.Vector(x, y, z, time)); return new THREE.Vector3(-h.y, h.z, -h.x); };
  // columnas = imagen de los ejes X(astro y), Y(astro z), Z(astro x)
  skyGroup.matrix.makeBasis(toThreeHor(0, 1, 0), toThreeHor(0, 0, 1), toThreeHor(1, 0, 0));
  skyGroup.matrixWorldNeedsUpdate = true;
  skyGroup.updateMatrixWorld(true);
}

// ── Bóveda atmosférica con color según la altura del Sol ──
const domeMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false,
  uniforms: { uZenith: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uSunDir: { value: new THREE.Vector3(0, -1, 0) }, uSunGlow: { value: 0 } },
  vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform vec3 uZenith, uHorizon, uSunDir; uniform float uSunGlow; varying vec3 vDir;
    void main(){ vec3 d = normalize(vDir); float h = clamp(d.y, 0.0, 1.0);
      vec3 c = mix(uHorizon, uZenith, pow(h, 0.45));
      float s = max(dot(d, uSunDir), 0.0);
      c += uSunGlow * (pow(s, 8.0) * vec3(0.55, 0.35, 0.18) + pow(s, 64.0) * vec3(0.6, 0.5, 0.35));
      gl_FragColor = vec4(c, 1.0); }`,
});
const dome = new THREE.Mesh(new THREE.SphereGeometry(R.dome, 48, 24), domeMat);
dome.renderOrder = -10;
scene.add(dome);

const SKY_KEYS = [ // [altura Sol, cenit, horizonte]
  [-18, '#01030a', '#03070f'], [-12, '#020611', '#0b1630'], [-6, '#0a1838', '#36406a'],
  [-2, '#16305f', '#a3627a'], [2, '#2a5ba0', '#e3a06c'], [10, '#2f6fc8', '#a9cdf0'], [90, '#2a66c4', '#9cc6ee'],
];
function skyColorsFor(sunAlt) {
  for (let i = 0; i < SKY_KEYS.length - 1; i++) {
    const [a0, z0, h0] = SKY_KEYS[i], [a1, z1, h1] = SKY_KEYS[i + 1];
    if (sunAlt <= a1) {
      const f = THREE.MathUtils.clamp((sunAlt - a0) / (a1 - a0), 0, 1);
      return [new THREE.Color(z0).lerp(new THREE.Color(z1), f), new THREE.Color(h0).lerp(new THREE.Color(h1), f)];
    }
  }
  return [new THREE.Color(SKY_KEYS.at(-1)[1]), new THREE.Color(SKY_KEYS.at(-1)[2])];
}

// ── Suelo translúcido + horizonte ──
const ground = new THREE.Mesh(
  new THREE.SphereGeometry(R.ground, 48, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
  new THREE.MeshBasicMaterial({ color: 0x080705, transparent: true, opacity: 0.8, side: THREE.BackSide, depthWrite: false, depthTest: false }),
);
ground.renderOrder = 50;
horizonGroup.add(ground);
{
  const pts = [];
  for (let a = 0; a <= 360; a += 2) pts.push(altAzVec(a, 0, R.ground - 5));
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.55, depthTest: false }));
  line.renderOrder = 61;
  horizonGroup.add(line);
}
const gridGroup = new THREE.Group();
horizonGroup.add(gridGroup);
{
  const pts = [];
  for (let az = 0; az < 360; az += 30) for (let alt = 0; alt < 88; alt += 2) pts.push(altAzVec(az, alt, R.ground - 8), altAzVec(az, alt + 2, R.ground - 8));
  for (const alt of [30, 60]) for (let az = 0; az < 360; az += 2) pts.push(altAzVec(az, alt, R.ground - 8), altAzVec(az + 2, alt, R.ground - 8));
  const grid = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.16, depthTest: false }));
  grid.renderOrder = 45;
  gridGroup.add(grid);
}

// ───────────── Sprites con tamaño constante en pantalla ─────────────
const screenSprites = new Set(); // {sprite, px, aspect}
function updateScreenSprites() {
  const unit = 2 * Math.tan(camera.fov * D2R / 2) / innerHeight;
  for (const s of screenSprites) s.sprite.scale.set(s.px * unit * s.aspect, s.px * unit, 1);
}
function screenSprite(material, px, aspect = 1) {
  const sprite = new THREE.Sprite(material);
  const rec = { sprite, px, aspect };
  screenSprites.add(rec);
  sprite.userData.rec = rec;
  return sprite;
}
const textLabels = [];
function makeLabel(text, { color = '#e0f2fe', px = 17, weight = 600, spacing = 0, upper = false, below = true, order = 40 } = {}) {
  const fs = 44, c = document.createElement('canvas'), ctx = c.getContext('2d');
  const font = `${weight} ${fs}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.font = font;
  if (spacing) ctx.letterSpacing = `${spacing}px`;
  const label = upper ? text.toUpperCase() : text;
  const w = Math.ceil(ctx.measureText(label).width) + 24, h = Math.round(fs * 1.45);
  c.width = w; c.height = h;
  ctx.font = font;
  if (spacing) ctx.letterSpacing = `${spacing}px`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.95)'; ctx.shadowBlur = 10;
  ctx.fillStyle = color;
  ctx.fillText(label, w / 2, h / 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, sizeAttenuation: false });
  const sp = screenSprite(mat, px, w / h);
  if (below) sp.center.set(0.5, 1.25);
  sp.renderOrder = order;
  textLabels.push(sp);
  return sp;
}
function disposeLabels() {
  for (const sp of textLabels) {
    sp.parent?.remove(sp);
    sp.material.map.dispose();
    sp.material.dispose();
    screenSprites.delete(sp.userData.rec);
  }
  textLabels.length = 0;
}
function radialTexture(stops, size = 128) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d'), g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}
const glowTex = radialTexture([[0, 'rgba(255,255,255,1)'], [0.12, 'rgba(255,255,255,0.75)'], [0.35, 'rgba(255,255,255,0.18)'], [1, 'rgba(255,255,255,0)']]);
const ringTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(64, 64, 52, 0, Math.PI * 2); ctx.stroke();
  return new THREE.CanvasTexture(c);
})();

// ───────────── Estrellas reales ─────────────
let DATA = null;
const starsGroup = new THREE.Group(), linesGroup = new THREE.Group(), artGroup = new THREE.Group();
const conNameGroup = new THREE.Group(), starNameGroup = new THREE.Group(), dsoGroup = new THREE.Group(), eclipticGroup = new THREE.Group();
const bodiesGroup = new THREE.Group();
skyGroup.add(starsGroup, linesGroup, artGroup, conNameGroup, starNameGroup, dsoGroup, eclipticGroup, bodiesGroup);

const starUniforms = { uScale: { value: 1 }, uLimit: { value: 5 }, uFade: { value: 1 }, uPx: { value: renderer.getPixelRatio() } };
function bvToRgb(bv) {
  const K = [[-0.4, [0.62, 0.72, 1]], [0, [0.82, 0.87, 1]], [0.4, [1, 0.98, 0.95]], [0.8, [1, 0.92, 0.78]], [1.2, [1, 0.83, 0.62]], [1.6, [1, 0.74, 0.48]], [2.0, [1, 0.66, 0.4]]];
  const t = THREE.MathUtils.clamp(bv, -0.4, 2);
  for (let i = 0; i < K.length - 1; i++) if (t <= K[i + 1][0]) {
    const f = (t - K[i][0]) / (K[i + 1][0] - K[i][0]);
    return K[i][1].map((v, j) => v + (K[i + 1][1][j] - v) * f);
  }
  return K.at(-1)[1];
}
function buildStars() {
  const n = DATA.stars.length, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), mag = new Float32Array(n);
  DATA.starVec = [];
  DATA.stars.forEach(([ra, dec, m, bv], i) => {
    const v = eqVec(ra, dec);
    DATA.starVec.push(v);
    pos.set([v.x * R.stars, v.y * R.stars, v.z * R.stars], i * 3);
    col.set(bvToRgb(bv), i * 3);
    mag[i] = m;
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('mag', new THREE.BufferAttribute(mag, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: starUniforms, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float mag; attribute vec3 color; uniform float uScale, uLimit, uFade, uPx; varying vec3 vColor; varying float vAlpha;
      void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        float s = (2.6 + 9.0 * pow(0.66, mag + 1.5)) * uScale;
        vAlpha = clamp((uLimit - mag) / 1.2, 0.0, 1.0) * clamp(1.25 - (mag - 1.0) * 0.1, 0.45, 1.0) * uFade;
        gl_PointSize = s * uPx; vColor = color; }`,
    fragmentShader: `varying vec3 vColor; varying float vAlpha;
      void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; float a = (exp(-d * d * 7.0) + 0.35 * smoothstep(1.0, 0.0, d) * exp(-d * 3.0)) * vAlpha;
        if (a < 0.01) discard; gl_FragColor = vec4(vColor * (0.85 + 0.6 * exp(-d * d * 30.0)), a); }`,
  });
  const pts = new THREE.Points(geo, mat);
  pts.renderOrder = 5;
  starsGroup.add(pts);
}

// ───────────── Constelaciones: líneas IAU + ilustraciones de Stellarium ─────────────
const lineMat = new THREE.LineBasicMaterial({ color: 0x6fb6e8, transparent: true, opacity: 0.32, depthTest: false });
const hiLineMat = new THREE.LineBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.85, depthTest: false });
let hiLines = null;
function conSegments(con, r) {
  const pts = [];
  con.l.forEach(poly => { for (let i = 0; i < poly.length - 1; i++) pts.push(DATA.starVec[poly[i]].clone().multiplyScalar(r), DATA.starVec[poly[i + 1]].clone().multiplyScalar(r)); });
  return pts;
}
function buildConstellations() {
  const all = [];
  DATA.cons.forEach(con => {
    all.push(...conSegments(con, R.lines));
    const set = new Set(con.l.flat());
    const c = new THREE.Vector3();
    set.forEach(i => c.add(DATA.starVec[i]));
    con.center = c.normalize();
    if (con.art) buildArt(con);
  });
  const lines = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(all), lineMat);
  lines.renderOrder = 8;
  linesGroup.add(lines);
  hiLines = new THREE.LineSegments(new THREE.BufferGeometry(), hiLineMat);
  hiLines.renderOrder = 9;
  linesGroup.add(hiLines);
}
// Proyección gnomónica + transformación afín desde 3 estrellas ancla (píxel → cielo)
function buildArt(con) {
  const { w, h, a: anchors } = con.art;
  const vs = anchors.map(a => DATA.starVec[a[2]]);
  const c = vs[0].clone().add(vs[1]).add(vs[2]).normalize();
  let e = new THREE.Vector3(0, 1, 0).cross(c);
  if (e.lengthSq() < 1e-6) e = new THREE.Vector3(1, 0, 0);
  e.normalize();
  const n = c.clone().cross(e).normalize();
  const tan = v => { const p = v.clone().divideScalar(v.dot(c)); return [p.dot(e), p.dot(n)]; };
  const P = new THREE.Matrix3().set(anchors[0][0], anchors[0][1], 1, anchors[1][0], anchors[1][1], 1, anchors[2][0], anchors[2][1], 1).invert();
  const tx = vs.map(tan);
  const solve = k => new THREE.Vector3(tx[0][k], tx[1][k], tx[2][k]).applyMatrix3(P);
  const mx = solve(0), my = solve(1);
  const SEG = 12, positions = [], uvs = [], index = [];
  for (let j = 0; j <= SEG; j++) for (let i = 0; i <= SEG; i++) {
    const px = (i / SEG) * w, py = (j / SEG) * h;
    const X = mx.x * px + mx.y * py + mx.z, Y = my.x * px + my.y * py + my.z;
    const v = c.clone().add(e.clone().multiplyScalar(X)).add(n.clone().multiplyScalar(Y)).normalize().multiplyScalar(R.art);
    positions.push(v.x, v.y, v.z);
    uvs.push(i / SEG, 1 - j / SEG);
  }
  for (let j = 0; j < SEG; j++) for (let i = 0; i < SEG; i++) {
    const a = j * (SEG + 1) + i, b = a + 1, d = a + SEG + 1, f = d + 1;
    index.push(a, d, b, b, d, f);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(index);
  const mat = new THREE.MeshBasicMaterial({
    map: loadTex(`img/constelaciones/${con.art.f}`), color: 0x9cc8ff, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 3;
  con.artMat = mat;
  artGroup.add(mesh);
}

// ── Eclíptica (exacta en J2000) ──
{
  const eps = 23.4393 * D2R, pts = [];
  for (let l = 0; l <= 360; l += 2) {
    const L = l * D2R;
    pts.push(astroToThreeEq({ x: Math.cos(L), y: Math.sin(L) * Math.cos(eps), z: Math.sin(L) * Math.sin(eps) }).multiplyScalar(R.lines));
  }
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: 0xfacc15, dashSize: 10, gapSize: 8, transparent: true, opacity: 0.45, depthTest: false }));
  line.computeLineDistances();
  eclipticGroup.add(line);
}

// ───────────── Sol, Luna y planetas con texturas fotográficas ─────────────
const sunLight = new THREE.DirectionalLight(0xffffff, 3.2);
skyGroup.add(sunLight, sunLight.target);
scene.add(new THREE.AmbientLight(0xffffff, 0.05));

function orientToObserver(obj, posDir, poleRa, poleDec) {
  const z = posDir.clone().negate().normalize();
  const pole = eqVec(poleRa / 15, poleDec);
  const sinB = pole.dot(z); // inclinación del polo hacia el observador
  const y = pole.sub(z.clone().multiplyScalar(sinB)).normalize();
  const x = y.clone().cross(z);
  obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  return sinB;
}
// Iluminación por cuerpo: la luz llega desde la dirección planeta→Sol (no Tierra→Sol), así la fase es real.
function planetMaterial(map) {
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: map }, uLight: { value: new THREE.Vector3(1, 0, 0) } },
    vertexShader: `varying vec2 vUv; varying vec3 vN;
      void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform sampler2D map; uniform vec3 uLight; varying vec2 vUv; varying vec3 vN;
      void main(){ vec3 t = texture2D(map, vUv).rgb; float d = dot(normalize(vN), uLight);
        float l = smoothstep(-0.04, 0.3, d) * 0.9 + max(d, 0.0) * 0.2 + 0.015;
        gl_FragColor = vec4(t * l, 1.0);
        #include <colorspace_fragment>
      }`,
  });
}
function buildBodies() {
  BODIES.forEach(b => {
    const holder = new THREE.Group();            // posición + orientación
    const scaled = new THREE.Group();            // tamaño según zoom
    const frame = new THREE.Group();             // eje de rotación real del cuerpo
    holder.add(scaled);
    scaled.add(frame);
    const radius = R.body * Math.tan(b.deg * D2R);
    const map = loadTex(`img/planets/${b.tex}.jpg`);
    const mat = b.id === 'sun' ? new THREE.MeshBasicMaterial({ map }) : planetMaterial(map);
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 32), mat);
    sphere.rotation.y = -Math.PI / 2; // longitud 0 hacia el observador
    frame.add(sphere);
    if (b.id === 'sun') {
      const corona = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffd27a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      corona.scale.setScalar(radius * 7);
      scaled.add(corona);
    }
    if (b.ring) {
      const inner = radius * 1.24, outer = radius * 2.27;
      const g = new THREE.RingGeometry(inner, outer, 128, 1);
      const p = g.attributes.position, uv = g.attributes.uv;
      for (let i = 0; i < p.count; i++) uv.setXY(i, (Math.hypot(p.getX(i), p.getY(i)) - inner) / (outer - inner), 0.5);
      const ring = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: loadTex('img/planets/saturno_anillos.png'), color: 0xffffff, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; // plano ecuatorial del planeta
      frame.add(ring);
    }
    const glow = screenSprite(new THREE.SpriteMaterial({ map: glowTex, color: b.glow, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, sizeAttenuation: false }), b.id === 'sun' ? 60 : 26);
    glow.renderOrder = 20;
    holder.add(glow);
    bodiesGroup.add(holder);
    Object.assign(b, { holder, scaled, frame, glow, radius, sphere });
  });
}
let bodiesTime = 0;
function updateBodies(date, force = false) {
  if (!force && Math.abs(date - bodiesTime) < 20000) return;
  bodiesTime = +date;
  const sunVec = A.Equator('Sun', date, observer, false, true).vec;
  BODIES.forEach(b => {
    const eq = A.Equator(b.body, date, observer, false, true);
    b.lightEq = astroToThreeEq({ x: sunVec.x - eq.vec.x, y: sunVec.y - eq.vec.y, z: sunVec.z - eq.vec.z }).normalize();
    const dir = astroToThreeEq(eq.vec).normalize();
    b.dir = dir; b.dist = eq.dist; b.ra = eq.ra; b.dec = eq.dec;
    b.holder.position.copy(dir).multiplyScalar(R.body);
    const sinB = orientToObserver(b.holder, dir, b.pole[0], b.pole[1]);
    b.frame.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, Math.sqrt(1 - sinB * sinB), sinB));
    if (b.id === 'sun') sunLight.position.copy(dir).multiplyScalar(100);
  });
}

// ───────────── Cielo profundo ─────────────
function buildDSO() {
  DSO.forEach(o => {
    o.vec = eqVec(o.ra, o.dec);
    const holder = new THREE.Group();
    holder.position.copy(o.vec).multiplyScalar(R.dso);
    const mark = screenSprite(new THREE.SpriteMaterial({ map: ringTex, color: o.eye ? 0xf0abfc : 0xa78bfa, transparent: true, opacity: 0.75, depthTest: false, sizeAttenuation: false }), 18);
    mark.renderOrder = 12;
    holder.add(mark);
    dsoGroup.add(holder);
    o.holder = holder;
  });
}

// ───────────── ISS: órbita real a partir de TLE ─────────────
const ISS = { satrec: null, status: 'loading', group: new THREE.Group(), passes: null, passesFrom: 0 };
scene.add(ISS.group);
ISS.group.visible = false;
function buildIssModel() {
  const model = new THREE.Group();
  const panelTex = (() => {
    const c = document.createElement('canvas'); c.width = 64; c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#5a3a18'; ctx.fillRect(0, 0, 64, 256);
    for (let y = 0; y < 256; y += 8) for (let x = 0; x < 64; x += 8) { ctx.fillStyle = `rgba(${150 + Math.random() * 40},${95 + Math.random() * 30},40,0.9)`; ctx.fillRect(x + 1, y + 1, 6, 6); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const metal = new THREE.MeshLambertMaterial({ color: 0xd4d4d8, emissive: 0x3a3a3e });
  const white = new THREE.MeshLambertMaterial({ color: 0xf5f5f4, emissive: 0x3d3d3b, side: THREE.DoubleSide });
  const panel = new THREE.MeshLambertMaterial({ map: panelTex, emissive: 0x2a1c0c, side: THREE.DoubleSide });
  model.add(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.035, 0.035), metal)); // armazón principal
  const mod = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.5, 16), white); // módulos presurizados
  mod.rotation.x = Math.PI / 2; model.add(mod);
  const mod2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.22, 16), white);
  mod2.rotation.z = Math.PI / 2; mod2.position.z = 0.12; model.add(mod2);
  for (const x of [-0.46, -0.37, 0.37, 0.46]) for (const s of [-1, 1]) { // 8 alas solares
    const wing = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.34), panel);
    wing.position.set(x, s * 0.19, 0); model.add(wing);
  }
  for (const x of [-0.16, 0.16]) { // radiadores
    const rad = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.2), white);
    rad.position.set(x, 0, -0.12); rad.rotation.x = Math.PI / 2; model.add(rad);
  }
  return model;
}
ISS.model = buildIssModel();
ISS.scaled = new THREE.Group();
ISS.scaled.add(ISS.model);
ISS.group.add(ISS.scaled);
ISS.glow = screenSprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthTest: false, sizeAttenuation: false }), 22);
ISS.glow.renderOrder = 21;
ISS.group.add(ISS.glow);

async function fetchText(url, ms = 8000) {
  const ctl = new AbortController(), id = setTimeout(() => ctl.abort(), ms);
  try { const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw new Error(r.status); return await r.text(); } finally { clearTimeout(id); }
}
async function loadISS() {
  const fresh = S.tleCache && Date.now() - S.tleCache.at < 6 * 3600e3;
  let lines = fresh ? S.tleCache.lines : null;
  const sources = [
    ['https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE', t => t.trim().split(/\r?\n/).slice(1, 3).map(s => s.trim())],
    ['https://api.wheretheiss.at/v1/satellites/25544/tles', t => { const j = JSON.parse(t); return [j.line1, j.line2]; }],
  ];
  for (const [url, parse] of sources) {
    if (lines) break;
    try { const l = parse(await fetchText(url)); if (l[0]?.startsWith('1 ') && l[1]?.startsWith('2 ')) { lines = l; S.tleCache = { at: Date.now(), lines }; persist(); } } catch { /* siguiente fuente */ }
  }
  if (!lines && S.tleCache) lines = S.tleCache.lines; // mejor una órbita de hace días que nada
  if (!lines) { ISS.status = 'offline'; return; }
  ISS.satrec = SAT.twoline2satrec(lines[0], lines[1]);
  ISS.status = 'ok';
}
function issAt(date) {
  if (!ISS.satrec) return null;
  const pv = SAT.propagate(ISS.satrec, date);
  if (!pv.position) return null;
  const gmst = SAT.gstime(date);
  const look = SAT.ecfToLookAngles({ longitude: S.place.lon * D2R, latitude: S.place.lat * D2R, height: 0 }, SAT.eciToEcf(pv.position, gmst));
  const geo = SAT.eciToGeodetic(pv.position, gmst);
  const sun = A.GeoVector('Sun', date, true), sl = Math.hypot(sun.x, sun.y, sun.z);
  const s = { x: sun.x / sl, y: sun.y / sl, z: sun.z / sl }, r = pv.position;
  const d = r.x * s.x + r.y * s.y + r.z * s.z;
  const perp = Math.hypot(r.x - d * s.x, r.y - d * s.y, r.z - d * s.z);
  return { az: look.azimuth * R2D, alt: look.elevation * R2D, range: look.rangeSat, height: geo.height, sunlit: d > 0 || perp > 6371, speed: Math.hypot(pv.velocity.x, pv.velocity.y, pv.velocity.z) * 3600 };
}
function sunAltAt(date) {
  const eq = A.Equator('Sun', date, observer, true, true);
  return A.Horizon(date, observer, eq.ra, eq.dec, 'normal').altitude;
}
function computeIssPasses(from, hours = 48) {
  const out = [];
  let cur = null;
  for (let t = +from; t < +from + hours * 3600e3; t += 20e3) {
    const p = issAt(new Date(t));
    if (!p) break;
    if (p.alt > 10) {
      if (!cur) cur = { start: new Date(t), maxAlt: p.alt, maxTime: new Date(t), maxAz: p.az };
      if (p.alt > cur.maxAlt) Object.assign(cur, { maxAlt: p.alt, maxTime: new Date(t), maxAz: p.az });
    } else if (cur) {
      cur.end = new Date(t);
      const atMax = issAt(cur.maxTime);
      cur.visible = atMax.sunlit && sunAltAt(cur.maxTime) < -6;
      out.push(cur); cur = null;
    }
  }
  return out;
}
function issPasses() {
  const now = simDate();
  if (!ISS.passes || Math.abs(now - ISS.passesFrom) > 10 * 60e3) { ISS.passes = computeIssPasses(now); ISS.passesFrom = +now; }
  return ISS.passes.filter(p => p.end > now);
}
let issNow = null;
function updateISS(date) {
  issNow = issAt(date);
  ISS.group.visible = !!issNow && S.layers.iss;
  if (!issNow) return;
  ISS.group.position.copy(altAzVec(issNow.az, issNow.alt, R.iss));
  // Los paneles solares de la ISS siguen al Sol: orientamos el modelo hacia él
  ISS.group.lookAt(ISS.group.position.clone().add(BODIES[0].holder.getWorldPosition(new THREE.Vector3()).normalize()));
  ISS.glow.material.opacity = (issNow.sunlit ? 0.9 : 0.25) * THREE.MathUtils.clamp((S.fov - 0.8) / 3, 0, 1); // con mucho zoom se ve el modelo
  ISS.glow.material.color.set(issNow.sunlit ? 0xffffff : 0x64748b);
}

// ───────────── Estrellas fugaces de lluvias reales ─────────────
function showerStatus(date) {
  const res = [];
  for (const sh of SHOWERS) {
    for (const y of [date.getFullYear() - 1, date.getFullYear(), date.getFullYear() + 1]) {
      const peak = new Date(Date.UTC(y, sh.peak[0] - 1, sh.peak[1], 12));
      const days = (date - peak) / 864e5;
      res.push({ sh, peak, days, active: days >= -sh.before && days <= sh.after, zhrNow: sh.zhr * Math.pow(10, -sh.b * Math.abs(days)) });
    }
  }
  const active = res.filter(r => r.active).sort((a, b) => b.zhrNow - a.zhrNow)[0] || null;
  const next = res.filter(r => r.days < 0).sort((a, b) => b.days - a.days)[0];
  return { active, next };
}
const meteorGroup = new THREE.Group();
scene.add(meteorGroup);
const meteors = [];
function spawnMeteor(radiantWorld) {
  let rad = radiantWorld;
  if (!rad) rad = altAzVec(Math.random() * 360, 10 + Math.random() * 80); // esporádico
  const axis = new THREE.Vector3().randomDirection().cross(rad).normalize();
  const p0 = rad.clone().applyAxisAngle(axis, (12 + Math.random() * 45) * D2R);
  if (p0.y < 0.12) return;
  const moveAxis = rad.clone().cross(p0).normalize();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(6), 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute([1, 1, 1, 0, 0, 0], 3));
  const mat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthTest: false });
  const line = new THREE.Line(geo, mat);
  line.renderOrder = 30;
  meteorGroup.add(line);
  meteors.push({ line, p0, moveAxis, t: 0, life: 0.45 + Math.random() * 0.5, speed: (18 + Math.random() * 22) * D2R, len: (5 + Math.random() * 9) * D2R });
}
function updateMeteors(dt, starFade, date) {
  if (S.layers.meteors && (starFade > 0.3 || S.camera)) {
    const { active } = showerStatus(date);
    if (Math.random() < 0.03 * dt * 1.5) spawnMeteor(null);
    if (active && active.zhrNow > 2) {
      const rad = eqVec(active.sh.ra, active.sh.dec).applyMatrix4(skyGroup.matrix).normalize();
      if (rad.y > -0.1 && Math.random() < (active.zhrNow / 100) * 0.6 * dt) spawnMeteor(rad);
    }
  }
  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i];
    m.t += dt;
    const head = m.p0.clone().applyAxisAngle(m.moveAxis, m.speed * m.t);
    const tail = m.p0.clone().applyAxisAngle(m.moveAxis, Math.max(0, m.speed * m.t - m.len));
    const p = m.line.geometry.attributes.position;
    p.setXYZ(0, head.x * R.meteor, head.y * R.meteor, head.z * R.meteor);
    p.setXYZ(1, tail.x * R.meteor, tail.y * R.meteor, tail.z * R.meteor);
    p.needsUpdate = true;
    m.line.material.opacity = Math.sin(Math.PI * Math.min(1, m.t / m.life));
    if (m.t >= m.life || head.y < 0) {
      meteorGroup.remove(m.line); m.line.geometry.dispose(); m.line.material.dispose(); meteors.splice(i, 1);
    }
  }
}

// ───────────── Etiquetas (se regeneran al cambiar de idioma) ─────────────
const bodyName = b => (S.lang === 'en' ? b.en : b.es);
function buildLabels() {
  disposeLabels();
  BODIES.forEach(b => { b.label = makeLabel(bodyName(b), { color: b.id === 'sun' || b.id === 'moon' ? '#fef3c7' : '#fde68a', px: 18, weight: 700 }); b.holder.add(b.label); });
  DSO.forEach(o => o.holder.add(makeLabel(S.lang === 'en' ? o.en : o.es, { color: o.eye ? '#f5d0fe' : '#c4b5fd', px: 14, weight: 500 })));
  ISS.label = makeLabel('ISS', { color: '#ffffff', px: 17, weight: 700 });
  ISS.group.add(ISS.label);
  DATA.cons.forEach(con => {
    const lbl = makeLabel(S.lang === 'en' ? con.en : con.es, { color: '#9cc8ef', px: 14, weight: 600, spacing: 3, upper: true, below: false, order: 35 });
    lbl.position.copy(con.center).multiplyScalar(R.lines);
    con.label = lbl;
    conNameGroup.add(lbl);
  });
  DATA.names.forEach(([idx, es, en]) => {
    const lbl = makeLabel(S.lang === 'en' ? en : es, { color: '#e2e8f0', px: 13, weight: 500, order: 36 });
    lbl.position.copy(DATA.starVec[idx]).multiplyScalar(R.stars);
    lbl.userData.mag = DATA.stars[idx][2];
    starNameGroup.add(lbl);
  });
  const t = T();
  [['N', 0], ['NE', 45], ['E', 90], ['SE', 135], ['S', 180], ['SW', 225], ['W', 270], ['NW', 315]].forEach(([k, az]) => {
    const major = k.length === 1;
    const lbl = makeLabel(t[k], { color: major ? '#38bdf8' : '#7dd3fc', px: major ? 22 : 15, weight: 800, below: false, order: 62 });
    lbl.position.copy(altAzVec(az, 2.2, R.ground - 10));
    horizonGroup.add(lbl);
  });
  updateScreenSprites();
}

// ───────────── Catálogo unificado (búsqueda, lista, selección) ─────────────
let CATALOG = [];
function buildCatalog() {
  const t = T();
  CATALOG = [];
  BODIES.forEach(b => CATALOG.push({
    id: b.id, kind: 'body', ref: b, names: [b.es, b.en, b.id],
    name: () => bodyName(b), sub: () => b.id === 'sun' ? T().ourStar : b.id === 'moon' ? T().satellite : b.dwarf ? T().dwarf : T().planet,
    world: () => b.holder.getWorldPosition(new THREE.Vector3()), layer: 'planets',
  }));
  CATALOG.push({ id: 'iss', kind: 'iss', names: ['ISS', 'Estación Espacial Internacional', 'International Space Station'], name: () => 'ISS', sub: () => T().station,
    world: () => (issNow ? altAzVec(issNow.az, issNow.alt, R.iss) : null), layer: 'iss' });
  DSO.forEach(o => CATALOG.push({ id: o.id, kind: 'dso', ref: o, names: [o.es, o.en, o.id], name: () => (S.lang === 'en' ? o.en : o.es),
    sub: () => o.kind[S.lang === 'en' ? 1 : 0] + (o.eye ? '' : ` · ${T().notNaked}`), world: () => o.holder.getWorldPosition(new THREE.Vector3()), layer: 'deep' }));
  DATA.names.forEach(([idx, es, en]) => {
    const con = DATA.cons.find(c => c.l.some(p => p.includes(idx)));
    CATALOG.push({ id: 's:' + en, kind: 'star', idx, names: [es, en], name: () => (S.lang === 'en' ? en : es),
      sub: () => `${T().star}${con ? ` · ${T().inConst} ${S.lang === 'en' ? con.en : con.es}` : ''}`,
      world: () => DATA.starVec[idx].clone().multiplyScalar(R.stars).applyMatrix4(skyGroup.matrix) });
  });
  DATA.cons.forEach(con => CATALOG.push({ id: 'c:' + con.id, kind: 'con', ref: con, names: [con.es, con.en, con.id], name: () => (S.lang === 'en' ? con.en : con.es),
    sub: () => T().constellation, world: () => con.center.clone().multiplyScalar(R.lines).applyMatrix4(skyGroup.matrix) }));
}
const entryAltAz = e => { const w = e.world(); return w ? vecToAltAz(w) : null; };

// ───────────── Formatos ─────────────
const tzOpt = () => (S.place.tz ? { timeZone: S.place.tz } : {});
function fmtTime(d, withDay = true) {
  if (!d) return '—';
  const opts = { hour: '2-digit', minute: '2-digit', ...tzOpt() };
  const now = simDate(), dayKey = x => x.toLocaleDateString('en-CA', tzOpt());
  if (!withDay) return d.toLocaleTimeString(S.lang, opts);
  const diff = Math.round((Date.parse(dayKey(d)) - Date.parse(dayKey(now))) / 864e5);
  const day = diff === 0 ? T().today : diff === 1 ? T().tomorrow : d.toLocaleDateString(S.lang, { weekday: 'short', day: 'numeric', ...tzOpt() });
  return `${day} ${d.toLocaleTimeString(S.lang, opts)}`;
}
const fmtNum = (n, d = 0) => n.toLocaleString(S.lang, { maximumFractionDigits: d, minimumFractionDigits: d });
const azName = az => { const k = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(az / 45) % 8]; return T()[k]; };
function fmtDist(au) {
  const km = au * 149597870.7;
  if (km < 2e6) return `${fmtNum(km)} km`;
  if (km < 1e9) return `${fmtNum(km / 1e6, 1)} M km`;
  return `${fmtNum(au, 2)} UA`;
}
const fmtLy = ly => ly >= 1e9 ? `${fmtNum(ly / 1e9, 1)} ${S.lang === 'en' ? 'billion ly' : 'mil M a.l.'}` : ly >= 1e6 ? `${fmtNum(ly / 1e6, 1)} M ${S.lang === 'en' ? 'ly' : 'a.l.'}` : `${fmtNum(ly)} ${S.lang === 'en' ? 'ly' : 'a.l.'}`;

function riseSet(bodyOrStar) {
  const start = new Date(+simDate() - 12 * 3600e3);
  const out = {};
  try {
    const rise = A.SearchRiseSet(bodyOrStar, observer, +1, simDate(), 1.2);
    const set = A.SearchRiseSet(bodyOrStar, observer, -1, simDate(), 1.2);
    out.rise = rise?.date; out.set = set?.date;
    const tr = A.SearchHourAngle(bodyOrStar, observer, 0, start);
    out.transit = tr.time.date > simDate() ? tr.time.date : A.SearchHourAngle(bodyOrStar, observer, 0, simDate()).time.date;
    out.transitAlt = tr.hor.altitude;
  } catch { /* sin datos */ }
  return out;
}
function riseSetStats(rs, alt) {
  const t = T();
  if (!rs.rise && !rs.set) return [[t.rise, alt > 0 ? t.circumpolar : t.neverRises]];
  return [[t.rise, fmtTime(rs.rise)], [t.set, fmtTime(rs.set)], [t.transit, fmtTime(rs.transit)]];
}
function defineStar(raH, dec, ly = 1000) { A.DefineStar(A.Body.Star1, raH, dec, ly); return A.Body.Star1; }

// ───────────── Ficha de información ─────────────
const $ = id => document.getElementById(id);
function videoUrl(entry) {
  const q = entry.names[0].replace(/\s*\(.*\)/, '');
  return VIDEOS[entry.id] || `${CHANNEL_URL}/search?query=${encodeURIComponent(q)}`;
}
function infoStats(entry) {
  const t = T(), date = simDate(), aa = entryAltAz(entry);
  const stats = aa ? [[t.alt, `${aa.alt >= 0 ? '+' : ''}${fmtNum(aa.alt, 1)}°`], [t.az, `${fmtNum(aa.az)}° ${azName(aa.az)}`]] : [];
  let fact = '';
  if (entry.kind === 'body') {
    const b = entry.ref;
    fact = b.fact[S.lang === 'en' ? 1 : 0];
    try { stats.push([t.mag, fmtNum(A.Illumination(b.body, date).mag, 1)]); } catch { /* Sol */ }
    if (b.id !== 'sun' && b.id !== 'moon') { try { stats.push([t.phase, `${fmtNum(A.Illumination(b.body, date).phase_fraction * 100)} %`]); } catch { } }
    if (b.id === 'moon') stats.push([t.phase, `${fmtNum(A.Illumination('Moon', date).phase_fraction * 100)} %`]);
    stats.push([t.dist, fmtDist(b.dist)]);
    if (b.id !== 'moon') stats.push([t.lightTime, `${fmtNum(b.dist * 499.005 / 60, 1)} ${t.min}`]);
    stats.push(...riseSetStats(riseSet(b.body), aa.alt));
  } else if (entry.kind === 'iss') {
    fact = S.lang === 'en'
      ? 'It orbits ~400 km up at about 28,000 km/h, circling Earth every ~92 minutes. After the Moon and Venus it is the brightest object in the night sky.'
      : 'Orbita a unos 400 km de altura a ~28.000 km/h y da una vuelta a la Tierra cada ~92 minutos. Tras la Luna y Venus, es el objeto más brillante del cielo nocturno.';
    if (ISS.status !== 'ok') return { stats: [[t.nextPass, ISS.status === 'loading' ? t.issLoading : t.issOffline]], fact };
    if (issNow) stats.push([t.height, `${fmtNum(issNow.height)} km`], [t.speed, `${fmtNum(issNow.speed)} km/h`], [t.dist, `${fmtNum(issNow.range)} km`], ['☀️', issNow.sunlit ? t.sunlit : t.shadow]);
    const next = issPasses().find(p => p.visible);
    stats.push([t.nextPass, next ? `${fmtTime(next.start)} · ${fmtNum(next.maxAlt)}° ${azName(next.maxAz)}` : t.noPass]);
  } else if (entry.kind === 'dso') {
    const o = entry.ref;
    fact = o.fact[S.lang === 'en' ? 1 : 0];
    stats.push([t.dist, fmtLy(o.ly)], ...riseSetStats(riseSet(defineStar(o.ra, o.dec)), aa.alt));
  } else if (entry.kind === 'star') {
    const [ra, dec, mag] = DATA.stars[entry.idx];
    stats.push([t.mag, fmtNum(mag, 2)], ...riseSetStats(riseSet(defineStar(ra, dec)), aa.alt));
  } else if (entry.kind === 'con') {
    const c = entry.ref.center, ra = ((Math.atan2(c.x, c.z) * R2D + 360) % 360) / 15, dec = Math.asin(c.y) * R2D;
    stats.push(...riseSetStats(riseSet(defineStar(ra, dec)), aa.alt));
  }
  return { stats, fact };
}
function openInfo(entry) {
  S.selected = entry;
  closeModals();
  $('infoName').textContent = entry.name();
  $('infoType').textContent = entry.sub();
  refreshInfo();
  $('infoVideo').href = videoUrl(entry);
  $('infoCard').classList.add('open');
  updateViewOffset();
}
function refreshInfo() {
  if (!S.selected) return;
  const { stats, fact } = infoStats(S.selected);
  const grid = $('infoGrid');
  grid.replaceChildren(...stats.map(([k, v]) => {
    const d = document.createElement('div'); d.className = 'stat';
    const s = document.createElement('small'); s.textContent = k;
    const b = document.createElement('b'); b.textContent = v;
    d.append(s, b); return d;
  }));
  $('infoFact').textContent = fact;
  $('infoFact').style.display = fact ? '' : 'none';
}
function closeInfo() { S.selected = null; S.tracking = null; $('infoCard').classList.remove('open'); updateViewOffset(); }
// En móvil la ficha ocupa la mitad inferior: subimos el centro de la vista para que el objeto quede visible.
function updateViewOffset() {
  const shift = S.selected && innerWidth < 900 ? Math.round(innerHeight * 0.22) : 0;
  if (shift) camera.setViewOffset(innerWidth, innerHeight, 0, shift, innerWidth, innerHeight); else camera.clearViewOffset();
  document.documentElement.style.setProperty('--cy', `calc(50% - ${shift}px)`);
}
function pointTo(entry) {
  const aa = entryAltAz(entry);
  if (!aa) return;
  if (S.sensor) { toast(`${azName(aa.az)} · Az ${fmtNum(aa.az)}° · Alt ${fmtNum(aa.alt)}°`); return; }
  S.targetAz = aa.az; S.targetAlt = THREE.MathUtils.clamp(aa.alt, -85, 85);
  S.tracking = entry.kind === 'iss' ? entry : null; // la ISS se mueve ~1°/s: la seguimos
}
function shareUrl(entry) {
  const u = new URL(location.href.split('?')[0]);
  u.searchParams.set('lat', S.place.lat.toFixed(4)); u.searchParams.set('lon', S.place.lon.toFixed(4));
  u.searchParams.set('name', S.place.name);
  if (S.place.tz) u.searchParams.set('tz', S.place.tz);
  if (Math.abs(S.offset) > 60e3) u.searchParams.set('t', simDate().toISOString());
  if (entry) u.searchParams.set('obj', entry.id);
  u.searchParams.set('lang', S.lang);
  return u.toString();
}
async function share(entry) {
  const url = shareUrl(entry), title = entry ? `${entry.name()} · Planetario DarwinCaos` : 'Planetario DarwinCaos';
  try {
    if (navigator.share) { await navigator.share({ title, url }); return; }
    await navigator.clipboard.writeText(url); toast(T().linkCopied);
  } catch { /* cancelado */ }
}

// ───────────── Selección por toque ─────────────
const selMarker = screenSprite(new THREE.SpriteMaterial({ map: ringTex, color: 0x38bdf8, transparent: true, depthTest: false, sizeAttenuation: false }), 40);
selMarker.renderOrder = 70;
scene.add(selMarker);
function pick(x, y) {
  let best = null, bestD = Infinity;
  const v = new THREE.Vector3();
  for (const e of CATALOG) {
    if (e.layer && !S.layers[e.layer]) continue;
    const w = e.world();
    if (!w) continue;
    v.copy(w).project(camera);
    if (v.z > 1) continue;
    const sx = (v.x + 1) / 2 * innerWidth, sy = (1 - v.y) / 2 * innerHeight;
    let d = Math.hypot(sx - x, sy - y);
    const limit = e.kind === 'con' ? 70 : 34;
    if (d > limit) continue;
    if (e.kind === 'con') d += 40; // los objetos concretos tienen prioridad
    if (d < bestD) { bestD = d; best = e; }
  }
  if (best) openInfo(best); else closeInfo();
}

// ───────────── Cámara: arrastre, zoom y sensores ─────────────
const ptrs = new Map();
let gesture = null;
canvas.addEventListener('pointerdown', e => {
  canvas.setPointerCapture(e.pointerId);
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 1) gesture = { kind: 'drag', x: e.clientX, y: e.clientY, az: S.viewAz, alt: S.viewAlt, t: performance.now(), moved: false };
  else if (ptrs.size === 2) {
    const [a, b] = [...ptrs.values()];
    gesture = { kind: 'pinch', d: Math.hypot(a.x - b.x, a.y - b.y), fov: S.fov, moved: true };
  }
  S.targetAz = S.targetAlt = null;
  S.tracking = null;
});
canvas.addEventListener('pointermove', e => {
  if (!ptrs.has(e.pointerId) || !gesture) return;
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (gesture.kind === 'pinch' && ptrs.size === 2) {
    const [a, b] = [...ptrs.values()];
    setFov(gesture.fov * gesture.d / Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)));
  } else if (gesture.kind === 'drag') {
    const dx = e.clientX - gesture.x, dy = e.clientY - gesture.y;
    if (Math.hypot(dx, dy) > 6) gesture.moved = true;
    if (!S.sensor && gesture.moved) {
      const k = S.fov / innerHeight;
      S.viewAz = (gesture.az - dx * k + 360) % 360;
      S.viewAlt = THREE.MathUtils.clamp(gesture.alt + dy * k, -89, 89);
    }
  }
});
const endPtr = e => {
  if (!ptrs.has(e.pointerId)) return;
  ptrs.delete(e.pointerId);
  if (gesture?.kind === 'drag' && !gesture.moved && performance.now() - gesture.t < 400) pick(e.clientX, e.clientY);
  if (ptrs.size === 0) gesture = null;
};
canvas.addEventListener('pointerup', endPtr);
canvas.addEventListener('pointercancel', endPtr);
canvas.addEventListener('wheel', e => { e.preventDefault(); setFov(S.fov * Math.exp(e.deltaY * 0.0015)); }, { passive: false });

function setFov(f) {
  S.fov = THREE.MathUtils.clamp(f, 0.25, 90);
  camera.fov = S.fov;
  camera.updateProjectionMatrix();
  const z = 62 / S.fov;
  $('zoomBtn').textContent = `${z < 10 ? z.toFixed(1) : Math.round(z)}x`;
  updateScreenSprites();
}
$('zoomBtn').onclick = () => setFov(62);

// Orientación del dispositivo → cuaternión (brújula absoluta en Android, webkitCompassHeading en iOS)
const sensorQ = new THREE.Quaternion();
let sensorReady = false, compassOffset = null;
const qBack = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
const zee = new THREE.Vector3(0, 0, 1), euler = new THREE.Euler(), qScreen = new THREE.Quaternion();
function onOrientation(e) {
  if (e.alpha == null) return;
  let alpha = e.alpha;
  if (typeof e.webkitCompassHeading === 'number') {
    const off = (360 - e.webkitCompassHeading) - e.alpha;
    compassOffset = compassOffset == null ? off : compassOffset + (((off - compassOffset + 540) % 360) - 180) * 0.1;
    alpha = e.alpha + compassOffset;
  }
  const orient = (screen.orientation?.angle ?? window.orientation ?? 0) * D2R;
  euler.set(e.beta * D2R, alpha * D2R, -e.gamma * D2R, 'YXZ');
  sensorQ.setFromEuler(euler).multiply(qBack).multiply(qScreen.setFromAxisAngle(zee, -orient));
  sensorReady = true;
}
let sensorBound = false;
async function enableSensor() {
  if (typeof DeviceOrientationEvent === 'undefined') return false;
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    try { if ((await DeviceOrientationEvent.requestPermission()) !== 'granted') return false; } catch { return false; }
  }
  if (!sensorBound) {
    sensorBound = true;
    if ('ondeviceorientationabsolute' in window) addEventListener('deviceorientationabsolute', onOrientation);
    else addEventListener('deviceorientation', onOrientation);
  }
  return true;
}
let stream = null;
async function setSensor(on) {
  if (on && !(await enableSensor())) { toast(T().sensorFail); on = false; }
  if (!on && S.camera) await setCamera(false);
  S.sensor = on;
  if (!on) { const d = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion), aa = vecToAltAz(d); S.viewAz = aa.az; S.viewAlt = aa.alt; }
  $('btnSensor').classList.toggle('active', on);
  setTimeout(() => { if (S.sensor && !sensorReady) toast(T().sensorFail); }, 2500);
}
async function setCamera(on) {
  if (on) {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      $('cameraFeed').srcObject = stream;
      if (!S.sensor) await setSensor(true);
      setFov(62);
    } catch { toast(T().camFail); on = false; }
  } else if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
  S.camera = on;
  document.body.classList.toggle('camera', on);
  dome.visible = !on; ground.visible = !on;
  $('btnCamera').classList.toggle('active', on);
}
$('btnSensor').onclick = () => setSensor(!S.sensor);
$('btnCamera').onclick = () => setCamera(!S.camera);

// ───────────── Interfaz ─────────────
let toastTimer;
function toast(msg) { const el = $('toast'); el.textContent = msg; el.style.opacity = 1; clearTimeout(toastTimer); toastTimer = setTimeout(() => (el.style.opacity = 0), 2600); }
const MODALS = { modalPlace: 'placeBtn', modalTime: 'timeBtn', modalSky: 'dockSky', modalLayers: 'dockLayers', modalAbout: 'dockAbout' };
function closeModals() { Object.entries(MODALS).forEach(([m, b]) => { $(m).classList.remove('open'); $(b).classList.remove('active'); }); }
function toggleModal(id) {
  const open = $(id).classList.contains('open');
  closeModals();
  if (open) return;
  if (id !== 'modalSky') closeInfo();
  $(id).classList.add('open'); $(MODALS[id]).classList.add('active');
  if (id === 'modalSky') renderSkyList($('search').value);
  if (id === 'modalLayers') renderLayers();
  if (id === 'modalPlace') renderCities();
}
Object.entries(MODALS).forEach(([m, b]) => ($(b).onclick = () => toggleModal(m)));
document.querySelectorAll('.modal .close').forEach(b => (b.onclick = closeModals));
$('infoClose').onclick = closeInfo;
$('infoPoint').onclick = () => S.selected && pointTo(S.selected);
$('infoShare').onclick = () => share(S.selected);
$('subscribeBtn').href = `${CHANNEL_URL}?sub_confirmation=1`;

$('dockRed').onclick = () => { S.red = !S.red; applyRed(); persist(); };
function applyRed() { document.body.classList.toggle('red', S.red); $('dockRed').classList.toggle('active', S.red); }
$('dockLang').onclick = () => { S.lang = S.lang === 'es' ? 'en' : 'es'; applyLanguage(); persist(); };
function applyLanguage() {
  const t = T();
  document.documentElement.lang = S.lang;
  $('dockLang').textContent = S.lang.toUpperCase();
  document.querySelectorAll('[data-i18n]').forEach(el => { const v = t[el.dataset.i18n]; if (v) el.textContent = v; });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t[el.dataset.i18nPh]; });
  document.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t[el.dataset.i18nTitle].replace(/^\S+\s/, ''); });
  if (DATA) { buildLabels(); applyLayers(); }
  if (S.selected) openInfo(S.selected);
  if ($('modalLayers').classList.contains('open')) renderLayers();
  if ($('modalSky').classList.contains('open')) renderSkyList($('search').value);
}

// Capas
function applyLayers() {
  const L = S.layers;
  bodiesGroup.visible = L.planets; linesGroup.visible = L.lines; artGroup.visible = L.art; conNameGroup.visible = L.conNames;
  starNameGroup.visible = L.starNames; dsoGroup.visible = L.deep; eclipticGroup.visible = L.ecliptic; gridGroup.visible = L.grid;
  meteorGroup.visible = L.meteors;
  starUniforms.uLimit.value = SKY_LIMIT[S.skyQ];
}
function renderLayers() {
  const list = $('layerList'), t = T();
  list.replaceChildren();
  const q = document.createElement('div'); q.className = 'mini'; q.textContent = t.skyQ;
  const seg = document.createElement('div'); seg.className = 'seg';
  t.skyQOpts.forEach((label, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'chip' + (S.skyQ === i ? ' on' : ''); b.textContent = label;
    b.onclick = () => { S.skyQ = i; applyLayers(); persist(); renderLayers(); };
    seg.append(b);
  });
  list.append(q, seg);
  Object.entries(t.L).forEach(([key, label]) => {
    const row = document.createElement('div'); row.className = 'row';
    const name = document.createElement('span'); name.className = 'name'; name.textContent = label;
    const sw = document.createElement('button'); sw.type = 'button'; sw.className = 'switch' + (S.layers[key] ? ' on' : ''); sw.textContent = S.layers[key] ? 'ON' : 'OFF';
    sw.onclick = () => { S.layers[key] = !S.layers[key]; applyLayers(); persist(); renderLayers(); };
    row.append(name, sw);
    list.append(row);
  });
}

// Lista "Qué hay en el cielo" + búsqueda unificada
function rowFor(entry, metaText, dim = false) {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'row' + (dim ? ' dim' : '');
  const left = document.createElement('div');
  const n = document.createElement('div'); n.className = 'name'; n.textContent = entry.name();
  const m = document.createElement('div'); m.className = 'meta'; m.textContent = metaText;
  left.append(n, m);
  const arrow = document.createElement('span'); arrow.textContent = '›'; arrow.style.color = 'var(--accent)';
  b.append(left, arrow);
  b.onclick = () => { openInfo(entry); pointTo(entry); };
  return b;
}
function section(title) { const d = document.createElement('div'); d.className = 'mini'; d.textContent = title; return d; }
function posText(aa) { return aa ? `${aa.alt >= 0 ? T().visibleNow : T().belowNow} · Alt ${fmtNum(aa.alt)}° · ${azName(aa.az)}` : ''; }
function renderSkyList(filter = '') {
  const list = $('skyList'), t = T(), q = fold(filter.trim());
  list.replaceChildren();
  if (q) {
    const hits = CATALOG.filter(e => e.names.some(n => fold(n).includes(q))).slice(0, 30);
    hits.forEach(e => list.append(rowFor(e, `${e.sub()} · ${posText(entryAltAz(e))}`)));
    if (!hits.length) { const p = document.createElement('p'); p.className = 'note'; p.textContent = t.noResults; list.append(p); }
    const city = document.createElement('button'); city.type = 'button'; city.className = 'btn ghost';
    city.textContent = `📍 ${t.searchCity}: “${filter.trim()}”`;
    city.onclick = () => { toggleModal('modalPlace'); $('cityInput').value = filter.trim(); searchCity(filter.trim()); };
    list.append(city);
    return;
  }
  // Lluvias de meteoros
  const { active, next } = showerStatus(simDate());
  list.append(section('☄️ ' + t.meteors));
  const shName = s => (S.lang === 'en' ? s.en : s.es);
  const note = document.createElement('p'); note.className = 'note';
  note.textContent = active && active.zhrNow > 2
    ? `${t.activeShower}: ${shName(active.sh)} (${t.peak} ${active.peak.toLocaleDateString(S.lang, { day: 'numeric', month: 'short' })}, ~${fmtNum(active.zhrNow)}/h)`
    : `${t.sporadic}. ${t.nextShower}: ${shName(next.sh)}, ${t.peak} ${next.peak.toLocaleDateString(S.lang, { day: 'numeric', month: 'long' })} (~${next.sh.zhr}/h)`;
  list.append(note);
  // Sistema solar
  list.append(section('🪐 ' + t.solar));
  CATALOG.filter(e => e.kind === 'body').map(e => [e, entryAltAz(e)]).sort((a, b) => b[1].alt - a[1].alt)
    .forEach(([e, aa]) => list.append(rowFor(e, `${e.sub()} · ${posText(aa)}`, aa.alt < 0)));
  // ISS
  list.append(section('🛰️ ' + t.satellites));
  const issEntry = CATALOG.find(e => e.id === 'iss');
  let issMeta = ISS.status === 'loading' ? t.issLoading : ISS.status === 'offline' ? t.issOffline : '';
  if (ISS.status === 'ok') { const p = issPasses().find(x => x.visible); issMeta = `${t.nextPass}: ${p ? `${fmtTime(p.start)} · ${fmtNum(p.maxAlt)}°` : t.noPass}`; }
  list.append(rowFor(issEntry, issMeta, !(issNow && issNow.alt > 0)));
  // Estrellas brillantes visibles
  list.append(section('✨ ' + t.stars));
  CATALOG.filter(e => e.kind === 'star').map(e => [e, entryAltAz(e)]).filter(([, aa]) => aa.alt > 5)
    .sort((a, b) => DATA.stars[a[0].idx][2] - DATA.stars[b[0].idx][2]).slice(0, 10)
    .forEach(([e, aa]) => list.append(rowFor(e, `${e.sub()} · mag ${fmtNum(DATA.stars[e.idx][2], 1)} · ${posText(aa)}`)));
  // Cielo profundo
  list.append(section('🌌 ' + t.deep));
  CATALOG.filter(e => e.kind === 'dso').map(e => [e, entryAltAz(e)]).sort((a, b) => b[1].alt - a[1].alt)
    .forEach(([e, aa]) => list.append(rowFor(e, `${e.sub()} · ${posText(aa)}`, aa.alt < 0)));
  // Constelaciones altas
  list.append(section('⭐ ' + t.consts));
  CATALOG.filter(e => e.kind === 'con').map(e => [e, entryAltAz(e)]).filter(([, aa]) => aa.alt > 20)
    .sort((a, b) => b[1].alt - a[1].alt).slice(0, 15)
    .forEach(([e, aa]) => list.append(rowFor(e, posText(aa))));
}
$('search').addEventListener('input', e => {
  if (!$('modalSky').classList.contains('open')) toggleModal('modalSky');
  else renderSkyList(e.target.value);
});
$('search').addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const q = fold(e.target.value.trim());
  if (!q) return;
  const hit = CATALOG.find(x => x.names.some(n => fold(n) === q)) || CATALOG.find(x => x.names.some(n => fold(n).includes(q)));
  if (hit) { openInfo(hit); pointTo(hit); e.target.blur(); }
  else { toggleModal('modalPlace'); $('cityInput').value = e.target.value.trim(); searchCity(e.target.value.trim()); }
});

// Ubicación
let cityResults = [];
function renderCities() {
  const box = $('cityChips');
  box.replaceChildren();
  [...cityResults, ...PRESET_CITIES.filter(p => !cityResults.some(c => c.name === p.name))].forEach(c => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'chip' + (S.place.name === c.name ? ' on' : ''); b.textContent = c.name;
    b.onclick = () => { setPlace(c); closeModals(); };
    box.append(b);
  });
}
function setPlace(p) {
  S.place = { name: p.name, lat: p.lat, lon: p.lon, tz: p.tz };
  observer = new A.Observer(p.lat, p.lon, 0);
  $('placeLabel').textContent = p.name;
  ISS.passes = null;
  updateSkyMatrix(simDate(), true); updateBodies(simDate(), true);
  persist();
  if (S.selected) refreshInfo();
}
async function searchCity(q) {
  if (!q) return;
  const btn = $('cityBtn'); btn.textContent = '…';
  try {
    const data = JSON.parse(await fetchText(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=${S.lang}&format=json`));
    cityResults = (data.results || []).map(r => ({ name: [...new Set([r.name, r.admin1, r.country].filter(Boolean))].join(', '), lat: r.latitude, lon: r.longitude, tz: r.timezone }));
    if (cityResults[0]) setPlace(cityResults[0]);
  } catch { /* sin conexión */ }
  btn.textContent = T().search;
  renderCities();
}
$('cityBtn').onclick = () => searchCity($('cityInput').value.trim());
$('cityInput').addEventListener('keydown', e => { if (e.key === 'Enter') searchCity(e.target.value.trim()); });
$('geoBtn').onclick = () => {
  if (!navigator.geolocation) return toast(T().gpsFail);
  navigator.geolocation.getCurrentPosition(
    pos => { setPlace({ name: T().myLocation, lat: pos.coords.latitude, lon: pos.coords.longitude, tz: Intl.DateTimeFormat().resolvedOptions().timeZone }); closeModals(); },
    () => toast(T().gpsFail), { enableHighAccuracy: false, timeout: 10000, maximumAge: 3600e3 });
};

// Tiempo
function setOffset(ms) {
  S.offset = ms;
  $('timeSlider').value = THREE.MathUtils.clamp(Math.round(ms / 60e3), -1440, 1440);
  const d = simDate(), local = new Date(d - d.getTimezoneOffset() * 60e3);
  $('dateInput').value = local.toISOString().slice(0, 16);
  ISS.passes = null;
}
$('timeSlider').addEventListener('input', e => setOffset(+e.target.value * 60e3));
document.querySelectorAll('[data-shift]').forEach(b => (b.onclick = () => setOffset(S.offset + +b.dataset.shift * 60e3)));
$('nowBtn').onclick = () => setOffset(0);
$('dateInput').addEventListener('change', e => { const t = Date.parse(e.target.value); if (!isNaN(t)) setOffset(t - Date.now()); });

// ───────────── Bucle principal ─────────────
const azEl = $('azText'), altEl = $('altText'), horEl = $('horizonTag'), banner = $('focusBanner'), timeLabel = $('timeLabel');
const camDir = new THREE.Vector3();
let last = performance.now(), slowTick = 0, focused = null;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  const date = simDate();
  updateSkyMatrix(date);
  updateBodies(date);
  if (S.layers.iss) updateISS(date); else ISS.group.visible = false;

  // Cámara
  if (S.sensor && sensorReady) camera.quaternion.slerp(sensorQ, 0.25);
  else {
    const tr = S.tracking && S.targetAz == null && entryAltAz(S.tracking);
    if (tr) { S.viewAz = tr.az; S.viewAlt = THREE.MathUtils.clamp(tr.alt, -89, 89); }
    if (S.targetAz != null) {
      if (S.tracking) { const t = entryAltAz(S.tracking); if (t) { S.targetAz = t.az; S.targetAlt = t.alt; } }
      const dAz = ((S.targetAz - S.viewAz + 540) % 360) - 180;
      S.viewAz = (S.viewAz + dAz * 0.12 + 360) % 360;
      S.viewAlt += (S.targetAlt - S.viewAlt) * 0.12;
      const tol = S.tracking ? 1.5 : 0.05; // al seguir la ISS nos "enganchamos" en cuanto estamos cerca
      if (Math.abs(dAz) < tol && Math.abs(S.targetAlt - S.viewAlt) < tol) S.targetAz = S.targetAlt = null;
    }
    camera.lookAt(altAzVec(S.viewAz, S.viewAlt));
  }
  camera.getWorldDirection(camDir);
  const view = vecToAltAz(camDir);

  // Atmósfera según el Sol
  const sun = BODIES[0], sunW = sun.holder.getWorldPosition(new THREE.Vector3()).normalize(), sunAlt = Math.asin(sunW.y) * R2D;
  const atm = S.layers.atmosphere;
  const [zen, hor] = skyColorsFor(atm ? sunAlt : -90);
  domeMat.uniforms.uZenith.value.copy(zen); domeMat.uniforms.uHorizon.value.copy(hor);
  domeMat.uniforms.uSunDir.value.copy(sunW); domeMat.uniforms.uSunGlow.value = atm ? THREE.MathUtils.clamp((sunAlt + 8) / 10, 0, 1) : 0;
  const starFade = S.camera || !atm ? 1 : THREE.MathUtils.clamp((-sunAlt - 1) / 11, 0, 1);
  starUniforms.uFade.value = starFade;
  starUniforms.uScale.value = Math.min(2.2, Math.pow(62 / S.fov, 0.3));
  starUniforms.uLimit.value = SKY_LIMIT[S.skyQ] + Math.log10(62 / S.fov) * 1.5 - (1 - starFade) * 2;
  const lineFade = 0.35 + 0.65 * starFade;
  const artFade = starFade * THREE.MathUtils.clamp((S.fov - 6) / 20, 0, 1); // sin ilustraciones de día ni con mucho zoom

  // Tamaño aparente de los astros: exagerado con poco zoom, real con mucho zoom
  for (const b of BODIES) {
    if (b.id !== 'sun') b.sphere.material.uniforms.uLight.value.copy(b.lightEq).transformDirection(skyGroup.matrix);
    const k = Math.max(1, S.fov / b.ref);
    b.scaled.scale.setScalar(k);
    const discPx = (b.radius * k / R.body) / Math.tan(S.fov * D2R / 2) * innerHeight / 2;
    b.glow.material.opacity = THREE.MathUtils.clamp(1.2 - discPx / 14, 0, b.id === 'sun' ? 0.9 : 0.7);
    if (b.label) b.label.center.y = 1.15 + discPx * (b.ring ? 2.3 : 1) / 18; // la etiqueta queda bajo el disco
  }
  ISS.scaled.scale.setScalar(R.iss * Math.tan(0.03 * D2R) * Math.max(1, S.fov / 4));
  if (ISS.label) ISS.label.center.y = 1.15 + (ISS.scaled.scale.x * 0.5 / R.iss) / Math.tan(S.fov * D2R / 2) * innerHeight / 2 / 17;

  // Constelación enfocada
  let best = null, bestAng = 22;
  if (DATA && (S.layers.lines || S.layers.art || S.layers.conNames)) {
    for (const con of DATA.cons) {
      const w = con.center.clone().applyMatrix4(skyGroup.matrix);
      const ang = w.angleTo(camDir) * R2D;
      if (ang < bestAng) { bestAng = ang; best = con; }
    }
  }
  if (best !== focused) {
    focused = best;
    hiLines.geometry.dispose();
    hiLines.geometry = new THREE.BufferGeometry().setFromPoints(best ? conSegments(best, R.lines - 1) : []);
  }
  if (DATA) for (const con of DATA.cons) {
    if (con.artMat) con.artMat.opacity += (((con === focused ? 0.7 : 0.15) * artFade) - con.artMat.opacity) * 0.08;
    if (con.label) con.label.material.opacity = (con === focused ? 0.95 : 0.55) * lineFade;
  }
  lineMat.opacity = 0.3 * lineFade; hiLineMat.opacity = 0.85 * lineFade;
  starNameGroup.children.forEach(l => (l.visible = l.userData.mag < (S.fov < 30 ? 2.6 : 1.6)));
  banner.textContent = focused ? (S.lang === 'en' ? focused.en : focused.es) : '';
  banner.style.opacity = focused && bestAng < 15 && S.layers.lines ? 1 : 0;

  // Marcador del objeto seleccionado
  const selW = S.selected?.world();
  selMarker.visible = !!selW && S.fov > 3;
  if (selW) selMarker.position.copy(selW);

  updateMeteors(dt, starFade, date);

  // HUD (4 veces por segundo)
  if (now - slowTick > 250) {
    slowTick = now;
    const az = Math.round(view.az) % 360, alt = Math.round(view.alt);
    azEl.textContent = `${az}° ${azName(az)}`;
    altEl.textContent = `${alt >= 0 ? '+' : ''}${alt}°`;
    horEl.textContent = alt >= 0 ? T().above : T().below;
    horEl.className = 'tag ' + (alt >= 0 ? 'above' : 'below');
    timeLabel.textContent = date.toLocaleString(S.lang, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', ...tzOpt() });
    $('timeBtn').classList.toggle('shifted', Math.abs(S.offset) > 60e3);
    if (S.selected && now % 2000 < 260) refreshInfo();
    const { active } = showerStatus(date), sb = $('showerBanner');
    if (active && active.zhrNow >= 10 && S.layers.meteors) {
      const rad = eqVec(active.sh.ra, active.sh.dec).applyMatrix4(skyGroup.matrix);
      sb.textContent = `☄️ ${S.lang === 'en' ? active.sh.en : active.sh.es} · ~${fmtNum(active.zhrNow)}/h${rad.y < 0 ? ` · ${T().radiantBelow}` : ''}`;
      sb.style.display = 'block';
    } else sb.style.display = 'none';
  }
  renderer.render(scene, camera);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  updateViewOffset();
  updateScreenSprites();
});

// ───────────── Arranque ─────────────
async function init() {
  applyLanguage();
  applyRed();
  $('placeLabel').textContent = S.place.name;
  setOffset(S.offset);
  DATA = await (await fetch('data/cielo.json')).json();
  buildStars();
  buildConstellations();
  buildBodies();
  buildDSO();
  buildLabels();
  buildCatalog();
  applyLayers();
  updateSkyMatrix(simDate(), true);
  updateBodies(simDate(), true);
  setFov(S.fov);
  // Vista inicial: objeto del enlace compartido, o el planeta brillante más alto, o el sur
  const fromUrl = params.get('obj') && CATALOG.find(e => e.id === params.get('obj'));
  const start = fromUrl || CATALOG.filter(e => e.kind === 'body' && e.id !== 'sun').map(e => [e, entryAltAz(e)]).filter(([, aa]) => aa.alt > 10).sort((a, b) => b[1].alt - a[1].alt)[0]?.[0];
  const aim = e => { const aa = e && entryAltAz(e); if (aa) { S.viewAz = aa.az; S.viewAlt = THREE.MathUtils.clamp(aa.alt, -30, 70); } };
  aim(start);
  if (fromUrl) openInfo(fromUrl);
  requestAnimationFrame(frame);
  $('loading').style.opacity = 0;
  setTimeout(() => $('loading').remove(), 600);
  if (!saved.hinted && !urlPlace) setTimeout(() => toast(T().hintPlace), 1200);
  persist();
  loadISS().then(() => {
    updateISS(simDate());
    if (fromUrl?.kind === 'iss') aim(fromUrl); // la ISS solo tiene posición cuando llega su órbita
    if (S.selected?.kind === 'iss') refreshInfo();
  });
}
init();

// Exponer para depuración
window.__planetario = { S, CATALOG: () => CATALOG, BODIES, setOffset, setFov, openInfo, pick, camera, skyGroup, ISS, issAt, A };
