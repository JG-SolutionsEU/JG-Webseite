/* Erzeugt js/globe-de.js: feines Punktraster für den Zoom auf Deutschland.
   Quelle: Natural Earth 50m Admin-0 Countries (gemeinfrei). Raster in Grad über Mitteleuropa,
   je Zelle 2 Bit: 0 = Meer, 1 = Nachbarland, 2 = Deutschland. js/globe.js rechnet die Punkte zurück.
   Aufruf: node _werkzeuge/deutschland-daten.mjs */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const BOX = { lon0: -4, lon1: 25, lat0: 42, lat1: 60 }; // Ausschnitt, muss groß genug für den Zoom sein
const DLAT = 0.12, DLON = 0.19;                         // Rasterabstand, ergibt am Ziel etwa quadratische Punkte

const fc = JSON.parse(readFileSync(ROOT + "_werkzeuge/daten/ne_50m_admin_0_countries.geojson", "utf8"));
const polys = f => (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates);
const inBox = poly => poly[0].some(([lon, lat]) => lon > BOX.lon0 - 5 && lon < BOX.lon1 + 5 && lat > BOX.lat0 - 5 && lat < BOX.lat1 + 5);
const de = fc.features.filter(f => f.properties.ADM0_A3 === "DEU").flatMap(polys);
const others = fc.features.filter(f => f.properties.ADM0_A3 !== "DEU").flatMap(polys).filter(inBox);

function inRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const hit = (list, lon, lat) => list.some(([outer, ...holes]) => inRing(lon, lat, outer) && !holes.some(h => inRing(lon, lat, h)));

const cols = Math.floor((BOX.lon1 - BOX.lon0) / DLON) + 1;
const rows = Math.floor((BOX.lat1 - BOX.lat0) / DLAT) + 1;
const bits = new Uint8Array(Math.ceil((cols * rows) / 4));
let nDe = 0, nOther = 0;
for (let r = 0; r < rows; r++) {
  const lat = BOX.lat0 + r * DLAT;
  for (let c = 0; c < cols; c++) {
    const lon = BOX.lon0 + c * DLON, i = r * cols + c;
    const v = hit(de, lon, lat) ? 2 : hit(others, lon, lat) ? 1 : 0;
    if (v === 2) nDe++; else if (v === 1) nOther++;
    bits[i >> 2] |= v << ((i & 3) * 2);
  }
}

const b64 = Buffer.from(bits).toString("base64");
writeFileSync(ROOT + "js/globe-de.js",
  "/* Deutschland-Raster für js/globe.js, erzeugt von _werkzeuge/deutschland-daten.mjs aus Natural Earth 50m (gemeinfrei). */\n" +
  `window.JG_GLOBE_DE={lon0:${BOX.lon0},lat0:${BOX.lat0},dlon:${DLON},dlat:${DLAT},cols:${cols},rows:${rows},bits:"${b64}"};\n`);
console.log(`${nDe} Punkte Deutschland, ${nOther} Nachbarländer, ${cols}×${rows} Raster, ${b64.length} Zeichen`);
