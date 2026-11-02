# JG Solutions – Website (JL-Stil)

Statische Website (HTML, CSS, Vanilla-JS) für https://jg-solutions.eu.

- **Seiten bauen:** `node _werkzeuge/seiten-bauen.mjs` – die HTML-Dateien im Hauptordner werden daraus erzeugt, nicht von Hand bearbeiten. Inhalte liegen in `_werkzeuge/seiten/`. Nach CSS-/JS-Änderungen `VERSION` im Generator erhöhen.
- **Weltkugel-Daten:** `node _werkzeuge/globus-daten.mjs` (Landpunkte) und `node _werkzeuge/deutschland-daten.mjs` (Deutschland-Raster), Quelle Natural Earth (gemeinfrei) in `_werkzeuge/daten/`.
- **Design-Werte:** `docs/design-tokens.md`
- **Vorschau:** https://jg-solutionseu.github.io/JG-Webseite/ – wird per GitHub-Action (`.github/workflows/pages.yml`) bei jedem Push auf `main` veröffentlicht, nur mit den öffentlichen Dateien. Das Kontaktformular braucht PHP und funktioniert erst auf IONOS.
- **Lokal testen:** `python -I _werkzeuge/testserver.py . 8770`
- **Live-Hosting:** IONOS (`.htaccess` für saubere URLs, CSP und Caching; `_werkzeuge/` und `docs/` sind dort gesperrt).
