"""Local server for the game. Sends no-store so the browser always loads the latest files.

    py -3 tools/serve.py 8765          only this computer
    py -3 tools/serve.py 8765 --lan    also tablets/phones on the same Wi-Fi
"""
import http.server
import socket
import sys


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'text/javascript',
        '.webmanifest': 'application/manifest+json',
        '.glb': 'model/gltf-binary',
    }

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, fmt, *args):
        try:
            super().log_message(fmt, *args)
        except Exception:
            pass


def lan_addresses():
    """The address the tablet should use first, then any other IPv4 addresses of this computer."""
    found = []
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('192.168.0.1', 9))  # no packet is sent; this only picks the default interface
        found.append(s.getsockname()[0])
        s.close()
    except OSError:
        pass
    try:
        found += socket.gethostbyname_ex(socket.gethostname())[2]
    except OSError:
        pass
    return [ip for i, ip in enumerate(found) if not ip.startswith('127.') and ip not in found[:i]]


args = [a for a in sys.argv[1:] if not a.startswith('--')]
lan = '--lan' in sys.argv
port = int(args[0]) if args else 8765
host = '0.0.0.0' if lan else '127.0.0.1'
if lan:
    for ip in lan_addresses():
        print(f'Tablette ac: http://{ip}:{port}/', flush=True)
http.server.ThreadingHTTPServer((host, port), Handler).serve_forever()
