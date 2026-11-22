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

// Only complete statements are eligible. Lookup preserves accents, homograph
// numbers and prefix hyphens; qualified links open the entire target entry.
function leadingSee(entry) {
  const definition = typeof entry.definition === "string" ? entry.definition.trim() : "";
  if (!definition.startsWith(entry.headword)) return "";
  const body = definition.slice(entry.headword.length).trim();
  return /^See\b/u.test(body) ? body : "";
}

export function referencedEntry(entry, dictionary) {
  const match = /^See\s+([\p{Script=Greek}\p{M}]+\d*)\.?$/u.exec(leadingSee(entry));
  if (!match || !dictionary) return null;
  return exactReferenceTarget(entry, dictionary, match[1]);
}

function exactReferenceTarget(entry, dictionary, headword) {
  const candidates = dictionary.entries.get(lemmaKey(headword)) ?? [];
  if (candidates.length !== 1) return null;
  const target = candidates[0];
  // This release supports one hop only; no chain or cycle can be expanded.
  if (target.urn === entry.urn || leadingSee(target) ||
      typeof target.definition !== "string" || !target.definition.trim()) return null;
  return target;
}

export function referencedEntries(entry, dictionary) {
  if (!dictionary) return [];
  const direct = referencedEntry(entry, dictionary);
  if (direct) return [{target:direct, kind:"direct"}];
  const body = leadingSee(entry);
  let match, requests;
  if ((match = /^See\s+([\p{Script=Greek}\p{M}]+)\s+(\d+(?:\.[a-z])?)\.$/u.exec(body))) {
    requests = [{headword:match[1], kind:"sense", sense:match[2]}];
  } else if ((match = /^See under\s+([\p{Script=Greek}\p{M}]+)\.$/u.exec(body))) {
    requests = [{headword:match[1], kind:"under"}];
  } else if ((match = /^See\s+([\p{Script=Greek}\p{M}]+-)\.$/u.exec(body))) {
    requests = [{headword:match[1], kind:"prefix"}];
  } else if ((match = /^See\s+([\p{Script=Greek}\p{M}]+),\s+([\p{Script=Greek}\p{M}]+)\.$/u.exec(body))) {
    requests = match.slice(1).map(headword => ({headword, kind:"multiple"}));
  } else return [];
  const links = requests.map(({headword, ...qualifier}) => ({
    ...qualifier, target:exactReferenceTarget(entry, dictionary, headword)
  }));
  // Keep multiple references intact: do not present only a resolvable subset.
  return links.every(link => link.target) ? links : [];
}

export function referenceLabel(link) {
  const name = link.target.headword;
  if (link.kind === "sense") return `Open referenced entry: ${name} — source specifies sense ${link.sense}; full entry shown`;
  if (link.kind === "under") return `Open entry referenced by “See under”: ${name}`;
  if (link.kind === "prefix") return `Open referenced prefix entry: ${name}`;
  return "Open referenced entry: " + name;
}

// Opening equations only: ignore equations in citations, bracketed notes,
// numbered senses, prose-qualified openings and multiword expansions.
function openingEquation(entry) {
  if (typeof entry.definition !== "string" || !entry.definition.startsWith(entry.headword)) return null;
  const body = entry.definition.slice(entry.headword.length).trim();
  let depth = 0, position = -1;
  for (let i = 0; i < body.length; i++) {
    if (body[i] === "[") depth++;
    if (body[i] === "]" && --depth < 0) return null;
    if (body[i] === "=" && depth === 0) { position = i; break; }
  }
  if (position < 0 || position > 180) return null;
  const prefix = body.slice(0, position);
  if (/\b(?:Il|Od)\./u.test(prefix)) return null;
  const outside = prefix.replace(/\[[^\[\]]*\]/gu, "").trim();
  if (/[A-Za-z0-9]/u.test(outside) || !/^[\p{Script=Greek}\p{M}\s,.;:·()\-]*$/u.test(outside)) return null;
  const after = body.slice(position + 1).trim();
  const match = /^([\p{Script=Greek}\p{M}]+\d*)(?=$|[\s.,:;])/u.exec(after);
  if (!match) return null;
  const tail = after.slice(match[1].length);
  if (/^\s+[\p{Script=Greek}\p{M}]/u.test(tail)) return null;
  // Keep the exact printed qualifier (including parentheses/lettered forms).
  const sense = /^\s*(?:\.\s*)?(\(\d+(?:\.[a-z])?\)|\d+(?:\.[a-z])?)(?=$|[\s.,:;])/u.exec(tail)?.[1];
  return {headword:match[1], kind:"equals", ...(sense ? {sense} : {})};
}

