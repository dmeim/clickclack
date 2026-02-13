---
name: Shadcn Base UI Migration (Full Coverage)
overview: Migrate feature UI to shadcn components backed by Base UI primitives, replacing native and custom controls where supported while preserving all behavior, keyboard flows, and dynamic theme compatibility.
todos:
  - id: baseline-audit
    content: Complete full inventory of native controls, overlays, and current shadcn usage.
    status: completed
  - id: choose-base-style
    content: Choose Base UI style variant (recommended base-vega) and lock style decision before component regeneration.
    status: pending
  - id: bootstrap-base-primitives
    content: Regenerate src/components/ui with Base UI-backed shadcn components and add missing primitives required by current app features.
    status: pending
  - id: theme-token-bridge
    content: Wire ThemeContext runtime colors into shadcn semantic CSS variables to keep themes fully compatible.
    status: pending
  - id: codemod-raw-buttons-inputs
    content: Replace native button/input/select/textarea/label usage with shadcn primitives, preserving existing behavior and styles.
    status: pending
  - id: migrate-modals-to-dialog
    content: Replace custom modal overlays with Dialog/AlertDialog/Sheet where semantics fit.
    status: pending
  - id: migrate-segmented-controls
    content: Replace custom button groups and pill toggles with ToggleGroup/Tabs/Switch/Checkbox equivalents.
    status: pending
  - id: migrate-tables-badges-cards
    content: Replace custom tables/chips/panels with shadcn Table/Badge/Card/Separator/ScrollArea where supported.
    status: pending
  - id: migrate-popovers-pickers
    content: Replace custom portal pickers with Popover/Dropdown patterns while keeping positioning and interaction parity.
    status: pending
  - id: high-risk-host-typing-phase
    content: Migrate Host and TypingPractice last, with strict keyboard and race flow regression checks.
    status: pending
  - id: cleanup-dependencies
    content: Remove old Radix package imports/deps once Base UI migration is complete and verified.
    status: pending
  - id: enforce-no-raw-controls
    content: Add lint guardrails and audit checks to prevent new native controls outside approved exceptions.
    status: pending
  - id: full-regression-pass
    content: Run build, tests, lint, and complete manual smoke matrix across routes/themes/modes.
    status: pending
isProject: false
---

# Shadcn Base UI Migration Plan

## 1) Mission and hard constraints

Primary objective:

- Use shadcn components wherever shadcn has support.
- Use Base UI primitive backing (not Radix-backed wrappers).
- Preserve all functionality and keyboard behavior.
- Preserve theme compatibility for all supported themes and modes.

Hard constraints:

- No feature regressions in typing flow, connect/race flow, auth/stats flow, or theme system.
- Keep route behavior and data flow unchanged (UI layer migration, not business logic rewrite).
- Keep visual identity intentional; no generic restyling drift.

## 2) Current state audit (exhaustive baseline)

Outside `src/components/ui/**`:

- Native `<button>`: 194
- Native `<input>`: 28
- Native `<select>`: 1
- Native `<textarea>`: 3
- Native `<label>`: 42
- Native `<table>`: 2
- Custom full-screen overlay patterns (`fixed inset-0`): 23

Current shadcn module usage is limited:

- In use: `dialog`, `dropdown-menu`, `select`, `tabs`, `slider`, `progress`, `hover-card`, `carousel`, `button`, `sonner`
- Available but mostly unused in feature code: `button`, `input`, `label`, `switch`, `popover`, etc.

Largest hotspots by replacement volume:

- `src/components/typing/TypingPractice.tsx` (51 buttons, 3 inputs, 1 textarea, 19 labels, 5 overlays)
- `src/pages/Host.tsx` (47 buttons, 8 inputs, 1 select, 1 textarea, 8 labels, 5 overlays)
- `src/components/plan/PlanBuilderModal.tsx` (16 buttons, 6 inputs, 1 textarea, 9 labels, 1 overlay)

Important platform note:

