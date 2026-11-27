// Planetario DarwinCaos v2
// Cielo real: efemérides (Astronomy Engine), catálogo Hipparcos, ISS por TLE (satellite.js),
// 88 constelaciones IAU con ilustraciones de Stellarium y texturas planetarias fotográficas.
import * as THREE from './vendor/three.module.min.js';
import { createObjectView } from './objeto.js?v=1.8.2';
import { createSatellites } from './satelites.js?v=1.8.2';

const A = window.Astronomy;
const SAT = window.satellite;

// ───────────── Configuración del canal ─────────────
// Versión de la app. Al publicar cambios, súbela aquí y en index.html (?v=) para que los móviles no usen archivos viejos.
const APP_VERSION = '1.8.2';
const CHANNEL_URL = 'https://www.youtube.com/@DarwinCaos'; // ← verificar el handle real
// Vídeos del canal por objeto. Si falta, se abre la búsqueda del canal con el nombre del objeto.
const VIDEOS = {
  // jupiter: 'https://youtu.be/XXXXXXXXXXX',
};

// Logo del canal en el centro de la rosa de los vientos: img/logo.png (cuadrado).
// LOGO_CIRCLE = diámetro del círculo azul del logo / ancho de la imagen. Se recorta justo por ese círculo.
const LOGO_CIRCLE = 0.80;

const D2R = Math.PI / 180, R2D = 180 / Math.PI;
const R = { dome: 950, ground: 930, stars: 900, lines: 895, art: 890, dso: 870, meteor: 860, body: 500, iss: 450 };

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
    manualMode: 'Modo manual · toca 🧭 Seguir el móvil para volver', camFail: 'No se pudo abrir la cámara. Sigues en modo sensor.', sensorFail: 'Este dispositivo no ofrece brújula/giroscopio.',
    noResults: 'Sin resultados. Pulsa Intro para buscarlo como ciudad.', searchCity: 'Buscar como ciudad',
    hintPlace: 'Toca 📍 para ver el cielo desde tu ubicación', shotNow: '📸 Lo que ves ahora', shotSpecial: '🎂 Fecha especial', postTitlePh: 'Título: «El día que nací»…', postCityPh: 'Ciudad (por defecto, la actual)', postMake: '✨ Crear postal', postDefault: 'El cielo de un día especial',
    phFull: 'Luna llena', phNew: 'Luna nueva', phWax: 'Luna creciente', phWan: 'Luna menguante', dayTime: 'era de día', belowTag: '↓ Bajo el horizonte', searchTitle: '🔎 Buscar', tabNow: '🔭 Ahora',
    locHelpIOS: '📍 Tu iPhone tiene bloqueada la ubicación para las webs. Para activarla: Ajustes › Privacidad y seguridad › Localización (activada) › Sitios web de Safari › «Preguntar» o «Al usar la app». Después vuelve a pulsar «Usar mi ubicación». Mientras tanto usamos tu ubicación aproximada.',
    locHelpOther: '📍 La ubicación está bloqueada para esta web. Actívala en los ajustes del navegador (icono del candado junto a la dirección › Permisos › Ubicación) y vuelve a pulsar «Usar mi ubicación».', shotTitle: '📸 Compartir el cielo', shotShare: '📤 Compartir', shotSave: '💾 Guardar',
    shotFormats: { square: '◻️ Cuadrado', story: '▯ Vertical', wide: '▭ Horizontal' }, shotDefault: 'El cielo de esta noche', shotText: 'Míralo en el Planetario DarwinCaos:', shotSaved: 'Imagen guardada ✔', calTitle: '📅 Calendario', tabTonight: '🌙 Esta noche', tabEvents: '📅 Eventos', cleanMode: 'Pantalla limpia (ocultar menús)', showMenus: 'Mostrar menús', readMore: 'Leer más ▾', readLess: 'Leer menos ▴',
    locating: 'Buscando tu ubicación…', approx: 'aprox.', gpsDenied: 'Permiso de ubicación denegado.', usedApprox: 'Usamos tu ubicación aproximada.',
    searchCityHint: 'Escribe tu ciudad en el buscador.', turnTo: 'Gira hacia',
    L: { planets: 'Sol, Luna y planetas', iss: 'Estación Espacial (ISS)', sats: 'Satélites destacados', starlink: 'Starlink (más de 10.000)', lines: 'Líneas de constelaciones', art: 'Ilustraciones mitológicas',
      conNames: 'Nombres de constelaciones', starNames: 'Nombres de estrellas', deep: 'Galaxias, nebulosas y agujeros negros',
      ecliptic: 'Eclíptica', grid: 'Cuadrícula altura/acimut', meteors: 'Estrellas fugaces (lluvias reales)', atmosphere: 'Luz del día y crepúsculo',
      skyline: 'Silueta de ciudad en el horizonte', rose: 'Rosa de los vientos (en lo alto del cielo)', realDay: 'Día realista (oculta las estrellas con luz solar)' },
    envTitle: 'Entorno (paisaje y contaminación lumínica)', envOpts: { auto: '🤖 Automático', city: '🏙️ Ciudad', town: '🏘️ Pueblo', country: '🌲 Campo' },
    envDetected: 'Detectado', envDetecting: 'Detectando el entorno…', envNames: { city: 'ciudad', town: 'pueblo', country: 'campo / bosque' }, inhabitants: 'hab.', farFromTown: 'lejos del núcleo urbano', home: '⟲ Vista inicial',
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
    manualMode: 'Manual mode · tap 🧭 Follow phone to go back', camFail: 'Could not open the camera. Staying in sensor mode.', sensorFail: 'This device has no compass/gyroscope.',
    noResults: 'No results. Press Enter to search it as a city.', searchCity: 'Search as a city',
    hintPlace: 'Tap 📍 to see the sky from your location', shotNow: '📸 What you see now', shotSpecial: '🎂 Special date', postTitlePh: 'Title: “The day I was born”…', postCityPh: 'City (current one by default)', postMake: '✨ Create postcard', postDefault: 'The sky on a special day',
    phFull: 'Full Moon', phNew: 'New Moon', phWax: 'Waxing Moon', phWan: 'Waning Moon', dayTime: 'it was daytime', belowTag: '↓ Below the horizon', searchTitle: '🔎 Search', tabNow: '🔭 Now',
    locHelpIOS: '📍 Your iPhone blocks location for websites. To enable it: Settings › Privacy & Security › Location Services (on) › Safari Websites › “Ask” or “While Using the App”. Then tap “Use my location” again. Meanwhile we use your approximate location.',
    locHelpOther: '📍 Location is blocked for this site. Enable it in your browser settings (padlock icon next to the address › Permissions › Location) and tap “Use my location” again.', shotTitle: '📸 Share the sky', shotShare: '📤 Share', shotSave: '💾 Save',
    shotFormats: { square: '◻️ Square', story: '▯ Vertical', wide: '▭ Landscape' }, shotDefault: 'Tonight’s sky', shotText: 'See it in the DarwinCaos Planetarium:', shotSaved: 'Image saved ✔', calTitle: '📅 Calendar', tabTonight: '🌙 Tonight', tabEvents: '📅 Events', cleanMode: 'Clean screen (hide menus)', showMenus: 'Show menus', readMore: 'Read more ▾', readLess: 'Read less ▴',
    locating: 'Finding your location…', approx: 'approx.', gpsDenied: 'Location permission denied.', usedApprox: 'Using your approximate location.',
    searchCityHint: 'Type your city in the search box.', turnTo: 'Turn to',
    L: { planets: 'Sun, Moon & planets', iss: 'Space Station (ISS)', sats: 'Featured satellites', starlink: 'Starlink (10,000+)', lines: 'Constellation lines', art: 'Mythological artwork',
      conNames: 'Constellation names', starNames: 'Star names', deep: 'Galaxies, nebulae & black holes',
      ecliptic: 'Ecliptic', grid: 'Alt/Az grid', meteors: 'Shooting stars (real showers)', atmosphere: 'Daylight & twilight',
      skyline: 'City skyline on the horizon', rose: 'Compass rose (at the zenith)', realDay: 'Realistic daytime (hide stars in sunlight)' },
    envTitle: 'Surroundings (landscape & light pollution)', envOpts: { auto: '🤖 Automatic', city: '🏙️ City', town: '🏘️ Town', country: '🌲 Countryside' },
    envDetected: 'Detected', envDetecting: 'Detecting surroundings…', envNames: { city: 'city', town: 'town', country: 'countryside / forest' }, inhabitants: 'people', farFromTown: 'away from the town centre', home: '⟲ Initial view',
    min: 'min', today: 'today', tomorrow: 'tomorrow',
  },
};

// ───────────── Catálogos propios ─────────────
// Polos de rotación (RA°, Dec° J2000, IAU) para orientar discos y anillos correctamente.
const BODIES = [
  { id: 'sun', body: 'Sun', es: 'Sol', en: 'Sun', tex: 'sol', deg: 0.267, ref: 7, pole: [286.13, 63.87], glow: '#fde68a',
    fact: ['Contiene el 99,86 % de la masa del sistema solar. Su luz tarda unos 8 minutos y 20 segundos en llegar hasta nosotros.', 'Holds 99.86% of the Solar System\'s mass. Its light takes about 8 minutes 20 seconds to reach us.'] },
  { id: 'moon', body: 'Moon', es: 'Luna', en: 'Moon', tex: 'luna', deg: 0.259, ref: 7, pole: [270, 66.5], glow: '#e2e8f0',
    fact: ['Siempre nos muestra la misma cara porque tarda lo mismo en girar sobre sí misma que en orbitarnos (27,3 días). Se aleja unos 3,8 cm cada año.', 'It always shows us the same face because it spins once per orbit (27.3 days). It drifts away about 3.8 cm per year.'] },
  { id: 'mercury', body: 'Mercury', es: 'Mercurio', en: 'Mercury', tex: 'mercurio', deg: 0.025, ref: 1, pole: [281.01, 61.42], glow: '#d6d3d1',
    fact: ['El planeta más cercano al Sol. Su año dura 88 días, pero un día solar completo dura 176 días terrestres.', 'Closest planet to the Sun. Its year lasts 88 days, but one full solar day lasts 176 Earth days.'] },
  { id: 'venus', body: 'Venus', es: 'Venus', en: 'Venus', tex: 'venus', deg: 0.04, ref: 1, pole: [272.76, 67.16], glow: '#fef3c7',
    fact: ['El planeta más caliente (~465 °C) por su enorme efecto invernadero, y gira al revés que casi todos los demás.', 'The hottest planet (~465 °C) due to its runaway greenhouse effect, and it spins backwards.'] },
  { id: 'mars', body: 'Mars', es: 'Marte', en: 'Mars', tex: 'marte', deg: 0.03, ref: 1, pole: [317.68, 52.89], glow: '#fdba74',
    fact: ['Alberga el Olympus Mons, el mayor volcán conocido del sistema solar: unas 2,5 veces la altura del Everest.', 'Home to Olympus Mons, the largest known volcano in the Solar System: about 2.5× the height of Everest.'] },
  { id: 'jupiter', body: 'Jupiter', es: 'Júpiter', en: 'Jupiter', tex: 'jupiter', deg: 0.06, ref: 1, pole: [268.06, 64.5], glow: '#fde7c2',
    fact: ['Más del doble de masivo que todos los demás planetas juntos. Con unos prismáticos ya se ven sus cuatro lunas galileanas.', 'More than twice as massive as all other planets combined. Binoculars reveal its four Galilean moons.'] },
  { id: 'saturn', body: 'Saturn', es: 'Saturno', en: 'Saturn', tex: 'saturno', deg: 0.05, ref: 1, pole: [40.59, 83.54], glow: '#fde68a', ring: true,
    fact: ['Sus anillos miden unos 280.000 km de diámetro, pero su grosor típico es de apenas decenas de metros. Un telescopio pequeño basta para verlos.', 'Its rings span ~280,000 km yet are typically only tens of metres thick. A small telescope shows them.'] },
  { id: 'uranus', body: 'Uranus', es: 'Urano', en: 'Uranus', tex: 'urano', deg: 0.025, ref: 1, pole: [257.31, -15.18], glow: '#a5f3fc',
    fact: ['Gira “tumbado”: su eje está inclinado unos 98°. Bajo cielos muy oscuros es apenas visible a simple vista.', 'It spins on its side, tilted about 98°. Under very dark skies it is barely visible to the naked eye.'] },
  { id: 'neptune', body: 'Neptune', es: 'Neptuno', en: 'Neptune', tex: 'neptuno', deg: 0.025, ref: 1, pole: [299.36, 43.46], glow: '#93c5fd',
    fact: ['Tiene los vientos más rápidos del sistema solar, de más de 2.000 km/h. Hace falta un telescopio para verlo.', 'It has the fastest winds in the Solar System, over 2,000 km/h. You need a telescope to see it.'] },
  { id: 'pluto', body: 'Pluto', es: 'Plutón', en: 'Pluto', tex: 'pluton', deg: 0.018, ref: 1, pole: [132.99, -6.16], glow: '#e7d3bf', dwarf: true,
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
  { name: 'Ciudad Real, España', pop: 75000, lat: 38.9848, lon: -3.9274, tz: 'Europe/Madrid' },
  { name: 'Madrid, España', pop: 3300000, lat: 40.4168, lon: -3.7038, tz: 'Europe/Madrid' },
  { name: 'Ciudad de México', pop: 9200000, lat: 19.4326, lon: -99.1332, tz: 'America/Mexico_City' },
  { name: 'Buenos Aires', pop: 3100000, lat: -34.6037, lon: -58.3816, tz: 'America/Argentina/Buenos_Aires' },
  { name: 'Bogotá', pop: 7400000, lat: 4.711, lon: -74.0721, tz: 'America/Bogota' },
  { name: 'Lima', pop: 9700000, lat: -12.0464, lon: -77.0428, tz: 'America/Lima' },
  { name: 'Santiago de Chile', pop: 6300000, lat: -33.4489, lon: -70.6693, tz: 'America/Santiago' },
  { name: 'New York', pop: 8300000, lat: 40.7128, lon: -74.006, tz: 'America/New_York' },
];

// ───────────── Estado y persistencia ─────────────
const STORE_KEY = 'dc_planetario_v2';
const saved = (() => { try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch { return {}; } })();
function persist() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ welcomed: true, lang: S.lang, place: S.place, layers: S.layers, envMode: S.envMode, red: S.red, tle: S.tleCache, hinted: true }));
  } catch { /* almacenamiento no disponible */ }
}
const params = new URLSearchParams(location.search);
const urlPlace = params.has('lat') && params.has('lon')
  ? { name: params.get('name') || `${(+params.get('lat')).toFixed(2)}, ${(+params.get('lon')).toFixed(2)}`, lat: +params.get('lat'), lon: +params.get('lon'), tz: params.get('tz') || undefined }
  : null;

