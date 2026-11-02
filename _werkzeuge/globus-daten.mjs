/* Erzeugt js/globe-land.js: welche Punkte einer Fibonacci-Kugel auf Land liegen.
   Quelle: Natural Earth 110m Land (gemeinfrei). Ergebnis ist eine Bitmaske (base64),
   js/globe.js rechnet die Punktpositionen mit derselben Formel nach.
   Aufruf: node _werkzeuge/globus-daten.mjs */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const N = 26000;          // Punkte auf der ganzen Kugel, muss zu globe.js passen
const MIN_LAT = -58;      // Antarktis weglassen, sie liegt ohnehin außer Sicht

const land = JSON.parse(readFileSync(ROOT + "_werkzeuge/daten/ne_110m_land.geojson", "utf8"));
const polygons = land.features.flatMap(f =>
  f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates);

function inRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const onLand = (lon, lat) =>
  polygons.some(([outer, ...holes]) => inRing(lon, lat, outer) && !holes.some(h => inRing(lon, lat, h)));

const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const bits = new Uint8Array(Math.ceil(N / 8));
let count = 0;
for (let i = 0; i < N; i++) {
  const y = 1 - ((i + 0.5) * 2) / N;
  const lat = (Math.asin(y) * 180) / Math.PI;
  let lon = (((i * GOLDEN) % (2 * Math.PI)) * 180) / Math.PI;
  if (lon > 180) lon -= 360;
  if (lat < MIN_LAT || !onLand(lon, lat)) continue;
  bits[i >> 3] |= 1 << (i & 7);
  count++;
}

const b64 = Buffer.from(bits).toString("base64");
writeFileSync(ROOT + "js/globe-land.js",
  "/* Landpunkte für js/globe.js, erzeugt von _werkzeuge/globus-daten.mjs aus Natural Earth 110m (gemeinfrei). */\n" +
  `window.JG_GLOBE_LAND={n:${N},bits:"${b64}"};\n`);
console.log(`${count} Landpunkte von ${N} (${((count / N) * 100).toFixed(1)} %), ${b64.length} Zeichen`);
