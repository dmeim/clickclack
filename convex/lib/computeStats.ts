/**
 * Server-side stats computation
 *
 * Mirrors the client's computeStats logic from TypingPractice.tsx
 * for server-authoritative WPM/accuracy calculation
 */

export interface StatsResult {
  correct: number;
  incorrect: number;
  missed: number;
  extra: number;
}

export interface WordResults {
  correctWords: string[];
  incorrectWords: { typed: string; expected: string }[];
}

/**
 * Compute character-level stats from typed text vs reference text
 */
export function computeStats(typed: string, reference: string): StatsResult {
  const typedWords = typed.split(" ");
  const referenceWords = reference.split(" ");

  let correct = 0;
  let incorrect = 0;
  let missed = 0;
  let extra = 0;

  for (let i = 0; i < typedWords.length; i++) {
    const typedWord = typedWords[i];
    const refWord = referenceWords[i] || "";
    const isCurrentWord = i === typedWords.length - 1;

    if (isCurrentWord) {
      // For current word, compare character by character
      for (let j = 0; j < typedWord.length; j++) {
        if (j < refWord.length) {
          if (typedWord[j] === refWord[j]) {
            correct++;
          } else {
            incorrect++;
          }
        } else {
          extra++;
        }
      }
    } else {
      // For completed words
      for (let j = 0; j < refWord.length; j++) {
        if (j < typedWord.length) {
          if (typedWord[j] === refWord[j]) {
            correct++;
          } else {
            incorrect++;
          }
        } else {
          missed++;
        }
      }

      if (typedWord.length > refWord.length) {
        extra += typedWord.length - refWord.length;
      }
    }

    // Count space characters (between words)
    if (i < typedWords.length - 1) {
      const refHasNextWord = i < referenceWords.length - 1;
      if (refHasNextWord) {
        if (typedWord.length >= refWord.length) {
          correct++;
        } else {
          incorrect++;
        }
      } else {
        const isSingleTrailingSpace =
          i === typedWords.length - 2 && typedWords[i + 1] === "";
        if (isSingleTrailingSpace) {
          correct++;
        } else {
          extra++;
        }
      }
    }
  }

  return { correct, incorrect, missed, extra };
}

/**
 * Compute word-level results (correct vs incorrect words)
 */
export function computeWordResults(typed: string, reference: string): WordResults {
  const typedWords = typed
    .trim()
    .split(" ")
    .filter((w) => w.length > 0);
  const referenceWords = reference.split(" ");

  const correctWords: string[] = [];
  const incorrectWords: { typed: string; expected: string }[] = [];

  for (let i = 0; i < typedWords.length; i++) {
    const typedWord = typedWords[i];
    const refWord = referenceWords[i] || "";

    if (typedWord === refWord) {
      correctWords.push(typedWord);
    } else if (refWord) {
      incorrectWords.push({ typed: typedWord, expected: refWord });
    }
  }

  return { correctWords, incorrectWords };
}

/**
 * Calculate accuracy from stats
 */
export function calculateAccuracy(stats: StatsResult, totalTyped: number): number {
  if (totalTyped === 0) return 100;
  return (stats.correct / totalTyped) * 100;
}

/**
 * Calculate WPM from typed text and elapsed time
 */
export function calculateWpm(typedLength: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const elapsedMinutes = elapsedMs / 60000;
  // Standard WPM: (characters / 5) / minutes
  return typedLength / 5 / elapsedMinutes;
}