- `shadcn migrate --list` currently provides `icons`, `radix`, and `rtl` migrations only.
- There is no direct `migrate base` command, so Base UI move must be done by controlled component regeneration and feature-by-feature adoption.

## 3) Base UI strategy (required for this migration)

### 3.1 Recommended style decision

Pick a Base style and lock it before regenerating components. Recommended default:

- `base-vega` (closest to classic spacing/density, lowest visual regression risk).

Alternative if you explicitly want denser UI:

- `base-nova` or `base-mira`.

### 3.2 Primitive regeneration approach

Because no base migration codemod exists:

1. Switch project shadcn style to a Base style in `components.json`.
2. Regenerate `src/components/ui/*` using shadcn CLI with overwrite.
3. Add missing components required by current app usage.
4. Keep import paths stable (`@/components/ui/...`) so feature files can migrate incrementally.

If direct style swap is blocked by CLI guardrails, fallback:

- Generate a temporary Base UI scaffold via `shadcn create`, then port generated `src/components/ui` primitives into this repo and reconcile aliases.

### 3.3 Required shadcn components to add/regenerate

Already present (regenerate as Base variants):

- `button`, `dialog`, `dropdown-menu`, `hover-card`, `input`, `label`, `popover`, `progress`, `select`, `slider`, `switch`, `tabs`, `carousel`, `command`, `sonner`

Missing but needed for this repo migration:

- `textarea`, `alert-dialog`, `sheet`, `table`, `card`, `badge`, `separator`, `scroll-area`, `toggle-group`, `tooltip`, `kbd`, `native-select`

Potentially useful in specific screens:

- `collapsible`, `checkbox`, `field`

## 4) Theme compatibility plan (top priority)

Current issue:

- ThemeContext updates `--theme-*` runtime variables, but most shadcn primitives rely on semantic vars (`--background`, `--foreground`, `--primary`, etc.).

Required migration step:

1. Extend runtime theme application in `src/context/ThemeContext.tsx` to set shadcn semantic CSS vars from active theme colors.
2. Ensure values are format-compatible with shadcn token usage.
3. Keep legacy theme fields available until all feature components are migrated.

Semantic mapping to implement:

- `--background` <- `colors.bg.base`
- `--foreground` <- `colors.text.primary`
- `--card` <- `colors.bg.surface`
- `--card-foreground` <- `colors.text.primary`
- `--popover` <- `colors.bg.elevated`
- `--popover-foreground` <- `colors.text.primary`
- `--primary` <- `colors.interactive.primary.DEFAULT`
- `--primary-foreground` <- `colors.text.inverse`
- `--secondary` <- `colors.interactive.secondary.DEFAULT`
- `--secondary-foreground` <- `colors.text.inverse`
- `--accent` <- `colors.interactive.accent.DEFAULT`
- `--accent-foreground` <- `colors.text.inverse`
- `--muted` <- `colors.bg.elevated`
- `--muted-foreground` <- `colors.text.secondary`
- `--border` and `--input` <- `colors.border.default`
- `--ring` <- `colors.border.focus`
- `--destructive` <- `colors.status.error.DEFAULT`

Theme QA set (minimum):

- `typesetgo` dark and light
- `high-contrast` dark and light
- one additional vivid palette theme (for saturation edge cases)

## 5) File-by-file migration backlog

This is the complete inventory of files currently using native controls or custom overlays and what each should migrate to.

### 5.1 Typing domain

- `src/components/typing/TypingPractice.tsx`
  - Replace native controls with: `Button`, `Input`, `Textarea`, `Label`, `ToggleGroup`, `Switch`, `Tabs`, `Separator`, `ScrollArea`, `Kbd`.
  - Replace modal overlays with: `Dialog` and `Sheet` (where full-screen/side panel behavior is intended).
  - Preserve all typing hotkeys (`Tab`, `Shift+Tab`, `Enter`, `Space`) and focus behavior.
- `src/components/typing/TypingArea.tsx`
  - Keep hidden native input for low-level keyboard capture (approved exception).
