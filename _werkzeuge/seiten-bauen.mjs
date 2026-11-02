/* Baut alle HTML-Seiten der Website aus _werkzeuge/seiten/*.html.
   Jede Quelldatei beginnt mit einem JSON-Kopf in einem Kommentar:
     <!--{ "out": "index.html", "title": "…", "description": "…", "nav": "start" }-->
   Danach folgt der Inhalt von <main>. Kopf, Header, Mobile-Menü und Footer kommen von hier,
   damit sie auf allen Seiten identisch sind. Die erzeugten Dateien sind die Website.
   Aufruf: node _werkzeuge/seiten-bauen.mjs */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC = ROOT + "_werkzeuge/seiten/";
const VERSION = 8; // bei CSS/JS-Änderungen erhöhen (Cache)

export const SITE = {
  name: "JG Solutions",
  url: "https://jg-solutions.eu",
  owner: "Juan Goerth",
  phone: "+49 176 24004201",
  tel: "+4917624004201",
  email: "info@jg-solutions.eu",
  street: "Winterberg 33a",
  zip: "51515",
  city: "Kürten",
};

export const SERVICES = [
  { slug: "webseiten", name: "Webseiten & SEO", icon: "globe",
    short: "Individuelle Webseiten, die schnell laden und bei Google gefunden werden." },
  { slug: "shopify", name: "Shopify Shops", icon: "bag",
    short: "Online-Shops mit sauberem Checkout, die Besucher zu Käufern machen." },
  { slug: "automatisierung-ki", name: "Automatisierung & KI", icon: "bolt",
    short: "Wiederkehrende Abläufe automatisieren und Chatbots sinnvoll einsetzen." },
  { slug: "branding-print", name: "Branding & Print", icon: "palette",
    short: "Logo, Farben, Visitenkarten und Flyer für einen einheitlichen Auftritt." },
  { slug: "wartung", name: "Wartung & Support", icon: "wrench",
    short: "Updates, Backups und kleine Änderungen mit festem Ansprechpartner." },
];

const NAV = [
  { key: "start", label: "Start", href: "./" },
  { key: "leistungen", label: "Leistungen", href: "leistungen", drop: true },
  { key: "referenzen", label: "Referenzen", href: "referenzen" },
  { key: "ueber", label: "Über mich", href: "ueber-uns" },
  { key: "kontakt", label: "Kontakt", href: "kontakt" },
];

