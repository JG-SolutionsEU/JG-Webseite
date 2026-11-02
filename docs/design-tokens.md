# Design-Tokens – JG Solutions (JL-Stil)

**System:** Tailwind CSS Standard-Theme (Zinc-Palette, 0.25rem-Raster), weil die Vorlage jlconsulting.ch genau darauf aufbaut.
**Quellen:** (1) Live-Messung der berechneten Styles von https://jlconsulting.ch/ am 2026-10-30 · (2) Tailwind-CSS-Farbpalette „zinc“ (tailwindcss.com/docs/colors).
Single Source of Truth für `css/style.css`.

## Farben
| Token | Wert | Quelle / Einsatz |
|---|---|---|
| `--c-ink` | `#09090B` | zinc-950 – Überschriften, dunkle Sektionen (gemessen: `oklch(0.141 0.005 285.823)`) |
| `--c-text` | `#18181B` | zinc-900 – Body-Text (gemessen `rgb(24,24,27)`) |
| `--c-muted` | `#52525B` | zinc-600 – Fließtext/Lead (gemessen `oklch(0.442 0.017 285.786)`) |
| `--c-subtle` | `#71717A` | zinc-500 – Meta-Text |
| `--c-dots` | `#A1A1AA` | zinc-400 – Punkte Karte/Globus |
| `--c-line` | `#E4E4E7` | zinc-200 – Rahmen, Trennlinien (gemessen) |
| `--c-fill` | `#F4F4F5` | zinc-100 – aktiver Nav-Link (gemessen) |
| `--c-bg` | `#FBFBF8` | Seitenhintergrund (gemessen `rgb(251,251,248)`) |
| `--c-white` | `#FFFFFF` | Karten, Header (88 % Deckkraft + blur 8px) |
| `--c-black` | `#000000` | Buttons primär, Kontakt-Sektion |
| `--c-on-dark-muted` | `#A1A1AA` | zinc-400 – Text auf dunkel |
| `--c-dark-field` | `#18181B` | zinc-900 – Formularfeld auf dunkel |
| `--c-dark-line` | `#27272A` | zinc-800 – Rahmen auf dunkel |

## Typografie (Inter, variable 100–900)
| Stufe | Größe / Zeilenhöhe / Gewicht / Laufweite | Quelle |
|---|---|---|
| H1 | 72px / 1 / 900 / −0.025em (mobil 44px) | gemessen 72px/72px/900/−1.8px |
| H2 | 48px / 1 / 700 / −0.025em (mobil 34px) | gemessen 48px/48px/700/−1.2px |
| H3 | 18px / 28px / 700 | gemessen |
| Lead | 20px / 36px / 400 | gemessen |
| Body | 16px / 1.6 | Tailwind base |
| Small | 14px / 20px | Tailwind text-sm (Buttons, Nav) |
| XS | 12px / 16px | Tailwind text-xs (Tags) |

## Abstände (Tailwind-Raster 0.25rem = 4px)
4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 80 · 96 px. Sektionen: 82px oben/unten (gemessen `81.92px`), mobil 56px. Container max. 1200px (Tailwind `max-w-7xl` 1280px abzüglich Gutter), Gutter 16 → 24 → 32px.

## Radien
| Token | Wert | Quelle |
|---|---|---|
| `--r-sm` | 6px | Nav-Link, Formularfelder (gemessen) |
| `--r-md` | 8px | Karten (gemessen) |
| `--r-lg` | 12px | Zahl-Kacheln, Bilder (Tailwind rounded-xl) |
| `--r-pill` | 9999px | Buttons (gemessen) |

## Schatten
`--shadow-card: 0 18px 55px rgba(15,23,42,.06)` (gemessen an den Leistungs-Karten).

## Buttons
| Variante | Normal | Hover | Fokus | Deaktiviert |
|---|---|---|---|---|
| Primär | bg #000, Text #fff, Höhe 48px, Padding 0 24px, 14px/600, Pille | bg zinc-800 `#27272A` | 2px Outline zinc-950, Abstand 2px | Deckkraft .5, cursor not-allowed |
| Sekundär | bg #fff, Text #000, 1px Rand #000 | bg zinc-100 `#F4F4F5` | wie primär | wie primär |
| Auf dunkel | bg #fff, Text #000 | bg zinc-200 | Outline #fff | – |
| Nav-CTA | wie primär, Höhe 36px, 13px | wie primär | wie primär | – |