- `src/components/typing/ColorPicker.tsx`
  - Replace custom popover container and trigger with `Popover` + `Button` + `Input`.
  - Keep canvas-based hue/saturation internals (custom, no shadcn equivalent needed).
- `src/components/typing/SoundController.tsx`
  - Replace trigger `<button>` with `Button` (`size="icon"`, `variant="ghost"`).
- `src/components/typing/GhostWriterController.tsx`
  - Replace trigger `<button>` with `Button` (`size="icon"`, `variant="ghost"`).

### 5.2 Host/connect domain

- `src/pages/Host.tsx`
  - Replace raw controls with: `Button`, `Input`, `NativeSelect` or `Select`, `Textarea`, `Slider`, `Label`, `ToggleGroup`, `Switch`.
  - Replace settings/theme/custom/preset overlays with `Dialog` or `Sheet`.
  - Use `AlertDialog` for destructive confirmations when applicable.
- `src/pages/Join.tsx`
  - Replace name form controls with `Input`, `Button`, `Card`.
- `src/components/connect/HostCard.tsx`
  - Replace with `Card` + `Input` + `Button` composition.
- `src/components/connect/JoinCard.tsx`
  - Replace with `Card` + `Input` + `Button` composition.
- `src/components/connect/UserHostCard.tsx`
  - Replace action buttons with `Button` icon variants.
  - Replace manual progress bars with `Progress` where behavior permits.
  - Keep DnD container behavior unchanged.

### 5.3 Race domain

- `src/pages/Race.tsx`
  - Replace host/join form controls with `Card`, `Input`, `Button`.
- `src/pages/RaceLobby.tsx`
  - Replace difficulty/word selectors with `ToggleGroup`.
  - Evaluate countdown overlay: keep custom if focus trapping would break lobby countdown UX; otherwise move to `Dialog`.
- `src/pages/RaceActive.tsx`
  - Migrate leave confirmation modal to `AlertDialog`.
  - Keep non-interactive finish overlay custom (approved exception).
- `src/pages/RaceResults.tsx`
  - Replace action buttons with `Button` variants.
- `src/components/race/PlayerCard.tsx`
  - Replace editable name input and action buttons with `Input` and `Button`.
  - Use `Badge` for ready state where appropriate.
- `src/components/race/EmojiPicker.tsx`
  - Replace custom portal/backdrop with `Popover` (or `DropdownMenu`) and button grid.
- `src/components/race/Podium.tsx`
  - Replace results table markup with shadcn `Table` primitives.
  - Keep animated podium visualization custom.

### 5.4 Plan domain

- `src/components/plan/PlanBuilderModal.tsx`
  - Replace outer modal with `Dialog`.
  - Replace controls with `Input`, `Textarea`, `Button`, `Label`, `ToggleGroup`, `Switch`, `ScrollArea`, `Separator`.
- `src/components/plan/PlanResultsModal.tsx`
  - Replace outer modal with `Dialog`.
  - Replace table with `Table` and mode chips with `Badge`.
- `src/components/plan/PlanNavigation.tsx`
  - Replace nav buttons with `Button` components.
- `src/components/plan/PlanSplash.tsx`
  - Replace CTA/waiting buttons with `Button` variants.

### 5.5 Auth, stats, and layout domain

- `src/components/auth/StatsModal.tsx`
  - Replace modal shells with `Dialog` and delete confirmations with `AlertDialog`.
  - Replace custom history grid with shadcn `Table` + `ScrollArea` while preserving sort and click behavior.
  - Convert action buttons to `Button`.
- `src/pages/UserStats.tsx`
  - Same treatment as StatsModal for detail/delete dialogs and table structures.
- `src/components/auth/AchievementsModal.tsx`
  - Replace overlay shell with `Dialog`.
  - Replace close/action buttons with `Button`.
- `src/components/auth/AchievementDetailModal.tsx`
  - Replace overlay shell with `Dialog`.
  - Replace nav/dot buttons with `Button` and optional `Tooltip`.
