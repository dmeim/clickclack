---
name: UI Polish Test Mode Selectors
overview: Refactor the test mode selection UI in TypingPractice.tsx to use shadcn Select/Combobox components for Test Mode, Length/Count (with custom input), and Difficulty, plus a DropdownMenu for Modifiers.
todos:
  - id: install-combobox-deps
    content: Install shadcn Popover and Command components for Combobox functionality
    status: pending
  - id: import-components
    content: Add imports for Select, Combobox, and DropdownMenu shadcn components
    status: pending
  - id: create-test-mode-select
    content: Create Test Mode Select with Zen, Time, Word, Quote options
    status: pending
  - id: create-length-combobox
    content: Create dynamic Length/Count Combobox with presets AND custom input support
    status: pending
  - id: create-difficulty-select
    content: Create Difficulty Select with all difficulty levels
    status: pending
  - id: create-modifiers-dropdown
    content: Create Modifiers DropdownMenu with punctuation, numbers, sound, and ghost writer
    status: pending
  - id: remove-old-ui
    content: Remove the old button-based UI and sub-settings row
    status: pending
  - id: apply-theme-styling
    content: Apply theme colors to match existing design
    status: pending
---

# UI Polish: Test Mode Selection Refactor

## Summary

Replace the current button-based test mode UI with shadcn Select/Combobox components for a cleaner, more polished interface. The Length/Count selector will use a Combobox to allow both preset selection AND custom value input.

## New UI Layout

```
[Test Mode ▼] [Length/Count ▼] [Difficulty ▼] [Modifiers ▼]
```

## Prerequisites - Install Shadcn Components

The Combobox pattern requires Popover + Command components:

```bash
bunx shadcn@latest add popover command
```

## Component Details

### 1. Test Mode Select

- **Options:** Zen (default), Time, Word, Quote
- **Placeholder:** "Test Mode"
- Note: Plan and Preset modes excluded for now (can add back later)

### 2. Length/Count Combobox (Dynamic based on mode)

Uses Combobox pattern: user can select from presets OR type a custom value.

- **Zen mode:** Show infinity symbol (∞) - disabled/static display
- **Time mode:** Presets: `15s`, `30s`, `1m`, `2m`, `5m` + custom input using time notation (`30s`, `2m`, `1h`)
- **Word mode:** Presets: `10`, `25`, `50`, `100`, `500` + custom number input
- **Quote mode:** Fixed options only: All, Short, Medium, Long, XL (no custom)
- **Placeholder:** "Time" | "Count" | "Length" depending on mode
- **Parsing:** Time mode parses `s`/`m`/`h` suffixes; plain numbers default to seconds

### 3. Difficulty Select

