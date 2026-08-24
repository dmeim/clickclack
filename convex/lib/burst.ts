import {
  MAX_CHARS_PER_SECOND,
  MIN_BURST_WINDOW_MS,
} from "./antiCheatConstants";

/**
 * Time-scaled burst CPS. Uses a small floor so a 1-char event in the same
 * millisecond is not treated as infinite CPS, while a paste dump still flags.
 *
 * 25 cps = 300 WPM. Lagged heartbeats at 200 WPM stay under the cap
 * (e.g. ~83 chars over 5s ≈ 16.7 cps). A flat 50-char cap would false-flag that.
 */
export function burstCharsPerSecond(
  charsDelta: number,
  timeDeltaMs: number
): number {
  if (charsDelta <= 0) return 0;
  const effectiveMs = Math.max(timeDeltaMs, MIN_BURST_WINDOW_MS);
  return charsDelta / (effectiveMs / 1000);
}

export function isBurstOverCap(charsDelta: number, timeDeltaMs: number): boolean {
  return burstCharsPerSecond(charsDelta, timeDeltaMs) > MAX_CHARS_PER_SECOND;
}
