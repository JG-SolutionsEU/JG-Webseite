# JG Solutions – Webseite im JL-Consulting-Stil (Design-Spezifikation)

Datum: 2026-10-30 · Vorlage: https://jlconsulting.ch/ · Regeln: `../WEBSEITEN-REGELN.txt` (verbindlich)

## Entscheidungen (mit Juan abgestimmt)

| Thema | Entscheidung |
|---|---|
| Ordner | neu: `JG Webseite JL-Stil/` (Oktober-Seite bleibt unberührt) |
| Farben | komplett monochrom wie JL (Zinc-Grautöne, Off-White, Schwarz); Logo und Marker schwarz |
| Schrift | Inter (lokal, variable woff2), Überschriften 900/700 |
| Anrede / Perspektive | „Sie“ / „Ich“ (Solo-Unternehmer Juan Goerth) |
| Umfang | komplette Seite: Start, Leistungen + 5 Unterseiten, Referenzen, Über mich, Kontakt, Danke, 404, Impressum, Datenschutz |
| Hero-Headline | „Digitale Auftritte, die wirken.“ |
| Weltkugel | Punkt-Globus (Canvas 2D, Landpunkte aus Natural Earth 110m), langsame Rotation, pulsierender Marker auf Kürten, nicht ziehbar |
| Logo-Leiste | nur echte Kunden: Lennerts Hausverwaltung, Monsieur Running |
| Zahlen-Kacheln | nachprüfbar: „5 Leistungen aus einer Hand“, „24 h bis zur ersten Rückmeldung“ |
| Blog | nein |
| Standorte | Einsatzgebiet: Kürten (Sitz), Bergisch Gladbach, Köln, deutschlandweit remote; Punkt-Karte aus `rbk.geojson` + `koeln.geojson` als statische SVG |
| Kontakt-Sektion | dunkel, Foto + Zitat, volles Formular → `kontakt-senden.php` |
| Extras Startseite | Cal.com (2-Klick), 3D-Visitenkarte (three.js, lazy) |
| Topbar | keine |
| Handy-Menü | Vollbild-Overlay, Leistungen aufklappbar |
| Header-CTA | „Kostenlose Analyse“ → bestehendes Quiz im JL-Stil (Modal) |
| Preise | keine („Festpreis nach kostenloser Analyse“) |
| Leistungen | 5 gebündelt, je 4 FAQ (FAQPage-Schema) |
| Werte | Persönlich statt Agentur · Schnell und schlank · Klar und transparent · Technik, die dem Geschäft dient |

## Design-Tokens (aus jlconsulting.ch ausgelesen, 2026-10-30)

- Text `#09090B` (zinc-950), Fließtext grau `#52525B` (zinc-600), Linien `#E4E4E7` (zinc-200), Fläche hell `#F4F4F5` (zinc-100), Seitenhintergrund `#FBFBF8`, Weiß, Schwarz `#000`
- H1 72px/1.0, 900, Laufweite −0.025em · H2 48px/1.0, 700, −0.025em · H3 18px/1.55, 700 · Lead 20px/1.8
- Buttons: Pille, Höhe 48px, Padding 0 24px, 14px/600; primär schwarz, sekundär weiß mit 1px schwarzem Rand
- Karten: weiß, 1px zinc-200, Radius 8px, Schatten `0 18px 55px rgba(15,23,42,.06)`
- Header: sticky, weiß 88 % + blur(8px), 1px Linie unten
- Sektionen: Padding ca. 82px (fluid via clamp), Container max. 1200px
- Dunkle Sektionen `#09090B` bzw. `#000`; Formularfelder dunkel, Radius 6px

## Seitenstruktur Startseite

Header → Hero (H1, Lead, 2 Buttons, Globus unten rechts) → Logo-Leiste + „Referenzen ansehen“ → „Persönlich betreut“ (H2 links, Text + 2 schwarze Zahl-Kacheln + 2 Buttons rechts) → Werte (dunkel, 4 Punkte mit Icon) → Leistungen (5 Karten, „Übersicht“) → 3D-Visitenkarte → Einsatzgebiet (Punkt-Karte + 4 Ortskarten) → Termin (Cal.com nach Klick) → Kontakt (dunkel, Foto, Zitat, Formular) → Footer (4 Spalten).

## Leistungen (URLs)

| Neu | ersetzt (301) |
|---|---|
| `leistungen/webseiten` (Webseiten & SEO) | `leistungen/seo` |
| `leistungen/shopify` | – |
| `leistungen/automatisierung-ki` | `leistungen/automatisierungen`, `leistungen/ki` |
| `leistungen/branding-print` | `leistungen/branding`, `leistungen/visitenkarten` |
| `leistungen/wartung` | – |

Unterseite: Hero (H1, Lead, 2 Buttons, Inline-SVG-Illustration) → „Was ich liefere“ (dunkel, 4 Punkte) → Ablauf (4 Schritte) → FAQ (4, `<details>`) → Analyse-CTA → weitere Leistungen.

## Technik

- HTML/CSS/Vanilla-JS, kein Build, kein CDN, keine Cookies, keine externen Requests beim Laden.
- `css/style.css` (eine Datei), `js/main.js` (Navigation, Mobile-Menü, Quiz-Modal, Formular-Versand, Reveal, Cal-2-Klick).
- Nur Startseite: `js/globe.js` + `js/globe-land.js` (Punktdaten), `js/card3d.js` (lädt `three.module.min.js` erst bei Sichtbarkeit).
- Globus: Orthografische Projektion auf Canvas, DPR max. 2, Rückseite ausgeblendet, Pause außerhalb des Viewports, `prefers-reduced-motion` = Standbild.
- Formular: bestehendes `kontakt-senden.php`, Texte auf „Sie“, Themenliste auf 5 Leistungen.
- `.htaccess`: HTTPS, saubere URLs, 301 der alten Leistungs-URLs, Sicherheits-Header, CSP, Caching.

## Nicht im Umfang

Blog, Preise, Preisrechner, Topbar, Referenz-Karten und Prozess-Pinning auf der Startseite, GSAP/Lenis.

## Platzhalter / offen

- Logos der Kunden nur als Schriftzug (keine Logodateien vorhanden).
- Rechtstexte sind Entwürfe und vor dem Livegang zu prüfen.