const S = {
  lang: params.get('lang') || saved.lang || ((navigator.language || 'es').startsWith('es') ? 'es' : 'en'),
  place: urlPlace || saved.place || PRESET_CITIES[0],
  layers: Object.assign({ planets: true, iss: true, sats: true, starlink: false, lines: true, art: true, conNames: true, starNames: true, deep: true, ecliptic: false, grid: false, meteors: true, atmosphere: true, skyline: true, rose: true, realDay: false }, saved.layers),
  envMode: saved.envMode || 'auto', // auto | city | town | country
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
renderer.setSize(innerWidth, innerHeight, false);
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
      vec3 c = mix(uHorizon, uZenith, pow(h, 0.5)); // resplandor urbano junto al horizonte
      if (d.y < 0.0) c = mix(uHorizon, uZenith * 0.8, pow(clamp(-d.y, 0.0, 1.0), 0.4));
      float s = max(dot(d, uSunDir), 0.0);
      c += uSunGlow * (pow(s, 8.0) * vec3(0.55, 0.35, 0.18) + pow(s, 64.0) * vec3(0.6, 0.5, 0.35));
      gl_FragColor = vec4(c, 1.0); }`,
});
const dome = new THREE.Mesh(new THREE.SphereGeometry(R.dome, 48, 24), domeMat);
dome.renderOrder = -10;
scene.add(dome);

const SKY_KEYS = [ // [altura Sol, cenit, horizonte]
  [-18, '#01030a', '#22365f'], [-12, '#020611', '#2a3f6c'], [-6, '#0a1838', '#36406a'],
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
  new THREE.MeshBasicMaterial({ color: 0x0a1428, transparent: true, opacity: 0.3, side: THREE.BackSide, depthWrite: false, depthTest: false }),
);
ground.renderOrder = 50;
horizonGroup.add(ground);
{
  const pts = [];
  for (let a = 0; a <= 360; a += 2) pts.push(altAzVec(a, 0, R.ground - 5));
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.3, depthTest: false }));
  line.renderOrder = 61;
  horizonGroup.add(line);
}
// ── Silueta de ciudad en el horizonte (opaca: tapa lo que hay detrás, como en la realidad) ──
const SKY_TOP_DEG = 12, SKY_BOTTOM_DEG = -1.5, SKY_HS = 1.5; // SKY_HS: escala de altura de los edificios
// Entornos: paisaje del horizonte, contaminación lumínica (magnitud límite) y color del cielo nocturno
const ENV = {
  city: { limit: 4.5, zen: '#070b18', hor: '#3d3a55' },    // resplandor anaranjado-violeta de la ciudad
  town: { limit: 5.5, zen: '#03060f', hor: '#1f2b48' },
  country: { limit: 6.5, zen: '#01030a', hor: '#111a30' },  // cielo oscuro de campo
};
function makeSkylineTexture(kind = 'city') {
  const W = 4096, H = 512, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const top = Math.tan(SKY_TOP_DEG * D2R), bot = Math.tan(SKY_BOTTOM_DEG * D2R);
  const yOf = deg => H * (top - Math.tan(deg * SKY_HS * D2R)) / (top - bot); // grados de altura → píxel
  const base = yOf(0);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const sil = '#03050a', lights = [];
  ctx.fillStyle = sil;
  ctx.fillRect(0, base - 2, W, H - base + 2);
  const block = (x, w, hDeg) => { const y = yOf(hDeg); ctx.fillRect(x, y, w, base - y + 2); return y; };
  // Perfil continuo (colinas, montañas): hFn(x) en grados
  const ridge = (color, hFn) => {
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, base + 2);
    for (let px = 0; px <= W; px += 8) ctx.lineTo(px, yOf(hFn(px)));
    ctx.lineTo(W, base + 2); ctx.closePath(); ctx.fill(); ctx.fillStyle = sil;
  };
  const TAU = Math.PI * 2, per = k => (px) => Math.sin(px / W * TAU * k); // senos periódicos: el paisaje empalma sin cortes
  const conifer = (x, h) => { // pino/abeto de tres pisos
    const w = (base - yOf(h)) * 0.42;
    for (let t = 0; t < 3; t++) { const yb = yOf(h * (0.15 + t * 0.27)), yt = yOf(h * (0.55 + t * 0.22)); ctx.beginPath(); ctx.moveTo(x - w * (1 - t * 0.25), yb); ctx.lineTo(x, yt - (t === 2 ? (base - yOf(h)) * 0.25 : 0)); ctx.lineTo(x + w * (1 - t * 0.25), yb); ctx.fill(); }
    ctx.fillRect(x - 2, yOf(h * 0.2), 4, base - yOf(h * 0.2) + 2);
  };
  const leafy = (x, h) => { // árbol de copa redonda
    const R = (base - yOf(h)) * 0.32; ctx.fillRect(x - 3, yOf(h * 0.5), 6, base);
    for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(x + (rnd() - 0.5) * R * 1.3, yOf(h) + R + (rnd() - 0.3) * R * 0.8, R * (0.6 + rnd() * 0.4), 0, TAU); ctx.fill(); }
  };
  const cypress = (x, h) => { const hp = base - yOf(h); ctx.beginPath(); ctx.ellipse(x, base - hp / 2, Math.max(5, hp * 0.11), hp / 2, 0, 0, TAU); ctx.fill(); };
  const house = (x, w, h) => { // casa baja con tejado a dos aguas
    const y = block(x, w, h); ctx.beginPath(); ctx.moveTo(x - 4, y + 1); ctx.lineTo(x + w / 2, y - 8 - rnd() * 8); ctx.lineTo(x + w + 4, y + 1); ctx.fill();
    if (rnd() < 0.25) ctx.fillRect(x + w * 0.25, y - 14, 5, 12);
    return y;
  };
  if (kind === 'town') {
    ridge('#0a1322', px => 1.9 + 0.7 * per(3)(px) + 0.4 * per(7)(px + 900) + 0.2 * per(13)(px));
    let x = 0;
    while (x < W) {
      const r = rnd();
      if (r < 0.5) { // grupo de casas
        const n = 3 + Math.floor(rnd() * 6);
        for (let i = 0; i < n && x < W; i++) { const w = 34 + rnd() * 40, y = house(x, w, 0.65 + rnd() * 0.6); lights.push([x, w, y]); x += w + (rnd() < 0.3 ? 6 : 1); }
      } else if (r < 0.62) { // iglesia con campanario
        const nave = 100 + rnd() * 50, th = 3.2 + rnd() * 0.8, tw = 34;
        house(x, nave, 1.3);
        const tx = x + nave - tw / 2, ty = yOf(th);
        ctx.fillRect(tx, ty, tw, base - ty);
        ctx.beginPath(); ctx.moveTo(tx - 3, ty); ctx.lineTo(tx + tw / 2, yOf(th + 0.55)); ctx.lineTo(tx + tw + 3, ty); ctx.fill();
        ctx.fillRect(tx + tw / 2 - 1.5, yOf(th + 0.85), 3, yOf(th + 0.55) - yOf(th + 0.85));
        ctx.fillRect(tx + tw / 2 - 6, yOf(th + 0.75), 12, 3);
        ctx.clearRect(tx + 7, ty + 8, tw - 14, 12); // hueco de las campanas
        lights.push(['warm', tx + tw / 2, ty + 30]);
        x += nave + tw;
      } else if (r < 0.85) { // olivos y cipreses
        const w = 60 + rnd() * 120;
        for (let i = 8; i < w; i += 16 + rnd() * 14) rnd() < 0.3 ? cypress(x + i, 2.0 + rnd() * 1.0) : leafy(x + i, 0.8 + rnd() * 0.5);
        x += w;
      } else x += 80 + rnd() * 160; // campo abierto
    }
  } else if (kind === 'country') {
    ridge('#0b1424', px => 3.4 + 1.3 * per(2)(px + 400) + 0.7 * per(5)(px) + 0.35 * per(11)(px + 1500) + 0.15 * per(23)(px)); // montañas lejanas
    ridge('#060b15', px => 1.6 + 0.6 * per(3)(px + 2000) + 0.3 * per(9)(px));                                                // colinas
    let x = 0;
    while (x < W) {
      if (rnd() < 0.07) { x += 60 + rnd() * 140; continue; } // claro del bosque
      if (rnd() < 0.006) { const w = 56, y = house(x, w, 0.8); lights.push(['warm', x + w * 0.35, y + 12]); x += w + 6; continue; } // casa de campo aislada
      const h = 1.0 + rnd() * 1.6;
      rnd() < 0.7 ? conifer(x, h) : leafy(x, h * 0.8);
      x += 11 + rnd() * 18;
    }
    ctx.fillRect(0, yOf(0.5), W, base);
  } else {
  let x = 0;
  while (x < W) {
    const r = rnd();
    if (r < 0.16) { // arboleda
      const w = 60 + rnd() * 140;
      for (let i = 0; i < w; i += 14) { const rr = 10 + rnd() * 16; ctx.beginPath(); ctx.arc(x + i, yOf(0.5 + rnd() * 0.7), rr, 0, Math.PI * 2); ctx.fill(); }
      block(x, w, 0.45); x += w;
    } else if (r < 0.5) { // casas y bloques bajos con tejados
      const w = 30 + rnd() * 60, h = 0.6 + rnd() * 1.1, y = block(x, w, h);
      if (rnd() < 0.5) { ctx.beginPath(); ctx.moveTo(x - 2, y + 1); ctx.lineTo(x + w / 2, y - 14 - rnd() * 10); ctx.lineTo(x + w + 2, y + 1); ctx.fill(); }
      if (rnd() < 0.3) ctx.fillRect(x + w * 0.7, y - 12, 5, 12); // chimenea
      lights.push([x, w, y]); x += w + (rnd() < 0.3 ? 4 + rnd() * 10 : 0);
    } else if (r < 0.8) { // edificios medios escalonados
      const w = 50 + rnd() * 80, h = 1.6 + rnd() * 2.2;
      const y = block(x, w, h);
      if (rnd() < 0.5) block(x + w * 0.2, w * 0.6, h + 0.25 + rnd() * 0.4);
      if (rnd() < 0.35) { ctx.fillRect(x + w * 0.5, yOf(h + 0.9), 3, y - yOf(h + 0.9)); lights.push(['red', x + w * 0.5 + 1.5, yOf(h + 0.9)]); }
      lights.push([x, w, y]); x += w + rnd() * 6;
    } else if (r < 0.93) { // rascacielos con retranqueos
      const w = 40 + rnd() * 50, h = 3.8 + rnd() * 2.8;
      const y = block(x, w, h);
      block(x + w * 0.15, w * 0.7, h + 0.35);
      block(x + w * 0.32, w * 0.36, h + 0.7);
      if (rnd() < 0.6) { ctx.fillRect(x + w / 2 - 1.5, yOf(h + 1.6), 3, y); lights.push(['red', x + w / 2, yOf(h + 1.6)]); }
      lights.push([x, w, y]); x += w + rnd() * 8;
    } else { // cúpula o campanario
      const w = 70 + rnd() * 50, h = 1.4 + rnd() * 0.8, y = block(x, w, h);
      if (rnd() < 0.5) { ctx.beginPath(); ctx.ellipse(x + w / 2, y, w * 0.3, w * 0.28, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(x + w / 2 - 2, y - w * 0.28 - 22, 4, 22); }
      else { ctx.fillRect(x + w * 0.4, yOf(h + 2), w * 0.2, y); ctx.beginPath(); ctx.moveTo(x + w * 0.38, yOf(h + 2)); ctx.lineTo(x + w / 2, yOf(h + 3.1)); ctx.lineTo(x + w * 0.62, yOf(h + 2)); ctx.fill(); }
      x += w;
    }
  }
  }
  // Ventanas encendidas (pocas y tenues) y balizas rojas
  const winP = kind === 'city' ? 0.09 : 0.05;
  for (const L of lights) {
    if (L[0] === 'red') { ctx.fillStyle = '#ff3b30'; ctx.fillRect(L[1] - 2, L[2] - 2, 4, 4); continue; }
    if (L[0] === 'warm') { ctx.fillStyle = 'rgba(255,190,110,0.8)'; ctx.fillRect(L[1] - 2, L[2] - 2, 5, 5); continue; }
    const [bx, bw, by] = L;
    for (let wy = by + 8; wy < base - 6; wy += 9) for (let wx = bx + 5; wx < bx + bw - 6; wx += 8)
      if (rnd() < winP) { ctx.fillStyle = rnd() < 0.7 ? 'rgba(255,196,120,0.55)' : 'rgba(180,215,255,0.45)'; ctx.fillRect(wx, wy, 3, 4); }
  }
  ctx.fillStyle = sil;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  tex.anisotropy = 4;
  return tex;
}
const skylineGroup = new THREE.Group();
horizonGroup.add(skylineGroup);
{
  const r = R.ground - 15, yTop = r * Math.tan(SKY_TOP_DEG * D2R), yBot = r * Math.tan(SKY_BOTTOM_DEG * D2R);
  skylineGroup.userData.mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, yTop - yBot, 180, 1, true),
    new THREE.MeshBasicMaterial({ transparent: true, side: THREE.BackSide, depthWrite: false, depthTest: false }));
  skylineGroup.userData.mesh.position.y = (yTop + yBot) / 2;
  skylineGroup.userData.mesh.renderOrder = 52;
  skylineGroup.add(skylineGroup.userData.mesh);
}
let skylineKind = null;
function setSkyline(kind) {
  if (kind === skylineKind) return;
  skylineKind = kind;
  const mat = skylineGroup.userData.mesh.material;
  mat.map?.dispose();
  mat.map = makeSkylineTexture(kind);
  mat.needsUpdate = true;
}

// ── Rosa de los vientos en el cenit con el logo de DarwinCaos ──
const roseGroup = new THREE.Group();
horizonGroup.add(roseGroup);
const roseCanvas = document.createElement('canvas');
roseCanvas.width = roseCanvas.height = 1024;
const roseTex = new THREE.CanvasTexture(roseCanvas);
roseTex.colorSpace = THREE.SRGBColorSpace;
let roseLogo = null;
function drawRose() {
  const ctx = roseCanvas.getContext('2d'), C = 512, t = T();
  ctx.clearRect(0, 0, 1024, 1024);
  ctx.save(); ctx.translate(C, C);
  ctx.strokeStyle = 'rgba(125,211,252,0.55)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, 0, 470, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 440, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 72; i++) { // marcas cada 5°
    const a = i * 5 * D2R, l = i % 18 === 0 ? 40 : i % 9 === 0 ? 26 : 12;
    ctx.beginPath(); ctx.moveTo(Math.sin(a) * 470, -Math.cos(a) * 470); ctx.lineTo(Math.sin(a) * (470 - l), -Math.cos(a) * (470 - l)); ctx.stroke();
  }
  // Puntas de la rosa. En el lienzo: arriba = Sur, derecha = Este (así se lee bien mirando hacia arriba)
  const point = (ang, len, wid, colA, colB) => {
    ctx.save(); ctx.rotate(ang);
    ctx.fillStyle = colA; ctx.beginPath(); ctx.moveTo(0, -len); ctx.lineTo(wid, 0); ctx.lineTo(0, 0); ctx.fill();
    ctx.fillStyle = colB; ctx.beginPath(); ctx.moveTo(0, -len); ctx.lineTo(-wid, 0); ctx.lineTo(0, 0); ctx.fill();
    ctx.restore();
  };
  for (let k = 0; k < 4; k++) point(Math.PI / 4 + k * Math.PI / 2, 270, 34, 'rgba(56,189,248,0.35)', 'rgba(14,116,144,0.35)');
  for (let k = 0; k < 4; k++) {
    const north = k === 2; // abajo del lienzo = Norte
    point(k * Math.PI / 2, 400, 52, north ? 'rgba(239,68,68,0.9)' : 'rgba(186,230,253,0.75)', north ? 'rgba(153,27,27,0.9)' : 'rgba(56,189,248,0.55)');
  }
  // Letras
  ctx.font = '800 76px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  // Cada letra se lee derecha cuando miras hacia ese punto cardinal (su parte de arriba apunta al centro)
  [[t.S, 0, -385, Math.PI], [t.E, 385, 0, -Math.PI / 2], [t.N, 0, 385, 0], [t.W, -385, 0, Math.PI / 2]].forEach(([s, x, y, rot]) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = s === t.N ? '#fecaca' : '#e0f2fe'; ctx.shadowColor = '#000'; ctx.shadowBlur = 12; ctx.fillText(s, 0, 0);
    ctx.restore();
  });
  ctx.shadowBlur = 0;
  // Logo en el centro
  ctx.fillStyle = 'rgba(3,7,18,0.85)'; ctx.strokeStyle = 'rgba(125,211,252,0.8)'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(0, 0, 150, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (roseLogo) { // recorte redondo hasta el círculo azul del logo
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 150, 0, Math.PI * 2); ctx.clip();
    const k = 300 / (LOGO_CIRCLE * Math.min(roseLogo.width, roseLogo.height));
    ctx.drawImage(roseLogo, -roseLogo.width * k / 2, -roseLogo.height * k / 2, roseLogo.width * k, roseLogo.height * k);
    ctx.restore();
  } else {
    ctx.fillStyle = '#e0f2fe'; ctx.font = '800 46px system-ui, sans-serif'; ctx.fillText('DARWIN', 0, -24);
    ctx.fillStyle = '#38bdf8'; ctx.fillText('CAOS', 0, 30);
  }
  ctx.restore();
  roseTex.needsUpdate = true;
}
{
  const img = new Image();
  img.onload = () => { roseLogo = img; drawRose(); };
  img.src = 'img/logo.png'; // pon aquí el logo del canal (PNG, idealmente cuadrado y con fondo transparente)
  const h = R.ground - 40, size = 2 * h * Math.tan(13 * D2R); // ~13° de radio alrededor del cenit
  const rose = new THREE.Mesh(new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({ map: roseTex, transparent: true, opacity: 0.85, depthWrite: false, depthTest: false, side: THREE.DoubleSide }));
  rose.position.y = h;
  rose.rotation.x = Math.PI / 2; // mira hacia abajo; el borde superior del lienzo queda al Sur
  rose.renderOrder = 10; // por encima de las líneas de constelaciones, para que el logo quede limpio
  roseGroup.add(rose);
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
// Insignia redonda para N/E/S/O (la N en rojo, como una brújula)
function cardinalBadge(letter, north) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = north ? 'rgba(185,28,28,0.92)' : 'rgba(8,15,30,0.88)';
  ctx.strokeStyle = north ? '#fecaca' : 'rgba(56,189,248,0.9)'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(64, 64, 56, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = '800 64px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(letter, 64, 68);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = screenSprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, sizeAttenuation: false }), north ? 38 : 32);
  sp.renderOrder = 63;
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
let DATA = null, DESC = {};
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
        float s = (3.4 + 11.0 * pow(0.66, mag + 1.5)) * uScale;
        vAlpha = clamp((uLimit - mag) / 1.2, 0.0, 1.0) * clamp(1.4 - (mag - 1.0) * 0.1, 0.65, 1.0) * uFade;
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
// Luna realista: relieve real (altimetría LOLA de la NASA) que proyecta sombras junto al terminador,
// reflectancia lunar (Lommel-Seeliger: el disco no se oscurece hacia el borde, como la Luna real)
// y «luz cenicienta» (la Tierra ilumina débilmente la parte oscura, más cuanto más fina es la fase).
function moonMaterial(map) {
  const bump = loadTex('img/planets/luna_relieve.jpg', false); // datos de altura, no color
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: map }, bump: { value: bump }, uLight: { value: new THREE.Vector3(1, 0, 0) }, uTexel: { value: new THREE.Vector2(1 / 2048, 1 / 1024) }, uRelief: { value: 3.2 }, uEarth: { value: 0.03 } },
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vE; varying vec3 vNo; varying vec3 vW;
      void main(){ vUv = uv; vec3 n = normalize(normal);
        vec3 e = normalize(cross(vec3(0.0, 1.0, 0.0), n) + vec3(1e-6, 0.0, 0.0)); vec3 no = cross(n, e);
        mat3 m = mat3(modelMatrix); vN = normalize(m * n); vE = normalize(m * e); vNo = normalize(m * no);
        vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform sampler2D map; uniform sampler2D bump; uniform vec3 uLight; uniform vec2 uTexel; uniform float uRelief; uniform float uEarth;
      varying vec2 vUv; varying vec3 vN; varying vec3 vE; varying vec3 vNo; varying vec3 vW;
      void main(){
        vec3 t = texture2D(map, vUv).rgb;
        float hx = texture2D(bump, vUv + vec2(uTexel.x, 0.0)).r - texture2D(bump, vUv - vec2(uTexel.x, 0.0)).r;
        float hy = texture2D(bump, vUv + vec2(0.0, uTexel.y)).r - texture2D(bump, vUv - vec2(0.0, uTexel.y)).r;
        vec3 n0 = normalize(vN);
        vec3 n = normalize(n0 + uRelief * (hx * vE - hy * vNo));
        vec3 v = normalize(cameraPosition - vW);
        float mu0 = max(dot(n, uLight), 0.0), mu = max(dot(n0, v), 0.05);
        float ls = 2.0 * mu0 / (mu0 + mu);             // Lommel-Seeliger
        float day = smoothstep(-0.02, 0.06, dot(n0, uLight)); // terminador nítido pero sin dientes de sierra
        vec3 col = t * (ls * 0.95 * day) + t * vec3(0.55, 0.65, 0.85) * uEarth * (1.0 - day);
        gl_FragColor = vec4(col, 1.0);
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
    const mat = b.id === 'sun' ? new THREE.MeshBasicMaterial({ map }) : b.id === 'moon' ? moonMaterial(map) : planetMaterial(map);
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
    if (b.id === 'moon') { const f = A.Illumination('Moon', date).phase_fraction; b.sphere.material.uniforms.uEarth.value = 0.012 + 0.07 * Math.pow(1 - f, 2); }
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

// ───────────── Satélites destacados (módulo satelites.js) ─────────────
const sunWorldDir = () => BODIES[0].holder.getWorldPosition(new THREE.Vector3()).normalize();
const SATS = createSatellites({ THREE, SAT, A, scene, radius: R.iss - 10, altAzVec, screenSprite, glowTex, makeLabel, place: () => S.place, sunDir: sunWorldDir, sunAltAt, lang: () => S.lang });
// Modelo 3D oficial de la NASA para la ISS (sustituye al dibujado en cuanto llega)
Promise.all([import('./vendor/addons/GLTFLoader.js'), import('./vendor/addons/libs/meshopt_decoder.module.js')]).then(([{ GLTFLoader }, { MeshoptDecoder }]) => new GLTFLoader()
  .setMeshoptDecoder(MeshoptDecoder)
  .load('img/satelites/iss.glb', gltf => {
    const obj = gltf.scene, b = new THREE.Box3().setFromObject(obj), size = b.getSize(new THREE.Vector3());
    obj.position.sub(b.getCenter(new THREE.Vector3()));
    obj.traverse(o => { if (o.isMesh && o.material?.map) { o.material.emissiveMap = o.material.map; o.material.emissive = new THREE.Color(0.22, 0.22, 0.22); } });
    const holder = new THREE.Group(); holder.add(obj); holder.scale.setScalar(1 / Math.max(size.x, size.y, size.z));
    ISS.scaled.remove(ISS.model); ISS.model = holder; ISS.scaled.add(holder);
  }, undefined, () => { /* nos quedamos con el modelo dibujado */ }));
const satEntry = s => ({ id: 'sat:' + s.id, kind: 'sat', ref: s, layer: s.tipo === 'starlink' ? 'starlink' : 'sats',
  names: [s.info.es, s.info.en, s.nombre].filter(Boolean), name: () => SATS.nameOf(s), sub: () => `🛰️ ${s.info.agencia || ''}`,
  world: () => (s.now ? altAzVec(s.now.az, s.now.alt, R.iss - 10) : null) });
function satEntries() {
  for (const s of SATS.list) {
    if (CATALOG.some(e => e.ref === s)) continue;
    CATALOG.push(satEntry(s));
  }
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
  drawRose();
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
const relatedOf = entry => FEED?.videosRelacionados?.[entry.id] || [];
function videoUrl(entry) {
  if (VIDEOS[entry.id]) return VIDEOS[entry.id];
  const q = entry.names[0].replace(/\s*\(.*\)/, '');
  return relatedOf(entry).length ? `${CHANNEL_URL}/search?query=${encodeURIComponent(q)}` : CHANNEL_URL; // sin vídeos sobre el tema → el canal
}
// Mini lista «▶ DarwinCaos sobre Júpiter» en la ficha: largos y shorts relacionados
function renderInfoVideos(entry) {
  const box = $('infoVideos'), list = relatedOf(entry).slice(0, 4);
  box.replaceChildren();
  if (!list.length) return;
  box.append(section(`▶ DarwinCaos · ${entry.name()}`));
  list.forEach(v => {
    const row = evRow({ img: v.miniatura, what: v.titulo, when: v.corto ? 'SHORT' : '', href: v.url });
    box.append(row);
  });
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
  } else if (entry.kind === 'sat') {
    const s = entry.ref, n = s.now, en = S.lang === 'en', date = simDate();
    const vis = SATS.visibility(n, date);
    const visTxt = { below: en ? 'Below the horizon' : 'Bajo el horizonte', shadow: en ? 'In Earth\'s shadow' : 'En la sombra de la Tierra', day: en ? 'Daylight: not visible' : 'De día: no se ve',
      eye: en ? '👁️ Visible to the naked eye' : '👁️ Se ve a simple vista', binoculars: en ? '🔭 With binoculars' : '🔭 Con prismáticos', telescope: en ? '🔭 Telescope only' : '🔭 Solo con telescopio' }[vis];
    if (n) {
      stats.push([en ? 'Now' : 'Ahora', visTxt]);
      if (n.mag != null && n.alt > 0 && vis !== 'day') stats.push([t.mag, `≈ ${fmtNum(n.mag, 1)}`]);
      stats.push([en ? 'Orbit height' : 'Altura de vuelo', `${fmtNum(n.height)} km`], [t.speed, `${fmtNum(n.speed)} km/h`], [en ? 'One orbit' : 'Una vuelta', n.period > 1200 ? (en ? '1 day (geostationary)' : '1 día (geoestacionario)') : `${fmtNum(n.period)} min`]);
    }
    if (s.lanzamiento) stats.push([en ? 'Launched' : 'Lanzamiento', new Date(s.lanzamiento + 'T12:00:00Z').toLocaleDateString(S.lang, { day: 'numeric', month: 'short', year: 'numeric' })]);
    else if (s.anio) stats.push([en ? 'Launched' : 'Lanzamiento', en ? `${s.anio} (launch #${s.lanzNo} of the year)` : `${s.anio} (lanzamiento nº ${s.lanzNo} del año)`]);
    if (s.tipo === 'starlink') stats.push([en ? 'Constellation' : 'Constelación', en ? `${fmtNum(SATS.starlinkCount())} Starlink in orbit` : `${fmtNum(SATS.starlinkCount())} Starlink en órbita`]);
    if (s.info.orbita === 'geo') stats.push([en ? 'In the sky' : 'En el cielo', en ? 'Always at the same spot' : 'Siempre en el mismo punto']);
    else if (s.path?.start && !s.path.now) stats.push([en ? 'Next pass' : 'Próximo paso', `${fmtTime(s.path.start)} · ${fmtNum(s.path.maxAlt)}°`]);
    else if (s.path?.now) stats.push([en ? 'Sets' : 'Se pone', fmtTime(s.path.end)]);
    const nv = SATS.nextVisiblePass(s, date, 36);
    if (s.info.orbita !== 'geo') stats.push([en ? 'Next naked-eye pass' : 'Próximo paso visible', nv ? `${fmtTime(nv.start)} · ${fmtNum(nv.maxAlt)}° ${azName(nv.maxAz)}` : (en ? 'None in 36 h' : 'Ninguno en 36 h')]);
    stats.push([en ? '3D model' : 'Modelo 3D', s.info.modelo ? `NASA${s.info.modeloNota ? ` (${s.info.modeloNota})` : ''}` : (en ? 'Approximate shape' : 'Forma aproximada')]);
    fact = s.info[en ? 'en_txt' : 'es_txt'];
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
  SATS.hidePath();
  S.selected = entry;
  if (entry.kind === 'sat') { entry.ref.now = SATS.lookAt(entry.ref, simDate()); entry.ref.path = SATS.showPath(entry.ref, simDate()); } // posición ya y su recorrido por el cielo
  closeModals();
  $('infoName').textContent = entry.name();
  $('infoType').textContent = entry.sub();
  refreshInfo();
  renderInfoText(entry);
  renderInfoVideos(entry);
  $('infoVideo').href = videoUrl(entry);
  $('infoObject').hidden = !canObject(entry);
  $('infoCal').hidden = !(entry.kind === 'iss' || (entry.kind === 'sat' && entry.ref.info.orbita !== 'geo'));
  $('infoCal').textContent = S.lang === 'en' ? '📅 Remind me' : '📅 Avisarme';
  $('infoObject').textContent = { moon: '🌕', mars: '🔴', sun: '☀️' }[entry.id] ? `${{ moon: '🌕', mars: '🔴', sun: '☀️' }[entry.id]} ${S.lang === 'en' ? 'Object' : 'Objeto'}` : (S.lang === 'en' ? '🛰️ View in 3D' : '🛰️ Ver en 3D');
  $('infoCard').classList.add('open');
  hideNewVideo();
  $('infoCard').scrollTop = 0; // siempre desde arriba (nombre visible)
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
  // Datos clave fijos de la ficha (diámetro, lunas, año…)
  const d = DESC[S.selected.id]?.[S.lang];
  $('infoKeyData').replaceChildren(...(d?.datos || []).map(([k, v]) => {
    const row = document.createElement('div'); const a = document.createElement('span'); a.textContent = k;
    const b = document.createElement('b'); b.textContent = v; row.append(a, b); return row;
  }));
  S.selected.shortFact = fact;
}
// Texto descriptivo: primer párrafo visible y el resto tras «Leer más»
// Mitología de las 88 constelaciones → fichas con «Leer más», como las de los planetas.
// Datos clave calculados: origen, estrella más brillante y mejor época para verla (cuando culmina hacia las 22 h).
function addMythology(MYTH) {
  if (!MYTH) return;
  const L = { es: ['Origen', 'Estrella más brillante', 'Mejor época para verla', 'hacia las 22 h'], en: ['Origin', 'Brightest star', 'Best time to see it', 'around 10 pm'] };
  for (const con of DATA.cons) {
    const my = MYTH[con.id];
    if (!my) continue;
    const ids = [...new Set(con.l.flat())];
    const bright = ids.reduce((a, b) => (DATA.stars[b][2] < DATA.stars[a][2] ? b : a), ids[0]);
    const nm = DATA.names.find(x => x[0] === bright);
    const c = con.center, ra = ((Math.atan2(c.x, c.z) * R2D + 360) % 360) / 15;
    const month = (8 + Math.round((ra + 2) / 2)) % 12; // culmina hacia las 22 h unos 2 meses por cada 4 h de ascensión recta
    const entry = {};
    for (const lg of ['es', 'en']) {
      const t = my[lg], mg = DATA.stars[bright][2].toLocaleString(lg, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
      const star = nm ? `${lg === 'en' ? nm[2] : nm[1]} (mag ${mg})` : `mag ${mg}`;
      const mon = new Date(2026, month, 15).toLocaleDateString(lg, { month: 'long' });
      entry[lg] = { datos: [[L[lg][0], t.origen], [L[lg][1], star], [L[lg][2], `${mon} · ${L[lg][3]}`]], texto: [t.mito, '✨ ' + t.curiosidad] };
    }
    DESC['c:' + con.id] = entry;
  }
}
function renderInfoText(entry) {
  const d = DESC[entry.id]?.[S.lang];
  const paras = d?.texto?.length ? d.texto : (entry.shortFact ? [entry.shortFact] : []);
  const box = $('infoText');
  box.replaceChildren(...paras.map((t, i) => { const p = document.createElement('p'); p.textContent = t; if (i > 0) p.hidden = true; return p; }));
  const more = $('infoMore');
  more.hidden = paras.length < 2 && !(d?.datos?.length);
  $('infoKeyData').hidden = true;
  more.textContent = T().readMore;
  more.onclick = () => {
    const open = more.dataset.open !== '1';
    more.dataset.open = open ? '1' : '';
    box.querySelectorAll('p').forEach((p, i) => { if (i > 0) p.hidden = !open; });
    $('infoKeyData').hidden = !open;
    more.textContent = open ? T().readLess : T().readMore;
  };
  more.dataset.open = '';
}
function closeInfo() { SATS.hidePath(); SATS.clearExtra(); S.selected = null; S.tracking = null; $('infoCard').classList.remove('open'); stopFinding(); updateViewOffset(); }
function startFinding(entry) {
  S.finding = entry; S.found = false;
  $('infoCard').classList.remove('open'); // la ficha se recoge en una pastilla para dejar ver el cielo
  $('findOpen').textContent = `🎯 ${entry.name()}`;
  $('findChip').classList.add('show');
  document.body.classList.add('finding');
  updateViewOffset();
}
function stopFinding() {
  S.finding = null;
  $('findChip').classList.remove('show'); $('finder').classList.remove('show', 'found');
  document.body.classList.remove('finding');
}
// En móvil la ficha ocupa la mitad inferior: subimos el centro de la vista para que el objeto quede visible.
function updateViewOffset() {
  const shift = S.selected && !S.finding && innerWidth < 900 ? Math.round(innerHeight * 0.22) : 0;
  if (shift) camera.setViewOffset(innerWidth, innerHeight, 0, shift, innerWidth, innerHeight); else camera.clearViewOffset();
  document.documentElement.style.setProperty('--cy', `calc(50% - ${shift}px)`);
}
// find: modo «Buscar» (pastilla + flecha). Se activa con «Apuntar» o siempre que se sigue el móvil (el cielo no puede girar solo).
function pointTo(entry, find = false) {
  const aa = entryAltAz(entry);
  if (!aa) return;
  if (aa.alt < 0) toast(`${entry.name()}: ${T().belowNow}`);
  if (find || (S.sensor && sensorReady)) startFinding(entry);
  if (S.sensor && sensorReady) return; // con el móvil, la flecha del centro guía hasta el objeto
  S.targetAz = aa.az; S.targetAlt = THREE.MathUtils.clamp(aa.alt, -85, 85);
  S.tracking = entry.kind === 'iss' || entry.kind === 'sat' ? entry : null; // la ISS y los satélites se mueven ~1°/s: los seguimos
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
  // Doble toque sobre la Luna → modo Objeto
  // (se compara con el sitio del primer toque: al abrirse la ficha el cielo se desplaza y la Luna ya no está bajo el dedo)
  if ((!best || best.kind === 'con') && S.layers.starlink) { const s = SATS.pickStarlink(x, y, camera); if (s) best = satEntry(s); } // un Starlink suelto (antes que la constelación de fondo)
  lastPick = { id: best?.id || null, entry: best, t: performance.now(), x, y };
  if (best) openInfo(best); else closeInfo();
}
let lastPick = { id: null, t: 0 };
// El segundo toque puede caer sobre la ficha que abrió el primero: se escucha en toda la pantalla
addEventListener('pointerup', e => {
  if (!canObject(lastPick.entry) || OBJ?.active) return;
  const dt = performance.now() - lastPick.t;
  if (dt < 40 || dt > 450 || Math.hypot(e.clientX - lastPick.x, e.clientY - lastPick.y) > 45) return;
  const entry = lastPick.entry;
  lastPick = { id: null, t: 0 };
  e.stopPropagation(); e.preventDefault();
  ptrs.clear(); gesture = null; // el cielo no llega a ver este toque
  enterObject(entry);
}, true);

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
    if (gesture.moved && (S.sensor || S.sensorPending) && !S.camera) { // el usuario quiere mover el cielo a mano
      const wasPending = S.sensorPending;
      S.sensorPending = false;
      if (S.sensor) setSensor(false); else $('btnSensor').classList.remove('active');
      Object.assign(gesture, { x: e.clientX, y: e.clientY, az: S.viewAz, alt: S.viewAlt });
      if (!wasPending) toast(T().manualMode);
      return;
    }
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
  if (gesture?.kind === 'drag' && !gesture.moved && S.sensorPending) setSensor(true); // iOS: primer toque = permiso
  else if (gesture?.kind === 'drag' && !gesture.moved && performance.now() - gesture.t < 400) pick(e.clientX, e.clientY);
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
// Volver a la vista inicial tras mover el cielo o hacer zoom
$('homeBtn').onclick = () => { S.tracking = null; S.targetAz = S.home.az; S.targetAlt = S.home.alt; setFov(62); };
function updateHomeBtn() {
  if (!S.home) return;
  const moved = Math.abs(((S.viewAz - S.home.az + 540) % 360) - 180) > 6 || Math.abs(S.viewAlt - S.home.alt) > 6 || Math.abs(S.fov - 62) > 1;
  $('homeBtn').classList.toggle('show', moved && !S.sensor && !S.selected && S.targetAz == null);
}
$('zoomIn').onclick = () => setFov(S.fov / 1.8);
$('zoomOut').onclick = () => setFov(S.fov * 1.8);

// Orientación del dispositivo → cuaternión (brújula absoluta en Android, webkitCompassHeading en iOS)
const sensorQ = new THREE.Quaternion();
let sensorReady = false, compassOffset = null;
const qBack = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
const zee = new THREE.Vector3(0, 0, 1), euler = new THREE.Euler(), qScreen = new THREE.Quaternion();
// Android/Chrome: «AbsoluteOrientationSensor» da directamente un cuaternión a 60 Hz respecto al Norte.
// Sin ángulos de Euler no hay bloqueo de cardán al sostener el móvil vertical (la causa de los «atascos»).
const qENUtoThree = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2); // Este-Norte-Arriba → escena
const qReading = new THREE.Quaternion();
let quatSensor = null, usingQuatSensor = false;
function startQuatSensor() {
  return new Promise(resolve => {
    if (!('AbsoluteOrientationSensor' in window)) return resolve(false);
    let done = false;
    const finish = ok => { if (!done) { done = true; resolve(ok); } };
    try {
      if (!quatSensor) {
        quatSensor = new AbsoluteOrientationSensor({ frequency: 60, referenceFrame: 'screen' });
        quatSensor.addEventListener('reading', () => {
          const q = quatSensor.quaternion;
          if (!q) return;
          qReading.set(q[0], q[1], q[2], q[3]);
          sensorQ.copy(qYaw.setFromAxisAngle(yAxis, -magDecl * D2R)).multiply(qENUtoThree).multiply(qReading); // norte geográfico; la cámara mira por la parte trasera (−z)
          usingQuatSensor = sensorReady = true;
          finish(true);
        });
        quatSensor.addEventListener('error', () => { usingQuatSensor = false; finish(false); });
      }
      quatSensor.start();
      setTimeout(() => finish(usingQuatSensor), 1200);
    } catch { finish(false); }
  });
}
let compassSamples = 0, compassOutliers = 0, lastOrient = null, compassRef = '';
const qRel = new THREE.Quaternion(), qYaw = new THREE.Quaternion(), vFwd = new THREE.Vector3(), vTop = new THREE.Vector3(), yAxis = new THREE.Vector3(0, 1, 0);
// Declinación magnética del lugar (modelo WMM): la brújula marca el norte magnético, el cielo usa el geográfico
let magDecl = 0;
function updateDeclination() { try { magDecl = window.Geomag ? window.Geomag.declination(S.place.lat, S.place.lon, new Date()) : 0; } catch { magDecl = 0; } }
function onOrientation(e) {
  if (usingQuatSensor || e.alpha == null) return;
  lastOrient = e;
  const orient = (screen.orientation?.angle ?? window.orientation ?? 0) * D2R;
  euler.set(e.beta * D2R, e.alpha * D2R, -e.gamma * D2R, 'YXZ');
  qRel.setFromEuler(euler).multiply(qBack).multiply(qScreen.setFromAxisAngle(zee, -orient));
  let yawOff = 0; // grados que hay que sumar al acimut para alinear con el norte geográfico
  if (typeof e.webkitCompassHeading === 'number') {
    // iOS: alpha es relativo. La brújula da el rumbo de la CÁMARA si el móvil está vertical y el de la PARTE DE ARRIBA si está plano.
    // Calculamos ese mismo rumbo con la orientación completa (no solo alpha: en vertical el giro se reparte entre alpha y gamma).
    vFwd.set(0, 0, -1).applyQuaternion(qRel); vTop.set(0, 1, 0).applyQuaternion(qRel);
    const hF = Math.hypot(vFwd.x, vFwd.z), hT = Math.hypot(vTop.x, vTop.z), ref = hF >= hT ? vFwd : vTop;
    compassRef = hF >= hT ? 'cámara' : 'parte de arriba';
    const h = e.webkitCompassHeading, acc = e.webkitCompassAccuracy;
    // Descartamos: brújula sin calibrar (−1), poca precisión y la zona ambigua (móvil inclinado ~45°)
    if (h >= 0 && !(acc < 0) && !(acc > 45) && Math.max(hF, hT) > 0.8) {
      const azRel = Math.atan2(ref.x, -ref.z) * R2D;
      const off = (((h - azRel) % 360) + 360) % 360;
      if (compassOffset == null) compassOffset = off;
      else {
        const diff = ((off - compassOffset + 540) % 360) - 180;
        if (Math.abs(diff) > 25) { // lectura suelta muy distinta: la ignoramos salvo que persista (recalibración real)
          if (++compassOutliers > 45) { compassOffset = off; compassOutliers = 0; }
        } else {
          compassOutliers = 0;
          compassOffset += diff * (compassSamples++ < 30 ? 0.15 : 0.03); // rápido al principio, luego muy suave
        }
      }
    }
    yawOff = (compassOffset ?? 0) + magDecl;
  } else if (e.absolute || e.type === 'deviceorientationabsolute') yawOff = magDecl; // Android: alpha ya es respecto al norte magnético
  // Girar el mundo alrededor de la vertical: +acimut = giro negativo sobre Y
  sensorQ.copy(qYaw.setFromAxisAngle(yAxis, -yawOff * D2R)).multiply(qRel);
  sensorReady = true;
}
let sensorBound = false;
async function enableSensor() {
  if (typeof DeviceOrientationEvent === 'undefined' && !('AbsoluteOrientationSensor' in window)) return false;
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    // iOS (y Chrome reciente) piden permiso. Solo abandonamos si el usuario lo deniega; si no llegan datos, setSensor lo detecta.
    try { if ((await DeviceOrientationEvent.requestPermission()) === 'denied') return false; } catch { /* seguimos intentándolo */ }
  }
  if (await startQuatSensor()) return true; // Android: sensor fino por cuaterniones
  if (!sensorBound) {
    sensorBound = true;
    // Android da el norte real en «deviceorientationabsolute»; iOS en «deviceorientation» + webkitCompassHeading.
    let gotAbsolute = false;
    addEventListener('deviceorientationabsolute', e => { if (e.alpha != null) { gotAbsolute = true; onOrientation(e); } });
    addEventListener('deviceorientation', e => { if (!gotAbsolute) onOrientation(e); });
  }
  return true;
}
let stream = null;
async function setSensor(on, silent = false) {
  S.sensorPending = false;
  if (on && !(await enableSensor())) { if (!silent) toast(T().sensorFail); on = false; }
  if (!on && S.camera) await setCamera(false);
  S.sensor = on;
  if (!on && quatSensor) { try { quatSensor.stop(); } catch { } usingQuatSensor = sensorReady = false; }
  if (!on) { const d = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion), aa = vecToAltAz(d); S.viewAz = aa.az; S.viewAlt = aa.alt; }
  $('btnSensor').classList.toggle('active', on);
  setTimeout(() => { if (S.sensor && !sensorReady) { if (!silent) toast(T().sensorFail); setSensor(false); } }, 4000);
}
// Al entrar, «Seguir el móvil» viene activado en móviles y tabletas.
// En iPhone el permiso exige un toque: el botón queda marcado y el primer toque en el cielo lo activa.
async function autoStartSensor() {
  if (!matchMedia('(pointer: coarse)').matches) return; // ordenador: sin sensores, modo manual
  // ¿Llegan ya datos de orientación sin pedir permiso? (Android) → activamos directamente
  const flowing = await new Promise(res => {
    const h = e => { if (e.alpha != null) { cleanup(); res(true); } };
    const cleanup = () => { removeEventListener('deviceorientation', h); removeEventListener('deviceorientationabsolute', h); };
    addEventListener('deviceorientation', h); addEventListener('deviceorientationabsolute', h);
    setTimeout(() => { cleanup(); res(false); }, 700);
  });
  if (flowing || 'AbsoluteOrientationSensor' in window) { S.sensorPending = false; return setSensor(true, true); }
  const needsTap = typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function';
  if (needsTap) {
    let granted = false;
    try { granted = (await DeviceOrientationEvent.requestPermission()) === 'granted'; } catch { /* iOS: hace falta un toque */ }
    if (!granted) { S.sensorPending = true; $('btnSensor').classList.add('active'); return; }
  }
  setSensor(true, true);
}
async function setCamera(on) {
  if (on) {
    // iOS solo concede el permiso de sensores dentro del toque: lo pedimos ANTES que la cámara
    const sensorReq = S.sensor ? null : setSensor(true);
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      $('cameraFeed').srcObject = stream;
      await sensorReq;
      setFov(62);
    } catch { toast(T().camFail); on = false; }
  } else if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
  S.camera = on;
  document.body.classList.toggle('camera', on);
  dome.visible = !on; ground.visible = !on;
  applyLayers();
  $('btnCamera').classList.toggle('active', on);
}
$('btnSensor').onclick = () => setSensor(S.sensorPending ? true : !S.sensor); // marcado pero pendiente (iOS) → activar
$('btnCamera').onclick = () => setCamera(!S.camera);

