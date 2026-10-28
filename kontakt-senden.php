<?php
/**
 * Kontaktformular-Versand per PHP – Vorlage JG Solutions (läuft auf jedem Webspace mit PHP 8)
 *
 * So funktioniert es:
 *   Browser  --POST-->  kontakt-senden.php (auf DEINEM Webspace)  --mail()-->  Postfach EMPFAENGER
 *   Es ist kein Drittanbieter beteiligt, nichts wird gespeichert (keine Datenbank, keine Datei).
 *
 * Für einen neuen Kunden nur den Block EINSTELLUNGEN anpassen:
 *   1. EMPFAENGER / ABSENDER / ABSENDER_NAME / BETREFF
 *   2. $FELDER = die name-Attribute der Felder im HTML-Formular
 *   3. $TEXTE = Anrede (du/Sie) und Telefonnummer für den Notfall-Hinweis
 *   4. DANKE_SEITE / KONTAKT_SEITE (mit .html, wenn die Seite keine sauberen URLs hat)
 *
 * Sicherheit:
 *   - nur POST, nur Anfragen von der eigenen Domain (Origin-Prüfung)
 *   - Honeypot-Feld + Mindest-Ausfüllzeit (Feld "ts", setzt js/main.js)
 *   - feste Empfängeradresse, Schutz gegen Header-Injection, Längenbegrenzung aller Felder
 *   - Antwort als JSON (fetch) oder – ohne JavaScript – Weiterleitung auf die Danke-Seite
 */

declare(strict_types=1);

// ============================ EINSTELLUNGEN =================================
const EMPFAENGER    = 'info@jg-solutions.eu';
// Absender MUSS eine Adresse der eigenen Domain sein (sonst landet die Mail im Spam
// oder IONOS verschickt sie gar nicht). Am besten ein echtes Postfach.
const ABSENDER      = 'info@jg-solutions.eu';
const ABSENDER_NAME = 'Website jg-solutions.eu';
const BETREFF       = 'Neue Anfrage über jg-solutions.eu';
const DANKE_SEITE   = 'danke';               // ohne saubere URLs: 'danke.html'
const KONTAKT_SEITE = 'kontakt';             // ohne saubere URLs: 'kontakt.html'
const MIN_SEKUNDEN  = 3;                     // schneller ausgefüllt = Bot
const HONEYPOT      = 'botcheck';            // unsichtbares Feld, Menschen lassen es leer
const EINWILLIGUNG  = 'datenschutz';         // Checkbox-Name, Pflicht

// name-Attribut im HTML => Regeln
//   typ:     text | email | tel | auswahl | mehrzeilig
//   pflicht: muss ausgefüllt sein   max: maximale Zeichen   min: Mindestlänge
//   erlaubt: nur bei typ "auswahl" – exakt die <option>-Texte aus dem HTML
$FELDER = [
    'name'    => ['label' => 'Name',      'typ' => 'text',       'pflicht' => true,  'max' => 100, 'min' => 2],
    'email'   => ['label' => 'E-Mail',    'typ' => 'email',      'pflicht' => true,  'max' => 150],
    'phone'   => ['label' => 'Telefon',   'typ' => 'tel',        'pflicht' => false, 'max' => 40],
    'topic'   => ['label' => 'Thema',     'typ' => 'auswahl',    'pflicht' => false, 'max' => 60,
                  'erlaubt' => ['Webseite', 'Shopify Shop', 'Automatisierung', 'Visitenkarten',
                                'SEO & Sichtbarkeit', 'Branding & Print', 'KI & Chatbot', 'Sonstiges']],
    'message' => ['label' => 'Nachricht', 'typ' => 'mehrzeilig', 'pflicht' => true,  'max' => 5000, 'min' => 10],
];

