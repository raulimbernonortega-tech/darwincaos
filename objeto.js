// ───────────── Modo Objeto ─────────────
// Visor aparte: el astro como modelo 3D que se gira con un dedo y se acerca con dos,
// con nombres de mares, cráteres y alunizajes sobre la superficie y música ambiental generada
// en el propio navegador (sin derechos de autor). Prototipo: la Luna.

// Música ambiental: acordes suaves y lentos + notas sueltas tipo «campanilla», con reverberación.
// Todo se sintetiza con Web Audio: no hay archivos de audio ni derechos de autor.
class Ambient {
  constructor() { this.ctx = null; this.on = false; this.timers = []; }
  start() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (this.ctx?.state === 'closed') this.ctx = null;
    this.ctx ||= new AC();
    const ctx = this.ctx;
    ctx.resume?.(); // iPhone: si el sonido quedó «interrumpido» (al salir de la app, una llamada…) lo reanudamos con este toque
    if (this.on) return;
    this.on = true;
    const master = this.master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.32, ctx.currentTime + 4);
    // Reverberación: impulso de ruido que se apaga en ~4 s
    const rev = ctx.createConvolver(), len = ctx.sampleRate * 4, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    rev.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = 0.55;
    const dry = ctx.createGain(); dry.gain.value = 0.45;
    rev.connect(wet).connect(master); dry.connect(master);
    master.connect(ctx.destination);
    this.bus = { rev, dry };
    // Filtro que «respira» muy despacio
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.Q.value = 0.5;
    const lfo = ctx.createOscillator(), lfoGain = ctx.createGain();
    lfo.frequency.value = 0.05; lfoGain.gain.value = 350; lfo.connect(lfoGain).connect(lp.frequency); lfo.start();
    lp.connect(dry); lp.connect(rev);
    this.pad = lp; this.lfo = lfo;
    // Dos acordes que se alternan cada 14 s (Re mayor 9 / Sol mayor 7): tranquilos, sin tensión
    const chords = [[146.83, 220.0, 329.63, 369.99], [98.0, 146.83, 246.94, 369.99]];
    let k = 0;
    const playChord = () => { if (!this.on) return; this.chord(chords[k++ % 2]); this.timers.push(setTimeout(playChord, 14000)); };
    playChord();
    // Campanillas: notas de la escala pentatónica de Re, sueltas y espaciadas
    const bells = [587.33, 659.25, 739.99, 880.0, 987.77, 1174.66];
    const bell = () => { if (!this.on) return; this.bell(bells[Math.floor(Math.random() * bells.length)]); this.timers.push(setTimeout(bell, 2500 + Math.random() * 5000)); };
    this.timers.push(setTimeout(bell, 3000));
  }
  chord(freqs) {
    const ctx = this.ctx, t = ctx.currentTime;
    for (const f of freqs) for (const det of [-4, 4]) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = f; o.detune.value = det;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.045, t + 5); g.gain.linearRampToValueAtTime(0.035, t + 11); g.gain.linearRampToValueAtTime(0, t + 17);
      o.connect(g).connect(this.pad); o.start(t); o.stop(t + 17.5);
    }
  }
  bell(f) {
    const ctx = this.ctx, t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0008, t + 4);
    o.connect(g); g.connect(this.bus.rev); g.connect(this.bus.dry); o.start(t); o.stop(t + 4.2);
  }
  stop() {
    if (!this.on) return;
    this.on = false;
    this.timers.forEach(clearTimeout); this.timers = [];
    const ctx = this.ctx, m = this.master, lfo = this.lfo;
    m.gain.cancelScheduledValues(ctx.currentTime); m.gain.setValueAtTime(m.gain.value, ctx.currentTime); m.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
    setTimeout(() => { try { lfo.stop(); m.disconnect(); } catch { } }, 1400);
  }
}

// Sol vivo: superficie de plasma en movimiento (ruido animado sobre la textura), oscurecimiento del limbo
// y una corona de llamaradas que se mueve alrededor del disco.
const SUN_NOISE = `
      float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float noise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z); }
      float fbm(vec3 p){ float v = 0.0, a = 0.5; for (int k = 0; k < 5; k++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }`;
