import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import { CATEGORY_CONFIG, groupThemesByCategory } from "@/lib/themes";
import type { ThemeColors, ThemeDefinition } from "@/types/theme";

const COLORS: ThemeColors = {
  bg: {
    base: "#000000",
    surface: "#111111",
    elevated: "#222222",
    overlay: "rgba(0, 0, 0, 0.5)",
  },
  text: {
    primary: "#ffffff",
    secondary: "#bbbbbb",
    muted: "rgba(187, 187, 187, 0.6)",
    inverse: "#000000",
  },
  interactive: {
    primary: {
      DEFAULT: "#3cb5ee",
      muted: "rgba(60, 181, 238, 0.3)",
      subtle: "rgba(60, 181, 238, 0.1)",
    },
    secondary: {
      DEFAULT: "#0097b2",
      muted: "rgba(0, 151, 178, 0.3)",
      subtle: "rgba(0, 151, 178, 0.1)",
    },
    accent: {
      DEFAULT: "#a855f7",
      muted: "rgba(168, 85, 247, 0.3)",
      subtle: "rgba(168, 85, 247, 0.1)",
    },
  },
  status: {
    success: {
      DEFAULT: "#22c55e",
      muted: "rgba(34, 197, 94, 0.3)",
      subtle: "rgba(34, 197, 94, 0.1)",
    },
    error: {
      DEFAULT: "#ef4444",
      muted: "rgba(239, 68, 68, 0.3)",
      subtle: "rgba(239, 68, 68, 0.1)",
    },
    warning: {
      DEFAULT: "#f59e0b",
      muted: "rgba(245, 158, 11, 0.3)",
      subtle: "rgba(245, 158, 11, 0.1)",
    },
  },
  border: {
    default: "rgba(75, 85, 99, 0.3)",
    subtle: "rgba(75, 85, 99, 0.15)",
    focus: "#3cb5ee",
  },
  typing: {
    cursor: "#3cb5ee",
    cursorGhost: "#a855f7",
    correct: "#d1d5db",
    incorrect: "#ef4444",
    upcoming: "#4b5563",
    default: "#4b5563",
  },
};

const createTheme = (id: string, category: ThemeDefinition["category"]): ThemeDefinition => ({
  id,
  name: id,
  category,
  dark: COLORS,
  light: null,
});

const readThemeVariantIds = (themeId: string) => {
  const theme = JSON.parse(readFileSync(`public/themes/${themeId}.json`, "utf8")) as {
    variants: Record<string, unknown>;
  };
  return Object.keys(theme.variants);
};

const readThemeCategoryAndVariantCount = (themeId: string) => {
  const theme = JSON.parse(readFileSync(`public/themes/${themeId}.json`, "utf8")) as {
    category: string;
    variants: Record<string, unknown>;
  };
  return { category: theme.category, variantCount: Object.keys(theme.variants).length };
};

