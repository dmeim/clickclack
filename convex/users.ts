import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

// Get or create a user when they sign in with Clerk
export const getOrCreateUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    username: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      const usernameChanged = existingUser.username !== args.username;
      const avatarChanged = existingUser.avatarUrl !== args.avatarUrl;

      if (
        existingUser.email !== args.email ||
        usernameChanged ||
        avatarChanged
      ) {
        await ctx.db.patch(existingUser._id, {
          email: args.email,
          username: args.username,
          avatarUrl: args.avatarUrl,
          updatedAt: Date.now(),
        });
      }

      if (usernameChanged || avatarChanged) {
        await ctx.runMutation(internal.statsCache.syncLeaderboardIdentity, {
          userId: existingUser._id,
          username: args.username,
          avatarUrl: args.avatarUrl,
        });
      }

      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      username: args.username,
      avatarUrl: args.avatarUrl,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return userId;
  },
});

// Get user by Clerk ID
export const getUser = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    return user;
  },
});

// Get user by Convex user ID (for public profile pages)
export const getUserById = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Update user profile (username and/or avatar)
export const updateProfile = mutation({
  args: {
    clerkId: v.string(),
    username: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const updates: { username?: string; avatarUrl?: string; updatedAt: number } = {
      updatedAt: Date.now(),
    };

    const nextUsername = args.username ?? user.username;
    const nextAvatarUrl = args.avatarUrl ?? user.avatarUrl;
    const usernameChanged = nextUsername !== user.username;
    const avatarChanged = nextAvatarUrl !== user.avatarUrl;

    if (args.username !== undefined) {
      updates.username = args.username;
    }

    if (args.avatarUrl !== undefined) {
      updates.avatarUrl = args.avatarUrl;
    }

    await ctx.db.patch(user._id, updates);

    if (usernameChanged || avatarChanged) {
      await ctx.runMutation(internal.statsCache.syncLeaderboardIdentity, {
        userId: user._id,
        username: nextUsername,
        avatarUrl: nextAvatarUrl,
      });
    }

    return user._id;
  },
});
