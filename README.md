# Greek Reading Tool

A work-in-progress Homeric Greek reader with the Iliad and Odyssey, word morphology, Cunliffe's lexicon, sentence dependency diagrams, and searchable offline Smyth grammar.

## Try the reader

If this repository is published with GitHub Pages, open its Pages address and choose a work, book and line. All reading and reference data are included. External source links require an internet connection.

For local use, download and extract the repository, then open a terminal in this folder and run:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765/ and keep the terminal running while reading.

## Preview limitations

- Cunliffe previews are automatically selected excerpts and may begin with forms, etymology or a cross-reference. Expand the full entry when a preview is unhelpful.
- Exact dictionary headword matching leaves some lemmas unmatched.
- Greek text and grammatical annotations preserve known gaps and anomalies in the supplied treebank.
- The phone layout is preliminary. The planned bottom sheet and visual refresh are in the backlog.
- Automated tests pass, but full browser and mobile release verification is still pending.

## Sources and permissions

See [PROVENANCE.md](PROVENANCE.md) for edition credits, licenses and remaining source questions. The bundled Smyth transcription carries CC BY-NC-SA 3.0 US terms. The corpus and dictionary have their own notices. These source terms continue to apply to the included material.

No blanket license for the application code has been selected by the project owner.

## Checks

Run `node --test *.test.mjs` with a current Node installation. The corpus conversion can additionally be checked against the original XML inputs with `validate.py`.

## GitHub Pages

The static application can be served from the repository root. After uploading, open repository Settings → Pages, choose Deploy from a branch, select the publishing branch and / (root), then save. GitHub displays the resulting website address.

## Cunliffe dictionary

Select a Greek word to look up its treebank lemma in the bundled Cunliffe dictionary. Open the headword to read the full definition. The reader loads the dictionary from the extracted folder and works offline. Matching preserves accents. Where the lemma has no exact match, the panel links to Scaife ATLAS for online lookup.

## Smyth grammar reference

Open **Smyth grammar reference** above the passage to search the selected index by topic or section number. When the selected word has a relevant reference, expand **Smyth grammar references** in the side panel. For example, Smyth § 1475 cites Iliad 1.3, where the verb of motion takes Ἄϊδι in the dative. Reference links open the bundled Smyth text at the section. **Open the full offline grammar** to search across all 3,048 numbered sections or jump directly to a number.

When the displayed verses are cited in Smyth, expand **Smyth citations for these verses** beneath the passage. In the offline grammar, click a linked Homer citation to open the verse in the reader. The links use explicitly marked citations and the manually verified Iliad 1.3 example. Unresolved source references are listed in the validation report.

## Dictionary previews and missing data

Word selection now shows a source excerpt before the full Cunliffe entry. Where an entry has a first numbered sense beginning with an English capital, the excerpt starts there. Other entries show their opening. Excerpts are limited in length and stop before an example colon or Homer citation where possible. These excerpts retain Cunliffe's wording and can contain grammatical notes. They are not context-selected senses.

Missing treebank lemmas, unmatched headwords, empty definition text and dictionary-loading failures have distinct messages. Load failures offer a retry. Punctuation and artificial nodes omit dictionary messages.
