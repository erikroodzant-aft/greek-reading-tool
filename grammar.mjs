export const relation = word => word.relation.split("_")[0];
const nominal = word => /^[nap]/u.test(word?.postag ?? "");
const matches = (a, b, positions) => positions.every(index =>
  a[index] && a[index] !== "-" && a[index] === b[index]);

export function contextualMorphology(word) {
  if (word.cite === "urn:cts:greekLit:tlg0012.tlg001:1.3" &&
      word.form.normalize("NFC") === "Ἄϊδι" && word.postag === "---------") {
    return "masculine, singular, dative";
  }
  return "";
}

export function roleLabels(word) {
  const labels = [];
  const role = relation(word);
  if (role === "SBJ") labels.push("Subject");
  if (role === "OCOMP") labels.push("Object complement");
  const tag = word.postag ?? "";
  if (tag[7] === "n" && role === "ATR") labels.push("Attribute");
  if (role === "OBJ" && tag[7] === "a") labels.push("Object");
  if (tag[7] === "v") labels.push("Vocative");
  if (tag[0] === "v" && /^[ismon]$/u.test(tag[4] ?? "")) {
    labels.push(tag[4] === "n" ? "Infinitive" : "Verb");

  }
  return labels;
}

export function agreement(word, head, antecedent) {
  const tag = word.postag ?? "";
  if (nominal(head) && (tag[0] === "a" || (tag[0] === "v" && tag[4] === "p")) &&
      matches(tag, head.postag, [2, 6, 7])) {
    return {head: head.id, label: tag[0] === "a" ? "Adjective agreement" : "Participle agreement"};
  }
  if (tag[0] === "a" && nominal(head) && relation(word) === "ATR" &&
      matches(tag, head.postag, [2, 7]) && /^[mfn]$/u.test(tag[6] ?? "") &&
      /^[mfn]$/u.test(head.postag[6] ?? "")) {
    return {head: head.id, label: "Adjective modifier · source genders differ", kind: "tag-mismatch"};
  }
  const lemma = (word.lemma ?? "").normalize("NFD").replace(/\p{M}/gu, "");
  if (tag[0] === "p" && /^(ος|οσ|οσπερ|οστισ|οστις)$/u.test(lemma) &&
      head?.postag?.[0] === "v" && relation(head) === "ATR" &&
      nominal(antecedent) && matches(tag, antecedent.postag, [2, 6])) {
    return {head: antecedent.id, label: "Possible antecedent"};
  }
  return null;
}


const tense = [3, {p:"present", i:"imperfect", f:"future", a:"aorist", r:"perfect", l:"pluperfect", t:"future perfect"}];
const voice = [5, {a:"active", m:"middle", p:"passive", e:"middle/passive"}];
const mood = [4, {i:"indicative", s:"subjunctive", o:"optative", m:"imperative", n:"infinitive"}];
const person = [1, {1:"first person", 2:"second person", 3:"third person"}];
const number = [2, {s:"singular", d:"dual", p:"plural"}];
const grammaticalCase = [7, {n:"nominative", g:"genitive", d:"dative", a:"accusative", v:"vocative"}];
const gender = [6, {m:"masculine", f:"feminine", n:"neuter"}];

export function verbMorphology(tag) {
  if (tag?.[0] !== "v") return "";
  const fields = tag[4] === "p" ? [tense, voice, grammaticalCase, number, gender]
    : tag[4] === "n" ? [tense, voice, mood] : [tense, voice, mood, person, number];
  const prefix = tag[4] === "p" ? "Participle · " : "";
  return prefix + fields.map(([index, values]) => values[tag[index]] ?? "unspecified").join(", ");
}

