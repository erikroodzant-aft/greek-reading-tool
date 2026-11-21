export const smythSource = {
  id: "smyth-1920", author: "Herbert Weir Smyth",
  title: "A Greek Grammar for Colleges", edition: "1920 · Perseus / Alpheios"
};

function fold(text) {
  let value = "";
  const offsets = [];
  for (let start = 0; start < text.length;) {
    const cluster = text.slice(start).match(/^.\p{M}*/u)[0];
    const normalized = cluster.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/ς/gu, "σ");
    for (const character of normalized) {
      value += character;
      offsets.push([start, start + cluster.length]);
    }
    start += cluster.length;
  }
  return {value, offsets};
}

function tokens(text) {
  return [...text.matchAll(/[\p{L}\p{N}]+/gu)].map(match => ({word:match[0], start:match.index, end:match.index + match[0].length}));
}

export function prepareSections(index, source = smythSource) {
  return index.map(([section, text]) => {
    const normalized = fold(text);
    return {source, section, text, url:"smyth.html#s" + section, ...normalized, tokens:tokens(normalized.value)};
  });
}

export function searchSections(sections, query) {
  const normalized = fold(query).value;
  const terms = [...new Set(tokens(normalized).map(token => token.word))];
  if (!terms.length) return [];
  if (terms.length === 1 && /^\d+$/u.test(terms[0])) {
    return sections.filter(row => row.section === Number(terms[0])).map(row => ({...row, ranges:[], score:1}));
  }
  const phrases = [...normalized.matchAll(/"([^"]+)"/gu)].map(match => tokens(match[1]).map(t => t.word));
  const results = [];
  for (const row of sections) {
    const hits = row.tokens.filter(token => terms.includes(token.word));
    if (!terms.every(term => hits.some(hit => hit.word === term))) continue;
    const phraseAt = phrase => row.tokens.findIndex((_, i) => phrase.every((word, j) => row.tokens[i+j]?.word === word));
    if (!phrases.every(phrase => phraseAt(phrase) >= 0)) continue;
    let bestStart = hits[0].start;
    let span = Infinity;
    for (let left=0, right=0; left<hits.length; left++) {
      right = Math.max(right,left);
      while (right < hits.length && !terms.every(term => hits.slice(left,right+1).some(hit => hit.word === term))) right++;
      if (right === hits.length) break;
      const width = hits[right].end - hits[left].start;
      if (width < span) { span = width; bestStart = hits[left].start; }
    }
    const phrase = terms.length > 1 && phraseAt(tokens(normalized).map(t=>t.word)) >= 0;
    const ranges = hits.map(hit => [row.offsets[hit.start][0], row.offsets[hit.end-1][1]]);
    results.push({...row, ranges, excerptStart:row.offsets[bestStart][0],
      score:(phrase ? 1000 : 0) + 500/(1+span) + Math.min(hits.length,20)});
  }
  return results.sort((a,b)=>b.score-a.score || a.section-b.section);
}

export function excerpt(result, length = 260) {
  let start = Math.max(0,(result.excerptStart ?? 0)-70);
  let end = Math.min(result.text.length,start+length);
  if (start) {
    const space = result.text.indexOf(" ",start);
    if (space >= 0 && space < start+30) start=space+1;
  }
  if (end < result.text.length) {
    const space = result.text.lastIndexOf(" ",end);
    if (space > end-30) end=space;
  }
  return {text:result.text.slice(start,end), start, end,
    ranges:result.ranges.filter(([a,b])=>a>=start && b<=end).map(([a,b])=>[a-start,b-start])};
}

export function findSections(index, query) {
  return searchSections(prepareSections(index),query).map(row=>[row.section,row.text]);
}
