import {prepareSections, searchSections, excerpt, smythSource} from "./smyth-search.mjs";

const $ = id => document.getElementById(id);
let indexRequest;
let sequence = 0;
let results = [];
let shown = 0;
const more = document.createElement("button");
more.textContent = "More results";
more.hidden = true;
const moreItem = document.createElement("li");
moreItem.className = "more-results";
moreItem.append(more);
$("search-results").append(moreItem);
const metadata = document.createElement("p");
metadata.textContent = smythSource.author + " · " + smythSource.title + " · " + smythSource.edition;
$("text-search").after(metadata);

$("section-form").onsubmit = event => {
  event.preventDefault();
  const target = document.getElementById("s" + Number($("section-number").value));
  $("section-status").textContent = target ? "" : "Enter a section number from 1 to 3048.";
  if (target) { location.hash = target.id; target.scrollIntoView(); }
};

function appendResults() {
  for (const result of results.slice(shown,shown+20)) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = "#s" + result.section;
    link.textContent = "§ " + result.section;
    const quote = document.createElement("p");
    const part = excerpt(result);
    if (part.start) quote.append("…");
    let cursor = 0;
    for (const [start,end] of part.ranges) {
      quote.append(part.text.slice(cursor,start));
      const mark = document.createElement("mark");
      mark.textContent = part.text.slice(start,end);
      quote.append(mark);
      cursor = end;
    }
    quote.append(part.text.slice(cursor), part.end < result.text.length ? "…" : "");
    item.append(link,quote);
    $("search-results").insertBefore(item, moreItem);
  }
  shown = Math.min(results.length,shown+20);
  more.hidden = shown >= results.length;
}
more.onclick = appendResults;

$("text-search").onsubmit = async event => {
  event.preventDefault();
  const request = ++sequence;
  $("search-results").replaceChildren(moreItem);
  more.hidden = true;
  $("search-status").textContent = "Searching…";
  try {
    indexRequest ??= fetch("data/smyth-search.json").then(response => {
      if (!response.ok) throw new Error("Index unavailable");
      return response.json();
    }).then(prepareSections).catch(error => { indexRequest=undefined; throw error; });
    const sections = await indexRequest;
    if (request !== sequence) return;
    results = searchSections(sections,$("query").value);
    shown = 0;
    $("search-status").textContent = results.length ? results.length + " matching sections, ranked by relevance." : "No matching sections. Try fewer terms or remove quotation marks.";
    appendResults();
  } catch {
    if (request === sequence) $("search-status").textContent = "Could not load the local search index. Please try again.";
  }
};
