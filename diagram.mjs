import {agreement, coordinatedSubjectHead, nominativeSubjectLink, roleLabels, syntaxArrow} from "./grammar.mjs";

const svgNS = "http://www.w3.org/2000/svg";

export function drawDiagram(parent, words, selected, makeButton, format, showAll) {
  const strip = document.createElement("div");
  strip.className = "diagram-scroll";
  strip.tabIndex = 0;
  strip.setAttribute("aria-label", "Scrollable dependency diagram");
  parent.append(strip);
  const canvas = document.createElement("div");
  canvas.className = "diagram";
  strip.append(canvas);

  let width = 12;
  const positions = new Map();
  for (const word of words) {
    const size = Math.max(roleLabels(word).includes("Object complement") ? 126 : 65, [...format(word.form)].length * 13 + 18);
    positions.set(word.id, {x: width + size / 2, size});
    width += size;
  }
  width += 12;
  const edges = [];
  const byId = new Map(words.map(word => [word.id, word]));
  function addEdge(fromId, toId, kind, label) {
    const from = positions.get(fromId)?.x;
    const to = positions.get(toId)?.x;
    if (from === undefined || from === to) return;
    edges.push({from, to, kind, label, active: selected.has(fromId) && selected.has(toId)});
  }
  for (const word of words) {
    const head = byId.get(word.head);
    const match = agreement(word, head, byId.get(head?.head));
    const subjectLink = nominativeSubjectLink(word, head);
    const arrow = syntaxArrow(word, coordinatedSubjectHead(word, head, byId), showAll && !subjectLink && match?.head !== word.head);
    if (arrow) addEdge(arrow.from, arrow.to, arrow.kind, arrow.label);
    if (subjectLink && !match) addEdge(head.id, word.id, "subject-attribute", "Nominative attribute of subject");
    if (match) addEdge(match.head, word.id, match.kind ?? "agreement", match.label);
  }
  canvas.style.width = width + "px";
  function drawArrows(arrows, below = false) {
    if (!arrows.length) return;
    const rise = edge => 22 + 15 * Math.log2(1 + Math.abs(edge.from - edge.to) / 48);
    const height = Math.ceil(Math.max(...arrows.map(rise))) + 15;
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    canvas.append(svg);
    for (const edge of arrows.sort((a, b) => rise(b) - rise(a))) {
      const {from, to, active} = edge;
      const top = height - rise(edge);
      const path = document.createElementNS(svgNS, "path");
      path.setAttribute("d", `M ${from},${height - 4} C ${from},${top} ${to},${top} ${to},${height - 9} M ${to - 4},${height - 15} L ${to},${height - 8} L ${to + 4},${height - 15}`);
      if (below) path.setAttribute("transform", `translate(0 ${height}) scale(1 -1)`);
      path.classList.add(edge.kind);
      if (active) path.classList.add("active");
      const title = document.createElementNS(svgNS, "title");
      title.textContent = edge.label;
      path.append(title);
      svg.append(path);
    }
  }

  drawArrows(edges.filter(edge => edge.kind === "core" || edge.kind === "context"));
  const row = document.createElement("div");
  row.className = "diagram-words";
  canvas.append(row);
  for (const word of words) {
    const cell = document.createElement("div");
    cell.style.width = positions.get(word.id).size + "px";
    row.append(cell);
    const roles = document.createElement("div");
    roles.className = "roles";
    cell.append(roles);
    for (const role of roleLabels(word)) {
      const badge = document.createElement("small");
      badge.className = "role " + role.toLowerCase().replaceAll(" ", "-");
      badge.textContent = role;
      roles.append(badge);
    }
    makeButton(word, cell);
    if (word.head === "0" || !positions.has(word.head) || word.head === word.id) {
      const note = document.createElement("small");
      note.textContent = word.head === "0" ? "Root" : word.head === word.id ? "Self-link" : "Missing head";
      cell.append(note);
    }
  }
  drawArrows(edges.filter(edge => edge.kind === "agreement" || edge.kind === "tag-mismatch" || edge.kind === "subject-attribute"), true);
  return strip;
}

