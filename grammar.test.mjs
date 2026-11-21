import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {agreement, contextualMorphology, coordinatedSubjectHead, readableMorphology, nominativeSubjectLink, roleLabels, syntaxArrow, verbMorphology} from "./grammar.mjs";

function sentence(work, id) {
  const data = JSON.parse(readFileSync(new URL("./data/" + work + "/1.json", import.meta.url)));
  return new Map(data.sentences[id].words.map(word => [word.id, word]));
}

test("Iliad opening labels coordinated verbs and cross-verse adjective agreement", () => {
  const words = sentence("iliad", "2274106");
  assert.deepEqual(roleLabels(words.get("1")), ["Object"]);
  assert.deepEqual(roleLabels(words.get("2")), ["Verb"]);
  assert.deepEqual(roleLabels(words.get("8")), ["Subject"]);
  assert.deepEqual(agreement(words.get("6"), words.get("1")), {head:"1", label:"Adjective agreement"});
});

test("Odyssey opening identifies a possible antecedent across different cases", () => {
  const words = sentence("odyssey", "2185541");
  assert.deepEqual(agreement(words.get("9"), words.get("12"), words.get("1")),
    {head:"1", label:"Possible antecedent"});
  assert.equal(agreement(words.get("9"), words.get("12"), words.get("5")), null);
});

test("participles require matching number, gender and case", () => {
  const word = {postag:"v-sapama-", relation:"ATR"};
  assert.deepEqual(agreement(word, {id:"1",postag:"n-s---ma-"}),
    {head:"1",label:"Participle agreement"});
  assert.equal(agreement(word, {id:"1",postag:"n-s---mg-"}), null);
});


test("Iliad opening distinguishes direct address and dative object from the accusative object", () => {
  const words = sentence("iliad", "2274106");
  assert.deepEqual(roleLabels(words.get("3")), ["Vocative"]);
  assert.deepEqual(roleLabels(words.get("10")), []);
  assert.deepEqual(roleLabels(words.get("11")), ["Object"]);
});

test("decodes the five verbal fields from the Iliad opening", () => {
  const words = sentence("iliad", "2274106");
  assert.equal(verbMorphology(words.get("12").postag), "aorist, active, indicative, third person, singular");
  assert.equal(verbMorphology(words.get("2").postag), "present, active, imperative, second person, singular");
  assert.equal(verbMorphology("v-sapama-"), "Participle · aorist, active, accusative, singular, masculine");
  assert.equal(verbMorphology("v--pna---"), "present, active, infinitive");
});

test("shows directed clause arrows and omits dative objects and genitive modifiers", () => {
  const iliad = sentence("iliad", "2274106");
  assert.deepEqual(syntaxArrow(iliad.get("11"), iliad.get("12")),
    {from:"12", to:"11", kind:"core", label:"Verb to accusative object"});
  assert.equal(syntaxArrow(iliad.get("10"), iliad.get("12"), true), null);
  assert.deepEqual(roleLabels(iliad.get("5")), []);
  assert.equal(syntaxArrow(iliad.get("5"), iliad.get("1"), true), null);
  const odyssey = sentence("odyssey", "2185541");
  assert.deepEqual(syntaxArrow(odyssey.get("9"), odyssey.get("12")),
    {from:"9", to:"12", kind:"core", label:"Subject to verb"});
});

test("accusative case alone does not give a token an object label or arrow", () => {
  const word = {id:"1", postag:"n-s---na-", relation:"ADV"};
  assert.deepEqual(roleLabels(word), []);
  assert.equal(syntaxArrow(word, {id:"2",postag:"v3saia---"}, false), null);
});

test("keeps the recorded Iliad adjective link visible despite conflicting gender tags", () => {
  const words = sentence("iliad", "2274106");
  assert.deepEqual(agreement(words.get("16"), words.get("17")),
    {head:"17", label:"Adjective modifier · source genders differ", kind:"tag-mismatch"});
  assert.deepEqual(agreement(words.get("14"), words.get("17")),
    {head:"17", label:"Adjective agreement"});
});


test("Iliad nominative attribute uses its source link without adding extra role labels", () => {
  const words = sentence("iliad", "2274106");
  assert.deepEqual(roleLabels(words.get("45")), ["Attribute"]);
  assert.deepEqual(roleLabels(words.get("43")), ["Subject"]);
  assert(nominativeSubjectLink(words.get("45"), words.get("43")));
  assert(!nominativeSubjectLink(words.get("45"), words.get("49")));
  assert.deepEqual(roleLabels(words.get("24")), ["Object complement"]);
  const adjective = words.get("40");
  assert.equal(readableMorphology(words.get("45")), "Noun · masculine, singular, nominative");
  assert.equal(readableMorphology(adjective), "Adjective · neuter, plural, accusative");
});


test("Iliad 1.3 distinguishes an editorial dative reading from the source OBJ annotation", () => {
  const words = sentence("iliad", "2274106");
  const word = words.get("18");
  assert.equal(word.relation, "OBJ");
  assert.equal(word.postag, "---------");
  assert.equal(contextualMorphology(word), "masculine, singular, dative");
  assert.deepEqual(roleLabels(word), []);
  assert.equal(syntaxArrow(word, words.get("19"), true), null);
});

test("coordinated Iliad subjects point to the verb governing their conjunction", () => {
  const words = sentence("iliad", "2274106");
  for (const id of ["43", "49"]) {
    const word = words.get(id);
    const verb = coordinatedSubjectHead(word, words.get(word.head), words);
    assert.equal(verb.id, "41");
    assert.deepEqual(syntaxArrow(word, verb, false),
      {from:id, to:"41", kind:"core", label:"Subject to verb"});
  }
});

test("the Object badge requires both accusative morphology and the OBJ relation", () => {
  const object = {relation:"OBJ_CO", postag:"n-p---fa-"};
  assert.deepEqual(roleLabels(object), ["Object"]);
  for (const postag of ["---------", "n-p---fd-", "n-p---fg-"]) {
    assert.deepEqual(roleLabels({...object, postag}), []);
  }
});


test("word panel decodes every morphology class and relation used in the Homer corpus", async () => {
  const {readableMorphology, readableRelation} = await import("./grammar.mjs");
  for (const work of ["iliad", "odyssey"]) {
    for (let book = 1; book <= 24; book++) {
      const data = JSON.parse(readFileSync(new URL("./data/" + work + "/" + book + ".json", import.meta.url)));
      for (const sentence of Object.values(data.sentences)) {
        for (const token of sentence.words) {
          const morphology = readableMorphology(token);
          assert(morphology !== "Unspecified" || !token.postag || token.postag === "---------");
          assert(readableRelation(token) !== "Unspecified" || token.relation === "UNDEFINED");
        }
      }
    }
  }
  assert.equal(readableMorphology({postag:"r--------"}), "Preposition");
  assert.equal(readableMorphology({postag:"a-p---nac"}), "Adjective · neuter, plural, accusative, comparative");
  assert.equal(readableRelation({relation:"OBJ",postag:"n-s---md-"}), "Object or other argument");
});