// ───────────── Interfaz ─────────────
let toastTimer;
function toast(msg) { const el = $('toast'); el.textContent = msg; el.style.opacity = 1; clearTimeout(toastTimer); toastTimer = setTimeout(() => (el.style.opacity = 0), 2600); }
const MODALS = { modalShot: 'dockShot', modalCal: 'dockCal', modalPlace: 'placeBtn', modalTime: 'timeBtn', modalSky: null, modalLayers: 'dockLayers', modalAbout: 'dockAbout' };
function closeModals() { Object.entries(MODALS).forEach(([m, b]) => { $(m).classList.remove('open'); if (b) $(b).classList.remove('active'); }); }
function toggleModal(id) {
  const open = $(id).classList.contains('open');
  closeModals();
  if (open) return;
  closeInfo();
  $(id).classList.add('open'); if (MODALS[id]) $(MODALS[id]).classList.add('active');
  if (id === 'modalSky') renderSkyList($('search').value);
  if (id === 'modalLayers') renderLayers();
  if (id === 'modalPlace') renderCities();
  if (id === 'modalCal') renderCal();
  if (id === 'modalAbout') paintInstall();
}
Object.entries(MODALS).forEach(([m, b]) => { if (b) $(b).onclick = () => toggleModal(m); });
document.querySelectorAll('.modal .close').forEach(b => (b.onclick = closeModals));
$('infoClose').onclick = closeInfo;
$('infoPoint').onclick = () => S.selected && pointTo(S.selected, true);
$('infoShare').onclick = () => share(S.selected);
$('subscribeBtn').href = `${CHANNEL_URL}?sub_confirmation=1`;