/* Icons im Stil von Lucide (ISC-Lizenz), 24×24, Strichstärke über CSS */
const ICONS = {
  arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  arrowUpRight: '<path d="M7 17 17 7"/><path d="M7 7h10v10"/>',
  back: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
  caret: '<path d="m6 9 6 6 6-6"/>',
  menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
  close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.1 9.9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"/>',
  bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/>',
  palette: '<circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2a10 10 0 0 0 0 20 2 2 0 0 0 2-2 2 2 0 0 1 2-2h1.5a4.5 4.5 0 0 0 4.5-4.5C22 7 17.5 2 12 2Z"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h4"/>',
  refresh: '<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M3 21v-5h5"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
};
export const icon = (name, cls = "") => {
  if (!ICONS[name]) throw new Error(`Unbekanntes Icon: ${name}`);
  return `<svg${cls ? ` class="${cls}"` : ""} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
};

/* Logo in Markenblau (#2E90FF), oben und im dunkelblauen Footer */
const brand = (root, color = "blau") =>
  `<a class="brand" href="${root || "./"}" aria-label="${SITE.name}, zur Startseite"><img class="brand-logo" src="${root}assets/logo/logo-${color}-114.webp" alt="" width="46" height="32"${color === "weiss" ? ' loading="lazy" decoding="async"' : ""}><span class="brand-name">JG Solutions</span></a>`;

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ---------------------------------------------------------------- Bausteine */
function header(root, active) {
  const drop = SERVICES.map(s => `<a class="drop-link" href="${root}leistungen/${s.slug}"><span class="ico-box">${icon(s.icon)}</span><span><b>${esc(s.name)}</b><span>${esc(s.short)}</span></span></a>`).join("");
  const links = NAV.map(n => {
    const cur = n.key === active ? ' aria-current="page"' : "";
    const href = n.href === "./" ? root || "./" : root + n.href;
    if (!n.drop) return `<li><a class="nav-link" href="${href}"${cur}>${n.label}</a></li>`;
    return `<li class="nav-drop" data-drop><a class="nav-link" href="${href}"${cur}>${n.label}</a><button class="drop-toggle" type="button" aria-expanded="false" aria-controls="drop-leistungen" aria-label="Leistungen-Menü öffnen">${icon("caret")}</button><div class="drop-panel" id="drop-leistungen">${drop}<a class="drop-all" href="${href}">Alle Leistungen im Überblick ${icon("arrow")}</a></div></li>`;
  }).join("");
  const mLinks = NAV.map(n => {
    const cur = n.key === active ? ' aria-current="page"' : "";
    const href = n.href === "./" ? root || "./" : root + n.href;
    if (!n.drop) return `<li><a class="m-link" href="${href}"${cur}>${n.label}</a></li>`;
    const sub = SERVICES.map(s => `<li><a href="${root}leistungen/${s.slug}">${esc(s.name)}</a></li>`).join("");
    return `<li><button class="m-link m-parent" type="button" aria-expanded="false" aria-controls="m-sub" data-m-parent>${n.label}${icon("caret")}</button><ul class="m-sub" id="m-sub" hidden><li><a href="${href}"${cur}>Alle Leistungen</a></li>${sub}</ul></li>`;
  }).join("");

  return `<header class="site-header" data-header>
  <div class="container header-inner">
    ${brand(root)}
    <nav class="nav" aria-label="Hauptnavigation"><ul class="nav-list">${links}</ul></nav>
    <div class="header-actions">
      <a class="btn btn-primary btn-sm header-cta" href="${root}kontakt" data-quiz-open>${icon("arrowUpRight")}Kostenlose Analyse</a>
      <button class="burger" type="button" aria-expanded="false" aria-controls="m-menu" aria-label="Menü öffnen" data-menu-toggle>${icon("menu", "i-open")}${icon("close", "i-close")}</button>
    </div>
  </div>
  <div class="m-menu" id="m-menu" data-menu hidden>
    <nav aria-label="Mobile Navigation"><ul class="m-list">${mLinks}</ul></nav>
    <div class="m-foot">
      <a class="btn btn-primary btn-block" href="${root}kontakt" data-quiz-open>Kostenlose Analyse ${icon("arrow")}</a>
      <a class="m-tel" href="tel:${SITE.tel}">${icon("phone")}${SITE.phone}</a>
    </div>
  </div>
</header>`;
}

function footer(root) {
  const svc = SERVICES.map(s => `<li><a href="${root}leistungen/${s.slug}">${esc(s.name)}</a></li>`).join("");
  return `<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        ${brand(root)}
        <p><b>${SITE.name}</b> · ${SITE.owner}</p>
        <address>${SITE.street}<br>${SITE.zip} ${SITE.city}<br>Deutschland</address>
        <p><a href="mailto:${SITE.email}">${SITE.email}</a><br><a href="tel:${SITE.tel}">${SITE.phone}</a></p>
      </div>
      <div><h2>Leistungen</h2><ul>${svc}</ul></div>
      <div><h2>Navigation</h2><ul><li><a href="${root}leistungen">Leistungen</a></li><li><a href="${root}referenzen">Referenzen</a></li><li><a href="${root}ueber-uns">Über mich</a></li><li><a href="${root}kontakt">Kontakt</a></li><li><a href="${root}kontakt" data-quiz-open>Kostenlose Analyse</a></li></ul></div>
      <div><h2>Rechtliches</h2><ul><li><a href="${root}impressum">Impressum</a></li><li><a href="${root}datenschutz">Datenschutz</a></li></ul></div>
    </div>
    <div class="footer-bottom"><span>© <span data-year>2026</span> ${SITE.name} · ${SITE.owner}</span><span>Gemacht in ${SITE.city} bei Köln</span></div>
  </div>
</footer>`;
}

/* Wiederverwendbare Inhaltsblöcke, in den Quelldateien als {{name}} bzw. {{name:arg}} */
const BLOCKS = {
  root: (root) => root,
  icon: (root, name) => icon(name),
  phone: () => SITE.phone,
  tel: () => SITE.tel,
  email: () => SITE.email,
  "service-cards": (root) => `<div class="card-grid">${SERVICES.map(s => `<a class="card" href="${root}leistungen/${s.slug}"><span class="ico-box">${icon(s.icon)}</span><h3>${esc(s.name)}</h3><p>${esc(s.short)}</p><span class="more">Details ${icon("arrow")}</span></a>`).join("")}</div>`,
  "more-services": (root, current) => `<section class="section section-line" aria-labelledby="mehr-title"><div class="container"><div class="section-head section-head-row"><div><h2 id="mehr-title" class="h2">Weitere Leistungen.</h2><p class="lead">Alles aus einer Hand, mit einem Ansprechpartner.</p></div><a class="btn btn-secondary" href="${root}referenzen">Referenzen ansehen ${icon("arrow")}</a></div><div class="card-grid card-grid-4">${SERVICES.filter(s => s.slug !== current).map(s => `<a class="card" href="${root}leistungen/${s.slug}"><span class="ico-box">${icon(s.icon)}</span><h3>${esc(s.name)}</h3><p>${esc(s.short)}</p><span class="more">Details ${icon("arrow")}</span></a>`).join("")}</div></div></section>`,
  "analyse-cta": (root, topic) => `<section class="section section-dark cta-band" aria-labelledby="cta-title"><div class="container cta-inner"><div><h2 id="cta-title" class="h2">Kostenlose Analyse in zwei Minuten.</h2><p class="lead">Ein paar kurze Fragen zu Ihrem Vorhaben. Ich melde mich innerhalb von 24 Stunden mit einer ersten Einschätzung und einem Festpreis-Vorschlag.</p></div><div class="actions"><a class="btn btn-light" href="${root}kontakt" data-quiz-open${topic ? `="${topic}"` : ""}>Analyse starten ${icon("arrow")}</a><a class="btn btn-outline-light" href="tel:${SITE.tel}">${icon("phone")}${SITE.phone}</a></div></div></section>`,
  "contact-form": (root, idPrefix = "k") => contactForm(root, idPrefix),
  steps: () => `<ol class="steps">${STEPS.map(([title, text], i) => `<li class="step reveal"><span class="step-num">${i + 1}</span><h3>${title}</h3><p>${text}</p></li>`).join("")}</ol>`,
  /* {{illu:haupticon,chip1,chip2,chip3}} – animiertes Interface wie auf den JL-Leistungsseiten:
     schwebendes Fenster, Kennzahl-Karte mit wachsenden Balken, Verbindungslinien mit laufendem Punkt */
  illu: (root, arg) => {
    const [main, ...chips] = arg.split(",");
    const bars = [38, 52, 44, 64, 70, 56, 76, 84, 80, 100]
      .map((h, i) => `<i class="${i === 2 || i === 5 ? "is-down" : "is-up"}" style="--h:${h}%;--d:${i * 70}ms"></i>`).join("");
    return `<div class="illu" aria-hidden="true"><div class="illu-grid"></div><div class="illu-window"><div class="illu-dots"><i></i><i></i><i></i></div><div class="illu-tile">${icon(main)}</div><div class="illu-line"></div><div class="illu-line"></div><div class="illu-line"></div></div><span class="illu-link illu-link-1"><i></i></span><span class="illu-link illu-link-2"><i></i></span><div class="illu-metric"><div class="illu-bars">${bars}</div></div>${chips.map((c, i) => `<span class="illu-chip illu-chip-${i + 1}">${icon(c)}</span>`).join("")}</div>`;
  },
};

const STEPS = [
  ["Kostenlose Analyse", "Sie erzählen mir von Ihrem Vorhaben. Ich schaue mir die Ausgangslage an und melde mich innerhalb von 24 Stunden."],
  ["Konzept und Festpreis", "Sie bekommen einen klaren Vorschlag mit Umfang, Ablauf und Festpreis. Gebaut wird erst, wenn alles passt."],
  ["Umsetzung", "Ich setze alles sauber um. Sie sehen Zwischenstände und geben Feedback, bevor etwas live geht."],
  ["Launch und Betreuung", "Wir gehen live. Auf Wunsch kümmere ich mich danach um Updates, Backups und Änderungen."],
];

const crumbsHtml = (root, crumbs) => `<nav class="crumbs" aria-label="Brotkrumen"><ol><li><a href="${root || "./"}">Start</a></li>${crumbs.map(([name, path], i) => i === crumbs.length - 1 ? `<li><span aria-current="page">${esc(name)}</span></li>` : `<li><a href="${root}${path.slice(1)}">${esc(name)}</a></li>`).join("")}</ol></nav>`;

function contactForm(root, p) {
  const topics = [...SERVICES.map(s => s.name), "Sonstiges"].map(t => `<option>${esc(t)}</option>`).join("");
  return `<form class="form" action="${root}kontakt-senden.php" method="post" novalidate data-contact-form>
  <div class="form-row">
    <div class="field"><label for="${p}-name">Name *</label><input class="input" id="${p}-name" name="name" type="text" autocomplete="name" required minlength="2" maxlength="100"></div>
    <div class="field"><label for="${p}-email">E-Mail *</label><input class="input" id="${p}-email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="150"></div>
  </div>
  <div class="form-row">
    <div class="field"><label for="${p}-phone">Telefon <span class="opt">(optional)</span></label><input class="input" id="${p}-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" maxlength="40"></div>
    <div class="field"><label for="${p}-topic">Thema</label><select class="input" id="${p}-topic" name="topic"><option value="">Bitte wählen</option>${topics}</select></div>
  </div>
  <div class="field"><label for="${p}-message">Nachricht *</label><textarea class="input" id="${p}-message" name="message" rows="5" required minlength="10" maxlength="5000" placeholder="Worum geht es? Ein paar Stichworte reichen."></textarea></div>
  <div class="hp" aria-hidden="true"><label for="${p}-botcheck">Bitte leer lassen</label><input id="${p}-botcheck" name="botcheck" type="text" tabindex="-1" autocomplete="off"></div>
  <input type="hidden" name="ts" value="" data-ts>
  <label class="check" for="${p}-ds"><input id="${p}-ds" name="datenschutz" type="checkbox" value="ja" required><span>Ich stimme zu, dass meine Angaben zur Bearbeitung meiner Anfrage verarbeitet werden. Mehr in der <a href="${root}datenschutz">Datenschutzerklärung</a>. *</span></label>
  <p class="form-note" role="status" aria-live="polite" data-form-note></p>
  <button class="btn btn-primary btn-block" type="submit">${icon("send")}Anfrage senden</button>
  <p class="form-hint">* Pflichtfeld · Antwort innerhalb von 24 Stunden</p>
</form>`;
}

function expand(html, root) {
  return html.replace(/\{\{([a-z-]+)(?::([^}]*))?\}\}/gi, (m, name, arg) => {
    if (!BLOCKS[name]) throw new Error(`Unbekannter Baustein: ${m}`);
    return BLOCKS[name](root, arg);
  });
}

/* ------------------------------------------------------------ Strukturdaten */
const business = {
  "@type": "ProfessionalService",
  "@id": `${SITE.url}/#firma`,
  name: SITE.name,
  alternateName: `${SITE.name} – ${SITE.owner}`,
  description: "Webseiten, Shopify Shops, Automatisierung und Branding aus Kürten für den Rheinisch-Bergischen Kreis, Köln und deutschlandweit.",
  url: `${SITE.url}/`,
  logo: `${SITE.url}/assets/logo/icon-512.png`,
  image: `${SITE.url}/assets/og-image.jpg`,
  telephone: SITE.phone,
  email: SITE.email,
  founder: { "@type": "Person", name: SITE.owner },
  address: { "@type": "PostalAddress", streetAddress: SITE.street, postalCode: SITE.zip, addressLocality: SITE.city, addressRegion: "Nordrhein-Westfalen", addressCountry: "DE" },
  geo: { "@type": "GeoCoordinates", latitude: 51.05, longitude: 7.269 },
  areaServed: [
    { "@type": "City", name: "Kürten" }, { "@type": "City", name: "Bergisch Gladbach" },
    { "@type": "City", name: "Köln" }, { "@type": "AdministrativeArea", name: "Rheinisch-Bergischer Kreis" },
    { "@type": "Country", name: "Deutschland" },
  ],
  knowsAbout: ["Webdesign", "Suchmaschinenoptimierung", "Shopify", "Automatisierung", "KI-Chatbots", "Branding"],
};

