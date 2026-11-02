/* JG Solutions – 3D-Visitenkarte (nur Startseite)
   Lädt three.js vom eigenen Server erst, wenn die Karte in die Nähe des Bildschirms kommt.
   Ziehen dreht die Karte, Pfeiltasten ebenso. Ohne WebGL bleibt das Vorschaubild stehen. */
(function () {
  "use strict";

  var stage = document.querySelector("[data-vk]");
  if (!stage || !("IntersectionObserver" in window)) return;
  var ROOT = stage.getAttribute("data-root") || "";
  var REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var W = 3.4, H = 2.2, DEPTH = 0.026, BEVEL = 0.012;

  var loader = new IntersectionObserver(function (entries) {
    if (!entries[0].isIntersecting) return;
    loader.disconnect();
    Promise.all([
      import(new URL(ROOT + "js/vendor/three.module.min.js", document.baseURI).href),
      image("card-front"),
      image("card-back")
    ]).then(function (res) { init(res[0], res[1], res[2]); }).catch(function () { /* Vorschaubild bleibt */ });
  }, { rootMargin: "300px" });
  loader.observe(stage);

  function image(name) {
    var img = new Image();
    img.src = ROOT + "assets/3d/" + name + ".webp";
    return img.decode().then(function () { return img; });
  }

  function roundedSlab(THREE) {
    var w = W - BEVEL * 2, h = H - BEVEL * 2, r = 0.14, x = -w / 2, y = -h / 2;
    var s = new THREE.Shape();
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    var g = new THREE.ExtrudeGeometry(s, { depth: DEPTH, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: BEVEL, bevelSegments: 2, curveSegments: 10 });
    g.center();
    return g;
  }

  /* Kartenbild mit abgerundeten Ecken als Textur */
  function face(THREE, img, aniso) {
    var cv = document.createElement("canvas");
    cv.width = 1020; cv.height = 660;
    var c = cv.getContext("2d");
    c.beginPath();
    c.roundRect(0, 0, cv.width, cv.height, 42);
    c.clip();
    c.drawImage(img, 0, 0, cv.width, cv.height);
    var t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = aniso;
    return t;
  }

  function init(THREE, front, back) {
    var canvas = stage.querySelector("canvas");
    var renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); } catch (e) { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(30, 4 / 3, 0.1, 50);
    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    var key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(-2, 3, 5);
    scene.add(key);

    var aniso = renderer.capabilities.getMaxAnisotropy();
    var card = new THREE.Group();
    card.add(new THREE.Mesh(roundedSlab(THREE), new THREE.MeshStandardMaterial({ color: 0xE4E4E7, roughness: 0.6 })));
    var plane = new THREE.PlaneGeometry(W, H);
    var f = new THREE.Mesh(plane, new THREE.MeshStandardMaterial({ map: face(THREE, front, aniso), roughness: 0.55, transparent: true }));
    f.position.z = DEPTH / 2 + BEVEL + 0.002;
    var b = new THREE.Mesh(plane, new THREE.MeshStandardMaterial({ map: face(THREE, back, aniso), roughness: 0.6, transparent: true }));
    b.position.z = -f.position.z;
    b.rotation.y = Math.PI;
    card.add(f, b);
    scene.add(card);

    var st = { ry: -0.5, rx: 0.16, vy: 0, drag: false, x: 0, y: 0 };
    canvas.addEventListener("pointerdown", function (e) {
      st.drag = true; st.x = e.clientX; st.y = e.clientY; st.vy = 0;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!st.drag) return;
      var dx = e.clientX - st.x, dy = e.clientY - st.y;
      st.x = e.clientX; st.y = e.clientY;
      st.ry += dx * 0.012; st.vy = dx * 0.012;
      st.rx = Math.max(-0.6, Math.min(0.6, st.rx + dy * 0.006));
    });
    ["pointerup", "pointercancel"].forEach(function (type) { canvas.addEventListener(type, function () { st.drag = false; }); });
    canvas.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { st.ry -= 0.3; e.preventDefault(); }
      if (e.key === "ArrowRight") { st.ry += 0.3; e.preventDefault(); }
    });

    function resize() {
      var w = stage.clientWidth, h = stage.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.position.z = Math.max(6.2, 4.2 / (0.5359 * camera.aspect));
      camera.updateProjectionMatrix();
    }

    var running = false;
    function frame() {
      if (!running) return;
      if (!st.drag) {
        st.vy *= 0.95;
        st.ry += st.vy + (REDUCE ? 0 : 0.0035);
        st.rx += (0.12 - st.rx) * 0.04;
      }
      card.rotation.set(st.rx, st.ry, -0.04);
      card.position.y = REDUCE ? 0 : Math.sin(performance.now() / 1100) * 0.05;
      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }

    resize();
    new ResizeObserver(resize).observe(stage);
    stage.classList.add("is-3d");
    canvas.tabIndex = 0;
    new IntersectionObserver(function (entries) {
      var vis = entries[0].isIntersecting;
      if (vis && !running) { running = true; requestAnimationFrame(frame); }
      else if (!vis) running = false;
    }).observe(stage);
  }
})();
