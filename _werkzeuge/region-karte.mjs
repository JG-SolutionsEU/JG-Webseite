/* Erzeugt assets/region-karte.svg: Rheinisch-Bergischer Kreis + Köln als Punktraster.
   Gibt zusätzlich die Lage der Orte in Prozent aus (für die Marker in css/style.css).
   Aufruf: node _werkzeuge/region-karte.mjs */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const read = name => JSON.parse(readFileSync(ROOT + "_werkzeuge/daten/" + name, "utf8"));
const rings = [read("rbk.geojson"), read("koeln.geojson")]
  .flatMap(fc => fc.features)
  .flatMap(f => (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates))
  .map(poly => poly[0]);

const ORTE = { kuerten: [7.2690, 51.0500], gladbach: [7.1366, 50.9918], koeln: [6.9583, 50.9375] };

const all = rings.flat();
const minLon = Math.min(...all.map(p => p[0])), maxLon = Math.max(...all.map(p => p[0]));
const minLat = Math.min(...all.map(p => p[1])), maxLat = Math.max(...all.map(p => p[1]));
const K = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180); // Längengrade schrumpfen nach Norden
const PAD = 2, STEP = 10;                                        // Abstand der Punkte in SVG-Einheiten
const W = 640, scale = (W - PAD * 2) / ((maxLon - minLon) * K);
const H = Math.round((maxLat - minLat) * scale + PAD * 2);
const toXY = ([lon, lat]) => [PAD + (lon - minLon) * K * scale, PAD + (maxLat - lat) * scale];

function inRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

let d = "";
for (let y = STEP / 2; y < H; y += STEP) {
  for (let x = STEP / 2; x < W; x += STEP) {
    const lon = minLon + (x - PAD) / scale / K, lat = maxLat - (y - PAD) / scale;
    if (rings.some(r => inRing(lon, lat, r))) d += `M${x} ${y}h0`;
  }
}

writeFileSync(ROOT + "assets/region-karte.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
  `<path d="${d}" stroke="#A1A1AA" stroke-width="4.2" stroke-linecap="round" fill="none"/></svg>\n`);

console.log(`viewBox ${W}x${H}`);
for (const [name, ll] of Object.entries(ORTE)) {
  const [x, y] = toXY(ll);
  console.log(`${name}: left ${((x / W) * 100).toFixed(1)}%  top ${((y / H) * 100).toFixed(1)}%`);
}