$('dockRed').onclick = () => { S.red = !S.red; applyRed(); persist(); };
// Pantalla limpia (sobre todo para móvil): oculta los menús; quedan la brújula y el botón ☰ para recuperarlos
$('dockClean').onclick = () => { closeModals(); document.body.classList.add('clean'); };
$('uiBtn').onclick = () => document.body.classList.remove('clean');
function applyRed() { document.body.classList.toggle('red', S.red); $('dockRed').classList.toggle('active', S.red); }
$('dockLang').onclick = () => { S.lang = S.lang === 'es' ? 'en' : 'es'; applyLanguage(); persist(); };
function applyLanguage() {
  SATS?.buildLabels();
  const t = T();
  document.documentElement.lang = S.lang;
  $('dockLang').textContent = S.lang.toUpperCase();
  $('appVersion').textContent = `${S.lang === 'en' ? 'Version' : 'Versión'} ${APP_VERSION}`;
  document.querySelectorAll('[data-i18n]').forEach(el => { const v = t[el.dataset.i18n]; if (v) el.textContent = v; });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t[el.dataset.i18nPh]; });
  document.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t[el.dataset.i18nTitle].replace(/^\S+\s/, ''); });
  if (DATA) { buildLabels(); applyLayers(); }
  if (S.selected) openInfo(S.selected);
  if ($('modalLayers').classList.contains('open')) renderLayers();
  if ($('modalSky').classList.contains('open')) renderSkyList($('search').value);
  if ($('modalCal')?.classList.contains('open')) renderCal();
}

