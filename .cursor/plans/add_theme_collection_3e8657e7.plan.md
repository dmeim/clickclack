---
name: Add Theme Collection
overview: Add 50+ new themes as JSON files in /public/themes/ and redesign the theme picker UI with a custom theme dropdown and a scrollable 3x4 grid layout.
todos:
  - id: add-themes
    content: Add 56 new theme JSON files to /public/themes/ and update THEME_LIST in src/lib/themes.ts
    status: pending
  - id: custom-dropdown
    content: Replace theme list dropdown with Custom Theme dropdown containing color pickers for all theme properties
    status: pending
  - id: grid-layout
    content: Change theme grid to 3 columns with fixed height showing 4 rows + partial 5th row peek, add scroll
    status: pending
  - id: test-build
    content: Run bun run build and bun run test:run to verify changes
    status: pending
---

# Add Theme Collection and Redesign Theme Picker

## Files to Modify

- `/public/themes/*.json` - Add new theme JSON files (one per theme)
- [src/lib/themes.ts](src/lib/themes.ts) - Update `THEME_LIST` array with new theme names
- [src/components/typing/TypingPractice.tsx](src/components/typing/TypingPractice.tsx) - Redesign theme modal UI

## Part 1: Add New Themes

Themes are now loaded dynamically from `/public/themes/`. To add a new theme:

1. Create a JSON file in `/public/themes/{theme-name}.json` with the theme colors
2. Add the theme name to `THEME_LIST` in `src/lib/themes.ts`

### Theme JSON Structure

Each theme JSON file should have this structure:

```json
{
  "backgroundColor": "#hexcolor",
  "surfaceColor": "#hexcolor",
  "cursor": "#hexcolor",
  "ghostCursor": "#hexcolor",
  "defaultText": "#hexcolor",
  "upcomingText": "#hexcolor",
  "correctText": "#hexcolor",
  "incorrectText": "#hexcolor",
  "buttonUnselected": "#hexcolor",
  "buttonSelected": "#hexcolor"
}
```

### Themes to Add (56 total)

**Established Editor/IDE Themes (20):**

- dracula, monokai, solarized-dark, solarized-light, one-dark, gruvbox, nord, tokyo-night
- catppuccin, rose-pine, everforest, kanagawa, ayu, material, palenight
- horizon, night-owl, cobalt, github-dark, github-light

**Holiday Themes (6):**

- halloween, valentines, st-patricks, new-years, fourth-of-july, winter

**Nature Themes (7):**

- forest, desert, aurora, volcanic, arctic, cherry-blossom, jungle

**Time of Day Themes (4):**

- midnight, dawn, twilight, golden-hour

**Retro/Tech Themes (5):**

- terminal, cyberpunk, synthwave, matrix, arcade

**Aesthetic Themes (7):**

- noir, neon, pastel, minimalist, lavender, mint, sepia

**Utility Themes (3):**

- high-contrast, paper, warm-night

**Fun Themes (4):**

- candy, cosmic, steampunk, gothic

**Total: 56 new themes** (62 including existing 6)

---

## Part 2: Redesign Theme Modal UI

Update the theme modal in [src/components/typing/TypingPractice.tsx](src/components/typing/TypingPractice.tsx):

### Current Structure:

- Dropdown showing all themes in a list
- 2-column "Featured" grid showing all themes

### New Structure:

**1. Theme Grid (top section)**

- Remove the old dropdown entirely
- Change from `grid-cols-2` to `grid-cols-3`
- Container height: fixed to show exactly 4 rows + partial 5th row peek (~20-30px visible)
- Add `overflow-y-auto` for scrolling
- Calculate height based on card size (e.g., `max-h-[420px]` with slight overflow)
- Optional: add fade gradient at bottom to reinforce scroll hint

**2. Separator**

- Horizontal divider line between theme grid and custom section
- Use `border-t border-gray-600` or similar styling

**3. Custom Theme Dropdown (below separator)**

- Button label: "Custom Theme" (or shows "Custom" when custom values active)
- When expanded, shows color pickers for each theme property:
  - Cursor, Default Text, Upcoming Text, Correct Text, Incorrect Text
  - Button Unselected, Button Selected, Background, Surface, Ghost Cursor
- Reuse the existing `ColorPicker` component from [src/components/typing/ColorPicker.tsx](src/components/typing/ColorPicker.tsx)
- Include "Reset" buttons per field and "Reset All" at bottom (similar to Host.tsx pattern)

### Layout Calculation:

- Theme card height: ~80px (including padding and gap)
- 4 full rows = 320px + gaps
- 5th row peek = ~30px visible
- Total container height: ~380-400px with overflow

---

## Visual Reference

```
+----------------------------------+
|  Theme                       [X] |
+----------------------------------+
| [Card1] [Card2] [Card3]          |  <- 3 columns
| [Card4] [Card5] [Card6]          |
| [Card7] [Card8] [Card9]          |
| [Card10][Card11][Card12]         |  <- Row 4
| [Card13][Card14][...             |  <- Row 5 (partial, ~30px visible)
|  ~~~ scroll indicator ~~~        |
+----------------------------------+
|  ─────────────────────────────   |  <- Separator
+----------------------------------+
| [v] Custom Theme                 |  <- Dropdown (collapsed)
|   +----------------------------+ |
|   | Cursor:        [#color] R  | |  <- Expanded shows color pickers
|   | Background:    [#color] R  | |
|   | ...                        | |
|   | [Reset All Defaults]       | |
|   +----------------------------+ |
+----------------------------------+
```