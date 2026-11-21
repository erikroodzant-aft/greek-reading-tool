# Release checks

## Local source and packages

Edit only this Git checkout (`outputs/Greek-Reading-Tool-GitHub` in the original workspace). The sibling `Greek-Reading-Tool` folder and both ZIPs are generated deliverables. `work/reader` is a historical working copy, not an alternative source. Do not copy its files back into this checkout.

Run from the checkout:

```powershell
python package_release.py --output ..
```

If Git is not on PATH, append `--git` followed by the installed Git executable's full path. The command builds in a temporary folder, runs all Node tests and static checks there, and then replaces only the fixed generated `Greek-Reading-Tool` folder and the two stable ZIPs. It excludes mockups and browser profiles. Stop the local server before rebuilding if Windows reports that files are in use.

`release-manifest.json` records the commit, whether local changes were present, and every packaged source-file hash. Uncommitted changes produce a `local-preview`, not a declared stable release. The two ZIP names contain the same checked package; both preserve CNAME. A generated package can be checked independently with `python check_release.py`. It cannot create a new committed package without a Git checkout.

Before tagging a stable version, commit the intended changes, build again from that commit, compare manifest hashes and complete the browser checks below. A commit is not automatically a verified stable release. Compare ZIP hashes from two consecutive builds to verify reproducibility after changing the packager.

## Browser smoke checks

Serve the generated folder using `start-reader.cmd` or `python serve_reader.py`. Refresh without cached assets.

- Homepage: both title links and book/line forms work; heading returns home; footer report link opens the intended GitHub form without submitting a test report.
- Iliad 1.1: select a word; verify decoded morphology, dictionary excerpt/full entry, cross-verse diagram and token highlighting.
- Odyssey 24: an excessive line number resolves to 548. Odyssey 1.99 gives missing-source-verse feedback.
- Block the dictionary request using browser developer tools: verify failure and Retry; unblock and retry successfully. Switch passages while data is loading and check that stale content does not return.
- Block a book request: hosted HTTP guidance says to select Go to retry. Unblock and retry the same route successfully.
- Smyth: initial and zero-result states have no empty results box. Search `potential optative`; verify highlights, scrolling, More results at the end, and section navigation.
- Smyth §1475 and Iliad 1.3: citations resolve both ways; internal grammar references stay in the same tab and Homer references open a new tab.
- At 390 px and on physical phone browsers when available: controls remain usable, word panel receives focus, diagram scrolls inside its container, and the page does not overflow horizontally. Keyboard-check focus visibility and word selection.

The optional legacy Edge runner is `node browser-test.mjs <Edge executable> <dedicated temporary profile directory>`. It covers a subset of these checks, not dictionary failure, Smyth or physical-phone behavior. Do not use an everyday browser profile. Runtime control in an assistant session must use its supported browser tools instead.

## Activate validation-gated deployment (pending publication)

The prepared `.github/workflows/pages.yml` checks and packages pull requests and main pushes. Its deploy job depends on validation. **It is not active while these changes remain local.** At publication, change repository Settings → Pages → Source from “Deploy from a branch” to “GitHub Actions”; otherwise the old branch deployment remains an independent route that bypasses this gate. Retain the existing custom-domain setting and HTTPS. Inspect the first workflow run before declaring the migration complete.

Configure branch protection separately if required checks should also prevent merges; this file does not enable branch protection. After deployment, verify HTTPS, www and the old shared GitHub passage URL. Revert the responsible commit if a release fails, then rebuild. See GitHub's [custom workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Performance follow-up

Physical-phone measurements remain pending: record first dictionary lookup time, transfer size, memory/long tasks, repeated word selections and long-sentence scrolling. Desktop viewport emulation is not evidence of phone speed. Cache or split assets only when measurements justify it. Source rights questions remain tracked in PROVENANCE.md.

## Local maintenance verification — November 21, 2026

29 Node tests passed. Static release checks passed for all 48 books, imports and local page links. In the supported browser, Smyth initial results were hidden, `potential optative` returned 50 sections, More results expanded from 20 to 40 visible matches, and a zero-match search hid the empty panel. Hosted/file load-error guidance is unit-tested; end-to-end simulated request failure/recovery remains unchecked because the auxiliary local test server could not be reached from the browser. Physical-device measurements and remote workflow execution remain pending. No maintenance changes have been pushed.