export function syntaxArrow(word, head, showAdditional) {
  const role = relation(word);
  const grammaticalCase = word.postag?.[7];
  if (!head || contextualMorphology(word) || (role === "OBJ" && grammaticalCase === "d") ||
      (role === "ATR" && grammaticalCase === "g")) return null;
  if (head.postag?.[0] === "v") {
    if (role === "SBJ") return {from: word.id, to: head.id, kind: "core", label: "Subject to verb"};
    if (role === "OBJ" && grammaticalCase === "a") {
      return {from: head.id, to: word.id, kind: "core", label: "Verb to accusative object"};
    }
  }
  return showAdditional ? {from: head.id, to: word.id, kind: "context", label: readableRelation(word)} : null;
}


export function nominativeSubjectLink(word, head) {
  return word.postag?.[7] === "n" && relation(word) === "ATR" &&
    head?.id === word.head && head?.postag?.[7] === "n" && relation(head) === "SBJ";
}

export function coordinatedSubjectHead(word, head, byId) {
  if (word.relation !== "SBJ_CO" || head?.relation !== "COORD") return head;
  const visited = new Set([word.id]);
  let candidate = head;
  while (candidate?.relation === "COORD" && !visited.has(candidate.id)) {
    visited.add(candidate.id);
    candidate = byId.get(candidate.head);
  }
  return candidate?.postag?.[0] === "v" && !visited.has(candidate.id) ? candidate : head;
}

const partsOfSpeech = {
  a:"Adjective", c:"Conjunction", d:"Adverb", g:"Particle", i:"Interjection",
  l:"Article", m:"Numeral", n:"Noun", p:"Pronoun", r:"Preposition",
  u:"Punctuation", x:"Unclassified token"
};
const degree = [8, {c:"comparative", s:"superlative"}];

export function readableMorphology(word) {
  const contextual = contextualMorphology(word);
  if (contextual) return contextual + " (contextual reading; AGDT tag unspecified)";
  if (word.artificial) return "Supplied node (editorial)";
  const tag = word.postag ?? "";
  if (tag[0] === "v") return verbMorphology(tag);
  const part = partsOfSpeech[tag[0]];

  const fields = [gender, number, grammaticalCase, degree, tense, voice, mood, person]
    .map(([index, values]) => values[tag[index]]).filter(Boolean);
  return fields.length ? (part ? part + " · " : "Part of speech unspecified · ") + fields.join(", ") : part ?? "Unspecified";
}

const relations = {
  SBJ:"Subject", OBJ:"Object or other argument", PRED:"Predicate", ATR:"Attribute",
  ADV:"Adverbial dependent", APOS:"Apposition", COORD:"Coordination",
  ATV:"Secondary predicate attached to a nominal",
  AtvV:"Secondary predicate attached to a verb",
  OCOMP:"Object complement", PNOM:"Predicate nominal",
  AuxP:"Preposition", AuxC:"Subordinating conjunction",
  AuxG:"Editorial punctuation", AuxX:"Comma or internal punctuation",
  AuxK:"Sentence-ending punctuation", AuxY:"Sentence particle or structural connector",
  AuxZ:"Negation, focus, or similar particle", AuxV:"Auxiliary verb",
  ExD:"Detached element", XSEG:"Separate text segment", UNDEFINED:"Unspecified"
};

export function readableRelation(word) {
  const [base, ...suffixes] = (word.relation ?? "").split("_");
  let label = relations[base] ?? "Unspecified";
  if (base === "OBJ" && word.postag?.[7] === "a") label = "Object";
  if (base === "ExD" && word.postag?.[7] === "v") label = "Direct address";
  const notes = [];
  if (suffixes.includes("CO")) notes.push("coordinated");
  if (suffixes.includes("AP")) notes.push("part of an apposition");
  const detached = suffixes.indexOf("ExD");
  if (detached >= 0) {
    const extra = relations[suffixes[detached + 1]];
    notes.push(extra ? "detached construction · " + extra.toLowerCase() : "detached construction");
  }
  return notes.length ? label + " (" + notes.join(", ") + ")" : label;
}