// Capas
function applyLayers() {
  const L = S.layers;
  bodiesGroup.visible = L.planets; linesGroup.visible = L.lines; artGroup.visible = L.art; conNameGroup.visible = L.conNames;
  starNameGroup.visible = L.starNames; dsoGroup.visible = L.deep; eclipticGroup.visible = L.ecliptic; gridGroup.visible = L.grid;
  meteorGroup.visible = L.meteors;
  skylineGroup.visible = L.skyline && !S.camera; roseGroup.visible = L.rose;
}
function renderLayers() {
  const list = $('layerList'), t = T();
  list.replaceChildren();
  const q = document.createElement('div'); q.className = 'mini'; q.textContent = t.envTitle;
  const seg = document.createElement('div'); seg.className = 'chips';
  Object.entries(t.envOpts).forEach(([key, label]) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'chip' + (S.envMode === key ? ' on' : ''); b.textContent = label;
    b.onclick = () => { S.envMode = key; applyEnvironment(); persist(); renderLayers(); };
    seg.append(b);
  });
  const note = document.createElement('p'); note.className = 'note';
  note.textContent = S.place.env ? `${t.envDetected}: ${t.envNames[S.place.env]}${S.place.envInfo ? ` (${S.place.envInfo})` : ''}` : t.envDetecting;
  list.append(q, seg, note);
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
  b.onclick = () => { clearSearch(); openInfo(entry); pointTo(entry); };
  return b;
}
function section(title) { const d = document.createElement('div'); d.className = 'mini'; d.textContent = title; return d; }
function posText(aa) { return aa ? `${aa.alt >= 0 ? T().visibleNow : T().belowNow} · Alt ${fmtNum(aa.alt)}° · ${azName(aa.az)}` : ''; }
function renderSkyList(filter = '', list = $('skyList')) {
  const t = T(), q = fold(filter.trim());
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
// Tras elegir un resultado, el buscador se vacía: así al volver no queda un texto «huérfano» sin su lista
function clearSearch() { const f = $('search'); f.value = ''; f.blur(); }
// Si al tocar el buscador aún tiene texto, se vuelve a abrir su lista de resultados
$('search').addEventListener('focus', e => { if (e.target.value.trim() && !$('modalSky').classList.contains('open')) toggleModal('modalSky'); });
$('search').addEventListener('input', e => {
  const open = $('modalSky').classList.contains('open');
  if (!open && e.target.value.trim()) toggleModal('modalSky'); // borrar el texto no abre la lista
  else if (open) renderSkyList(e.target.value);
});
$('search').addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const q = fold(e.target.value.trim());
  if (!q) return;
  const hit = CATALOG.find(x => x.names.some(n => fold(n) === q)) || CATALOG.find(x => x.names.some(n => fold(n).includes(q)));
  if (hit) { clearSearch(); openInfo(hit); pointTo(hit); }
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
  S.place = { name: p.name, lat: p.lat, lon: p.lon, tz: p.tz, pop: p.pop, gps: p.gps, env: p.env, envInfo: p.envInfo };
  if (!S.place.env) detectEnvironment(S.place);
  observer = new A.Observer(p.lat, p.lon, 0);
  updateDeclination();
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
    cityResults = (data.results || []).map(r => ({ name: [...new Set([r.name, r.admin1, r.country].filter(Boolean))].join(', '), lat: r.latitude, lon: r.longitude, tz: r.timezone, pop: r.population || 0 }));
    if (cityResults[0]) setPlace(cityResults[0]);
  } catch { /* sin conexión */ }
  btn.textContent = T().search;
  renderCities();
}
$('cityBtn').onclick = () => searchCity($('cityInput').value.trim());
$('cityInput').addEventListener('keydown', e => { if (e.key === 'Enter') searchCity(e.target.value.trim()); });
// Nombre de la ciudad (y, sin coordenadas, ubicación aproximada por IP) con BigDataCloud, gratis y sin clave.
// ── Entorno automático ──
// Clasifica por la población de la localidad y, con GPS, por la distancia a su centro (lejos = campo/bosque).
const kmBetween = (a, b, c, d) => { const R6 = 6371, p1 = a * D2R, p2 = c * D2R, dl = (d - b) * D2R; return 2 * R6 * Math.asin(Math.sqrt(Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2)); };
const envFromPop = pop => (pop >= 30000 ? 'city' : pop >= 1500 ? 'town' : 'country');
async function detectEnvironment(place) {
  let env = null, info = '';
  try {
    let pop = place.pop, dist = 0;
    if (!pop || place.gps) { // buscamos la localidad para conocer su población y su centro
      const q = place.name.split(',')[0].replace(/\(.*\)/, '').trim();
      const data = JSON.parse(await fetchText(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=10&language=${S.lang}&format=json`));
      const near = (data.results || []).map(r => ({ r, d: kmBetween(place.lat, place.lon, r.latitude, r.longitude) })).filter(x => x.d < 40).sort((a, b) => a.d - b.d)[0];
      if (near) { pop = near.r.population || 0; dist = near.d; }
    }
    if (pop) {
      env = envFromPop(pop);
      info = `${fmtNum(pop)} ${T().inhabitants}`;
      const radius = 1 + Math.sqrt(pop) / 120; // radio aproximado del casco urbano en km
      if (place.gps && dist > radius * 1.3) { env = 'country'; info += ` · ${T().farFromTown}`; }
    } else if (place.gps) env = 'country';
  } catch { /* sin conexión: dejamos el entorno por defecto */ }
  if (place !== S.place) return; // el usuario cambió de lugar mientras tanto
  S.place.env = env || 'town';
  S.place.envInfo = info;
  persist();
  applyEnvironment();
  if ($('modalLayers').classList.contains('open')) renderLayers();
}
const currentEnv = () => (S.envMode === 'auto' ? S.place.env || 'town' : S.envMode);
function applyEnvironment() { setSkyline(currentEnv()); }

async function locate(lat, lon) {
  const q = lat != null ? `latitude=${lat}&longitude=${lon}&` : '';
  const j = JSON.parse(await fetchText(`https://api.bigdatacloud.net/data/reverse-geocode-client?${q}localityLanguage=${S.lang}`));
  const name = [j.city || j.locality, j.countryName].filter(Boolean).join(', ');
  return { lat: lat ?? j.latitude, lon: lon ?? j.longitude, name };
}
async function useApproxLocation(reason) {
  try {
    const r = await locate();
    if (r.lat == null) throw new Error('sin datos');
    setPlace({ name: `${r.name || T().myLocation} (${T().approx})`, lat: r.lat, lon: r.lon, tz: Intl.DateTimeFormat().resolvedOptions().timeZone });
    closeModals(); toast(`${reason} ${T().usedApprox}`);
  } catch { toast(`${reason} ${T().searchCityHint}`); }
}
// Pide la ubicación. Si iOS la tiene bloqueada (no llega ni a preguntar), explicamos cómo activarla.
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function showLocationHelp() {
  const h = $('locHelp');
  h.textContent = isIOS ? T().locHelpIOS : T().locHelpOther;
  h.hidden = false;
  if (!$('modalPlace').classList.contains('open')) toggleModal('modalPlace');
}
function requestLocation(quiet = false) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (!navigator.geolocation || !isSecureContext) return useApproxLocation(T().gpsFail + '.');
  $('locHelp').hidden = true;
  if (!quiet) toast(T().locating);
  navigator.geolocation.getCurrentPosition(async pos => {
    const { latitude: lat, longitude: lon } = pos.coords;
    let name = T().myLocation;
    try { const r = await locate(lat, lon); if (r.name) name = r.name; } catch { /* nos quedamos con «Mi ubicación» */ }
    setPlace({ name, lat, lon, tz, gps: true }); closeModals();
    toast(`📍 ${S.place.name}`);
  }, err => {
    if (err.code === 1 && !quiet) { showLocationHelp(); useApproxLocation(T().gpsDenied); return; } // permiso bloqueado: cómo activarlo
    useApproxLocation(err.code === 1 ? T().gpsDenied : T().gpsFail + '.');
  }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 600e3 });
}
$('geoBtn').onclick = () => requestLocation(false);

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

// ───────────── Calendario: «Esta noche» y «Eventos» ─────────────
// Lo astronómico se calcula aquí mismo (siempre exacto para tu ubicación); vídeos, lanzamientos y noticias
// llegan en data/eventos.json, que un robot de GitHub Actions actualiza cada 6 horas.
let FEED = null;
async function loadFeed() {
  try { FEED = await (await fetch(`data/eventos.json?t=${Math.floor(Date.now() / 600e3)}`)).json(); } catch { FEED = null; }
}
const CAL_TXT = {
  es: {
    day: 'De día', night: 'Esta noche', sunrise: 'Amanecer', sunset: 'Atardecer', dark: 'Noche cerrada', dawn: 'Fin de la noche',
    phases: ['Luna nueva', 'Cuarto creciente', 'Luna llena', 'Cuarto menguante'], lit: 'iluminada', moonRise: 'sale', moonSet: 'se pone',
    moonDay: 'La Luna se ve de día', from: 'de', to: 'a', best: 'mejor a las', towards: 'hacia el', high: 'altura',
    planetsNight: 'Planetas visibles', noPlanets: 'Esta noche no hay planetas bien situados.', telescope: 'con telescopio', binoculars: 'con prismáticos',
    sunSpots: 'El Sol: con un filtro solar homologado se pueden ver sus manchas. Nunca lo mires sin protección.',
    venusDay: 'Venus es tan brillante que, con el cielo muy limpio, puede verse de día. Usa «Apuntar» para localizarlo.',
    issNight: 'Pasos visibles de la ISS', noIss: 'Sin pasos visibles esta noche.', meteorsNight: 'Estrellas fugaces',
    constNight: 'Constelaciones altas a las', tapToSee: 'Toca para verlo en el cielo',
    latestNews: '📰 Últimas noticias', newVideos: '▶ Nuevo en DarwinCaos', thisWeek: 'esta semana', filters: { all: 'Todo', sky: '🔭 Cielo', launch: '🚀 Lanzamientos', video: '▶ Vídeos', news: '📰 Noticias' },
    supermoon: 'Superluna', eclipseL: 'Eclipse lunar', eclipseS: 'Eclipse solar', kinds: { penumbral: 'penumbral', partial: 'parcial', total: 'total', annular: 'anular' },
    visibleHere: 'visible desde tu ubicación', notVisibleHere: 'no visible desde tu ubicación', covered: 'del Sol tapado',
    opposition: 'Oposición de', oppMore: 'el mejor momento del año para verlo: más cerca, más brillante y visible toda la noche',
    elong: 'Máxima elongación de', morning: 'al amanecer', evening: 'al anochecer', elongMore: 'el mejor momento para verlo, alejado del resplandor del Sol',
    moonNear: 'La Luna pasa junto a', conj: 'Conjunción de', and: 'y', sep: 'separación', peakOf: 'Pico de las', perHour: 'meteoros/h en cielo oscuro',
    seasons: { mar: 'Equinoccio', jun: 'Solsticio', sep: 'Equinoccio', dec: 'Solsticio' }, seasonNames: { spring: 'de primavera', summer: 'de verano', autumn: 'de otoño', winter: 'de invierno' },
    launch: 'Lanzamiento', noFeed: 'Vídeos y lanzamientos no disponibles ahora mismo.', updated: 'Actualizado',
    empty: 'No hay eventos en este filtro.', calculating: 'Calculando eventos del cielo…', goTo: 'Ver en el cielo', liveAt: 'Mostrando el cielo del',
  },
  en: {
    day: 'Daytime', night: 'Tonight', sunrise: 'Sunrise', sunset: 'Sunset', dark: 'Full darkness', dawn: 'Night ends',
    phases: ['New Moon', 'First quarter', 'Full Moon', 'Last quarter'], lit: 'illuminated', moonRise: 'rises', moonSet: 'sets',
    moonDay: 'The Moon is visible in daylight', from: 'from', to: 'to', best: 'best at', towards: 'towards', high: 'altitude',
    planetsNight: 'Visible planets', noPlanets: 'No well-placed planets tonight.', telescope: 'telescope', binoculars: 'binoculars',
    sunSpots: 'The Sun: with a certified solar filter you can see sunspots. Never look without protection.',
    venusDay: 'Venus is so bright that, with a very clear sky, it can be seen in daylight. Use “Point” to find it.',
    issNight: 'Visible ISS passes', noIss: 'No visible passes tonight.', meteorsNight: 'Shooting stars',
    constNight: 'Constellations high at', tapToSee: 'Tap to see it in the sky',
    latestNews: '📰 Latest news', newVideos: '▶ New on DarwinCaos', thisWeek: 'this week', filters: { all: 'All', sky: '🔭 Sky', launch: '🚀 Launches', video: '▶ Videos', news: '📰 News' },
    supermoon: 'Supermoon', eclipseL: 'Lunar eclipse', eclipseS: 'Solar eclipse', kinds: { penumbral: 'penumbral', partial: 'partial', total: 'total', annular: 'annular' },
    visibleHere: 'visible from your location', notVisibleHere: 'not visible from your location', covered: 'of the Sun covered',
    opposition: 'Opposition of', oppMore: 'the best time of the year to see it: closest, brightest and up all night',
    elong: 'Greatest elongation of', morning: 'at dawn', evening: 'at dusk', elongMore: 'the best time to see it, away from the Sun’s glare',
    moonNear: 'The Moon passes near', conj: 'Conjunction of', and: 'and', sep: 'separation', peakOf: 'Peak of the', perHour: 'meteors/h under dark skies',
    seasons: { mar: 'Equinox', jun: 'Solstice', sep: 'Equinox', dec: 'Solstice' }, seasonNames: { spring: '(spring)', summer: '(summer)', autumn: '(autumn)', winter: '(winter)' },
    launch: 'Launch', noFeed: 'Videos and launches unavailable right now.', updated: 'Updated',
    empty: 'No events for this filter.', calculating: 'Calculating sky events…', goTo: 'See in the sky', liveAt: 'Showing the sky on',
  },
};
const CT = () => CAL_TXT[S.lang];
S.calTab = 'now'; S.calFilter = 'all';
const bodyEntry = id => CATALOG.find(e => e.id === id);
const fmtDay = d => d.toLocaleDateString(S.lang, { weekday: 'short', day: 'numeric', month: 'short', ...tzOpt() });
const fmtHM = d => (d ? d.toLocaleTimeString(S.lang, { hour: '2-digit', minute: '2-digit', ...tzOpt() }) : '—');
const altAzAt = (body, date) => { const eq = A.Equator(body, date, observer, true, true); return A.Horizon(date, observer, eq.ra, eq.dec, 'normal'); };
const tryTime = f => { try { return f()?.date || null; } catch { return null; } };

// Viajar a un momento y apuntar a un objeto (desde el calendario)
function goToEvent(id, time) {
  closeModals();
  if (time) { setOffset(+time - Date.now()); updateSkyMatrix(simDate(), true); updateBodies(simDate(), true); toast(`${CT().liveAt} ${fmtDay(time)} ${fmtHM(time)} · 🕒 ${T().now}`); }
  if (S.sensor) setSensor(false);
  const e = id && bodyEntry(id);
  if (e) { openInfo(e); pointTo(e); }
}

const ytSmall = u => (u || '').replace(/\/(hq|sd|maxres)default\.jpg/, '/mqdefault.jpg'); // 320×180 en vez de 480×360
// Vídeo del canal para un evento: por tema («perseidas», «starship»…) o por astro («obj:mars»)
function topicVideo(topic) {
  if (!topic || !FEED) return null;
  if (topic.startsWith('obj:')) return relatedOf({ id: topic.slice(4) })[0] || null;
  return FEED.videosTemas?.[topic] || null;
}
function evRow({ ico, when, what, more, onClick, href, img, hl, box: thumbBox, video, cal }) {
  const el = document.createElement(href ? 'a' : onClick ? 'button' : 'div');
  el.className = 'ev' + (hl ? ' hl' : '');
  if (href) { el.href = href; el.target = '_blank'; el.rel = 'noopener'; }
  if (onClick) { el.type = 'button'; el.onclick = onClick; }
  const icoEl = () => Object.assign(document.createElement('span'), { className: 'ico' + (thumbBox || img ? ' thumb' : ''), textContent: ico || '▶' });
  if (img) { const i = document.createElement('img'); i.alt = ''; i.decoding = 'async'; i.width = 192; i.height = 108; i.src = ytSmall(img); i.onerror = () => i.replaceWith(icoEl()); el.append(i); }
  else el.append(icoEl()); // sin imagen: el icono ocupa el mismo recuadro que una miniatura (box)
  const box = document.createElement('div');
  for (const [cls, txt] of [['when', when], ['what', what], ['more', more]]) if (txt) { const d = document.createElement('div'); d.className = cls; d.textContent = txt; box.append(d); }
  if (cal) { // «📅 Añadir»: lo guarda en el calendario del móvil, con aviso previo
    const b = document.createElement('button'); b.type = 'button'; b.className = 'vchip calchip';
    b.textContent = `📅 ${S.lang === 'en' ? 'Add to calendar' : 'Añadir al calendario'}`;
    b.onclick = ev => { ev.preventDefault(); ev.stopPropagation(); addToCalendar(cal); };
    box.append(b);
  }
  if (video) { // «▶ Ver vídeo» del canal, sin abrir el evento
    const b = document.createElement('button'); b.type = 'button'; b.className = 'vchip';
    b.textContent = `▶ ${S.lang === 'en' ? 'Watch video' : 'Ver vídeo'}`; b.title = video.titulo;
    b.onclick = ev => { ev.preventDefault(); ev.stopPropagation(); window.open(video.url, '_blank', 'noopener'); };
    box.append(b);
  }
  el.append(box);
  return el;
}

// ── Esta noche ──
function computeTonight() {
  const now = simDate(), out = { day: [], night: [] };
  const sunNow = altAzAt('Sun', now).altitude;
  // Ventana de noche: la próxima (si es de día) o la actual (si ya es de noche)
  const nightStart = sunNow > -1 ? tryTime(() => A.SearchRiseSet('Sun', observer, -1, now, 1)) : tryTime(() => A.SearchRiseSet('Sun', observer, -1, new Date(+now - 864e5), 1));
  const nightEnd = nightStart && tryTime(() => A.SearchRiseSet('Sun', observer, +1, nightStart, 1));
  const dark = nightStart && tryTime(() => A.SearchAltitude('Sun', observer, -1, nightStart, 1, -18));
  const dawn = dark && tryTime(() => A.SearchAltitude('Sun', observer, +1, dark, 1, -18));
  const dayStart = tryTime(() => A.SearchRiseSet('Sun', observer, +1, new Date(+(nightStart || now) - 864e5), 1));
  out.sun = { rise: dayStart, set: nightStart, dark, dawn, end: nightEnd };

  // Luna
  const ph = A.MoonPhase(now), illum = A.Illumination('Moon', now).phase_fraction;
  const phaseIdx = Math.round(ph / 90) % 4;
  const exact = Math.min(Math.abs(ph - phaseIdx * 90), 360 - Math.abs(ph - phaseIdx * 90)) < 12;
  const phaseName = exact ? CT().phases[phaseIdx] : (ph < 180 ? (S.lang === 'en' ? 'Waxing' : 'Creciente') : (S.lang === 'en' ? 'Waning' : 'Menguante'));
  const mRise = tryTime(() => A.SearchRiseSet('Moon', observer, +1, new Date(+(nightStart || now) - 6 * 3600e3), 1.2));
  const mSet = tryTime(() => A.SearchRiseSet('Moon', observer, -1, new Date(+(nightStart || now) - 6 * 3600e3), 1.2));
  out.moon = { name: phaseName, illum, rise: mRise, set: mSet, ph };

  // Planetas: muestreo cada 10 min durante la noche
  if (nightStart && nightEnd) {
    for (const b of BODIES.filter(b => !['sun', 'moon', 'pluto'].includes(b.id))) {
      let best = null, first = null, last = null;
      for (let t = +nightStart; t <= +nightEnd; t += 600e3) {
        const d = new Date(t), sunAlt = altAzAt('Sun', d).altitude;
        if (sunAlt > -8) continue;
        const h = altAzAt(b.body, d);
        if (h.altitude > 8) { first ??= d; last = d; if (!best || h.altitude > best.alt) best = { t: d, alt: h.altitude, az: h.azimuth }; }
      }
      if (best) {
        const mag = A.Illumination(b.body, best.t).mag;
        out.night.push({ kind: 'planet', b, best, first, last, mag });
      }
    }
  }
  // De día: Luna diurna y Venus
  if (dayStart && nightStart && dayStart < nightStart) {
    let mFirst = null, mLast = null;
    for (let t = +dayStart + 1800e3; t < +nightStart - 1800e3; t += 900e3) { const d = new Date(t); if (altAzAt('Moon', d).altitude > 10) { mFirst ??= d; mLast = d; } }
    if (mFirst && illum > 0.15) out.day.push({ kind: 'moonDay', from: mFirst, to: mLast });
    const venusMag = A.Illumination('Venus', now).mag, venusEl = A.Elongation('Venus', now).elongation;
    if (venusMag < -4.2 && venusEl > 25) out.day.push({ kind: 'venusDay' });
  }
  out.day.push({ kind: 'sunSpots' });
  // ISS, lluvias y constelaciones
  out.iss = ISS.status === 'ok' && nightStart ? issPasses().filter(p => p.visible && p.start < new Date(+nightEnd + 3600e3) && p.end > new Date(+nightStart - 3600e3)).slice(0, 4) : null;
  out.shower = showerStatus(now);
  const tC = new Date(+(dark || nightStart || now) + 2 * 3600e3);
  out.constTime = tC;
  out.consts = DATA.cons.map(con => {
    const c = con.center, ra = ((Math.atan2(c.x, c.z) * R2D + 360) % 360) / 15, dec = Math.asin(c.y) * R2D;
    return { con, alt: A.Horizon(tC, observer, ra, dec).altitude };
  }).filter(x => x.alt > 40 && x.con.art).sort((a, b) => b.alt - a.alt).slice(0, 6);
  return out;
}
// ───────────── Añadir al calendario (archivo .ics estándar: iPhone, Android y ordenador) ─────────────
// El aviso lo da el calendario del propio móvil: alertas sin necesidad de servidor.
// Enlace que abre la app justo en lo guardado: ese astro/satélite, a esa hora y desde ese lugar
function deepLink(objId, time) {
  const u = new URL(location.href.split('?')[0]);
  u.searchParams.set('lat', S.place.lat.toFixed(4)); u.searchParams.set('lon', S.place.lon.toFixed(4)); u.searchParams.set('name', S.place.name);
  if (S.place.tz) u.searchParams.set('tz', S.place.tz);
  if (objId) u.searchParams.set('obj', objId);
  if (time) u.searchParams.set('t', new Date(time).toISOString());
  u.searchParams.set('lang', S.lang);
  return u.toString();
}
function addToCalendar({ title, start, end, desc = '', alarm = 15, link }) {
  link ||= deepLink(null, start);
  const ics = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = t => String(t).replace(/\\/g, '\\\\').replace(/[,;]/g, m => '\\' + m).replace(/\n/g, '\\n');
  const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//DarwinCaos//Planetarium//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
    `UID:${+start}-${Math.random().toString(36).slice(2)}@planetario-darwincaos`, `DTSTAMP:${ics(new Date())}`, `DTSTART:${ics(start)}`, `DTEND:${ics(end || new Date(+start + 30 * 60e3))}`,
    `SUMMARY:${esc(title)}`, `DESCRIPTION:${esc(`${desc}${desc ? '\n\n' : ''}${S.lang === 'en' ? 'See it in Planetarium by DarwinCaos' : 'Míralo en el Planetarium by DarwinCaos'}: ${link}`)}`, `URL:${link}`, `LOCATION:${esc(S.place.name)}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(title)}`, `TRIGGER:-PT${alarm}M`, 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  if (isIOS) { location.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(body); return; } // Safari abre «Añadir al calendario»
  const url = URL.createObjectURL(new Blob([body], { type: 'text/calendar;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: `${title.replace(/[^\p{L}\p{N} ]+/gu, '').trim().slice(0, 40) || 'evento'}.ics` });
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 15000);
  toast(S.lang === 'en' ? 'Open the downloaded file to add it to your calendar' : 'Abre el archivo descargado para añadirlo a tu calendario');
}

// ───────────── «¿Se verá esta noche?»: previsión de nubes (Open-Meteo, gratis) + Luna + oscuridad ─────────────
const WX = { key: '', hourly: null, at: 0 };
async function loadWeather() {
  const key = `${S.place.lat.toFixed(2)},${S.place.lon.toFixed(2)}`;
  if (WX.key === key && WX.hourly && Date.now() - WX.at < 3600e3) return WX.hourly;
  const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${S.place.lat.toFixed(3)}&longitude=${S.place.lon.toFixed(3)}&hourly=cloud_cover,precipitation_probability&forecast_days=7&timezone=GMT`);
  if (!r.ok) throw new Error(r.status);
  const j = await r.json();
  Object.assign(WX, { key, hourly: j.hourly, at: Date.now() });
  return j.hourly;
}
function nightForecast(hourly, n) {
  const from = n.sun.set, to = n.sun.end;
  if (!from || !to) return null;
  const hours = [];
  hourly.time.forEach((t, i) => {
    const d = new Date(t + 'Z');
    if (d < new Date(+from - 1800e3) || d > to) return;
    const moonAlt = altAzAt('Moon', d).altitude, sunAlt = altAzAt('Sun', d).altitude;
    hours.push({ d, cloud: hourly.cloud_cover[i], rain: hourly.precipitation_probability?.[i] ?? 0, moonUp: moonAlt > 0, dark: sunAlt < -12 });
  });
  if (hours.length < 3) return null; // fecha fuera de la previsión
  const dark = hours.filter(h => h.dark), pool = dark.length ? dark : hours;
  const good = h => h.cloud <= 30 && h.rain < 30;
  const nGood = pool.filter(good).length, avg = pool.reduce((a, h) => a + h.cloud, 0) / pool.length;
  // Mejor tramo: la racha más larga de horas despejadas (y, a igualdad, sin Luna)
  let best = null, cur = null;
  for (const h of pool) {
    if (good(h)) { cur ||= { from: h.d, to: h.d, n: 0, moon: 0 }; cur.to = h.d; cur.n++; cur.moon += h.moonUp ? 1 : 0; if (!best || cur.n > best.n || (cur.n === best.n && cur.moon < best.moon)) best = { ...cur }; }
    else cur = null;
  }
  const level = nGood / pool.length >= 0.7 ? 'good' : nGood >= 2 ? 'mixed' : 'bad';
  return { hours, level, avg, best, rainy: pool.some(h => h.rain >= 50) };
}
function renderWeather(card, n) {
  const en = S.lang === 'en';
  card.replaceChildren(Object.assign(document.createElement('p'), { className: 'note', textContent: en ? 'Checking the cloud forecast…' : 'Consultando la previsión de nubes…' }));
  loadWeather().then(hourly => {
    const f = nightForecast(hourly, n);
    card.replaceChildren();
    if (!f) { card.append(Object.assign(document.createElement('p'), { className: 'note', textContent: en ? 'No cloud forecast for this date (only the next 7 days).' : 'No hay previsión de nubes para esta fecha (solo los próximos 7 días).' })); return; }
    const moonIllum = n.moon.illum, moonTxt = moonIllum > 0.5 ? (en ? `a bright Moon (${fmtNum(moonIllum * 100)} %) will wash out faint stars while it is up` : `la Luna (${fmtNum(moonIllum * 100)} %) aclarará el cielo mientras esté arriba`) : (en ? 'little moonlight' : 'apenas habrá luz de Luna');
    const head = { good: en ? '🟢 Good night for stargazing' : '🟢 Buena noche para observar', mixed: en ? '🟡 Some clear spells' : '🟡 Habrá claros', bad: f.rainy ? (en ? '🔴 Rain likely' : '🔴 Probable lluvia') : (en ? '🔴 Cloudy night' : '🔴 Noche nublada') }[f.level];
    const h = document.createElement('div'); h.className = 'wxHead'; h.textContent = head;
    const sub = document.createElement('p'); sub.className = 'note';
    sub.textContent = (f.best ? (en ? `Best time: ${fmtHM(f.best.from)}–${fmtHM(new Date(+f.best.to + 3600e3))}` : `Mejor momento: ${fmtHM(f.best.from)}–${fmtHM(new Date(+f.best.to + 3600e3))}`) + (f.best.moon === 0 ? (en ? ' (no Moon)' : ' (sin Luna)') : '') + ' · ' : '')
      + (en ? `clouds ${fmtNum(f.avg)} % on average · ${moonTxt}.` : `nubes ${fmtNum(f.avg)} % de media · ${moonTxt}.`);
    // Hora a hora con iconos que se entienden solos: ✨ despejado · ⛅ algunas nubes · ☁️ cubierto · 🌧️ lluvia; 🌙 = Luna en el cielo
    const lab = document.createElement('div'); lab.className = 'mini'; lab.textContent = en ? 'Hour by hour tonight' : 'Hora a hora esta noche';
    const strip = document.createElement('div'); strip.className = 'wxStrip';
    f.hours.forEach(x => {
      const kind = x.rain >= 50 ? 'r' : x.cloud <= 30 ? 'g' : x.cloud <= 65 ? 'm' : 'b';
      const c = document.createElement('div'); c.className = 'wxH ' + kind;
      c.title = `${fmtHM(x.d)} · ${en ? 'clouds' : 'nubes'} ${x.cloud} %`;
      c.innerHTML = `<i>${x.moonUp ? '🌙' : ''}</i><b>${{ g: '✨', m: '⛅', b: '☁️', r: '🌧️' }[kind]}</b><small>${fmtHM(x.d).slice(0, 2)}h</small>`;
      strip.append(c);
    });
    const legend = document.createElement('p'); legend.className = 'note wxLegend';
    legend.textContent = en ? '✨ clear · ⛅ some clouds · ☁️ overcast · 🌧️ rain · 🌙 Moon up (brightens the sky) — forecast: Open-Meteo'
      : '✨ despejado · ⛅ algunas nubes · ☁️ cubierto · 🌧️ lluvia · 🌙 Luna en el cielo (aclara el cielo) — previsión: Open-Meteo';
    card.append(h, sub, lab, strip, legend);
  }).catch(() => { card.replaceChildren(Object.assign(document.createElement('p'), { className: 'note', textContent: en ? 'Cloud forecast unavailable (no connection?).' : 'Previsión de nubes no disponible (¿sin conexión?).' })); });
}

function renderTonight(box) {
  const t = T(), c = CT(), n = computeTonight();
  const head = document.createElement('div'); head.className = 'sunbar';
  for (const [k, v] of [[c.sunset, fmtHM(n.sun.set)], [c.dark, fmtHM(n.sun.dark)], [c.sunrise, fmtHM(n.sun.end)]]) {
    const d = document.createElement('div'); d.className = 'stat';
    const sm = document.createElement('small'); sm.textContent = k; const b = document.createElement('b'); b.textContent = v; d.append(sm, b); head.append(d);
  }
  box.append(section('🌙 ' + c.night + ' · ' + S.place.name), head);
  // ¿Se verá esta noche?
  const wx = document.createElement('div'); wx.className = 'wxCard';
  box.append(section(S.lang === 'en' ? '🌤️ Will it be clear tonight?' : '🌤️ ¿Se verá esta noche?'), wx);
  renderWeather(wx, n);
  // Luna
  const moonE = bodyEntry('moon');
  box.append(evRow({ ico: n.moon.ph < 180 ? '🌒' : '🌘', what: `${n.moon.name} · ${fmtNum(n.moon.illum * 100)} % ${c.lit}`,
    more: `${c.moonRise} ${fmtHM(n.moon.rise)} · ${c.moonSet} ${fmtHM(n.moon.set)}`, onClick: () => goToEvent('moon', n.moon.rise && n.moon.rise > simDate() ? new Date(+n.moon.rise + 3600e3) : null) }));
  // Planetas
  box.append(section('🪐 ' + c.planetsNight));
  if (!n.night.length) { const p = document.createElement('p'); p.className = 'note'; p.textContent = c.noPlanets; box.append(p); }
  n.night.sort((a, b) => a.mag - b.mag).forEach(({ b, best, first, last, mag }) => {
    const aid = mag > 6 ? ` · ${c.telescope}` : mag > 5 ? ` · ${c.binoculars}` : '';
    box.append(evRow({ ico: '🪐', what: bodyName(b), when: +last - +first < 1800e3 ? `${S.lang === 'en' ? 'around' : 'hacia las'} ${fmtHM(best.t)}` : `${c.from} ${fmtHM(first)} ${c.to} ${fmtHM(last)}`,
      more: `${c.best} ${fmtHM(best.t)} · ${c.towards} ${azName(best.az)} · ${c.high} ${fmtNum(best.alt)}° · mag ${fmtNum(mag, 1)}${aid}`, onClick: () => goToEvent(b.id, best.t) }));
  });
  // ISS
  box.append(section('🛰️ ' + c.issNight));
  if (n.iss === null) { const p = document.createElement('p'); p.className = 'note'; p.textContent = ISS.status === 'loading' ? t.issLoading : t.issOffline; box.append(p); }
  else if (!n.iss.length) { const p = document.createElement('p'); p.className = 'note'; p.textContent = c.noIss; box.append(p); }
  else n.iss.forEach(p => box.append(evRow({ ico: '🛰️', what: `${fmtHM(p.start)} → ${fmtHM(p.end)}`, more: `${c.high} ${fmtNum(p.maxAlt)}° ${c.towards} ${azName(p.maxAz)}`, onClick: () => goToEvent('iss', p.maxTime),
    cal: { title: S.lang === 'en' ? '🛰️ ISS visible' : '🛰️ La ISS pasa sobre ti', start: p.start, end: p.end, desc: `${c.high} ${fmtNum(p.maxAlt)}° ${c.towards} ${azName(p.maxAz)} (${fmtHM(p.maxTime)})`, alarm: 10, link: deepLink('iss', p.maxTime) } })));
  // Lluvias
  const sh = n.shower, shName = s => (S.lang === 'en' ? s.en : s.es);
  box.append(section('☄️ ' + c.meteorsNight));
  box.append(evRow({ ico: '☄️', what: sh.active && sh.active.zhrNow > 2 ? `${shName(sh.active.sh)} · ~${fmtNum(sh.active.zhrNow)}/h` : t.sporadic,
    more: sh.next ? `${t.nextShower}: ${shName(sh.next.sh)} · ${fmtDay(sh.next.peak)}` : '' }));
  // Constelaciones
  if (n.consts.length) {
    box.append(section(`⭐ ${c.constNight} ${fmtHM(n.constTime)}`));
    const chips = document.createElement('div'); chips.className = 'chips';
    n.consts.forEach(({ con }) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = S.lang === 'en' ? con.en : con.es; b.onclick = () => goToEvent('c:' + con.id, n.constTime); chips.append(b); });
    box.append(chips);
  }
  // De día
  box.append(section('☀️ ' + c.day + ` · ${c.sunrise} ${fmtHM(n.sun.rise)} · ${c.sunset} ${fmtHM(n.sun.set)}`));
  n.day.forEach(d => {
    if (d.kind === 'moonDay') box.append(evRow({ ico: '🌗', what: c.moonDay, more: `${c.from} ${fmtHM(d.from)} ${c.to} ${fmtHM(d.to)}`, onClick: () => goToEvent('moon', d.from) }));
    if (d.kind === 'venusDay') box.append(evRow({ ico: '✨', what: 'Venus', more: c.venusDay, onClick: () => goToEvent('venus', null) }));
    if (d.kind === 'sunSpots') box.append(evRow({ ico: '☀️', what: bodyName(BODIES[0]), more: c.sunSpots }));
  });
}

// ── Eventos ──
// El cálculo es pesado (≈1 s en móvil): se hace por trozos, cediendo el control al navegador
// para que la ventana nunca se congele, se guarda en caché (memoria + localStorage) y se adelanta en segundo plano.
const EV_STORE = 'dc_eventos_cache_v3', EV_DAYS = 61; // dos meses vista
let eventsCache = { key: '', items: null }, eventsJob = null;
function eventsKey() { const d = new Date(simDate()); d.setHours(0, 0, 0, 0); return `${S.place.lat.toFixed(2)},${S.place.lon.toFixed(2)},${d.toDateString()},${S.lang}`; }
function eventsReady() { return eventsCache.key === eventsKey() ? eventsCache.items : null; }
function loadEventsStore(key) {
  try {
    const st = JSON.parse(localStorage.getItem(EV_STORE) || 'null');
    if (!st || st.key !== key) return null;
    return st.items.map(e => ({ ...e, date: new Date(e.date), action: e.action ? { ...e.action, time: e.action.time ? new Date(e.action.time) : null } : null }));
  } catch { return null; }
}
function getSkyEvents() { // promesa con los eventos; reutiliza el cálculo en curso
  const key = eventsKey();
  if (eventsCache.key === key) return Promise.resolve(eventsCache.items);
  const stored = loadEventsStore(key);
  if (stored) { eventsCache = { key, items: stored }; return Promise.resolve(stored); }
  if (eventsJob?.key === key) return eventsJob.promise;
  const job = { key };
  eventsJob = job; // se registra ANTES de empezar: un cálculo viejo se cancela, el nuevo nunca
  const promise = job.promise = computeSkyEvents(job).then(items => {
    if (eventsJob === job) eventsJob = null;
    eventsCache = { key, items };
    try { localStorage.setItem(EV_STORE, JSON.stringify({ key, items })); } catch { }
    return items;
  }, err => { if (eventsJob === job) eventsJob = null; throw err; });
  return promise;
}
async function computeSkyEvents(job) {
  let slice = performance.now();
  const breathe = async () => { if (performance.now() - slice > 8) { await new Promise(r => setTimeout(r, 0)); slice = performance.now(); } if (eventsJob !== job) throw new Error('cancelado'); };
  const start = new Date(simDate()); start.setHours(0, 0, 0, 0);
  const c = CT(), end = new Date(+start + EV_DAYS * 864e5), far = end, items = [];
  const push = (date, ico, what, more, action, hl, topic) => { if (date >= start && date <= far) items.push({ date, cat: 'sky', ico, what, more, action, hl, topic }); };
  const pname = id => bodyName(BODIES.find(b => b.id === id));
  try { // Fases de la Luna y superlunas
    let q = A.SearchMoonQuarter(start);
    while (q.time.date < end) {
      let what = c.phases[q.quarter], hl = false;
      if (q.quarter === 2) { const v = A.GeoMoon(q.time), km = Math.hypot(v.x, v.y, v.z) * 149597870.7; if (km < 360000) { what = `${c.supermoon} · ${what}`; hl = true; } }
      push(q.time.date, ['🌑', '🌓', '🌕', '🌗'][q.quarter], what, '', { id: 'moon', time: q.time.date }, hl, hl ? 'superluna' : null);
      q = A.NextMoonQuarter(q);
    }
  } catch { }
  await breathe();
  try { // Eclipses lunares (hasta 400 días)
    let e = A.SearchLunarEclipse(start);
    while (e.peak.date < far) {
      const alt = altAzAt('Moon', e.peak.date).altitude;
      push(e.peak.date, '🌘', `${c.eclipseL} ${c.kinds[e.kind] || e.kind}`, alt > 0 ? c.visibleHere : c.notVisibleHere, { id: 'moon', time: e.peak.date }, alt > 0, 'eclipse-lunar');
      e = A.NextLunarEclipse(e.peak);
    }
  } catch { }
  await breathe();
  try { // Eclipses solares visibles desde aquí (hasta 400 días)
    let e = A.SearchLocalSolarEclipse(start, observer);
    while (e.peak.time.date < far) {
      push(e.peak.time.date, '🌞', `${c.eclipseS} ${c.kinds[e.kind] || e.kind}`, `${c.visibleHere} · ${fmtNum(e.obscuration * 100)} % ${c.covered}`, { id: 'sun', time: e.peak.time.date }, true, 'eclipse-solar');
      e = A.NextLocalSolarEclipse(e.peak.time, observer);
    }
  } catch { }
  for (const id of ['mars', 'jupiter', 'saturn', 'uranus', 'neptune']) { // Oposiciones (hasta 400 días)
    const b = BODIES.find(x => x.id === id);
    const tt = tryTime(() => A.SearchRelativeLongitude(b.body, 0, start));
    if (tt) push(tt, '🪐', `${c.opposition} ${pname(id)}`, c.oppMore, { id, time: new Date(+tt) }, id !== 'neptune' && id !== 'uranus', 'obj:' + id);
  }
  for (const id of ['mercury', 'venus']) { // Máximas elongaciones
    let t0 = start;
    for (let k = 0; k < 4; k++) {
      try {
        const e = A.SearchMaxElongation(BODIES.find(x => x.id === id).body, t0);
        if (e.time.date > end) break;
        push(e.time.date, '✨', `${c.elong} ${pname(id)} (${fmtNum(e.elongation)}°)`, `${e.visibility === 'morning' ? c.morning : c.evening} · ${c.elongMore}`, { id, time: e.time.date });
        t0 = new Date(+e.time.date + 10 * 864e5);
      } catch { break; }
    }
  }
  // Conjunciones: Luna con planetas y estrellas brillantes; planetas entre sí
  const targets = ['mercury', 'venus', 'mars', 'jupiter', 'saturn'].map(id => ({ id, body: BODIES.find(b => b.id === id).body, name: pname(id) }));
  const stars = ['Regulus', 'Spica', 'Antares', 'Aldebaran'].map(en => { const n = DATA.names.find(x => x[2] === en); if (!n) return null; const [ra, dec] = DATA.stars[n[0]]; const a = ra * 15 * D2R, d = dec * D2R; return { id: 's:' + en, vec: { x: Math.cos(d) * Math.cos(a), y: Math.cos(d) * Math.sin(a), z: Math.sin(d) }, name: S.lang === 'en' ? n[2] : n[1] }; }).filter(Boolean);
  const pairs = [];
  for (const tg of targets) pairs.push({ a: 'Moon', b: tg, thr: 3.5, moon: true });
  for (const st of stars) pairs.push({ a: 'Moon', b: st, thr: 1.5, moon: true });
  for (let i = 0; i < targets.length; i++) for (let j = i + 1; j < targets.length; j++) pairs.push({ a: targets[i], b: targets[j], thr: 2.2 });
  // Cada astro se calcula una sola vez por paso (antes se repetía en cada pareja: 5 veces más lento)
  const vecOf = (x, t, memo) => { const k = x === 'Moon' ? 'Moon' : x.id; if (!memo[k]) memo[k] = x === 'Moon' ? A.GeoVector('Moon', t, false) : x.vec ? new A.Vector(x.vec.x, x.vec.y, x.vec.z, t) : A.GeoVector(x.body, t, false); return memo[k]; };
  const hist = pairs.map(() => []);
  for (let t = +start; t <= +end; t += 3 * 3600e3) {
    await breathe();
    const tm = A.MakeTime(new Date(t)), sun = A.GeoVector('Sun', tm, false), memo = {};
    pairs.forEach((p, i) => {
      const va = vecOf(p.a, tm, memo), vb = vecOf(p.b, tm, memo), sep = A.AngleBetween(va, vb);
      const h = hist[i]; h.push([t, sep]); if (h.length > 3) h.shift();
      if (h.length === 3 && h[1][1] < h[0][1] && h[1][1] <= h[2][1] && h[1][1] < p.thr) {
        const when = new Date(h[1][0]), elong = A.AngleBetween(sun, vb);
        if (elong < 15) return; // demasiado cerca del Sol para verse
        const focus = p.moon ? p.b.id : p.a.id;
        const what = p.moon ? `${c.moonNear} ${p.b.name}` : `${c.conj} ${p.a.name} ${c.and} ${p.b.name}`;
        push(when, p.moon ? '🌙' : '🪐', what, `${c.sep} ${fmtNum(h[1][1], 1)}°`, { id: focus, time: when }, !p.moon && h[1][1] < 1, p.moon ? null : 'conjuncion');
      }
    });
  }
  for (const sh of SHOWERS) for (const y of [start.getFullYear(), start.getFullYear() + 1]) { // Lluvias de meteoros
    const peak = new Date(Date.UTC(y, sh.peak[0] - 1, sh.peak[1], 22));
    if (peak >= start && peak <= end) push(peak, '☄️', `${c.peakOf} ${S.lang === 'en' ? sh.en : sh.es}`, `~${sh.zhr} ${c.perHour}`, { time: peak }, sh.zhr >= 100, fold(sh.es).replace(/\s+/g, '-'));
  }
  const south = S.place.lat < 0; // Estaciones según el hemisferio
  for (const y of [start.getFullYear(), start.getFullYear() + 1]) {
    try {
      const s = A.Seasons(y);
      [['mar', s.mar_equinox, south ? 'autumn' : 'spring'], ['jun', s.jun_solstice, south ? 'winter' : 'summer'], ['sep', s.sep_equinox, south ? 'spring' : 'autumn'], ['dec', s.dec_solstice, south ? 'summer' : 'winter']]
        .forEach(([k, tt, season]) => { if (tt.date <= end) push(tt.date, k === 'jun' || k === 'dec' ? '☀️' : '🌍', `${c.seasons[k]} ${c.seasonNames[season]}`, '', null); });
    } catch { }
  }
  items.sort((a, b) => a.date - b.date);
  return items;
}
function feedEvents() {
  if (!FEED) return [];
  const now = simDate(), items = [];
  for (const l of FEED.lanzamientos || []) { if (l.relevante === false) continue; /* solo los relevantes */ const d = new Date(l.fecha); if (d > new Date(+now - 864e5) && d < new Date(+now + 45 * 864e5)) items.push({ date: d, cat: 'launch', ico: '🚀', topic: l.tema || null, what: l.nombre, more: [l.proveedor, l.lugar].filter(Boolean).join(' · '), href: l.enlace || null }); }
  return items;
}
// La pestaña Eventos se construye UNA vez (con todo) y se guarda; los filtros solo muestran u ocultan
// elementos, sin rehacer la lista ni recargar imágenes: así responden al instante en el iPhone.
let evDom = { key: '', el: null };
function applyEvFilter(wrap) {
  const f = S.calFilter;
  wrap.querySelectorAll('.chips .chip').forEach(b => b.classList.toggle('on', b.dataset.f === f));
  let any = false;
  wrap.querySelectorAll('.evgrp').forEach(g => {
    let vis;
    if (g.dataset.cat) vis = f === 'all' || f === g.dataset.cat;
    else { vis = false; g.querySelectorAll('[data-cat]').forEach(r => { const on = f === 'all' || f === r.dataset.cat; r.hidden = !on; vis ||= on; }); }
    g.hidden = !vis; any ||= vis;
  });
  const calc = wrap.querySelector('.calc');
  if (calc) calc.hidden = !(f === 'all' || f === 'sky');
  wrap.querySelector('.evempty').hidden = any || (calc && !calc.hidden);
}
function buildEvents(sky) {
  const c = CT(), wrap = document.createElement('div');
  wrap.className = 'evwrap';
  const grp = cat => { const g = document.createElement('div'); g.className = 'evgrp'; if (cat) g.dataset.cat = cat; wrap.append(g); return g; };
  // Filtros
  const chips = document.createElement('div'); chips.className = 'chips';
  Object.entries(c.filters).forEach(([k, label]) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.dataset.f = k; b.textContent = label;
    b.onclick = () => { S.calFilter = k; applyEvFilter(wrap); $('calBody').scrollTop = 0; };
    chips.append(b);
  });
  wrap.append(chips);
  // Vídeos de la última semana
  const week = (FEED?.videos || []).filter(v => Date.parse(v.fecha) > Date.now() - 7 * 864e5);
  if (week.length) {
    const g = grp('video'); g.append(section(`${c.newVideos} · ${c.thisWeek}`));
    week.forEach(v => g.append(evRow({ img: v.miniatura, when: fmtDay(new Date(v.fecha)), what: v.titulo, href: v.url })));
  }
  // Últimas noticias: primero las tuyas (manuales), luego las automáticas relevantes
  const now = simDate();
  const mine = (FEED?.manuales || []).filter(m => { const d = new Date(m.fecha); return !isNaN(d) && d > new Date(+now - 7 * 864e5); }).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  const auto = FEED?.noticiasPorIdioma?.[S.lang] || (FEED?.noticias || []).filter(n => !n.idioma || n.idioma === S.lang);
  if (mine.length || auto.length) {
    const g = grp('news'); g.append(section(c.latestNews));
    mine.forEach(m => g.append(evRow({ box: true, ico: '📌', when: `${fmtDay(new Date(m.fecha))} · DarwinCaos`, what: m.titulo, more: m.descripcion || '', href: m.enlace || null, hl: true })));
    auto.forEach(n => g.append(evRow({ box: true, img: n.mini || null, /* solo miniaturas ligeras: las originales pesan MB y bloqueaban el iPhone */ ico: '📰', when: `${fmtDay(new Date(n.fecha))} · ${n.fuente}${n.idioma === 'en' ? ' · EN' : ''}`, what: n.titulo, more: (n.resumen || '').slice(0, 140) + ((n.resumen || '').length > 140 ? '…' : ''), href: n.url })));
  }
  // Cielo y lanzamientos, por meses
  if (!sky) { const p = document.createElement('p'); p.className = 'note calc'; p.textContent = c.calculating; wrap.append(p); }
  const all = [...(sky || []), ...feedEvents()].sort((a, b) => a.date - b.date);
  let month = '', g = null;
  all.forEach(e => {
    const m = e.date.toLocaleDateString(S.lang, { month: 'long', year: 'numeric', ...tzOpt() });
    if (m !== month) { month = m; g = grp(null); g.append(section('📅 ' + m)); }
    const onClick = e.action ? () => goToEvent(e.action.id, e.action.time) : null;
    const row = evRow({ ico: e.ico, when: `${fmtDay(e.date)} · ${fmtHM(e.date)}`, what: e.what, more: e.more, onClick: e.href ? null : onClick, href: e.href, hl: e.hl, video: topicVideo(e.topic),
      cal: e.date > Date.now() ? { title: `${e.ico} ${e.what}`, start: e.date, end: new Date(+e.date + 3600e3), desc: e.more || '', alarm: e.cat === 'launch' ? 30 : 60, link: deepLink(e.action?.id || null, e.action?.time || e.date) } : null });
    row.dataset.cat = e.cat; g.append(row);
  });
  const empty = document.createElement('p'); empty.className = 'note evempty'; empty.textContent = FEED ? c.empty : c.noFeed; wrap.append(empty);
  if (FEED?.actualizado) { const p = document.createElement('p'); p.className = 'note'; p.textContent = `${c.updated}: ${new Date(FEED.actualizado).toLocaleString(S.lang, { dateStyle: 'short', timeStyle: 'short' })}`; wrap.append(p); }
  else if (!FEED) { const p = document.createElement('p'); p.className = 'note'; p.textContent = c.noFeed; wrap.append(p); }
  return wrap;
}
function renderEvents(box) {
  const sky = eventsReady(), key = `${eventsKey()}|${FEED?.actualizado || ''}|${!!sky}`;
  if (evDom.key !== key) evDom = { key, el: buildEvents(sky) };
  applyEvFilter(evDom.el);
  box.append(evDom.el);
  if (!sky) { // aún calculando: el resto ya se ve; los eventos del cielo se añaden al terminar
    const gen = calGen, again = () => gen === calGen && $('modalCal').classList.contains('open');
    const calc = evDom.el.querySelector('.calc');
    const run = tries => getSkyEvents().then(() => { if (again()) renderCal(true); })
      .catch(err => { if (!again()) return; if (/cancelado/.test(err.message) && tries < 3) run(tries + 1); else if (calc) calc.textContent = '⚠️ ' + err.message; });
    run(0);
  }
}
let calGen = 0;
function renderCal(keepScroll = false) {
  const box = $('calBody'), gen = ++calGen, top = box.scrollTop;
  box.replaceChildren();
  $('tabNow').classList.toggle('on', S.calTab === 'now');
  $('tabTonight').classList.toggle('on', S.calTab === 'tonight');
  $('tabEvents').classList.toggle('on', S.calTab === 'events');
  if (S.calTab === 'events') { // ya construida o rápida de construir: sin esperas
    try { renderEvents(box); } catch (err) { console.error(err); const p = document.createElement('p'); p.className = 'note'; p.textContent = '⚠️ ' + err.message; box.append(p); }
    box.scrollTop = keepScroll ? top : 0;
    return;
  }
  const wait = document.createElement('p'); wait.className = 'note'; wait.textContent = S.lang === 'en' ? 'Calculating…' : 'Calculando…';
  box.append(wait);
  setTimeout(() => { // dejamos que se pinte «Calculando…» antes del cálculo
    if (gen !== calGen || !$('modalCal').classList.contains('open')) return; // cambiaste de pestaña o cerraste
    box.replaceChildren();
    try { S.calTab === 'now' ? renderSkyList('', box) : S.calTab === 'tonight' ? renderTonight(box) : renderEvents(box); }
    catch (err) { console.error(err); const p = document.createElement('p'); p.className = 'note'; p.textContent = '⚠️ ' + err.message; box.append(p); }
    box.scrollTop = keepScroll ? top : 0;
  }, 30);
}
$('tabNow').onclick = () => { S.calTab = 'now'; renderCal(); };
$('tabTonight').onclick = () => { S.calTab = 'tonight'; renderCal(); };
$('tabEvents').onclick = () => { S.calTab = 'events'; renderCal(); };

// ───────────── Bucle principal ─────────────
const belowEl = $('belowTag'), banner = $('focusBanner'), timeLabel = $('timeLabel');
const camDir = new THREE.Vector3();
const compassNeedle = $('compassNeedle');
$('compass').onclick = () => { // tocar la brújula: mirar al Norte
  if (S.sensor) { toast(`${T().turnTo} ${T().N}`); return; }
  S.tracking = null; S.targetAz = 0; S.targetAlt = 12;
};
let last = performance.now(), slowTick = 0, focused = null;
// Si el móvil no llega a ~40 fps, bajamos la resolución para que el movimiento sea fluido
let perfFrames = 0, perfStart = 0, pixelRatio = renderer.getPixelRatio();
function adaptQuality(now) {
  if (!perfStart) perfStart = now;
  perfFrames++;
  if (now - perfStart < 2000) return;
  const fps = perfFrames * 1000 / (now - perfStart);
  perfFrames = 0; perfStart = now;
  if (fps < 40 && pixelRatio > 1) {
    pixelRatio = Math.max(1, pixelRatio - 0.25);
    renderer.setPixelRatio(pixelRatio);
    starUniforms.uPx.value = pixelRatio;
  }
}
// Diagnóstico de sensores: añade ?debug=1 a la dirección
const debugEl = params.has('debug') ? Object.assign(document.body.appendChild(document.createElement('pre')), { id: 'debugBox' }) : null;
let debugFps = 0, debugT = 0, debugN = 0;
function updateDebug(now) {
  debugN++;
  if (now - debugT < 500) return;
  debugFps = Math.round(debugN * 1000 / (now - debugT)); debugN = 0; debugT = now;
  const e = lastOrient, f = v => (v == null ? '—' : (+v).toFixed(1));
  debugEl.textContent = [
    `modo: ${usingQuatSensor ? 'cuaternión (AbsoluteOrientationSensor)' : e ? 'deviceorientation' : 'sin datos'} · sensor ${S.sensor ? 'ON' : 'OFF'}`,
    e ? `alpha ${f(e.alpha)}  beta ${f(e.beta)}  gamma ${f(e.gamma)}  absoluto ${e.absolute}` : '',
    e && e.webkitCompassHeading !== undefined ? `brújula iOS ${f(e.webkitCompassHeading)}° (precisión ${f(e.webkitCompassAccuracy)}) · ref. ${compassRef} · corrección ${f(compassOffset)}° · rechazos ${compassOutliers}` : '',
    `declinación magnética ${f(magDecl)}° · cámara apunta a acimut ${f(vecToAltAz(camera.getWorldDirection(new THREE.Vector3())).az)}°`,
    `pantalla ${screen.orientation?.angle ?? window.orientation ?? 0}° · ${debugFps} fps · resolución x${pixelRatio}`,
  ].filter(Boolean).join('\n');
}
const calOpenEl = $('modalCal'); let calSkip = 0;
function frame(now) {
  requestAnimationFrame(frame);
  if (debugEl) updateDebug(now);
  if (!document.hidden) adaptQuality(now);
  if (OBJ?.active) { OBJ.render(Math.min(0.1, (now - last) / 1000)); last = now; return; } // modo Objeto: solo el modelo 3D
  if (calOpenEl.classList.contains('open') && (++calSkip % 30)) return; // con el calendario abierto (tapa el cielo) casi no pintamos: el iPhone queda libre para la lista
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  const date = simDate();
  updateSkyMatrix(date);
  updateBodies(date);
  if (S.layers.iss) updateISS(date); else ISS.group.visible = false;
  SATS.update(date, S.fov, S.layers.sats, S.selected?.kind === 'sat' ? S.selected.ref.id : null, S.layers.starlink);

  // Cámara
  if (S.sensor && sensorReady) camera.quaternion.slerp(sensorQ, 1 - Math.exp(-dt * (usingQuatSensor ? 22 : 14))); // suavizado independiente de los fps
  else {
    const tr = S.tracking && S.targetAz == null && entryAltAz(S.tracking);
    if (tr) { S.viewAz = tr.az; S.viewAlt = THREE.MathUtils.clamp(tr.alt, -89, 89); }
    if (S.targetAz != null) {
      if (S.tracking) { const t = entryAltAz(S.tracking); if (t) { S.targetAz = t.az; S.targetAlt = t.alt; } }
      const dAz = ((S.targetAz - S.viewAz + 540) % 360) - 180;
      const f = 1 - Math.exp(-dt * 7); // ~0,5 s hasta el objetivo, independiente de los fps
      S.viewAz = (S.viewAz + dAz * f + 360) % 360;
      S.viewAlt += (S.targetAlt - S.viewAlt) * f;
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
  { const e = ENV[currentEnv()], k = atm ? THREE.MathUtils.clamp((-sunAlt - 6) / 6, 0, 1) : 1; zen.lerp(new THREE.Color(e.zen), k); hor.lerp(new THREE.Color(e.hor), k); }
  domeMat.uniforms.uZenith.value.copy(zen); domeMat.uniforms.uHorizon.value.copy(hor);
  domeMat.uniforms.uSunDir.value.copy(sunW); domeMat.uniforms.uSunGlow.value = atm ? THREE.MathUtils.clamp((sunAlt + 8) / 10, 0, 1) : 0;
  const realFade = THREE.MathUtils.clamp((-sunAlt - 1) / 11, 0, 1);
  // Por defecto se ven estrellas y constelaciones también de día (como en un planetario); «Día realista» las oculta.
  const starFade = S.camera || !atm ? 1 : S.layers.realDay ? realFade : Math.max(realFade, 0.9);
  starUniforms.uFade.value = starFade;
  starUniforms.uScale.value = Math.min(2.2, Math.pow(62 / S.fov, 0.3));
  starUniforms.uLimit.value = ENV[currentEnv()].limit + Math.log10(62 / S.fov) * 1.5 - (1 - starFade) * 2;
  const lineFade = 0.35 + 0.65 * starFade;
  const artFade = starFade * THREE.MathUtils.clamp((S.fov - 6) / 20, 0, 1); // sin ilustraciones de día ni con mucho zoom

  // Tamaño aparente de los astros: exagerado con poco zoom, real con mucho zoom
  for (const b of BODIES) {
    if (b.id !== 'sun') b.sphere.material.uniforms.uLight.value.copy(b.lightEq).transformDirection(skyGroup.matrix);
    const k = Math.max(1, Math.pow(S.fov / b.ref, 0.55)); // al ampliar, el disco crece en pantalla hasta su tamaño real
    b.scaled.scale.setScalar(k);
    const discPx = (b.radius * k / R.body) / Math.tan(S.fov * D2R / 2) * innerHeight / 2;
    b.glow.material.opacity = THREE.MathUtils.clamp(1.2 - discPx / 14, 0, b.id === 'sun' ? 0.9 : 0.7);
    if (b.label) b.label.center.y = 1.15 + discPx * (b.ring ? 2.3 : 1) / 18; // la etiqueta queda bajo el disco
  }
  ISS.scaled.scale.setScalar(R.iss * Math.tan(0.03 * D2R) * Math.max(1, Math.pow(S.fov / 0.5, 0.55)));
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
    if (con.artMat) con.artMat.opacity += (((con === focused ? 0.5 : 0.14) * artFade) - con.artMat.opacity) * 0.08;
    if (con.label) con.label.material.opacity = (con === focused ? 0.95 : 0.55) * lineFade;
  }
  lineMat.opacity = 0.3 * lineFade; hiLineMat.opacity = 0.85 * lineFade;
  const nameMag = S.fov < 15 ? 3.5 : S.fov < 35 ? 2.6 : 1.7; // con más zoom, más nombres
  starNameGroup.children.forEach(l => (l.visible = l.userData.mag < nameMag));
  banner.textContent = focused ? (S.lang === 'en' ? focused.en : focused.es) : '';
  banner.style.opacity = focused && bestAng < 15 && S.layers.lines ? 1 : 0;

  // Flecha guía hacia el objeto seleccionado si está fuera de la pantalla
  updateGuide();
  if (S.finding) updateFinder(view); else finderEl.classList.remove('show');
  // Marcador del objeto seleccionado
  const target = S.finding || S.selected, selW2 = target?.world();
  selMarker.visible = !!selW2 && S.fov > 3;
  if (selW2) { selMarker.position.copy(selW2); selMarker.material.opacity = S.finding && S.found ? 0.55 + 0.45 * Math.sin(now / 180) : 1; }

  updateMeteors(dt, starFade, date);

  // HUD (4 veces por segundo)
  compassNeedle.style.transform = `rotate(${-view.az}deg)`;
  if (now - slowTick > 250) {
    slowTick = now;
    belowEl.classList.toggle('show', view.alt < -2 && !S.camera); // solo avisamos cuando miras bajo el horizonte
    updateHomeBtn();
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

const guideEl = $('guide'), guideTmp = new THREE.Vector3();
const finderEl = $('finder'), finderArrow = $('finderArrow'), finderText = $('finderText');
$('findOpen').onclick = () => { const e = S.finding; stopFinding(); if (e) openInfo(e); };
$('findClose').onclick = () => closeInfo();
// Flecha grande en el centro: gira hacia el objeto y dice cuánto falta («→ 40° · ↑ 20°»)
function updateFinder(view) {
  const e = S.finding, w = e?.world();
  if (!w) { finderEl.classList.remove('show'); return; }
  const aa = vecToAltAz(w), dAz = ((aa.az - view.az + 540) % 360) - 180, dAlt = aa.alt - view.alt;
  const c = guideTmp.copy(w).applyMatrix4(camera.matrixWorldInverse), ndc = w.clone().project(camera);
  const inView = c.z < 0 && Math.abs(ndc.x) < 0.75 && Math.abs(ndc.y) < 0.75;
  finderEl.classList.add('show');
  if (inView) {
    if (!S.found) { S.found = true; navigator.vibrate?.(60); }
    finderEl.classList.add('found');
    finderText.textContent = `✔ ${e.name()}`;
  } else {
    finderEl.classList.remove('found');
    finderArrow.style.transform = `rotate(${-Math.atan2(c.y, c.x)}rad)`;
    const h = Math.abs(dAz) >= 2 ? `${dAz > 0 ? '→' : '←'} ${fmtNum(Math.abs(dAz))}°` : '';
    const v = Math.abs(dAlt) >= 2 ? `${dAlt > 0 ? '↑' : '↓'} ${fmtNum(Math.abs(dAlt))}°` : '';
    finderText.textContent = [h, v].filter(Boolean).join(' · ') || e.name();
  }
}
function updateGuide() {
  if (S.finding) { guideEl.style.display = 'none'; return; } // en modo «Buscar» guía la flecha central
  const w = S.selected?.world();
  if (!w) { guideEl.style.display = 'none'; return; }
  const c = guideTmp.copy(w).applyMatrix4(camera.matrixWorldInverse);
  const ndc = w.clone().project(camera);
  if (c.z < 0 && Math.abs(ndc.x) < 0.92 && Math.abs(ndc.y) < 0.92) { guideEl.style.display = 'none'; return; }
  const a = Math.atan2(c.y, c.x), rx = innerWidth / 2 - 60, ry = innerHeight / 2 - 130;
  const k = Math.min(rx / Math.abs(Math.cos(a) || 1e-6), ry / Math.abs(Math.sin(a) || 1e-6));
  guideEl.style.display = 'flex';
  guideEl.style.left = `${innerWidth / 2 + Math.cos(a) * k}px`;
  guideEl.style.top = `${innerHeight / 2 - Math.sin(a) * k}px`;
  guideEl.firstElementChild.style.transform = `rotate(${-a}rad)`;
  guideEl.lastElementChild.textContent = S.selected.name();
}

// ───────────── Compartir el cielo: imagen con la marca del canal ─────────────
const SHOT_FORMATS = { square: [1080, 1080], story: [1080, 1920], wide: [1920, 1080] };
S.shotFormat = 'square';
let shotBlob = null, shotUrl = null;
const logoImg = new Image();
logoImg.src = `img/logo.png?v=${APP_VERSION}`;

// Qué se ve: el objeto seleccionado o los astros dentro del encuadre + la constelación enfocada
function shotCaption() {
  if (S.selected) return S.selected.name();
  const v = new THREE.Vector3(), names = [];
  for (const b of BODIES) {
    v.copy(b.holder.getWorldPosition(new THREE.Vector3())).project(camera);
    if (v.z < 1 && Math.abs(v.x) < 0.9 && Math.abs(v.y) < 0.9 && vecToAltAz(b.holder.getWorldPosition(new THREE.Vector3())).alt > -2) names.push(bodyName(b));
  }
  if (focused) names.push(S.lang === 'en' ? focused.en : focused.es);
  return names.slice(0, 4).join(' · ');
}
// Renderiza el cielo al tamaño pedido (sin menús) y le añade el pie con logo, qué se ve, lugar y fecha
function renderShot(w, h) {
  const out = document.createElement('canvas'); out.width = w; out.height = h;
  const ctx = out.getContext('2d');
  // Render 3D al tamaño de la imagen, sin tocar lo que ve el usuario
  const prev = { pr: renderer.getPixelRatio(), aspect: camera.aspect, px: starUniforms.uPx.value, size: renderer.getSize(new THREE.Vector2()) };
  const view = camera.view ? { ...camera.view } : null;
  camera.clearViewOffset();
  renderer.setPixelRatio(1); renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  starUniforms.uPx.value = h / innerHeight; // estrellas con el mismo tamaño relativo que en pantalla
  if (S.camera && $('cameraFeed').videoWidth) { // en modo cámara, la foto real de fondo
    const vid = $('cameraFeed'), k = Math.max(w / vid.videoWidth, h / vid.videoHeight);
    ctx.drawImage(vid, (w - vid.videoWidth * k) / 2, (h - vid.videoHeight * k) / 2, vid.videoWidth * k, vid.videoHeight * k);
  }
  renderer.render(scene, camera);
  ctx.drawImage(renderer.domElement, 0, 0, w, h);
  // Restaurar la vista de la pantalla
  renderer.setPixelRatio(prev.pr); renderer.setSize(prev.size.x, prev.size.y, false);
  camera.aspect = prev.aspect; starUniforms.uPx.value = prev.px;
  if (view?.enabled) camera.setViewOffset(view.fullWidth, view.fullHeight, view.offsetX, view.offsetY, view.width, view.height); else camera.updateProjectionMatrix();

  // Pie de foto
  const u = Math.min(w, h) / 1080, band = (S.shotExtra ? 240 : 190) * u, y0 = h - band;
  const g = ctx.createLinearGradient(0, y0 - 80 * u, 0, h);
  g.addColorStop(0, 'rgba(2,6,18,0)'); g.addColorStop(0.45, 'rgba(2,6,18,0.82)'); g.addColorStop(1, 'rgba(2,6,18,0.95)');
  ctx.fillStyle = g; ctx.fillRect(0, y0 - 80 * u, w, band + 80 * u);
  const R = 62 * u, cx = 44 * u + R, cy = h - band / 2;
  if (logoImg.complete && logoImg.naturalWidth) { // logo recortado por su círculo azul
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
    const k = (2 * R) / (LOGO_CIRCLE * Math.min(logoImg.naturalWidth, logoImg.naturalHeight));
    ctx.drawImage(logoImg, cx - logoImg.naturalWidth * k / 2, cy - logoImg.naturalHeight * k / 2, logoImg.naturalWidth * k, logoImg.naturalHeight * k);
    ctx.restore();
  }
  ctx.strokeStyle = 'rgba(56,189,248,0.9)'; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  const tx = cx + R + 28 * u, maxW = w - tx - 40 * u;
  const fit = (txt, size, weight) => { let s = size; do { ctx.font = `${weight} ${s * u}px system-ui, -apple-system, "Segoe UI", sans-serif`; s -= 2; } while (ctx.measureText(txt).width > maxW && s > 16); };
  ctx.textBaseline = 'alphabetic'; ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 8 * u;
  const caption = S.shotCap || T().shotDefault, date = simDate();
  const when = date.toLocaleString(S.lang, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', ...tzOpt() });
  const y1 = S.shotExtra ? cy - 46 * u : cy - 22 * u;
  fit(caption, 44, 800); ctx.fillStyle = '#f8fafc'; ctx.fillText(caption, tx, y1);
  fit(`📍 ${S.place.name} · ${when}`, 28, 600); ctx.fillStyle = '#bae6fd'; ctx.fillText(`📍 ${S.place.name} · ${when}`, tx, y1 + 40 * u);
  if (S.shotExtra) { fit(S.shotExtra, 26, 500); ctx.fillStyle = '#e2e8f0'; ctx.fillText(S.shotExtra, tx, y1 + 76 * u); }
  fit('DarwinCaos · youtube.com/@darwincaos', 26, 700); ctx.fillStyle = '#38bdf8'; ctx.fillText('DarwinCaos · youtube.com/@darwincaos', tx, y1 + (S.shotExtra ? 112 : 76) * u);
  ctx.shadowBlur = 0;
  return out;
}
function makeShot() {
  const [w, h] = SHOT_FORMATS[S.shotFormat];
  const c = renderShot(w, h);
  return new Promise(res => c.toBlob(b => res(b), 'image/jpeg', 0.92));
}
S.shotMode = 'now';
async function openShot() {
  S.shotCap = shotCaption(); S.shotEntry = S.selected; S.shotExtra = ''; // antes de que la ventana cierre la ficha
  S.shotMode = 'now'; S.postal = null;
  toggleModal('modalShot');
  const modes = $('shotModes'); modes.replaceChildren();
  [['now', T().shotNow], ['special', T().shotSpecial]].forEach(([k, label]) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'chip' + (S.shotMode === k ? ' on' : ''); b.textContent = label;
    b.onclick = () => {
      S.shotMode = k; modes.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === b));
      $('shotForm').hidden = k !== 'special';
      if (k === 'now') { S.postal = null; S.shotCap = shotCaption(); S.shotExtra = ''; openShot.refresh(); }
      else { $('postPlace').textContent = `📍 ${(S.postPlace || S.place).name}`; if (!$('postDate').value) $('postDate').value = '1990-03-14T03:20'; }
    };
    modes.append(b);
  });
  $('shotForm').hidden = true;
  const box = $('shotFormats'); box.replaceChildren();
  Object.entries(T().shotFormats).forEach(([k, label]) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'chip' + (S.shotFormat === k ? ' on' : ''); b.textContent = label;
    b.onclick = () => { S.shotFormat = k; openShot.refresh(); box.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === b)); };
    box.append(b);
  });
  await openShot.refresh();
}
openShot.refresh = async () => {
  shotBlob = S.postal ? await makePostal() : await makeShot();
  if (shotUrl) URL.revokeObjectURL(shotUrl);
  shotUrl = URL.createObjectURL(shotBlob);
  $('shotImg').src = shotUrl;
};
const shotName = () => `darwincaos-cielo-${(S.postal ? S.postal.date : simDate()).toISOString().slice(0, 16).replace(/[:T]/g, '-')}.jpg`;

// ── Postal «El cielo de una fecha especial»: reconstruye el cielo de cualquier fecha, hora y lugar ──
// Hora local del lugar elegido → instante UTC (respeta su zona horaria, incluso en fechas antiguas)
function zonedToUtc(str, tz) {
  const [d, t = '00:00'] = str.split('T'), [y, mo, da] = d.split('-').map(Number), [h, mi] = t.split(':').map(Number);
  if (!tz) return new Date(y, mo - 1, da, h, mi);
  const want = Date.UTC(y, mo - 1, da, h, mi);
  let guess = want;
  for (let i = 0; i < 3; i++) {
    const p = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(guess));
    const g = k => +p.find(x => x.type === k).value;
    guess += want - Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'));
  }
  return new Date(guess);
}
async function makePostal() {
  const P = S.postal, keep = { place: S.place, offset: S.offset, q: camera.quaternion.clone(), fov: S.fov, sel: S.selected };
  // Cielo de ese momento y lugar (sin guardar nada: al terminar se restaura todo)
  S.place = P.place; observer = new A.Observer(P.place.lat, P.place.lon, 0);
  S.offset = +P.date - Date.now(); S.selected = null;
  updateSkyMatrix(simDate(), true); updateBodies(simDate(), true);
  // Dato curioso: fase de la Luna y astros sobre el horizonte
  const t = T(), ph = A.MoonPhase(P.date), ill = A.Illumination('Moon', P.date).phase_fraction;
  const moonName = Math.min(Math.abs(ph - 180), 360 - Math.abs(ph - 180)) < 12 ? t.phFull : Math.min(ph, 360 - ph) < 12 ? t.phNew : ph < 180 ? t.phWax : t.phWan;
  const up = BODIES.filter(b => !['sun', 'moon', 'pluto', 'neptune', 'uranus'].includes(b.id) && vecToAltAz(b.holder.getWorldPosition(new THREE.Vector3())).alt > 3);
  const sunAlt = vecToAltAz(BODIES[0].holder.getWorldPosition(new THREE.Vector3())).alt;
  S.shotExtra = `🌙 ${moonName} (${fmtNum(ill * 100)} %)` + (up.length ? ` · ✨ ${up.map(bodyName).join(', ')}` : '') + (sunAlt > 0 ? ` · ☀️ ${t.dayTime}` : '');
  S.shotCap = P.title || t.postDefault;
  // Encuadre: hacia el astro brillante más alto, o al sur (al norte en el hemisferio sur), con campo amplio
  const best = up.concat(BODIES.filter(b => b.id === 'moon')).map(b => vecToAltAz(b.holder.getWorldPosition(new THREE.Vector3()))).filter(a => a.alt > 5).sort((a, b) => b.alt - a.alt)[0];
  const az = best ? best.az : (P.place.lat >= 0 ? 180 : 0), alt = best ? THREE.MathUtils.clamp(best.alt, 25, 60) : 40;
  camera.lookAt(altAzVec(az, alt)); setFov(80);
  const issVis = ISS.group.visible; ISS.group.visible = false; selMarker.visible = false; // la ISS y el marcador son de hoy, no de esa fecha
  const blob = await makeShot();
  ISS.group.visible = issVis;
  // Restaurar
  S.place = keep.place; observer = new A.Observer(keep.place.lat, keep.place.lon, 0); S.offset = keep.offset; S.selected = keep.sel;
  camera.quaternion.copy(keep.q); setFov(keep.fov);
  updateSkyMatrix(simDate(), true); updateBodies(simDate(), true);
  return blob;
}
$('postCityBtn').onclick = async () => {
  const q = $('postCity').value.trim();
  if (!q) return;
  try {
    const r = (JSON.parse(await fetchText(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=${S.lang}&format=json`)).results || [])[0];
    if (r) { S.postPlace = { name: [...new Set([r.name, r.admin1, r.country].filter(Boolean))].join(', '), lat: r.latitude, lon: r.longitude, tz: r.timezone }; $('postPlace').textContent = `📍 ${S.postPlace.name}`; }
    else $('postPlace').textContent = T().noResults;
  } catch { $('postPlace').textContent = T().gpsFail; }
};
$('postMake').onclick = async () => {
  const v = $('postDate').value;
  if (!v) return;
  const place = S.postPlace || S.place;
  S.postal = { title: $('postTitle').value.trim(), place, date: zonedToUtc(v, place.tz) };
  $('postMake').textContent = '…';
  await openShot.refresh();
  $('postMake').textContent = T().postMake;
  S.shotEntry = null;
};
function saveShot() {
  const a = document.createElement('a'); a.href = shotUrl; a.download = shotName(); document.body.append(a); a.click(); a.remove();
}
$('infoShot').onclick = () => openShot();
$('dockShot').onclick = () => ($('modalShot').classList.contains('open') ? closeModals() : openShot());
$('shotSave').onclick = saveShot;
$('shotShare').onclick = async () => {
  if (!shotBlob) return;
  const file = new File([shotBlob], shotName(), { type: 'image/jpeg' });
  const text = S.postal ? `${S.shotCap} · ${S.postal.place.name} · ${T().shotText} ${location.href.split('?')[0]}` : `${S.shotCap || T().shotDefault} · ${T().shotText} ${shareUrl(S.shotEntry)}`;
  try {
    if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: 'Planetario DarwinCaos', text });
    else { saveShot(); toast(T().shotSaved); }
  } catch { /* el usuario canceló */ }
};