function navigationLinks(entry, dictionary) {
  const equation = openingEquation(entry);
  if (equation) {
    const targets = dictionary.entries.get(lemmaKey(equation.headword)) ?? [];
    if (targets.length !== 1 || !targets[0].definition?.trim()) return [];
    return [{...equation, target:targets[0]}];
  }
  const links = referencedEntries(entry, dictionary);
  if (links.length) return links;
  // Explicit See chains are expanded one visible step at a time by referenceTree.
  const match = /^See\s+([\p{Script=Greek}\p{M}]+\d*)\.?$/u.exec(leadingSee(entry));
  const targets = match ? dictionary.entries.get(lemmaKey(match[1])) ?? [] : [];
  return targets.length === 1 && targets[0].definition?.trim() ? [{kind:"direct", target:targets[0]}] : [];
}

export function referenceTree(entry, dictionary, maxDepth = 4) {
  if (!dictionary) return [];
  // The hard ceiling also protects callers from accidentally unbounded trees.
  const limit = Math.max(0, Math.min(8, Math.floor(maxDepth) || 0));
  function expand(source, visited, depth) {
    return navigationLinks(source, dictionary).map(link => {
      if (visited.has(link.target.urn)) return {...link, stop:"cycle", children:[]};
      if (depth >= limit) return {...link, stop:"limit", children:[]};
      return {...link, children:expand(link.target, new Set([...visited, link.target.urn]), depth + 1)};
    });
  }
  return expand(entry, new Set([entry.urn]), 0);
}


export function entryPreview(definition, limit = 220) {
  let numbered = /(?:^|\s)1\s+(?=[A-Z])/u.exec(definition);
  let type = numbered ? "First sense · Cunliffe excerpt" : "Cunliffe entry excerpt";
  const fallback = () => ({text:"", truncated:false, type:"Cunliffe entry excerpt"});
  const outsideBrackets = index => {
    let square = 0, round = 0;
    for (const ch of definition.slice(0, index)) {
      if (ch === "[") square++;
      if (ch === "]") square--;
      if (ch === "(") round++;
      if (ch === ")") round--;
    }
    return square === 0 && round === 0;
  };
  const lettered = [...definition.matchAll(/(?:^|\s)1\s+a\s+(?=[A-Z])/gu)]
    .find(match => outsideBrackets(match.index));
  // Keep explicit reference previews and their controls separate from extraction.
  // Inspect the existing excerpt below before accepting a new boundary.
  const extract = start => {
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
    return {text:source.slice(0,end).trim(), truncated:end < source.length};
  };
  const old = extract(numbered ? numbered.index + numbered[0].length : 0);
  if (/\bSee\b|=/u.test(old.text)) return {...old, type};
  if (lettered && (!numbered || lettered.index < numbered.index)) {
    const prefix = definition.slice(0, lettered.index).replace(/\[[^\]]*\]/gu, "");
    // A Roman heading may restrict the section: retain the existing display.
    if (!/(?:^|\s)[IVX]+(?:\.|\s)/u.test(prefix)) {
      const candidate = extract(lettered.index + lettered[0].length);
      if (!candidate.text || /^(?:In act\.|In mid\.|In pass\.|In sense\b|Like\b|With\b|Used\b|Of\b)/u.test(candidate.text)) return fallback();
      numbered = lettered;
      type = "Opening numbered section · source excerpt";
    }
  }
  const start = numbered ? numbered.index + numbered[0].length : 0;
  const preview = extract(start);
  if ((preview.text.match(/\[/gu)?.length ?? 0) !== (preview.text.match(/\]/gu)?.length ?? 0)) return fallback();
  // Narrow unnumbered form-list fallback: multiple case labels, citations
  // interrupting the forms, and the preview itself still shows a case label.
  // Do not hide inline lists that already reach a definition before any citation.
  const cases = [...definition.matchAll(/\b(?:Genit|Dat|Acc|Voc|Nom)\./gu)];
  const firstCitation = /\b(?:Il|Od)\.\s*\d/u.exec(definition);
  if (!numbered && !lettered && /^[†‡]*\p{Script=Greek}/u.test(definition) &&
      cases.length >= 3 && firstCitation && firstCitation.index < cases[1].index &&
      /\b(?:Genit|Dat|Acc|Voc|Nom)\./u.test(preview.text)) return fallback();
  return {...preview, type};
}
