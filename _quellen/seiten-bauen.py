"""Baut alle HTML-Seiten der Website aus _quellen/seiten/*.html.

Werkzeug für die lokale Entwicklung, kein Teil der Website.
Aufruf im Projektordner:  python _quellen/seiten-bauen.py

Kopf (SEO, OG, JSON-LD), Header, Mobil-Menü und Footer kommen aus diesem Skript, damit sie
auf allen Seiten identisch sind. Die acht Leistungsseiten entstehen aus LEISTUNGEN unten.

Platzhalter in den Seiten-Dateien:
  {{R}}                      Pfad zum Projektstamm ("" oder "../")
  {{HOME}}                   Link zur Startseite
  {{ico:pfeil}}              Inline-SVG-Icon (siehe ICONS)
  {{img:name|alt|sizes}}     Bild mit srcset (Maße aus bildmasse.json); "|eager" = Hero-Bild
  {{projekte}} {{fokus}} {{ablauf}} {{ablauf3}} {{kacheln}}   wiederkehrende Blöcke
"""
import base64
import hashlib
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SEITEN = ROOT / "_quellen" / "seiten"
MASSE = json.loads((ROOT / "_quellen" / "bildmasse.json").read_text(encoding="utf-8"))
MASSE["juan"] = {"600": [600, 800], "900": [900, 1200]}
MASSE["vk-front"] = {"500": [500, 324], "1000": [1000, 648]}
MASSE["vk-back"] = {"500": [500, 324], "1000": [1000, 648]}

DOMAIN = "https://jg-solutions.eu"
TEL = "+49 176 24004201"
TEL_LINK = "tel:+4917624004201"
MAIL = "info@jg-solutions.eu"
WHATSAPP = "https://wa.me/4917624004201"
CSS_V = "9"
JS_V = "6"
# Setzt die Klasse "js" sofort im <head>, damit Animationen nicht erst sichtbar aufblitzen.
# Der Hash steht in der CSP der .htaccess (wird unten in main() automatisch eingetragen).
INLINE_JS = "document.documentElement.classList.add('js')"

ICONS = {
    "pfeil": '<path d="M5 12h14M13 6l6 6-6 6"/>',
    "zurueck": '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    "haken": '<path d="M20 6 9 17l-5-5"/>',
    "plus": '<path d="M12 5v14M5 12h14"/>',
    "extern": '<path d="M7 17 17 7M8 7h9v9"/>',
    "telefon": '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/>',
    "mail": '<rect x="2" y="4" width="20" height="16"/><path d="m22 6-10 7L2 6"/>',
    "chat": '<path d="M21 11.5a8.4 8.4 0 0 1-12.5 7.4L3 21l2.1-5.3A8.5 8.5 0 1 1 21 11.5Z"/>',
    "monitor": '<rect x="2" y="4" width="20" height="13"/><path d="M8 21h8M12 17v4"/>',
    "handy": '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
    "kalender": '<rect x="3" y="4" width="18" height="18"/><path d="M16 2v4M8 2v4M3 10h18"/>',
}


def ico(name, cls=""):
    c = f' class="{cls}"' if cls else ""
    return (f'<svg{c} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">{ICONS[name]}</svg>')


def bild_pfad(name, w, R):
    if name.startswith("ref-"):
        return f"{R}assets/referenzen/{name}-{w}.webp"
    return f"{R}assets/img/{name}-{w}.webp"


def img(name, alt, sizes, R, eager=False, cls=""):
    m = MASSE[name]
    ws = sorted(int(w) for w in m)
    srcset = ", ".join(f"{bild_pfad(name, w, R)} {w}w" for w in ws)
    mitte = next((w for w in ws if w >= 900), ws[-1])
    w, h = m[str(ws[-1])]
    lade = 'fetchpriority="high" decoding="async"' if eager else 'loading="lazy" decoding="async"'
    c = f' class="{cls}"' if cls else ""
    return (f'<img{c} src="{bild_pfad(name, mitte, R)}" srcset="{srcset}" sizes="{sizes}" '
            f'width="{w}" height="{h}" alt="{html.escape(alt, quote=True)}" {lade}>')


def preload(name, sizes, R):
    m = MASSE[name]
    ws = sorted(int(w) for w in m)
    srcset = ", ".join(f"{bild_pfad(name, w, R)} {w}w" for w in ws)
    return f'<link rel="preload" as="image" imagesrcset="{srcset}" imagesizes="{sizes}" fetchpriority="high">'


# ---------------------------------------------------------------- Inhalte

