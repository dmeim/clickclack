import { v } from "convex/values";
import { internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

/**
 * Migration to backfill userStatsCache and leaderboardCache tables.
 * 
 * Run this once after deploying the schema changes to populate the cache
 * from existing test results.
 * 
 * Usage from Convex dashboard:
 *   1. Go to Functions > migrations > backfillAllCaches
 *   2. Click "Run" with no arguments
 *   3. Monitor progress in the logs
 * 
 * Each user is processed in its own transaction to avoid hitting
 * Convex read/write limits when users have many test results.
 */

interface UserIdsBatch {
  userIds: Id<"users">[];
  nextCursor: string | null;
}

/**
 * Get a batch of user IDs for pagination.
 * Returns user IDs and a cursor for the next batch.
 */
export const getUserIdsBatch = internalQuery({
  args: {
    cursor: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 50;

    const users = args.cursor
      ? await ctx.db
          .query("users")
          .filter((q) => q.gt(q.field("_id"), args.cursor as string))
          .take(batchSize)
      : await ctx.db.query("users").take(batchSize);

    if (users.length === 0) {
      return { userIds: [] as Id<"users">[], nextCursor: null as string | null };
    }

    const lastUser = users[users.length - 1];
    const nextCursor = users.length === batchSize ? (lastUser._id as string) : null;

    return {
      userIds: users.map((u) => u._id),
      nextCursor,
    };
  },
});

/**
 * Action to run the full backfill process.
 * Each user is processed in its own mutation call (own transaction),
 * so users with many test results won't cause transaction limit errors.
 * 
 * Run this from the Convex dashboard to populate the cache tables.
 */
export const backfillAllCaches = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("Starting cache backfill migration...");

    // Phase 1: Backfill user stats cache
    console.log("Phase 1: Backfilling user stats cache...");
    let cursor: string | null = null;
    let totalUserStats = 0;
    let failures = 0;

    while (true) {
      const batch: UserIdsBatch = await ctx.runQuery(internal.migrations.getUserIdsBatch, {
        cursor: cursor ?? undefined,
        batchSize: 50,
      });

      if (batch.userIds.length === 0) break;

      for (const userId of batch.userIds) {
        try {
          await ctx.runMutation(internal.statsCache.rebuildUserStatsCacheForUser, {
            userId,
          });
          totalUserStats++;
        } catch (e) {
          failures++;
          console.error(`  Failed to rebuild stats cache for user ${userId}:`, e);
        }
      }

      console.log(`  Processed ${batch.userIds.length} users (total: ${totalUserStats}, failures: ${failures})`);

      if (!batch.nextCursor) break;
      cursor = batch.nextCursor;
    }

    console.log(`Phase 1 complete: ${totalUserStats} user stats cached (${failures} failures)`);

    // Phase 2: Backfill leaderboard cache
    console.log("Phase 2: Backfilling leaderboard cache...");
    cursor = null;
    let totalLeaderboard = 0;
    failures = 0;

    while (true) {
      const batch: UserIdsBatch = await ctx.runQuery(internal.migrations.getUserIdsBatch, {
        cursor: cursor ?? undefined,
        batchSize: 50,
      });

      if (batch.userIds.length === 0) break;

      for (const userId of batch.userIds) {
        try {
          await ctx.runMutation(internal.statsCache.rebuildLeaderboardCacheForUser, {
            userId,
          });
          totalLeaderboard++;
        } catch (e) {
          failures++;
          console.error(`  Failed to rebuild leaderboard cache for user ${userId}:`, e);
        }
      }

      console.log(`  Processed ${batch.userIds.length} users (total: ${totalLeaderboard}, failures: ${failures})`);

      if (!batch.nextCursor) break;
      cursor = batch.nextCursor;
    }

    console.log(`Phase 2 complete: ${totalLeaderboard} users processed for leaderboard (${failures} failures)`);
    console.log("Migration complete!");

    return {
      userStatsProcessed: totalUserStats,
      leaderboardProcessed: totalLeaderboard,
    };
  },
});

/**
 * Audit and optionally repair leaderboard username/avatar cache entries
 * for all users.
 *
 * Usage from Convex dashboard:
 *   - Check only: dryRun = true
 *   - Check + fix: dryRun = false (default)
 */
export const checkAndFixLeaderboardIdentity = internalAction({
  args: {
    dryRun: v.optional(v.boolean()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? false;
    const batchSize = Math.max(1, Math.min(args.batchSize ?? 50, 200));

    console.log(
      `Starting leaderboard identity ${dryRun ? "audit" : "audit + repair"}...`
    );

    let cursor: string | null = null;
    let usersProcessed = 0;
    let usersWithMismatches = 0;
    let cacheEntriesChecked = 0;
    let cacheEntriesMismatched = 0;
    let cacheEntriesUpdated = 0;
    let failures = 0;

    while (true) {
      const batch: UserIdsBatch = await ctx.runQuery(internal.migrations.getUserIdsBatch, {
        cursor: cursor ?? undefined,
        batchSize,
      });

      if (batch.userIds.length === 0) {
        break;
      }

      for (const userId of batch.userIds) {
        try {
          const result: {
            checked: number;
            mismatched: number;
            updated: number;
            dryRun: boolean;
            skipped: boolean;
          } = await ctx.runMutation(internal.statsCache.syncLeaderboardIdentityFromUser, {
            userId,
            dryRun,
          });

          usersProcessed++;
          cacheEntriesChecked += result.checked;
          cacheEntriesMismatched += result.mismatched;
          cacheEntriesUpdated += result.updated;
          if (result.mismatched > 0) {
            usersWithMismatches++;
          }
        } catch (e) {
          failures++;
          console.error(
            `  Failed leaderboard identity sync for user ${userId}:`,
            e
          );
        }
      }

      console.log(
        `  Processed ${batch.userIds.length} users (total: ${usersProcessed}, mismatched entries: ${cacheEntriesMismatched}, updated entries: ${cacheEntriesUpdated}, failures: ${failures})`
      );

      if (!batch.nextCursor) {
        break;
      }
      cursor = batch.nextCursor;
    }

    const summary = {
      mode: dryRun ? "check-only" : "check-and-fix",
      usersProcessed,
      usersWithMismatches,
      cacheEntriesChecked,
      cacheEntriesMismatched,
      cacheEntriesUpdated,
      failures,
    };

    console.log("Leaderboard identity audit complete:", summary);

    return summary;
  },
});
