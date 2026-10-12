# End-to-end tests: a stand-in for the email provider's send endpoint. The app posts mail here exactly as it
# would to the provider (Bearer key, JSON body); tests read the latest mail per address.
#   python3 -I scripts/mail-sink.py 8025      then run the Worker with EMAIL_API_URL=http://127.0.0.1:8025/emails
#   GET /last?to=<email>  -> the newest mail to that address, as JSON (404 if none)
import json, sys, threading, urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

mails, lock = [], threading.Lock()

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != '/emails' or not self.headers.get('Authorization', '').startswith('Bearer '):
            self.send_response(401); self.end_headers(); return
        body = json.loads(self.rfile.read(int(self.headers.get('Content-Length', 0))))
        with lock:
            for to in body.get('to', []):
                mails.append({'to': to, 'from': body.get('from'), 'subject': body.get('subject'), 'text': body.get('text'), 'html': body.get('html')})
        self.send_response(200); self.send_header('Content-Type', 'application/json'); self.end_headers()
        self.wfile.write(b'{"id":"test"}')

    def do_GET(self):
        q = urllib.parse.urlparse(self.path)
        if q.path == '/last':
            to = urllib.parse.parse_qs(q.query).get('to', [''])[0]
            with lock:
                hit = next((m for m in reversed(mails) if m['to'] == to), None)
            self.send_response(200 if hit else 404); self.send_header('Content-Type', 'application/json'); self.end_headers()
            self.wfile.write(json.dumps(hit).encode() if hit else b'null'); return
        if q.path == '/count':
            self.send_response(200); self.end_headers(); self.wfile.write(str(len(mails)).encode()); return
        self.send_response(404); self.end_headers()

    def log_message(self, *a): pass

ThreadingHTTPServer(('127.0.0.1', int(sys.argv[1]) if len(sys.argv) > 1 else 8025), Handler).serve_forever()
