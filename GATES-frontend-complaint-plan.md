# Gates: frontend complaint remediation plan

OWNS: tmp/frontend-complaints-2026-10-15/**, output/docs/prometheus-frontend-remediation-plan-2026-10-15.docx, GATES-frontend-complaint-plan.md

Scope: Diagnose the supplied report to planning depth and deliver a source grounded system design and implementation plan without changing application code.

- [x] G1: The complaint inventory accounts for every report finding and distinguishes fixes from regressions
  EVIDENCE: Reviewed all eight report pages and embedded evidence. W0-W8 cover the eight blockers; Appendix B covers Sync/Share, blank cards, repeated titles, build drift and all reported working controls. Source extraction and page renders are in tmp/frontend-complaints-2026-10-15/.

- [x] G2: Proposed investigation and repair boundaries cite current source and qualify unverified runtime causes
  EVIDENCE: Current source boundaries inspected and matched: toast-only main split handler, local Motion split state, unguarded reference JSON parse, existing OAuth wiring, source-only export and 285000 ms thumbnail timeout. Main split reproduced twice in isolation; other runtime causes explicitly remain unverified. See split-handler-repro.txt and work-package source references.

- [x] G3: Each work package has dependencies and observable acceptance criteria with product decisions separated
  EVIDENCE: Reviewed W0-W8: each records expected work, dependency boundary and observable acceptance evidence. D1-D4 separate caption policy, output profile, provider configuration and missing-control workflows. M0-M3 sequence and integration/rollback evidence are stated.

- [x] G4: The delivered document preserves the retained system design template and every rendered page is readable
  EVIDENCE: Retained DOCX hash, preserve-only package parts, section geometry, relationship parts and table grids verified by build_plan.py verify. All 13 final-v2-render/page-01.png through page-13.png inspected at original image resolution; no clipping or overlap. Word read-only export substituted for unavailable LibreOffice; reference unchanged.

- [x] G5: Final review confirms planning scope and preservation of the existing application change
  EVIDENCE: Planning deliverables only. No application code edits, paid calls, account changes, export jobs, Git commits or staging performed. Existing app/projects/page.tsx and concurrent delivery/review changes left in place. Application test commands are labeled planned, never passed.
