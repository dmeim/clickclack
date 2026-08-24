export interface RateLimitState {
  windowStart: number;
  count: number;
  lastAt: number;
}

export interface RateLimitConfig {
  minIntervalMs: number;
  windowMs: number;
  maxPerWindow: number;
}

/** Solo result writes: allow 15s grinding, stop 10Hz dumps. */
export const RESULT_WRITE_RATE_LIMIT: RateLimitConfig = {
  minIntervalMs: 2000,
  windowMs: 60_000,
  maxPerWindow: 20,
};

/** Admin login: slow brute force without locking out a single typo burst. */
export const ADMIN_LOGIN_RATE_LIMIT: RateLimitConfig = {
  minIntervalMs: 1000,
  windowMs: 15 * 60_000,
  maxPerWindow: 8,
};

export function nextRateLimitState(
  existing: RateLimitState | null,
  now: number,
  config: RateLimitConfig
): { allowed: boolean; state: RateLimitState } {
  if (!existing) {
    return {
      allowed: true,
      state: { windowStart: now, count: 1, lastAt: now },
    };
  }

  if (now - existing.lastAt < config.minIntervalMs) {
    return { allowed: false, state: existing };
  }

  let windowStart = existing.windowStart;
  let count = existing.count;
  if (now - windowStart >= config.windowMs) {
    windowStart = now;
    count = 0;
  }

  if (count >= config.maxPerWindow) {
    return { allowed: false, state: existing };
  }

  return {
    allowed: true,
    state: { windowStart, count: count + 1, lastAt: now },
  };
}
