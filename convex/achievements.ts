import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";

// Achievement checking logic
// Note: Achievement definitions are in src/lib/achievement-definitions.ts
// This file handles the backend checking and awarding

interface TestResultData {
  wpm: number;
  accuracy: number;
  mode: string;
  duration: number;
  wordCount: number;
  difficulty: string;
  punctuation: boolean;
  numbers: boolean;
  wordsCorrect: number;
  wordsIncorrect: number;
  createdAt: number;
}

interface AchievementCheckContext {
  testResult: TestResultData;
  localHour: number;
  isWeekend: boolean;
  // Aggregate stats
  totalTests: number;
  totalWordsCorrect: number;
  totalTimeTyped: number;
  testsWithHighAccuracy: number; // 95%+
  perfectAccuracyStreak: number;
  weekendTestCount: number;
  // Mode tracking
  modesCovered: Set<string>;
  difficultiesCovered: Set<string>;
  // Current streak
  currentStreak: number;
  
  // === NEW FIELDS FOR NEW ACHIEVEMENT CATEGORIES ===
  
  // Time-based
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  monthDay: { month: number; day: number }; // 0-11 for month, 1-31 for day
  
  // Consistency
  consecutiveHighAccuracyStreak: number; // 90%+ accuracy consecutive
  recentWpmVariance: number; // variance in WPM across last N tests
  lowVarianceTestCount: number; // count of tests with low variance
  sameWpmCount: number; // count of tests with exact same WPM
  
  // Improvement
  personalBestWpm: number;
  previousPersonalBest: number; // PB before this test
  firstTestWpm: number;
  pbImprovementCount: number; // how many times user has set a new PB
  averageWpm: number;
  firstFiveAvgWpm: number; // average of first 5 tests
  isNewPersonalBest: boolean;
  pbImprovement: number; // how much the PB improved by (0 if not a PB)
  
  // Endurance
  testsToday: number;
  
  // Milestone
  wpmByMode: Map<string, number>; // best WPM per mode
  averageAccuracy: number;
  has100WpmAllDaysInStreak: boolean; // for week streak with 100+ WPM
  
  // Weekday tracking
  weekdaysCovered: Set<number>; // 1-5 (Mon-Fri)
  weekendDaysCovered: Set<number>; // 0, 6 (Sun, Sat)
  
  // Collection
  totalAchievementsCount: number;
}

/**
 * Check which achievements should be awarded based on test result and aggregate stats
 */