- `src/components/auth/AchievementsGrid.tsx`
  - Replace tile containers with `Card` and tier pills with `Badge`.
  - Replace action controls with `Button`.
- `src/components/auth/AchievementsCategoryGrid.tsx`
  - Replace category cards with `Card` and progress pills with `Badge`.
- `src/components/auth/UserButton.tsx`
  - Replace sign-in and avatar trigger buttons with shadcn `Button` (`asChild` where needed).
- `src/components/layout/Header.tsx`
  - Replace icon action buttons with shadcn `Button` variants.
  - Keep route links via `asChild` to preserve router semantics.
- `src/components/layout/NotificationCenter.tsx`
  - Keep `DropdownMenu`, replace remaining native action controls with `Button`.
  - Replace unread count chips with `Badge`.

### 5.6 Existing shadcn screens still requiring Base update

- `src/pages/About.tsx`
  - Already uses `Tabs`; verify behavior after Base primitive swap and adjust style overrides only.
- `src/components/settings/SoundSettingsModal.tsx`
  - Keep `Dialog` and `Select`; replace native toggles/buttons with `Switch`/`Button` and labels with `Label`.
- `src/components/settings/GhostWriterSettingsModal.tsx`
  - Keep `Dialog`; replace native controls with `Switch`, `Button`, `Input`, `Label`.

## 6) Approved exceptions (explicit, minimal)

These remain native/custom unless a proven safe shadcn pattern exists without behavior loss:

- `src/components/typing/TypingArea.tsx` hidden input used for raw typing capture latency.
- Canvas rendering internals in `src/components/typing/ColorPicker.tsx`.
- Non-interactive state overlays (for example race finish overlay) where Dialog semantics are not appropriate.
- High-motion podium visualization body in `src/components/race/Podium.tsx` (table section still migrates).

Everything else should move to shadcn where supported.

## 7) Execution phases (recommended order)

### Phase 0 - Safety net and baseline

- Capture current behavior checklist and screenshot baseline for key routes.
- Add temporary audit commands for native-control counts.
- Confirm current `bun run build`, `bun run test:run`, and `bun run lint` status.

Exit criteria:

- Baseline metrics and screenshots captured.

### Phase 1 - Base UI primitive foundation

- Regenerate `src/components/ui` as Base-backed shadcn components.
- Add missing primitives (`textarea`, `alert-dialog`, `sheet`, `table`, `badge`, `card`, etc.).
- Keep all component exports and import paths stable.

Exit criteria:

- No `@radix-ui/*` imports remain in `src/components/ui/**`.
- App builds with Base-backed primitives before feature migration starts.

### Phase 2 - Theme compatibility bridge

- Update `ThemeContext.applyThemeCSS()` to set full semantic shadcn tokens.
- Verify token propagation in dark/light mode switches and across multiple themes.

Exit criteria:

- Base shadcn primitives render with active theme colors without hardcoded fallback mismatches.

### Phase 3 - Low/medium risk feature migration

- Migrate connect/race cards and forms (`Connect`, `Join`, `Race`, `HostCard`, `JoinCard`, `PlayerCard`).
- Migrate smaller controls in layout/auth components (`Header`, `UserButton`, `NotificationCenter`).

Exit criteria:

- No native controls remain in these modules except approved exceptions.

### Phase 4 - Modal and data-display migration

- Convert modal overlays to `Dialog/AlertDialog/Sheet` in auth, stats, plan, and host flows.
- Convert table/chip/card patterns to `Table/Badge/Card/Separator/ScrollArea`.

Exit criteria:

- Overlay/focus behavior parity confirmed.
- Sorting, selection, and destructive actions unchanged.

### Phase 5 - High-risk migration (Host + TypingPractice)

- Migrate the most complex settings and modal surfaces in `TypingPractice` and `Host`.
- Preserve all keyboard shortcuts and mode-specific behavior.

Exit criteria:

- Typing flow, race flow, quick settings, and theme modal behavior unchanged under stress testing.