LEISTUNGEN = [
    {
        "slug": "webseiten", "name": "Webseiten", "thema": "Webseite", "quiz": "website",
        "title": "Webseiten erstellen lassen in Kürten | JG Solutions",
        "desc": "Individuelle Webseiten aus Kürten: schnell, mobil optimiert und so gebaut, dass Besucher anfragen. Für das Bergische Land und Köln. Jetzt anfragen.",
        "kurz": "Individuell gestaltete Webseiten mit modernem Design, schnellen Ladezeiten und klarer Struktur.",
        "claim": "Moderne Webseiten, die aussehen wie du und arbeiten wie ein Vertriebler.",
        "intro": "Deine Webseite ist oft der erste Eindruck. Ich baue sie individuell, schnell und so, dass aus Besuchern Anfragen werden. Kein Baukasten von der Stange.",
        "punkte": ["Individuelles Design statt Vorlage", "Schnelle Ladezeiten", "Perfekt auf Handy, Tablet und Desktop",
                   "Suchmaschinenfreundlich aufgebaut", "Kalender- und Buchungssysteme",
                   "Klickbare Telefon- und WhatsApp-Buttons", "Viele weitere Funktionen auf Anfrage"],
        "bild": "webseiten-laptop-webdesign", "alt": "Laptop mit geöffneter Webseite beim Webdesign",
    },
    {
        "slug": "shopify", "name": "Shopify Shops", "thema": "Shopify Shop", "quiz": "shopify",
        "title": "Shopify Shop erstellen lassen | JG Solutions Kürten",
        "desc": "Shopify Shops mit eigenem Theme-Design und kompletter Einrichtung: Produkte, Zahlung, Versand. Persönlich betreut aus Kürten. Jetzt kostenlos anfragen.",
        "kurz": "Professionelle Online-Shops mit individuellem Theme-Design und sauberer Einrichtung.",
        "claim": "Online-Shops, die Besucher zu Käufern machen.",
        "intro": "Vom Theme-Design bis zur fertigen Einrichtung: Ich baue deinen Shopify-Store so auf, dass deine Produkte glänzen und der Checkout reibungslos läuft.",
        "punkte": ["Individuelles Theme-Design für deine Marke", "Komplette Einrichtung: Produkte, Zahlung, Versand",
                   "Produktseiten, die zum Kauf führen", "Mobil optimiert für Verkäufe unterwegs",
                   "Anbindung von Apps und Automatisierungen"],
        "bild": "shopify-onlineshop-smartphone", "alt": "Smartphone mit geöffnetem Onlineshop in der Hand",
    },
    {
        "slug": "automatisierungen", "name": "Automatisierungen", "thema": "Automatisierung", "quiz": "ki",
        "title": "Automatisierungen für dein Business | JG Solutions",
        "desc": "Abläufe automatisieren: Tools verbinden, E-Mails, Angebote und Rechnungen laufen von selbst. Aus Kürten, für ganz Deutschland. Jetzt anfragen.",
        "kurz": "Ich verbinde deine Tools und automatisiere wiederkehrende Abläufe. So bleibt mehr Zeit fürs Wesentliche.",
        "claim": "Lass die langweiligen Aufgaben von selbst laufen.",
        "intro": "Ich verbinde deine Tools und automatisiere wiederkehrende Abläufe, damit du dich um dein Geschäft kümmerst statt um Copy & Paste.",
        "punkte": ["Wiederkehrende Aufgaben laufen von selbst", "Tools und Systeme sauber verbunden (Make)",
                   "Automatische E-Mails, Angebote und Rechnungen", "Weniger Fehler, mehr Zeit fürs Wesentliche",
                   "Individuell auf deine Abläufe zugeschnitten"],
        "bild": "automatisierungen-arbeitsplatz", "alt": "Arbeitsplatz mit Laptops und Notizen bei der Planung von Abläufen",
    },
    {
        "slug": "visitenkarten", "name": "Visitenkarten", "thema": "Visitenkarten", "quiz": "",
        "title": "Visitenkarten gestalten lassen | JG Solutions Kürten",
        "desc": "Visitenkarten, die keiner wegwirft: hochwertig gestaltet, passend zu deinem Auftritt, druckfertig und auf Wunsch fertig gedruckt geliefert. Jetzt anfragen.",
        "kurz": "Hochwertig gestaltete Visitenkarten passend zu deinem Auftritt, auf Wunsch fertig gedruckt.",
        "claim": "Der erste Eindruck zum Mitnehmen.",
        "intro": "Eine Visitenkarte, die man nicht wegwirft: hochwertig gestaltet, passend zu deinem Marken-Look und druckfertig.",
        "punkte": ["Hochwertiges, individuelles Kartendesign", "Passend zu deinem Marken-Look",
                   "Druckfertige Dateien (Vorder- und Rückseite)", "Auf Wunsch auch digitale Visitenkarte"],
        "bild": "visitenkarten-papier", "alt": "Leere weiße Visitenkarten auf hellem Untergrund",
        "extra": "visitenkarte",
    },
    {
        "slug": "seo", "name": "SEO & Sichtbarkeit", "thema": "SEO & Sichtbarkeit", "quiz": "website",
        "title": "SEO & lokale Sichtbarkeit Kürten | JG Solutions",
        "desc": "Damit dich Kunden bei Google finden: technische Optimierung, passende Inhalte und lokale Sichtbarkeit im Bergischen Land. Jetzt kostenlos anfragen.",
        "kurz": "Damit dich Kunden bei Google finden: technische Optimierung und lokale Sichtbarkeit.",
        "claim": "Damit dich Kunden finden, nicht die Konkurrenz.",
        "intro": "Ich sorge dafür, dass dein Angebot bei Google auftaucht: technisch sauber, mit den richtigen Inhalten und stark in deiner Region.",
        "punkte": ["Technische Optimierung deiner Seite", "Passende Inhalte und Suchbegriffe",
                   "Lokale Sichtbarkeit in deiner Region", "Google-Unternehmensprofil eingerichtet",
                   "Verständliche Berichte statt Fachchinesisch"],
        "bild": "seo-dashboard-laptop", "alt": "Laptop mit Auswertungs-Dashboard und Kaffeetasse",
    },
    {
        "slug": "wartung", "name": "Wartung & Support", "thema": "Sonstiges", "quiz": "",
        "title": "Website-Wartung & Support | JG Solutions Kürten",
        "desc": "Deine Website bleibt schnell, sicher und aktuell: Updates, Backups, kleine Änderungen und ein fester Ansprechpartner aus Kürten. Jetzt anfragen.",
        "kurz": "Deine Seite bleibt aktuell und sicher, mit festem Ansprechpartner.",
        "claim": "Deine Seite bleibt schnell, sicher und aktuell.",
        "intro": "Nach dem Launch ist vor dem Launch: Ich halte deine Seite aktuell, sicher und einsatzbereit, mit einem festen Ansprechpartner: mir.",
        "punkte": ["Regelmäßige Updates und Sicherheits-Checks", "Backups, damit nichts verloren geht",
                   "Kleine Änderungen und Textpflege inklusive", "Ein fester Ansprechpartner: ich",
                   "Optional als planbares Monatspaket"],
        "bild": "wartung-code-bildschirm", "alt": "Bildschirm mit Quellcode einer Website",
    },
    {
        "slug": "branding", "name": "Branding & Print", "thema": "Branding & Print", "quiz": "",
        "title": "Branding, Logo & Print-Design | JG Solutions Kürten",
        "desc": "Logo, Farben, Schriften, Flyer und Broschüren: ein stimmiger Auftritt, den man wiedererkennt. Druckfertig und auf Wunsch gedruckt. Jetzt anfragen.",
        "kurz": "Logo, Farben, Flyer und Broschüren: ein stimmiger, wiedererkennbarer Auftritt.",
        "claim": "Ein Auftritt, den man wiedererkennt.",
        "intro": "Logo, Farben, Schriften und Print: Ich gebe deiner Marke ein stimmiges Gesicht, das über alle Kanäle funktioniert.",
        "punkte": ["Logo-Design mit Wiedererkennung", "Stimmige Farben und Schriften",
                   "Visitenkarten, Flyer und Broschüren", "Einheitlicher Auftritt über alle Kanäle",
                   "Druckfertige Vorlagen"],
        "bild": "branding-designarbeitsplatz", "alt": "Design-Arbeitsplatz mit Laptop, Farbmustern und Skizzen",
        "extra": "druck",
    },
    {
        "slug": "ki", "name": "KI & Chatbots", "thema": "KI & Chatbot", "quiz": "ki",
        "title": "KI-Chatbots & Assistenten | JG Solutions Kürten",
        "desc": "KI sinnvoll eingesetzt: Chatbots, die Kundenfragen beantworten, und Assistenten, die dein Team entlasten. Datenschutzbewusst umgesetzt. Jetzt anfragen.",
        "kurz": "Chatbots und Assistenten, die Anfragen beantworten und dein Team entlasten.",
        "claim": "Smarte Helfer, die dir Arbeit abnehmen.",
        "intro": "KI sinnvoll eingesetzt: Chatbots, die Fragen beantworten, und Assistenten, die dein Team entlasten, eingebunden in deine echten Abläufe.",
        "punkte": ["Chatbots, die Kundenfragen beantworten", "Automatische Text- und Content-Erstellung",
                   "Assistenten, die dein Team entlasten", "Sinnvoll eingebunden in deine Abläufe",
                   "Datenschutzbewusst umgesetzt"],
        "bild": "ki-chatbot-smartphone", "alt": "Hände tippen eine Nachricht in einen Chat auf dem Smartphone",
    },
]

