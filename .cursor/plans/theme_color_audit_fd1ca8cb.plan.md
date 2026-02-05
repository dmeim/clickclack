---
name: Theme Color Audit
overview: Audit and fix how UI elements pull colors from theme palettes, addressing semantic mismatches and inconsistencies introduced during the light/dark mode migration.
todos:
  - id: extend-legacy-theme
    content: Extend LegacyTheme type in src/types/theme.ts with new semantic properties (textPrimary, textSecondary, textMuted, borderDefault, etc.)
    status: completed
  - id: update-tolegacytheme
    content: Update toLegacyTheme() function to map new properties from ThemeColors
    status: completed
  - id: update-fallback-themes
    content: Update all component fallback themes to include new properties
    status: completed
  - id: update-typing-practice
    content: Audit and update TypingPractice.tsx - separate typing UI colors from general UI colors
    status: completed
  - id: update-modal-components
    content: Update modal components (StatsModal, AchievementsModal, etc.) to use correct semantic colors
    status: completed
  - id: update-page-components
    content: Update page components (Leaderboard, UserStats, About, etc.) to use correct semantic colors
    status: completed
  - id: update-layout-components
    content: Update layout components (Header, NotificationCenter, UserButton) to use correct semantic colors
    status: completed
  - id: update-settings-modals
    content: Update settings modals (SoundSettingsModal, GhostWriterSettingsModal) to use correct semantic colors
    status: completed
  - id: visual-qa
    content: Test changes across multiple themes (typesetgo, solarized light/dark, high contrast themes) to verify visual consistency
    status: completed
isProject: false
---

# Theme Color Mapping Audit

## Current State

The theme system has a rich palette structure with semantic color groupings:

```
ThemeColors (per mode)
├── bg:          base, surface, elevated, overlay
├── text:        primary, secondary, muted, inverse
├── interactive: primary, secondary, accent (each with DEFAULT/muted/subtle)
├── status:      success, error, warning (each with DEFAULT/muted/subtle)
├── border:      default, subtle, focus
└── typing:      cursor, cursorGhost, correct, incorrect, upcoming, default
```

However, components consume colors via a **legacy mapping** in [src/types/theme.ts](src/types/theme.ts) that was designed for the original simpler theme:

```typescript
legacyTheme = {
  cursor: colors.typing.cursor,
  defaultText: colors.typing.default,      // Typing-specific color
  correctText: colors.typing.correct,      // Typing-specific color
  buttonUnselected: colors.interactive.primary.DEFAULT,
  buttonSelected: colors.interactive.secondary.DEFAULT,
  backgroundColor: colors.bg.base,
  surfaceColor: colors.bg.surface,
  // ...
}
```

---

## Identified Issues

### 1. Semantic Mismatch: `defaultText` (High Priority)

**Problem**: `typing.default` is intended for un-typed text in the typing interface, but components use `theme.defaultText` for general UI purposes:


| Current Usage                                | Files                                        | Should Use                          |
| -------------------------------------------- | -------------------------------------------- | ----------------------------------- |
| Modal descriptions                           | StatsModal, AchievementsModal, etc.          | `text.secondary`                    |
| Form labels                                  | SoundSettingsModal, GhostWriterSettingsModal | `text.secondary`                    |
| Border colors (via `${theme.defaultText}30`) | Multiple files                               | `border.default` or `border.subtle` |
| Muted metadata                               | Leaderboard, UserStats                       | `text.muted`                        |


**Usage count**: ~162 instances across 24 files

### 2. Semantic Mismatch: `correctText` (High Priority)

**Problem**: `typing.correct` is intended for correctly-typed characters, but it's used for primary text content:


| Current Usage               | Files                   | Should Use     |
| --------------------------- | ----------------------- | -------------- |
| Modal titles and headings   | All modals              | `text.primary` |
| Usernames and display names | Leaderboard, UserButton | `text.primary` |
| Primary content text        | Most components         | `text.primary` |


### 3. Missing Palette Access (Medium Priority)

The legacy mapping doesn't expose useful colors that exist in the palette:

- `text.muted` - for hints, placeholders, subtle text
- `text.inverse` - for text on colored backgrounds
- `bg.elevated` - for dropdowns, tooltips
- `bg.overlay` - for modal backdrops
- `border.*` - for consistent border styling
- `status.*` - for success/error/warning states
- `interactive.accent` and all `muted`/`subtle` variants

