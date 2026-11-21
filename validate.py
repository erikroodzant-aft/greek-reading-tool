"""Independently compare packaged data with every source word and citation."""
from collections import Counter
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET

for work, code in (("iliad", "001"), ("odyssey", "002")):
    source = Path(sys.argv[1]) / f"tlg0012.tlg{code}.perseus-grc1.tb.xml"
    graphs = {}
    indexed = {}
    for book in range(1, 25):
        data = json.loads(Path(f"data/{work}/{book}.json").read_text(encoding="utf-8"))
        for sid, graph in data["sentences"].items():
            assert sid not in graphs or graphs[sid] == graph, sid
            graphs[sid] = graph
        for line, refs in data["lines"].items():
            for sid, tid in refs:
                assert (sid, tid) not in indexed, (sid, tid)
                assert sid in data["sentences"], sid
                indexed[sid, tid] = f"{book}.{line}"
    counts = Counter()
    for sentence in ET.parse(source).findall("./body/sentence"):
        sid = sentence.attrib["id"]
        graph = graphs.pop(sid)
        assert graph["source"] == sentence.attrib, sid
        words = sentence.findall("word")
        assert graph["words"] == [word.attrib for word in words], sid
        counts["sentences"] += 1
        counts["tokens"] += len(words)
        for word in words:
            line = indexed.pop((sid, word.attrib["id"]), None)
            cite = word.get("cite", "")
            match = re.fullmatch(r"urn:cts:greekLit:tlg0012\.tlg00[12]:(\d+\.\d+)", cite)
            if match:
                assert line == match[1], (sid, cite, line)
                counts["explicit verses checked"] += 1
            elif line:
                assert not cite and word.get("postag", "").startswith("u"), (sid, cite, line)
    assert not graphs and not indexed
    print(work, dict(counts))
