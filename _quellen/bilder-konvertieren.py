"""Wandelt die Pixabay-Originale aus _quellen/pixabay/ in WebP (480/960/1280 px) um,
färbt das JG-Logo einfarbig (schwarz/weiß) und erzeugt das OG-Bild (1200x630).

Werkzeug für die lokale Entwicklung, kein Teil der Website.
Aufruf im Projektordner:  python _quellen/bilder-konvertieren.py
Schreibt die Maße nach _quellen/bildmasse.json (für width/height im HTML).
"""
import json
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "_quellen" / "pixabay"
OUT = ROOT / "assets" / "img"
WIDTHS = (480, 960, 1280)
QUALITY = 74
SCHWARZWEISS = {"hero-architektur-schwarz-weiss", "glasarchitektur-perspektive", "glasfassade-linien"}

OUT.mkdir(parents=True, exist_ok=True)
masse = {}

for src in sorted(SRC.glob("*.jpg")):
    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im).convert("RGB")
        if src.stem in SCHWARZWEISS:
            im = ImageOps.grayscale(im).convert("RGB")
        masse[src.stem] = {}
        for w in sorted({min(w, im.width) for w in WIDTHS}):
            h = round(im.height * w / im.width)
            ziel = OUT / f"{src.stem}-{w}.webp"
            im.resize((w, h), Image.LANCZOS).save(ziel, "WEBP", quality=QUALITY, method=6)
            masse[src.stem][w] = [w, h]
            print(f"{ziel.name:50} {w}x{h}  {ziel.stat().st_size // 1024} KB")

# Referenzen: echte Screenshots der Kundenseiten (aus "JG marketing"), liegen in _quellen/referenzen/
#   Desktop: 16:10 (1280/640 px)   Handy: 4:5 vom oberen Seitenrand (780/480 px)
REF = ROOT / "assets" / "referenzen"
QUELLE_REF = ROOT / "_quellen" / "referenzen"
for name in ("lennerts", "monsieur", "pb-malwerk"):
    with Image.open(QUELLE_REF / f"{name}-desk.png") as im:
        im = ImageOps.fit(im.convert("RGB"), (1440, 900), Image.LANCZOS, centering=(0.5, 0))
        masse["ref-" + name] = {}
        for w in (640, 1280):
            h = w * 10 // 16
            ziel = REF / f"ref-{name}-{w}.webp"
            im.resize((w, h), Image.LANCZOS).save(ziel, "WEBP", quality=78, method=6)
            masse["ref-" + name][w] = [w, h]
            print(f"{ziel.name:50} {w}x{h}  {ziel.stat().st_size // 1024} KB")
    with Image.open(QUELLE_REF / f"{name}-mob.png") as im:
        im = im.convert("RGB")
        im = im.crop((0, 0, im.width, im.width * 5 // 4))
        masse[f"ref-{name}-mob"] = {}
        for w in (480, 780):
            h = w * 5 // 4
            ziel = REF / f"ref-{name}-mob-{w}.webp"
            im.resize((w, h), Image.LANCZOS).save(ziel, "WEBP", quality=78, method=6)
            masse[f"ref-{name}-mob"][w] = [w, h]
            print(f"{ziel.name:50} {w}x{h}  {ziel.stat().st_size // 1024} KB")
    # Ganzer Handy-Bildschirm (780 x 1688) für den Handy-Rahmen im Desktop/Handy-Umschalter
    with Image.open(QUELLE_REF / f"{name}-mob.png") as im:
        im = im.convert("RGB")
        masse[f"ref-{name}-phone"] = {}
        for w in (390, 780):
            h = round(im.height * w / im.width)
            ziel = REF / f"ref-{name}-phone-{w}.webp"
            im.resize((w, h), Image.LANCZOS).save(ziel, "WEBP", quality=78, method=6)
            masse[f"ref-{name}-phone"][w] = [w, h]
            print(f"{ziel.name:50} {w}x{h}  {ziel.stat().st_size // 1024} KB")

# Logo einfarbig: Alphakanal behalten, Farbe ersetzen
LOGO = ROOT / "assets" / "logo"
with Image.open(LOGO / "logo.png") as im:
    alpha = im.convert("RGBA").getchannel("A")
    for name, farbe in (("schwarz", (23, 23, 23)), ("weiss", (255, 255, 255))):
        mono = Image.new("RGBA", im.size, farbe + (255,))
        mono.putalpha(alpha)
        mono.save(LOGO / f"logo-{name}.png")
        mono.resize((114, 80), Image.LANCZOS).save(LOGO / f"logo-{name}-114.webp", "WEBP", quality=90, method=6)
    schwarz = Image.new("RGBA", im.size, (23, 23, 23, 255)); schwarz.putalpha(alpha)

# OG-Bild 1200x630: Hero-Architektur, weißes Logo
with Image.open(SRC / "hero-architektur-schwarz-weiss.jpg") as im:
    og = ImageOps.fit(ImageOps.grayscale(im).convert("RGB"), (1200, 630), Image.LANCZOS)
    og = Image.blend(og, Image.new("RGB", og.size, (10, 10, 10)), 0.35)
    weiss = Image.open(LOGO / "logo-weiss.png").convert("RGBA")
    og.paste(weiss, (80, 630 - 80 - weiss.height), weiss)
    og.save(ROOT / "assets" / "og-image.jpg", quality=82, optimize=True)

(ROOT / "_quellen" / "bildmasse.json").write_text(json.dumps(masse, indent=2), encoding="utf-8")
