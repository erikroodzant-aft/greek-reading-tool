# Updating the Heleios

The public website is deployed automatically from the repository's `main` branch. Keep `main` ready for readers.

## Small fixes

Publish focused fixes, such as typos, spacing and clearer labels, individually after checking the affected page locally. Use a clear commit message describing the change.

## Features and larger changes

Prepare substantial changes locally or on a separate branch. Test them before merging into `main`. Run the relevant automated checks and inspect affected reader interactions in a browser. For layout changes, also check a narrow screen.

## Data changes

Group corpus, dictionary and grammar changes into reviewable updates. Validate conversions and affected references, preserve sentence-wide dependencies, and update provenance and license notes where needed. Do not replace bundled sources with material whose redistribution rights remain unresolved.

## Release record and recovery

Record user-visible changes in `CHANGELOG.md`. Mark verified stable versions with Git tags and GitHub releases, and record the checks performed. A change is not a verified stable release until its checks are complete.

After publishing, check the deployed website. If a release breaks existing behavior, revert the responsible commit to restore the previous working version, then investigate separately. Keep file and ZIP names stable unless a rename is explicitly requested.
