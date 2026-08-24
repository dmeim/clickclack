import { generateRaceText } from "./raceWords";
import { MAX_WPM } from "./antiCheatConstants";

const PUNCTUATION_CHARS = [".", ",", "!", "?", ";", ":"];
const NUMBER_CHARS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function wordCountForPrompt(
  mode: string,
  duration?: number,
  wordTarget?: number
): number {
  if (mode === "words" && wordTarget && wordTarget > 0) {
    return wordTarget;
  }
  if (mode === "time" && duration && duration > 0) {
    // Enough words that a 300 WPM typist will not run out mid-test.
    return Math.max(50, Math.ceil((duration / 60) * MAX_WPM * 1.25));
  }
  return 200;
}

export function applyDifficultyFlags(
  text: string,
  options: {
    punctuation: boolean;
    numbers: boolean;
    capitalization: boolean;
  }
): string {
  const words = text.split(" ").filter((w) => w.length > 0);
  const next: string[] = [];

  for (let i = 0; i < words.length; i++) {
    let word = words[i];

    if (options.numbers && Math.random() < 0.2) {
      word =
        NUMBER_CHARS[Math.floor(Math.random() * NUMBER_CHARS.length)] +
        NUMBER_CHARS[Math.floor(Math.random() * NUMBER_CHARS.length)];
    }

    if (options.punctuation && Math.random() < 0.15 && i > 0) {
      word =
        word +
        PUNCTUATION_CHARS[
          Math.floor(Math.random() * PUNCTUATION_CHARS.length)
        ];
    }

    if (options.capitalization && Math.random() < 0.25) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
    }

    next.push(word);
  }

  return next.join(" ");
}

/**
 * Server-owned prompt for ranked time/words (and zen fallback).
 * Uses the same difficulty pools as race text generation; does not change
 * generateRaceText's signature.
 */
export function generateSoloPrompt(args: {
  mode: string;
  duration?: number;
  wordTarget?: number;
  difficulty: string;
  punctuation: boolean;
  numbers: boolean;
  capitalization: boolean;
}): string {
  const count = wordCountForPrompt(args.mode, args.duration, args.wordTarget);
  const base = generateRaceText(args.difficulty, count);
  return applyDifficultyFlags(base, {
    punctuation: args.punctuation,
    numbers: args.numbers,
    capitalization: args.capitalization,
  });
}

export type SoloPromptGenerator = typeof generateSoloPrompt;

/**
 * Server-owned prompt for startSession.
 * Quote/preset: client targetText is required and locked.
 * Time/words/zen (and any other mode): always generate; ignore client text.
 */
export function resolveSessionTargetText(
  args: {
    mode: string;
    clientTargetText?: string;
    duration?: number;
    wordTarget?: number;
    difficulty: string;
    punctuation: boolean;
    numbers: boolean;
    capitalization: boolean;
  },
  generate: SoloPromptGenerator = generateSoloPrompt
): string {
  const client = args.clientTargetText?.trim() ?? "";
  if (args.mode === "quote" || args.mode === "preset") {
    if (client.length === 0) {
      throw new Error("targetText is required for quote and preset modes.");
    }
    return client;
  }
  return generate({
    mode: args.mode,
    duration: args.duration,
    wordTarget: args.wordTarget,
    difficulty: args.difficulty,
    punctuation: args.punctuation,
    numbers: args.numbers,
    capitalization: args.capitalization,
  });
}