function sunMaterial(THREE, map) {
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: map }, uTime: { value: 0 } },
    vertexShader: `varying vec2 vUv; varying vec3 vP; varying vec3 vN; varying vec3 vW;
      void main(){ vUv = uv; vP = position; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform sampler2D map; uniform float uTime; varying vec2 vUv; varying vec3 vP; varying vec3 vN; varying vec3 vW;
      ${SUN_NOISE}
      void main(){
        float t = uTime * 0.06;
        vec3 q = vP * 3.0;
        float flow = fbm(q + vec3(t, -t * 0.7, t * 0.5) + fbm(q * 1.7 - t) * 1.2);   // plasma que fluye
        float gran = fbm(vP * 22.0 + vec3(0.0, 0.0, uTime * 0.25));                     // granulación fina
        vec3 base = texture2D(map, vUv).rgb;
        float mu = clamp(dot(normalize(vN), normalize(cameraPosition - vW)), 0.0, 1.0);
        float heat = 0.55 * flow + 0.25 * gran + 0.35 * dot(base, vec3(0.33));
        vec3 hot = vec3(1.0, 0.97, 0.82), mid = vec3(1.0, 0.72, 0.22), cool = vec3(0.85, 0.28, 0.05);
        vec3 col = mix(cool, mid, smoothstep(0.25, 0.55, heat));
        col = mix(col, hot, smoothstep(0.55, 0.85, heat));
        col *= 0.55 + 0.6 * pow(mu, 0.45);                       // borde más oscuro y rojizo
        col += vec3(1.0, 0.6, 0.2) * pow(1.0 - mu, 3.0) * 0.35;  // brillo del borde
        gl_FragColor = vec4(col * 1.15, 1.0);
        #include <colorspace_fragment>
      }`,
  });
}
// Corona: un plano que mira siempre a la cámara con llamaradas animadas alrededor del disco (radio 1)
function coronaMesh(THREE) {
  const size = 5.2;
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uTime; varying vec2 vP;
      ${SUN_NOISE}
      void main(){
        float d = length(vP), a = atan(vP.y, vP.x);
        if (d < 0.985) discard;
        float t = uTime * 0.12;
        vec3 c = vec3(cos(a), sin(a), 0.0);
        float fl = fbm(c * 3.5 + vec3(0.0, 0.0, d * 2.2 - t * 2.0));            // llamaradas que suben y cambian
        float rays = fbm(c * 9.0 + vec3(t * 0.6, 0.0, d * 0.8 - t));
        float reach = 1.0 + 0.16 + 0.55 * pow(fl, 2.2) + 0.12 * rays;            // hasta dónde llega cada llamarada
        float edge = 1.0 - smoothstep(1.0, reach, d);
        float glow = exp(-(d - 1.0) * 3.2) * 0.55;                                 // halo suave
        float rim = exp(-(d - 1.0) * 22.0) * 0.9;                                  // anillo brillante pegado al disco
        float v = edge * (0.45 + 0.9 * fl) + glow + rim;
        vec3 col = mix(vec3(1.0, 0.45, 0.08), vec3(1.0, 0.85, 0.45), clamp(rim + edge * 0.6, 0.0, 1.0));
        gl_FragColor = vec4(col * v, clamp(v, 0.0, 1.0));
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), m);
  mesh.renderOrder = 2;
  return mesh;
}

