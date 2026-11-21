"""Convert the two AGDT XML files into book indexes and intact sentence graphs."""
import argparse
from collections import Counter, defaultdict
from hashlib import sha256
import json
from pathlib import Path
import re
import unicodedata
import xml.etree.ElementTree as ET

WORKS = {"iliad": "001", "odyssey": "002"}
BOOKS = set(range(1, 25))

def dump(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

def convert(path, code, destination):
    raw = path.read_bytes()
    root = ET.fromstring(raw)
    assert root.get("version") == "2.1" and f"tlg{code}" in root.get("cts", "")
    counts = Counter()
    issues = defaultdict(list)
    books = defaultdict(lambda: {"sentences": {}, "lines": defaultdict(list)})
    seen = set()
    for sentence in root.findall("./body/sentence"):
        sid = sentence.attrib["id"]
        assert sid not in seen, sid
        seen.add(sid)
        counts["sentences"] += 1
        words = [dict(word.attrib) for word in sentence.findall("word")]
        tokens = {word["id"]: word for word in words}
        assert len(tokens) == len(words) and "0" not in tokens, sid
        prefix = f"urn:cts:greekLit:tlg0012.tlg{code}:"
        refs = {}
        for word in words:
            cite = word.get("cite", "")
            if cite.startswith(prefix) and re.fullmatch(r"\d+\.\d+", cite[len(prefix):]):
                refs[word["id"]] = cite[len(prefix):]
        locations = set(refs.values())
        participating = {int(ref.split(".")[0]) for ref in locations}
        if not participating:
            match = re.match(r"(\d+)(?:[.\-]|$)", sentence.attrib["subdoc"])
            assert match, sentence.attrib
            participating = {int(match[1])}
        assert participating <= BOOKS, sentence.attrib
        counts["multiVerseSentences"] += len(locations) > 1
        roots = 0
        prev = None
        for word in words:
            tid, head = word["id"], word["head"]
            ref = refs.get(tid)
            head_ref = refs.get(head)
            counts["tokens"] += 1
            counts["explicitVerseTokens"] += ref is not None
            counts["crossVerseEdges"] += bool(ref and head_ref and ref != head_ref)
            if word.get("artificial"):
                counts["artificialTokens"] += 1
            else:
                tag = word.get("postag", "")
                counts["missingLemma"] += not word.get("lemma")
                counts["unspecifiedMorphology"] += tag == "---------"
                if not re.fullmatch(r"[a-z0-9-]{9}", tag):
                    issues["malformedMorphology"].append([sid, tid, tag])
            if head == "0":
                roots += 1
            elif head not in tokens:
                issues["danglingHeads"].append([sid, tid, head])
            visited = {tid}
            cursor = head
            while cursor in tokens and cursor not in visited:
                visited.add(cursor)
                cursor = tokens[cursor]["head"]
            if cursor in visited:
                issues["tokensReachingCycle"].append([sid, tid, cursor])
            if ref:
                prev = ref
            elif not word.get("artificial") and word.get("postag", "").startswith("u") and all(
                unicodedata.category(char).startswith(("P", "S")) for char in word["form"]
            ) and not word.get("cite") and prev:
                ref = prev
                counts["displayPlacedPunctuation"] += 1
            if ref:
                book, line = map(int, ref.split("."))
                books[book]["lines"][line].append([sid, tid])
            elif not word.get("artificial"):
                issues["unplacedSurfaceTokens"].append([sid, tid, word["form"], word.get("cite")])
        counts["rootArcs"] += roots
        if roots != 1:
            issues["nonSingleRootSentences"].append([sid, roots])
        graph = {"source": dict(sentence.attrib), "words": words}
        for book in participating:
            books[book]["sentences"][sid] = graph
    assert set(books) == BOOKS and all(book["lines"] for book in books.values())
    gaps = {}
    for number, book in sorted(books.items()):
        lines = book["lines"]
        gaps[number] = sorted(set(range(1, max(lines) + 1)) - lines.keys())
        counts["indexedVerses"] += len(lines)
        dump(destination / f"{number}.json", book)
    (destination / "header.xml").write_text(ET.tostring(root.find("header"), encoding="unicode"), encoding="utf-8")
    return {"source": path.name, "sha256": sha256(raw).hexdigest(), "treebank": root.attrib,
            "counts": counts, "issueCounts": {key: len(rows) for key, rows in issues.items()},
            "issues": issues, "verseGapsThroughLastAttestedLine": gaps}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("xml_directory", type=Path)
    parser.add_argument("--output", type=Path, default=Path("data"))
    args = parser.parse_args()
    reports = {}
    for work, code in WORKS.items():
        dest = args.output / work
        dest.mkdir(parents=True, exist_ok=True)
        reports[work] = convert(args.xml_directory / f"tlg0012.tlg{code}.perseus-grc1.tb.xml", code, dest)
    dump(args.output / "audit.json", reports)

if __name__ == "__main__":
    main()
