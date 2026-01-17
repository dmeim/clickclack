import { internalMutation } from "./_generated/server";
import { SESSION_TTL_MS } from "./lib/antiCheatConstants";

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