### Phase 6 - Cleanup and enforcement

- Remove old Radix dependencies no longer used.
- Add lint guardrails (`no-restricted-syntax`/custom rule) to block new native controls outside allowlist.
- Run full regression suite.

Exit criteria:

- Native control count at or near zero (allowlist only).
- Full build/test/lint green.

## 8) QA matrix (must pass)

Automated per phase:

- `bun run build`
- `bun run test:run`
- `bun run lint` (mandatory for medium/large phase)

Manual smoke (every phase touching related screens):

- Home typing start/restart/save flows, shortcut keys, and focus behavior.
- Connect host/join flow including room code, errors, and modal interactions.
- Race flow: create -> lobby -> countdown -> active -> results -> race again.
- Settings and theme dialogs: open/close, keyboard navigation, escape, tab order.
- Stats and achievements dialogs: open nested modal, delete confirm, table sort/select.
- Light/dark switch + theme switch across at least 3 theme profiles.
- Mobile viewport checks for dialog/sheet overflow and touch actions.

Accessibility checks:

- Focus trap and return focus on dialog close.
- Escape closes intended layers only.
- Interactive controls keep labels and aria attributes.

## 9) Regression risks and mitigations

Risk: Dialog focus trapping breaks global typing shortcuts.

- Mitigation: Keep non-modal overlays custom when shortcut/focus behavior requires it; otherwise configure dialog behavior explicitly.

Risk: Theme tokens do not match shadcn expectations.

- Mitigation: Add token bridge before broad component replacement; test dark/light + extreme palettes first.

Risk: Visual drift from style switch.

- Mitigation: Use `base-vega` first, then tune variants/classNames only after parity checks.

Risk: Migration breadth causes merge conflicts in large files.

- Mitigation: Slice into small PRs by domain and finish high-churn files (`TypingPractice`, `Host`) last.

## 10) Definition of done

- Base UI-backed shadcn primitives are the active foundation.
- Feature code uses shadcn components wherever supported.
- Remaining native controls are only approved exceptions and documented.
- No direct Radix primitive imports remain.
- Theme compatibility is verified across dark/light and multiple theme palettes.
- Build, tests, lint, and manual smoke matrix all pass.

## 11) Detailed completion checklist (tasks and subtasks)

Use this checklist as the release gate. The migration is complete only when every item below is checked.

### 11.1 Baseline and scope lock

- [ ] Lock the Base style decision (`base-vega` recommended) and record it in this plan and `components.json`.
- [ ] Capture and store pre-migration counts for native controls and custom overlays.
- [ ] Capture screenshot baseline for key routes (home, host/join, race lobby/active/results, stats, settings).
- [ ] Record baseline command status for `bun run build`, `bun run test:run`, and `bun run lint`.
- [ ] Confirm approved exceptions list is current and explicit.

### 11.2 Base primitive foundation

- [ ] Regenerate existing `src/components/ui/*` primitives as Base-backed variants.
- [ ] Add missing primitives required by this app (`textarea`, `alert-dialog`, `sheet`, `table`, `card`, `badge`, `separator`, `scroll-area`, `toggle-group`, `tooltip`, `kbd`, `native-select`).
- [ ] Verify all `@/components/ui/*` import paths remain stable.
- [ ] Resolve API differences introduced by regenerated components without changing product behavior.
- [ ] Confirm no direct `@radix-ui/*` imports remain inside `src/components/ui/**`.
- [ ] Validate app boots and renders before feature-by-feature migration begins.

### 11.3 Theme token bridge

- [ ] Implement semantic token mapping in `src/context/ThemeContext.tsx` for all required shadcn vars.
- [ ] Keep legacy `--theme-*` variables available during transition.
- [ ] Validate token value formats are compatible with shadcn component styling.
- [ ] Verify token propagation in both light and dark modes.
- [ ] Verify at least three themes (including `typesetgo`, `high-contrast`, and one vivid palette theme).
- [ ] Verify interactive states (hover, focus, active, disabled, destructive) are legible and consistent.

