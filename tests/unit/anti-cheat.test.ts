import { describe, it, expect } from "vitest";
import { calculateWpm } from "../../convex/lib/computeStats";
import { MAX_CHARS_PER_SECOND, MAX_WPM } from "../../convex/lib/antiCheatConstants";
import { burstCharsPerSecond, isBurstOverCap } from "../../convex/lib/burst";
import {
  isLeaderboardEligible,
  validityForUnrankedSave,
} from "../../convex/lib/leaderboardEligibility";
import { validateTypingSession } from "../../convex/lib/validateSession";
import { nextRateLimitState, RESULT_WRITE_RATE_LIMIT } from "../../convex/lib/rateLimit";
import {
  FINALIZE_LENGTH_SLACK_FLOOR,
  isFinalizeLengthJumpInvalid,
} from "../../convex/lib/finalizeLength";
import { resolveSessionTargetText } from "../../convex/lib/soloPrompt";

function session(overrides: Partial<Parameters<typeof validateTypingSession>[0]> = {}) {
  return {
    mode: "time",
    duration: 30,
    targetText: "the quick brown fox",
    eventCount: 3,
    maxCharsPerSecond: 16,
    ...overrides,
  };
}

describe("calculateWpm (gross)", () => {
  it("uses typed length / 5 / minutes", () => {
    // 300 chars in 60s = 60 WPM
    expect(calculateWpm(300, 60_000)).toBe(60);
  });

  it("returns 0 for zero elapsed (not a 0.01 floor)", () => {
    expect(calculateWpm(500, 0)).toBe(0);
    expect(calculateWpm(500, -10)).toBe(0);
  });

  it("treats 200 WPM as a normal score", () => {
    // 200 WPM for 30s => 200 * 5 chars/min * 0.5 min = 500 chars
    expect(calculateWpm(500, 30_000)).toBe(200);
  });
});

describe("WPM cap persist-not-clamp", () => {
  it("200 WPM is valid", () => {
    expect(validityForUnrankedSave(200).isValid).toBe(true);
    expect(validityForUnrankedSave(200).invalidReason).toBeUndefined();
  });

  it("300 WPM is valid", () => {
    expect(validityForUnrankedSave(300).isValid).toBe(true);
  });

  it("301 WPM is invalid and keeps the real WPM (no clamp to 299)", () => {
    const result = validityForUnrankedSave(301);
    expect(result.isValid).toBe(false);
    expect(result.invalidReason).toContain("301");
    expect(result.invalidReason).not.toContain("299");
  });
});

describe("time-scaled burst (25 cps = 300 WPM)", () => {
  it("does not flag 200 WPM across a lagged 5s heartbeat", () => {
    // 200 WPM = 16.67 cps * 5s ≈ 83 chars
    const chars = (200 / 60) * 5 * 5;
    expect(isBurstOverCap(chars, 5000)).toBe(false);
    expect(burstCharsPerSecond(chars, 5000)).toBeLessThanOrEqual(MAX_CHARS_PER_SECOND);
  });

  it("allows 50 chars over 2s (25 cps = 300 WPM)", () => {
    expect(isBurstOverCap(50, 2000)).toBe(false);
  });

  it("flags a paste dump of 50 chars in 200ms", () => {
    expect(isBurstOverCap(50, 200)).toBe(true);
  });

  it("does not treat a single char in 0ms as infinite CPS", () => {
    expect(isBurstOverCap(1, 0)).toBe(false);
  });
});

describe("validateTypingSession", () => {
  it("accepts 200 WPM with 3+ events", () => {
    const result = validateTypingSession(session(), {
      serverElapsedMs: 30_000,
      computedWpm: 200,
      typedText: "the quick brown fox",
    });
    expect(result.isValid).toBe(true);
  });

  it("rejects rounded WPM of 301", () => {
    const result = validateTypingSession(session(), {
      serverElapsedMs: 30_000,
      computedWpm: 301,
      typedText: "the quick brown fox",
    });
    expect(result.isValid).toBe(false);
    expect(result.invalidReason).toContain(String(MAX_WPM));
  });

  it("requires at least 3 progress events in time mode", () => {
    const result = validateTypingSession(session({ eventCount: 2 }), {
      serverElapsedMs: 15_000,
      computedWpm: 120,
      typedText: "the quick brown fox",
    });
    expect(result.isValid).toBe(false);
    expect(result.invalidReason).toMatch(/progress events/i);
  });

  it("accepts time mode with exactly 3 events", () => {
    const result = validateTypingSession(session({ duration: 15, eventCount: 3 }), {
      serverElapsedMs: 15_000,
      computedWpm: 120,
      typedText: "the quick brown fox",
    });
    expect(result.isValid).toBe(true);
  });

  it("zen skips duration and word-target fails", () => {
    const result = validateTypingSession(
      session({
        mode: "zen",
        duration: 5,
        wordTarget: 200,
        eventCount: 3,
        maxCharsPerSecond: 10,
      }),
      {
        serverElapsedMs: 1000,
        computedWpm: 80,
        typedText: "hi",
      }
    );
    expect(result.isValid).toBe(true);
  });

  it("zen still applies the WPM cap", () => {
    const result = validateTypingSession(
      session({ mode: "zen", eventCount: 3 }),
      {
        serverElapsedMs: 5000,
        computedWpm: 301,
        typedText: "hi",
      }
    );
    expect(result.isValid).toBe(false);
  });
});