### 4. Manual Opacity Patterns (Low Priority)

Components create opacity variants manually (`${theme.defaultText}30`) instead of using the built-in `muted` and `subtle` variants that already exist in the palette.

### 5. Hardcoded Tailwind Colors (Low Priority)

Some hover states use hardcoded colors like `bg-gray-800/50` which don't adapt to themes.

### 6. Shadcn UI Variables Disconnected (Low Priority)

The Shadcn/UI CSS variables in [src/index.css](src/index.css) (lines 116-135) are hardcoded HSL values that don't update with theme changes. This means standard Shadcn components won't be theme-aware.

---

## Recommended Solution

### Phase 1: Extend Legacy Theme Mapping

Update [src/types/theme.ts](src/types/theme.ts) `toLegacyTheme()` to include additional semantic mappings:

```typescript
export type LegacyTheme = {
  // Existing (keep for typing UI)
  cursor: string;
  defaultText: string;      // Keep for typing UI
  correctText: string;      // Keep for typing UI
  // ...

  // NEW: General UI text
  textPrimary: string;      // colors.text.primary
  textSecondary: string;    // colors.text.secondary
  textMuted: string;        // colors.text.muted
  textInverse: string;      // colors.text.inverse

  // NEW: Borders
  borderDefault: string;    // colors.border.default
  borderSubtle: string;     // colors.border.subtle
  borderFocus: string;      // colors.border.focus

  // NEW: Status
  statusSuccess: string;    // colors.status.success.DEFAULT
  statusError: string;      // colors.status.error.DEFAULT
  statusWarning: string;    // colors.status.warning.DEFAULT
};
```

### Phase 2: Update Components

Systematically update components to use correct semantic colors:


| Replace                  | With                  | Context                             |
| ------------------------ | --------------------- | ----------------------------------- |
| `theme.correctText`      | `theme.textPrimary`   | General headings and primary text   |
| `theme.defaultText`      | `theme.textSecondary` | Labels, descriptions, muted content |
| `${theme.defaultText}30` | `theme.borderSubtle`  | Border colors                       |
| `theme.incorrectText`    | `theme.statusError`   | Error states outside typing         |


### Phase 3: Update Shadcn Variables (Optional)

Connect Shadcn CSS variables in [src/context/ThemeContext.tsx](src/context/ThemeContext.tsx) to dynamically set them based on theme colors.

---

## Files Requiring Updates

**Core:**

- [src/types/theme.ts](src/types/theme.ts) - Extend LegacyTheme type and toLegacyTheme()

**High-impact components (use defaultText/correctText extensively):**

- [src/components/typing/TypingPractice.tsx](src/components/typing/TypingPractice.tsx) - 162 theme usages
- [src/components/auth/StatsModal.tsx](src/components/auth/StatsModal.tsx)
- [src/components/auth/AchievementsModal.tsx](src/components/auth/AchievementsModal.tsx)
- [src/components/auth/AchievementsCategoryGrid.tsx](src/components/auth/AchievementsCategoryGrid.tsx)
- [src/pages/Leaderboard.tsx](src/pages/Leaderboard.tsx)
- [src/pages/UserStats.tsx](src/pages/UserStats.tsx)

**Other components:**

- [src/components/layout/Header.tsx](src/components/layout/Header.tsx)
- [src/components/layout/NotificationCenter.tsx](src/components/layout/NotificationCenter.tsx)
- [src/components/auth/UserButton.tsx](src/components/auth/UserButton.tsx)
- [src/components/settings/SoundSettingsModal.tsx](src/components/settings/SoundSettingsModal.tsx)
- [src/components/settings/GhostWriterSettingsModal.tsx](src/components/settings/GhostWriterSettingsModal.tsx)
- [src/components/plan/*.tsx](src/components/plan/)
- [src/pages/About.tsx](src/pages/About.tsx), [src/pages/Privacy.tsx](src/pages/Privacy.tsx), [src/pages/TermsOfService.tsx](src/pages/TermsOfService.tsx)

---

## Risks and Considerations

1. **Backwards compatibility**: Must keep existing `defaultText`/`correctText` working for actual typing interface
2. **Scope**: ~24 files and hundreds of style attributes need review
3. **Visual testing**: Each change needs visual verification across multiple themes (especially light vs dark)
4. **Gradual rollout**: Consider updating one component at a time with visual QA

