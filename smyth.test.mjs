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
  assert.deepEqual(smythForWord(word("24")).map(topic => topic.id), ["accusative", "complement"]);
  assert.deepEqual(smythForWord(word("40")).map(topic => topic.id), ["accusative", "adverbial"]);
  assert.deepEqual(smythForWord(word("3")).map(topic => topic.id), ["vocative"]);
});

test("case guidance depends on the recorded case regardless of word class or relation", () => {
  for (const part of ['n','a','p','l','v']) for (const [code,id] of [['g','genitive'],['d','dative'],['a','accusative'],['v','vocative']]) {
    const tag=[part,'-','s','-','-','-','m',code,'-'].join('');
    assert(smythForWord({postag:tag,relation:'ATR'}).some(t=>t.id===id));
  }
  assert.deepEqual(smythForWord({postag:'n-s---mn-',relation:'UNDEFINED'}),[]);
  assert.deepEqual(smythForWord({postag:'---------',relation:'OBJ'}),[]);
  assert.equal(smythForWord({postag:'n-s---mg-',relation:'OBJ'}).find(t=>t.id==='genitive').section,'1289');
});

test("selected moods, verbal forms and dual get guidance without routine indicative or plural links", () => {
  for (const [code,id] of [['s','subjunctive'],['o','optative'],['m','imperative'],['n','infinitive'],['p','participle']]) {
    assert(smythForWord({postag:'v3sp'+code+'a---',relation:'PRED'}).some(t=>t.id===id));
  }
  assert.deepEqual(smythForWord({postag:'v3ppia---',relation:'PRED'}).map(t=>t.id),['tense-present']);
  assert(smythForWord({postag:'v3dpia---',relation:'PRED'}).some(t=>t.id==='dual'));
  assert(smythForWord({postag:'n-d---mn-',relation:'SBJ'}).some(t=>t.id==='dual'));
});

test("all seven tenses link to verified guidance appropriate to the verbal form", () => {
  for(const [code,id,section] of [['p','present','1875'],['i','imperfect','1889'],['f','future','1910'],['a','aorist','1923'],['r','perfect','1945'],['l','pluperfect','1952'],['t','future-perfect','1955']]) {
    const refs=smythForWord({postag:'v3s'+code+'ia---',relation:'PRED'});
    assert.equal(refs.find(t=>t.id==='tense-'+id).url,'smyth.html#s'+section);
  }
  for(const [mood,form,section] of [['s','subjunctive','1860'],['o','optative','1861'],['m','imperative','1864'],['n','infinitive','1865'],['p','participle','1872']]) {
    const refs=smythForWord({postag:'v--a'+mood+'a---',relation:'PRED'});
    const guidance=refs.find(t=>t.id==='tense-aorist-'+form);
    assert.equal(guidance.url,'smyth.html#s'+section);
    assert.match(guidance.title,new RegExp('Aorist '+form));
    assert(!refs.some(t=>t.id==='tense-aorist'));
  }
  assert(smythForWord({postag:'v--a-a---'}).some(t=>t.id==='tense-overview'));
});

test("voice links follow explicit source analysis without resolving middle/passive", () => {
  const refs=voice=>smythForWord({postag:'v3sp i'.replace(' ','')+voice+'---'}).map(t=>t.id);
  assert(refs('m').includes('middle'));
  assert(refs('p').includes('passive'));
  for(const voice of ['e','a','-']) {
    assert(!refs(voice).includes('middle'));
    assert(!refs(voice).includes('passive'));
  }
});

test("prepositions have exact individual listings or clearly general fallback guidance", () => {
  const ids=lemma=>smythForWord({lemma,postag:'r--------'}).map(t=>t.id);
  assert.deepEqual(ids('παρά'),['prep-παρά']);
  assert.deepEqual(ids('ἐξ'),['prep-ἐκ']);
  assert.deepEqual(ids('ἅμα'),['prep-list-dative']);
  assert.deepEqual(ids('ἕνεκα'),['prep-list-genitive']);
  assert.deepEqual(ids('προπάροιθε'),['prepositions']);
  assert.deepEqual(ids(''),['prepositions']);
  assert.deepEqual(smythForWord({lemma:'παρά',postag:'d--------'}),[]);
});

test("all corpus case tags and prepositions receive guidance, with valid anchors and no duplicate topics", () => {
  const html=readFileSync(new URL('./smyth.html',import.meta.url),'utf8');
  const anchors=new Set([...html.matchAll(/id="([^"]+)"/gu)].map(m=>m[1]));
  const expected={g:'genitive',d:'dative',a:'accusative',v:'vocative'};
  for(const work of ['iliad','odyssey'])for(let b=1;b<=24;b++) {
    const data=JSON.parse(readFileSync(new URL(`./data/${work}/${b}.json`,import.meta.url)));
    for(const sentence of Object.values(data.sentences))for(const word of sentence.words) {
      const refs=smythForWord(word), ids=refs.map(t=>t.id);
      assert.equal(new Set(ids).size,ids.length);
      if(expected[word.postag?.[7]])assert(ids.includes(expected[word.postag[7]]));
      if(word.postag?.[0]==='r')assert(refs.some(t=>t.id.startsWith('prep')||t.id==='prepositions'));
      for(const topic of refs)assert(anchors.has(topic.url.split('#')[1]));
    }
  }
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
