const prepositions = [
  ["ἀμφί",1681],["ἀνά",1682],["ἀντί",1683],["ἀπό",1684],
  ["διά",1685],["εἰς",1686],["ἐν",1687],["ἐκ",1688],
  ["ἐπί",1689],["κατά",1690],["μετά",1691],["παρά",1692],
  ["περί",1693],["πρό",1694],["πρός",1695],["σύν",1696],
  ["ὑπέρ",1697],["ὑπό",1698]
];
const key = value => (value ?? "").trim().toLowerCase().normalize("NFC");
const prepositionIds = new Map(prepositions.map(([lemma]) => [key(lemma), "prep-" + lemma]));
// Only variants explicitly printed in the corresponding Smyth section.
for (const [variant,lemma] of [["ἐς","εἰς"],["ἐνί","ἐν"],["εἰν","ἐν"],["εἰνί","ἐν"],["ἐξ","ἐκ"],["ξύν","σύν"],["παραί","παρά"],["προτί","πρός"],["ποτί","πρός"],["ὑπείρ","ὑπέρ"],["ὑπαί","ὑπό"]]) {
  prepositionIds.set(key(variant), prepositionIds.get(lemma));
}
const listedPrepositions = new Map();
for (const lemma of ["ἀγχοῦ","ἄνευ","ἀντία","ἀντίον","ἄτερ","ἄχρι","μέχρι","δίκην","δίχα","ἐγγύς","εἴσω","ἔσω","ἑκάς","ἑκατέρωθεν","ἐκτός","ἔμπροσθεν","ἐναντίον","ἕνεκα","ἕνεκεν","εἵνεκα","εἵνεκεν","οὕνεκα","ἔνερθε","ἐντός","ἔξω","εὐθύ","καταντικρύ","κρύφα","λάθρᾳ","μεταξύ","νόσφι","ὄπισθεν","πάρος","πέλας","πέρα","πέραν","πλήν","πλησίον","πόρρω","πρόσω","πρίν","σχεδόν","τῆλε","χάριν","χωρίς"]) listedPrepositions.set(key(lemma), "prep-list-genitive");
for (const lemma of ["ἅμα","ὁμοῦ"]) listedPrepositions.set(key(lemma), "prep-list-dative");
listedPrepositions.set("ὡς", "prep-list-accusative");

const tenseGuidance = {
  p:{id:"present",name:"Present",section:"1875–1888"},
  i:{id:"imperfect",name:"Imperfect",section:"1889–1909"},
  f:{id:"future",name:"Future",section:"1910–1922"},
  a:{id:"aorist",name:"Aorist",section:"1923–1944"},
  r:{id:"perfect",name:"Perfect",section:"1945–1951"},
  l:{id:"pluperfect",name:"Pluperfect",section:"1952–1954"},
  t:{id:"future-perfect",name:"Future perfect",section:"1955–1958"}
};
const tenseByForm = {
  s:{name:"subjunctive",section:"1860"},
  o:{name:"optative",section:"1861–1863"},
  m:{name:"imperative",section:"1864"},
  n:{name:"infinitive",section:"1865–1871"},
  p:{name:"participle",section:"1872–1874"}
};