PROJEKTE = [
    {"name": "Lennerts Hausverwaltung", "art": "Webseite", "url": "https://lennerts-hausverwaltung.de",
     "domain": "lennerts-hausverwaltung.de", "bild": "ref-lennerts",
     "text": "Moderne Unternehmenswebseite für eine Hausverwaltung im Bergischen Land: klar, seriös und mobil optimiert.",
     "alt": "Startseite der Website von Lennerts Hausverwaltung"},
    {"name": "Monsieur Running", "art": "Shopify Shop", "url": "https://monsieurrunning.com",
     "domain": "monsieurrunning.com", "bild": "ref-monsieur",
     "text": "Shopify Store für eine Laufmarke, vom Theme-Design über den Aufbau bis zur Produktpräsentation.",
     "alt": "Startseite des Shopify Shops von Monsieur Running"},
    {"name": "PB Malwerk", "art": "Webseite", "url": "https://www.pb-malwerk.de",
     "domain": "pb-malwerk.de", "bild": "ref-pb-malwerk",
     "text": "Website für einen Maler- und Lackierermeisterbetrieb in Kürten: schnell, lokal sichtbar und ohne Cookie-Banner.",
     "alt": "Startseite der Website von PB Malwerk"},
]

ABLAUF = [
    ("Anfrage", "Du erzählst mir von deinem Vorhaben, kostenlos und unverbindlich. Per Telefon, Mail oder Fragebogen."),
    ("Konzept", "Ich entwickle Design und Struktur, die zu deiner Marke passen. Du gibst Feedback, bevor gebaut wird."),
    ("Umsetzung", "Ich baue alles sauber auf, du bekommst regelmäßig Einblick und kannst jederzeit mitreden."),
    ("Launch", "Wir gehen live. Auf Wunsch mit laufender Wartung und Support."),
]
ABLAUF3 = [
    ("Anfrage", "Kostenloses Erstgespräch über dein Vorhaben."),
    ("Umsetzung", "Ich baue alles auf, mit klaren Feedback-Runden."),
    ("Launch", "Fertig und live, auf Wunsch mit Support."),
]

FAQ = [
    ("Was kostet eine Webseite?", "Das hängt vom Umfang ab. Nach einem kurzen Gespräch bekommst du ein transparentes Festpreis-Angebot ohne versteckte Kosten."),
    ("Wie lange dauert die Umsetzung?", "In der Regel 2 bis 4 Wochen vom Briefing bis zum Launch. Kleinere Projekte gehen schneller, größere dauern entsprechend länger."),
    ("Kann ich die Seite später selbst pflegen?", "Ja. Auf Wunsch baue ich die Seite so, dass du Inhalte selbst ändern kannst, oder ich übernehme die Pflege im Wartungspaket."),
    ("Arbeitest du auch mit bestehenden Seiten?", "Klar. Ich kann bestehende Webseiten und Shops überarbeiten, erweitern oder komplett neu aufsetzen."),
]

