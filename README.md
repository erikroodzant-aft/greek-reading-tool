# Heleios

*A companion for reading ancient texts*

A Greek reader with the Iliad and Odyssey, word morphology, Cunliffe's lexicon, sentence dependency diagrams, and searchable Smyth grammar.

## Try the reader

Open [heleios.org](https://heleios.org/) and choose a work, book and line. All reading and reference data are included. External source links require an internet connection.

For local use, download and extract the repository, then open a terminal in this folder and run:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765/ and keep the terminal running while reading.

## Reading aids and limitations

- Cunliffe previews are automatically selected excerpts and may begin with forms, etymology or a cross-reference. Expand the full entry when a preview is unhelpful.
- Exact dictionary headword matching leaves some lemmas unmatched.
- Greek text and grammatical annotations preserve known gaps and anomalies in the supplied treebank.
- The phone layout supports a stacked word panel; a dedicated bottom-sheet interaction remains in the backlog.
- All 29 automated tests pass. Browser checks cover homepage navigation, line limits, word analysis, dictionary loading and Smyth search at desktop and phone-sized widths; testing on physical mobile devices remains pending.

## Sources and permissions

See [PROVENANCE.md](PROVENANCE.md) for edition credits, licenses and remaining source questions. The bundled Smyth transcription carries CC BY-NC-SA 3.0 US terms. The corpus and dictionary have their own notices. These source terms continue to apply to the included material.

No blanket license for the application code has been selected by the project owner.

## Checks

This checkout is the editable source. Build checked packages with `python package_release.py --output ..`; see [RELEASE-CHECKLIST.md](RELEASE-CHECKLIST.md). Generated folders are not independent working copies.

Run `node --test *.test.mjs` with a current Node installation. The corpus conversion can additionally be checked against the original XML inputs with `validate.py`.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the update and release process and [CHANGELOG.md](CHANGELOG.md) for the change history.

## GitHub Pages

The static application can be served from the repository root. After uploading, open repository Settings → Pages, choose Deploy from a branch, select the publishing branch and / (root), then save. GitHub displays the resulting website address.

## Cunliffe dictionary

Select a Greek word to look up its treebank lemma in the bundled Cunliffe dictionary. Open the headword to read the full definition. The dictionary is included with the site and downloadable package. Matching preserves accents. Where the lemma has no exact match, the panel links to Scaife ATLAS for lookup.

## Smyth grammar reference

Use **Open the full grammar** in the footer to read Smyth, search across all 3,048 numbered sections, or jump directly to a section number. When the selected word has a relevant reference, expand **Smyth grammar references** in the side panel. For example, Smyth § 1475 cites Iliad 1.3, where the verb of motion takes Ἄϊδι in the dative. Word-specific links open the Smyth text at the relevant section; the footer link opens the full text without a section fragment.

Expand **Smyth’s Greek Grammar** beneath any passage to open the full grammar. When the displayed verses are cited in Smyth, a **Citations for these verses** list appears below that link. In the grammar, click a linked Homer citation to open the verse in the reader. The links use explicitly marked citations and the manually verified Iliad 1.3 example. Unresolved source references are listed in the validation report.

## Dictionary previews and missing data

Word selection now shows a source excerpt before the full Cunliffe entry. Where an entry has a first numbered sense beginning with an English capital, the excerpt starts there. Other entries show their opening. Excerpts are limited in length and stop before an example colon or Homer citation where possible. These excerpts retain Cunliffe's wording and can contain grammatical notes. They are not context-selected senses.

Missing treebank lemmas, unmatched headwords, empty definition text and dictionary-loading failures have distinct messages. Load failures offer a retry. Punctuation and artificial nodes omit dictionary messages.
