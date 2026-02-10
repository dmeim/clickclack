---
name: Typing Lessons Feature Implementation
overview: Implement a structured typing lesson system with progressive curriculum, star-based scoring, and user progress tracking, initially accessible via a hidden route.
todos:
  - id: create-types
    content: Create src/types/lesson.ts with Lesson, SubLesson, and Progress types
    status: pending
  - id: schema-update
    content: Update convex/schema.ts with lessonProgress table (with attempts tracking)
    status: pending
  - id: create-curriculum
    content: Create src/lib/lessons.ts with initial curriculum definitions (Lessons 1-5)
    status: pending
  - id: backend-api
    content: Create convex/lessons.ts with getProgress, saveProgress, and unlocking logic
    status: pending
  - id: create-star-rating
    content: Create src/components/lessons/StarRating.tsx component
    status: pending
  - id: create-lesson-card
    content: Create src/components/lessons/LessonCard.tsx component
    status: pending
  - id: create-result-modal
    content: Create src/components/lessons/LessonResultModal.tsx with star animation
    status: pending
  - id: create-dashboard
    content: Create src/pages/Lessons.tsx (Dashboard with curriculum map)
    status: pending
  - id: create-runner
    content: Create src/pages/LessonRunner.tsx wrapping TypingPractice
    status: pending
  - id: register-routes
    content: Register routes in src/App.tsx
    status: pending
  - id: add-tests
    content: Add basic tests for lesson utilities and scoring logic
    status: pending
---

# Typing Lessons Feature Plan

## 1. Architecture & Data Modeling

We will separate the **Static Curriculum Content** (defined in code) from the **User Progress** (stored in Convex DB).

### A. Type Definitions (`src/types/lesson.ts`)

Define strongly-typed interfaces for the lesson system:

```typescript
import type { SettingsState } from "@/lib/typing-constants";

// Scoring thresholds for star ratings (accuracy-based, like typing.com)
// WPM is tracked but does NOT affect stars for learning lessons
export type StarThresholds = {
  minAccuracyToPass: number;  // Minimum to complete (e.g., 70%)
  one: number;                // e.g., 70% - just passing
  two: number;                // e.g., 85%
  three: number;              // e.g., 92%
  four: number;               // e.g., 97%
  five: number;               // e.g., 100% (perfect)
};

export type SubLesson = {
  id: string;                    // e.g., "1-1-f-j-space"
  title: string;                 // e.g., "Learn F & J"
  description: string;           // e.g., "Practice the home row anchor keys"
  targetText: string;            // The exact text to type
  settings: Partial<SettingsState>; // Locked settings for this sub-lesson
  thresholds: StarThresholds;    // Scoring criteria
};

export type Lesson = {
  id: string;                    // e.g., "1-home-row"
  title: string;                 // e.g., "Home Row Anchors"
  description: string;           // e.g., "Master F, J, and Space"
  subLessons: SubLesson[];
  unlockRequirement?: {
    lessonId: string;            // Lesson that must be completed
    minStars: number;            // Minimum total stars required (e.g., at least 1 star per sub-lesson)
  };
};

export type Course = {
  id: string;
  title: string;
  lessons: Lesson[];
};

export type SubLessonProgress = {
  subLessonId: string;
  stars: number;                 // 0-5 (based on accuracy)
  bestAccuracy: number;          // Primary metric for stars
  bestWpm: number;               // Tracked for display, not scoring
  attempts: number;              // Track retry count
  completedAt: number;           // Timestamp
};

export type LessonProgress = {
  lessonId: string;
  subLessons: Record<string, SubLessonProgress>;
  isUnlocked: boolean;
};
```

### B. Static Curriculum (`src/lib/lessons.ts`)

Define the lesson structure as a strongly-typed constant.

- **Hierarchy**: `Course` -> `Lesson` -> `SubLesson`
- **Initial Content (Home Row Focus)**:
  - `Lesson 1`: F, J, Space (Home Row Anchors) - 5 sub-lessons
  - `Lesson 2`: D, K (Middle Fingers) - 5 sub-lessons
  - `Lesson 3`: S, L (Ring Fingers) - 5 sub-lessons
  - `Lesson 4`: A, ; (Pinky Fingers) - 5 sub-lessons
  - `Lesson 5`: G, H (Inner Index Reaches) - 5 sub-lessons
  - `Lesson 6`: Review (All Home Row) - 3 sub-lessons