function checkAchievements(ctx: AchievementCheckContext): string[] {
  const newAchievements: string[] = [];
  const { testResult } = ctx;

  // === SPEED ACHIEVEMENTS (WPM milestones) ===
  const wpmMilestones = [
    10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170,
    180, 190, 200,
  ];
  for (const wpm of wpmMilestones) {
    if (testResult.wpm >= wpm) {
      newAchievements.push(`wpm-${wpm}`);
    }
  }

  // === WORD ACHIEVEMENTS (cumulative words) ===
  const wordMilestones = [
    100, 200, 300, 400, 500, 600, 700, 800, 900, 1000,
    ...Array.from({ length: 49 }, (_, i) => (i + 2) * 1000), // 2000-50000
    100000,
  ];
  for (const words of wordMilestones) {
    if (ctx.totalWordsCorrect >= words) {
      newAchievements.push(`words-${words}`);
    }
  }

  // === ACCURACY ACHIEVEMENTS ===
  // Perfect accuracy on this test
  if (testResult.accuracy === 100) {
    newAchievements.push("accuracy-perfect-1");
  }

  // Tests with 95%+ accuracy
  const accuracyMilestones = [
    { count: 5, id: "accuracy-95-5" },
    { count: 25, id: "accuracy-95-25" },
    { count: 100, id: "accuracy-95-100" },
  ];
  for (const { count, id } of accuracyMilestones) {
    if (ctx.testsWithHighAccuracy >= count) {
      newAchievements.push(id);
    }
  }

  // Perfect accuracy streak
  const accuracyStreakMilestones = [
    { count: 2, id: "accuracy-streak-2" },
    { count: 5, id: "accuracy-streak-5" },
    { count: 10, id: "accuracy-streak-10" },
    { count: 25, id: "accuracy-streak-25" },
  ];
  for (const { count, id } of accuracyStreakMilestones) {
    if (ctx.perfectAccuracyStreak >= count) {
      newAchievements.push(id);
    }
  }

  // === TIME ACHIEVEMENTS (cumulative time in ms) ===
  const timeMilestones = [
    { minutes: 10, id: "time-10m" },
    { minutes: 30, id: "time-30m" },
    { minutes: 60, id: "time-1h" },
    { minutes: 300, id: "time-5h" },
    { minutes: 600, id: "time-10h" },
    { minutes: 1440, id: "time-24h" },
    { minutes: 3000, id: "time-50h" },
    { minutes: 6000, id: "time-100h" },
  ];
  for (const { minutes, id } of timeMilestones) {
    if (ctx.totalTimeTyped >= minutes * 60 * 1000) {
      newAchievements.push(id);
    }
  }

  // === STREAK ACHIEVEMENTS ===
  const streakMilestones = [3, 7, 14, 30, 60, 100, 365];
  for (const days of streakMilestones) {
    if (ctx.currentStreak >= days) {
      newAchievements.push(`streak-${days}`);
    }
  }

  // === TEST COUNT ACHIEVEMENTS ===
  const testMilestones = [1, 5, 10, 25, 50, 100, 250, 500, 1000];
  for (const count of testMilestones) {
    if (ctx.totalTests >= count) {
      newAchievements.push(`tests-${count}`);
    }
  }

  // === EXPLORER ACHIEVEMENTS (modes/features) ===
  const modeAchievements: Record<string, string> = {
    time: "explorer-time-mode",
    words: "explorer-words-mode",
    quote: "explorer-quote-mode",
    preset: "explorer-preset-mode",
  };
  for (const [mode, id] of Object.entries(modeAchievements)) {
    if (ctx.modesCovered.has(mode)) {
      newAchievements.push(id);
    }
  }

  if (testResult.punctuation) {
    newAchievements.push("explorer-punctuation");
  }
  if (testResult.numbers) {
    newAchievements.push("explorer-numbers");
  }

  // All difficulties covered
  if (
    ctx.difficultiesCovered.has("easy") &&
    ctx.difficultiesCovered.has("medium") &&
    ctx.difficultiesCovered.has("hard")
  ) {
    newAchievements.push("explorer-all-difficulties");
  }

  // === SPECIAL ACHIEVEMENTS ===
  // First test
  if (ctx.totalTests === 1) {
    newAchievements.push("special-first-test");
  }

  // Night owl (midnight to 5am)
  if (ctx.localHour >= 0 && ctx.localHour < 5) {
    newAchievements.push("special-night-owl");
  }

  // Early bird (5am to 7am)
  if (ctx.localHour >= 5 && ctx.localHour < 7) {
    newAchievements.push("special-early-bird");
  }

  // Weekend warrior (10 tests on weekends)
  if (ctx.weekendTestCount >= 10) {
    newAchievements.push("special-weekend-warrior");
  }

  // Marathon (120+ seconds)
  if (testResult.duration >= 120000) {
    newAchievements.push("special-marathon");
  }

  // Speed and precision (100+ WPM with 95%+ accuracy)
  if (testResult.wpm >= 100 && testResult.accuracy >= 95) {
    newAchievements.push("special-speed-accuracy");
  }

  // === CONSISTENCY ACHIEVEMENTS ===
  
  // Low variance achievements
  if (ctx.lowVarianceTestCount >= 5) {
    newAchievements.push("consistency-low-variance-5");
  }
  if (ctx.lowVarianceTestCount >= 10) {
    newAchievements.push("consistency-low-variance-10");
  }
  
  // Same WPM achievement
  if (ctx.sameWpmCount >= 3) {
    newAchievements.push("consistency-same-wpm-3");
  }
  
  // Consecutive 90%+ accuracy
  if (ctx.consecutiveHighAccuracyStreak >= 5) {
    newAchievements.push("consistency-90plus-5");
  }
  if (ctx.consecutiveHighAccuracyStreak >= 10) {
    newAchievements.push("consistency-90plus-10");
  }
  if (ctx.consecutiveHighAccuracyStreak >= 25) {
    newAchievements.push("consistency-90plus-25");
  }

  // === IMPROVEMENT ACHIEVEMENTS ===
  
  // Personal best achievements
  if (ctx.pbImprovementCount >= 1) {
    newAchievements.push("improvement-pb-first");
  }
  if (ctx.pbImprovementCount >= 5) {
    newAchievements.push("improvement-pb-5");
  }
  if (ctx.pbImprovementCount >= 10) {
    newAchievements.push("improvement-pb-10");
  }
  
  // PB improvement amount
  if (ctx.isNewPersonalBest && ctx.pbImprovement >= 10) {
    newAchievements.push("improvement-pb-by-10");
  }
  if (ctx.isNewPersonalBest && ctx.pbImprovement >= 20) {
    newAchievements.push("improvement-pb-by-20");
  }
  
  // Double first test WPM
  if (ctx.firstTestWpm > 0 && testResult.wpm >= ctx.firstTestWpm * 2) {
    newAchievements.push("improvement-double-wpm");
  }
  
  // Rising average (20+ improvement since starting)
  if (ctx.firstFiveAvgWpm > 0 && ctx.averageWpm >= ctx.firstFiveAvgWpm + 20) {
    newAchievements.push("improvement-avg-increase");
  }

  // === CHALLENGE MODE ACHIEVEMENTS ===
  
  const isHard = testResult.difficulty === "hard";
  
  if (isHard && testResult.punctuation) {
    newAchievements.push("challenge-hard-punctuation");
  }
  if (isHard && testResult.numbers) {
    newAchievements.push("challenge-hard-numbers");
  }
  if (isHard && testResult.punctuation && testResult.numbers) {
    newAchievements.push("challenge-hard-both");
  }
  if (isHard && testResult.wpm >= 80) {
    newAchievements.push("challenge-hard-80wpm");
  }
  if (isHard && testResult.punctuation && testResult.numbers && testResult.wpm >= 80) {
    newAchievements.push("challenge-hard-both-80wpm");
  }
  if (isHard && testResult.accuracy === 100) {
    newAchievements.push("challenge-hard-100-accuracy");
  }

  // === ENDURANCE ACHIEVEMENTS ===
  
  // Tests in one day
  if (ctx.testsToday >= 5) {
    newAchievements.push("endurance-5-tests-day");
  }
  if (ctx.testsToday >= 10) {
    newAchievements.push("endurance-10-tests-day");
  }
  if (ctx.testsToday >= 20) {
    newAchievements.push("endurance-20-tests-day");
  }
  
  // Long test duration
  if (testResult.duration >= 180000) { // 180 seconds
    newAchievements.push("endurance-180s-test");
  }
  if (testResult.duration >= 300000) { // 300 seconds (5 min)
    newAchievements.push("endurance-300s-test");
  }
  
  // High word count test
  if (testResult.wordCount >= 500) {
    newAchievements.push("endurance-500-words-test");
  }

  // === TIME-BASED ACHIEVEMENTS ===
  
  // Lunch break (12pm-2pm)
  if (ctx.localHour >= 12 && ctx.localHour < 14) {
    newAchievements.push("timebased-lunch");
  }
  
  // Midnight (12am hour)
  if (ctx.localHour === 0) {
    newAchievements.push("timebased-midnight");
  }
  
  // New Year (January 1st)
  if (ctx.monthDay.month === 0 && ctx.monthDay.day === 1) {
    newAchievements.push("timebased-new-year");
  }
  
  // Friday
  if (ctx.dayOfWeek === 5) {
    newAchievements.push("timebased-friday");
  }
  
  // Monday
  if (ctx.dayOfWeek === 1) {
    newAchievements.push("timebased-monday");
  }
  
  // Major holidays
  const { month, day } = ctx.monthDay;
  const isHoliday = 
    (month === 11 && day === 25) || // Christmas
    (month === 11 && day === 31) || // New Year's Eve
    (month === 6 && day === 4) ||   // July 4th
    (month === 9 && day === 31) ||  // Halloween
    (month === 1 && day === 14) ||  // Valentine's Day
    (month === 2 && day === 17);    // St. Patrick's Day
  if (isHoliday) {
    newAchievements.push("timebased-holiday");
  }
  
  // All weekdays (check if this test completes the set)
  if (ctx.weekdaysCovered.size >= 5) {
    newAchievements.push("timebased-all-weekdays");
  }
  
  // Weekend complete
  if (ctx.weekendDaysCovered.size >= 2) {
    newAchievements.push("timebased-all-weekend");
  }

  // === MILESTONE COMBINATIONS ===
  
  // Perfect century (100+ WPM, 100% accuracy)
  if (testResult.wpm >= 100 && testResult.accuracy === 100) {
    newAchievements.push("milestone-100wpm-100acc");
  }
  
  // Elite typist (80+ WPM, 98%+ accuracy)
  if (testResult.wpm >= 80 && testResult.accuracy >= 98) {
    newAchievements.push("milestone-80wpm-98acc");
  }
  
  // Hard perfection (50+ WPM, 100% accuracy on hard)
  if (isHard && testResult.wpm >= 50 && testResult.accuracy === 100) {
    newAchievements.push("milestone-50wpm-100acc-hard");
  }
  
  // Triple threat (100+ WPM, 100+ words, 100+ seconds)
  if (testResult.wpm >= 100 && testResult.wordCount >= 100 && testResult.duration >= 100000) {
    newAchievements.push("milestone-triple-digits");
  }
  
  // Speed marathoner (80+ WPM on 120+ second test)
  if (testResult.wpm >= 80 && testResult.duration >= 120000) {
    newAchievements.push("milestone-speed-endurance");
  }
  
  // Accurate thousand (1000 words with 95%+ avg accuracy)
  if (ctx.totalWordsCorrect >= 1000 && ctx.averageAccuracy >= 95) {
    newAchievements.push("milestone-1000-words-95acc");
  }
  
  // Mode master (80+ WPM in time, words, and quote modes)
  const timeWpm = ctx.wpmByMode.get("time") || 0;
  const wordsWpm = ctx.wpmByMode.get("words") || 0;
  const quoteWpm = ctx.wpmByMode.get("quote") || 0;
  if (timeWpm >= 80 && wordsWpm >= 80 && quoteWpm >= 80) {
    newAchievements.push("milestone-all-modes-80wpm");
  }
  
  // Consistent speed (7-day streak with 100+ WPM each day)
  if (ctx.has100WpmAllDaysInStreak) {
    newAchievements.push("milestone-week-streak-100wpm");
  }

  // === FUN/QUIRKY ACHIEVEMENTS ===
  
  const roundedWpm = Math.round(testResult.wpm);
  
  // The Meme (67 WPM)
  if (roundedWpm === 67) {
    newAchievements.push("quirky-67");
  }
  
  // Lucky sevens (77 WPM)
  if (roundedWpm === 77) {
    newAchievements.push("quirky-lucky-7");
  }
  
  // Perfectly round (100 WPM exact)
  if (roundedWpm === 100) {
    newAchievements.push("quirky-100-exact");
  }
  
  // Palindrome (11, 22, 33, 44, 55, 66, 77, 88, 99, 111, 121, 131, etc.)
  const wpmStr = roundedWpm.toString();
  const isPalindrome = wpmStr === wpmStr.split("").reverse().join("");
  if (isPalindrome && roundedWpm >= 11) {
    newAchievements.push("quirky-palindrome");
  }
  
  // Answer to everything (42 WPM)
  if (roundedWpm === 42) {
    newAchievements.push("quirky-42");
  }
  
  // Easy as 123 (123 WPM)
  if (roundedWpm === 123) {
    newAchievements.push("quirky-123");
  }
  
  // Pi day (31 WPM on March 14th)
  if (roundedWpm === 31 && ctx.monthDay.month === 2 && ctx.monthDay.day === 14) {
    newAchievements.push("quirky-pi");
  }

  // === COLLECTION ACHIEVEMENTS ===
  
  // These check the count AFTER potential new achievements are added
  // We add the count of new achievements from this run
  const projectedTotal = ctx.totalAchievementsCount + newAchievements.length;
  
  if (projectedTotal >= 10) {
    newAchievements.push("collection-10");
  }
  if (projectedTotal >= 25) {
    newAchievements.push("collection-25");
  }
  if (projectedTotal >= 50) {
    newAchievements.push("collection-50");
  }
  if (projectedTotal >= 100) {
    newAchievements.push("collection-100");
  }
  if (projectedTotal >= 150) {
    newAchievements.push("collection-150");
  }
  
  // Category master is complex - skip for now as it requires checking complete categories

  return newAchievements;
}

