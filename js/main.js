/* JG Solutions – Interaktionen für alle Seiten
   Navigation, Vollbild-Menü, Einblenden, Kontaktformular, Cal.com (2-Klick) und Quiz „Kostenlose Analyse“.
   Keine Cookies, kein Tracking. Formulare gehen an kontakt-senden.php auf dem eigenen Webspace. */
(function () {
  "use strict";

  var SCRIPT = document.currentScript;
  var ROOT = (SCRIPT && SCRIPT.getAttribute("data-root")) || "";
  var REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ENDPOINT = ROOT + "kontakt-senden.php";
  var CONTACT = { email: "info@jg-solutions.eu", phone: "+49 176 24004201", tel: "+4917624004201" };

  document.documentElement.classList.add("js");

  var ICON = {
    check: '<path d="M20 6 9 17l-5-5"/>',
    close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    back: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>'
  };
  function svg(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[name] + "</svg>";
  }
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === null || value === undefined || value === false) return;
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key === "html") node.innerHTML = value;
      else node.setAttribute(key, value === true ? "" : value);
    });
    (children || []).forEach(function (child) {
      if (child) node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }
  function store(key, value) {
    try {
      if (value === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, value);
    } catch (e) { return null; }
  }

  /* Lokal per Doppelklick (file://): saubere Links auf .html umbiegen. Live erledigt das die .htaccess. */
  if (location.protocol === "file:") {
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a) return;
      var href = a.getAttribute("href");
      if (/^(#|[a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) return;
      var m = href.match(/^([^?#]*)(.*)$/), path = m[1];
      if (!path) return;
      if (path === "." || path === "./" || /\/$/.test(path)) path = path.replace(/\.?\/?$/, "") + (path === "." || path === "./" ? "index.html" : "/index.html");
      else if (!/\.[a-z0-9]+$/i.test(path)) path += ".html";
      a.setAttribute("href", path + m[2]);
    }, true);
  }

  /* ------------------------------------------------------ Navigation */
  var drop = document.querySelector("[data-drop]");
  if (drop) {
    var dropBtn = drop.querySelector(".drop-toggle");
    var setDrop = function (open) {
      drop.classList.toggle("is-open", open);
      dropBtn.setAttribute("aria-expanded", String(open));
      dropBtn.setAttribute("aria-label", open ? "Leistungen-Menü schließen" : "Leistungen-Menü öffnen");
    };
    dropBtn.addEventListener("click", function () { setDrop(!drop.classList.contains("is-open")); });
    document.addEventListener("click", function (e) { if (!drop.contains(e.target)) setDrop(false); });
    drop.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drop.classList.contains("is-open")) { setDrop(false); dropBtn.focus(); }
    });
  }

  var burger = document.querySelector("[data-menu-toggle]");
  var menu = document.querySelector("[data-menu]");
  if (burger && menu) {
    var setMenu = function (open, returnFocus) {
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
      menu.hidden = !open;
      document.body.classList.toggle("menu-open", open);
      if (open) { var first = menu.querySelector("a, button"); if (first) first.focus(); }
      else if (returnFocus) burger.focus();
    };
    burger.addEventListener("click", function () { setMenu(burger.getAttribute("aria-expanded") !== "true"); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menu.hidden) setMenu(false, true);
    });
    window.matchMedia("(min-width: 1024px)").addEventListener("change", function (mq) { if (mq.matches) setMenu(false); });
  }

  document.querySelectorAll("[data-m-parent]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", String(open));
      document.getElementById(btn.getAttribute("aria-controls")).hidden = !open;
    });
  });

  /* ------------------------------------------------- Einblenden */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !REDUCE) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (node) { io.observe(node); });
  } else {
    reveals.forEach(function (node) { node.classList.add("is-in"); });
  }

  document.querySelectorAll("[data-year]").forEach(function (node) { node.textContent = new Date().getFullYear(); });

  /* ------------------------------------------------------ Versand */

  /** Schickt Formulardaten an kontakt-senden.php. Ergebnis: { ok: boolean, message: string } */
  function sendForm(data) {
    return window.fetch(ENDPOINT, { method: "POST", headers: { Accept: "application/json" }, body: data })
      .then(function (res) {
        return res.json().catch(function () { return { ok: false, message: "" }; });
      })
      .catch(function () { return { ok: false, message: "" }; });
  }
  var FAIL_TEXT = "Die Anfrage konnte gerade nicht gesendet werden. Bitte schreiben Sie an " + CONTACT.email + " oder rufen Sie an: " + CONTACT.phone + ".";

  var PAGE_START = Date.now();
  document.querySelectorAll("[data-ts]").forEach(function (input) { input.value = String(PAGE_START); });

  document.querySelectorAll("[data-contact-form]").forEach(function (form) {
    var note = form.querySelector("[data-form-note]");
    var say = function (text, ok) {
      note.textContent = text;
      note.classList.toggle("is-error", !ok);
      note.classList.toggle("is-ok", !!ok);
    };
    form.querySelectorAll(".input").forEach(function (input) {
      input.addEventListener("input", function () { input.removeAttribute("aria-invalid"); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var invalid = Array.prototype.filter.call(form.querySelectorAll(".input"), function (input) {
        var bad = !input.checkValidity();
        if (bad) input.setAttribute("aria-invalid", "true");
        else input.removeAttribute("aria-invalid");
        return bad;
      });
      if (invalid.length) { say("Bitte prüfen Sie die markierten Felder."); invalid[0].focus(); return; }
      var consent = form.querySelector("[name=datenschutz]");
      if (!consent.checked) { say("Bitte stimmen Sie der Verarbeitung Ihrer Angaben zu."); consent.focus(); return; }
      if (Date.now() - PAGE_START < 3000) { say("Das ging sehr schnell. Bitte prüfen Sie Ihre Angaben und senden Sie erneut."); return; }

      var btn = form.querySelector("[type=submit]");
      var label = btn.innerHTML;
      btn.disabled = true;
      btn.textContent = "Wird gesendet …";
      sendForm(new FormData(form)).then(function (res) {
        if (res.ok) { location.href = ROOT + "danke"; return; }
        btn.disabled = false;
        btn.innerHTML = label;
        say(res.message || FAIL_TEXT);
      });
    });
  });

  /* ---------------------------------------------- Cal.com (2-Klick) */
  var CAL = { link: "jg-solutions/kostenloses-erstgesprach", origin: "https://app.cal.com", script: "https://app.cal.com/embed/embed.js", key: "jg-cal-consent" };
  var calCount = 0;

  function loadCal(box) {
    store(CAL.key, "1");
    box.innerHTML = "";
    var frame = el("div", { class: "cal-frame" });
    box.appendChild(frame);
    // Offizieller Cal.com-Loader, lädt embed.js einmalig
    (function (C, A, L) { var p = function (a, ar) { a.q.push(ar); }; var d = C.document; C.Cal = C.Cal || function () { var cal = C.Cal; var ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { var api = function () { p(api, arguments); }; var namespace = ar[1]; api.q = api.q || []; if (typeof namespace === "string") { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ["initNamespace", namespace]); } else p(cal, ar); return; } p(cal, ar); }; })(window, CAL.script, "init");
    var ns = "erstgespraech-" + (++calCount);
    window.Cal("init", ns, { origin: CAL.origin });
    window.Cal.ns[ns]("ui", { layout: "month_view", theme: "light", cssVarsPerTheme: { light: { "cal-brand": "#1767D0" } } });
    window.Cal.ns[ns]("inline", { elementOrSelector: frame, calLink: CAL.link, config: { layout: "month_view", theme: "light" } });
  }

  document.querySelectorAll("[data-cal]").forEach(function (box) {
    if (store(CAL.key) === "1") { loadCal(box); return; }
    var btn = el("button", { type: "button", class: "btn btn-primary", html: svg("calendar") + "<span>Kalender laden</span>" });
    btn.addEventListener("click", function () { loadCal(box); });
    box.appendChild(el("div", { class: "cal-consent" }, [
      el("span", { class: "ico-box", html: svg("calendar") }),
      el("b", { text: "Wunschtermin direkt im Kalender wählen" }),
      el("p", {}, [
        "Der Kalender wird erst nach Ihrem Klick von Cal.com geladen. Dabei wird Ihre IP-Adresse an Cal.com übertragen. Mehr in der ",
        el("a", { href: ROOT + "datenschutz", text: "Datenschutzerklärung" }), "."
      ]),
      btn
    ]));
  });

  /* ==================================================================
     Quiz „Kostenlose Analyse“: modaler Dialog, gestartet über [data-quiz-open].
     Vorauswahl einer Leistung: data-quiz-open="shopify" (Slug wie in INTEREST).
     ================================================================== */
  var INTEREST = [
    { value: "webseiten", label: "Eine neue oder bessere Webseite", topic: "Webseiten & SEO" },
    { value: "shopify", label: "Einen Shopify-Shop", topic: "Shopify Shops" },
    { value: "automatisierung-ki", label: "Automatisierung oder KI im Alltag", topic: "Automatisierung & KI" },
    { value: "branding-print", label: "Logo, Visitenkarten oder Print", topic: "Branding & Print" },
    { value: "wartung", label: "Pflege meiner bestehenden Seite", topic: "Wartung & Support" },
    { value: "unsicher", label: "Ich bin mir noch nicht sicher", topic: "Sonstiges" }
  ];
  var SITUATION = {
    webseiten: ["Wie ist der aktuelle Stand Ihrer Webseite?", ["Ich habe noch keine Webseite", "Sie bringt kaum Anfragen", "Sie soll überarbeitet werden", "Ich gründe gerade"]],
    shopify: ["Wo stehen Sie mit Ihrem Shop?", ["Ich habe noch keinen Shop", "Zu wenig Verkäufe", "Der Shop soll überarbeitet werden", "Ich möchte zu Shopify wechseln"]],
    "automatisierung-ki": ["Wo geht bei Ihnen die meiste Zeit verloren?", ["Kundenanfragen beantworten", "Termine koordinieren", "Büro- und Verwaltungsaufgaben", "Weiß ich noch nicht genau"]],
    "branding-print": ["Was brauchen Sie als Erstes?", ["Ein neues Logo", "Visitenkarten", "Flyer oder Broschüren", "Einen kompletten Markenauftritt"]],
    wartung: ["Worum soll ich mich kümmern?", ["Updates und Sicherheit", "Kleine Änderungen und Texte", "Die Seite ist langsam", "Alles, ich möchte Ruhe haben"]],
    unsicher: ["Was beschreibt Ihre Situation am besten?", ["Ich starte gerade", "Ich möchte sichtbarer werden", "Ich möchte Abläufe vereinfachen", "Ich möchte mich erst beraten lassen"]]
  };
  var PRIORITIES = ["Hochwertiges Design", "Schnelle Umsetzung", "Mehr Anfragen bzw. Verkäufe", "Persönliche Betreuung"];
  var STEPS = ["interest", "situation", "priorities", "company", "contact", "summary"];

  var quiz = { dialog: null, refs: {}, index: 0, answers: null, openedAt: 0, lastFocus: null, sending: false, done: false };
  function freshAnswers() { return { interest: "", situation: "", priorities: [], company: "", name: "", email: "", phone: "", consent: false }; }
  quiz.answers = freshAnswers();

  function interestOf(value) { return INTEREST.filter(function (i) { return i.value === value; })[0]; }

  function buildQuiz() {
    var r = quiz.refs;
    r.step = el("span", { class: "quiz-step", "aria-hidden": "true" });
    r.bar = el("i");
    r.body = el("div", { class: "quiz-body" });
    r.live = el("p", { class: "sr-only", role: "status", "aria-live": "polite" });
    r.back = el("button", { type: "button", class: "btn btn-secondary", html: svg("back") + "<span>Zurück</span>" });
    r.next = el("button", { type: "button", class: "btn btn-primary" });
    r.foot = el("div", { class: "quiz-foot" }, [r.back, el("span", { class: "spacer" }), r.next]);
    var closeBtn = el("button", { type: "button", class: "quiz-close", "aria-label": "Analyse schließen", html: svg("close") });

    quiz.dialog = el("dialog", { class: "quiz", "aria-labelledby": "quiz-title" }, [
      el("div", { class: "quiz-head" }, [
        el("span", { class: "quiz-brand", html: document.querySelector(".brand-logo").outerHTML + "<span>Kostenlose Analyse</span>" }),
        r.step, closeBtn
      ]),
      el("div", { class: "quiz-bar" }, [r.bar]),
      r.body, r.foot, r.live
    ]);
    document.body.appendChild(quiz.dialog);

    closeBtn.addEventListener("click", closeQuiz);
    r.back.addEventListener("click", function () { if (quiz.index > 0) { quiz.index--; render(); } });
    r.next.addEventListener("click", next);
    quiz.dialog.addEventListener("cancel", function (e) { e.preventDefault(); closeQuiz(); });
    quiz.dialog.addEventListener("click", function (e) { if (e.target === quiz.dialog) closeQuiz(); });
  }

  function setNext(text, iconName, visible) {
    quiz.refs.next.hidden = !visible;
    quiz.refs.next.innerHTML = "<span>" + text + "</span>" + svg(iconName);
  }

  function heading(title, sub) {
    quiz.refs.body.appendChild(el("h2", { id: "quiz-title", class: "quiz-title", text: title }));
    if (sub) quiz.refs.body.appendChild(el("p", { class: "quiz-sub", text: sub }));
  }

  function option(label, selected, multi, onClick) {
    var btn = el("button", {
      type: "button",
      class: "quiz-option" + (multi ? " is-multi" : "") + (selected ? " is-selected" : ""),
      "aria-pressed": String(selected)
    }, [el("span", { class: "mark", html: svg("check") }), el("span", { text: label })]);
    btn.addEventListener("click", function () { onClick(btn); });
    return btn;
  }

  function render() {
    var r = quiz.refs, a = quiz.answers, step = STEPS[quiz.index];
    r.body.innerHTML = "";
    r.foot.hidden = false;
    r.back.hidden = quiz.index === 0;
    r.step.textContent = "Schritt " + (quiz.index + 1) + " von " + STEPS.length;
    r.bar.style.width = ((quiz.index + 1) / STEPS.length * 100) + "%";

    if (step === "interest") {
      heading("Wofür interessieren Sie sich?", "Wählen Sie, was am besten passt.");
      var list = el("div", { class: "quiz-options" });
      INTEREST.forEach(function (i) {
        list.appendChild(option(i.label, a.interest === i.value, false, function () {
          if (a.interest !== i.value) a.situation = "";
          a.interest = i.value;
          next();
        }));
      });
      r.body.appendChild(list);
      setNext("Weiter", "arrow", false);
    } else if (step === "situation") {
      var s = SITUATION[a.interest] || SITUATION.unsicher;
      heading(s[0], "So sehe ich direkt, wo wir ansetzen.");
      var sl = el("div", { class: "quiz-options" });
      s[1].forEach(function (label) {
        sl.appendChild(option(label, a.situation === label, false, function () { a.situation = label; next(); }));
      });
      r.body.appendChild(sl);
      setNext("Weiter", "arrow", false);
    } else if (step === "priorities") {
      heading("Was ist Ihnen besonders wichtig?", "Mehrfachauswahl möglich.");
      var pl = el("div", { class: "quiz-options" });
      PRIORITIES.forEach(function (label) {
        pl.appendChild(option(label, a.priorities.indexOf(label) !== -1, true, function (btn) {
          var pos = a.priorities.indexOf(label);
          if (pos === -1) a.priorities.push(label); else a.priorities.splice(pos, 1);
          btn.classList.toggle("is-selected", pos === -1);
          btn.setAttribute("aria-pressed", String(pos === -1));
        }));
      });
      r.body.appendChild(pl);
      setNext("Weiter", "arrow", true);
    } else if (step === "company") {
      heading("Beschreiben Sie kurz Ihr Unternehmen.", "Ein paar Stichworte reichen. Dieser Schritt ist optional.");
      var ta = el("textarea", { class: "input", id: "quiz-company", rows: "5", maxlength: "1500", placeholder: "z. B. Malerbetrieb in Bergisch Gladbach, Kunden kommen meist über Empfehlungen …" });
      ta.value = a.company;
      ta.addEventListener("input", function () { a.company = ta.value; });
      r.body.appendChild(el("div", { class: "form" }, [el("div", { class: "field" }, [el("label", { for: "quiz-company", text: "Ihr Unternehmen (optional)" }), ta])]));
      setNext("Weiter", "arrow", true);
    } else if (step === "contact") {
      heading("Wie erreiche ich Sie am besten?", "Ich melde mich innerhalb von 24 Stunden.");
      renderContact();
      setNext("Weiter", "arrow", true);
    } else {
      heading("Ihre Angaben im Überblick", "Bitte kurz prüfen. Jede Angabe lässt sich noch ändern.");
      renderSummary();
      setNext("Anfrage absenden", "send", true);
    }

    r.live.textContent = r.step.textContent + ": " + r.body.querySelector("h2").textContent;
    var focus = r.body.querySelector("button, input, textarea");
    if (focus) focus.focus({ preventScroll: true });
    r.body.scrollTop = 0;
  }

  function field(id, label, type, key, autocomplete) {
    var input = el("input", { class: "input", id: id, type: type, autocomplete: autocomplete, inputmode: type === "text" ? null : type, "aria-describedby": id + "-err" });
    input.value = quiz.answers[key];
    var err = el("p", { class: "error-msg", id: id + "-err" });
    input.addEventListener("input", function () { quiz.answers[key] = input.value; input.removeAttribute("aria-invalid"); err.textContent = ""; });
    quiz.refs.fields[key] = { input: input, err: err };
    return el("div", { class: "field" }, [el("label", { for: id, text: label }), input, err]);
  }

  function renderContact() {
    var r = quiz.refs;
    r.fields = {};
    var consent = el("input", { type: "checkbox", id: "quiz-consent", "aria-describedby": "quiz-consent-err" });
    consent.checked = quiz.answers.consent;
    var consentErr = el("p", { class: "error-msg", id: "quiz-consent-err" });
    consent.addEventListener("change", function () { quiz.answers.consent = consent.checked; consentErr.textContent = ""; });
    r.fields.consent = { input: consent, err: consentErr };
    r.honeypot = el("input", { type: "text", id: "quiz-hp", tabindex: "-1", autocomplete: "off" });

    r.body.appendChild(el("div", { class: "form" }, [
      field("quiz-name", "Name *", "text", "name", "name"),
      el("div", { class: "form-row" }, [
        field("quiz-email", "E-Mail *", "email", "email", "email"),
        field("quiz-phone", "Telefon *", "tel", "phone", "tel")
      ]),
      el("div", { class: "hp", "aria-hidden": "true" }, [el("label", { for: "quiz-hp", text: "Bitte leer lassen" }), r.honeypot]),
      el("div", {}, [
        el("label", { class: "check", for: "quiz-consent" }, [consent, el("span", {}, [
          "Ich stimme zu, dass meine Angaben zur Bearbeitung meiner Anfrage verarbeitet werden. Mehr in der ",
          el("a", { href: ROOT + "datenschutz", target: "_blank", rel: "noopener", text: "Datenschutzerklärung" }), ". *"
        ])]),
        consentErr
      ])
    ]));
  }

  function validateContact() {
    var a = quiz.answers, f = quiz.refs.fields, first = null;
    function fail(key, msg) {
      f[key].err.textContent = msg;
      f[key].input.setAttribute("aria-invalid", "true");
      first = first || f[key].input;
    }
    if (a.name.trim().length < 2) fail("name", "Bitte geben Sie Ihren Namen an.");
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(a.email.trim())) fail("email", "Bitte geben Sie eine gültige E-Mail-Adresse an.");
    if (a.phone.replace(/\D/g, "").length < 6) fail("phone", "Bitte geben Sie eine Telefonnummer an.");
    if (!a.consent) fail("consent", "Bitte stimmen Sie der Verarbeitung Ihrer Angaben zu.");
    if (first) { quiz.refs.live.textContent = "Bitte prüfen Sie die markierten Felder."; first.focus(); }
    return !first;
  }

  function renderSummary() {
    var a = quiz.answers;
    var rows = [
      ["Interesse", interestOf(a.interest) ? interestOf(a.interest).label : "", 0],
      ["Situation", a.situation, 1],
      ["Wichtig", a.priorities.join(", "), 2],
      ["Unternehmen", a.company.trim(), 3],
      ["Kontakt", [a.name, a.email, a.phone].map(function (v) { return v.trim(); }).join(" · "), 4]
    ];
    var dl = el("dl", { class: "quiz-summary" });
    rows.forEach(function (row) {
      var edit = el("button", { type: "button", text: "Ändern", "aria-label": row[0] + " ändern" });
      edit.addEventListener("click", function () { quiz.index = row[2]; render(); });
      dl.appendChild(el("div", {}, [el("dt", { text: row[0] }), el("dd", { text: row[1] || "–" }), edit]));
    });
    quiz.refs.body.appendChild(dl);
  }

  function next() {
    var step = STEPS[quiz.index];
    if (step === "contact" && !validateContact()) return;
    if (step === "summary") { submitQuiz(); return; }
    if (quiz.index < STEPS.length - 1) { quiz.index++; render(); }
  }

  function submitQuiz() {
    var a = quiz.answers, r = quiz.refs;
    if (quiz.sending) return;
    if (r.honeypot.value || Date.now() - quiz.openedAt < 4000) { closeQuiz(); return; }
    var interest = interestOf(a.interest) || interestOf("unsicher");
    var data = new FormData();
    data.append("name", a.name.trim());
    data.append("email", a.email.trim());
    data.append("phone", a.phone.trim());
    data.append("topic", interest.topic);
    data.append("message", [
      "Kostenlose Analyse (Fragebogen)",
      "Interesse: " + interest.label,
      "Situation: " + (a.situation || "–"),
      "Wichtig: " + (a.priorities.join(", ") || "–"),
      "Unternehmen: " + (a.company.trim() || "–")
    ].join("\n"));
    data.append("datenschutz", "ja");
    data.append("botcheck", "");
    data.append("ts", String(quiz.openedAt));

    quiz.sending = true;
    r.next.disabled = true;
    setNext("Wird gesendet …", "send", true);
    sendForm(data).then(function (res) {
      quiz.sending = false;
      r.next.disabled = false;
      r.body.innerHTML = "";
      r.bar.style.width = "100%";
      if (res.ok) {
        quiz.done = true;
        r.foot.hidden = true;
        r.step.textContent = "";
        r.body.appendChild(el("div", { class: "quiz-done" }, [
          el("span", { class: "ico-box", html: svg("check") }),
          el("h2", { id: "quiz-title", class: "quiz-title", text: "Vielen Dank für Ihre Anfrage." }),
          el("p", { text: "Ich habe Ihre Angaben erhalten und melde mich innerhalb von 24 Stunden bei Ihnen." })
        ]));
        r.live.textContent = "Ihre Anfrage wurde gesendet.";
        return;
      }
      heading("Das Senden hat leider nicht geklappt.", res.message || FAIL_TEXT);
      r.body.appendChild(el("div", { class: "actions quiz-options" }, [
        el("a", { class: "btn btn-primary", href: "mailto:" + CONTACT.email + "?subject=" + encodeURIComponent("Kostenlose Analyse") + "&body=" + encodeURIComponent(data.get("message")), text: "Per E-Mail senden" }),
        el("a", { class: "btn btn-secondary", href: "tel:" + CONTACT.tel, text: CONTACT.phone })
      ]));
      setNext("Erneut senden", "send", true);
      r.live.textContent = "Die Anfrage konnte nicht gesendet werden.";
    });
  }

  function openQuiz(preset) {
    if (!quiz.dialog) buildQuiz();
    if (quiz.done || preset) { quiz.answers = freshAnswers(); quiz.index = 0; quiz.done = false; }
    if (preset && interestOf(preset)) { quiz.answers.interest = preset; quiz.index = 1; }
    quiz.lastFocus = document.activeElement;
    quiz.openedAt = Date.now();
    quiz.dialog.showModal();
    document.body.classList.add("menu-open");
    render();
  }

  function closeQuiz() {
    quiz.dialog.close();
    document.body.classList.remove("menu-open");
    if (quiz.lastFocus && quiz.lastFocus.focus) quiz.lastFocus.focus();
  }

  document.addEventListener("click", function (e) {
    var trigger = e.target.closest && e.target.closest("[data-quiz-open]");
    if (!trigger || typeof HTMLDialogElement !== "function") return; // ohne <dialog>: normaler Link zur Kontaktseite
    e.preventDefault();
    var menuEl = document.querySelector("[data-menu]");
    if (menuEl && !menuEl.hidden) document.querySelector("[data-menu-toggle]").click();
    openQuiz(trigger.getAttribute("data-quiz-open"));
  });
  if (location.hash === "#analyse") window.addEventListener("load", function () { openQuiz(""); });
})();