function jsonLd(meta, url) {
  const graph = [business,
    { "@type": "WebSite", "@id": `${SITE.url}/#website`, url: `${SITE.url}/`, name: SITE.name, inLanguage: "de-DE", publisher: { "@id": `${SITE.url}/#firma` } },
    { "@type": "WebPage", "@id": `${url}#seite`, url, name: meta.title, description: meta.description, inLanguage: "de-DE", isPartOf: { "@id": `${SITE.url}/#website` }, about: { "@id": `${SITE.url}/#firma` } }];
  if (meta.breadcrumbs) {
    graph.push({ "@type": "BreadcrumbList", itemListElement: [["Start", "/"], ...meta.breadcrumbs].map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: SITE.url + path })) });
  }
  if (meta.service) {
    graph.push({ "@type": "Service", name: meta.service, serviceType: meta.service, provider: { "@id": `${SITE.url}/#firma` }, areaServed: business.areaServed, url });
  }
  if (meta.faq) {
    graph.push({ "@type": "FAQPage", mainEntity: meta.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });
  }
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
}

/* FAQ-Akkordeon aus den Metadaten, im Inhalt als {{faq}} */
const faqHtml = faq => `<div class="faq">${faq.map(([q, a]) => `<details class="faq-item"><summary>${esc(q)}${icon("caret")}</summary><p>${esc(a)}</p></details>`).join("")}</div>`;