### 11.4 Feature migration checklist by domain

#### 11.4.1 Typing domain

- [ ] `src/components/typing/TypingPractice.tsx`: migrate raw controls to `Button`/`Input`/`Textarea`/`Label` and segmented controls to `ToggleGroup`/`Tabs`/`Switch`.
- [ ] `src/components/typing/TypingPractice.tsx`: replace eligible overlays with `Dialog`/`Sheet`.
- [ ] `src/components/typing/TypingPractice.tsx`: preserve hotkeys (`Tab`, `Shift+Tab`, `Enter`, `Space`) and focus handling parity.
- [ ] `src/components/typing/TypingArea.tsx`: keep hidden native input as approved exception and document why.
- [ ] `src/components/typing/ColorPicker.tsx`: migrate trigger/container to `Popover` + shadcn controls; keep canvas internals custom.
- [ ] `src/components/typing/SoundController.tsx`: migrate trigger to icon `Button`.
- [ ] `src/components/typing/GhostWriterController.tsx`: migrate trigger to icon `Button`.

#### 11.4.2 Host/connect domain

- [ ] `src/pages/Host.tsx`: migrate raw controls to shadcn equivalents (`Button`, `Input`, `Select`/`NativeSelect`, `Textarea`, `Slider`, `Label`, `ToggleGroup`, `Switch`).
- [ ] `src/pages/Host.tsx`: migrate custom overlays/settings panels to `Dialog`/`Sheet`.
- [ ] `src/pages/Host.tsx`: use `AlertDialog` for destructive confirmations.
- [ ] `src/pages/Join.tsx`: migrate form shell to `Card` + shadcn form controls.
- [ ] `src/components/connect/HostCard.tsx`: migrate to `Card` + `Input` + `Button` composition.
- [ ] `src/components/connect/JoinCard.tsx`: migrate to `Card` + `Input` + `Button` composition.
- [ ] `src/components/connect/UserHostCard.tsx`: migrate action controls to `Button`, adopt `Progress` where behavior matches, keep DnD behavior intact.

#### 11.4.3 Race domain

- [ ] `src/pages/Race.tsx`: migrate host/join controls to `Card` + `Input` + `Button`.
- [ ] `src/pages/RaceLobby.tsx`: migrate selectors to `ToggleGroup` and validate countdown overlay strategy.
- [ ] `src/pages/RaceActive.tsx`: migrate leave confirmation flow to `AlertDialog`.
- [ ] `src/pages/RaceResults.tsx`: migrate action controls to `Button` variants.
- [ ] `src/components/race/PlayerCard.tsx`: migrate editable controls to `Input`/`Button`, migrate ready state to `Badge` where appropriate.
- [ ] `src/components/race/EmojiPicker.tsx`: migrate picker shell to `Popover` or `DropdownMenu`.
- [ ] `src/components/race/Podium.tsx`: migrate tabular result markup to shadcn `Table`; keep podium visualization custom.

#### 11.4.4 Plan domain

- [ ] `src/components/plan/PlanBuilderModal.tsx`: migrate modal shell to `Dialog` and controls to shadcn primitives.
- [ ] `src/components/plan/PlanResultsModal.tsx`: migrate modal shell to `Dialog`, results grid to `Table`, chips to `Badge`.
- [ ] `src/components/plan/PlanNavigation.tsx`: migrate navigation controls to `Button`.
- [ ] `src/components/plan/PlanSplash.tsx`: migrate CTA/waiting controls to `Button` variants.

#### 11.4.5 Auth, stats, and layout domain

