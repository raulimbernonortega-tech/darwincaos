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

### Versión 1.5.2 — 24 de noviembre de 2026 (corrección importante)
- **Eventos a dos meses vista**: menos información y cálculo casi instantáneo (≈0,4 s en un móvil lento frente a ≈6 s).
- Corregido un fallo por el que, si la ubicación cambiaba mientras se calculaba, los eventos del cielo no llegaban a aparecer.
- Con el calendario abierto, el cielo de fondo se pinta más despacio para dejar el móvil libre.

### Versión 1.5.1 — 24 de noviembre de 2026 (corrección importante)
- **Calendario › Eventos ya no se bloquea.** El cálculo de fases, eclipses, oposiciones y conjunciones de los próximos meses es 5 veces más rápido, se hace por partes sin congelar la pantalla (la ✕ y las pestañas responden siempre), se adelanta en segundo plano al abrir la app y se guarda para el resto del día. Las noticias, vídeos y lanzamientos se muestran al instante mientras se calcula.

### Versión 1.5 — 24 de noviembre de 2026
Mejoras de uso a partir de las pruebas en iPhone:
- **Cabecera en una fila**: ubicación, fecha y brújula. Sin azimut ni altura; solo aparece un aviso ámbar **«↓ Bajo el horizonte»** cuando miras al suelo.
- **Barra inferior en una línea**: buscador, 🧭 seguir el móvil, 📷 cámara y zoom (− y + solo en ordenador).
- **Calendario con tres pestañas**: **Ahora** (antes «Qué hay en el cielo»), **Esta noche** y **Eventos**.
- **Modo «Buscar»** al pulsar 🎯 Apuntar: la ficha se recoge en una pastilla, una flecha grande indica hacia dónde girar («→ 40° · ↑ 20°») y el objeto se marca al encontrarlo (vibración en Android).
- **Ubicación**: «Empezar» la pide en la primera visita; si el iPhone la tiene bloqueada, se explica cómo activarla.
- **Vídeos relacionados** en la ficha de cada astro (largos y shorts) con miniatura; «Ver en el canal» busca en el canal o, si no hay vídeos del tema, abre el canal. Catálogo completo del canal.
- **Noticias según el idioma** de la app (español o inglés).
- **🎂 Postal «El cielo de una fecha especial»** en 📸: cielo reconstruido de cualquier fecha, hora y ciudad, con título, fase de la Luna y planetas visibles.
- Pantalla limpia: muestra la ficha del astro tocado. Sin N/E/S/O en el horizonte. Campos a 16 px (el iPhone ya no amplía al escribir). Nombre de la constelación sin solaparse con la hora.

### Versión 1.4 — 23 de noviembre de 2026
- **Mitología de las 88 constelaciones** (`data/mitologia.json`, en español e inglés). Al tocar una constelación, su ficha muestra:
  - las 52 clásicas: su **mito griego** (Orión y el escorpión, Perseo y Medusa, Calisto y las osas…);
  - las 36 modernas: su **origen real** (navegantes holandeses del siglo XVI, Hevelius en 1687, Lacaille y sus instrumentos científicos en 1756);
  - una **curiosidad astronómica** ✨ y **datos clave calculados**: origen, estrella más brillante y mejor época del año para verla.
- La frase de bienvenida queda sin coma: «Cada estrella que ves es luz que viajó años solo para encontrarte.»

### Versión 1.3 — 23 de noviembre de 2026
- **Bienvenida «Planetarium by DarwinCaos»:** espacio profundo animado (estrellas que titilan y giran, Vía Láctea, nebulosas) con un **amanecer orbital**: el Sol asomando tras el borde de un planeta. Encima, el logo, el título y la frase «Cada estrella que ves es luz que viajó años solo para encontrarte.» (en inglés: «Every star you see is light that traveled for years just to find you.»).
  - Sustituye a la pantalla de carga. La primera vez muestra el botón **«Empezar»** (en iPhone, ese toque concede además los sensores); en visitas siguientes se desvanece sola tras unos 2,5 s. Tocar la pantalla la cierra antes.
- **Lanzamientos relevantes:** el calendario solo muestra tripulados, suministro a estaciones, Starship/New Glenn/Artemis, ciencia y exploración, primeros vuelos, China destacada (Shenzhou, Mengzhou, Tianzhou, Chang'e, Tianwen…) y todo lo europeo (Ariane, Vega, Miura de PLD Space). Fuera: Starlink, OneWeb, Kuiper/Amazon Leo, Guowang, Qianfan, satélites secretos y cargas desconocidas. Listas `LAUNCH_YES` / `LAUNCH_NO` en `scripts/actualizar-calendario.mjs`.
- **Noticias:** fuentes en español NASA Ciencia + Agencia SINC (+ ESA si publica RSS), sin duplicados entre idiomas (se prefiere la versión en español), una sola «foto del día» de la NASA.

### Versión 1.2 — 23 de noviembre de 2026
- **📸 Compartir el cielo:** botón en la barra lateral y en la ficha de cada astro. Genera una imagen de la vista actual con el logo del canal, qué se ve, lugar, fecha y enlace al canal, en formato cuadrado (1080×1080), vertical (1080×1920) u horizontal (1920×1080). Se comparte directamente a WhatsApp, Instagram, X… o se guarda.
- **📰 Últimas noticias** en Calendario → Eventos: tus noticias manuales primero (📌) y después noticias automáticas **solo de espacio y astronomía** y **solo relevantes**, de Spaceflight News API (inglés) y Agencia SINC (español). Máximo 8, de los últimos 7 días.
  - El filtro descarta contratos, financiación, resultados empresariales, resúmenes semanales, pódcasts y lanzamientos rutinarios de Starlink, y puntúa misiones tripuladas, Artemis, Marte, Luna, telescopios, exoplanetas, descubrimientos, récords, eclipses…
  - Las listas de palabras están en `scripts/actualizar-calendario.mjs` (`MAJOR`, `NOISE`, `SPACE_ES`) por si quieres ajustarlas.
- Créditos: The Space Devs (lanzamientos y noticias), Agencia SINC, modelo magnético WMM 2025 y BigDataCloud.

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
