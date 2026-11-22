import {bookLoadMessage} from "./reader-errors.mjs";
import {searchSmyth, smythForWord} from "./smyth.mjs";
import {atlasHeadword, entryUrl, lemmaKey, parseCunliffe, entryPreview, referenceTree, referenceLabel} from "./lexicon.mjs";
import {agreement, readableMorphology, readableRelation} from "./grammar.mjs";
import {drawDiagram} from "./diagram.mjs";
import {buildGraph, descendants, displayGreek, verseRef} from "./graph.mjs";

const $ = id => document.getElementById(id);
const titles = {iliad: "Iliad", odyssey: "Odyssey"};
const pageSize = 12;
const mobile = matchMedia("(max-width: 720px)");
let request = 0;
let state;
let cached;
let showAll = false;
let dictionary;
let currentLemma;
let lexicalWordSelected = false;
let dictionaryRequest;
let citationRequest;
let dictionaryFailed = false;
const text = (tag, value, parent) => {
  const element = document.createElement(tag);
  element.textContent = value;
  parent.append(element);
  return element;
};

for (let n = 1; n <= 24; n++) $("book").add(new Option(n, n));

function passage(work, book, line) {
  return "#" + new URLSearchParams({work, book, line});
}

function route() {
  const hash = new URLSearchParams(location.hash.slice(1));
  const candidate = hash.get("work");
  const work = Object.hasOwn(titles, candidate) ? candidate : "iliad";
  const book = Number(hash.get("book"));
  const line = Number(hash.get("line"));
  return {work, book: Number.isInteger(book) && book >= 1 && book <= 24 ? book : 1,
    line: line === Infinity || (Number.isInteger(line) && line >= 1) ? line : 1};
}

function greekButton(word, sid, parent, isVerse) {
  const button = text("button", displayGreek(word.form), parent);
  button.className = "token greek";
  button.lang = "grc";
  button.dataset.sentence = sid;
  button.dataset.token = word.id;
  button.setAttribute("aria-pressed", "false");
  button.onclick = () => {
    inspect(sid, word.id);
    if (isVerse && mobile.matches) $("analysis").focus();
    if (!isVerse) $("syntax").querySelector("[aria-pressed=true]")?.focus();
  };
  return button;
}

function externalLink(parent, title, url) {
  const link = text("a", title, parent);
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
}

function renderSmythLinks(parent, topics) {
  for (const topic of topics) {
    const row = text("li", "", parent);
    externalLink(row, "§ " + topic.section + " · " + topic.title, topic.url);
  }
}

function renderSmythIndex() {
  const list = $("smyth-results");
  list.replaceChildren();
  const topics = searchSmyth($("smyth-search").value);
  if (topics.length) renderSmythLinks(list, topics);
  else text("li", "No matching topics in this reference index.", list);
}

$("smyth-search").oninput = renderSmythIndex;
renderSmythIndex();

function renderSmythContext(word) {
  const panel = $("smyth-context");
  panel.replaceChildren();
  const topics = word ? smythForWord(word) : [];
  if (!topics.length) return;
  const details = text("details", "", panel);
  text("summary", "Smyth grammar references", details);
  renderSmythLinks(text("ul", "", details), topics);
  if (topics.some(topic => topic.kind !== "citation")) text("em", "General guidance based on the recorded form or relationship; these links do not identify a specific use in this passage.", text("p", "", details));
  if (topics.some(topic => topic.id === "motion")) {
    text("p", "Smyth cites this very phrase from Iliad 1.3 in § 1475.", details);
  }
}

function dictionaryText(definition) {
  const template = document.createElement("template");
  template.innerHTML = typeof definition === "string" ? definition.trim() : "";
  for (const node of template.content.querySelectorAll("script, style")) node.remove();
  return template.content.textContent.trim();
}

function renderReferences(entry, links, parent) {
  for (const link of links) {
    const target = link.target;
    if (link.stop) {
      text("p", link.stop === "cycle"
        ? `The reference points back to ${target.headword}, already shown above. No further expansion is needed.`
        : `Further expansion stops here to keep the reference path manageable. You can open ${target.headword} on Scaife ATLAS.`, parent);
      if (link.stop === "limit") externalLink(parent, "Full entry on Scaife ATLAS", entryUrl(target.urn));
      continue;
    }
    const reference = text("details", "", parent);
    reference.className = "dictionary-reference";
    reference.dataset.sourceUrn = entry.urn;
    reference.dataset.targetUrn = target.urn;
    text("summary", referenceLabel(link), reference);
    text("h4", target.headword, reference).lang = "grc";
    if (link.kind === "equals" && link.sense) {
      text("p", `The original entry specifies sense ${link.sense}. The full referenced entry is shown; no meaning has been selected for this passage.`, reference);
    }
    text("p", dictionaryText(target.definition), reference);
    externalLink(reference, "Referenced entry on Scaife ATLAS", entryUrl(target.urn));
    renderReferences(target, link.children, reference);
  }
}

