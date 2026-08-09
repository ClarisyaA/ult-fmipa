# ULT FMIPA QA Documentation

This directory is the QA source of truth for the ULT FMIPA Unpad Next.js application. It was created from repository inspection, not from production execution. Do not treat planned tests as executed results.

## Document Index

1. `00-audit-summary.md` - repository audit summary, counts, tooling, risks, and open questions.
2. `01-application-inventory.md` - roles, pages, APIs, services, forms, CMS modules, storage, PDF, and database-facing inventory.
3. `02-requirements-and-acceptance-criteria.md` - confirmed requirements and acceptance criteria with source evidence.
4. `03-master-test-plan.md` - scope, strategy, entry/exit criteria, severity, evidence, and reporting rules.
5. `04-functional-test-scenarios.md` - manual and automatable functional scenarios.
6. `05-non-functional-test-plan.md` - security, performance, accessibility, responsive, reliability, privacy, data integrity, and operability.
7. `06-manual-test-execution-guide.md` - smoke, critical regression, and full regression execution.
8. `07-unit-and-integration-test-matrix.md` - unit and API/integration candidates.
9. `08-playwright-e2e-test-matrix.md` - Playwright architecture and role-based E2E matrix.
10. `09-test-data-and-environment-strategy.md` - environments, users, fixtures, seeds, isolation, and cleanup.
11. `10-requirements-traceability-matrix.md` - requirement to acceptance/test/NFR mapping.
12. `11-risk-and-gap-register.md` - prioritized risk and coverage gap register.
13. `12-automation-implementation-roadmap.md` - future automation phases and commit boundaries.
14. `templates/*` - reusable execution, defect, retest, and release readiness reports.

## Recommended Reading Order

Start with `00-audit-summary.md`, then `01-application-inventory.md`, then `10-requirements-traceability-matrix.md`. Use the test matrices when implementing tests. Use templates only when executing or reporting.

## ID Conventions

- Acceptance criteria: `AC-AUTH-###`, `AC-PUB-###`, `AC-STUDENT-###`, `AC-REQUEST-###`, `AC-SERVICE-###`, `AC-PRINT-###`, `AC-SIK-###`, `AC-CMS-###`, `AC-SURVEY-###`, `AC-SYSTEM-###`, `AC-SEC-###`, `AC-NFR-###`.
- Test cases: `TC-AUTH-###`, `TC-PUB-###`, `TC-STUDENT-###`, `TC-REQUEST-###`, `TC-SERVICE-###`, `TC-CMS-###`, `TC-SEC-###`, `TC-NFR-###`.
- Risks: `RISK-P0-###`, `RISK-P1-###`, `RISK-P2-###`, `RISK-P3-###`.

## Priority Definitions

- `P0`: release blocker, critical security risk, data loss, or impossible core workflow.
- `P1`: critical workflow, role boundary, or high-impact regression.
- `P2`: normal functional risk.
- `P3`: low-risk usability, cosmetic, or maintainability issue.

## Coverage Status

- `Covered`: implemented and mapped to a current or planned executable test.
- `Partially covered`: some path exists, but material cases remain.
- `Planned`: no current test, but defined for implementation.
- `Blocked`: cannot be tested without missing fixture, environment, credential, or stakeholder clarification.
- `Open question`: behavior not confirmed in source.
- `Not applicable`: explicitly out of scope for that item.

## Maintenance Rules

- Update these files whenever routes, services, roles, upload rules, PDF behavior, or CMS workflows change.
- Do not include real credentials, tokens, student personal data, or private uploaded files.
- Mark test results only after execution. Planned matrices are not evidence of a pass.
- Keep service slug matrices explicit; do not collapse service inventory into generic text.

## Workflow

- Smoke: use `06-manual-test-execution-guide.md`, record results in `templates/test-execution-report.md`.
- Regression: use `04-functional-test-scenarios.md`, `08-playwright-e2e-test-matrix.md`, and `10-requirements-traceability-matrix.md`.
- Defects: use `templates/defect-report.md`.
- Retest: use `templates/retest-and-regression-report.md`.
- Release readiness: use `templates/release-readiness-report.md`.

