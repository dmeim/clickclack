---
name: Testing Coverage Expansion
overview: Expand TypeSetGo's automated testing to catch more regressions early by adding CI quality gates, broader unit/component coverage, and Playwright end-to-end smoke tests.
todos:
  - id: define-quality-gates
    content: Lock baseline quality gates to lint, unit tests, and production build on every PR
    status: pending
  - id: add-ci-workflow
    content: Add a GitHub Actions workflow to run lint, test:run, and build with Bun
    status: pending
  - id: expand-unit-tests
    content: Add focused unit tests for high-risk utility logic and data transforms
    status: pending
  - id: add-component-tests
    content: Add React Testing Library tests for critical user flows and UI state transitions
    status: pending
  - id: enable-e2e-baseline
    content: Add Playwright config and 3-5 smoke tests for core route and flow stability
    status: pending
  - id: document-test-strategy
    content: Document test layers, command usage, and local/CI expectations in AGENTS.md and README
    status: pending
  - id: add-coverage-visibility
    content: Enable Vitest coverage reports and set initial minimum thresholds
    status: pending
  - id: adopt-pr-checklist
    content: Add a lightweight PR checklist to ensure contributors run required checks
    status: pending
isProject: false
---

# Testing Coverage Expansion Plan

## Goals

- Catch bugs before merge with fast, reliable automated checks.
- Reduce regressions in core typing, race, and settings experiences.
- Give contributors a simple and repeatable test workflow.

## Current State (Repo Snapshot)

- Linting exists via `bun run lint` (`eslint .`).
- Unit tests exist via Vitest and run with `bun run test:run`.
- Build/type safety exists via `bun run build`.
- `test:e2e` script exists, but Playwright config/spec coverage is currently missing.

## Proposed Test Pyramid

1. Static checks (lint + TypeScript build) on all PRs.
2. Unit tests for deterministic logic (`src/lib/*`, parsers, transformers, validation).
3. Component tests for key UI behaviors (route rendering, settings interactions, conditional UI).
4. E2E smoke tests for critical user journeys.

## Phase Plan

### Phase 1 - CI Quality Gates (Highest ROI)

Add `.github/workflows/ci.yml` to run on `pull_request` and `push` to main branches:

- `bun install --frozen-lockfile`
- `bun run lint`
- `bun run test:run`
- `bun run build`

Success criteria:

- PR cannot merge if lint/test/build fails.
- CI runtime remains fast enough for daily development (target <= 8 minutes).

### Phase 2 - Unit + Component Coverage Expansion

Focus on likely regression points:

- Theme helpers and color transforms.
- Race/session result calculations and derived stats.
- Settings serialization/parsing and fallback behavior.
- Utility functions used across pages/components.

Add component tests for:

- Home route render and primary controls visible.
- Connect host/join UI renders without crash.
- Typing mode/settings controls update expected state.

Success criteria:

- New tests cover top shared logic paths and basic route rendering.
- Failures are deterministic and not flaky.

### Phase 3 - E2E Smoke Baseline with Playwright

Add:

- `playwright.config.ts`
- `tests/e2e/*.spec.ts`

Initial smoke suite:

- App loads and core shell renders.
- User can enter typing practice and start a run.
- Connect route pages render expected controls.

Success criteria:

- `bun run test:e2e` works locally and in CI.
- Smoke tests catch route-level/runtime breakages that unit tests miss.

### Phase 4 - Coverage + Contributor Experience

Add coverage reporting:

- Configure Vitest coverage output (`text`, `html`, `lcov`).
- Start with pragmatic thresholds and increase over time.

Add contributor guidance:

- Update `README.md` testing section.
- Align/extend `AGENTS.md` quality gate guidance.
- Add PR checklist template with required checks.

Success criteria:

- Contributors can run the full test stack with clear docs.
- Coverage trends become visible and improvable over time.

## Initial Coverage Targets (Pragmatic)

- Global line coverage: 40% minimum.
- Statement coverage in shared utilities: 70% minimum.
- Critical path suites (typing/race/settings): required smoke tests in CI.

Note: Start conservative to avoid blocking progress; raise thresholds as the suite matures.

## Risks and Mitigations

- Flaky tests slow trust in CI.
  - Mitigation: keep smoke tests small, deterministic, and isolated.
- Slow CI can reduce developer velocity.
  - Mitigation: parallelize jobs and keep heavy suites separate from required quick gates.
- Over-testing UI internals can cause brittle tests.
  - Mitigation: prefer user-visible behavior and stable selectors.

## Execution Order

1. Implement CI workflow with existing commands.
2. Add missing high-value unit/component tests.
3. Introduce Playwright config + smoke specs.
4. Add coverage reporting and docs/checklist updates.

## Definition of Done

- CI runs lint, unit tests, and build on all PRs.
- Playwright smoke tests are present and pass in CI.
- Testing docs are updated with local and CI usage.
- Coverage output is generated and visible.
