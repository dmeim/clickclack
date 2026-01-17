/**
 * Anti-cheat threshold constants for session validation
 *
 * These values are tuned to:
 * - Allow legitimate fast typists (world record ~216 WPM sustained)
 * - Detect obvious cheating (paste, automated input)
 * - Minimize false positives for real users
 */

// Maximum WPM allowed (world record is ~216 WPM sustained; 300 allows headroom)
export const MAX_WPM = 300;

// Maximum characters per second (300 WPM ÷ 5 chars/word = 60 words/min × 5 = 25 chars/sec)
export const MAX_CHARS_PER_SECOND = 25;

// Minimum heartbeats to prove real-time typing
export const MIN_PROGRESS_EVENTS = 3;

// For time mode, scale with test length (events per 10 seconds)
export const MIN_EVENTS_PER_DURATION = (duration: number) =>
  Math.max(MIN_PROGRESS_EVENTS, Math.floor(duration / 10));

// Allow 2s network latency tolerance for time mode
export const TIME_MODE_TOLERANCE_SEC = 2;

// Max chars between progress events (detects paste)
export const MAX_BURST_CHARS = 50;

// Session TTL - 10 minutes, sessions older than this are expired
export const SESSION_TTL_MS = 600000;

// Progress reporting interval for frontend
export const PROGRESS_INTERVAL_MS = 2000;
export const PROGRESS_CHAR_THRESHOLD = 50;

// Session grace period for page refresh handling (30 seconds)
export const SESSION_RESUME_GRACE_MS = 30000;