function renderDictionary(lemma, selected = lexicalWordSelected) {
  lexicalWordSelected = selected;
  currentLemma = lemma;
  const panel = $("dictionary");
  panel.replaceChildren();
  if (!selected) return;
  if (!lemma) {
    text("h3", "Dictionary", panel);
    text("p", "The treebank supplies no lemma for this token, so a dictionary entry could not be matched.", panel);
    return;
  }
  if (!/\p{Script=Greek}/u.test(lemma)) return;
  text("h3", "Cunliffe", panel);

  const entries = dictionary?.entries.get(lemmaKey(lemma)) ?? [];
  for (const entry of entries) {
    const heading = text("h4", entry.headword, panel);
    heading.lang = "grc";
    const original = dictionaryText(entry.definition);
    let emptyExcerpt = false;
    if (original) {
      const preview = entryPreview(original);
      emptyExcerpt = !preview.text;
      if (!emptyExcerpt) {
        text("small", preview.type, panel);
        text("p", preview.text + (preview.truncated ? "…" : ""), panel);
      }
    } else {
      text("p", "This entry has no definition text.", panel);
    }
    const details = text("details", "", panel);
    text("summary", emptyExcerpt ? "Open the full entry" : "Full Cunliffe entry", details);
    if (original) text("p", original, details);
    externalLink(details, "Full entry on Scaife ATLAS", entryUrl(entry.urn));
    renderReferences(entry, referenceTree(entry, dictionary), panel);
  }
  if (!dictionary && !dictionaryFailed) {
    text("p", "Loading dictionary…", panel);
    dictionaryRequest ??= fetch("data/cunliffe.jsonl").then(response => {
      if (!response.ok) throw new Error("Dictionary unavailable");
      return response.text();
    }).then(source => {
      dictionary = parseCunliffe(source);
    }).catch(() => {
      dictionaryFailed = true;
    }).then(() => renderDictionary(currentLemma));
  }
  if (!entries.length) {
    if (dictionaryFailed) {
      text("p", "The local dictionary could not be loaded.", panel);
      const retry = text("button", "Retry dictionary", panel);
      retry.onclick = () => {
        dictionaryFailed = false;
        dictionaryRequest = undefined;
        renderDictionary(currentLemma);
      };
    }
    if (dictionary) text("p", "No exact Cunliffe headword match.", panel);
    externalLink(panel, "Look up lemma on Scaife ATLAS", atlasHeadword(lemma));
  }
}

function inspect(sid, tid) {
  const sentence = state.data.sentences[sid];
  const graph = buildGraph(sentence.words);
  const word = graph.byId.get(tid);
  renderDictionary(word?.lemma, Boolean(word && !word.artificial && !word.postag?.startsWith("u")));
  renderSmythContext(word);
  const selected = word ? descendants(graph, tid) : new Set();
  const info = $("word");
  info.replaceChildren();
  if (word) {
    const form = text("strong", displayGreek(word.form), info);
    form.lang = "grc";
    form.className = "greek";
    text("p", word.lemma ? "Lemma · " + displayGreek(word.lemma) : "Lemma unavailable", info);
    text("p", "Morphology · " + readableMorphology(word), info);
    text("p", "Relation · " + readableRelation(word), info);
    if (word.artificial) text("p", "Artificial node supplied by AGDT", info);
    const head = graph.byId.get(word.head);
    if (agreement(word, head)?.kind === "tag-mismatch") {
      text("p", "Adjective modifier · source gender tags differ", info);
    }

  }

  const syntax = $("syntax");
  const left = syntax.querySelector(".diagram-scroll")?.scrollLeft ?? 0;
  syntax.replaceChildren();
  text("h3", "Dependencies · " + sentence.source.subdoc, syntax);
  text("p", "Above the Greek, solid arrows run from subject to verb and from verb to accusative object. Below it, dashed arrows show agreement or a possible relative antecedent. Dotted lines mark recorded nominative attributes of subjects or adjective links with conflicting gender tags.", syntax);
  const toggle = text("label", "", syntax);
  const checkbox = text("input", "", toggle);
  checkbox.type = "checkbox";
  checkbox.checked = showAll;
  toggle.append("Show additional dependency arrows");
  checkbox.onchange = () => {
    showAll = checkbox.checked;
    inspect(sid, tid);
    syntax.querySelector("input").focus();
  };
  const strip = drawDiagram(syntax, sentence.words, selected,
    (token, cell) => greekButton(token, sid, cell, false), displayGreek, showAll);
  strip.scrollLeft = left;
  for (const button of document.querySelectorAll("[data-token]")) {
    const sameSentence = button.dataset.sentence === sid;
    const active = sameSentence && button.dataset.token === tid;
    button.setAttribute("aria-pressed", String(active));
    button.classList.toggle("dependent", sameSentence && !active && selected.has(button.dataset.token));
  }
  const current = syntax.querySelector("[aria-pressed=true]");
  if (current) {
    const bounds = strip.getBoundingClientRect();
    const token = current.getBoundingClientRect();
    if (token.right > bounds.right || token.left < bounds.left) {
      strip.scrollLeft += token.left - bounds.left - bounds.width / 2;
    }
  }
}