$TEXTE = [
    'ok'           => 'Danke! Deine Anfrage ist angekommen.',
    'pflicht'      => 'Bitte fülle das Feld „%s“ aus.',
    'ungueltig'    => 'Bitte prüfe das Feld „%s“.',
    'einwilligung' => 'Bitte stimme der Verarbeitung deiner Angaben zu.',
    'zu_schnell'   => 'Das ging sehr schnell. Bitte prüfe deine Angaben und sende noch einmal.',
    'fehler'       => 'Die Anfrage konnte gerade nicht gesendet werden. Bitte schreib direkt an info@jg-solutions.eu oder ruf an: +49 176 24004201.',
    'methode'      => 'Ungültige Anfrage.',
    'seite_titel'  => 'Anfrage nicht gesendet | JG Solutions',
    'zurueck'      => 'Zurück zum Formular',
];
// ========================== ENDE EINSTELLUNGEN ==============================

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

$wantsJson = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');

function antwort(bool $ok, string $message, int $status): void
{
    global $wantsJson, $TEXTE;
    http_response_code($status);
    if ($wantsJson) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'message' => $message], JSON_UNESCAPED_UNICODE);
        exit;
    }
    if ($ok) {
        header('Location: ' . DANKE_SEITE, true, 303);
        exit;
    }
    // Ohne JavaScript: schlichte Fehlerseite im Design der Website
    header('Content-Type: text/html; charset=utf-8');
    $msg    = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
    $titel  = htmlspecialchars($TEXTE['seite_titel'], ENT_QUOTES, 'UTF-8');
    $zurueck = htmlspecialchars($TEXTE['zurueck'], ENT_QUOTES, 'UTF-8');
    $kontakt = htmlspecialchars(KONTAKT_SEITE, ENT_QUOTES, 'UTF-8');
    echo <<<HTML
<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>{$titel}</title><link rel="stylesheet" href="css/style.css"></head>
<body><main class="section"><div class="container"><h1>Anfrage nicht gesendet</h1><p>{$msg}</p>
<p><a class="btn btn-primary" href="{$kontakt}">{$zurueck}</a></p></div></main></body></html>
HTML;
    exit;
}

function einzeilig(string $wert): bool
{
    return !preg_match('/[\r\n]/', $wert);
}

// ---- Nur POST ---------------------------------------------------------------
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    antwort(false, $TEXTE['methode'], 405);
}

// ---- Nur von der eigenen Domain (verhindert Missbrauch von fremden Seiten aus) ----
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && $origin !== 'null') {
    $originHost = strtolower((string)parse_url($origin, PHP_URL_HOST));
    $eigenerHost = strtolower(preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? ''));
    if ($originHost !== $eigenerHost) {
        antwort(false, $TEXTE['methode'], 403);
    }
}

// ---- Spamschutz -------------------------------------------------------------
if (($_POST[HONEYPOT] ?? '') !== '') {
    // Honeypot gefüllt: so tun, als sei alles gut (Bots bekommen kein Feedback)
    antwort(true, $TEXTE['ok'], 200);
}
$ts = (int)($_POST['ts'] ?? 0);
if ($ts > 0 && (time() * 1000 - $ts) < MIN_SEKUNDEN * 1000) {
    antwort(false, $TEXTE['zu_schnell'], 400);
}

