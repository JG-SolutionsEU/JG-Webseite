# REGELN – JG Solutions, Website im Demodern-Stil

Ergänzt das globale Regelwerk (Skill `webseiten-regeln`). Bei Widerspruch gilt diese Datei nur für die hier genannten Punkte.

## Vorgaben von Juan (2026-10-28)

- Look, Farben, Schrift und Seitenaufbau wie **demodern.de** (Vorlage). Name, Logo und Texte sind **JG Solutions** – keine Texte, Logos oder Bilder von Demodern übernehmen.
- Komplette Website, neuer Ordner, Logo = JG-Logo einfarbig (schwarz / weiß), Deutsch mit **Du**.
- Texte: aus der OKTOBER-Seite, gekürzt auf knappe Statements.
- Projekte-Slider: Lennerts Hausverwaltung, Monsieur Running, PB Malwerk.
- Statt „Systems“-Block: Ablauf in 4 Schritten.
- Kontakt: PHP-Formular, Cal.com (2-Klick), Telefon + WhatsApp, Quiz („Kostenlose Analyse“, Web3Forms).
- Hero: großes Bild (kein Video). Animation dezent. Bilder Pixabay (Hero abstrakt, Leistungen Arbeitsfotos). Foto von Juan nur auf „Über mich“ (aus dem Footer am 2026-10-29 entfernt).

## Bewusste Abweichungen vom globalen Regelwerk

- **Outline-Pillen-Buttons** (wie Demodern): Juans ausdrückliche Vorgabe „Branding wie Demodern“. Nur für Buttons, nicht für Karten/Bilder.
- **Akzentfläche Dunkelblau #0E2D69** (seit 2026-10-29, vorher Demodern-Neongelb #EEFF00) für genau einen Abschnitt pro Seite (Leistungs-Block) und als kleiner Akzent. Text darauf weiß. Kein Glow, kein Verlauf.
- **js/quiz.js (≈ 35 KB)** über dem JS-Budget: wird erst beim ersten Klick auf „Kostenlose Analyse“ nachgeladen, auf der Kontaktseite direkt (Kalender).
- Web3Forms (Quiz) und Cal.com (nach Klick) sind die einzigen Drittanbieter.
- **Animationen länger als 400 ms:** Headline Wort für Wort und Einblenden beim Scrollen 600 ms (Werte von demodern.de), Kennzahlen zählen 1,4 s hoch. Die Ablauf-Linien sind an die Scroll-Position gekoppelt (`animation-timeline`), also ohne feste Dauer. Alles nur mit `transform`/`opacity`, bei „Bewegung reduzieren“ aus.

## Design-Tokens (gemessen auf demodern.de, 2026-10-28)

| Token | Wert | Einsatz |
|---|---|---|
| `--c-ink` | `#171717` | Text, Linien, Buttons |
| `--c-black` | `#000000` | Footer-Fläche, dunkle Abschnitte |
| `--c-bg` | `#FFFFFF` | Seitenhintergrund |
| `--c-accent` | `#0E2D69` | Dunkelblau: Leistungs-Block, Haupt-Button im Footer, Auswahl im Quiz (Text darauf weiß, ≈ 13:1) |
| `--c-accent-line` | `#5A78B5` | Rand des blauen Buttons auf Schwarz |
| `--c-on-accent-muted` | `#C3CDE0` | Zweittext auf Dunkelblau |
| `--c-muted` | `#6E6E6E` | Zweittext (≥ 4.5:1 auf Weiß) |
| `--c-line` | `#D9D9D9` | Trennlinien |
| `--c-soft` | `#EDEDED` | Bildplatzhalter, helle Flächen |

- **Schrift:** Archivo (variabel, lokal `assets/fonts/archivo-latin-wght-normal.woff2`, OFL). Überschriften **300 (Light)**, Fließtext 300/400, Buttons 500.
- **Größen:** H1 72/90 px · H2 48/60 px · Footer-H2 36/54 px · Lead 20/32 px · Text 16–18 px · Nav 16 px. Mobil per `clamp()` verkleinert.
- **Ecken:** Bilder und Flächen eckig (0 px). Buttons voll rund.
- **Header:** fix, 64 px, weiß. **Footer:** schwarz, Text weiß.
- **Buttons:** 1 px Rahmen, Padding 10/32 px, Höhe ≥ 44 px, Pfeil-Icon rechts, Hover = gefüllt.

## Projektdaten

- Firma: JG Solutions · Inhaber Juan Goerth · Winterberg 33a, 51515 Kürten
- Telefon: +49 176 24004201 (`tel:+4917624004201`) · WhatsApp `https://wa.me/4917624004201`
- E-Mail: info@jg-solutions.eu · Domain: https://jg-solutions.eu (ohne www)
- Cal.com: `jg-solutions/kostenloses-erstgesprach`
- Einsatzgebiet: Kürten, Bergisch Gladbach, Rheinisch-Bergischer Kreis, Köln, ganz Deutschland

## Arbeitsweise

- Seiten werden aus `_quellen/seiten/*.html` gebaut: `python _quellen/seiten-bauen.py` (Kopf, Header, Footer, JSON-LD kommen aus dem Skript, damit sie überall gleich sind).
- Bilder: Originale in `_quellen/pixabay/`, Umwandlung mit `python _quellen/bilder-konvertieren.py`.