// Ajuste del lienzo al tamaño real de la pantalla. En iPhone, al abrir y cerrar el teclado del buscador
// la página se encoge, se desplaza o se amplía y a veces NO avisa al volver: el cielo quedaba deformado
// hasta recargar. Por eso, además del aviso, lo comprobamos nosotros mismos varias veces por segundo.
let fitW = innerWidth, fitH = innerHeight;
function fitRenderer(force = false) {
  const w = innerWidth, h = innerHeight;
  if (!force && w === fitW && h === fitH) return;
  fitW = w; fitH = h;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false); // el CSS ya ocupa toda la pantalla; no fijamos píxeles en el estilo
  updateViewOffset();
  updateScreenSprites();
}
addEventListener('resize', () => fitRenderer());
addEventListener('orientationchange', () => setTimeout(() => fitRenderer(true), 300));
window.visualViewport?.addEventListener('resize', () => fitRenderer());
setInterval(() => fitRenderer(), 500);
// Al cerrar el teclado, devolvemos la página a su sitio (iOS la deja desplazada) y reajustamos
document.addEventListener('focusout', e => {
  if (!e.target.matches?.('input, textarea')) return;
  setTimeout(() => { if (scrollX || scrollY) scrollTo(0, 0); fitRenderer(true); }, 250);
});

