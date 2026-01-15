import { describe, it, expect } from "vitest";
import { hexToHsv, hsvToHex, isValidHex } from "@/lib/color-utils";
import { getRandomSoundUrl, SOUND_MANIFEST } from "@/lib/sounds";

describe("color-utils", () => {
  describe("hexToHsv", () => {
    it("converts black correctly", () => {
      const result = hexToHsv("#000000");
      expect(result.h).toBe(0);
      expect(result.s).toBe(0);
      expect(result.v).toBe(0);
    });

    it("converts white correctly", () => {
      const result = hexToHsv("#ffffff");
      expect(result.h).toBe(0);
      expect(result.s).toBe(0);
      expect(result.v).toBe(1);
    });

    it("converts red correctly", () => {
      const result = hexToHsv("#ff0000");
      expect(result.h).toBe(0);
      expect(result.s).toBe(1);
      expect(result.v).toBe(1);
    });
  });

  describe("hsvToHex", () => {
    it("converts black correctly", () => {
      expect(hsvToHex(0, 0, 0)).toBe("#000000");
    });

    it("converts white correctly", () => {
      expect(hsvToHex(0, 0, 1)).toBe("#ffffff");
    });
  });

  describe("isValidHex", () => {
    it("validates 6-char hex", () => {
      expect(isValidHex("#ff0000")).toBe(true);
      expect(isValidHex("ff0000")).toBe(true);
    });

    it("validates 3-char hex", () => {
      expect(isValidHex("#f00")).toBe(true);
      expect(isValidHex("f00")).toBe(true);
    });

    it("rejects invalid hex", () => {
      expect(isValidHex("gggggg")).toBe(false);
      expect(isValidHex("#ff")).toBe(false);
    });
  });
});

describe("sounds", () => {
  describe("getRandomSoundUrl", () => {
    it("returns a valid URL for existing sound pack", () => {
      const url = getRandomSoundUrl(SOUND_MANIFEST, "typing", "creamy");
      expect(url).toMatch(/^\/sounds\/typing\/creamy\/creamy_\d+\.wav$/);
    });

    it("returns null for non-existent category", () => {
      const url = getRandomSoundUrl(SOUND_MANIFEST, "nonexistent", "creamy");
      expect(url).toBeNull();
    });

    it("returns null for non-existent pack", () => {
      const url = getRandomSoundUrl(SOUND_MANIFEST, "typing", "nonexistent");
      expect(url).toBeNull();
    });

    it("returns null when manifest is null", () => {
      const url = getRandomSoundUrl(null, "typing", "creamy");
      expect(url).toBeNull();
    });
  });
});
