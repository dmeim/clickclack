---
name: Animals Category Creation
overview: Create a new "Animals" theme category, move existing animal themes into it, and add 30 new themes (15 animals + 15 nature).
todos:
  - id: add-type
    content: Add `animals` to ThemeCategory union type in src/types/theme.ts
    status: completed
  - id: update-config
    content: Add Animals to CATEGORY_CONFIG and update order numbers in src/lib/themes.ts
    status: completed
  - id: update-groups
    content: "Add `animals: []` to groups object in groupThemesByCategory function"
    status: completed
  - id: move-existing
    content: Update category in 10 existing animal theme JSON files (bee, butterfly, dolphin, flamingo, fox, owl, peacock, penguin, tiger, wolf)
    status: completed
  - id: create-animal-themes
    content: Create 15 new animal themes (bear, chameleon, deer, dragonfly, elephant, firefly, frog, hummingbird, jellyfish, koala, lion, parrot, rabbit, raven, snake)
    status: completed
  - id: create-nature-themes
    content: Create 15 new nature themes (aurora, bonsai, cliff, driftwood, fern, glacier, lagoon, moss, mushroom, swamp, tide-pool, vineyard, waterfall, wetland, wildflower)
    status: completed
  - id: verify-build
    content: Run bun run build to verify no type errors
    status: completed
isProject: false
---

# Create Animals Theme Category + 30 New Themes

## Summary

1. Create a new "Animals" category positioned between Color Theory and Nature
2. Move 10 existing animal themes from Nature to Animals
3. Add 15 new animal themes
4. Add 15 new nature themes

## Part 1: Category Infrastructure

### [src/types/theme.ts](src/types/theme.ts)

Add `"animals"` to the `ThemeCategory` union type (between `"color-theory"` and `"nature"`).

### [src/lib/themes.ts](src/lib/themes.ts)

- Add `"animals": { displayName: "Animals", order: 7 }` to `CATEGORY_CONFIG`
- Increment order for nature (8), weather (9), space (10), time (11), retro (12), cultural (13), gaming (14), movies (15), tv-shows (16), anime (17), music (18), sports (19), food (20), fun (21), holiday (22)
- Add `animals: []` to groups object in `groupThemesByCategory()`

## Part 2: Move Existing Animal Themes (10 files)

Change `"category": "nature"` to `"category": "animals"` in:

- bee, butterfly, dolphin, flamingo, fox, owl, peacock, penguin, tiger, wolf

## Part 3: New Animal Themes (15 files)

Create in `public/themes/` with `"category": "animals"`:


| Theme       | Color Palette                                       |
| ----------- | --------------------------------------------------- |
| bear        | Deep browns (#3d2817), honey gold (#daa520), cream  |
| chameleon   | Vibrant green (#00a86b), multi-color accents        |
| deer        | Warm browns (#8b4513), soft cream (#f5f5dc)         |
| dragonfly   | Iridescent blue (#0077be), teal (#008080)           |
| elephant    | Majestic gray (#708090), ivory (#fffff0)            |
| firefly     | Dark (#1a1a2e), warm yellow-green glow (#adff2f)    |
| frog        | Bright green (#32cd32), tropical orange             |
| hummingbird | Iridescent green (#50c878), magenta (#ff00ff), blue |
| jellyfish   | Translucent purple (#9370db), bioluminescent cyan   |
| koala       | Soft gray (#a9a9a9), eucalyptus green (#2e8b57)     |
| lion        | Golden amber (#ffbf00), mane orange (#ff8c00)       |
| parrot      | Tropical red (#ff4500), yellow, green, blue         |
| rabbit      | Soft white (#f8f8ff), gray, pink (#ffb6c1)          |
| raven       | Deep purple-black (#1a1a2e), iridescent purple      |
| snake       | Emerald green (#50c878), scale pattern accents      |


## Part 4: New Nature Themes (15 files)

Create in `public/themes/` with `"category": "nature"`:


| Theme      | Color Palette                                           |
| ---------- | ------------------------------------------------------- |
| aurora     | Northern lights green (#00ff7f), purple (#9400d3), pink |
| bonsai     | Zen green (#228b22), warm wood brown (#8b4513)          |
| cliff      | Rocky gray (#696969), coastal blue (#4682b4)            |
| driftwood  | Weathered gray (#a9a9a9), sandy beige (#f5deb3)         |
| fern       | Lush deep green (#006400), forest accents               |
| glacier    | Icy blue (#add8e6), crystalline white (#f0ffff)         |
| lagoon     | Tropical turquoise (#40e0d0), aqua (#00ffff)            |
| moss       | Deep green (#556b2f), earthy brown (#8b4513)            |
| mushroom   | Earth brown (#8b4513), cream cap (#fffdd0), red spots   |
| swamp      | Murky green (#556b2f), muddy brown (#5c4033)            |
| tide-pool  | Ocean blue (#1e90ff), coral pink (#ff7f50)              |
| vineyard   | Wine purple (#722f37), vine green (#228b22)             |
| waterfall  | Rushing blue (#4169e1), misty white (#f5f5f5), moss     |
| wetland    | Soft green (#8fbc8f), reflective blue (#87ceeb)         |
| wildflower | Purple (#9370db), pink (#ff69b4), yellow (#ffd700)      |


## Verification

Run `bun run build` to ensure no type errors are introduced.