"""Build an offline Smyth edition from the Alpheios Unicode TEI source."""
import argparse
from collections import Counter
from hashlib import sha256
from html import escape
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET

ELEMENTS = {
    "p": "div", "head": "h3", "table": "table", "row": "tr", "cell": "td",
    "emph": "em", "gloss": "em", "foreign": "span", "quote": "q", "cit": "span",
    "list": "ul", "item": "li", "note": "span", "bibl": "cite",
}
LICENSE = "https://creativecommons.org/licenses/by-nc-sa/3.0/us/"
SOURCE = "https://github.com/alpheios-project/grammar-smyth/blob/master/src/smyth_eng_u.xml"

def homer_link(work, book, line):
    return f"reader.html#work={work}&amp;book={book}&amp;line={line}"

def homer_citations(body, output):
    verses = {}
    for work in ("iliad", "odyssey"):
        for book in range(1, 25):
            data = json.loads((output / f"data/{work}/{book}.json").read_text(encoding="utf-8"))
            verses[work, book] = {int(line) for line in data["lines"]}

    forward = {}
    manual = {}
    generated = {}
    reverse = {"iliad": {}, "odyssey": {}}
    unresolved = []

    def record(node, anchor, work, book, start, end, raw, is_manual=False):
        if not all(line in verses.get((work, book), ()) for line in range(start, end + 1)) or end < start:
            unresolved.append({"section": anchor, "source": raw})
            return
        if anchor is None:
            anchor = f"homer-example-{len(generated) + 1}"
            generated[node] = anchor
        (manual if is_manual else forward)[node] = (work, book, start)
        for line in range(start, end + 1):
            sections = reverse[work].setdefault(f"{book}.{line}", [])
            if anchor not in sections:
                sections.append(anchor)

    def visit(node, anchor=None):
        if node.get("id", "").startswith("s") and re.fullmatch(r"s[0-9]+", node.get("id", "")):
            anchor = node.get("id")
        raw = node.get("n", "")
        match = re.fullmatch(r"Hom\. (Il|Od)\. (\d+)\.(\d+)(?:-(\d+))?", raw)
        if node.tag == "bibl" and match:
            work = {"Il": "iliad", "Od": "odyssey"}[match[1]]
            record(node, anchor, work, int(match[2]), int(match[3]), int(match[4] or match[3]), raw)
        elif node.tag == "bibl" and raw.startswith("Hom."):
            unresolved.append({"section": anchor, "source": raw})
        if anchor == "s1475" and node.tag == "gloss" and re.search(r"\bA 3;", node.tail or ""):
            record(node, anchor, "iliad", 1, 3, 3, "A 3", is_manual=True)
        for child in node:
            visit(child, anchor)

    visit(body)
    if len(manual) != 1:
        raise ValueError("Expected the verified untagged Iliad 1.3 example in Smyth §1475")
    report = {"structuredLinks": len(forward), "manualLinks": len(manual), "generatedAnchors": len(generated),
              "uniqueVerses": {work: len(lines) for work, lines in reverse.items()},
              "unresolved": unresolved}
    (output / "data/smyth-homer.json").write_text(json.dumps({"verses": reverse, "audit": report}, ensure_ascii=False), encoding="utf-8")
    print("Homeric citations:", report)
    return forward, manual, generated

def render(node, ids, forward, manual, generated):
    tag = ELEMENTS.get(node.tag, "section" if re.fullmatch(r"div[1-7]", node.tag) else "span")
    attrs = []
    if identifier := node.get("id") or generated.get(node):
        attrs.append(f'id="{escape(identifier)}"')
    if node.tag == "ref" and node.get("target") in ids:
        tag = "a"
        attrs.append(f'href="#{escape(node.get("target"))}"')
    if node in forward:
        tag = "a"
        attrs.extend([f'href="{homer_link(*forward[node])}"', 'target="_blank"', 'rel="noopener"'])
    if node.tag == "p":
        attrs.append('class="smyth-paragraph"')
    if node.tag == "foreign" and node.get("lang") in {"greek", "grc"}:
        attrs.append('lang="grc"')
    if node.tag == "cell":
        for source, target in (("rows", "rowspan"), ("cols", "colspan")):
            if node.get(source, "").isdigit():
                attrs.append(f'{target}="{node.get(source)}"')
    if node.tag == "pb":
        return f'<span {" ".join(attrs)}></span>' if attrs else ""
    number = ""
    if node.get("type") in {"smythp", "smythsub"} and node.get("n"):
        number = f'<strong class="smyth-number">§ {escape(node.get("n"))}</strong> '
    def tail(child):
        value = escape(child.tail or "")
        if child in manual:
            value = value.replace("A 3;", f'<a href="{homer_link(*manual[child])}" target="_blank" rel="noopener">A 3</a>;', 1)
        return value
    content = escape(node.text or "") + "".join(render(child, ids, forward, manual, generated) + tail(child) for child in node)
    attributes = " " + " ".join(attrs) if attrs else ""
    return f"<{tag}{attributes}>{number}{content}</{tag}>"

def build(source, output):
    raw = source.read_bytes()
    root = ET.fromstring(raw)
    body = root.find("./text/body")
    if body is None:
        raise ValueError("Expected the Alpheios Smyth TEI edition with a text body")
    sections = [element for element in body.iter() if element.get("type") == "smythp" and element.get("n", "").isdigit()]
    counts = Counter(int(element.get("n")) for element in sections)
    if counts != Counter(range(1, 3049)):
        raise ValueError("Expected every numbered section from 1 through 3048 exactly once")
    ids = [element.get("id") for element in body.iter() if element.get("id")]
    if len(set(ids)) != len(ids):
        raise ValueError("Duplicate source IDs")
    if any(element.get("id") != f's{element.get("n")}' for element in sections):
        raise ValueError("Unexpected section anchor")
    index = [[int(element.get("n")), " ".join("".join(element.itertext()).split())] for element in sections]
    (output / "data").mkdir(parents=True, exist_ok=True)
    (output / "data/smyth-search.json").write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    forward, manual, generated = homer_citations(body, output)
    contents = "".join(render(part, set(ids), forward, manual, generated) for part in body)
    header = f"""<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Smyth · A Greek Grammar for Colleges</title><link rel="stylesheet" href="smyth.css">
<header><a href="index.html">Greek Reading Tool</a><h1>A Greek Grammar for Colleges</h1>
<p>Herbert Weir Smyth · 1920</p>
<form id="section-form"><label>Section <input id="section-number" inputmode="numeric" required pattern="[0-9]+"></label> <button>Go</button></form>
<p id="section-status" role="status"></p>
<form id="text-search"><label>Search the grammar <input id="query" type="search" required></label> <button>Search</button></form>
<p id="search-status" role="status"></p><ol id="search-results"></ol>
<p>Perseus Project transcription, with Alpheios corrections and formatting. Adapted to offline HTML and a text index. <a href="{SOURCE}">Source XML</a> · <a href="{LICENSE}">CC BY-NC-SA 3.0 US</a></p></header>
<main>"""
    (output / "smyth.html").write_text(header + contents + '</main><script type="module" src="smyth-book.mjs"></script></html>', encoding="utf-8")
    print(f"{len(sections)} numbered sections, {len(ids)} source anchors, {sum(1 for _ in body.iter('table'))} tables")
    print("Source SHA-256:", sha256(raw).hexdigest())

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("xml", type=Path)
    parser.add_argument("--output", type=Path, default=Path("."))
    args = parser.parse_args()
    build(args.xml, args.output)