export function createObjectView({ THREE, renderer, makeMaterial, hiResMap, lang, onExit, bodies = {} }) {
  const $ = id => document.getElementById(id);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.01, 100);
  camera.position.set(0, 0, 3.2);
  // Fondo de estrellas sencillo (puntos fijos)
  {
    const n = 1800, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = 40, s = Math.sqrt(1 - u * u);
      pos.set([r * s * Math.cos(th), r * u, r * s * Math.sin(th)], i * 3);
      const b = 0.35 + Math.pow(Math.random(), 3) * 0.65; col.set([b, b, b * 1.05], i * 3);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 0.09, vertexColors: true, sizeAttenuation: true, depthWrite: false })));
  }
  const pivot = new THREE.Group(); // lo que gira el usuario
  scene.add(pivot);
  // Luces para los modelos 3D (satélites); la Luna usa su propio sombreado y no les afecta
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.8); keyLight.position.set(-3, 2, 5);
  scene.add(keyLight, new THREE.HemisphereLight(0xdbe7ff, 0x334466, 1.4));
  let mode = 'moon', model = null, body = 'moon';
  const moonMat = makeMaterial();
  let mat = moonMat;
  const mats = { moon: moonMat }; // materiales de cada astro, creados la primera vez que se abren
  const matFor = b => {
    if (mats[b]) return mats[b];
    mats[b] = b === 'sun' ? sunMaterial(THREE, bodies.sun.map()) : bodies[b].material();
    return mats[b];
  };
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 192, 96), mat);
  // Anillos (Saturno) y capa de nubes (Tierra): se crean al abrir ese planeta y giran con él
  let rings = null, clouds = null, alt = false;
  function setExtras(b) {
    if (rings) { pivot.remove(rings); rings = null; }
    if (clouds) { pivot.remove(clouds); clouds = null; }
    const cfg = bodies[b] || {};
    if (cfg.rings) {
      const { inner, outer } = cfg.rings, g = new THREE.RingGeometry(inner, outer, 160, 1);
      const pos = g.attributes.position, uv = g.attributes.uv;
      for (let i = 0; i < pos.count; i++) uv.setXY(i, (Math.hypot(pos.getX(i), pos.getY(i)) - inner) / (outer - inner), 0.5);
      rings = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: cfg.rings.map(), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
      rings.rotation.x = -Math.PI / 2; // en el plano del ecuador
      pivot.add(rings);
    }
    if (cfg.clouds) {
      clouds = new THREE.Mesh(new THREE.SphereGeometry(1.012, 96, 48), new THREE.MeshLambertMaterial({ color: 0xffffff, alphaMap: cfg.clouds(), transparent: true, depthWrite: false }));
      clouds.rotation.y = -Math.PI / 2;
      pivot.add(clouds);
    }
  }
  // Corona del Sol con llamaradas en movimiento
  const corona = coronaMesh(THREE); corona.visible = false; scene.add(corona);
  mesh.rotation.y = -Math.PI / 2; // longitud 0 (centro de la cara visible) hacia la cámara
  pivot.add(mesh);
  let hiRes = false;

  // Lugares: posición en la esfera (mismo mapa equirectangular que la textura)
  let places = [];
  const placesCache = {};
  const labelBox = $('objLabels');
  const local = (lat, lon) => {
    const phi = (lon + 180) / 360 * Math.PI * 2, th = (90 - lat) * Math.PI / 180;
    return new THREE.Vector3(-Math.cos(phi) * Math.sin(th), Math.cos(th), Math.sin(phi) * Math.sin(th));
  };
  function loadPlaces(b) {
    const url = b === 'moon' ? 'data/luna-lugares.json' : bodies[b]?.places;
    places = (placesCache[b] || []).concat(extra(b));
    buildLabels();
    if (!url || placesCache[b]) return;
    fetch(url).then(r => r.json()).then(d => {
      placesCache[b] = d.lugares.map(p => ({ ...p, v: local(p.lat, p.lon) }));
      if (body === b) { places = placesCache[b].concat(extra(b)); buildLabels(); }
    }).catch(() => { });
  }
  const extra = b => (bodies[b]?.extraPlaces?.() || []).map(p => ({ ...p, v: local(p.lat, p.lon) }));
  loadPlaces('moon');
  const LANDING = new Set(['alunizaje', 'aterrizaje']);
  const PLAIN = new Set(['mar', 'llanura', 'valle', 'polo']); // nombres de regiones: en cursiva, sin recuadro
  function buildLabels() {
    labelBox.replaceChildren();
    for (const p of places) {
      const el = document.createElement('button');
      el.type = 'button'; el.className = `objLabel ${PLAIN.has(p.tipo) ? 'mar' : LANDING.has(p.tipo) ? 'alunizaje' : p.tipo}`;
      el.textContent = (LANDING.has(p.tipo) ? '🚩 ' : '') + (lang() === 'en' ? p.en : p.es);
      el.onclick = e => { e.stopPropagation(); showPlace(p); };
      labelBox.append(el); p.el = el;
    }
  }
  function showPlace(p) {
    const en = lang() === 'en';
    $('objCardTitle').textContent = (LANDING.has(p.tipo) ? '🚩 ' : '') + (en ? p.en : p.es);
    const kind = { mar: en ? 'Lunar sea (mare)' : 'Mar lunar', crater: en ? 'Crater' : 'Cráter', alunizaje: en ? 'Landing site' : 'Lugar de alunizaje',
      aterrizaje: en ? 'Landing site' : 'Lugar de aterrizaje', monte: en ? 'Volcano / mountain' : 'Volcán / monte', valle: en ? 'Canyon / valley' : 'Cañón / valle',
      llanura: en ? 'Region / plain' : 'Región / llanura', polo: en ? 'Polar region' : 'Región polar', tormenta: en ? 'Storm' : 'Tormenta', aqui: en ? 'Your location' : 'Tu ubicación' }[p.tipo] || '';
    $('objCardMeta').textContent = `${kind}${p.km ? ` · ${p.km.toLocaleString(en ? 'en' : 'es')} km` : ''} · ${Math.abs(p.lat).toFixed(1)}° ${p.lat >= 0 ? 'N' : 'S'}, ${Math.abs(p.lon).toFixed(1)}° ${p.lon >= 0 ? 'E' : (en ? 'W' : 'O')}`;
    $('objCardText').textContent = (en ? p.txt_en : p.txt_es) || '';
    $('objCard').hidden = false;
    flyTo(p);
  }
  // Girar la Luna para poner un lugar delante
  let flight = null;
  function flyTo(p) {
    const w = p.v.clone().applyEuler(mesh.rotation); // en coordenadas del pivote
    const target = new THREE.Quaternion().setFromUnitVectors(w.normalize(), new THREE.Vector3(0, 0, 1));
    const fd = fitDist(); flight = { from: pivot.quaternion.clone(), to: target, t: 0, dist0: dist, dist1: Math.min(dist, 1 + (fd - 1) * (PLAIN.has(p.tipo) ? 0.55 : 0.3)) };
  }

  // ── Interacción: un dedo gira, dos dedos acercan, rueda del ratón acerca ──
  const touch = $('objTouch');
  const ptrs = new Map();
  let dist = 6, targetDist = 4, vel = { x: 0, y: 0 }, lastPinch = 0, moved = 0;
  // Distancia a la que la Luna entera cabe en pantalla con margen (en vertical manda el ancho)
  const fitDist = () => {
    const v = camera.fov * Math.PI / 180, h = 2 * Math.atan(Math.tan(v / 2) * camera.aspect);
    return (bodies[body]?.extent || 1) / Math.sin(Math.min(v, h) / 2 * 0.86); // Saturno: que quepan los anillos
  };
  const rotateBy = (dx, dy) => {
    const s = mode === 'model' ? 3.2 / Math.min(innerWidth, innerHeight) : 2.4 * (dist - 1) / (dist * Math.min(innerWidth, innerHeight)); // Luna: más lento cuanto más cerca
    const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dx * s);
    const qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), dy * s);
    pivot.quaternion.premultiply(qy).premultiply(qx);
  };
  touch.addEventListener('pointerdown', e => { touch.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); vel = { x: 0, y: 0 }; flight = null; moved = 0; if (ptrs.size === 2) lastPinch = pinchDist(); });
  touch.addEventListener('pointermove', e => {
    const p = ptrs.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (ptrs.size === 1) { rotateBy(dx, dy); vel = { x: dx, y: dy }; moved += Math.abs(dx) + Math.abs(dy); }
    else if (ptrs.size === 2) { const d = pinchDist(); if (lastPinch) targetDist = clampDist(targetDist * lastPinch / d); lastPinch = d; moved += 10; }
  });
  const end = e => { ptrs.delete(e.pointerId); lastPinch = ptrs.size === 2 ? pinchDist() : 0; if (moved < 6 && e.type === 'pointerup') $('objCard').hidden = true; };
  touch.addEventListener('pointerup', end); touch.addEventListener('pointercancel', end);
  touch.addEventListener('wheel', e => { e.preventDefault(); targetDist = clampDist(targetDist * Math.exp(e.deltaY * 0.0012)); }, { passive: false });
  const pinchDist = () => { const [a, b] = [...ptrs.values()]; return Math.hypot(a.x - b.x, a.y - b.y) || 1; };
  const clampDist = d => Math.min(fitDist() * 1.5, Math.max(mode === 'model' ? 0.45 : body === 'moon' ? 1.16 : 1.25, d)); // más cerca los mapas ya se ven borrosos

  // ── Luz: iluminada entera (por defecto) o fase de hoy ──
  let fullLight = true, phaseLight = new THREE.Vector3(1, 0, 0);
  const fullDir = new THREE.Vector3(-0.62, 0.38, 1).normalize(); // casi de frente y algo ladeada: se ven los relieves
  function setLight(full) {
    fullLight = full;
    if (body === 'moon') $('objLight').textContent = full ? (lang() === 'en' ? '☀️ Fully lit' : '☀️ Iluminada') : (lang() === 'en' ? '🌗 Tonight\'s phase' : '🌗 Fase de hoy');
  }
  $('objLight').onclick = () => {
    const tg = bodies[body]?.toggle;
    if (!tg) return setLight(!fullLight);
    alt = !alt;
    $('objLight').textContent = tg[lang() === 'en' ? 'en' : 'es'][alt ? 1 : 0];
    if (bodies[body].altMaterial) { mats[body + ':alt'] ||= bodies[body].altMaterial(); mat = alt ? mats[body + ':alt'] : mats[body]; mesh.material = mat; }
    if (clouds) clouds.visible = !alt;
    if (bodies[body].labelsWhenAlt) labelBox.hidden = !alt; // Venus: los nombres son de la superficie
  };

  // ── Música ──
  const music = new Ambient();
  const MUSIC_KEY = 'dc_obj_musica';
  let musicOn = (() => { try { return localStorage.getItem(MUSIC_KEY) !== 'off'; } catch { return true; } })();
  const paintMusic = () => { $('objMusic').textContent = musicOn ? '🔊' : '🔇'; };
  $('objMusic').onclick = () => {
    musicOn = !musicOn; paintMusic();
    try { localStorage.setItem(MUSIC_KEY, musicOn ? 'on' : 'off'); } catch { }
    musicOn ? music.start() : music.stop();
  };

  let active = false;
  // opts.model: un modelo 3D ya normalizado (dimensión mayor = 1) → modo «modelo» (satélites); si no, la Luna
  function enter({ phaseDir, name, model: m, card, body: b = 'moon' }) {
    active = true;
    mode = m ? 'model' : 'moon'; // «moon» = un astro esférico (Luna, Marte o Sol)
    body = m ? null : b;
    alt = false;
    if (!m) { mat = matFor(body); mesh.material = mat; loadPlaces(body); setExtras(body); } else setExtras(null);
    mesh.visible = mode === 'moon';
    corona.visible = body === 'sun';
    labelBox.hidden = mode !== 'moon';
    const tg = bodies[body]?.toggle; // Venus: nubes/superficie · Tierra: nubes sí/no · Luna: luz
    $('objLight').hidden = !(body === 'moon' || tg);
    if (tg) $('objLight').textContent = tg[lang() === 'en' ? 'en' : 'es'][0];
    if (m) { model = m; model.scale.multiplyScalar(1.9); pivot.add(model); }
    phaseLight.copy(phaseDir || phaseLight);
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    pivot.quaternion.identity(); targetDist = fitDist(); dist = targetDist * 1.7; vel = { x: 0, y: 0 }; flight = null;
    if (mode === 'model') pivot.quaternion.setFromEuler(new THREE.Euler(0.35, -0.6, 0)); // vista de tres cuartos
    if (bodies[body]?.face) { const fc = bodies[body].face, w = local(...(typeof fc === 'function' ? fc() : fc)).applyEuler(mesh.rotation); pivot.quaternion.setFromUnitVectors(w.normalize(), new THREE.Vector3(0, 0, 1)); } // cara más interesante delante
    if (bodies[body]?.tilt) { const [tz, tx] = bodies[body].tilt; pivot.quaternion.premultiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(tx * Math.PI / 180, 0, tz * Math.PI / 180))); } // inclinación real (Urano tumbado, anillos de Saturno a la vista)
    labelBox.hidden = mode !== 'moon' || !!bodies[body]?.labelsWhenAlt;
    setLight(true); paintMusic();
    $('objTitle').textContent = name;
    $('objHint').textContent = lang() === 'en' ? 'Rotate with one finger · zoom with two · tap a name' : 'Gira con un dedo · acerca con dos · toca un nombre';
    if (mode === 'moon' && places.length) buildLabels();
    $('objCard').hidden = true;
    if (card && mode !== 'model') { $('objCardTitle').textContent = card.title; $('objCardMeta').textContent = card.meta || ''; $('objCardText').textContent = card.text || ''; $('objCard').hidden = false; }
    if (body === 'sun') $('objHint').textContent = lang() === 'en' ? 'Rotate with one finger · zoom with two' : 'Gira con un dedo · acerca con dos';
    if (mode === 'model') {
      $('objHint').textContent = lang() === 'en' ? 'Rotate with one finger · zoom with two' : 'Gira con un dedo · acerca con dos';
      if (card) { $('objCardTitle').textContent = card.title; $('objCardMeta').textContent = card.meta || ''; $('objCardText').textContent = card.text || ''; $('objCard').hidden = false; }
    }
    $('objView').hidden = false;
    document.body.classList.add('objmode');
    if (body === 'moon' && !hiRes) { hiRes = true; const low = mat.uniforms.map.value; hiResMap(tex => { if (!active) { tex.dispose(); hiRes = false; return; } mat.uniforms.map.value = tex; mat.userData.low = low; }); }
    if (musicOn) music.start(); // estamos dentro de un toque del usuario: iOS deja sonar
  }
  function exit() {
    active = false;
    music.stop();
    if (model) { pivot.remove(model); model.traverse(o => { o.geometry?.dispose(); [].concat(o.material || []).forEach(mt => { mt.map?.dispose(); mt.dispose(); }); }); model = null; }
    if (hiRes && moonMat.userData.low) { const hi = moonMat.uniforms.map.value; moonMat.uniforms.map.value = moonMat.userData.low; hi.dispose(); hiRes = false; } // libera la memoria del mapa 4K
    corona.visible = false;
    $('objView').hidden = true;
    document.body.classList.remove('objmode');
    onExit?.();
  }
  $('objClose').onclick = exit;

  const tmp = new THREE.Vector3(), camDir = new THREE.Vector3(0, 0, 1);
  function render(dt) {
    if (camera.aspect !== innerWidth / innerHeight) { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
    // Inercia al soltar y vuelo hacia un lugar
    if (!ptrs.size && !flight && (Math.abs(vel.x) + Math.abs(vel.y) > 0.05)) { rotateBy(vel.x, vel.y); vel.x *= Math.pow(0.04, dt); vel.y *= Math.pow(0.04, dt); }
    if (flight) {
      flight.t = Math.min(1, flight.t + dt / 1.1);
      const e = flight.t < 0.5 ? 2 * flight.t * flight.t : 1 - Math.pow(-2 * flight.t + 2, 2) / 2;
      pivot.quaternion.slerpQuaternions(flight.from, flight.to, e);
      targetDist = flight.dist0 + (flight.dist1 - flight.dist0) * e;
      if (flight.t >= 1) flight = null;
    }
    dist += (targetDist - dist) * (1 - Math.exp(-dt * 6));
    camera.position.set(0, 0, dist);
    camera.lookAt(0, 0, 0);
    // Luz en coordenadas del mundo (la Luna gira por debajo de ella)
    if (mat.uniforms.uLight) mat.uniforms.uLight.value.copy(fullLight || body !== 'moon' ? fullDir : phaseLight);
    if (mat.uniforms.uEarth) mat.uniforms.uEarth.value = fullLight ? 0 : 0.03;
    if (clouds) clouds.rotation.y += dt * 0.004; // las nubes de la Tierra se mueven un poco
    if (body === 'sun') { const tt = performance.now() / 1000; mat.uniforms.uTime.value = tt; corona.material.uniforms.uTime.value = tt; corona.quaternion.copy(camera.quaternion); pivot.rotateY(dt * 0.01); } // el Sol vive y gira despacio
    renderer.render(scene, camera);
    // Etiquetas: solo en la cara que mira a la cámara y según lo cerca que estés
    const r = (dist - 1) / (fitDist() - 1), lvl = r < 0.4 ? 3 : r < 0.75 ? 2 : 1;
    const W = innerWidth, H = innerHeight;
    for (const p of mode === 'moon' ? places : []) {
      if (!p.el) continue;
      tmp.copy(p.v).applyEuler(mesh.rotation).applyQuaternion(pivot.quaternion);
      const facing = tmp.dot(camDir.set(0, 0, dist).sub(tmp).normalize());
      const show = p.nivel <= lvl && facing > 0.25;
      if (!show) { if (p.el.style.display !== 'none') p.el.style.display = 'none'; continue; }
      tmp.project(camera);
      const sx = (tmp.x * 0.5 + 0.5) * W, sy = (-tmp.y * 0.5 + 0.5) * H;
      if (sx < 50 || sx > W - 50 || sy < 110 || sy > H - 40) { if (p.el.style.display !== 'none') p.el.style.display = 'none'; continue; } // no cortar nombres en el borde
      p.el.style.display = '';
      p.el.style.transform = `translate(${sx}px, ${sy}px) translate(-50%, -50%)`;
      p.el.style.opacity = Math.min(1, (facing - 0.25) * 4).toFixed(2);
    }
  }
  const startMusic = () => { if (musicOn) music.start(); };
  return { enter, exit, render, startMusic, get active() { return active; } };
}