- [ ] `src/components/auth/StatsModal.tsx`: migrate overlays to `Dialog`/`AlertDialog`, data grid to `Table` + `ScrollArea`, actions to `Button`.
- [ ] `src/pages/UserStats.tsx`: apply same modal/table migration pattern as `StatsModal`.
- [ ] `src/components/auth/AchievementsModal.tsx`: migrate overlay shell to `Dialog` and action controls to `Button`.
- [ ] `src/components/auth/AchievementDetailModal.tsx`: migrate overlay shell to `Dialog` and nav controls to `Button` (plus `Tooltip` when useful).
- [ ] `src/components/auth/AchievementsGrid.tsx`: migrate containers to `Card`, status/tier indicators to `Badge`, actions to `Button`.
- [ ] `src/components/auth/AchievementsCategoryGrid.tsx`: migrate category shells to `Card`, progress indicators to `Badge`.
- [ ] `src/components/auth/UserButton.tsx`: migrate sign-in/avatar triggers to shadcn `Button` (`asChild` where needed).
- [ ] `src/components/layout/Header.tsx`: migrate icon actions to shadcn `Button`, preserve router link semantics.
- [ ] `src/components/layout/NotificationCenter.tsx`: keep `DropdownMenu`, migrate remaining actions to `Button`, unread chips to `Badge`.

#### 11.4.6 Existing shadcn screens requiring Base verification

- [ ] `src/pages/About.tsx`: verify `Tabs` behavior and styling parity after Base primitive swap.
- [ ] `src/components/settings/SoundSettingsModal.tsx`: keep modal primitives and migrate remaining native controls.
- [ ] `src/components/settings/GhostWriterSettingsModal.tsx`: keep modal primitives and migrate remaining native controls.

### 11.5 Modal, focus, and keyboard parity checks

- [ ] Every migrated interactive overlay has correct open/close controls, focus trap, and return focus behavior.
- [ ] `Escape` closes only intended layers in nested overlay scenarios.
- [ ] Global typing shortcuts are not hijacked by modal focus logic.
- [ ] Tabbing order is deterministic and equivalent to current UX intent.
- [ ] Non-interactive overlays that remain custom are explicitly documented as exceptions.

### 11.6 Accessibility and semantics checks

- [ ] Ensure all interactive controls have accessible labels (`Label`, `aria-label`, or equivalent).
- [ ] Ensure form field descriptions/errors are still connected semantically.
- [ ] Ensure destructive actions are clearly labeled and gated by confirmation where needed.
- [ ] Ensure contrast remains acceptable across checked themes/modes.

### 11.7 Cleanup and dependency removal

- [ ] Remove obsolete Radix dependencies no longer used after migration.
- [ ] Confirm feature code has no direct Radix primitive imports.
- [ ] Remove dead custom modal/control helpers replaced by shadcn equivalents.
- [ ] Keep only approved custom/native exceptions and document them.

### 11.8 Guardrails and enforcement

- [ ] Add lint restrictions to prevent new raw `<button|input|select|textarea|label|table>` usage outside allowlist.
- [ ] Add checks for custom `fixed inset-0` overlays where dialog patterns should be used.
- [ ] Create and maintain an allowlist for approved exceptions.
- [ ] Integrate guardrail checks into CI.

### 11.9 Regression and QA sign-off

- [ ] Run `bun run build` and resolve all failures.
- [ ] Run `bun run test:run` and resolve all failures.
- [ ] Run `bun run lint` and resolve all failures.
- [ ] Complete manual smoke flows for typing, connect, race, settings/theme, stats/achievements, and mobile viewport behavior.
- [ ] Re-run native-control and overlay audits and confirm only allowlisted exceptions remain.
- [ ] Compare against baseline screenshots and confirm no unacceptable visual drift.

### 11.10 Documentation and closeout

- [ ] Update this plan's frontmatter `todos` statuses to reflect completion.
- [ ] Record final exception list and rationale in the plan/docs.
- [ ] Record final migration metrics (before/after counts, commands run, QA notes).
- [ ] Capture follow-up tasks (if any) separately from migration completion criteria.

## 12) Optional enforcement scripts (post-migration)

- Add CI checks that fail on native controls outside allowlist:
  - `<button|input|select|textarea|label|table>` in feature files
  - custom `fixed inset-0` modal patterns where dialog is expected
- Keep an allowlist for known exceptions (`TypingArea` hidden input, specific non-interactive overlays).