describe("isLeaderboardEligible", () => {
  it("ranks a 30s 90% 180 WPM test", () => {
    expect(
      isLeaderboardEligible({
        isValid: true,
        accuracy: 90,
        wpm: 180,
        duration: 30_000,
        wordsCorrect: 10,
      })
    ).toBe(true);
  });

  it("does not rank a valid 15s test under 50 wordsCorrect", () => {
    expect(
      isLeaderboardEligible({
        isValid: true,
        accuracy: 95,
        wpm: 180,
        duration: 15_000,
        wordsCorrect: 20,
      })
    ).toBe(false);
  });

  it("ranks a short-duration test with 50 wordsCorrect", () => {
    expect(
      isLeaderboardEligible({
        isValid: true,
        accuracy: 90,
        wpm: 140,
        duration: 10_000,
        wordsCorrect: 50,
      })
    ).toBe(true);
  });

  it("does not use wordCount and treats missing wordsCorrect as 0", () => {
    expect(
      isLeaderboardEligible({
        isValid: true,
        accuracy: 99,
        wpm: 200,
        duration: 15_000,
      })
    ).toBe(false);
  });

  it("treats legacy isValid undefined as eligible when other gates pass", () => {
    expect(
      isLeaderboardEligible({
        accuracy: 92,
        wpm: 110,
        duration: 60_000,
        wordsCorrect: 40,
      })
    ).toBe(true);
  });

  it("rejects isValid false, accuracy under 90, and WPM over 300", () => {
    expect(
      isLeaderboardEligible({
        isValid: false,
        accuracy: 99,
        wpm: 120,
        duration: 60_000,
        wordsCorrect: 80,
      })
    ).toBe(false);
    expect(
      isLeaderboardEligible({
        isValid: true,
        accuracy: 89.9,
        wpm: 120,
        duration: 60_000,
        wordsCorrect: 80,
      })
    ).toBe(false);
    expect(
      isLeaderboardEligible({
        isValid: true,
        accuracy: 99,
        wpm: 301,
        duration: 60_000,
        wordsCorrect: 80,
      })
    ).toBe(false);
  });

  it("does not rank a saveResult-shaped row (rankedEligible false)", () => {
    expect(
      isLeaderboardEligible({
        isValid: true,
        rankedEligible: false,
        accuracy: 95,
        wpm: 180,
        duration: 30_000,
        wordsCorrect: 80,
      })
    ).toBe(false);
  });

  it("treats omitted rankedEligible as legacy-eligible", () => {
    expect(
      isLeaderboardEligible({
        isValid: true,
        accuracy: 95,
        wpm: 180,
        duration: 30_000,
        wordsCorrect: 80,
      })
    ).toBe(true);
  });

  it("ranks a finalizeSession-shaped row (rankedEligible true)", () => {
    expect(
      isLeaderboardEligible({
        isValid: true,
        rankedEligible: true,
        accuracy: 90,
        wpm: 180,
        duration: 30_000,
        wordsCorrect: 10,
      })
    ).toBe(true);
  });
});

describe("result write rate limit", () => {
  it("allows 15s grinding and blocks 10Hz dumps", () => {
    const state = nextRateLimitState(null, 0, RESULT_WRITE_RATE_LIMIT);
    expect(state.allowed).toBe(true);

    const tooSoon = nextRateLimitState(state.state, 100, RESULT_WRITE_RATE_LIMIT);
    expect(tooSoon.allowed).toBe(false);

    const nextTest = nextRateLimitState(state.state, 15_000, RESULT_WRITE_RATE_LIMIT);
    expect(nextTest.allowed).toBe(true);
  });
});

describe("finalize length jump", () => {
  it("invalidates a paste dump vs last heartbeat", () => {
    expect(isFinalizeLengthJumpInvalid(400, 0, 100)).toBe(true);
    expect(isFinalizeLengthJumpInvalid(50, 0, 200)).toBe(true);
  });

  it("allows 200 WPM over a lagged 5s last interval", () => {
    const chars = Math.ceil((200 / 60) * 5 * 5);
    expect(isFinalizeLengthJumpInvalid(100 + chars, 100, 5000)).toBe(false);
  });

  it("allows the last few chars within the slack floor", () => {
    expect(FINALIZE_LENGTH_SLACK_FLOOR).toBeGreaterThanOrEqual(8);
    expect(FINALIZE_LENGTH_SLACK_FLOOR).toBeLessThanOrEqual(15);
    expect(isFinalizeLengthJumpInvalid(210, 200, 0)).toBe(false);
  });
});

describe("resolveSessionTargetText", () => {
  const generate = () => "server-owned-prompt";

  it("ignores client targetText for time mode", () => {
    const client = "cheat by sending my own prompt ".repeat(8);
    const resolved = resolveSessionTargetText(
      {
        mode: "time",
        clientTargetText: client,
        duration: 30,
        difficulty: "medium",
        punctuation: false,
        numbers: false,
        capitalization: false,
      },
      generate
    );
    expect(resolved).toBe("server-owned-prompt");
    expect(resolved).not.toBe(client.trim());
  });

  it("uses client targetText for quote mode", () => {
    expect(
      resolveSessionTargetText(
        {
          mode: "quote",
          clientTargetText: "To be or not to be",
          difficulty: "medium",
          punctuation: false,
          numbers: false,
          capitalization: false,
        },
        generate
      )
    ).toBe("To be or not to be");
  });
});