/* ----------------------------------------------------------------- Seite */
function page(meta, body) {
  const depth = meta.out.split("/").length - 1;
  const root = meta.root ?? "../".repeat(depth);
  const path = meta.path ?? "/" + meta.out.replace(/(^|\/)index\.html$/, "$1").replace(/\.html$/, "");
  const url = SITE.url + path;
  if (meta.title.length > 60) throw new Error(`${meta.out}: Title zu lang (${meta.title.length})`);
  const dl = meta.description.length;
  if (dl < 120 || dl > 155) throw new Error(`${meta.out}: Description ${dl} Zeichen (120–155)`);

  let content = expand(body.trim(), root);
  if (meta.faq) content = content.replace("<!--faq-->", faqHtml(meta.faq));
  if (meta.breadcrumbs) content = content.replace("<!--crumbs-->", crumbsHtml(root, meta.breadcrumbs));
  if ((content.match(/<h1[\s>]/g) || []).length !== 1) throw new Error(`${meta.out}: genau eine H1 nötig`);

  const scripts = ["js/main.js", ...(meta.scripts || [])]
    .map((s, i) => `<script src="${root}${s}?v=${VERSION}"${i === 0 ? ` data-root="${root}"` : ""} defer></script>`).join("\n");
  const preload = (meta.preload || []).map(p => `<link rel="preload" href="${root}${p.href}" as="${p.as}"${p.type ? ` type="${p.type}"` : ""}${p.as === "image" ? ' fetchpriority="high"' : ""}>`).join("\n");

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.description)}">
<meta name="robots" content="${meta.robots || "index, follow, max-image-preview:large"}">
${meta.robots?.startsWith("noindex") ? "" : `<link rel="canonical" href="${url}">\n`}<meta property="og:type" content="website">
<meta property="og:locale" content="de_DE">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:title" content="${esc(meta.title)}">
<meta property="og:description" content="${esc(meta.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE.url}/assets/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${jsonLd(meta, url)}</script>
<meta name="theme-color" content="#F4F8FD">
<link rel="icon" href="${root}assets/logo/icon-192.png" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="${root}apple-touch-icon.png">
<link rel="manifest" href="${root}site.webmanifest">
<link rel="preload" href="${root}assets/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
${preload ? preload + "\n" : ""}<link rel="stylesheet" href="${root}css/style.css?v=${VERSION}">
</head>
<body${meta.bodyClass ? ` class="${meta.bodyClass}"` : ""}>
<a class="skip-link" href="#main">Zum Inhalt springen</a>
${header(root, meta.nav)}
<main id="main">
${content}
</main>
${footer(root)}
${scripts}
</body>
</html>
`;
}

const files = readdirSync(SRC).filter(f => f.endsWith(".html"));
for (const f of files) {
  const raw = readFileSync(SRC + f, "utf8");
  const m = raw.match(/^<!--(\{[\s\S]*?\})-->\s*/);
  if (!m) throw new Error(`${f}: JSON-Kopf fehlt`);
  const meta = JSON.parse(m[1]);
  const out = ROOT + meta.out;
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, page(meta, raw.slice(m[0].length)));
  console.log("✓", meta.out);
}
