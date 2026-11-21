import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {searchSmyth, smythForWord} from "./smyth.mjs";

const book = JSON.parse(readFileSync(new URL("./data/iliad/1.json", import.meta.url)));
const words = book.sentences["2274106"].words;
const word = id => words.find(token => token.id === id);

test("finds exact section, section within a range, and Greek keywords", () => {
  assert.deepEqual(searchSmyth("§ 1475").map(topic => topic.id), ["motion"]);
  assert.deepEqual(searchSmyth("1614").map(topic => topic.id), ["complement"]);
  assert.deepEqual(searchSmyth("Ἄϊδι").map(topic => topic.id), ["motion"]);
  assert.deepEqual(searchSmyth("Iliad 1.3").map(topic => topic.id), ["motion"]);
});

test("distinguishes passage-specific citation from tag-based suggestions", () => {
  assert.deepEqual(smythForWord(word("18")).map(topic => topic.id), ["motion"]);
  assert.deepEqual(smythForWord({...word("18"), cite:""}), []);
  assert.deepEqual(smythForWord(word("24")).map(topic => topic.id), ["complement"]);
  assert.deepEqual(smythForWord(word("40")).map(topic => topic.id), ["adverbial"]);
  assert.deepEqual(smythForWord(word("3")).map(topic => topic.id), ["vocative"]);
});

test("bundled grammar supports section and Greek text search", async () => {
  const {findSections} = await import("./smyth-search.mjs");
  const index = JSON.parse(readFileSync(new URL("./data/smyth-search.json", import.meta.url)));
  const html = readFileSync(new URL("./smyth.html", import.meta.url), "utf8");
  assert.equal(index.length, 3048);
  assert.equal(findSections(index, "1475")[0][0], 1475);
  assert(findSections(index, "Αϊδι προΐαψεν").some(([section]) => section === 1475));
  for (const topic of searchSmyth("")) {
    assert(html.includes('id="' + topic.url.split("#")[1] + '"'));
  }
});

test("Homer citations resolve in both directions and retain unresolved references in the audit", () => {
  const html = readFileSync(new URL("./smyth.html", import.meta.url), "utf8");
  const {verses, audit} = JSON.parse(readFileSync(new URL("./data/smyth-homer.json", import.meta.url)));
  assert(verses.iliad["1.3"].includes("s1475"));
  assert(verses.odyssey["12.257"].includes("s1475"));
  assert.match(html, /href="reader.html#work=iliad&amp;book=1&amp;line=3" target="_blank" rel="noopener">A 3<\/a>/);
  for (const references of Object.values(verses)) {
    for (const anchor of Object.values(references).flat()) assert(html.includes('id="' + anchor + '"'));
  }
  assert.equal((html.match(/href="reader\.html#work=/gu) ?? []).length, audit.structuredLinks + audit.manualLinks);
  for (const [link] of html.matchAll(/<a [^>]*href="reader\.html#work=[^>]+>/gu)) {
    assert.match(link, /target="_blank" rel="noopener"/);
  }
  assert.match(html, /<a href="#s1485">/);
  assert(audit.unresolved.some(row => row.source === "Hom. Od. 23.887"));
  assert(!verses.odyssey["23.887"]);
});