# FAQ-Seite: Fragen nach Themen. Antworten nur mit echten Angaben; Unbekanntes als
# [PLATZHALTER: …] markieren (diese Fragen kommen nicht ins FAQPage-Schema).
FAQ_GRUPPEN = [
    ("Kosten & Zahlung", [
        FAQ[0],
        ("Gibt es laufende Kosten?", "Für Domain und Hosting fallen kleine laufende Kosten beim Anbieter an. Bei Shopify Shops berechnet Shopify zusätzlich eigene monatliche Gebühren. Wartung und Support sind optional und auf Wunsch als planbares Monatspaket möglich."),
        ("Wie läuft die Bezahlung?", "[PLATZHALTER: z. B. Anzahlung bei Auftrag, Rest beim Launch, Zahlung per Überweisung]"),
    ]),
    ("Ablauf & Zusammenarbeit", [
        ("Wie läuft ein Projekt ab?", "In vier Schritten: Anfrage, Konzept, Umsetzung, Launch. Das Erstgespräch ist kostenlos und unverbindlich. Bevor gebaut wird, siehst du Design und Struktur und gibst Feedback."),
        FAQ[1],
        ("Arbeitest du nur im Bergischen Land?", "Ich sitze in Kürten und arbeite viel für Unternehmen in Bergisch Gladbach, Köln und dem Rheinisch-Bergischen Kreis. Da fast alles online abgestimmt wird, betreue ich Kunden in ganz Deutschland."),
        ("Was brauchst du von mir?", "Am besten Logo, Fotos und Texte oder ein paar Stichpunkte zu deinem Angebot. Fehlt etwas, kein Problem: Wir klären im Erstgespräch, was ich übernehme."),
        ("Wie schnell meldest du dich?", "In der Regel innerhalb von 24 Stunden, per E-Mail, Telefon oder WhatsApp."),
    ]),
    ("Technik & Pflege", [
        FAQ[2],
        FAQ[3],
        ("Kümmerst du dich um Domain und Hosting?", "Ja, auf Wunsch richte ich beides für dich ein, in der Regel bei IONOS, und bringe die Seite dort online."),
        ("Was passiert nach dem Launch?", "Auf Wunsch übernehme ich Wartung und Support: regelmäßige Updates und Sicherheits-Checks, Backups und kleine Änderungen. Du hast einen festen Ansprechpartner, mich."),
        ("Druckst du Visitenkarten und Flyer selbst?", "Nein. Ich gestalte alles druckfertig und organisiere den Druck gern über eine Partner-Druckerei. Du bekommst alles fertig geliefert."),
    ]),
    ("Datenschutz & Recht", [
        ("Braucht meine Website einen Cookie-Banner?", "Meine Seiten baue ich so, dass beim Aufruf keine Cookies gesetzt und keine Daten an Dritte übertragen werden: Schriften liegen lokal, Karten oder Kalender laden erst nach Klick. Dann ist meist kein Cookie-Banner nötig. Willst du Statistik oder Werbe-Tracking, kommt ein echter Einwilligungs-Banner dazu."),
        ("Bekomme ich Impressum und Datenschutzerklärung?", "Ich erstelle Entwürfe, die zu dem passen, was deine Seite wirklich nutzt. Das ist keine Rechtsberatung: Lass die Texte vor dem Livegang von einem Anwalt oder einem Dienst wie eRecht24 prüfen."),
    ]),
]

NAV = [("Leistungen", "leistungen"), ("FAQ", "faq"), ("Projekte", "referenzen"),
       ("Über mich", "ueber-uns"), ("Kontakt", "kontakt")]


# ---------------------------------------------------------------- Bausteine

def pad(n):
    return f"{n:02d}"


def block_fokus(R, ausser=None):
    li = "".join(f'<li><a href="{R}leistungen/{l["slug"]}">{l["name"]}{ico("pfeil")}</a></li>'
                 for l in LEISTUNGEN if l["slug"] != ausser)
    return f'<ul class="focus-list">{li}</ul>'


def bild_projekt(p, sizes, R):
    """Projekt-Screenshot: Desktop 16:10, auf dem Handy (< 600 px) der Handy-Screenshot in 4:5."""
    mob = p["bild"] + "-mob"
    m = MASSE[mob]
    ws = sorted(int(w) for w in m)
    w, h = m[str(ws[-1])]
    srcset = ", ".join(f"{bild_pfad(mob, x, R)} {x}w" for x in ws)
    return (f'<picture><source media="(max-width: 599px)" srcset="{srcset}" sizes="86vw" width="{w}" height="{h}">'
            f'{img(p["bild"], p["alt"], sizes, R)}</picture>')


def block_projekte(R):
    n = len(PROJEKTE)
    li = []
    for i, p in enumerate(PROJEKTE, 1):
        li.append(
            f'<li class="slide"><a href="{p["url"]}" target="_blank" rel="noopener noreferrer">'
            f'<div class="slide-media">{bild_projekt(p, "(min-width: 900px) 46vw, 86vw", R)}</div>'
            f'<span class="slide-num">{pad(i)} / {pad(n)} · {p["art"]}</span>'
            f'<h3>{p["text"]}</h3>'
            f'<span class="slide-client">{p["name"]}<span class="sr-only"> (öffnet in neuem Tab)</span></span></a></li>')
    return "".join(li)


def block_projektliste(R):
    """Projekte-Seite: alle Projekte untereinander, Desktop abwechselnd Bild links/rechts.
    Jedes Projekt hat einen Umschalter Desktop/Handy (Handy-Ansicht im Rahmen, js/main.js)."""
    n = len(PROJEKTE)
    li = []
    for i, p in enumerate(PROJEKTE, 1):
        desktop = img(p["bild"], p["alt"], "(min-width: 900px) 56vw, 92vw", R)
        handy = img(p["bild"] + "-phone", p["alt"] + " auf dem Handy", "(min-width: 900px) 18vw, 50vw", R)
        li.append(
            f'<li class="proj reveal" data-ansicht="desktop">'
            f'<a class="proj-media" href="{p["url"]}" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true">'
            f'<span class="proj-view proj-view--desktop">{desktop}</span>'
            f'<span class="proj-view proj-view--handy"><span class="phone">{handy}</span></span></a>'
            f'<div class="proj-text"><span class="slide-num">{pad(i)} / {pad(n)} · {p["art"]}</span>'
            f'<h2>{p["name"]}</h2><p>{p["text"]}</p>'
            f'<div class="ansicht-schalter" role="group" aria-label="Ansicht {p["name"]}">'
            f'<button type="button" data-zeige="desktop" aria-pressed="true">{ico("monitor")}Desktop</button>'
            f'<button type="button" data-zeige="handy" aria-pressed="false">{ico("handy")}Handy</button></div>'
            f'<a class="link-arrow" href="{p["url"]}" target="_blank" rel="noopener noreferrer">{p["domain"]}{ico("extern")}'
            f'<span class="sr-only"> (öffnet in neuem Tab)</span></a></div></li>')
    return f'<ol class="proj-list">{"".join(li)}</ol>'


def block_ablauf(schritte, cls=""):
    li = "".join(f'<li class="step reveal"><span class="step-num">{pad(i)}</span><h3>{t}</h3><p>{d}</p></li>'
                 for i, (t, d) in enumerate(schritte, 1))
    return f'<ol class="steps{cls}">{li}</ol>'


