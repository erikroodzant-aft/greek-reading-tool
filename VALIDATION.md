# Heleios validation report

The reader includes all 24 books of each epic as represented by the two uploaded Perseus AGDT v2.1 XML files. The earlier demo and importer ZIPs were mentioned in the prior chat but their files were unavailable. This package reconstructs the responsive reader, passage navigation and word/syntax panel. The dictionary integration is documented below. Smyth, commentary and meter are outside this package.

| Source and index checks | Iliad | Odyssey |
| --- | ---: | ---: |
| Books loaded into the reader | 24 | 24 |
| Sentence records | 8,415 | 6,723 |
| Token records, including artificial nodes | 130,479 | 105,612 |
| Artificial nodes | 2,377 | 1,375 |
| Explicit single-verse citations verified | 112,572 | 87,400 |
| Indexed verse labels | 15,682 | 12,057 |
| Sentences spanning multiple explicit verses | 5,620 | 4,262 |
| Dependency edges between explicitly cited verses | 20,098 | 14,128 |
| Uncited punctuation given a display position | 15,431 | 15,634 |
| Surface tokens without a single verse placement | 99 | 1,203 |
| Missing lemma values on surface tokens | 74 | 111 |
| Fully unspecified morphology on surface tokens | 80 | 116 |
| Malformed morphology tag shapes | 0 | 0 |
| Verse-number gaps through last indexed verse of each book | 11 | 32 |
| Tokens whose head path enters a cycle | 80 | 109 |
| Dangling or blank head references | 2 | 0 |

## Checks passed

- **Full conversion parity.** Independently compared each sentence's attributes and the ordered attributes of every token with the XML. This covers forms, lemmas, morphology, citations, heads, relations and artificial-node attributes. Verified every explicit single-verse citation and checked for duplicate verse-index placement.
- **Five JavaScript regression tests.** Checked the opening cross-verse edge in each epic, traversal through cycles and handling of dangling heads, and exclusion of ambiguous citations from verse-link generation. Checked spacing elision and preservation of accented Greek characters.
- **Microsoft Edge, previous reader build.** Served the reader locally and exercised initial book loading, word selection, lemma display, cross-verse head navigation and descendant highlighting, verse links, a jump to Odyssey 24.548, missing-verse feedback at Odyssey 1.99, and panel focus at 390 px viewport width. The updated horizontal diagram and font rendering have not been verified in a browser.

## Source exceptions

The verse index uses explicit single-verse citations. Eligible uncited punctuation follows the previous explicitly cited verse in the same sentence for display. Surface tokens with competing citations, book-only citations, or no reliable display placement remain in sentence order in the panel and are discoverable through the book's uncertain verse locations menu. The display omits artificial nodes from verse rows and includes them in syntax.

AGDT can attach both the main predicate and terminal punctuation to head 0. The reader renders all root branches and marks missing heads and cycles. The two blank heads occur in Iliad sentence 2278031, tokens 22 and 33. The audit counts tokens reaching cycles, so several entries may describe the same cycle.

The gap check covers line numbers from 1 through the last indexed verse of each book. It makes no independent claim about the Greek text of a separate critical edition or the completeness of the source's end-of-book numbering. Exact sentence and token IDs, gap locations, counts, and input hashes are recorded in `data/audit.json`. License and edition information is in PROVENANCE.md.

## Bundled Cunliffe dictionary

The downloaded Scaife JSONL contains 9,825 parseable records with distinct entry URNs and string definitions. The packaged copy is byte-identical to the supplied download. The reader parses the bundled file on first lexical lookup.

| Epic | Matched distinct Greek lemmas | Matched token occurrences with a Greek lemma |
| --- | ---: | ---: |
| Iliad | 4,836 / 6,876 | 93,337 / 112,596 (82.9%) |
| Odyssey | 4,317 / 5,677 | 75,084 / 87,548 (85.8%) |

Counts use the reader's exact, accent-preserving lemma match. They exclude tokens without a Greek lemma and count each sentence once. The coverage measures matches to headwords. It does not evaluate contextual sense or alternate spellings.

All 19 current JavaScript tests passed. The complete bundled dictionary was parsed with the production parser for the coverage check. The local side-panel flow has not been exercised in a browser for this build.

## Smyth reference index

The reader indexes ten selected topics and provides references based on source relations or morphology. Smyth § 1475 explicitly cites Iliad 1.3. Tests verify this reference is restricted to that passage, role-based suggestions for the object complement and adverbial accusative, and section-number and Greek-keyword search. The index contains reference metadata. The full grammar is available through the linked edition. The UI has not been exercised in a browser for this build.

## Full Smyth edition

The supplied Alpheios TEI XML parsed successfully and contains numbered sections 1 through 3048 exactly once. An independent HTML parse matched the XML body text after whitespace normalization, as well as all 3,072 source anchors and 289 tables. Automated tests checked that the curated topic links resolve to local anchors and that section-number and Greek text search find § 1475. All 22 JavaScript tests passed. Browser rendering and navigation were not visually checked for this build.

## Two-way Homer and Smyth citations

The converter checked 223 structured Homer references against the reader's verse index. It linked 220 of them and added the manually verified Iliad 1.3 reference in §1475. The reverse index covers 85 Iliad verses and 127 Odyssey verses. Nineteen examples outside numbered sections received local anchors. Citations that span several verses open at the first verse and are indexed against every verse in the span.

Three structured references are unresolved and remain plain text in Smyth. Odyssey 13.518 and 23.887 are outside the indexed lines for those books, and Odyssey 21.108 falls in a gap in the reader's verse index. The converter does not guess at corrections. Untagged citations other than the verified Iliad 1.3 example are outside this pass.

The automated suite checked local anchors, citation link counts, both directions for the §1475 example, and the unresolved-reference audit. Browser navigation was not visually checked for this build.