// ---- Felder einlesen und prüfen ---------------------------------------------
$werte = [];
foreach ($FELDER as $name => $regel) {
    $wert = trim((string)($_POST[$name] ?? ''));
    // Steuerzeichen entfernen (Zeilenumbrüche/Tabs bleiben, werden unten geprüft)
    $wert = preg_replace('/[^\P{C}\n\r\t]/u', '', $wert) ?? '';
    $wert = mb_substr($wert, 0, $regel['max'], 'UTF-8');
    $label = $regel['label'];

    if ($wert === '') {
        if ($regel['pflicht']) {
            antwort(false, sprintf($TEXTE['pflicht'], $label), 422);
        }
        $werte[$name] = '';
        continue;
    }

    $gueltig = match ($regel['typ']) {
        'email'      => einzeilig($wert) && filter_var($wert, FILTER_VALIDATE_EMAIL) !== false,
        'tel'        => (bool)preg_match('/^[0-9+()\/ \-]{6,40}$/', $wert),
        'auswahl'    => in_array($wert, $regel['erlaubt'], true),
        'mehrzeilig' => true,
        default      => einzeilig($wert),
    };
    if ($gueltig && isset($regel['min'])) {
        $gueltig = mb_strlen($wert, 'UTF-8') >= $regel['min'];
    }
    if (!$gueltig) {
        antwort(false, sprintf($TEXTE['ungueltig'], $label), 422);
    }
    $werte[$name] = $wert;
}

if (($_POST[EINWILLIGUNG] ?? '') === '') {
    antwort(false, $TEXTE['einwilligung'], 422);
}

// ---- E-Mail zusammenbauen ---------------------------------------------------
$breite = max(array_map(fn ($r) => mb_strlen($r['label'], 'UTF-8'), $FELDER)) + 2;
$zeilen = ['Neue Anfrage über das Kontaktformular', str_repeat('=', 40)];
$lang = [];
foreach ($FELDER as $name => $regel) {
    if ($regel['typ'] === 'mehrzeilig') {
        $lang[] = '';
        $lang[] = $regel['label'] . ':';
        $lang[] = $werte[$name] !== '' ? $werte[$name] : '-';
        continue;
    }
    $beschriftung = $regel['label'] . ':';
    $zeilen[] = $beschriftung . str_repeat(' ', max(1, $breite - mb_strlen($beschriftung, 'UTF-8')))
              . ($werte[$name] !== '' ? $werte[$name] : '-');
}
$zeilen = array_merge($zeilen, $lang, [
    '',
    str_repeat('-', 40),
    'Gesendet am ' . date('d.m.Y \u\m H:i') . ' Uhr über ' . ($_SERVER['HTTP_HOST'] ?? 'die Website') . '.',
    'Datenschutzhinweis bestätigt. Auf diese Mail antworten = Antwort an den Absender.',
]);
$text = implode("\r\n", $zeilen);

// Betreff um das Thema ergänzen (erstes Auswahlfeld), z. B. "… : Webseite"
$betreff = BETREFF;
foreach ($FELDER as $name => $regel) {
    if ($regel['typ'] === 'auswahl' && $werte[$name] !== '') {
        $betreff .= ': ' . $werte[$name];
        break;
    }
}

$headers = [
    'From'                      => mb_encode_mimeheader(ABSENDER_NAME, 'UTF-8', 'Q') . ' <' . ABSENDER . '>',
    'MIME-Version'              => '1.0',
    'Content-Type'              => 'text/plain; charset=UTF-8',
    'Content-Transfer-Encoding' => '8bit',
    'X-Mailer'                  => 'JG Solutions Kontaktformular',
];
// Reply-To = Kunde, damit "Antworten" im Mailprogramm direkt an ihn geht
foreach ($FELDER as $name => $regel) {
    if ($regel['typ'] === 'email' && $werte[$name] !== '') {
        $anzeigename = $werte['name'] ?? '';
        $headers['Reply-To'] = ($anzeigename !== '' ? mb_encode_mimeheader($anzeigename, 'UTF-8', 'Q') . ' ' : '')
                             . '<' . $werte[$name] . '>';
        break;
    }
}

$ok = mail(
    EMPFAENGER,
    mb_encode_mimeheader($betreff, 'UTF-8', 'Q'),
    $text,
    $headers,
    '-f' . ABSENDER
);

if (!$ok) {
    error_log('Kontaktformular: mail() fehlgeschlagen'); // ohne personenbezogene Daten
    antwort(false, $TEXTE['fehler'], 500);
}

antwort(true, $TEXTE['ok'], 200);
