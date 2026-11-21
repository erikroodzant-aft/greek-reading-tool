import assert from "node:assert/strict";
import test from "node:test";
import {prepareSections, searchSections, excerpt} from "./smyth-search.mjs";
import {readFileSync} from "node:fs";

test("phrase ranking, literal excerpts, whole words and quote filtering", () => {
  const sections = prepareSections([[1,"The optative has a potential use."],[2,"The potential optative expresses possibility."],[3,"Potentially useful optatives."]]);
  assert.equal(searchSections(sections,"potential optative")[0].section,2);
  assert.deepEqual(searchSections(sections,'"potential optative"').map(r=>r.section),[2]);
  assert.equal(searchSections(sections,"nonsense").length,0);
  const hit=searchSections(sections,"potential optative")[0];
  const part=excerpt(hit);
  assert.equal(part.text,hit.text.slice(part.start,part.end));
  assert.deepEqual(part.ranges.map(([a,b])=>part.text.slice(a,b)),["potential","optative"]);
});

test("accent-insensitive highlighting preserves original Greek and source sections", () => {
  const sections=prepareSections([[1475,"A long introductory passage. Ἄϊδι προΐαψεν."]]);
  const hit=searchSections(sections,"αιδι")[0];
  const part=excerpt(hit);
  assert.equal(part.text.slice(...part.ranges[0]),"Ἄϊδι");
  assert.equal(searchSections(sections,"§1475")[0].section,1475);
});

test("actual Smyth search returns source text around potential optative", () => {
  const index=JSON.parse(readFileSync(new URL("./data/smyth-search.json",import.meta.url)));
  const sections=prepareSections(index);
  const hits=searchSections(sections,'"potential optative"');
  assert(hits.length>0);
  for(const hit of hits.slice(0,5)) {
    const part=excerpt(hit);
    assert(part.ranges.length>0);
    assert(hit.text.includes(part.text));
  }
});
