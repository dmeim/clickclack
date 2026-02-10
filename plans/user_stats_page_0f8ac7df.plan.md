---
name: User Stats Page
overview: Convert the StatsModal to a routable page at `/user/:userId` that allows viewing and sharing user stats, with proper ownership checks for test deletion.
todos:
  - id: convex-apis
    content: Add getUserById, getUserStatsByUserId, and getUserAchievementsByUserId queries to Convex backend
    status: completed
  - id: user-stats-page
    content: Create src/pages/UserStats.tsx with the new layout (6 stat cards, two columns for achievements and test history)
    status: completed
  - id: route-registration
    content: Add /user/:userId route to App.tsx
    status: completed
  - id: header-update
    content: Update Header.tsx to navigate to /user/:userId instead of opening modal
    status: completed
  - id: home-cleanup
    content: Remove StatsModal state and import from Home.tsx
    status: completed
  - id: delete-visibility
    content: Implement ownership check to conditionally show/hide delete button
    status: completed
---

# User Stats Route Implementation

## Overview

Convert the existing `StatsModal` component to a full-page route at `/user/:userId`, enabling users to share their stats and view other users' profiles. The page will adapt to screen size without page-level scrolling.

## New Convex Backend APIs

Create new queries in [convex/users.ts](convex/users.ts) and [convex/testResults.ts](convex/testResults.ts) that accept Convex user IDs instead of Clerk IDs:

```typescript
// convex/users.ts - Add:
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// convex/testResults.ts - Add:
export const getUserStatsByUserId = query({
  args: { userId: v.id("users") },
  // Same logic as getUserStats but accepts userId directly
});

// convex/achievements.ts - Add:
export const getUserAchievementsByUserId = query({
  args: { userId: v.id("users") },
  // Same logic as getUserAchievements but accepts userId directly
});
```

## New Page Component

Create [src/pages/UserStats.tsx](src/pages/UserStats.tsx) with this layout:

```
+--------------------------------------------------------+
| <- Back to Homepage       [Avatar] Username            |
+--------------------------------------------------------+
| [Typing Time] [Best WPM] [Avg WPM] [Avg Acc] [Words] [Chars] |  <- 6 cards in a row
+--------------------------------------------------------+
|  Achievements (scrollable)  |  Test History (scrollable) |
|  - Refresh button           |  - Sortable table          |
|  - X/Total link to modal    |  - Click for detail modal  |
|                             |  - Delete only if owner    |
+--------------------------------------------------------+
```

Key behaviors:

- Use `useParams()` to get the `:userId` from the route
- Use `useUser()` from Clerk to get current signed-in user
- Compare current user's Convex ID with the profile's userId to determine ownership
- The page uses `h-[100dvh] `with `overflow-hidden` - only achievements and table areas scroll
- Responsive: on mobile, stack the two columns vertically

## Delete Button Visibility Logic

The delete button in `TestDetailModal` should only show when the viewer owns the test:

```typescript
// In UserStats.tsx
const { user: clerkUser } = useUser();
const currentConvexUser = useQuery(api.users.getUser, 
  clerkUser ? { clerkId: clerkUser.id } : "skip"
);

const isOwner = currentConvexUser?._id === userId;

// Pass isOwner to TestDetailModal
// Only render delete button if isOwner is true
```

The backend already validates ownership at [convex/testResults.ts:132](convex/testResults.ts):

```134:135:convex/testResults.ts
    if (result.userId !== user._id) {
      throw new Error("You can only delete your own test results.");
```

## Route Registration

Update [src/App.tsx](src/App.tsx):

```typescript
import UserStats from "./pages/UserStats";
// ...
<Route path="/user/:userId" element={<UserStats />} />
```

## Header Update

Update [src/components/layout/Header.tsx](src/components/layout/Header.tsx):

- Remove `onShowStats` prop
- Add navigation to `/user/{currentUserId}` using `useNavigate()`
- Requires fetching the current user's Convex ID to construct the URL
- If not signed in, the stats button could either be hidden or show a sign-in prompt

## Files to Modify

- [convex/users.ts](convex/users.ts) - Add `getUserById` query
- [convex/testResults.ts](convex/testResults.ts) - Add `getUserStatsByUserId` query  
- [convex/achievements.ts](convex/achievements.ts) - Add `getUserAchievementsByUserId` query
- [src/App.tsx](src/App.tsx) - Add new route
- [src/components/layout/Header.tsx](src/components/layout/Header.tsx) - Change stats button to navigation
- [src/pages/Home.tsx](src/pages/Home.tsx) - Remove StatsModal state and import

## Files to Create

- [src/pages/UserStats.tsx](src/pages/UserStats.tsx) - New page component (extract and adapt from StatsModal)

## Files to Keep (referenced but not deleted)

- [src/components/auth/StatsModal.tsx](src/components/auth/StatsModal.tsx) - Keep for reference, can be deleted later or kept as a modal option
- [src/components/auth/AchievementsGrid.tsx](src/components/auth/AchievementsGrid.tsx) - Reuse as-is

## Layout Details

**Top Stats Row (6 cards):**

1. Typing Time - `formatDuration(stats.totalTimeTyped)`
2. Best WPM - `stats.bestWpm`
3. Avg WPM - `stats.averageWpm`
4. Avg Accuracy - `stats.averageAccuracy`%
5. Words Typed - `stats.totalWordsTyped.toLocaleString()`
6. Characters Typed - `stats.totalCharactersTyped.toLocaleString()`

**Removed cards:** Day Streak, Saved Tests

**Two Column Layout:**

- Left column: `AchievementsGrid` component with scrollable area
- Right column: Test results table (same as current implementation)
- Both columns use `overflow-y-auto` for their scrollable content areas