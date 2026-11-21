import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {buildGraph, descendants, displayGreek, verseRef} from "./graph.mjs";

for (const [work, sentence, child, head, childVerse, headVerse] of [
  ["iliad", "2274106", "6", "1", "1.2", "1.1"],
  ["odyssey", "2185541", "12", "1", "1.2", "1.1"]
]) {
  test(work + " opening dependency crosses a verse boundary", () => {
    const data = JSON.parse(readFileSync(new URL("./data/" + work + "/1.json", import.meta.url)));
    const graph = buildGraph(data.sentences[sentence].words);
    assert.equal(graph.byId.get(child).head, head);
    assert.equal(verseRef(graph.byId.get(child)), childVerse);
    assert.equal(verseRef(graph.byId.get(head)), headVerse);
    assert(descendants(graph, head).has(child));
  });
}
test("cycle-safe traversal and dangling head preservation", () => {
  const graph = buildGraph([{id:"1", head:"2"}, {id:"2", head:"1"}, {id:"3", head:"9"}]);
  assert.deepEqual([...descendants(graph, "1")], ["1", "2"]);
  assert.equal(graph.byId.get("3").head, "9");
});
test("ambiguous citations do not become links", () => {
  assert.equal(verseRef({cite:"urn:cts:greekLit:tlg0012.tlg001:1.1 urn:cts:greekLit:tlg0012.tlg001:1.2"}), "");
});

test("spacing elision and retaining polytonic vowel accents", () => {
  assert.equal(displayGreek("ὁππότ̓"), "ὁππότ’");
  assert.equal(displayGreek("ἂν"), "ἂν");
  assert.equal(displayGreek("ἡβήσῃ"), "ἡβήσῃ");
});
