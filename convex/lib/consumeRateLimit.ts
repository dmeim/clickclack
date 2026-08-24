import type { MutationCtx } from "../_generated/server";
import {
  nextRateLimitState,
  type RateLimitConfig,
} from "./rateLimit";

export async function consumeRateLimit(
  ctx: MutationCtx,
  key: string,
  config: RateLimitConfig
): Promise<void> {
  const now = Date.now();
  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_key", (q) => q.eq("key", key))
    .first();

  const result = nextRateLimitState(
    existing
      ? {
          windowStart: existing.windowStart,
          count: existing.count,
          lastAt: existing.lastAt,
        }
      : null,
    now,
    config
  );

  if (!result.allowed) {
    throw new Error("Rate limit exceeded. Please wait before retrying.");
  }

  if (existing) {
    await ctx.db.patch(existing._id, result.state);
  } else {
    await ctx.db.insert("rateLimits", {
      key,
      ...result.state,
    });
  }
}
