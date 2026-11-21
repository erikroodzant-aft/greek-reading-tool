# Development backlog

## Completed: heleios.org domain verification and HTTPS

Completion verified November 21, 2026: GitHub ownership verification succeeded; Enforce HTTPS enabled; https://heleios.org loads without a security warning; www redirects to the secure apex; the previously shared GitHub Iliad 1.1 link redirects to the secure reader and loads Book 1. Historical setup notes follow.

The domain connection was configured on November 21, 2026. Namecheap has an apex ALIAS and a www CNAME pointing to erikroodzant-aft.github.io, plus GitHub's ownership-verification TXT record. GitHub could not yet retrieve the records at the last check; ownership verification and HTTPS remain incomplete. Users have seen a secure-connection warning.

- Recheck public DNS and GitHub's account-level domain verification; complete verification when the TXT record is visible.
- Recheck repository Pages settings, wait for certificate issuance, and enable Enforce HTTPS when available.
- Verify https://heleios.org and https://www.heleios.org, the old GitHub Pages address, and an existing passage link. Do not bypass browser security warnings.
- If unresolved 24 hours after configuration, investigate delegation, registration/email verification, records and certificate status rather than assuming propagation.
- Keep this a release priority: existing shared GitHub links may redirect to the new domain during the transition.
- Preserve the remote CNAME configuration when synchronizing local work. Homepage, branding and issue-form changes approved for publication on November 21, 2026.


## Code quality and release discipline

Before public beta, review the reader, dictionary, Smyth search, converters and packaging for duplicated logic, oversized functions, stale code, inconsistent data handling and fragile interactions. Prioritize defects and changes that make the current product easier to maintain. Keep each cleanup scoped and preserve behavior through focused tests.

Acceptance criteria

- One documented development copy and a repeatable process to build the extracted release and ZIP.
- Version history with recoverable working checkpoints and reviewable changes.
- Automated checks for corpus integrity, search behavior, word analysis and generated links.
- Browser smoke checks for homepage navigation, both epics, dictionary loading, Smyth search and two-way citations.
- Mobile interaction and accessibility checks on representative passages.
- A review of source attribution, input validation and HTML handling before public hosting.
- A concise release checklist recording what passed and what remains unverified.
- Periodic code review for maintainability, with findings tied to concrete files and behavior.

## Visual design

Discuss a more modern, attractive appearance while preserving a quiet, Greek-first reading experience. Review typography, spacing, color, hierarchy and responsive panel layout.

Refer to Release-Audit.md for MVP priorities and dependencies.

## Cunliffe definition extraction — deferred

Continue using the existing bundled Scaife database. Investigate systematic definition and cross-reference extraction from that export, with category-level validation and explicit fallback for unresolved entries. Do not incorporate the richer Homerica XML or contact Gregory Crane. Reader changes require agreement on the extraction approach. This work can follow the initial friend-preview MVP.

## Immediate friend-preview release

Prepare the existing desktop reader and offline references for GitHub. Verify the static files, tests, source notices and known limitations. Confirm the GitHub destination and whether the user wants GitHub Pages hosting. Mobile bottom-sheet interaction and the visual redesign remain later priorities.

## November 21 code-quality review

Review completed; detailed local report: outputs/Code-Quality-Review.txt. Next priorities: establish one editable source and repeatable packaging; add validation before deployment; repair the empty Smyth result panel and hosted load-error guidance; correct stale provenance/documentation. Keep performance work measurement-led. Review only; implementation and publication have not occurred.

## Maintenance implementation — local, not published

Single-source packaging, content manifests, static checks and the validation-gated Pages workflow are prepared. Empty Smyth results and hosted book-load guidance are fixed; obsolete test-only helpers removed; provenance corrected. Workflow activation and remote verification remain publication steps. Physical-phone measurements remain pending; no performance claim is based on viewport emulation. Full CSS consolidation is deferred to avoid changing approved visuals without a separate visual regression pass.
