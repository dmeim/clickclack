import {
  MAX_CHARS_PER_SECOND,
} from "./antiCheatConstants";
import { burstCharsPerSecond } from "./burst";

/**
 * Extra chars allowed at finalize beyond time-scaled 25 cps.
 * Covers the last few keystrokes after the last heartbeat, not a paste dump.
 */
export const FINALIZE_LENGTH_SLACK_FLOOR = 12;

export function allowedFinalizeLengthJump(
  timeSinceLastProgressMs: number
): number {
  const elapsedMs = Math.max(0, timeSinceLastProgressMs);
  const timeScaled = MAX_CHARS_PER_SECOND * (elapsedMs / 1000);
  return Math.ceil(timeScaled) + FINALIZE_LENGTH_SLACK_FLOOR;
}

export function isFinalizeLengthJumpInvalid(
  typedLength: number,
  lastTypedLength: number,
  timeSinceLastProgressMs: number
): boolean {
  const jump = typedLength - lastTypedLength;
  if (jump <= 0) return false;
  return jump > allowedFinalizeLengthJump(timeSinceLastProgressMs);
}

/**
 * Burst CPS for the last-heartbeat → finalize interval.
 * Subtracts the slack floor so finishing the last few chars does not
 * spike CPS through the 100ms burst window.
 */
export function finalizeIntervalBurstCps(
  typedLength: number,
  lastTypedLength: number,
  timeSinceLastProgressMs: number
): number {
  const jump = typedLength - lastTypedLength;
  const countable = jump - FINALIZE_LENGTH_SLACK_FLOOR;
  if (countable <= 0) return 0;
  return burstCharsPerSecond(countable, timeSinceLastProgressMs);
}
