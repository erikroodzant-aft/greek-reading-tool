"""Validate local page links, module imports and all packaged corpus indexes."""
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent


def require(condition, message):
    if not condition:
        raise ValueError(message)


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.links = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if "id" in attributes:
            require(attributes["id"] not in self.ids, f"Duplicate HTML ID: {attributes['id']}")
            self.ids.add(attributes["id"])
        for name in ("href", "src"):
            if attributes.get(name):
                self.links.append(attributes[name])


def check():
    inventory = json.loads((ROOT / "release-files.json").read_text(encoding="utf-8"))
    for name in inventory["files"]:
        require((ROOT / name).is_file(), f"Missing release file: {name}")
    require((ROOT / "CNAME").read_text().strip() == "heleios.org", "Custom domain changed unexpectedly")
    pages = {}
    for name in ("index.html", "reader.html", "smyth.html"):
        parsed = Links()
        parsed.feed((ROOT / name).read_text(encoding="utf-8"))
        pages[name] = parsed
    for name, parsed in pages.items():
        for link in parsed.links:
            url = urlsplit(link)
            if url.scheme or url.netloc:
                continue
            destination = unquote(url.path) or name
            path = (ROOT / destination).resolve()
            require(path.is_relative_to(ROOT) and path.is_file(), f"Broken local link in {name}: {link}")
            if url.fragment and destination in pages and not url.fragment.startswith("work="):
                require(unquote(url.fragment) in pages[destination].ids, f"Missing anchor: {link}")
    for module in ROOT.glob("*.mjs"):
        for relative in re.findall(r'(?:from\s*|import\s*)["\'](\./[^"\']+)["\']', module.read_text(encoding="utf-8")):
            require((module.parent / relative).is_file(), f"Broken module import in {module.name}: {relative}")
    for work in ("iliad", "odyssey"):
        shared = {}
        for book in range(1, 25):
            data = json.loads((ROOT / f"data/{work}/{book}.json").read_text(encoding="utf-8"))
            require(bool(data["lines"]), f"Empty book: {work} {book}")
            for sid, sentence in data["sentences"].items():
                require(sid not in shared or shared[sid] == sentence, f"Cross-book sentence differs: {sid}")
                shared[sid] = sentence
                ids = [word["id"] for word in sentence["words"]]
                require(len(ids) == len(set(ids)), f"Duplicate token: {sid}")
            for line, refs in data["lines"].items():
                require(line.isdigit() and int(line) > 0, f"Invalid verse: {line}")
                for sid, tid in refs:
                    require(sid in data["sentences"], f"Missing sentence: {sid}")
                    require(any(word["id"] == tid for word in data["sentences"][sid]["words"]), f"Missing token: {sid}:{tid}")
    manifest_path = ROOT / "release-manifest.json"
    if manifest_path.exists():
        import hashlib
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        for name, expected in manifest["sha256"].items():
            require(hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == expected, f"Release hash mismatch: {name}")
    print("Release checks passed: assets, local links/anchors, module imports, 48 corpus books and manifest hashes.")


if __name__ == "__main__":
    check()