def block_kacheln(R):
    li = []
    for i, l in enumerate(LEISTUNGEN, 1):
        li.append(
            f'<li class="tile reveal"><a href="{R}leistungen/{l["slug"]}">'
            f'<div class="tile-media">{img(l["bild"], "", "(min-width: 1200px) 23vw, (min-width: 600px) 46vw, 92vw", R)}</div>'
            f'<span class="tile-num">{pad(i)}</span><h3>{l["name"]}</h3><p>{l["kurz"]}</p>'
            f'<span class="more">Mehr erfahren{ico("pfeil")}</span></a></li>')
    return f'<ul class="tiles">{"".join(li)}</ul>'


def faq_antwort(a):
    return re.sub(r"\[PLATZHALTER: ([^\]]+)\]", lambda m: f'<span class="placeholder">[PLATZHALTER: {m.group(1)}]</span>', a)


def block_faq_seite():
    teile = []
    for i, (thema, liste) in enumerate(FAQ_GRUPPEN, 1):
        d = "".join(f'<details><summary>{q}{ico("plus")}</summary><p>{faq_antwort(a)}</p></details>' for q, a in liste)
        teile.append(f'<section class="faq-gruppe split reveal" aria-labelledby="faq-{i}"><h2 id="faq-{i}">{thema}</h2><div class="faq">{d}</div></section>')
    return "".join(teile)


def block_faq():
    d = "".join(f'<details><summary>{q}{ico("plus")}</summary><p>{a}</p></details>' for q, a in FAQ)
    return f'<div class="faq">{d}</div>'


def ersetzen(text, R, home):
    text = text.replace("{{R}}", R).replace("{{HOME}}", home)
    text = text.replace("{{fokus}}", block_fokus(R)).replace("{{projekte}}", block_projekte(R))
    text = text.replace("{{projektliste}}", block_projektliste(R))
    text = text.replace("{{ablauf}}", block_ablauf(ABLAUF)).replace("{{ablauf3}}", block_ablauf(ABLAUF3, " steps--3"))
    text = text.replace("{{kacheln}}", block_kacheln(R)).replace("{{faq}}", block_faq()).replace("{{faqseite}}", block_faq_seite())
    text = re.sub(r"\{\{ico:([a-z]+)\}\}", lambda m: ico(m.group(1)), text)

    def bild(m):
        teile = m.group(1).split("|")
        return img(teile[0], teile[1], teile[2], R, eager=len(teile) > 3 and teile[3] == "eager")
    return re.sub(r"\{\{img:([^}]+)\}\}", bild, text)


# ---------------------------------------------------------------- Rahmen

FIRMA = {
    "@type": "ProfessionalService", "@id": f"{DOMAIN}/#firma", "name": "JG Solutions",
    "alternateName": "JG Solutions – Juan Goerth",
    "description": "Webdesign, Shopify Shops, Automatisierungen und KI-Chatbots aus Kürten im Rheinisch-Bergischen Kreis.",
    "url": f"{DOMAIN}/", "logo": f"{DOMAIN}/assets/logo/logo-schwarz.png", "image": f"{DOMAIN}/assets/og-image.jpg",
    "telephone": TEL, "email": MAIL, "founder": {"@type": "Person", "name": "Juan Goerth"},
    "address": {"@type": "PostalAddress", "streetAddress": "Winterberg 33a", "postalCode": "51515",
                "addressLocality": "Kürten", "addressRegion": "Nordrhein-Westfalen", "addressCountry": "DE"},
    "geo": {"@type": "GeoCoordinates", "latitude": 51.05, "longitude": 7.27},
    "areaServed": [{"@type": "AdministrativeArea", "name": "Rheinisch-Bergischer Kreis"},
                   {"@type": "City", "name": "Kürten"}, {"@type": "City", "name": "Bergisch Gladbach"},
                   {"@type": "City", "name": "Köln"}, {"@type": "Country", "name": "Deutschland"}],
    "knowsAbout": ["Webdesign", "Shopify", "Suchmaschinenoptimierung", "Automatisierung", "KI-Chatbots", "Branding"],
}