// ───────────── App instalable ─────────────
// El «ayudante» (sw.js) guarda la app en el móvil: abre al instante y funciona sin cobertura.
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => { });
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
let installEvt = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; paintInstall(); }); // Android/Chrome: lo instalamos con nuestro botón
addEventListener('appinstalled', () => { installEvt = null; paintInstall(); toast(S.lang === 'en' ? 'Installed ✔' : 'Instalada ✔'); });
function paintInstall() {
  const en = S.lang === 'en', btn = $('installBtn'), help = $('installHelp');
  help.hidden = true;
  if (isStandalone()) { btn.textContent = en ? '✅ Installed as an app' : '✅ Ya la usas como app'; btn.disabled = true; return; }
  btn.disabled = false;
  btn.textContent = en ? '📲 Install as an app' : '📲 Instalar como app';
  btn.onclick = async () => {
    if (installEvt) { installEvt.prompt(); await installEvt.userChoice.catch(() => { }); installEvt = null; paintInstall(); return; }
    help.hidden = false; // iPhone (y navegadores sin instalación automática): explicamos los pasos
    help.textContent = isIOS
      ? (en ? 'On iPhone: tap Share (the square with an arrow) at the bottom of Safari → "Add to Home Screen" → Add. It will open full screen, like an app, and work without signal.'
            : 'En iPhone: pulsa Compartir (el cuadrado con la flecha) abajo en Safari → «Añadir a pantalla de inicio» → Añadir. Se abrirá a pantalla completa, como una app, y funcionará sin cobertura.')
      : (en ? 'Open your browser menu (⋮) and choose "Install app" or "Add to Home screen".' : 'Abre el menú del navegador (⋮) y elige «Instalar aplicación» o «Añadir a pantalla de inicio».');
  };
}

