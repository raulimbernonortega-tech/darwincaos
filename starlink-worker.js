// Calcula en segundo plano dónde están los >10.000 Starlink (para no frenar el cielo).
// Recibe las órbitas (TLE) una vez y, en cada petición, devuelve acimut, altura e iluminación de todos
// en dos instantes (t y t+dt) para que la app interpole el movimiento con suavidad.
importScripts('vendor/satellite.min.js');
const S = self.satellite, D2R = Math.PI / 180;
let recs = [];
self.onmessage = ({ data }) => {
  if (data.type === 'init') {
    const l = data.tle.split(/\r?\n/);
    recs = [];
    for (let i = 0; i + 2 < l.length; i += 3) if (l[i + 1]?.startsWith('1 ')) { try { recs.push(S.twoline2satrec(l[i + 1], l[i + 2])); } catch { } }
    self.postMessage({ type: 'ready', n: recs.length });
    return;
  }
  if (data.type === 'pos') {
    const obs = { longitude: data.lon * D2R, latitude: data.lat * D2R, height: 0 }, su = data.sun, n = recs.length;
    const out = new Float32Array(n * 6);
    data.times.forEach((t, k) => {
      const date = new Date(t), gmst = S.gstime(date);
      for (let i = 0; i < n; i++) {
        const pv = S.propagate(recs[i], date), o = i * 6 + k * 3;
        if (!pv.position) { out[o + 1] = -99; continue; }
        const look = S.ecfToLookAngles(obs, S.eciToEcf(pv.position, gmst)), r = pv.position;
        const d = r.x * su[0] + r.y * su[1] + r.z * su[2], perp = Math.hypot(r.x - d * su[0], r.y - d * su[1], r.z - d * su[2]);
        out[o] = look.azimuth; out[o + 1] = look.elevation; out[o + 2] = d > 0 || perp > 6371 ? 1 : 0;
      }
    });
    self.postMessage({ type: 'pos', id: data.id, out, times: data.times }, [out.buffer]);
  }
};