/**
 * Internal mutation to check and award achievements after a test
 * Called from testResults.saveResult
 */
export const checkAndAwardAchievements = internalMutation({
  args: {
    userId: v.id("users"),
    testResult: v.object({
      wpm: v.number(),
      accuracy: v.number(),
      mode: v.string(),
      duration: v.number(),
      wordCount: v.number(),
      difficulty: v.string(),
      punctuation: v.boolean(),
      numbers: v.boolean(),
      wordsCorrect: v.number(),
      wordsIncorrect: v.number(),
      createdAt: v.number(),
    }),
    localHour: v.number(),
    isWeekend: v.boolean(),
    // New time-based fields
    dayOfWeek: v.number(), // 0-6 (Sunday-Saturday)
    month: v.number(), // 0-11
    day: v.number(), // 1-31
  },
  handler: async (
    ctx,
    args
  ): Promise<{ newAchievements: string[]; totalAchievements: number }> => {
    // Get all test results for this user to compute aggregate stats
    const allResults = await ctx.db
      .query("testResults")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get user's streak
    const streak = await ctx.db
      .query("userStreaks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    // Get existing achievements
    const existingAchievementRecord = await ctx.db
      .query("userAchievements")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const existingAchievements = existingAchievementRecord?.achievements ?? {};

    // Compute aggregate stats
    const totalTests = allResults.length;
    const totalWordsCorrect = allResults.reduce(
      (sum, r) => sum + (r.wordsCorrect ?? 0),
      0
    );
    const totalTimeTyped = allResults.reduce((sum, r) => sum + r.duration, 0);

    // Count tests with 95%+ accuracy
    const testsWithHighAccuracy = allResults.filter(
      (r) => r.accuracy >= 95
    ).length;

    // Count weekend tests (we'll approximate - the current test is marked)
    // For simplicity, just count if current test is weekend
    const weekendTestCount = args.isWeekend
      ? allResults.filter((_, i) => i === allResults.length - 1).length + 
        (existingAchievements["special-weekend-warrior"] ? 10 : 0)
      : 0;
    // Note: This is a simplified approach. A more accurate implementation
    // would track weekend tests separately in the DB.

    // Compute perfect accuracy streak (consecutive 100% tests from most recent)
    let perfectAccuracyStreak = 0;
    const sortedResults = [...allResults].sort(
      (a, b) => b.createdAt - a.createdAt
    );
    for (const result of sortedResults) {
      if (result.accuracy === 100) {
        perfectAccuracyStreak++;
      } else {
        break;
      }
    }

    // Track modes and difficulties covered
    const modesCovered = new Set(allResults.map((r) => r.mode));
    const difficultiesCovered = new Set(allResults.map((r) => r.difficulty));

    // === COMPUTE NEW CONTEXT FIELDS ===

    // Consecutive 90%+ accuracy streak
    let consecutiveHighAccuracyStreak = 0;
    for (const result of sortedResults) {
      if (result.accuracy >= 90) {
        consecutiveHighAccuracyStreak++;
      } else {
        break;
      }
    }

    // WPM variance across last 10 tests
    const last10Results = sortedResults.slice(0, 10);
    let recentWpmVariance = 0;
    let lowVarianceTestCount = 0;
    if (last10Results.length >= 5) {
      const wpms = last10Results.map((r) => r.wpm);
      const mean = wpms.reduce((a, b) => a + b, 0) / wpms.length;
      const variance = wpms.reduce((sum, wpm) => sum + Math.pow(wpm - mean, 2), 0) / wpms.length;
      recentWpmVariance = Math.sqrt(variance); // standard deviation
      if (recentWpmVariance < 5) {
        lowVarianceTestCount = last10Results.length;
      }
    }

    // Count tests with same WPM (rounded)
    const wpmCounts = new Map<number, number>();
    for (const result of allResults) {
      const roundedWpm = Math.round(result.wpm);
      wpmCounts.set(roundedWpm, (wpmCounts.get(roundedWpm) || 0) + 1);
    }
    const sameWpmCount = Math.max(...Array.from(wpmCounts.values()), 0);

    // Personal best tracking
    const allWpms = allResults.map((r) => r.wpm);
    const previousResults = allResults.slice(0, -1); // All except current
    const previousWpms = previousResults.map((r) => r.wpm);
    const personalBestWpm = allWpms.length > 0 ? Math.max(...allWpms) : 0;
    const previousPersonalBest = previousWpms.length > 0 ? Math.max(...previousWpms) : 0;
    const isNewPersonalBest = args.testResult.wpm > previousPersonalBest && previousResults.length > 0;
    const pbImprovement = isNewPersonalBest ? args.testResult.wpm - previousPersonalBest : 0;

    // First test WPM (oldest test)
    const oldestFirst = [...allResults].sort((a, b) => a.createdAt - b.createdAt);
    const firstTestWpm = oldestFirst.length > 0 ? oldestFirst[0].wpm : args.testResult.wpm;

    // Count PB improvements (how many times user beat their previous PB)
    let pbImprovementCount = 0;
    let runningMax = 0;
    for (const result of oldestFirst) {
      if (result.wpm > runningMax) {
        if (runningMax > 0) pbImprovementCount++; // Don't count the first test
        runningMax = result.wpm;
      }
    }

    // Average WPM
    const averageWpm = allWpms.length > 0 
      ? allWpms.reduce((a, b) => a + b, 0) / allWpms.length 
      : 0;

    // First 5 tests average
    const first5 = oldestFirst.slice(0, 5);
    const firstFiveAvgWpm = first5.length > 0 
      ? first5.reduce((sum, r) => sum + r.wpm, 0) / first5.length 
      : 0;

    // Tests today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartMs = todayStart.getTime();
    const testsToday = allResults.filter((r) => r.createdAt >= todayStartMs).length;

    // Best WPM by mode
    const wpmByMode = new Map<string, number>();
    for (const result of allResults) {
      const current = wpmByMode.get(result.mode) || 0;
      if (result.wpm > current) {
        wpmByMode.set(result.mode, result.wpm);
      }
    }

    // Average accuracy
    const accuracies = allResults.map((r) => r.accuracy);
    const averageAccuracy = accuracies.length > 0 
      ? accuracies.reduce((a, b) => a + b, 0) / accuracies.length 
      : 0;

    // Check if user has 100+ WPM on every day of their current streak
    // This is simplified - we just check if current streak exists and current test is 100+
    const has100WpmAllDaysInStreak = (streak?.currentStreak ?? 0) >= 7 && args.testResult.wpm >= 100;

    // Weekdays and weekend days covered
    const weekdaysCovered = new Set<number>();
    const weekendDaysCovered = new Set<number>();
    // We track this based on the current test's day
    const currentDayOfWeek = args.dayOfWeek;
    if (currentDayOfWeek >= 1 && currentDayOfWeek <= 5) {
      weekdaysCovered.add(currentDayOfWeek);
    } else {
      weekendDaysCovered.add(currentDayOfWeek);
    }
    // Check existing achievements to see which days are already covered
    if (existingAchievements["timebased-monday"]) weekdaysCovered.add(1);
    if (existingAchievements["timebased-friday"]) weekdaysCovered.add(5);
    // We'll track Tuesday-Thursday implicitly if weekday warrior is earned
    if (existingAchievements["timebased-all-weekdays"]) {
      weekdaysCovered.add(1).add(2).add(3).add(4).add(5);
    }
    if (existingAchievements["timebased-all-weekend"]) {
      weekendDaysCovered.add(0).add(6);
    }

    // Total achievements count
    const totalAchievementsCount = Object.keys(existingAchievements).length;

    // Check achievements
    const checkContext: AchievementCheckContext = {
      testResult: args.testResult,
      localHour: args.localHour,
      isWeekend: args.isWeekend,
      totalTests,
      totalWordsCorrect,
      totalTimeTyped,
      testsWithHighAccuracy,
      perfectAccuracyStreak,
      weekendTestCount,
      modesCovered,
      difficultiesCovered,
      currentStreak: streak?.currentStreak ?? 0,
      // New fields
      dayOfWeek: args.dayOfWeek,
      monthDay: { month: args.month, day: args.day },
      consecutiveHighAccuracyStreak,
      recentWpmVariance,
      lowVarianceTestCount,
      sameWpmCount,
      personalBestWpm,
      previousPersonalBest,
      firstTestWpm,
      pbImprovementCount,
      averageWpm,
      firstFiveAvgWpm,
      isNewPersonalBest,
      pbImprovement,
      testsToday,
      wpmByMode,
      averageAccuracy,
      has100WpmAllDaysInStreak,
      weekdaysCovered,
      weekendDaysCovered,
      totalAchievementsCount,
    };

    const potentialAchievements = checkAchievements(checkContext);

    // Filter to only new achievements (not already earned)
    const now = Date.now();
    const newAchievements = potentialAchievements.filter(
      (id) => !existingAchievements[id]
    );

    if (newAchievements.length > 0) {
      // Create updated achievements record
      const updatedAchievements = { ...existingAchievements };
      for (const id of newAchievements) {
        updatedAchievements[id] = now;
      }

      if (existingAchievementRecord) {
        // Update existing record
        await ctx.db.patch(existingAchievementRecord._id, {
          achievements: updatedAchievements,
          updatedAt: now,
        });
      } else {
        // Create new record
        await ctx.db.insert("userAchievements", {
          userId: args.userId,
          achievements: updatedAchievements,
          updatedAt: now,
        });
      }
    }

    const totalAchievements = Object.keys(existingAchievements).length + newAchievements.length;

    return {
      newAchievements,
      totalAchievements,
    };
  },
});

/**
 * Query to get a user's achievements
 * Returns a record of achievementId -> earnedAt timestamp
 */
export const getUserAchievements = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args): Promise<Record<string, number>> => {
    // Find the user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return {};
    }

    // Get the user's achievements record
    const achievementRecord = await ctx.db
      .query("userAchievements")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    return achievementRecord?.achievements ?? {};
  },
});