export const topics = [
  {id:"subject", section:"906–908", title:"Subject and finite verb", keywords:"nominative person sentence"},
  {id:"attribute", section:"912–916", title:"Attributes, agreement, and apposition", keywords:"adjective participle noun gender number case"},
  {id:"predicate", section:"910–918", title:"Predicate nouns and adjectives", keywords:"predicate nominal copula"},
  {id:"object", section:"919–920", title:"Objects and transitive verbs", keywords:"accusative direct indirect"},
  {id:"vocative", section:"1283–1286", title:"Vocative and direct address", keywords:"goddess θεὰ"},
  {id:"genitive", section:"1289", title:"Genitive: general introduction", keywords:"case genitive proper ablatival", kind:"word"},
  {id:"dative", section:"1450", title:"Dative: general introduction", keywords:"case instrumental locative", kind:"word"},
  {id:"accusative", section:"1551–1552", title:"Accusative: general introduction", keywords:"case", kind:"word"},
  {id:"dual", section:"999", title:"The dual", keywords:"number pair Homer", kind:"word"},
  {id:"subjunctive", section:"1795–1813", title:"Subjunctive: independent uses and overview", keywords:"mood", kind:"word"},
  {id:"optative", section:"1814–1834", title:"Optative: wishes and potential uses", keywords:"mood", kind:"word"},
  {id:"imperative", section:"1835–1844", title:"Imperative", keywords:"mood commands", kind:"word"},
  {id:"infinitive", section:"1966–1968", title:"Infinitive: general introduction", keywords:"verbal noun", kind:"word"},
  {id:"participle", section:"2039–2046", title:"Participle: general introduction", keywords:"verbal adjective", kind:"word"},
  ...Object.values(tenseGuidance).map(t => ({id:"tense-" + t.id,section:t.section,title:t.name + " indicative: tense and aspect",keywords:t.name + " tense",kind:"word"})),
  {id:"tense-overview",section:"1850–1859",title:"Tense and aspect: general overview",keywords:"verb tenses",kind:"word"},
  {id:"middle",section:"1713–1716",title:"Middle voice: general introduction",keywords:"voice middle",kind:"word"},
  {id:"passive",section:"1735",title:"Passive voice: general introduction",keywords:"voice passive",kind:"word"},
  {id:"prepositions", section:"1636–1647", title:"Prepositions: general guidance", keywords:"preposition", kind:"word"},
  {id:"prep-list-genitive", section:"1700", title:"Adverbial prepositions: individual listings", keywords:"prepositions genitive", kind:"word"},
  {id:"prep-list-dative", section:"1701", title:"Adverbial prepositions: ἅμα and ὁμοῦ", keywords:"prepositions dative", kind:"word"},
  {id:"prep-list-accusative", section:"1702", title:"Prepositional ὡς", keywords:"preposition accusative", kind:"word"},
  ...prepositions.map(([lemma,section]) => ({id:"prep-" + lemma, section:String(section), title:lemma + ": preposition", keywords:lemma, kind:"word"})),
  {id:"motion", section:"1475", title:"Dative after verbs of motion", keywords:"Iliad 1.3 Hades Ἄϊδι προΐαψεν", kind:"citation"},
  {id:"adverbial", section:"1606–1611", title:"Adverbial accusative", keywords:"adverb at first τὰ πρῶτα"},
  {id:"complement", section:"1613–1618", title:"Predicative accusative and object complements", keywords:"double accusative ἑλώρια"}
].map(topic => ({kind:"syntax", ...topic, ...(topic.id === "vocative" ? {kind:"word"} : {}), url:"smyth.html#s" + topic.section.split("–")[0]}));

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
  if (grammaticalCase === "g") ids.push("genitive");
  if (grammaticalCase === "d") ids.push("dative");
  if (grammaticalCase === "a") ids.push("accusative");
  if (grammaticalCase === "v") ids.push("vocative");
  if (tag[2] === "d") ids.push("dual");
  if (tag[0] === "v") {
    const topic = {s:"subjunctive",o:"optative",m:"imperative",n:"infinitive",p:"participle"}[tag[4]];
    if (topic) ids.push(topic);
    if (tenseGuidance[tag[3]]) ids.push("tense-" + tenseGuidance[tag[3]].id);
    if (tag[5] === "m") ids.push("middle");
    if (tag[5] === "p") ids.push("passive");
  }
  if (tag[0] === "r") ids.push(prepositionIds.get(key(word.lemma)) ?? listedPrepositions.get(key(word.lemma)) ?? "prepositions");
  if (role === "SBJ") ids.push("subject");
  if (role === "ATR" || role === "APOS") ids.push("attribute");
  if (role === "PNOM") ids.push("predicate");
  if (role === "OBJ" && grammaticalCase === "a") ids.push("object");
  if (role === "ADV" && grammaticalCase === "a") ids.push("adverbial");
  if (role === "OCOMP") ids.push("complement");
  return [...new Set(ids)].map(id => {
    const topic = topics.find(topic => topic.id === id);
    if (!id.startsWith("tense-") || id === "tense-overview" || tag[4] === "i") return topic;
    const form = tenseByForm[tag[4]];
    if (!form) return topics.find(t => t.id === "tense-overview");
    const tense = tenseGuidance[tag[3]];
    return {...topic, id:id + "-" + form.name, section:form.section,
      title:tense.name + " " + form.name + ": tense and aspect",
      url:"smyth.html#s" + form.section.split("–")[0]};
  });
}
