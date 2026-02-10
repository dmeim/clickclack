---
name: Theme Category Reorganization
overview: Reorganize theme category order to group similar categories together, and rename the default category to "Featured" for highlighting special themes.
todos:
  - id: update-category-config
    content: Update CATEGORY_CONFIG in src/lib/themes.ts - reorder categories and rename default to "Featured"
    status: completed
  - id: update-groups-object
    content: Reorder the groups object in groupThemesByCategory function for consistency
    status: completed
  - id: rename-fallout-theme
    content: Rename fallout.json to nuclear-fallout.json and add display name override
    status: completed
  - id: create-fallout-gaming
    content: Create new fallout.json theme in gaming category with Vault-Tec/wasteland colors
    status: completed
  - id: verify-build
    content: Run build and test to verify changes work correctly
    status: completed
isProject: false
---

# Theme Category Reorganization

## Current State

There are **438 themes** across **22 categories**. The current order in `[src/lib/themes.ts](src/lib/themes.ts)` appears somewhat arbitrary, with similar categories scattered:

```
0. default → 1. editor → 2. holiday → 3. nature → 4. time → 5. retro → 
6. aesthetic → 7. utility → 8. fun → 9. weather → 10. brand → 
11. color-theory → 12. cultural → 13. productivity → 14. gaming → 
15. music → 16. food → 17. space → 18. sports → 19. tv-shows → 
20. movies → 21. anime
```

## Proposed New Ordering

Group similar categories together in logical sections:

### Featured (1 category)


| Order | Category  | Display Name | Theme Count |
| ----- | --------- | ------------ | ----------- |
| 0     | `default` | Featured     | 1           |


This category serves as a special place to highlight new themes or favorites. Currently contains only TypeSetGo.

### Technical/Developer (2 categories)


| Order | Category | Display Name | Theme Count |
| ----- | -------- | ------------ | ----------- |
| 1     | `editor` | Editor/IDE   | 37          |
| 2     | `brand`  | Brand        | 30          |


### Productivity/Utility (2 categories)


| Order | Category       | Display Name | Theme Count |
| ----- | -------------- | ------------ | ----------- |
| 3     | `productivity` | Productivity | 17          |
| 4     | `utility`      | Utility      | 15          |


### Design/Visual (2 categories)


| Order | Category       | Display Name | Theme Count |
| ----- | -------------- | ------------ | ----------- |
| 5     | `aesthetic`    | Aesthetic    | 29          |
| 6     | `color-theory` | Color Theory | 17          |


### Nature/Environment (4 categories)


| Order | Category  | Display Name | Theme Count |
| ----- | --------- | ------------ | ----------- |
| 7     | `nature`  | Nature       | 36          |
| 8     | `weather` | Weather      | 17          |
| 9     | `space`   | Space        | 19          |
| 10    | `time`    | Time of Day  | 11          |


### Era/Culture (2 categories)


| Order | Category   | Display Name | Theme Count |
| ----- | ---------- | ------------ | ----------- |
| 11    | `retro`    | Retro/Tech   | 25          |
| 12    | `cultural` | Cultural     | 15          |


### Entertainment/Media (4 categories - grouped per user request)


| Order | Category   | Display Name | Theme Count |
| ----- | ---------- | ------------ | ----------- |
| 13    | `gaming`   | Gaming       | 56          |
| 14    | `movies`   | Movies       | 11          |
| 15    | `tv-shows` | TV Shows     | 8           |
| 16    | `anime`    | Anime        | 12          |


### Lifestyle (5 categories)


| Order | Category  | Display Name | Theme Count |
| ----- | --------- | ------------ | ----------- |
| 17    | `music`   | Music        | 13          |
| 18    | `sports`  | Sports       | 12          |
| 19    | `food`    | Food         | 26          |
| 20    | `fun`     | Fun          | 18          |
| 21    | `holiday` | Holiday      | 14          |


## Changes Required

### File: `[src/lib/themes.ts](src/lib/themes.ts)`

Update the `CATEGORY_CONFIG` object (lines 14-37) to reflect the new order values:

```typescript
export const CATEGORY_CONFIG: Record<ThemeCategory, CategoryConfig> = {
  // Featured
  default: { displayName: "Featured", order: 0 },
  // Technical/Developer
  editor: { displayName: "Editor/IDE", order: 1 },
  brand: { displayName: "Brand", order: 2 },
  // Productivity/Utility
  productivity: { displayName: "Productivity", order: 3 },
  utility: { displayName: "Utility", order: 4 },
  // Design/Visual
  aesthetic: { displayName: "Aesthetic", order: 5 },
  "color-theory": { displayName: "Color Theory", order: 6 },
  // Nature/Environment
  nature: { displayName: "Nature", order: 7 },
  weather: { displayName: "Weather", order: 8 },
  space: { displayName: "Space", order: 9 },
  time: { displayName: "Time of Day", order: 10 },
  // Era/Culture
  retro: { displayName: "Retro/Tech", order: 11 },
  cultural: { displayName: "Cultural", order: 12 },
  // Entertainment/Media
  gaming: { displayName: "Gaming", order: 13 },
  movies: { displayName: "Movies", order: 14 },
  "tv-shows": { displayName: "TV Shows", order: 15 },
  anime: { displayName: "Anime", order: 16 },
  // Lifestyle
  music: { displayName: "Music", order: 17 },
  sports: { displayName: "Sports", order: 18 },
  food: { displayName: "Food", order: 19 },
  fun: { displayName: "Fun", order: 20 },
  holiday: { displayName: "Holiday", order: 21 },
};
```

### File: `[src/lib/themes.ts](src/lib/themes.ts)`

Update the `groupThemesByCategory` function's `groups` object (lines 207-230) to match the same logical order for consistency.

## Theme Changes

### Fallout Theme Split

The current `fallout` theme represents the retro-futuristic 1950s aesthetic (green terminal/Pip-Boy style) rather than the game franchise colors. To address this:

1. **Rename existing theme**: `fallout.json` → `nuclear-fallout.json`
  - Keep in `retro` category
  - Add display name override: `"nuclear-fallout": "Nuclear Fallout"`
  - Represents the retro-futuristic atomic age aesthetic
2. **Create new gaming theme**: `fallout.json`
  - Set category to `gaming`
  - Design based on actual Fallout game branding (Vault-Tec blue/yellow, wasteland browns)
  - Represents the Fallout video game franchise

