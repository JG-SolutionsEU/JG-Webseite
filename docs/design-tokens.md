# Design-Tokens – JG Solutions (JL-Stil)

**System:** Tailwind CSS Standard-Theme (Zinc-Palette, 0.25rem-Raster), weil die Vorlage jlconsulting.ch genau darauf aufbaut.
**Quellen:** (1) Live-Messung der berechneten Styles von https://jlconsulting.ch/ am 2026-10-30 · (2) Tailwind-CSS-Farbpalette „zinc“ (tailwindcss.com/docs/colors).
Single Source of Truth für `css/style.css`.

## Farben (seit 2026-11-02: Markenfarben von jg-solutions.eu)
Layout und Typografie bleiben im JL-Stil, die Farben kommen von der bisherigen Seite (gemessen auf https://jg-solutions.eu/ am 2026-11-02).
| Token | Wert | Quelle / Einsatz |
|---|---|---|
| `--c-brand` | `#2E90FF` | Logo-Blau – Logo, Icon-Kacheln, Häkchen, Deutschland auf der Kugel. Nur für Grafik, kein kleiner Text darauf (3,2:1). |
| `--c-accent` | `#1767D0` | blue-600 – Buttons, Links, Fokus. Weißer Text darauf 5,4:1 (AA). |
| `--c-hover` | `#145FC0` | blue-700 – Hover der Buttons |
| `--c-navy` | `#0A1B33` | Navy – dunkle Sektionen |
| `--c-black` | `#081222` | Heading-Navy – Footer, dunkelster Ton |
| `--c-ink` | `#081222` | Überschriften |
| `--c-text` | `#0E1B2E` | Body-Text |
| `--c-muted` | `#57677E` | Fließtext/Lead |
| `--c-subtle` | `#5F6E83` | Meta-Text (kontraststark) |
| `--c-dots` | `#A9BBD1` | Rahmen bei Hover, helle Punkte |
| `--c-line` | `#E3EBF4` | Rahmen, Trennlinien |
| `--c-fill` | `#EAF1F9` | aktiver Nav-Link, Felder |
| `--c-bg` | `#F4F8FD` | Seitenhintergrund (Surface) |
| `--c-white` | `#FFFFFF` | Karten, Header |
| `--c-on-dark` | `#A9BBD1` | Text auf Navy |
| `--c-dark-line` | `#1D3354` | Rahmen auf Navy |

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
| Primär | bg `#1767D0`, Text #fff, Höhe 48px, Padding 0 24px, 14px/600, Pille | bg `#145FC0` | 2px Outline `#1767D0`, Abstand 2px | Deckkraft .5, cursor not-allowed |
| Sekundär | bg #fff, Text und 1px Rand `#1767D0` | bg `#EAF1F9` | wie primär | wie primär |
| Auf dunkel | bg #fff, Text `#145FC0` | bg zinc-200 | Outline #fff | – |
| Nav-CTA | wie primär, Höhe 36px, 13px | wie primär | wie primär | – |
