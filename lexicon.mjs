export function lemmaKey(value) {
  return value.trim().toLowerCase().normalize("NFC");
}

export function atlasHeadword(lemma) {
  return "https://atlas.perseus.tufts.edu/dictionaries/headword/" +
    encodeURIComponent(lemma.trim().normalize("NFC")) + "/";
}

export function parseCunliffe(source) {
  const entries = new Map();
  let count = 0;
  for (const [index, line] of source.replace(/^\uFEFF/u, "").split(/\r?\n/u).entries()) {
    if (!line.trim()) continue;
    const row = JSON.parse(line);
    if (!row || typeof row.headword !== "string" || !row.headword.trim() ||
        typeof row.urn !== "string" || !/^urn:cite2:[\w.:-]+:cunliffe_lex-[\w.-]+$/u.test(row.urn)) {
      throw new Error("Unrecognized Cunliffe entry on line " + (index + 1));
    }
    const key = lemmaKey(row.headword.replace(/^[†‡]+\s*/u, ""));
    if (!entries.has(key)) entries.set(key, []);
    entries.get(key).push(row);
    count++;
  }
  if (!count) throw new Error("The dictionary file is empty.");
  return {entries, count};
}

export function entryUrl(urn) {
  return "https://atlas.perseus.tufts.edu/dictionaries/entry/" + encodeURIComponent(urn) + "/";
}

export const preview = new Map([
  ["μῆνις", {gloss:"Wrath or anger; also the effect of wrath.",
    url:entryUrl("urn:cite2:scaife-viewer:dictionaries.v1:cunliffe_lex-n6427")}],
  ["ἀείδω", {gloss:"To sing.",
    url:atlasHeadword("ἀείδω")}]
]);


export function entryPreview(definition, limit = 220) {
  const numbered = /(?:^|\s)1\s+(?=[A-Z])/u.exec(definition);
  const start = numbered ? numbered.index + numbered[0].length : 0;
  const source = definition.slice(start);
  let end = Math.min(source.length, limit);
  const citation = /\b(?:Il|Od)\.\s*\d/u.exec(source);
  const example = source.indexOf(":");
  if (citation) end = Math.min(end, citation.index);
  if (example >= 0) end = Math.min(end, example);
  if (end === limit) {
    const space = source.lastIndexOf(" ", end);
    if (space > 0) end = space;
  }
  const text = source.slice(0,end).trim();
  return {text, truncated:end < source.length, type:numbered ? "First sense · Cunliffe excerpt" : "Cunliffe entry excerpt"};
}
