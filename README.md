# Planetario DarwinCaos v2

Planetario web en tiempo real para la audiencia del canal: Sol, Luna y planetas en su posición real,
más de 5.000 estrellas, las 88 constelaciones oficiales con ilustraciones, la ISS con su órbita real
y las lluvias de meteoros activas. Funciona en móvil (brújula + cámara AR) y en escritorio.

## Publicarlo

Es una web estática: sube la carpeta entera a cualquier hosting (GitHub Pages, Netlify, Cloudflare Pages…).
**Necesita HTTPS** para la cámara, la brújula y la geolocalización, y no funciona abriendo el
`index.html` con doble clic (los módulos JS exigen servidor). Para probar en local:

```bash
python3 -m http.server 8000
```

y abre http://localhost:8000

## Configurar el canal

Al principio de `app.js`:

- `CHANNEL_URL`: la URL de tu canal (**comprueba el handle**, ahora pone `@DarwinCaos`).
- `VIDEOS`: asocia cada objeto con un vídeo tuyo, por ejemplo `saturn: 'https://youtu.be/…'`.
  Ids disponibles: `sun moon mercury venus mars jupiter saturn uranus neptune pluto iss m31 m42 m45 m13 omegacen lmc sgra cygx1 3c273`,
  estrellas `s:Sirius`, `s:Betelgeuse`…, constelaciones `c:Ori`, `c:UMa`…
  Si un objeto no tiene vídeo, el botón «Ver en el canal» abre la búsqueda de tu canal con su nombre.

## Enlaces para las descripciones de los vídeos

El botón «Compartir» genera enlaces como:

```
https://tu-web/planetario/?obj=saturn&lat=40.4168&lon=-3.7038&name=Madrid&t=2026-12-14T22:00:00Z&lang=es
```

| Parámetro | Qué hace |
|---|---|
| `obj` | Abre la ficha del objeto y lo centra (`saturn`, `iss`, `c:Gem`, `s:Sirius`…) |
| `t` | Fecha y hora (ISO, UTC) — ideal para eventos: «así se verán las Gemínidas» |
| `lat`, `lon`, `name`, `tz` | Ubicación. Sin ellos, cada usuario ve su propia ciudad guardada |
| `lang` | `es` o `en` |

Consejo: para un vídeo sobre un evento, deja fuera `lat/lon` y pon solo `obj` y `t`;
así cada espectador lo verá desde su ciudad.

## Estructura

```
index.html            Interfaz y estilos
app.js                Toda la lógica (efemérides, render 3D, interfaz)
data/cielo.json       Estrellas (Hipparcos, mag ≤ 6), líneas y anclajes de las ilustraciones
img/planets/          Texturas fotográficas del Sol, la Luna y los planetas
img/constelaciones/   85 ilustraciones de constelaciones (WebP)
vendor/               three.js 0.160, Astronomy Engine 2.1.19, satellite.js 5.0 (copias locales, sin CDN)
```

## Fuentes de datos externas (desde el navegador del usuario)

- Órbita ISS: CelesTrak (respaldo: wheretheiss.at). Se guarda en el navegador 6 h; si ambas fallan, usa la última guardada.
- Buscador de ciudades: Open-Meteo Geocoding (gratis, sin clave).

## Créditos y licencias (deben mantenerse visibles; están en el botón ⓘ de la app)

- Ilustraciones de constelaciones: Johan Meuris, vía Stellarium — Licencia Arte Libre (Free Art License 1.3).
- Líneas de constelaciones: Stellarium (CC BY-SA 4.0).
- Catálogo de estrellas y nombres: d3-celestial (BSD-3), basado en Hipparcos.
- Texturas planetarias: Solar System Scope (CC BY 4.0). Plutón: NASA/JPL.
- Efemérides: Astronomy Engine (MIT). Órbitas: satellite.js (MIT). 3D: three.js (MIT).

## Historial de versiones

### Versión 1.1 — 23 de noviembre de 2026
- **📅 Calendario** (nuevo botón en la barra lateral) con dos pestañas:
  - **🌙 Esta noche:** atardecer, noche cerrada y amanecer; fase y horario de la Luna; planetas visibles con la mejor hora y dirección; pasos visibles de la ISS; estrellas fugaces; constelaciones altas; qué se puede ver de día. Todo se puede tocar para verlo en el cielo.
  - **📅 Eventos:** fases lunares y superlunas, eclipses (indicando si se ven desde tu ciudad), oposiciones, máximas elongaciones, conjunciones de la Luna con planetas y estrellas, conjunciones entre planetas, lluvias de meteoros, equinoccios y solsticios (según tu hemisferio), vídeos nuevos de DarwinCaos de la última semana, próximos lanzamientos y noticias propias. Filtros por tipo.
- **«Ver en el canal»** abre automáticamente el último vídeo de DarwinCaos sobre ese astro.
- **Pantalla limpia:** se mantiene el nombre de la constelación a la que miras.

### Cómo se rellena el calendario
- **Lo astronómico** se calcula en la propia app: no hay que hacer nada.
- **Vídeos y lanzamientos:** el robot `.github/workflows/actualizar-calendario.yml` ejecuta `scripts/actualizar-calendario.mjs` cada 6 horas y actualiza `data/eventos.json` (RSS del canal + Launch Library 2). Se puede lanzar a mano en la pestaña **Actions → Actualizar calendario → Run workflow**.
- **Noticias propias:** edita `data/eventos-manuales.json` en GitHub (icono del lápiz) y añade eventos con este formato:
  ```json
  { "fecha": "2026-12-13T21:00:00+01:00", "titulo": "Directo: lluvia de Gemínidas", "descripcion": "Opcional", "enlace": "https://… (opcional)" }
  ```
  Al guardar, el robot se ejecuta solo y el evento aparece en unos minutos.
- **Enlace de astros con vídeos:** las palabras clave están en `KEYWORDS` dentro del script (por ejemplo, un título con «Saturno» enlaza el botón de Saturno).

### Versión 1.0 — 23 de noviembre de 2026
Primera versión estable.

- **Cielo real** para cualquier ubicación y fecha: Sol, Luna (con su fase), planetas y Plutón con efemérides de precisión; 8.878 estrellas del catálogo Hipparcos (215 con nombre); las 88 constelaciones con las ilustraciones de Stellarium.
- **ISS** con su órbita real (CelesTrak), seguimiento automático y próximos pasos visibles.
- **Estrellas fugaces** de las lluvias de meteoros reales activas.
- **Fichas ampliadas** de 35 objetos (planetas, Luna, Sol, ISS, cielo profundo y estrellas famosas) con datos clave y «Leer más».
- **Horizonte según el entorno** (ciudad, pueblo o campo/bosque), detectado automáticamente, con su contaminación lumínica.
- **Orientación:** brújula en pantalla, insignias N/E/S/O, rosa de los vientos en el cenit con el logo del canal.
- **«Seguir el móvil»** activado al entrar (Android: sensor de cuaterniones; iPhone: brújula filtrada), norte geográfico corregido con el modelo magnético WMM 2025; se desactiva al arrastrar el cielo.
- **Cámara AR**, viaje en el tiempo, buscador de astros y ciudades, «Usar mi ubicación», enlaces para compartir, modo nocturno rojo, pantalla limpia, botón «Vista inicial», español e inglés.

### Cómo publicar una versión nueva
1. Cambia `APP_VERSION` al principio de `app.js` (por ejemplo, `'1.1'`).
2. Cambia los `?v=1.0` de las etiquetas `<script>` de `index.html` por el mismo número.
3. Sube los archivos modificados. Los móviles descargarán automáticamente la versión nueva.
