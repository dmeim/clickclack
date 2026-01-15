---
name: Add Theme Collection
overview: Add 50+ new themes as JSON files in /public/themes/ and redesign the theme picker UI with a custom theme dropdown and a scrollable 3x4 grid layout.
todos:
  - id: add-themes
    content: Add 56 new theme JSON files to /public/themes/ (auto-discovered by Vite plugin)
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

## Data-Driven Architecture

All content is **100% data-driven** with **zero manual configuration**. A Vite plugin (`vite-plugin-auto-manifest.ts`) automatically scans `/public` folders at build time.

**To add a new theme:** Just create `/public/themes/{name}.json` - that's it!

The plugin auto-generates manifests (gitignored) so the app knows what's available.

---

## Part 1: Add New Themes

### What to Do

Create 56 new JSON files in `/public/themes/`. No code changes needed.

### Theme JSON Structure

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

Update the theme modal in `src/components/typing/TypingPractice.tsx`:

### Current Structure

- Dropdown showing all themes in a list
- 2-column "Featured" grid showing all themes

### New Structure

**1. Theme Grid (top section)**

- Remove the old dropdown entirely
- Change from `grid-cols-2` to `grid-cols-3`
- Fixed height showing 4 rows + partial 5th row peek (~20-30px visible)
- Add `overflow-y-auto` for scrolling
- Optional: fade gradient at bottom as scroll hint

**2. Separator**

- Horizontal divider (`border-t border-gray-600`)

**3. Custom Theme Dropdown (below separator)**

- Button label: "Custom Theme"
- When expanded, shows color pickers for each theme property
- Reuse existing `ColorPicker` component from `src/components/typing/ColorPicker.tsx`
- Include "Reset" buttons per field and "Reset All" at bottom

### Layout Calculation

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
| [Card13][Card14][...             |  <- Row 5 (partial peek)
|  ~~~ scroll indicator ~~~        |
+----------------------------------+
|  ─────────────────────────────   |  <- Separator
+----------------------------------+
| [v] Custom Theme                 |  <- Dropdown (collapsed)
|   +----------------------------+ |
|   | Cursor:        [#color] R  | |  <- Expanded shows pickers
|   | Background:    [#color] R  | |
|   | ...                        | |
|   | [Reset All Defaults]       | |
|   +----------------------------+ |
+----------------------------------+
```