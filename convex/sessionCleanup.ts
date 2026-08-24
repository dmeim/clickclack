import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { SESSION_TTL_MS } from "./lib/antiCheatConstants";
import { consumeRateLimit } from "./lib/consumeRateLimit";
import { ADMIN_LOGIN_RATE_LIMIT } from "./lib/rateLimit";

/**
 * Clean up expired typing sessions
 * Runs every 5 minutes via cron job
 */
export const cleanupExpiredSessions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const cutoff = now - SESSION_TTL_MS;

    // Query sessions older than TTL
    const expiredSessions = await ctx.db
      .query("typingSessions")
      .withIndex("by_created_at")
      .filter((q) => q.lt(q.field("createdAt"), cutoff))
      .collect();

    // Delete expired sessions in batches
    let deleted = 0;
    for (const session of expiredSessions) {
      await ctx.db.delete(session._id);
      deleted++;
    }

    // Log cleanup stats (visible in Convex dashboard)
    if (deleted > 0) {
      console.log(`Session cleanup: deleted ${deleted} expired sessions`);
    }

    return { deleted };
  },
});

/**
 * Clean up expired admin review sessions
 */
export const cleanupExpiredAdminSessions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const sessions = await ctx.db.query("adminSessions").collect();
    let deleted = 0;
    for (const session of sessions) {
      if (session.expiresAt < now) {
        await ctx.db.delete(session._id);
        deleted++;
      }
    }
    return { deleted };
  },
});

export const consumeAdminLoginRateLimit = internalMutation({
  args: {},
  handler: async (ctx) => {
    await consumeRateLimit(ctx, "admin_login", ADMIN_LOGIN_RATE_LIMIT);
  },
});

export const createAdminSession = internalMutation({
  args: {
    tokenHash: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("adminSessions", {
      tokenHash: args.tokenHash,
      createdAt: args.createdAt,
      expiresAt: args.expiresAt,
    });
  },
});