// ───────────── Modo Objeto (prototipo: la Luna) ─────────────
const OBJECT_IDS = new Set(['moon', 'mars', 'sun']);
const canObject = e => !!e && (OBJECT_IDS.has(e.id) || e.kind === 'sat' || e.kind === 'iss');
let OBJ = null, objPrev = null;
function getObj() {
  OBJ ||= createObjectView({
    THREE, renderer, lang: () => S.lang,
    makeMaterial: () => moonMaterial(loadTex('img/planets/luna.jpg')),
    hiResMap: cb => texLoader.load('img/planets/luna_4k.jpg', t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); cb(t); }),
    bodies: {
      mars: { material: () => planetMaterial(loadTex('img/planets/marte.jpg')), places: 'data/marte-lugares.json', face: [5, -70] }, // de cara: Valles Marineris y Tharsis
      sun: { map: () => loadTex('img/planets/sol.jpg') },
    },
    onExit: () => { if (objPrev) { setFov(objPrev.fov); S.viewAz = objPrev.az; S.viewAlt = objPrev.alt; S.tracking = null; S.targetAz = null; } },
  });
  return OBJ;
}
// Luz real (fase de hoy) vista desde la Tierra, en ejes de la vista: x derecha, y norte celeste, z hacia nosotros
function moonPhaseView() {
  const b = BODIES.find(x => x.id === 'moon'), f = b.dir.clone().normalize(), L = b.lightEq.clone().normalize();
  const right = new THREE.Vector3().crossVectors(f, new THREE.Vector3(0, 1, 0)).normalize();
  const up = new THREE.Vector3().crossVectors(right, f).normalize();
  return new THREE.Vector3(L.dot(right), L.dot(up), -L.dot(f)).normalize();
}
function enterObject(entry) {
  const o = getObj();
  objPrev = { fov: S.fov, az: S.viewAz, alt: S.viewAlt };
  const card = entry.kind === 'sat' || entry.kind === 'iss' ? objCardFor(entry) : null;
  closeInfo(); hideNewVideo();
  if (S.sensor) setSensor(false);
  o.startMusic(); // dentro del toque: iPhone solo deja sonar si empieza aquí
  if (entry.kind === 'sat' || entry.kind === 'iss') { // satélites e ISS: su modelo 3D, quieto y a pantalla completa (seguirlos por el cielo con zoom es casi imposible)
    const inf = entry.kind === 'iss' ? { modelo: 'iss.glb' } : entry.ref.info;
    SATS.buildModel(inf).then(m => o.enter({ model: m, name: `🛰️ ${entry.name()}`, card }));
    return;
  }
  // Vuelo: el cielo se acerca a la Luna y entonces se abre el modelo
  const aa = entryAltAz(entry);
  if (aa) { S.tracking = entry; S.targetAz = null; }
  const f0 = S.fov, t0 = performance.now(), D = 750;
  const step = () => {
    const k = Math.min(1, (performance.now() - t0) / D), e = k * k * (3 - 2 * k);
    setFov(f0 * Math.pow(1.2 / f0, e));
    if (k < 1) requestAnimationFrame(step); else o.enter({ body: entry.id, phaseDir: entry.id === 'moon' ? moonPhaseView() : null, name: `${{ moon: '🌕', mars: '🔴', sun: '☀️' }[entry.id]} ${entry.name()}`, card: entry.id === 'sun' ? sunCard() : null });
  };
  requestAnimationFrame(step);
}
$('infoObject').onclick = () => S.selected && enterObject(S.selected);
// «📅 Avisarme»: el próximo paso VISIBLE de la ISS o del satélite, al calendario del móvil
$('infoCal').onclick = () => {
  const e = S.selected; if (!e) return;
  const en = S.lang === 'en';
  const p = e.kind === 'iss' ? issPasses().find(x => x.visible) : SATS.nextVisiblePass(e.ref, simDate(), 72);
  if (!p) { toast(en ? 'No naked-eye pass in the next days' : 'No hay pasos visibles a simple vista en los próximos días'); return; }
  const az = azName(p.maxAz), name = e.name();
  addToCalendar({ title: `🛰️ ${name} ${en ? 'visible' : 'pasa sobre ti'}`, start: p.start, end: p.end || new Date(+p.start + 6 * 60e3), alarm: 10, link: deepLink(e.id, p.maxTime || p.maxT),
    desc: en ? `Highest at ${fmtHM(p.maxTime || p.maxT)} · ${fmtNum(p.maxAlt)}° towards ${az}` : `Punto más alto a las ${fmtHM(p.maxTime || p.maxT)} · ${fmtNum(p.maxAlt)}° hacia el ${az}` });
};
// Ficha del Sol en el modo Objeto (con la foto de hoy de la NASA, si ha llegado)
function sunCard() {
  const en = S.lang === 'en';
  return { title: en ? 'The Sun' : 'El Sol', meta: en ? 'G-type star · 4,600 million years old' : 'Estrella de tipo G · 4.600 millones de años',
    text: (en ? '109 times wider than Earth: about 1.3 million Earths would fit inside. Its surface is at about 5,500 °C and its light takes 8 minutes 20 seconds to reach us.'
      : 'Es 109 veces más ancho que la Tierra: dentro cabrían 1,3 millones de Tierras. Su superficie está a unos 5.500 °C y su luz tarda 8 minutos y 20 segundos en llegarnos.')
 };
}
// Ficha corta que acompaña al modelo 3D en el modo Objeto
function objCardFor(entry) {
  const en = S.lang === 'en', { fact } = infoStats(entry);
  if (entry.kind === 'iss') return { title: 'ISS', meta: en ? 'NASA · Roscosmos · ESA · JAXA · CSA — NASA 3D model' : 'NASA · Roscosmos · ESA · JAXA · CSA — modelo 3D de la NASA', text: fact };
  const s = entry.ref, inf = s.info;
  const when = s.lanzamiento ? new Date(s.lanzamiento + 'T12:00:00Z').toLocaleDateString(S.lang, { day: 'numeric', month: 'short', year: 'numeric' }) : s.anio ? String(s.anio) : '';
  const model = inf.modelo ? (en ? 'NASA 3D model' : 'modelo 3D de la NASA') : (en ? 'approximate shape' : 'forma aproximada');
  return { title: entry.name(), meta: [inf.agencia, when && (en ? `launched ${when}` : `lanzado el ${when}`), model].filter(Boolean).join(' · '), text: fact };
}

// ───────────── Aviso de vídeo largo nuevo ─────────────
// Tras la bienvenida, si hay un vídeo LARGO publicado en los últimos 7 días que no has cerrado ni abierto.
// Se oculta solo a los 25 s; si no lo tocas, vuelve a salir (como mucho 3 veces por vídeo).
const NV_KEY = 'dc_nuevo_video';
let nvSplash = false, nvFeed = false, nvTimer = 0, nvDone = false;
const nvSeen = () => { try { return JSON.parse(localStorage.getItem(NV_KEY) || '{}'); } catch { return {}; } };
const nvMark = (id, v) => { try { const m = nvSeen(); m[id] = v; localStorage.setItem(NV_KEY, JSON.stringify(m)); } catch { } };
function hideNewVideo() { $('newVideo').hidden = true; clearTimeout(nvTimer); }
function showNewVideo() {
  if (nvDone || !nvSplash || !nvFeed || !FEED?.videos) return;
  nvDone = true; // una vez por apertura
  const v = FEED.videos.filter(x => !x.corto && Date.now() - Date.parse(x.fecha) < 7 * 864e5).sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha))[0];
  if (!v) return;
  const seen = nvSeen()[v.id];
  if (seen === 'x' || (+seen || 0) >= 3) return;
  nvMark(v.id, (+seen || 0) + 1);
  $('nvHead').textContent = S.lang === 'en' ? '🎬 New on DarwinCaos' : '🎬 Nuevo en DarwinCaos';
  $('nvTitle').textContent = v.titulo;
  const img = $('nvImg'); img.hidden = false; img.onerror = () => { img.hidden = true; }; img.src = ytSmall(v.miniatura);
  $('nvLink').href = v.url;
  $('nvLink').onclick = () => { nvMark(v.id, 'x'); hideNewVideo(); };
  $('nvClose').onclick = () => { nvMark(v.id, 'x'); hideNewVideo(); };
  $('newVideo').hidden = false;
  nvTimer = setTimeout(hideNewVideo, 25000);
}
function splashGone() { nvSplash = true; setTimeout(showNewVideo, 2500); }
function feedReady() { nvFeed = true; setTimeout(showNewVideo, 2500); }

// ───────────── Arranque ─────────────
async function init() {
  applyLanguage();
  applyRed();
  $('placeLabel').textContent = S.place.name;
  setOffset(S.offset);
  let MYTH;
  [DATA, DESC, MYTH] = await Promise.all([fetch(`data/cielo.json?v=${APP_VERSION}`).then(r => r.json()), fetch(`data/descripciones.json?v=${APP_VERSION}`).then(r => r.json()).catch(() => ({})),
    fetch(`data/mitologia.json?v=${APP_VERSION}`).then(r => r.json()).catch(() => ({}))]);
  buildStars();
  buildConstellations();
  addMythology(MYTH);
  buildBodies();
  buildDSO();
  buildLabels();
  buildCatalog();
  applyLayers();
  if (!S.place.env) detectEnvironment(S.place);
  applyEnvironment();
  updateSkyMatrix(simDate(), true);
  updateBodies(simDate(), true);
  setFov(S.fov);
  // Vista inicial: objeto del enlace compartido, o el planeta brillante más alto, o el sur
  const fromUrl = params.get('obj') && CATALOG.find(e => e.id === params.get('obj'));
  const start = fromUrl || CATALOG.filter(e => e.kind === 'body' && e.id !== 'sun').map(e => [e, entryAltAz(e)]).filter(([, aa]) => aa.alt > 10).sort((a, b) => b[1].alt - a[1].alt)[0]?.[0];
  const aim = e => { const aa = e && entryAltAz(e); if (aa) { S.viewAz = aa.az; S.viewAlt = THREE.MathUtils.clamp(aa.alt, -30, 70); } };
  aim(start);
  S.home = { az: S.viewAz, alt: S.viewAlt };
  if (fromUrl) openInfo(fromUrl);
  requestAnimationFrame(frame);
  // Bienvenida: la primera vez espera al botón «Empezar» (en iPhone ese toque concede los sensores); después se desvanece sola
  const firstVisit = !saved.welcomed;
  // Los sensores se activan al cerrar la bienvenida (no mientras está en pantalla)
  const startSensors = byUser => {
    const iosPermission = typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function';
    if (byUser && iosPermission && matchMedia('(pointer: coarse)').matches) setSensor(true, true); // iPhone: el toque concede el permiso
    else autoStartSensor();
  };
  if (!window.__splash) { startSensors(false); splashGone(); }
  window.__splash?.ready(firstVisit, byUser => {
    startSensors(byUser);
    splashGone();
    if (byUser && firstVisit && !saved.place && !urlPlace) requestLocation(true); // primera visita: «Empezar» pide también la ubicación
    if (!saved.hinted && !urlPlace) setTimeout(() => toast(T().hintPlace), 1400);
    try { const st = JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); st.welcomed = true; localStorage.setItem(STORE_KEY, JSON.stringify(st)); } catch { }
  });
  persist();
  updateDeclination();
  loadFeed().then(() => { if ($('modalCal').classList.contains('open')) renderCal(); feedReady(); });
  // Adelantamos el cálculo de eventos en segundo plano para que el calendario abra al instante
  setTimeout(() => (window.requestIdleCallback || (f => f()))(() => getSkyEvents().catch(() => { })), 6000);
  SATS.load().then(() => { satEntries(); if (fromUrl === undefined && params.get('obj')?.startsWith('sat:')) { const e = CATALOG.find(c => c.id === params.get('obj')); if (e) { openInfo(e); pointTo(e); } } }); // enlace del calendario: abre y apunta al satélite
  loadISS().then(() => {
    updateISS(simDate());
    if (fromUrl?.kind === 'iss') aim(fromUrl); // la ISS solo tiene posición cuando llega su órbita
    if (S.selected?.kind === 'iss') refreshInfo();
  });
}
init();

// Exponer para depuración
window.__planetario = { SATS, scene, setSensor: (...a) => setSensor(...a), sensorState: () => ({ sensorReady, usingQuatSensor, sensorBound, compassOffset }), S, CATALOG: () => CATALOG, BODIES, setOffset, setFov, openInfo, pick, camera, skyGroup, ISS, issAt, A };
