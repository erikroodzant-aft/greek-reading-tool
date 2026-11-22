import assert from "node:assert/strict";
import test from "node:test";
import {atlasHeadword, lemmaKey, parseCunliffe, referencedEntry, referencedEntries, referenceLabel, referenceTree, entryPreview} from "./lexicon.mjs";

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

const fixture = (headword, definition, suffix) => ({headword, definition,
  urn:"urn:cite2:scaife-viewer:dictionaries.v1:cunliffe_lex-" + suffix});
const dictionary = rows => parseCunliffe(rows.map(JSON.stringify).join("\n"));

test("See links preserve qualifiers and refuse missing or ambiguous targets", () => {
  const source = fixture("ἐνέπω", "ἐνέπω See ἐννέπω.", "a");
  const target = fixture("†ἐννέπω", "†ἐννέπω Original complete entry.", "b");
  assert.deepEqual(referencedEntry(source,dictionary([source,target])),target);
  assert.equal(referencedEntry(source,dictionary([source])),null);
  assert.equal(referencedEntry(source,dictionary([source,target,{...target,urn:target.urn+'2'}])),null);
  for(const body of ["See ἐννέπω 1.","See ἐννέπω 2.b.","See next.","See under ἐννέπω.","See ἐννέπω, ἄγε.","See ἐννέπω. Extra prose.","See ἐννέπω-."]) {
    assert.equal(referencedEntry({...source,definition:'ἐνέπω '+body},dictionary([source,target])),null);
  }
});

test("See links reject chains, cycles and accent-changing guesses", () => {
  const a=fixture("ἄγετε","ἄγετε See ἄγε.","a");
  const b=fixture("ἄγε","ἄγε See ἐνέπω.","b");
  const c=fixture("ἐνέπω","ἐνέπω Complete entry.","c");
  assert.equal(referencedEntry(a,dictionary([a,b,c])),null);
  assert.equal(referencedEntry(a,dictionary([a,{...b,definition:'ἄγε See ἄγετε.'}])),null);
  assert.equal(referencedEntry({...a,definition:'ἄγετε See ἄγετε.'},dictionary([a])),null);
  assert.equal(referencedEntry({...a,definition:'ἄγετε See ἀγε.'},dictionary([a,b])),null);
});

test("bundled export exposes exactly the 149 audited direct See links without altering source", async () => {
  const {readFile}=await import('node:fs/promises');
  const {createHash}=await import('node:crypto');
  const raw=await readFile(new URL('./data/cunliffe.jsonl',import.meta.url));
  assert.equal(createHash('sha256').update(raw).digest('hex'),'f1b6da0e0d19a930fa92c26a133d472d1da2d3e22f9b13962db034959a7c4362');
  const data=parseCunliffe(raw.toString('utf8'));
  const rows=[...data.entries.values()].flat();
  const links=rows.map(source=>({source,target:referencedEntry(source,data)})).filter(r=>r.target);
  assert.equal(links.length,149);
  const ennepo=links.find(r=>r.source.headword==='ἐνέπω');
  assert.equal(ennepo.target.headword,'†ἐννέπω');
  assert.match(ennepo.source.definition,/See ἐννέπω/);
  for(const r of links) assert.equal(referencedEntry(r.target,data),null);
});

test("qualified reference navigation retains restrictions and exact prefix identities", () => {
  const target=fixture('εὐρύς','εὐρύς Complete source entry.','b');
  const source=fixture('εὐρυκρείων','εὐρυκρείων See εὐρύς 2.b.','a');
  const links=referencedEntries(source,dictionary([source,target]));
  assert.equal(links[0].sense,'2.b');
  assert.equal(referenceLabel(links[0]),'Open referenced entry: εὐρύς — source specifies sense 2.b; full entry shown');
  assert.deepEqual(links[0].target,target);
  const under={...source,definition:'εὐρυκρείων See under εὐρύς.'};
  assert.match(referenceLabel(referencedEntries(under,dictionary([under,target]))[0]),/See under/);
  const prefix=fixture('ἐξ-','ἐξ- See ἐκ-.','p');
  const word=fixture('ἐκ','ἐκ Word entry.','w');
  assert.deepEqual(referencedEntries(prefix,dictionary([prefix,word])),[]);
  const prefixTarget=fixture('ἐκ-','ἐκ- Prefix entry.','t');
  assert.equal(referencedEntries(prefix,dictionary([prefix,word,prefixTarget]))[0].target.urn,prefixTarget.urn);
});

