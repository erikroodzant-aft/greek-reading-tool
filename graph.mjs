export function buildGraph(words) {
  const byId = new Map(words.map(word => [word.id, word]));
  const children = new Map();
  for (const word of words) {
    if (!children.has(word.head)) children.set(word.head, []);
    children.get(word.head).push(word);
  }
  return {byId, children};
}

export function descendants(graph, id) {
  const seen = new Set([id]);
  const stack = [id];
  while (stack.length) {
    for (const child of graph.children.get(stack.pop()) ?? []) {
      if (seen.has(child.id)) continue;
      seen.add(child.id);
      stack.push(child.id);
    }
  }
  return seen;
}

export function verseRef(word) {
  return word.cite?.match(/^urn:cts:greekLit:tlg0012\.tlg00[12]:(\d+\.\d+)$/u)?.[1] ?? "";
}


export function displayGreek(form) {
  return form.replace(/(\p{Script=Greek})\u0313$/u, "$1’").normalize("NFC");
}
