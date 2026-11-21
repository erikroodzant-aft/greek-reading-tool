export const topics = [
  {id:"subject", section:"906–908", title:"Subject and finite verb", keywords:"nominative person sentence"},
  {id:"attribute", section:"912–916", title:"Attributes, agreement, and apposition", keywords:"adjective participle noun gender number case"},
  {id:"predicate", section:"910–918", title:"Predicate nouns and adjectives", keywords:"predicate nominal copula"},
  {id:"object", section:"919–920", title:"Objects and transitive verbs", keywords:"accusative direct indirect"},
  {id:"vocative", section:"1283–1286", title:"Vocative and direct address", keywords:"goddess θεὰ"},
  {id:"genitive", section:"1339–1341", title:"Genitive with verbs and the partitive genitive", keywords:"argument part whole"},
  {id:"dative", section:"1460–1473", title:"Dative complements of verbs", keywords:"indirect object recipient"},
  {id:"motion", section:"1475", title:"Dative after verbs of motion", keywords:"Iliad 1.3 Hades Ἄϊδι προΐαψεν"},
  {id:"adverbial", section:"1606–1611", title:"Adverbial accusative", keywords:"adverb at first τὰ πρῶτα"},
  {id:"complement", section:"1613–1618", title:"Predicative accusative and object complements", keywords:"double accusative ἑλώρια"}
].map(topic => ({...topic, url:"smyth.html#s" + topic.section.split("–")[0]}));

const normalize = text => text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
export function searchSmyth(query) {
  const terms = normalize(query).match(/[\p{L}\p{N}.]+/gu) ?? [];
  return topics.filter(topic => terms.every(term =>
    /^\d+$/u.test(term)
      ? Number(term) >= Number(topic.section.split("–")[0]) && Number(term) <= Number(topic.section.split("–").at(-1))
      : normalize(topic.title + " " + topic.keywords).includes(term)));
}

export function smythForWord(word) {
  const role = word.relation?.split("_")[0];
  const tag = word.postag ?? "";
  const grammaticalCase = tag[7];
  const exact = word.cite === "urn:cts:greekLit:tlg0012.tlg001:1.3" &&
    (word.form?.normalize("NFC") === "Ἄϊδι" || word.form === "προΐαψεν");
  const ids = [];
  if (exact) ids.push("motion");
  if (role === "SBJ" || /^v...[ismo]/u.test(tag)) ids.push("subject");
  if (role === "ATR" || role === "APOS") ids.push("attribute");
  if (role === "PNOM") ids.push("predicate");
  if (role === "OBJ" && grammaticalCase === "a") ids.push("object");
  if (role === "OBJ" && grammaticalCase === "g") ids.push("genitive");
  if (role === "OBJ" && grammaticalCase === "d") ids.push("dative");
  if (role === "ADV" && grammaticalCase === "a") ids.push("adverbial");
  if (role === "OCOMP") ids.push("complement");
  if (grammaticalCase === "v") ids.push("vocative");
  return ids.map(id => topics.find(topic => topic.id === id));
}
