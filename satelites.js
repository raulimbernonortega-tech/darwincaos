// ───────────── Satélites destacados ─────────────
// Posición real a partir de su órbita (TLE de CelesTrak, actualizada por el robot), brillo estimado,
// si se ven ahora, su recorrido por el cielo y un modelo 3D al acercarse: el oficial de la NASA
// (NASA 3D Resources, dominio público) o una forma aproximada si no hay modelo público.
import { GLTFLoader } from './vendor/addons/GLTFLoader.js';
import { MeshoptDecoder } from './vendor/addons/libs/meshopt_decoder.module.js';

const D2R = Math.PI / 180, R2D = 180 / Math.PI, AU_KM = 149597870.7;

export function createSatellites({ THREE, SAT, A, scene, radius, altAzVec, screenSprite, glowTex, makeLabel, place, sunDir, sunAltAt, lang }) {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const root = new THREE.Group();
  scene.add(root);
  // Luz de relleno suave (la Tierra devuelve luz azulada a los satélites) para que el modelo no quede negro por detrás
  scene.add(new THREE.HemisphereLight(0xdbe7ff, 0x3a4a6a, 1.6));
  let sats = [], info = {}, status = 'loading', path = null, extra = [];
  // Crea un satélite «al vuelo» (un Starlink tocado) con la misma lógica que los destacados
  function makeSat(x) {
    const s = { ...x, info: info[x.tipo], satrec: SAT.twoline2satrec(x.l1, x.l2), group: new THREE.Group(), scaled: new THREE.Group(), model: null, now: null };
    s.glow = screenSprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthTest: false, sizeAttenuation: false }), 14);
    s.glow.renderOrder = 21;
    s.group.add(s.scaled, s.glow);
    root.add(s.group);
    return s;
  }
  function clearExtra() { for (const s of extra) root.remove(s.group); extra = []; }

  // ── Starlink: más de 10.000 puntos calculados en un «worker» (otro hilo) ──
  const SL = { state: 'off', worker: null, lines: null, n: 0, data: null, t0: 0, t1: 0, waiting: false, lastAsk: 0, points: null };
  function starlinkStart() {
    SL.state = 'loading';
    // Las órbitas de Starlink viven en la rama «datos» del repositorio (se sobrescribe cada 6 h); copia local como respaldo
    const urls = ['https://raw.githubusercontent.com/raulimbernonortega-tech/darwincaos/datos/starlink.tle', 'data/starlink.tle'];
    const tryGet = i => i >= urls.length ? Promise.reject(new Error('sin datos')) : fetch(urls[i]).then(r => { if (!r.ok) throw new Error(r.status); return r.text(); }).catch(() => tryGet(i + 1));
    tryGet(0).then(txt => {
      SL.lines = txt.split(/\r?\n/);
      SL.worker = new Worker('starlink-worker.js?v=1.7');
      SL.worker.onmessage = ({ data }) => {
        if (data.type === 'ready') { SL.n = data.n; buildPoints(); SL.state = 'ok'; }
        if (data.type === 'pos') { SL.data = data.out; SL.t0 = data.times[0]; SL.t1 = data.times[1]; SL.waiting = false; }
      };
      SL.worker.postMessage({ type: 'init', tle: txt });
    }).catch(() => { SL.state = 'error'; });
  }
  function buildPoints() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SL.n * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(SL.n * 3), 3));
    SL.points = new THREE.Points(g, new THREE.PointsMaterial({ size: 3.2, sizeAttenuation: false, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false }));
    SL.points.renderOrder = 18; SL.points.frustumCulled = false;
    scene.add(SL.points);
  }
  function updateStarlink(date, on) {
    if (on && SL.state === 'off') starlinkStart();
    if (SL.points) SL.points.visible = !!on;
    if (!on || SL.state !== 'ok') return;
    const now = +date;
    // Pedimos posiciones para [ahora, ahora+3 s] cada ~2 s; mientras, interpolamos
    if (!SL.waiting && (!SL.data || now > SL.t1 - 1000 || now < SL.t0 - 5000)) {
      SL.waiting = true;
      const sv = A.GeoVector('Sun', date, true), l = Math.hypot(sv.x, sv.y, sv.z), p = place();
      SL.worker.postMessage({ type: 'pos', times: [now, now + 3000], lat: p.lat, lon: p.lon, sun: [sv.x / l, sv.y / l, sv.z / l] });
    }
    if (!SL.data) return;
    const f = Math.min(1.5, Math.max(0, (now - SL.t0) / (SL.t1 - SL.t0)));
    const pos = SL.points.geometry.attributes.position.array, col = SL.points.geometry.attributes.color.array, d = SL.data;
    for (let i = 0; i < SL.n; i++) {
      const o = i * 6;
      let az0 = d[o], az1 = d[o + 3]; if (az1 - az0 > Math.PI) az1 -= 2 * Math.PI; else if (az0 - az1 > Math.PI) az1 += 2 * Math.PI;
      const az = az0 + (az1 - az0) * f, alt = d[o + 1] + (d[o + 4] - d[o + 1]) * f;
      const ca = Math.cos(alt), r = radius - 20;
      pos[i * 3] = r * ca * Math.sin(az); pos[i * 3 + 1] = r * Math.sin(alt); pos[i * 3 + 2] = -r * ca * Math.cos(az);
      const k = alt < 0 ? 0 : d[o + 2] ? 0.95 : 0.16; // iluminado: blanco azulado; en sombra: apenas visible
      col[i * 3] = k * 0.85; col[i * 3 + 1] = k * 0.9; col[i * 3 + 2] = k;
    }
    SL.points.geometry.attributes.position.needsUpdate = true;
    SL.points.geometry.attributes.color.needsUpdate = true;
  }
  // El Starlink más cercano a un toque en pantalla (si lo hay a menos de 22 px)
  function pickStarlink(x, y, camera) {
    if (SL.state !== 'ok' || !SL.points?.visible) return null;
    const pos = SL.points.geometry.attributes.position.array, v = new THREE.Vector3();
    let best = -1, bestD = 22;
    for (let i = 0; i < SL.n; i++) {
      if (pos[i * 3 + 1] < 0) continue;
      v.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]).project(camera);
      if (v.z > 1) continue;
      const dd = Math.hypot((v.x + 1) / 2 * innerWidth - x, (1 - v.y) / 2 * innerHeight - y);
      if (dd < bestD) { bestD = dd; best = i; }
    }
    if (best < 0) return null;
    const l0 = SL.lines[best * 3]?.trim(), l1 = SL.lines[best * 3 + 1], l2 = SL.lines[best * 3 + 2];
    if (!l1?.startsWith('1 ')) return null;
    clearExtra();
    const yy = +l1.slice(9, 11), launchNo = +l1.slice(11, 14);
    const s = makeSat({ id: 'starlink-' + l1.slice(2, 7).trim(), tipo: 'starlink', nombre: l0, norad: +l1.slice(2, 7), l1, l2, lanzamiento: null, anio: (yy < 57 ? 2000 : 1900) + yy, lanzNo: launchNo });
    extra.push(s);
    return s;
  }
  const starlinkCount = () => SL.n;

  // ── Formas aproximadas (sin modelo público): proporciones reales, materiales sencillos ──
  const M = {
    gold: new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 0.6, roughness: 0.45, emissive: 0x2a1f08 }),
    white: new THREE.MeshStandardMaterial({ color: 0xe5e7eb, metalness: 0.1, roughness: 0.6, emissive: 0x1f2124 }),
    grey: new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.5, roughness: 0.5, emissive: 0x15171a }),
    panel: new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.3, roughness: 0.35, emissive: 0x0b1530, side: THREE.DoubleSide }),
    dark: new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.4, roughness: 0.5, emissive: 0x0b0f17, side: THREE.DoubleSide }),
  };
  const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  const cyl = (r, l, m, axis = 'x') => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, 20), m); if (axis === 'x') c.rotation.z = Math.PI / 2; if (axis === 'z') c.rotation.x = Math.PI / 2; return c; };
  const wing = (w, h, x, y = 0, z = 0) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M.panel); p.position.set(x, y, z); return p; };
  function buildApprox(kind) {
    const g = new THREE.Group();
    if (kind === 'tiangong') { // núcleo Tianhe + laboratorios Wentian y Mengtian en «T», con sus alas solares
      g.add(cyl(2.1, 16.6, M.white));
      const lab = (s) => { const l = cyl(2.1, 17.9, M.white, 'z'); l.position.set(-8.3, 0, s * 9); g.add(l); g.add(wing(27, 4.2, -8.3, 0, s * 17)); };
      lab(1); lab(-1);
      g.add(wing(4, 12, 4, 7.5), wing(4, 12, 4, -7.5));
      const sz = cyl(1.4, 9, M.grey); sz.position.x = 12.8; g.add(sz); // nave Shenzhou acoplada
    } else if (kind === 'meteosat') { g.add(box(2.4, 2.8, 4.5, M.gold)); g.add(wing(2.4, 8, 0, 5.4)); }
    else if (kind === 'gps') { g.add(box(2.5, 2.5, 3, M.gold)); g.add(wing(2.2, 5, 0, 4)); g.add(wing(2.2, 5, 0, -4)); }
    else if (kind === 'galileo') { g.add(box(1.5, 1.2, 2.7, M.gold)); g.add(wing(1.1, 6, 0, 3.8)); g.add(wing(1.1, 6, 0, -3.8)); }
    else if (kind === 'bluebird') { const a = box(8, 0.12, 8, M.dark); g.add(a); const b = box(1.2, 1, 1.2, M.white); b.position.y = -0.6; g.add(b); }
    else if (kind === 'starlink') { g.add(box(4.1, 0.35, 2.7, M.grey)); g.add(wing(12.5, 2.4, 8.5, 0.2)); g.add(wing(12.5, 2.4, -8.5, 0.2)); }
    return g;
  }
  // Normaliza un modelo: centrado y con su dimensión mayor = 1
  function normalize(obj) {
    const b = new THREE.Box3().setFromObject(obj), size = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
    const holder = new THREE.Group(); obj.position.sub(c); holder.add(obj); holder.scale.setScalar(1 / Math.max(size.x, size.y, size.z)); return holder;
  }
  function ensureModel(s) {
    if (s.model !== null) return;
    s.model = 'cargando';
    const done = obj => { obj.traverse(o => { if (o.isMesh && o.material?.isMeshStandardMaterial) { o.material.emissive ||= new THREE.Color(); if (o.material.map) { o.material.emissiveMap = o.material.map; o.material.emissive.setRGB(0.22, 0.22, 0.22); } } }); s.model = normalize(obj); s.scaled.add(s.model); };
    if (s.info.modelo) loader.load(`img/satelites/${s.info.modelo}`, gltf => done(gltf.scene), undefined, () => done(buildApprox('gps')));
    else done(buildApprox(s.info.aprox));
  }

  // ── Posición, iluminación y brillo ──
  function lookAt(s, date) {
    const pv = SAT.propagate(s.satrec, date);
    if (!pv.position) return null;
    const gmst = SAT.gstime(date), p = place();
    const obsGd = { longitude: p.lon * D2R, latitude: p.lat * D2R, height: 0 };
    const look = SAT.ecfToLookAngles(obsGd, SAT.eciToEcf(pv.position, gmst));
    const geo = SAT.eciToGeodetic(pv.position, gmst);
    const sv = A.GeoVector('Sun', date, true), sl = Math.hypot(sv.x, sv.y, sv.z);
    const sun = { x: sv.x / sl * AU_KM, y: sv.y / sl * AU_KM, z: sv.z / sl * AU_KM }, r = pv.position;
    const su = { x: sun.x / AU_KM, y: sun.y / AU_KM, z: sun.z / AU_KM };
    const d = r.x * su.x + r.y * su.y + r.z * su.z, perp = Math.hypot(r.x - d * su.x, r.y - d * su.y, r.z - d * su.z);
    const sunlit = d > 0 || perp > 6371;
    // Ángulo de fase (Sol–satélite–observador) para estimar el brillo
    const o = SAT.ecfToEci(SAT.geodeticToEcf(obsGd), gmst);
    const toSun = { x: sun.x - r.x, y: sun.y - r.y, z: sun.z - r.z }, toObs = { x: o.x - r.x, y: o.y - r.y, z: o.z - r.z };
    const ph = Math.acos(Math.max(-1, Math.min(1, (toSun.x * toObs.x + toSun.y * toObs.y + toSun.z * toObs.z) / (Math.hypot(toSun.x, toSun.y, toSun.z) * Math.hypot(toObs.x, toObs.y, toObs.z)))));
    const F = Math.max(1e-3, ((Math.PI - ph) * Math.cos(ph) + Math.sin(ph)) / Math.PI);
    const mag = s.info.mag + 5 * Math.log10(look.rangeSat / 1000) - 2.5 * Math.log10(F / 0.318); // 0,318 = medio iluminado
    return { az: look.azimuth * R2D, alt: look.elevation * R2D, range: look.rangeSat, height: geo.height, sunlit, mag: sunlit ? mag : null,
      speed: Math.hypot(pv.velocity.x, pv.velocity.y, pv.velocity.z) * 3600, period: 2 * Math.PI / s.satrec.no }; // no: rad/min
  }
  // Se ve si está iluminado, sobre el horizonte, el cielo está oscuro y su brillo lo permite
  const visibility = (n, date) => {
    if (!n || n.alt < 0) return 'below';
    if (!n.sunlit) return 'shadow';
    if (sunAltAt(date) > -6) return 'day';
    return n.mag < 4.5 ? 'eye' : n.mag < 8 ? 'binoculars' : 'telescope';
  };

  // ── Carga de datos ──
  async function load() {
    try {
      const [d, inf] = await Promise.all(['data/satelites.json', 'data/satelites-info.json'].map(u => fetch(`${u}?t=${Math.floor(Date.now() / 600e3)}`).then(r => r.json())));
      info = inf.tipos;
      sats = d.sats.filter(x => info[x.tipo]).map(makeSat);
      buildLabels();
      status = 'ok';
    } catch (e) { console.warn('Satélites:', e.message); status = 'offline'; }
  }
  const nameOf = s => {
    if (s.tipo === 'starlink') return s.nombre.replace('STARLINK', 'Starlink');
    const base = s.info[lang() === 'en' ? 'en' : 'es'] || s.nombre;
    const m = s.tipo === 'bluebird' && s.nombre.match(/(\d+)\s*$/);
    return m ? `${base} ${m[1]}` : base;
  };
  function buildLabels() {
    for (const s of sats) {
      if (s.label) s.group.remove(s.label);
      s.label = makeLabel(nameOf(s).replace(/\s*\(.*\)/, ''), { color: '#c7d2fe', px: 13, weight: 600 });
      s.group.add(s.label);
    }
  }

  // ── Actualización cada fotograma ──
  const tmp = new THREE.Vector3();
  function update(date, fov, on, selectedId, starlinkOn) {
    updateStarlink(date, starlinkOn);
    root.visible = (on || extra.length > 0) && status === 'ok';
    if (!root.visible) return;
    const pxPerRad = innerHeight / (2 * Math.tan(fov * D2R / 2));
    for (const s of on ? sats.concat(extra) : extra) {
      const n = s.now = lookAt(s, date);
      s.group.visible = !!n && n.alt > -3;
      if (!s.group.visible) continue;
      s.group.position.copy(altAzVec(n.az, n.alt, radius));
      s.group.lookAt(tmp.copy(s.group.position).add(sunDir())); // paneles hacia el Sol
      // Tamaño: el real si se ve; si no, ampliado al hacer zoom (como en un telescopio) para poder ver el modelo
      const real = s.info.tam / (n.range * 1000);
      const boost = fov * D2R * 0.22 * Math.min(1, Math.max(0, (10 - fov) / 6));
      const ang = Math.max(real, boost), px = ang * pxPerRad;
      if (px > 6) ensureModel(s);
      s.scaled.visible = px > 6 && s.model && s.model !== 'cargando';
      s.scaled.scale.setScalar(radius * Math.tan(ang));
      const bright = n.sunlit ? Math.min(1, Math.max(0.25, (7 - (n.mag ?? 7)) / 6)) : 0.12;
      s.glow.material.opacity = bright * Math.min(1, Math.max(0, 1.3 - px / 30));
      s.glow.material.color.set(n.sunlit ? 0xe0e7ff : 0x475569);
      const show = s.id === selectedId || fov < 25 || (n.sunlit && (n.mag ?? 9) < 3.5);
      if (s.label) { s.label.visible = show; s.label.center.y = 1.2 + Math.max(0, px) / 26; }
    }
  }

  // ── Recorrido por el cielo: el paso actual o el próximo ──
  function computePath(s, from) {
    const step = 15e3;
    let t = +from, n = lookAt(s, new Date(t));
    if (!n) return null;
    if (s.info.orbita === 'geo') return { geo: true };
    if (n.alt < 0) { // buscar la próxima salida (hasta 24 h)
      let found = false;
      for (let k = 0; k < 24 * 240; k++) { t += step; n = lookAt(s, new Date(t)); if (n && n.alt > 0) { found = true; break; } }
      if (!found) return null;
    }
    const pts = [], start = new Date(t);
    let maxAlt = -90, maxT = start, end = start;
    for (let k = 0; k < 400; k++) { // hasta ~100 min
      n = lookAt(s, new Date(t));
      if (!n || n.alt < 0) break;
      pts.push(altAzVec(n.az, n.alt, radius));
      if (n.alt > maxAlt) { maxAlt = n.alt; maxT = new Date(t); }
      end = new Date(t); t += step;
    }
    return { pts, start, end, maxAlt, maxT, now: start <= from };
  }
  function showPath(s, from) {
    hidePath();
    const p = computePath(s, from);
    if (!p || p.geo || p.pts.length < 2) return p;
    const g = new THREE.Group();
    const geom = new THREE.BufferGeometry().setFromPoints(p.pts);
    const line = new THREE.Line(geom, new THREE.LineDashedMaterial({ color: 0xa5b4fc, dashSize: 6, gapSize: 4, transparent: true, opacity: 0.85, depthTest: false }));
    line.computeLineDistances(); line.renderOrder = 19; g.add(line);
    const hm = d => d.toLocaleTimeString(lang(), { hour: '2-digit', minute: '2-digit' });
    if (!p.now) { const a = makeLabel(`↗ ${hm(p.start)}`, { color: '#a5b4fc', px: 12 }); a.position.copy(p.pts[0]); g.add(a); } // si ya está en el cielo, la salida sobra
    const b = makeLabel(`${hm(p.end)} ↘`, { color: '#a5b4fc', px: 12 }); b.position.copy(p.pts[p.pts.length - 1]); g.add(b);
    scene.add(g); path = g;
    return p;
  }
  function hidePath() { if (path) { scene.remove(path); path.traverse(o => { o.geometry?.dispose(); o.material?.dispose?.(); }); path = null; } }
  // Próximo paso VISIBLE (iluminado, de noche y con brillo suficiente para verlo a simple vista)
  function nextVisiblePass(s, from, hours = 48) {
    if (s.info.orbita === 'geo') return null;
    let cur = null;
    for (let t = +from; t < +from + hours * 3600e3; t += 30e3) {
      const d = new Date(t), n = lookAt(s, d);
      if (!n) return null;
      if (n.alt > 10) { if (!cur || n.alt > cur.maxAlt) cur = { ...(cur || { start: d }), maxAlt: n.alt, maxAz: n.az, maxT: d, mag: n.mag }; }
      else if (cur) {
        const atMax = lookAt(s, cur.maxT);
        if (atMax.sunlit && sunAltAt(cur.maxT) < -6 && atMax.mag < 4.5) return { ...cur, end: d, mag: atMax.mag };
        cur = null;
      }
    }
    return null;
  }

  return {
    load, update, showPath, hidePath, nextVisiblePass, visibility, lookAt, buildLabels, nameOf, pickStarlink, clearExtra, starlinkCount,
    get list() { return sats; }, get status() { return status; },
  };
}
