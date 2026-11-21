# Data provenance and license

The reader uses the two original XML attachments from *Assess Concept Build Project*. Both declare Ancient Greek Dependency Treebank version 2.1, released 25 September 2015. Their headers cite the AGDT syntactic annotation guidelines v1.1. The converted corpus is attributed to the Perseus Digital Library, Tufts University, and the release editors and annotators named in each retained header. See [AGLDT project](https://perseusdl.github.io/treebank_data/) and [Perseus Treebank Data repository](https://github.com/PerseusDL/treebank_data).

| Work | Attached source | SHA-256 |
| --- | --- | --- |
| Iliad | [tlg0012.tlg001.perseus-grc1.tb.xml](https://github.com/PerseusDL/treebank_data/blob/master/v2.1/Greek/texts/tlg0012.tlg001.perseus-grc1.tb.xml) | `1a7cacbc9460a7acce4a6c7004007619dd8acf1f6e210b3d9f8a3d3e2518c8d9` |
| Odyssey | [tlg0012.tlg002.perseus-grc1.tb.xml](https://github.com/PerseusDL/treebank_data/blob/master/v2.1/Greek/texts/tlg0012.tlg002.perseus-grc1.tb.xml) | `e936cc7d0bb3fe61cd0ca83b047e745b495668d12fefe7d4e434d3818febd31d` |

The source headers identify *Homeri Opera in five volumes* (Oxford University Press, 1920) and *The Odyssey with an English Translation by A. T. Murray* (Harvard University Press and William Heinemann, 1919). The XML headers note that annotators may have chosen textual variants. Full credits and edition statements are in `data/iliad/header.xml` and `data/odyssey/header.xml`.

The Perseus repository credits the Perseus Digital Library, Tufts University, copyright 2014, and states that repository contents are licensed under [Creative Commons Attribution-ShareAlike 3.0 United States](https://creativecommons.org/licenses/by-sa/3.0/us/). The converted corpus under `data/` is distributed under that same license. This adaptation serializes sentence and token attributes to JSON, groups them by book, and builds verse indexes. The display associates eligible uncited punctuation with the preceding explicit verse in its sentence. Original attributes and credits are retained. [License legal code](https://creativecommons.org/licenses/by-sa/3.0/us/legalcode).

## Remaining rights questions

- Before public hosting, confirm the exact upstream revision corresponding to the two uploaded checksums and whether either XML file or its underlying digitized edition has an additional file-specific notice. The linked repository paths identify the upstream counterparts. Byte parity with a pinned revision was not checked.
- Verify the license of each digital edition used for future Cunliffe, Smyth, commentary or meter integration, including attribution, jurisdiction, and compatibility with the intended distribution. Those resources are outside this package.

## Cunliffe dictionary

Richard John Cunliffe, *A Lexicon of the Homeric Dialect* (1924). The bundled Scaife ATLAS export is the user's downloaded copy of entries_01.jsonl. It is included byte-for-byte as data/cunliffe.jsonl.

- [Scaife Cunliffe data and metadata](https://github.com/scaife-viewer/atlas-data-prep/tree/main/test-data/dictionaries/cunliffe-1-lex)
- [Scaife repository MIT notice, copyright 2024 Perseus Digital Library](https://github.com/scaife-viewer/atlas-data-prep/blob/main/LICENSE). A copy is included in data/CUNLIFFE-LICENSE.txt.
- SHA-256 f1b6da0e0d19a930fa92c26a133d472d1da2d3e22f9b13962db034959a7c4362. The upstream commit was not pinned.

## Smyth offline grammar

Herbert Weir Smyth, *A Greek Grammar for Colleges* (1920). The supplied Alpheios Unicode TEI edition derives from the Perseus Project transcription, with corrections and formatting by Alpheios. The reader adapts the XML body into local HTML and a section search index. It preserves source section IDs, text, tables and resolvable internal references. Print-page markers are omitted from display.

- [Alpheios source XML](https://github.com/alpheios-project/grammar-smyth/blob/master/src/smyth_eng_u.xml)
- [Alpheios credits and reuse notice](https://github.com/alpheios-project/grammar-smyth#credits-and-reuse)
- The grammar adaptation retains the source edition's [CC BY-NC-SA 3.0 US license](https://creativecommons.org/licenses/by-nc-sa/3.0/us/).
- Supplied XML SHA-256 is `3d5ba15fe7d3449def129f5f83c92f96718177f7aba2bdeffa8bb64bf1a39d8e`. The upstream commit was not pinned.
