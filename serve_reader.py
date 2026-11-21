from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

class ReaderHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".mjs": "text/javascript",
        ".json": "application/json",
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(Path(__file__).resolve().parent), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

if __name__ == "__main__":
    try:
        server = ThreadingHTTPServer(("127.0.0.1", 8000), ReaderHandler)
    except OSError as error:
        raise SystemExit(f"Could not start the reader on port 8000. Close any older reader launcher and try again. ({error})")
    with server:
        print("Open http://127.0.0.1:8000/ in your browser.", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
