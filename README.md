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