- **Options:** Beginner, Easy, Medium, Hard, Expert
- **Placeholder:** "Difficulty"
- **Visibility:** Hidden when in Quote mode (quotes don't use difficulty)

### 4. Modifiers Dropdown Menu

- **Trigger:** Button labeled "Modifiers" with settings icon
- **Contents:**
  - Punctuation (checkbox item)
  - Numbers (checkbox item)
  - Separator
  - Sound Settings (opens modal via SoundController)
  - Ghost Writer Settings (opens modal via GhostWriterController)
- Note: Punctuation/Numbers disabled in Quote mode

## Files to Modify

- [src/components/typing/TypingPractice.tsx](src/components/typing/TypingPractice.tsx) - Main component (lines ~1256-1470)
- New: `src/components/ui/popover.tsx` - Shadcn Popover component
- New: `src/components/ui/command.tsx` - Shadcn Command component

## Key Code References

Current settings controls location in `TypingPractice.tsx`:

```1256:1261:src/components/typing/TypingPractice.tsx
      {/* Settings Controls - Fixed at top */}
      {!connectMode && !isRunning && !isFinished && (
        <div
          className="fixed top-[130px] md:top-[15%] left-0 w-full flex flex-col items-center justify-center gap-4 transition-all duration-300 z-20"
          style={{ fontSize: `${settings.iconFontSize}rem`, opacity: uiOpacity }}
        >
```

## Implementation Approach

1. Run `bunx shadcn@latest add popover command` to add Combobox dependencies
2. Import Select, DropdownMenu, Popover, and Command components
3. Replace the "Modes Row" div (lines 1262-1375) with new layout
4. Build the Length/Count Combobox:

   - Popover contains Command with preset items
   - Input field at top for typing custom values
   - For Time/Word modes: validate numeric input
   - For Quote mode: use regular Select (no custom input needed)

5. Remove the "Line 3: Sub-settings" div (lines 1378-1469)
6. Style all components to match the existing theme

## Combobox Behavior for Time/Word Modes

### Time Mode Input

```
┌─────────────────────────┐
│ Type or select...    ▼  │  <- Input field
├─────────────────────────┤
│ ○ 15s                   │
│ ○ 30s                   │
│ ● 1m (selected)         │
│ ○ 2m                    │
│ ○ 5m                    │
└─────────────────────────┘
```

**Time Notation Format:**

- `s` = seconds (e.g., `30s` = 30 seconds)
- `m` = minutes (e.g., `2m` = 120 seconds)
- `h` = hours (e.g., `1h` = 3600 seconds)
- Plain number defaults to seconds (e.g., `45` = 45 seconds)

**Examples:**

- `30s` → 30 seconds
- `90s` → 90 seconds
- `2m` → 2 minutes (120 seconds)
- `1.5m` → 1.5 minutes (90 seconds)
- `1h` → 1 hour (3600 seconds)

**Preset Display Values:**

- TIME_PRESETS [15, 30, 60, 120, 300] displayed as: `15s`, `30s`, `1m`, `2m`, `5m`

### Word Mode Input

```
┌─────────────────────────┐
│ Type or select...    ▼  │  <- Input field
├─────────────────────────┤
│ ○ 10                    │
│ ○ 25                    │
│ ● 50 (selected)         │
│ ○ 100                   │
│ ○ 500                   │
└─────────────────────────┘
```

- Just numbers (word count)
- WORD_PRESETS [10, 25, 50, 100, 500]

### Validation Limits

- Time: 5 seconds to 2 hours (5s - 2h)
- Words: 5 to 1000 words

## Theme Styling Requirements

All components must use the dynamic `theme` object for colors (not hardcoded CSS variables).

### Theme Color Mapping

| Element | Theme Property |

|---------|----------------|

| Container/Card backgrounds | `theme.surfaceColor` |

| Dropdown/Popover backgrounds | `theme.surfaceColor` |

| Selected item text | `theme.buttonSelected` |

| Unselected/default text | `theme.defaultText` |

| Primary text (labels) | `theme.correctText` |

| Borders | `${theme.defaultText}30` (30% opacity) |

| Hover states | `${theme.buttonSelected}20` (20% opacity bg) |

| Focus rings | `theme.buttonSelected` |

### Component-Specific Styling

**Select Trigger:**

```tsx
style={{
  backgroundColor: theme.surfaceColor,
  borderColor: `${theme.defaultText}30`,
  color: theme.correctText,
}}
```

**Select Content (Dropdown):**

```tsx
style={{
  backgroundColor: theme.surfaceColor,
  borderColor: `${theme.defaultText}30`,
}}
```

**Select Item:**

```tsx
// Default state
style={{ color: theme.defaultText }}

// Selected/Active state
style={{ 
  color: theme.buttonSelected,
  backgroundColor: `${theme.buttonSelected}20`,
}}
```

**Combobox Input:**

```tsx
style={{
  backgroundColor: theme.surfaceColor,
  borderColor: `${theme.defaultText}30`,
  color: theme.correctText,
}}
```

**DropdownMenu Trigger:**

```tsx
style={{
  backgroundColor: theme.surfaceColor,
  color: theme.defaultText,
  borderColor: `${theme.defaultText}30`,
}}
```

**DropdownMenu Content:**

```tsx
style={{
  backgroundColor: theme.surfaceColor,
  borderColor: `${theme.defaultText}30`,
}}
```

**DropdownMenu CheckboxItem (checked):**

```tsx
style={{
  color: theme.buttonSelected,
}}
```

### Override Shadcn Default Styles

Since shadcn uses CSS variables (`bg-popover`, `text-popover-foreground`, etc.), we need to:

1. Pass `className` to remove default background/text classes where needed
2. Use inline `style` props with theme values
3. Use `cn()` utility to merge custom classes

Example pattern:

```tsx
<SelectContent
  className="border-0" // Remove default border
  style={{
    backgroundColor: theme.surfaceColor,
    borderWidth: 1,
    borderColor: `${theme.defaultText}30`,
  }}
>
```

### Responsive Behavior

- Components should work on both mobile and desktop
- Dropdowns should have appropriate max-height on mobile
- Touch-friendly tap targets (min 44px height)