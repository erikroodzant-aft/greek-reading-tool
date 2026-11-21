# Development backlog

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
