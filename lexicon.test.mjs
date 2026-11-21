import assert from "node:assert/strict";
import test from "node:test";
import {atlasHeadword, lemmaKey, parseCunliffe} from "./lexicon.mjs";

test("exact accent-preserving dictionary keys", () => {
  assert.equal(lemmaKey(" ΜΗ͂ΝΙΣ "), "μῆνις");
  assert.notEqual(lemmaKey("εἰ"), lemmaKey("εἷ"));
  assert.equal(new URL(atlasHeadword("μῆνις")).hostname, "atlas.perseus.tufts.edu");
});

test("Scaife JSONL keeps multiple entries for the same headword", () => {
  const a = {headword:"μῆνις", urn:"urn:cite2:scaife-viewer:dictionaries.v1:cunliffe_lex-n6427", definition:"Example"};
  const b = {...a, headword:"†μῆνις", urn:a.urn + "b"};
  const index = parseCunliffe([a,b].map(JSON.stringify).join("\r\n"));
  assert.equal(index.count, 2);
  assert.deepEqual(index.entries.get("μῆνις"), [a,b]);
  assert.throws(() => parseCunliffe("{}"));
  assert.throws(() => parseCunliffe(""));
});

test("previews use source text and distinguish first senses from entry openings", async () => {
  const {entryPreview} = await import("./lexicon.mjs");
  assert.deepEqual(entryPreview("μῆνις ἡ. 1 Wrath, ire : μῆνιν Il. 1.1."),
    {text:"Wrath, ire", truncated:true, type:"First sense · Cunliffe excerpt"});
  assert.equal(entryPreview("ἀείδω forms. 1 To sing: μουσάων").text, "To sing");
  assert.equal(entryPreview("See another entry.").type, "Cunliffe entry excerpt");
  assert.equal(entryPreview("Short definition.").truncated, false);
});
