"""Lokaler Testserver wie auf IONOS: gzip, saubere URLs (/kontakt -> kontakt.html), 404-Seite,
Content-Security-Policy aus der .htaccess. Nicht hochladen, nur zum Testen.
Aufruf: python -I _werkzeuge/testserver.py "JG Webseite JL-Stil" 8770"""
import gzip, sys, mimetypes
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(sys.argv[1]).resolve()
PORT = int(sys.argv[2])
import re as _re
_ht = (ROOT / ".htaccess").read_text(encoding="utf-8") if (ROOT / ".htaccess").exists() else ""
_csps = _re.findall(r'Header always set Content-Security-Policy "([^"]+)"', _ht)
CSP = _csps[0] if _csps else None
CSP_PB = _csps[1] if len(_csps) > 1 else None
TEXT = ("text/", "application/javascript", "application/json", "image/svg+xml", "application/geo+json")
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("application/json", ".geojson")


class H(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def resolve(self):
        path = unquote(urlsplit(self.path).path).lstrip("/")
        p = (ROOT / path).resolve()
        if not str(p).startswith(str(ROOT)):
            return None
        if p.is_dir() and (p / "index.html").exists() and (path == "" or path.endswith("/")):
            return p / "index.html"
        if p.is_file():
            return p
        if Path(str(p) + ".html").is_file():
            return Path(str(p) + ".html")
        return None

    def do_GET(self):
        f = self.resolve()
        status = 200
        if not f:
            f = ROOT / "404.html"; status = 404
        data = f.read_bytes()
        ctype = mimetypes.guess_type(f.name)[0] or "application/octet-stream"
        self.send_response(status)
        if f.suffix == ".html" and CSP:
            self.send_header("Content-Security-Policy", CSP_PB if f.name == "pb-malwerk-fragebogen.html" else CSP)
            self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Type", ctype + ("; charset=utf-8" if ctype.startswith("text/") or "javascript" in ctype else ""))
        if f.suffix == ".html":
            self.send_header("Cache-Control", "no-cache")
        else:
            self.send_header("Cache-Control", "no-cache")  # lokal immer frisch
        if ctype.startswith(TEXT) and "gzip" in self.headers.get("Accept-Encoding", ""):
            data = gzip.compress(data, 6)
            self.send_header("Content-Encoding", "gzip")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


ThreadingHTTPServer(("127.0.0.1", PORT), H).serve_forever()
