/* JG Solutions – Punkt-Weltkugel im Hero (nur Startseite)
   Canvas 2D, keine Bibliothek. Landpunkte aus js/globe-land.js (Natural Earth 110m),
   feines Deutschland-Raster aus js/globe-de.js (Natural Earth 50m).
   Zu Beginn dreht sich die Kugel nach Europa und zoomt auf Deutschland, dort bleibt sie stehen.
   Danach laufen Bögen von Kürten in deutsche Großstädte. Pausiert außerhalb des Bildschirms,
   bei „Bewegung reduzieren“ steht sofort die fertige Deutschland-Ansicht mit ruhenden Bögen. */
(function () {
  "use strict";

  var mount = document.querySelector("[data-globe]");
  var LAND = window.JG_GLOBE_LAND, DE = window.JG_GLOBE_DE;
  if (!mount || !LAND || !DE) return;
  var canvas = mount.querySelector("canvas");
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var GOLDEN = Math.PI * (3 - Math.sqrt(5));
  var RAD = Math.PI / 180;
  var FRAME_MS = 16;
  var BUCKETS = 8;                     // Helligkeitsstufen (eine Füllung pro Stufe statt pro Punkt)
  var CENTER = { lat: 51.2, lon: 10.45 };          // Mitte Deutschlands = Ziel der Kamera
  var DE_H = 7.9 * RAD, DE_W = 5.7 * RAD;          // Ausdehnung Deutschlands auf der Kugel (Nord-Süd, Ost-West)
  var FILL = 0.72;                     // Anteil der sichtbaren Fläche, den Deutschland am Ende einnimmt
  var SPIN = 150 * RAD;                // so weit dreht sich die Kugel während des Anflugs
  var INTRO_DELAY = 300, INTRO_MS = 3600;
  var HOME = { lat: 51.05, lon: 7.27, label: "Kürten" };
  /* Ziele der Bögen „von Kürten in ganz Deutschland“; side: Beschriftung rechts (1) oder links (-1) */
  var CITIES = [
    { lat: 53.55, lon: 9.99, name: "Hamburg", side: 1 },
    { lat: 48.14, lon: 11.58, name: "München", side: 1 },
    { lat: 52.52, lon: 13.40, name: "Berlin", side: 1 },
    { lat: 50.11, lon: 8.68, name: "Frankfurt", side: 1 },
    { lat: 51.05, lon: 13.74, name: "Dresden", side: 1 },
    { lat: 48.78, lon: 9.18, name: "Stuttgart", side: -1 },
    { lat: 52.37, lon: 9.73, name: "Hannover", side: -1 },
    { lat: 51.34, lon: 12.37, name: "Leipzig", side: -1 }
  ];
  var ARC_STEPS = 32;                  // Stützpunkte je Bogen
  var ARC_MS = 6400;                   // ein Bogen: zeichnen, halten, einziehen

  /* Punkt auf der Einheitskugel; Länge 0 zeigt zur Kamera (+z) */
  function vec(lat, lon) {
    return [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
  }

  /* Fibonacci-Kugel; mit Maske nur die Indizes, deren Bit gesetzt ist (gleiche Formel wie _werkzeuge/globus-daten.mjs) */
  function fibonacci(n, mask) {
    var out = [];
    for (var i = 0; i < n; i++) {
      if (mask && !(mask[i >> 3] & (1 << (i & 7)))) continue;
      var y = 1 - ((i + 0.5) * 2) / n;
      var lon = (i * GOLDEN) % (2 * Math.PI);
      out.push.apply(out, vec(Math.asin(y), lon > Math.PI ? lon - 2 * Math.PI : lon));
    }
    return new Float32Array(out);
  }

  function bytes(b64) {
    var raw = atob(b64), out = new Uint8Array(raw.length);
    for (var k = 0; k < raw.length; k++) out[k] = raw.charCodeAt(k);
    return out;
  }

  var land = fibonacci(LAND.n, bytes(LAND.bits));
  var sea = fibonacci(4200);           // sehr blasses Raster, damit die Kugelform sichtbar bleibt
  var center = vec(CENTER.lat * RAD, CENTER.lon * RAD);
  var home = vec(HOME.lat * RAD, HOME.lon * RAD);
  var cities = CITIES.map(function (c) { return vec(c.lat * RAD, c.lon * RAD); });

  /* Feines Raster (2 Bit je Zelle): Deutschland dunkel, Nachbarländer hell und nach außen ausgeblendet */
  var VIGNETTE = [[0.08, 0.34], [0.10, 0.24], [0.12, 0.15], [0.14, 0.07]]; // [bis Winkelabstand, Deckkraft]
  var germany = [], neighbours = VIGNETTE.map(function () { return []; });
  (function () {
    var bits = bytes(DE.bits);
    for (var i = 0; i < DE.cols * DE.rows; i++) {
      var v = (bits[i >> 2] >> ((i & 3) * 2)) & 3;
      if (!v) continue;
      var p = vec((DE.lat0 + Math.floor(i / DE.cols) * DE.dlat) * RAD, (DE.lon0 + (i % DE.cols) * DE.dlon) * RAD);
      if (v === 2) { germany.push(p[0], p[1], p[2]); continue; }
      var d = Math.acos(Math.min(1, p[0] * center[0] + p[1] * center[1] + p[2] * center[2]));
      for (var b = 0; b < VIGNETTE.length; b++) if (d <= VIGNETTE[b][0]) { neighbours[b].push(p[0], p[1], p[2]); break; }
    }
    germany = new Float32Array(germany);
    neighbours = neighbours.map(function (a) { return new Float32Array(a); });
  })();

  /* Kamera: Drehung, Neigung, Mittelpunkt und Radius der Kugel auf dem Canvas */
  var W = 0, H = 0, R = 0, CX = 0, CY = 0, DPR = 1;
  var FX = 0, FY = 0, VW = 1, VH = 1, ZOOM = 1; // Mitte und Größe des sichtbaren Ausschnitts, Endzoom
  var angle = 0, cosA = 1, sinA = 0, cosT = 1, sinT = 0, OX = 0, OY = 0, RZ = 0, zoom = 1;
  var proj = new Float32Array((land.length / 3) * 3);
  var A1 = -CENTER.lon * RAD, T1 = CENTER.lat * RAD, A0 = A1 - SPIN, T0 = 22 * RAD;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = mount.clientWidth;
    H = mount.clientHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    R = (Math.min(W, H) / 2) * 0.96 * DPR;
    CX = canvas.width / 2;
    CY = canvas.height / 2;
    /* Der Container ist angeschnitten: Ziel ist die Mitte des Teils, der im Hero wirklich zu sehen ist */
    var m = mount.getBoundingClientRect(), h = mount.parentElement.getBoundingClientRect();
    var left = Math.max(m.left, h.left, 0), right = Math.min(m.right, h.right, window.innerWidth);
    var top = Math.max(m.top, h.top), bottom = Math.min(m.bottom, h.bottom);
    VW = Math.max(right - left, 1) * DPR;
    VH = Math.max(bottom - top, 1) * DPR;
    FX = ((left + right) / 2 - m.left) * DPR;
    FY = ((top + bottom) / 2 - m.top) * DPR;
    ZOOM = Math.max(1, Math.min((FILL * VH) / DE_H, (FILL * VW) / DE_W) / R);
    base = null;
    draw(performance.now());
  }

  function easeInOut(t) { return t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function ease(t) { return t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3); }
  function clamp(t) { return t < 0 ? 0 : t > 1 ? 1 : t; }

  /* p = Fortschritt des Anflugs (0 = ganze Kugel, 1 = Deutschland). Erst dreht sie, ab 25 % zoomt sie. */
  function camera(p) {
    var r = easeInOut(p), z = easeInOut((p - 0.25) / 0.75);
    angle = A0 + (A1 - A0) * r;
    var tilt = T0 + (T1 - T0) * r;
    cosA = Math.cos(angle); sinA = Math.sin(angle);
    cosT = Math.cos(tilt); sinT = Math.sin(tilt);
    zoom = Math.exp(Math.log(ZOOM) * z);         // logarithmisch, wirkt gleichmäßig schnell
    RZ = R * zoom;
    OX = CX + (FX - CX) * z;
    OY = CY + (FY - CY) * z;
  }

  /* Drehung um die Hochachse, dann Neigung um die x-Achse; Ergebnis [x, y, z] mit z > 0 = Vorderseite */
  function rotate(x, y, z, out, o) {
    var x1 = x * cosA + z * sinA;
    var z1 = -x * sinA + z * cosA;
    out[o] = x1;
    out[o + 1] = y * cosT - z1 * sinT;
    out[o + 2] = y * sinT + z1 * cosT;
  }

  /* Grobe Kugelpunkte, Helligkeit nach Tiefe */
  function dots(points, size, maxAlpha) {
    var n = points.length / 3;
    for (var i = 0; i < n; i++) rotate(points[i * 3], points[i * 3 + 1], points[i * 3 + 2], proj, i * 3);
    for (var b = 0; b < BUCKETS; b++) {
      var lo = b / BUCKETS, hi = (b + 1) / BUCKETS, depth = (b + 0.5) / BUCKETS;
      var r = size * (0.55 + 0.6 * depth) * DPR;
      ctx.globalAlpha = maxAlpha * (0.18 + 0.82 * depth);
      ctx.beginPath();
      for (var j = 0; j < n; j++) {
        var z = proj[j * 3 + 2];
        if (z <= lo || z > hi) continue;
        var sx = OX + proj[j * 3] * RZ, sy = OY - proj[j * 3 + 1] * RZ;
        if (sx < -r || sy < -r || sx > canvas.width + r || sy > canvas.height + r) continue;
        ctx.moveTo(sx + r, sy);
        ctx.arc(sx, sy, r, 0, 2 * Math.PI);
      }
      ctx.fill();
    }
  }

  /* Feine Rasterpunkte, alle in einer Füllung */
  var tmp = [0, 0, 0];
  function fine(points, r, alpha) {
    if (alpha <= 0) return;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    for (var i = 0; i < points.length; i += 3) {
      rotate(points[i], points[i + 1], points[i + 2], tmp, 0);
      if (tmp[2] <= 0) continue;
      var sx = OX + tmp[0] * RZ, sy = OY - tmp[1] * RZ;
      if (sx < -r || sy < -r || sx > canvas.width + r || sy > canvas.height + r) continue;
      ctx.moveTo(sx + r, sy);
      ctx.arc(sx, sy, r, 0, 2 * Math.PI);
    }
    ctx.fill();
  }

  /* Alles, was sich nach dem Anflug nicht mehr bewegt */
  function background() {
    var detail = clamp((zoom - 2) / 2.5);            // Übergang grobe Kugel → feines Raster
    ctx.fillStyle = "#3F3F46";
    if (detail < 1) {
      dots(sea, 0.8, 0.07 * (1 - detail));
      dots(land, 1.3, 0.85 * (1 - detail));
    }
    if (detail > 0) {
      var r = Math.min(1.8 * DPR, Math.max(0.6 * DPR, 0.24 * DE.dlat * RAD * RZ));
      for (var b = 0; b < neighbours.length; b++) fine(neighbours[b], r, VIGNETTE[b][1] * detail);
      ctx.fillStyle = "#09090B";
      fine(germany, r, 0.88 * detail);
      /* Weicher Rand: zum Rand des sichtbaren Ausschnitts hin ausblenden statt hart abschneiden */
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "destination-in";
      ctx.translate(FX, FY);
      ctx.scale(VW / VH, 1);
      var g = ctx.createRadialGradient(0, 0, 0, 0, 0, VH / 2);
      g.addColorStop(0.8, "rgba(0, 0, 0, 1)");
      g.addColorStop(1, "rgba(0, 0, 0, " + (1 - detail) + ")");
      ctx.fillStyle = g;
      ctx.fillRect(-canvas.width * 2, -canvas.height * 2, canvas.width * 4, canvas.height * 4);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function screen(v, out) {
    rotate(v[0], v[1], v[2], out, 0);
    out[0] = OX + out[0] * RZ;
    out[1] = OY - out[1] * RZ;
  }

  function label(text, x, y, side, weight, size, color) {
    ctx.font = weight + " " + size * DPR + "px Inter, system-ui, sans-serif";
    ctx.textBaseline = "middle";
    ctx.textAlign = side > 0 ? "left" : "right";
    ctx.lineWidth = 4 * DPR;
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#FBFBF8";
    ctx.fillStyle = color;
    ctx.strokeText(text, x + side * 10 * DPR, y);
    ctx.fillText(text, x + side * 10 * DPR, y);
  }

  function marker(now) {
    var p = [0, 0, 0];
    rotate(home[0], home[1], home[2], p, 0);
    if (p[2] < 0.12) return;
    var fade = Math.min(1, (p[2] - 0.12) / 0.2);
    screen(home, p);
    var x = p[0], y = p[1];
    ctx.globalAlpha = fade;
    if (!REDUCE) {
      var t = (now % 2400) / 2400;
      ctx.beginPath();
      ctx.arc(x, y, (5 + 18 * t) * DPR, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(9, 9, 11, " + (0.45 * (1 - t) * fade) + ")";
      ctx.lineWidth = 1.5 * DPR;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, y, 5.5 * DPR, 0, 2 * Math.PI);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, 4 * DPR, 0, 2 * Math.PI);
    ctx.fillStyle = "#09090B";
    ctx.fill();
    ctx.globalAlpha = fade * clamp((zoom - 1.5) / 1.5); // Name erst beim Heranzoomen, sonst läuft er beim Drehen über den Hero-Text
    label(HOME.label, x, y, -1, 700, 13, "#09090B");   // links vom Punkt, die Bögen laufen nach Osten
    ctx.globalAlpha = 1;
  }

  /* Bögen von Kürten zu den Städten: Linie wächst hin, Ziel pingt, Linie zieht sich ein. Versetzt gestartet. */
  function arcLines(now, show) {
    if (show <= 0) return;
    var h = [0, 0, 0], c = [0, 0, 0];
    screen(home, h);
    var x0 = h[0], y0 = h[1];
    ctx.lineCap = "round";
    for (var a = 0; a < cities.length; a++) {
      screen(cities[a], c);
      var x2 = c[0], y2 = c[1], dx = x2 - x0, dy = y2 - y0;
      var len = Math.sqrt(dx * dx + dy * dy) || 1, bulge = 0.22 * len;
      var nx = dy / len, ny = -dx / len;            // Senkrechte; zur Seite weg von der Bildmitte wölben
      var mx = (x0 + x2) / 2, my = (y0 + y2) / 2;
      if (nx * (mx - OX) + ny * (my - OY) < 0) { nx = -nx; ny = -ny; }
      var x1 = mx + nx * bulge, y1 = my + ny * bulge;

      var t = REDUCE ? 0.5 : ((now + (a * ARC_MS) / cities.length) % ARC_MS) / ARC_MS;
      var head = REDUCE ? 1 : ease(t / 0.4), tail = REDUCE ? 0 : ease((t - 0.62) / 0.38);
      var px = 0, py = 0;
      ctx.fillStyle = "#09090B";
      if (head > tail) {
        ctx.beginPath();
        for (var j = 0; j <= ARC_STEPS; j++) {
          var u = tail + ((head - tail) * j) / ARC_STEPS, v = 1 - u;
          px = v * v * x0 + 2 * v * u * x1 + u * u * x2;
          py = v * v * y0 + 2 * v * u * y1 + u * u * y2;
          if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.globalAlpha = 0.7 * show;
        ctx.strokeStyle = "#09090B";
        ctx.lineWidth = 1.4 * DPR;
        ctx.stroke();
        if (head < 1) {                             // laufender Punkt an der Spitze
          ctx.globalAlpha = show;
          ctx.beginPath();
          ctx.arc(px, py, 2.6 * DPR, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
      if (!REDUCE && t > 0.38 && t < 0.78) {
        var k = (t - 0.38) / 0.4;                   // Ping beim Ankommen
        ctx.globalAlpha = 0.5 * (1 - k) * show;
        ctx.beginPath();
        ctx.arc(x2, y2, (3 + 12 * k) * DPR, 0, 2 * Math.PI);
        ctx.lineWidth = 1.2 * DPR;
        ctx.stroke();
      }
      ctx.globalAlpha = show;                       // Zielpunkt mit Namen bleibt immer sichtbar
      ctx.beginPath();
      ctx.arc(x2, y2, 3.6 * DPR, 0, 2 * Math.PI);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x2, y2, 2.4 * DPR, 0, 2 * Math.PI);
      ctx.fillStyle = "#09090B";
      ctx.fill();
      label(CITIES[a].name, x2, y2, CITIES[a].side, 600, 11.5, "#52525B");
    }
    ctx.globalAlpha = 1;
  }

  /* Nach dem Anflug wird der Hintergrund einmal in ein zweites Canvas gemalt und nur noch kopiert */
  var base = null, introStart = null;
  function draw(now) {
    var q = REDUCE ? 2 : introStart === null ? 0 : (now - introStart) / INTRO_MS;
    camera(clamp(q));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (q >= 1) {
      if (!base) {
        base = document.createElement("canvas");
        base.width = canvas.width;
        base.height = canvas.height;
        var main = ctx;
        ctx = base.getContext("2d");
        background();
        ctx = main;
      }
      ctx.drawImage(base, 0, 0);
    } else {
      background();
    }
    arcLines(now, clamp((q - 0.95) / 0.25));
    marker(now);
  }

  var running = false, last = 0;
  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    if (now - last < FRAME_MS) return;
    last = now;
    if (introStart === null) introStart = now + INTRO_DELAY;
    draw(now);
  }
  function setRunning(on) {
    if (REDUCE || on === running) return;
    running = on;
    if (on) requestAnimationFrame(frame);
  }

  resize();
  mount.classList.add("is-ready");
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(mount);
  else window.addEventListener("resize", resize);
  if (document.fonts) document.fonts.ready.then(function () { base = null; draw(performance.now()); });

  var visible = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      setRunning(visible && !document.hidden);
    }).observe(mount);
  }
  document.addEventListener("visibilitychange", function () { setRunning(visible && !document.hidden); });
  setRunning(true);
})();