test("multiple references retain both distinct accented targets and fail closed", () => {
  const source=fixture('πάρ','πάρ See παρά, πάρα.','s');
  const a=fixture('παρά','παρά Full entry A.','a');
  const b=fixture('πάρα','πάρα Full entry B.','b');
  assert.deepEqual(referencedEntries(source,dictionary([source,a,b])).map(r=>r.target.urn),[a.urn,b.urn]);
  for (const targets of [[a],[a,b,{...b,urn:b.urn+'2'}],[a,{...b,definition:'πάρα See παρά.'}]]) {
    assert.deepEqual(referencedEntries(source,dictionary([source,...targets])),[]);
  }
  for (const body of ['See next.','See παρά, πάρα. More text.','See σύν. ξυμ-, ξυν-. See συμ-, συν-.','See παρά 2.b. More text.']) {
    assert.deepEqual(referencedEntries({...source,definition:'πάρ '+body},dictionary([source,a,b])),[]);
  }
});

test("bundled qualified navigation adds exactly the approved 12 entries and 13 links", async () => {
  const {readFile}=await import('node:fs/promises');
  const data=parseCunliffe(await readFile(new URL('./data/cunliffe.jsonl',import.meta.url),'utf8'));
  const expected=new Map([
    ['ἀμφιμέλαιναι',['μέλας']],['εἴτε',['εἰ']],['εὐρυκρείων',['εὐρύς']],
    ['ἦ3.',['ἠέ']],['ἦε',['ἠέ']],['ἥδυμος',['νήδυμος']],['κατακρῆθεν',['κρῆθεν']],
    ['ἐξ-',['ἐκ-']],['ἐσ-',['εἰσ-']],['ποτι-',['προσ-']],['προτι-',['προσ-']],['πάρ',['παρά','πάρα']]
  ]);
  let records=0, additions=0, total=0;
  for (const source of [...data.entries.values()].flat()) {
    const links=referencedEntries(source,data);
    total+=links.length;
    if (referencedEntry(source,data)) continue;
    if (links.length) {
      records++; additions+=links.length;
      assert.deepEqual(links.map(r=>r.target.headword),expected.get(source.headword),source.headword);
      expected.delete(source.headword);
    }
  }
  assert.equal(expected.size,0);
  assert.equal(records,12); assert.equal(additions,13); assert.equal(total,162);
  for (const name of ['ἄν2.','ἄρ','βέῃ','*ἔργω2.','ᾖα','ἤτοι','ῥεῖα','τέμνω','ξύν']) {
    const source=[...data.entries.values()].flat().find(r=>r.headword===name);
    assert.deepEqual(referencedEntries(source,data),[],name);
  }
});

test("reference paths show each original step, stop cycles and obey depth limits", () => {
  const a=fixture('α','α τό. = β 1, Il. 1.1.','a');
  const b=fixture('β','β See γ.','b');
  const c=fixture('γ','γ = α.','c');
  const data=dictionary([a,b,c]);
  const tree=referenceTree(a,data);
  assert.equal(tree[0].sense,'1');
  assert.equal(tree[0].target.definition,b.definition);
  assert.equal(tree[0].children[0].target.urn,c.urn);
  assert.equal(tree[0].children[0].children[0].stop,'cycle');
  assert.deepEqual(tree[0].children[0].children[0].children,[]);
  assert.equal(referenceTree(a,data,1)[0].children[0].stop,'limit');
  assert.equal(referenceTree(a,data,0)[0].stop,'limit');
  assert.equal(referenceTree({...a,definition:'α = α.'},data)[0].stop,'cycle');
});