async function renderHomerCitations(work, book, lines, sequence) {
  const panel = $("homer-citations");
  const list = $("homer-citation-list");
  panel.hidden = true;
  list.replaceChildren();
  try {
    citationRequest ??= fetch("data/smyth-homer.json").then(response => {
      if (!response.ok) throw new Error("Citation index unavailable");
      return response.json();
    }).catch(error => {
      citationRequest = undefined;
      throw error;
    });
    const index = await citationRequest;
    if (sequence !== request) return;
    for (const number of lines) {
      const ref = book + "." + number;
      const anchors = index.verses[work][ref];
      if (!anchors) continue;
      const row = text("li", ref + " · ", list);
      anchors.forEach((anchor, index) => {
        if (index) row.append(", ");
        externalLink(row, /^s\d+$/u.test(anchor) ? "§ " + anchor.slice(1) : "Smyth example",
          "smyth.html#" + anchor);
      });
    }
    panel.hidden = !list.childElementCount;
  } catch {
    if (sequence === request) {
      text("li", "Could not load the local citation index.", list);
      panel.hidden = false;
    }
  }
}

function render({work, book, line, data}) {
  const lines = Object.keys(data.lines).map(Number).sort((a, b) => a - b);
  if (line > lines.at(-1)) {
    line = lines.at(-1);
    history.replaceState(null, "", passage(work, book, line));
    $("line").value = line;
  }
  const index = lines.findIndex(number => number >= line);
  const start = index < 0 ? Math.max(0, lines.length - pageSize) : index;
  $("status").textContent = data.lines[line] ? "" : "Verse " + book + "." + line + " is absent from the source verse index. Showing nearby lines.";
  $("heading").textContent = titles[work] + " · Book " + book;
  const verseArea = $("verses");
  verseArea.replaceChildren();
  const page = lines.slice(start, start + pageSize);
  renderHomerCitations(work, book, page, request);
  for (const number of page) {
    const row = text("div", "", verseArea);
    row.className = "verse";
    const label = text("span", book + "." + number, row);
    label.className = "verse-number";
    if (number === line) label.setAttribute("aria-current", "location");
    const words = text("div", "", row);
    words.className = "greek";
    for (const [sid, tid] of data.lines[number]) {
      const word = data.sentences[sid].words.find(token => token.id === tid);
      if (words.childNodes.length && !/^[,.;·!?]/u.test(word.form)) words.append(" ");
      greekButton(word, sid, words, true);
    }
  }
  const placed = new Map();
  for (const [sid, tid] of Object.values(data.lines).flat()) {
    if (!placed.has(sid)) placed.set(sid, new Set());
    placed.get(sid).add(tid);
  }
  const select = $("uncertain");
  select.replaceChildren();
  for (const [sid, sentence] of Object.entries(data.sentences)) {
    if (sentence.words.some(word => !word.artificial && !verseRef(word) && !placed.get(sid)?.has(word.id))) {
      select.add(new Option(sentence.source.subdoc + " · AGDT ID " + sid, sid));
    }
  }
  $("unplaced").hidden = !select.options.length;
  $("inspect").onclick = () => {
    inspect(select.value);
    if (mobile.matches) $("analysis").focus();
  };
  $("previous").disabled = start === 0;
  $("next").disabled = start + pageSize >= lines.length;
  $("previous").onclick = () => { location.hash = passage(work, book, lines[Math.max(0, start - pageSize)]); };
  $("next").onclick = () => { location.hash = passage(work, book, lines[start + pageSize]); };
}

async function load() {
  const sequence = ++request;
  const location = route();
  const {work, book, line} = location;
  $("work").value = work;
  $("book").value = book;
  $("line").value = line;
  $("status").textContent = "Loading book…";
  $("verses").replaceChildren();
  $("homer-citations").hidden = true;
  $("unplaced").hidden = true;
  $("previous").disabled = $("next").disabled = true;
  $("word").textContent = "Select a Greek word to inspect its morphology and dependencies.";
  $("syntax").replaceChildren();
  renderDictionary(undefined, false);
  renderSmythContext();
  try {
    if (cached?.work !== work || cached.book !== book) {
      const response = await fetch("data/" + work + "/" + book + ".json");
      if (!response.ok) throw new Error("HTTP " + response.status);
      const data = await response.json();
      if (sequence !== request) return;
      cached = {work, book, data};
    }
    state = {...location, data: cached.data};
    render(state);
  } catch (error) {
    if (sequence === request) $("status").textContent = bookLoadMessage(window.location.protocol);
  }
}

$("passage").onsubmit = event => {
  event.preventDefault();
  const hash = passage($("work").value, $("book").value, $("line").value);
  if (location.hash === hash) load();
  else location.hash = hash;
};
window.addEventListener("hashchange", load);
load();