def schema(seite):
    url = f"{DOMAIN}/{seite['pfad']}"
    graph = [FIRMA,
             {"@type": "WebSite", "@id": f"{DOMAIN}/#website", "url": f"{DOMAIN}/", "name": "JG Solutions",
              "inLanguage": "de-DE", "publisher": {"@id": f"{DOMAIN}/#firma"}},
             {"@type": "WebPage", "@id": f"{url}#seite", "url": url, "name": seite["title"],
              "description": seite["desc"], "inLanguage": "de-DE",
              "isPartOf": {"@id": f"{DOMAIN}/#website"}, "about": {"@id": f"{DOMAIN}/#firma"}}]
    if seite.get("krumen"):
        items = [{"@type": "ListItem", "position": 1, "name": "Start", "item": f"{DOMAIN}/"}]
        for i, (name, pfad) in enumerate(seite["krumen"], 2):
            items.append({"@type": "ListItem", "position": i, "name": name, "item": f"{DOMAIN}/{pfad}"})
        graph.append({"@type": "BreadcrumbList", "itemListElement": items})
    if seite.get("service"):
        l = seite["service"]
        graph.append({"@type": "Service", "name": l["name"], "description": l["intro"], "url": url,
                      "provider": {"@id": f"{DOMAIN}/#firma"},
                      "areaServed": FIRMA["areaServed"], "serviceType": l["name"]})
    if seite.get("faq"):
        fragen = [qa for _, liste in FAQ_GRUPPEN for qa in liste if "PLATZHALTER" not in qa[1]]
        graph.append({"@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in fragen]})
    return json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, separators=(",", ":"))


def kopf(seite, R):
    url = f"{DOMAIN}/{seite['pfad']}"
    t, d = html.escape(seite["title"]), html.escape(seite["desc"], quote=True)
    zeilen = [
        "<!doctype html>", '<html lang="de">', "<head>",
        '<meta charset="utf-8">', '<meta name="viewport" content="width=device-width, initial-scale=1">',
        f"<script>{INLINE_JS}</script>",
        f"<title>{t}</title>", f'<meta name="description" content="{d}">',
    ]
    if seite.get("noindex"):
        zeilen.append('<meta name="robots" content="noindex, follow">')
    if seite["datei"] != "404.html":
        zeilen.append(f'<link rel="canonical" href="{url}">')
    zeilen += [
        f'<meta property="og:title" content="{t}">', f'<meta property="og:description" content="{d}">',
        f'<meta property="og:image" content="{DOMAIN}/assets/og-image.jpg">',
        '<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">',
        f'<meta property="og:url" content="{url}">', '<meta property="og:type" content="website">',
        '<meta property="og:locale" content="de_DE">', '<meta property="og:site_name" content="JG Solutions">',
        '<meta name="twitter:card" content="summary_large_image">',
        '<meta name="theme-color" content="#ffffff">',
        f'<link rel="icon" href="{R}favicon.svg" type="image/svg+xml">',
        f'<link rel="apple-touch-icon" href="{R}apple-touch-icon.png">',
        f'<link rel="manifest" href="{R}site.webmanifest">',
        f'<link rel="preload" href="{R}assets/fonts/archivo-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>',
    ]
    if seite.get("preload"):
        zeilen.append(preload(*seite["preload"], R))
    zeilen += [f'<link rel="stylesheet" href="{R}css/style.css?v={CSS_V}">',
               f'<script type="application/ld+json">{schema(seite)}</script>', "</head>"]
    return "\n".join(zeilen)


def header(seite, R, home):
    aktiv = seite.get("nav")
    def link(name, ziel):
        href = home + ziel if ziel.startswith("#") else R + ziel
        cur = ' aria-current="page"' if ziel == aktiv else ""
        return href, cur
    nav = "".join(f'<li><a href="{h}"{c}>{n}</a></li>' for n, z in NAV for h, c in [link(n, z)])
    mob = "".join(f'<li><a class="m-link" href="{h}"{c}>{n}{ico("pfeil")}</a></li>' for n, z in NAV for h, c in [link(n, z)])
    return f"""<body>
<a class="skip-link" href="#main">Zum Inhalt springen</a>
<header class="site-header">
  <div class="header-bg" aria-hidden="true"></div>
  <div class="container header-inner">
    <a class="brand" href="{home}" aria-label="JG Solutions, zur Startseite"><img src="{R}assets/logo/logo-schwarz-114.webp" alt="" width="46" height="32"><span class="brand-name">JG Solutions</span></a>
    <nav class="nav" aria-label="Hauptnavigation"><ul class="nav-list">{nav}</ul></nav>
    <button type="button" class="btn header-cta" data-quiz-open>Kostenlose Analyse</button>
    <button type="button" class="burger" aria-expanded="false" aria-controls="mobile-menu"><span class="burger-label">Menü</span><span class="burger-lines" aria-hidden="true"></span></button>
  </div>
</header>
<div class="mobile-menu" id="mobile-menu" hidden>
  <nav aria-label="Mobile Navigation"><ul>{mob}</ul></nav>
  <div class="m-unten">
    <button type="button" class="btn btn--fill btn--block" data-quiz-open>Kostenlose Analyse starten{ico("pfeil")}</button>
    <div class="m-meta"><span>Direkt erreichen</span><a href="{TEL_LINK}">{TEL}</a><a href="mailto:{MAIL}">{MAIL}</a><a href="{WHATSAPP}" target="_blank" rel="noopener noreferrer">WhatsApp schreiben<span class="sr-only"> (öffnet in neuem Tab)</span></a></div>
  </div>
</div>
"""


def footer(R, home):
    leist = "".join(f'<li><a href="{R}leistungen/{l["slug"]}">{l["name"]}</a></li>' for l in LEISTUNGEN)
    return f"""<footer class="site-footer on-dark">
  <div class="container">
    <div class="footer-cta">
      <div>
        <h2>Bereit für einen Auftritt, der auffällt?</h2>
        <p>Beantworte ein paar kurze Fragen oder buch dir direkt einen Termin. Ich melde mich innerhalb von 24 Stunden mit einer ersten Einschätzung.</p>
        <div class="btn-row">
          <button type="button" class="btn btn--accent" data-quiz-open>Kostenlose Analyse{ico("pfeil")}</button>
          <a class="btn btn--light" href="{R}kontakt#termin">Termin buchen{ico("kalender")}</a>
          <a class="btn btn--light" href="{WHATSAPP}" target="_blank" rel="noopener noreferrer">WhatsApp{ico("chat")}<span class="sr-only"> (öffnet in neuem Tab)</span></a>
        </div>
      </div>
    </div>
    <div class="footer-grid">
      <div class="footer-brand"><img src="{R}assets/logo/logo-weiss-114.webp" alt="" width="57" height="40" loading="lazy" decoding="async"><p>Webseiten, Shopify Shops und Automatisierungen aus Kürten, für Unternehmen, die digital überzeugen wollen.</p></div>
      <div><h2>Navigation</h2><ul><li><a href="{home}">Start</a></li><li><a href="{R}leistungen">Leistungen</a></li><li><a href="{R}referenzen">Projekte</a></li><li><a href="{R}faq">FAQ</a></li><li><a href="{R}ueber-uns">Über mich</a></li><li><a href="{R}kontakt">Kontakt</a></li></ul></div>
      <div><h2>Leistungen</h2><ul>{leist}</ul></div>
      <div><h2>Kontakt</h2><address>JG Solutions<br>Juan Goerth<br>Winterberg 33a<br>51515 Kürten</address><ul><li><a href="{TEL_LINK}">{TEL}</a></li><li><a href="mailto:{MAIL}">{MAIL}</a></li></ul></div>
    </div>
    <div class="footer-bottom"><span>&copy; <span data-year>2026</span> JG Solutions · Juan Goerth</span><ul><li><a href="{R}impressum">Impressum</a></li><li><a href="{R}datenschutz">Datenschutz</a></li></ul></div>
  </div>
</footer>
"""


def krumen_html(seite, R, home):
    if not seite.get("krumen"):
        return ""
    teile = [f'<li><a href="{home}">Start</a></li>']
    for i, (name, pfad) in enumerate(seite["krumen"]):
        if i == len(seite["krumen"]) - 1:
            teile.append(f'<li aria-current="page">{name}</li>')
        else:
            teile.append(f'<li><a href="{R}{pfad}">{name}</a></li>')
    return f'<nav class="breadcrumb" aria-label="Brotkrumen"><ol>{"".join(teile)}</ol></nav>'


def seite_schreiben(seite, inhalt):
    tiefe = seite["datei"].count("/")
    R = "/" if seite["datei"] == "404.html" else "../" * tiefe
    home = R or "./"
    inhalt = inhalt.replace("{{krumen}}", krumen_html(seite, R, home))
    inhalt = ersetzen(inhalt, R, home)
    skripte = f'<script src="{R}js/main.js?v={JS_V}" data-root="{R}" defer></script>'
    if seite.get("quiz_direkt"):
        skripte += f'\n<script src="{R}js/quiz.js?v={JS_V}" data-root="{R}" defer></script>'
    doc = "\n".join([kopf(seite, R), header(seite, R, home), '<main id="main">', inhalt.strip(), "</main>",
                     footer(R, home), skripte, "</body>", "</html>", ""])
    ziel = ROOT / seite["datei"]
    ziel.parent.mkdir(parents=True, exist_ok=True)
    ziel.write_text(doc, encoding="utf-8", newline="\n")
    print(f"{seite['datei']:32} {len(doc.encode()) // 1024} KB")


# ---------------------------------------------------------------- Leistungsseiten

def leistung_inhalt(l, nr):
    knopf = f'data-quiz-open="{l["quiz"]}"' if l["quiz"] else "data-quiz-open"
    punkte = "".join(f"<li>{{{{ico:haken}}}}{p}</li>" for p in l["punkte"])
    extra = ""
    if l.get("extra") == "visitenkarte":
        extra = """
<section class="section" aria-labelledby="vk-titel">
  <div class="container split">
    <div class="split-head reveal"><span class="eyebrow">3D-Vorschau</span><h2 id="vk-titel">Meine eigene Visitenkarte.</h2><p class="lead">So sieht meine eigene Visitenkarte aus. Beweg sie mit der Maus und dreh sie per Klick um, auf der Rückseite sitzt ein QR-Code. Genau so lebendig präsentiere ich auch deine.</p></div>
    <div class="reveal"><div class="vk-stage"><button type="button" class="vk-card" data-vk aria-pressed="false" aria-label="Visitenkarte umdrehen"><span class="vk-face"><img src="{{R}}assets/img/vk-front-1000.webp" srcset="{{R}}assets/img/vk-front-500.webp 500w, {{R}}assets/img/vk-front-1000.webp 1000w" sizes="(min-width: 900px) 460px, 90vw" width="1000" height="648" alt="Visitenkarte von JG Solutions, Vorderseite mit Logo" loading="lazy" decoding="async"></span><span class="vk-face vk-face--back"><img src="{{R}}assets/img/vk-back-1000.webp" srcset="{{R}}assets/img/vk-back-500.webp 500w, {{R}}assets/img/vk-back-1000.webp 1000w" sizes="(min-width: 900px) 460px, 90vw" width="1000" height="648" alt="Visitenkarte von JG Solutions, Rückseite mit Kontaktdaten und QR-Code" loading="lazy" decoding="async"></span></button></div><p class="vk-hint">Bewege die Maus über die Karte · <b>Klick, Tippen oder Enter</b> zum Umdrehen</p></div>
  </div>
</section>"""
    if l.get("extra") in ("visitenkarte", "druck"):
        extra += """
<section class="section section--soft" aria-labelledby="druck-titel">
  <div class="container split">
    <div class="split-head reveal"><h2 id="druck-titel">Drucken lassen? Machen wir.</h2></div>
    <div class="split-body reveal"><p>Ich gestalte alles druckfertig, auf Wunsch auf verschiedenen Materialien: matt, glänzend, Recyclingpapier oder edel strukturiert.</p><p class="muted">Selbst drucke ich nicht. Den Druck organisiere ich aber gern für dich über eine Partner-Druckerei, du bekommst alles fertig geliefert.</p></div>
  </div>
</section>"""
    return f"""
<section class="page-hero">
  <div class="container">
    {{{{krumen}}}}
    <span class="eyebrow">Leistung {pad(nr)} / {pad(len(LEISTUNGEN))}</span>
    <h1>{l["name"]}</h1>
    <p class="lead">{l["claim"]}</p>
    <div class="btn-row">
      <button type="button" class="btn btn--fill" {knopf}>Projekt starten{{{{ico:pfeil}}}}</button>
      <a class="btn" href="{{{{R}}}}leistungen">Alle Leistungen{{{{ico:pfeil}}}}</a>
    </div>
  </div>
</section>
<div class="container"><div class="media-wide">{{{{img:{l["bild"]}|{l["alt"]}|(min-width: 1440px) 1280px, 92vw|eager}}}}</div></div>

<section class="section" aria-labelledby="drin-titel">
  <div class="container split">
    <div class="split-head reveal"><h2 id="drin-titel">Das steckt drin.</h2><p class="lead">{l["intro"]}</p></div>
    <div class="split-body reveal"><ul class="checklist">{punkte}</ul></div>
  </div>
</section>
{extra}
<section class="section" aria-labelledby="ablauf-titel">
  <div class="container">
    <h2 id="ablauf-titel" class="reveal">So läuft's.</h2>
    {{{{ablauf3}}}}
  </div>
</section>

<section class="section section--accent" aria-labelledby="mehr-titel">
  <div class="container split">
    <div class="split-head"><h2 id="mehr-titel">Weitere Leistungen.</h2><a class="link-arrow" href="{{{{R}}}}referenzen">Projekte ansehen{{{{ico:pfeil}}}}</a></div>
    <div class="split-body"><p>Vieles greift ineinander. Hier findest du, was sonst noch dazugehört.</p>{block_fokus("{{R}}", ausser=l["slug"])}</div>
  </div>
</section>
"""


# ---------------------------------------------------------------- Seitenliste

SEITEN_LISTE = [
    {"datei": "index.html", "pfad": "", "quelle": "index.html", "nav": None,
     "title": "Webdesign Kürten & Bergisch Gladbach | JG Solutions",
     "desc": "Webdesign aus Kürten für den Rheinisch-Bergischen Kreis und Köln: Webseiten, Shopify Shops und KI-Automatisierung. Jetzt kostenlos anfragen.",
     "preload": ("hero-architektur-schwarz-weiss", "(min-width: 1440px) 1280px, 92vw")},
    {"datei": "leistungen.html", "pfad": "leistungen", "quelle": "leistungen.html", "nav": "leistungen",
     "title": "Leistungen: Webseiten, Shops & KI | JG Solutions",
     "desc": "Webseiten, Shopify Shops, Automatisierungen, SEO, Branding und KI-Chatbots aus einer Hand. Persönlich betreut aus Kürten. Alle Leistungen im Überblick.",
     "krumen": [("Leistungen", "leistungen")]},
    {"datei": "referenzen.html", "pfad": "referenzen", "quelle": "referenzen.html", "nav": "referenzen",
     "title": "Projekte & Referenzen | JG Solutions Kürten",
     "desc": "Ausgewählte Projekte von JG Solutions: Webseiten und Shopify Shops für Unternehmen aus dem Bergischen Land und darüber hinaus. Sieh dir die Arbeiten an.",
     "krumen": [("Projekte", "referenzen")]},
    {"datei": "ueber-uns.html", "pfad": "ueber-uns", "quelle": "ueber-uns.html", "nav": "ueber-uns",
     "title": "Über mich: Juan Goerth | JG Solutions Kürten",
     "desc": "Juan Goerth, Gründer von JG Solutions aus Kürten: Webseiten, Shops und Automatisierungen mit festem Ansprechpartner. Lern mich kennen.",
     "krumen": [("Über mich", "ueber-uns")]},
    {"datei": "kontakt.html", "pfad": "kontakt", "quelle": "kontakt.html", "nav": "kontakt", "quiz_direkt": True,
     "title": "Kontakt & Termin | JG Solutions Kürten",
     "desc": "Schreib mir, ruf an oder buch dir direkt ein kostenloses Erstgespräch. Ich melde mich innerhalb von 24 Stunden mit einer ersten Einschätzung.",
     "krumen": [("Kontakt", "kontakt")]},
    {"datei": "faq.html", "pfad": "faq", "quelle": "faq.html", "nav": "faq", "faq": True,
     "title": "FAQ: Häufige Fragen zu Webseiten | JG Solutions",
     "desc": "Antworten zu Kosten, Ablauf, Dauer, Hosting, Pflege und Datenschutz deiner Website oder deines Shops. Deine Frage fehlt? Schreib mir einfach direkt.",
     "krumen": [("FAQ", "faq")]},
    {"datei": "impressum.html", "pfad": "impressum", "quelle": "impressum.html", "noindex": True,
     "title": "Impressum | JG Solutions",
     "desc": "Impressum und Anbieterkennzeichnung von JG Solutions, Inhaber Juan Goerth, Winterberg 33a, 51515 Kürten. Kontakt per E-Mail und Telefon.",
     "krumen": [("Impressum", "impressum")]},
    {"datei": "datenschutz.html", "pfad": "datenschutz", "quelle": "datenschutz.html", "noindex": True,
     "title": "Datenschutz | JG Solutions",
     "desc": "Datenschutzerklärung von JG Solutions: welche Daten beim Besuch dieser Website verarbeitet werden, welche Dienste genutzt werden und welche Rechte du hast.",
     "krumen": [("Datenschutz", "datenschutz")]},
    {"datei": "danke.html", "pfad": "danke", "quelle": "danke.html", "noindex": True,
     "title": "Danke für deine Anfrage | JG Solutions",
     "desc": "Danke für deine Anfrage bei JG Solutions. Ich melde mich innerhalb von 24 Stunden bei dir mit einer ersten Einschätzung und dem nächsten Schritt."},
    {"datei": "404.html", "pfad": "404", "quelle": "404.html", "noindex": True,
     "title": "Seite nicht gefunden | JG Solutions",
     "desc": "Diese Seite gibt es leider nicht. Über die Startseite, die Leistungen oder den Kontakt findest du schnell zum Ziel. JG Solutions, Webdesign aus Kürten."},
]


def main():
    for seite in SEITEN_LISTE:
        seite_schreiben(seite, (SEITEN / seite["quelle"]).read_text(encoding="utf-8"))
    for nr, l in enumerate(LEISTUNGEN, 1):
        seite = {"datei": f"leistungen/{l['slug']}.html", "pfad": f"leistungen/{l['slug']}", "nav": "leistungen",
                 "title": l["title"], "desc": l["desc"], "service": l,
                 "krumen": [("Leistungen", "leistungen"), (l["name"], f"leistungen/{l['slug']}")],
                 "preload": (l["bild"], "(min-width: 1440px) 1280px, 92vw")}
        seite_schreiben(seite, leistung_inhalt(l, nr))

    # CSP-Hash für das Inline-Skript im <head> in die .htaccess eintragen
    sha = "sha256-" + base64.b64encode(hashlib.sha256(INLINE_JS.encode()).digest()).decode()
    ht = ROOT / ".htaccess"
    t = ht.read_text(encoding="utf-8")
    t = re.sub(r"script-src 'self'( 'sha256-[^']+')?", f"script-src 'self' '{sha}'", t)
    ht.write_text(t, encoding="utf-8", newline="\n")

    # Sitemap: nur indexierbare Seiten
    urls = [s["pfad"] for s in SEITEN_LISTE if not s.get("noindex")] + [f"leistungen/{l['slug']}" for l in LEISTUNGEN]
    eintraege = "".join(f"  <url><loc>{DOMAIN}/{u}</loc></url>\n" for u in urls)
    (ROOT / "sitemap.xml").write_text(
        f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{eintraege}</urlset>\n',
        encoding="utf-8", newline="\n")
    for s in SEITEN_LISTE + [{"title": l["title"], "desc": l["desc"], "datei": l["slug"]} for l in LEISTUNGEN]:
        if len(s["title"]) > 60 or not 120 <= len(s["desc"]) <= 155:
            print(f"  ! Länge prüfen: {s['datei']}  title={len(s['title'])}  desc={len(s['desc'])}")


if __name__ == "__main__":
    main()
