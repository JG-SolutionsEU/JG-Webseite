/* JG Solutions – Interaktionen (alle Seiten)
   Navigation, Header, Einblenden, Projekt-Slider, Visitenkarte, Kontaktformular.
   Das Quiz ("Kostenlose Analyse") liegt in js/quiz.js und wird erst beim ersten Klick geladen. */
(function () {
  "use strict";

  // Pfad-Präfix zum Projektstamm: Unterseiten geben data-root="../" mit, die 404-Seite "/".
  var SCRIPT = document.currentScript;
  var ROOT = (SCRIPT && SCRIPT.getAttribute("data-root")) || "";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var PAGE_START = Date.now();
  var MIN_FILL_MS = 3000; // schneller ausgefüllt = sehr wahrscheinlich ein Bot

  document.documentElement.classList.add("js");

  /* Headline Wort für Wort einblenden (Timing in css/style.css, .word).
     Nur Textknoten werden aufgeteilt; Screenreader lesen die H1 weiter als einen Satz. */
  var h1 = document.querySelector("main h1");
  if (h1 && !reduceMotion) {
    var i = 0;
    [].slice.call(h1.childNodes).forEach(function (node) {
      if (node.nodeType !== 3) return;
      var frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var w = document.createElement("span");
        w.className = "word";
        w.style.setProperty("--i", i++);
        w.textContent = part;
        frag.appendChild(w);
      });
      h1.replaceChild(frag, node);
    });
  }
  if (h1) h1.classList.add("is-split");

  /* Lokal per Doppelklick (file://): saubere Links wie "kontakt" auf "kontakt.html"
     umbiegen. Auf dem Server erledigt das die .htaccess, dort greift dieser Teil nicht. */
  if (location.protocol === "file:") {
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a) return;
      var href = a.getAttribute("href");
      if (/^(#|[a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) return; // Anker, mailto:, tel:, https:
      var m = href.match(/^([^?#]*)(.*)$/), path = m[1], rest = m[2];
      if (!path) return;
      if (path === "." || path === "./") path = "index.html";
      else if (/(^|\/)\.\.?\/?$/.test(path)) path = path.replace(/\/?$/, "/") + "index.html";
      else if (path.slice(-1) === "/") path += "index.html";
      else if (!/\.[a-z0-9]+$/i.test(path)) path += ".html";
      a.setAttribute("href", path + rest);
    }, true);
  }

  /* Mobile-Navigation: Vollbild-Menü, Esc schließt, Fokus kehrt zum Button zurück */
  var burger = document.querySelector(".burger");
  var menu = document.getElementById("mobile-menu");
  if (burger && menu) {
    var setMenu = function (open) {
      burger.setAttribute("aria-expanded", String(open));
      burger.querySelector(".burger-label").textContent = open ? "Schließen" : "Menü";
      menu.hidden = !open;
      document.body.classList.toggle("menu-open", open);
      if (open) { var first = menu.querySelector("a"); if (first) first.focus(); }
    };
    burger.addEventListener("click", function () { setMenu(burger.getAttribute("aria-expanded") !== "true"); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menu.hidden) { setMenu(false); burger.focus(); }
    });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  }

  /* Header: Linie nach dem ersten Scrollen, beim Runterscrollen ausblenden */
  var header = document.querySelector(".site-header");
  if (header) {
    var lastY = window.scrollY, ticking = false;
    var onScroll = function () {
      var y = window.scrollY;
      header.classList.toggle("is-scrolled", y > 8);
      var menuOpen = document.body.classList.contains("menu-open");
      header.classList.toggle("is-hidden", !menuOpen && y > 400 && y > lastY + 4);
      if (y < lastY - 4 || y <= 400) header.classList.remove("is-hidden");
      lastY = y; ticking = false;
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
    }, { passive: true });
    // Fokus per Tastatur im Header: wieder einblenden
    header.addEventListener("focusin", function () { header.classList.remove("is-hidden"); });
    onScroll();
  }

  /* Einblenden beim Scrollen */
  var reveals = document.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* Kennzahlen zählen hoch, sobald sie ins Bild kommen ([data-count], z. B. "100 %", "2–4 Wo.").
     Alle Zahlen im Text laufen gleichzeitig von 0 auf ihren Wert, Einheiten bleiben stehen. */
  var zaehler = document.querySelectorAll("[data-count]");
  if (zaehler.length && "IntersectionObserver" in window && !reduceMotion) {
    var hochzaehlen = function (el, verzoegerung) {
      var ziel = el.textContent;
      var teile = ziel.split(/(\d+)/);
      var zeige = function (f) {
        el.textContent = teile.map(function (t) { return /^\d+$/.test(t) ? String(Math.round(+t * f)) : t; }).join("");
      };
      zeige(0);
      var start = null, dauer = 1400;
      var schritt = function (now) {
        if (start === null) start = now + verzoegerung;
        var t = Math.min(1, Math.max(0, (now - start) / dauer));
        zeige(1 - Math.pow(1 - t, 3)); // schnell los, sanft auslaufen
        if (t < 1) window.requestAnimationFrame(schritt); else el.textContent = ziel;
      };
      window.requestAnimationFrame(schritt);
      // Falls der Browser Frames drosselt (Hintergrund-Tab): Endwert sicher setzen
      setTimeout(function () { start = -Infinity; el.textContent = ziel; }, verzoegerung + dauer + 300);
    };
    var zio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        zio.unobserve(en.target);
        en.target.querySelectorAll("b").forEach(function (b, i) { hochzaehlen(b, 150 + i * 120); });
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    zaehler.forEach(function (el) { zio.observe(el); });
  }

  /* Projekt-Slider: Pfeile + Zähler "01 / 03", Wischen über natives Scrollen */
  document.querySelectorAll("[data-slider]").forEach(function (root) {
    var track = root.querySelector(".slider-track");
    var slides = [].slice.call(track.children);
    var prev = root.querySelector("[data-slider-prev]");
    var next = root.querySelector("[data-slider-next]");
    var count = root.querySelector(".slider-count");
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var current = function () {
      var left = track.scrollLeft, best = 0, dist = Infinity;
      slides.forEach(function (s, i) {
        var d = Math.abs(s.offsetLeft - track.offsetLeft - parseFloat(getComputedStyle(track).paddingLeft) - left);
        if (d < dist) { dist = d; best = i; }
      });
      return best;
    };
    var update = function () {
      var i = current();
      var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      if (count) count.textContent = pad(atEnd ? slides.length : i + 1) + " / " + pad(slides.length);
      if (prev) prev.disabled = track.scrollLeft <= 4;
      if (next) next.disabled = atEnd;
    };
    var go = function (dir) {
      var i = Math.max(0, Math.min(slides.length - 1, current() + dir));
      track.scrollTo({ left: slides[i].offsetLeft - slides[0].offsetLeft, behavior: reduceMotion ? "auto" : "smooth" });
    };
    if (prev) prev.addEventListener("click", function () { go(-1); });
    if (next) next.addEventListener("click", function () { go(1); });
    var t;
    track.addEventListener("scroll", function () { clearTimeout(t); t = setTimeout(update, 60); }, { passive: true });
    window.addEventListener("resize", update);
    update();
  });

  /* 3D-Visitenkarte (aus der OKTOBER-Seite): Maus neigt, Klick, Tippen oder Enter dreht um.
     Die Karte ist ein <button>, Enter/Leertaste lösen deshalb ganz normal "click" aus. */
  document.querySelectorAll("[data-vk]").forEach(function (card) {
    var stage = card.parentElement, flipped = false, hovering = false;
    var set = function (rx, ry) { card.style.transform = "rotateX(" + rx.toFixed(1) + "deg) rotateY(" + ry.toFixed(1) + "deg)"; };
    if (window.matchMedia("(hover: hover)").matches && !reduceMotion) {
      stage.addEventListener("mousemove", function (e) {
        hovering = true;
        var r = stage.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        set(-py * 22, px * 30 + (flipped ? 180 : 0));
      });
      stage.addEventListener("mouseleave", function () { hovering = false; set(0, flipped ? 180 : 0); });
    }
    card.addEventListener("click", function () {
      flipped = !flipped;
      card.classList.add("flipped");
      card.setAttribute("aria-pressed", String(flipped));
      if (!hovering) set(0, flipped ? 180 : 0);
      setTimeout(function () { card.classList.remove("flipped"); }, 650);
    });
  });

  /* Quiz: js/quiz.js erst beim ersten Klick nachladen, dann den Klick erneut auslösen */
  var quizState = window.JGQuiz ? "ready" : "idle";
  var loadQuiz = function (done) {
    if (window.JGQuiz) { done(); return; }
    if (quizState === "loading") return;
    quizState = "loading";
    var s = document.createElement("script");
    s.src = ROOT + "js/quiz.js?v=1";
    s.setAttribute("data-root", ROOT);
    s.onload = function () { quizState = "ready"; done(); };
    s.onerror = function () { quizState = "idle"; location.href = ROOT + "kontakt"; };
    document.body.appendChild(s);
  };
  document.addEventListener("click", function (e) {
    var trigger = e.target.closest && e.target.closest("[data-quiz-open]");
    if (!trigger || window.JGQuiz) return; // geladen: quiz.js übernimmt den Klick selbst
    e.preventDefault();
    loadQuiz(function () { trigger.click(); });
  });
  if (location.hash === "#analyse") loadQuiz(function () { window.JGQuiz.open(); });

  /* Kontaktformular – Versand über das eigene PHP-Skript (kontakt-senden.php), danach
     Weiterleitung auf die Danke-Seite. Ohne JavaScript schickt der Browser das Formular
     ganz normal ab und das Skript leitet selbst weiter. */
  var form = document.querySelector("[data-contact-form]");
  if (form) {
    var tsField = form.querySelector("[name='ts']");
    if (tsField) tsField.value = String(PAGE_START); // für die Mindest-Ausfüllzeit im Skript
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = form.querySelector(".form-note");
      var say = function (text) { if (note) { note.textContent = text; note.classList.add("is-error"); } };
      var hp = form.querySelector("[name='botcheck']");
      if (hp && hp.value) return; // Honeypot ausgefüllt: Bot
      if (Date.now() - PAGE_START < MIN_FILL_MS) { say("Das ging sehr schnell. Bitte prüfe deine Angaben und sende noch einmal."); return; }
      var invalid = form.querySelector("input:invalid:not([type=checkbox]), textarea:invalid, select:invalid");
      if (invalid) { say("Bitte fülle alle Pflichtfelder aus."); invalid.focus(); return; }
      var consent = form.querySelector(".consent input[type=checkbox]");
      if (consent && !consent.checked) { say("Bitte stimme der Verarbeitung deiner Angaben zu."); consent.focus(); return; }
      var btn = form.querySelector("button[type=submit]");
      var origHTML = btn ? btn.innerHTML : "";
      if (btn) { btn.disabled = true; btn.textContent = "Wird gesendet …"; }
      fetch(form.getAttribute("action"), { method: "POST", headers: { Accept: "application/json" }, body: new FormData(form) })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j.ok) { var err = new Error(j.message || "Fehler"); err.fromServer = true; throw err; }
          location.href = ROOT + "danke";
        })
        .catch(function (err) {
          if (btn) { btn.disabled = false; btn.innerHTML = origHTML; }
          say(err && err.fromServer ? err.message : "Da ist etwas schiefgelaufen. Bitte versuch es erneut oder schreib direkt an info@jg-solutions.eu.");
        });
    });
  }

  /* Jahr im Footer */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