- **Scoring Criteria** (accuracy-based, matching typing.com's approach):
  ```typescript
  const LEARNING_THRESHOLDS: StarThresholds = {
    minAccuracyToPass: 70,  // Must hit 70% to complete
    one: 70,                // 70-84% = 1 star
    two: 85,                // 85-91% = 2 stars  
    three: 92,              // 92-96% = 3 stars
    four: 97,               // 97-99% = 4 stars
    five: 100,              // 100% = 5 stars (perfect!)
  };
  ```


> **Design Note**: WPM is tracked and displayed but does NOT affect star ratings for learning lessons. This encourages accuracy over speed. Speed-focused lessons (drills) can be added later with different scoring.

### C. Database Schema (`convex/schema.ts`)

Add a new table `lessonProgress` to track user performance:

```typescript
lessonProgress: defineTable({
  userId: v.id("users"),
  lessonId: v.string(),       // e.g., "1-home-row"
  subLessonId: v.string(),    // e.g., "1-1-f-j-space"
  stars: v.number(),          // 0-5 (based on accuracy)
  bestAccuracy: v.number(),   // Primary metric - determines stars
  bestWpm: v.number(),        // Tracked for display only
  attempts: v.number(),       // Track retry count
  completedAt: v.number(),
})
  .index("by_user", ["userId"])                           // Load all progress for dashboard
  .index("by_user_lesson", ["userId", "lessonId"])        // Load specific lesson progress
  .index("by_user_sublesson", ["userId", "subLessonId"])  // Check/update specific sub-lesson
```

## 2. Frontend Implementation

### A. Routing (`src/App.tsx`)

Add two new routes (hidden from navigation menus initially):

```tsx
import Lessons from "./pages/Lessons";
import LessonRunner from "./pages/LessonRunner";

// Inside Routes:
<Route path="/lessons" element={<Lessons />} />
<Route path="/lessons/:lessonId/:subLessonId" element={<LessonRunner />} />
```

### B. Lesson Dashboard (`src/pages/Lessons.tsx`)

A scrollable map of all lessons with progress visualization.

**Features**:

- Main Lesson Cards showing title, description, and "Stars Earned / Total Stars"
- Expandable accordion to show Sub-lessons within each lesson
- Visual states: Locked (gray, padlock icon), Unlocked (normal), Completed (checkmark)
- Progress bar showing overall course completion
- Requires authentication - redirect to sign-in if not logged in

**Layout**:

```
┌─────────────────────────────────────────┐
│ Typing Lessons                    [10%] │  <- Course progress bar
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ 🔓 Lesson 1: Home Row Anchors      │ │
│ │    ★★★☆☆ 12/25 stars              │ │
│ │ ┌─────────────────────────────────┐ │ │
│ │ │ ✓ 1.1 Learn F & J    ★★★★★    │ │ │
│ │ │ ✓ 1.2 Practice F & J ★★★☆☆    │ │ │
│ │ │ → 1.3 Add Space      ☆☆☆☆☆    │ │ │  <- Current sub-lesson
│ │ │ 🔒 1.4 Speed Drill   ☆☆☆☆☆    │ │ │
│ │ └─────────────────────────────────┘ │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ 🔒 Lesson 2: Middle Fingers        │ │  <- Locked until Lesson 1 complete
│ │    Complete Lesson 1 to unlock     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### C. Lesson Runner (`src/pages/LessonRunner.tsx`)

A wrapper around the existing `TypingPractice` component with lesson-specific behavior.

**Integration with TypingPractice**:

```tsx
<TypingPractice
  // Use preset mode with the lesson's target text
  lockedSettings={{
    mode: "preset",
    presetText: currentSubLesson.targetText,
    presetModeType: "finish",
    // Lock other settings from the sub-lesson definition
    ...currentSubLesson.settings,
  }}
  // Capture completion stats
  onStatsUpdate={(stats, typedText, targetText) => {
    if (stats.isFinished) {
      handleLessonComplete(stats);
    }
  }}
  // Hide standard UI elements
  connectMode={false}
  // Pass theme through
  theme={theme}
  setTheme={setTheme}
  // etc.
/>
```

**Additional Functionality**:

- Custom result screen with `LessonResultModal` instead of default
- Calculate stars based on **accuracy only** vs. sub-lesson thresholds
- Display WPM for informational purposes (not part of scoring)
- Save progress to Convex (only if accuracy improved)
- If accuracy < minAccuracyToPass: show "Try Again" prompt (no stars earned)
- Navigation: "Retry", "Next Lesson" buttons
- Show lesson context (title, description) before starting

### D. Components (`src/components/lessons/`)

Create a new folder for lesson-specific components:

1. **`StarRating.tsx`**: Visual star display (0-5, supports half-stars)

   - Props: `rating: number`, `maxStars?: number`, `size?: "sm" | "md" | "lg"`, `animated?: boolean`
   - Use SVG stars with fill gradient for half-stars
   - Optional sparkle animation when earning new stars

2. **`LessonCard.tsx`**: Reusable card for dashboard

   - Props: `lesson: Lesson`, `progress: LessonProgress`, `isExpanded: boolean`, `onToggle: () => void`
   - Shows lesson info, star progress, locked/unlocked state
   - Expandable to show sub-lessons

3. **`LessonResultModal.tsx`**: Results screen after completing a sub-lesson

   - Props: `subLesson: SubLesson`, `result: { wpm, accuracy }`, `stars: number`, `previousBestAccuracy: number | null`, `onRetry: () => void`, `onNext: () => void`
   - Large star animation (similar to game completion screens)
   - **Primary display**: Accuracy percentage with star rating
   - **Secondary display**: WPM (informational, doesn't affect stars)
   - Show accuracy thresholds for next star level (e.g., "93% → need 97% for 4 stars")
   - "New Best!" indicator if accuracy improved
   - If below passing threshold: "Keep practicing!" message, no stars shown
   - Keyboard shortcuts: Enter for next, Tab for retry

## 3. Backend Logic (`convex/lessons.ts`)

### API Functions:

1. **`getProgress`** (Query): Fetch all lesson progress for current user
   ```typescript
   export const getProgress = query({
     args: { clerkId: v.string() },
     handler: async (ctx, { clerkId }) => {
       const user = await ctx.db
         .query("users")
         .withIndex("by_clerk_id", q => q.eq("clerkId", clerkId))
         .first();
       if (!user) return [];
       
       return ctx.db
         .query("lessonProgress")
         .withIndex("by_user", q => q.eq("userId", user._id))
         .collect();
     },
   });
   ```

2. **`saveProgress`** (Mutation): Update progress, only if accuracy improved
   ```typescript
   export const saveProgress = mutation({
     args: {
       clerkId: v.string(),
       lessonId: v.string(),
       subLessonId: v.string(),
       accuracy: v.number(),    // Primary metric
       wpm: v.number(),         // Tracked for display
     },
     handler: async (ctx, args) => {
       // 1. Get user
       // 2. Calculate stars from accuracy vs. thresholds
       // 3. Check existing progress
       // 4. Only update if accuracy is higher (which means same or more stars)
       // 5. Always increment attempts counter
       // 6. Update bestWpm only if this attempt's wpm is higher
     },
   });
   ```

3. **`isLessonUnlocked`** (Query): Check if a specific lesson is accessible
   ```typescript
   // Unlocking logic lives here - checks if prerequisite lesson has minimum stars
   ```


## 4. Utility Functions (`src/lib/lessons.ts`)

Include helper functions alongside curriculum:

```typescript
// Calculate stars from accuracy only (typing.com style)
export function calculateStars(
  accuracy: number, 
  thresholds: StarThresholds
): number;  // Returns 0 if below minAccuracyToPass, else 1-5 based on accuracy

// Check if lesson is unlocked based on progress
export function isLessonUnlocked(
  lesson: Lesson, 
  allProgress: LessonProgress[]
): boolean;

// Get next sub-lesson to practice
export function getNextSubLesson(
  course: Course, 
  progress: LessonProgress[]
): { lessonId: string; subLessonId: string } | null;

// Calculate overall course progress percentage
export function getCourseProgress(
  course: Course, 
  progress: LessonProgress[]
): number;
```

## 5. Development Steps (Refined)

### Phase 1: Foundation (can be parallelized)

1. **[create-types]** Create `src/types/lesson.ts` with all type definitions
2. **[schema-update]** Update `convex/schema.ts` and push changes
3. **[create-curriculum]** Create `src/lib/lessons.ts` with:

   - First 3 lessons (Home Row basics) for testing
   - Star calculation utility
   - Unlocking logic utility

### Phase 2: Backend

4. **[backend-api]** Implement `convex/lessons.ts`:

   - `getProgress` query
   - `saveProgress` mutation
   - Test with Convex dashboard

### Phase 3: Components (can be parallelized)

5. **[create-star-rating]** Build `StarRating.tsx`
6. **[create-lesson-card]** Build `LessonCard.tsx`
7. **[create-result-modal]** Build `LessonResultModal.tsx`

### Phase 4: Pages

8. **[create-dashboard]** Build `Lessons.tsx` dashboard page
9. **[create-runner]** Build `LessonRunner.tsx` with TypingPractice integration

### Phase 5: Integration

10. **[register-routes]** Connect routes in `App.tsx`
11. **[add-tests]** Add tests for:

    - Star calculation logic
    - Unlocking logic
    - Curriculum data validation

## 6. Authentication Flow

- **Dashboard (`/lessons`)**: Requires login. If not authenticated, show sign-in prompt.
- **Runner (`/lessons/:id/:subId`)**: Requires login. Redirect to `/lessons` if not authenticated.
- **Progress Saving**: Only saves for authenticated users (mirrors existing `testResults` pattern).

## 7. Future Enhancements (Out of Scope)

- Achievements tied to lessons (e.g., "Complete Home Row Course")
- Custom lesson creation
- Lesson sharing/multiplayer lessons
- Adaptive difficulty based on performance
- Top/Bottom row lessons
- Number row lessons
- Special character lessons