describe("theme categories", () => {
  it("includes new categories in CATEGORY_CONFIG", () => {
    expect(CATEGORY_CONFIG.books.displayName).toBe("Books");
    expect(CATEGORY_CONFIG.mythology.displayName).toBe("Mythology");
    expect(CATEGORY_CONFIG.cities.displayName).toBe("Cities");
    expect(CATEGORY_CONFIG.subject.displayName).toBe("School Subjects");
  });

  it("groups themes by new categories in configured order", () => {
    const themes: ThemeDefinition[] = [
      createTheme("zeta", "gaming"),
      createTheme("beta", "books"),
      createTheme("alpha", "books"),
      createTheme("gamma", "subject"),
      createTheme("delta", "cities"),
      createTheme("omega", "mythology"),
    ];

    const groups = groupThemesByCategory(themes);
    expect(groups.map((g) => g.category)).toEqual([
      "books",
      "mythology",
      "cities",
      "subject",
      "gaming",
    ]);
    expect(groups.find((g) => g.category === "books")?.themes.map((t) => t.name)).toEqual([
      "alpha",
      "beta",
    ]);
  });

  it("falls back unknown runtime category to default", () => {
    const malformedTheme = {
      ...createTheme("malformed", "books"),
      category: "unknown-category",
    } as ThemeDefinition;

    const groups = groupThemesByCategory([malformedTheme]);
    expect(groups).toHaveLength(1);
    expect(groups[0].category).toBe("default");
    expect(groups[0].themes[0].id).toBe("malformed");
  });

  it("adds character variants to media themes", () => {
    const mediaThemes = [
      "attack-on-titan",
      "chainsaw-man",
      "barbie",
      "the-lion-king",
      "adventure-time",
      "the-office",
    ];

    for (const themeId of mediaThemes) {
      const theme = readThemeCategoryAndVariantCount(themeId);
      expect(["anime", "movies", "tv-shows"]).toContain(theme.category);
      expect(theme.variantCount).toBeGreaterThan(1);
    }
  });

  it("includes pivotal plot point variants for media themes", () => {
    expect(readThemeVariantIds("attack-on-titan")).toEqual(
      expect.arrayContaining(["fall-of-shiganshina", "basement-reveal", "the-rumbling"])
    );
    expect(readThemeVariantIds("star-wars")).toEqual(
      expect.arrayContaining(["binary-sunset", "death-star-trench-run", "order-66"])
    );
    expect(readThemeVariantIds("the-office")).toEqual(
      expect.arrayContaining(["dundies", "dinner-party", "goodbye-michael"])
    );
    expect(readThemeVariantIds("inception")).toEqual(
      expect.arrayContaining(["dream-heist", "hotel-kick", "spinning-top"])
    );
  });

  it("includes requested anime themes with show point and character variants", () => {
    const requestedAnimeThemes = [
      "baki",
      "berserk",
      "death-note",
      "hunter-x-hunter",
      "one-punch-man",
      "pantheon",
      "invincible",
      "seven-deadly-sins",
      "solo-leveling",
      "vinland-saga",
    ];

    for (const themeId of requestedAnimeThemes) {
      const theme = readThemeCategoryAndVariantCount(themeId);
      expect(theme.category).toBe("anime");
      expect(theme.variantCount).toBeGreaterThan(2);
    }

    expect(readThemeVariantIds("baki")).toEqual(
      expect.arrayContaining(["baki-hanma", "yujiro-hanma", "son-of-ogre"])
    );
    expect(readThemeVariantIds("pantheon")).toEqual(
      expect.arrayContaining(["maddie-kim", "caspian-keyes", "uploaded-intelligence"])
    );
    expect(readThemeVariantIds("invincible")).toEqual(
      expect.arrayContaining(["mark-grayson", "omni-man", "atom-eve"])
    );
    expect(readThemeVariantIds("seven-deadly-sins")).toEqual(
      expect.arrayContaining(["meliodas", "ban", "escanor"])
    );
  });

  it("includes requested characters as variants on their source anime themes", () => {
    expect(readThemeVariantIds("demon-slayer")).toEqual(
      expect.arrayContaining([
        "mitsuri-kanroji",
        "gyomei-himejima",
        "giyu-tomioka",
        "kyojuro-rengoku",
        "muichiro-tokito",
        "shinobu-kocho",
      ])
    );

    expect(readThemeVariantIds("jujutsu-kaisen")).toEqual(
      expect.arrayContaining([
        "satoru-gojo",
        "maki-zenin",
        "choso",
        "toge-inumaki",
        "kirara-hoshi",
        "kinji-hakari",
        "hiromi-higuruma",
      ])
    );

    expect(readThemeVariantIds("gachiakuta")).toEqual(
      expect.arrayContaining([
        "rudo-surebrec",
        "zanka-nijiku",
        "riyo-reaper",
        "jabber-wonger",
        "tamsy-caines",
        "fu-orostor",
        "amo",
      ])
    );

    expect(readThemeVariantIds("danganronpa")).toEqual(
      expect.arrayContaining([
        "celestia-ludenberg",
        "gundham-tanaka",
        "kokichi-oma",
        "kazuichi-soda",
      ])
    );

    expect(readThemeVariantIds("my-hero-academia")).toEqual(
      expect.arrayContaining(["tenya-iida"])
    );
  });

  it("includes the requested music release variants", () => {
    expect(readThemeVariantIds("my-chemical-romance")).toEqual(
      expect.arrayContaining([
        "i-brought-you-my-bullets",
        "three-cheers-for-sweet-revenge",
        "the-black-parade",
        "danger-days",
      ])
    );

    expect(readThemeVariantIds("fall-out-boy")).toEqual(
      expect.arrayContaining([
        "an-evening-out-with-your-girlfriend",
        "take-this-to-your-grave",
        "from-under-the-cork-tree",
        "infinity-on-high",
        "folie-a-deux",
        "american-beauty-american-psycho",
        "mania",
        "so-much-for-stardust",
      ])
    );

    expect(readThemeVariantIds("cobra-starship")).toEqual(
      expect.arrayContaining([
        "viva-la-cobra",
        "hot-mess",
        "night-shades",
        "while-the-city-sleeps",
      ])
    );

    expect(readThemeVariantIds("panic-at-the-disco")).toEqual(
      expect.arrayContaining([
        "a-fever",
        "pretty-odd",
      ])
    );
  });
});