test("opening equations exclude citations, etymology, uncertainty and partial phrases", () => {
  const source=fixture('α','α = β.','a');
  const target=fixture('β','β Complete original source.','b');
  const data=dictionary([source,target]);
  for(const body of ['[= β.] Definition.','Definition Il. 1.1 = β.','App. = β.','1 = β. 2 Other sense.','= β γ Il. 1.1.','[bad ] ] = β.']) {
    assert.deepEqual(referenceTree({...source,definition:'α '+body},data),[],body);
  }
  assert.deepEqual(referenceTree(source,dictionary([source,target,{...target,urn:target.urn+'2'}])),[]);
  assert.deepEqual(referenceTree({...source,definition:'α = βά.'},data),[]);
  const parenthesized=referenceTree({...source,definition:'α = β. (2): Example.'},data);
  assert.equal(parenthesized[0].sense,'(2)');
  assert.equal(referenceTree({...source,definition:'α = β. 1.a Example.'},data)[0].sense,'1.a');
});

test("bundled equals navigation preserves the reported two-step path and circular entries", async () => {
  const {readFile}=await import('node:fs/promises');
  const data=parseCunliffe(await readFile(new URL('./data/cunliffe.jsonl',import.meta.url),'utf8'));
  const rows=[...data.entries.values()].flat();
  const find=name=>rows.find(r=>r.headword===name);
  const pto=referenceTree(find('πτολίεθρον'),data);
  assert.equal(pto[0].target.headword,'πτόλις');
  assert.equal(pto[0].sense,'1');
  assert.equal(pto[0].children[0].target.headword,'πόλις');
  assert.deepEqual(pto[0].children[0].children,[]);
  const ninth=referenceTree(find('εἴνατος'),data);
  assert.equal(ninth[0].target.headword,'ἔνατος');
  assert.equal(ninth[0].children[0].stop,'cycle');
  assert.match(ninth[0].target.definition,/The ninth/);
  assert.equal(referenceTree(find('αἴγεος'),data)[0].target.headword,'αἴγειος');
  for(const name of ['ἀβρότη','ἀγελείη','ἀγαπάζω','οὑμός'])assert.deepEqual(referenceTree(find(name),data),[],name);
  const equations=rows.filter(r=>referenceTree(r,data)[0]?.kind==='equals');
  assert.equal(equations.length,166);
});

test("lettered section previews preserve source text and defer restricted or incomplete openings", () => {
  const repaired=entryPreview('α Genit. β Il. 1.1. 1 a A word in general: γ.');
  assert.deepEqual(repaired,{text:'A word in general',truncated:true,type:'Opening numbered section · source excerpt'});
  const roman='α I Act. 1 a To act: β.';
  assert.equal(entryPreview(roman).text,'α I Act. 1 a To act');
  assert.equal(entryPreview('α 1 a In sense 1.a: β.').text,'');
  assert.equal(entryPreview('α [A long explanation with no closing bracket Il. 1.1.').text,'');
  assert.equal(entryPreview('α See β. [More notes').text,'α See β. [More notes');
  const etymology='α [form 1 a A word.] Clear meaning: β.';
  assert.equal(entryPreview(etymology).type,'Cunliffe entry excerpt');
});

test("unnumbered form-list fallback keeps useful inline and already-numbered definitions", () => {
  const forms='α Genit. β Il. 1.1. Dat. γ Il. 2.2. Acc. δ. A word.';
  assert.equal(entryPreview(forms).text,'');
  const inline='α Genit. β. Dat. γ. Acc. δ. A word Il. 1.1.';
  assert.equal(entryPreview(inline).text,'α Genit. β. Dat. γ. Acc. δ. A word');
  assert.equal(entryPreview(forms+' 1 A word: β.').text,'A word');
});

test("bundled excerpt changes recover numbered openings and preserve working controls", async () => {
  const {readFile}=await import('node:fs/promises');
  const data=parseCunliffe(await readFile(new URL('./data/cunliffe.jsonl',import.meta.url),'utf8'));
  const rows=[...data.entries.values()].flat();
  const preview=name=>entryPreview(rows.find(r=>r.headword===name).definition);
  assert.equal(preview('ἀνήρ').text,'A man in general');
  assert.equal(preview('θυγάτηρ').text,'');
  assert.equal(preview('μήτηρ').text,"A mother, one's mother");
  assert.equal(preview('πατήρ').text,"A father, one's father");
  assert.equal(preview('δειπνέω').text,'');
  assert.match(preview('ἄγυια').text,/A street/);
  assert.match(preview('ταχύς').text,/Quick in movement/);
  assert.equal(rows.filter(r=>entryPreview(r.definition??'').type==='Opening numbered section · source excerpt').length,35);
});
