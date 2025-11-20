"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

type Mode = "time" | "words" | "quote" | "zen" | "preset";
type Difficulty = "beginner" | "easy" | "medium" | "hard" | "extreme";

type Quote = {
  quote: string;
  author: string;
  source: string;
  context: string;
  date: string;
};

type QuoteLength = "all" | "short" | "medium" | "long" | "xl";

type SettingsState = {
  mode: Mode;
  duration: number;
  wordTarget: number;
  quoteLength: QuoteLength;
  punctuation: boolean;
  numbers: boolean;
  typingFontSize: number;
  iconFontSize: number;
  helpFontSize: number;
  difficulty: Difficulty;
  textAlign: "left" | "center" | "right" | "justify";
  ghostWriterSpeed: number;
  ghostWriterEnabled: boolean;
  soundEnabled: boolean;
  presetText: string;
  presetModeType: "time" | "finish";
};

type Theme = {
  cursor: string;
  defaultText: string;
  upcomingText: string;
  correctText: string;
  incorrectText: string;
  buttonUnselected: string;
  buttonSelected: string;
  backgroundColor: string;
  ghostCursor: string;
};

const DEFAULT_THEME: Theme = {
  cursor: "#eab308", // yellow-500
  defaultText: "#4b5563", // gray-600
  upcomingText: "#4b5563", // gray-600
  correctText: "#d1d5db", // gray-300
  incorrectText: "#ef4444", // red-500
  buttonUnselected: "#4b5563", // gray-600
  buttonSelected: "#eab308", // yellow-500
  backgroundColor: "#323437", // gray-800/900ish
  ghostCursor: "#a855f7", // purple-500
};

const TIME_PRESETS = [15, 30, 60, 120, 300];
const WORD_PRESETS = [10, 25, 50, 100, 500];

const PUNCTUATION_CHARS = [".", ",", "!", "?", ";", ":"];
const NUMBER_CHARS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

// Word generation helper
const generateWords = (count: number, pool: string[], options: { punctuation: boolean; numbers: boolean }) => {
  const words = [];
  if (pool.length === 0) return "";

  for (let i = 0; i < count; i++) {
    let word = pool[Math.floor(Math.random() * pool.length)];

    // Add numbers occasionally
    if (options.numbers && Math.random() < 0.15) {
      word = NUMBER_CHARS[Math.floor(Math.random() * NUMBER_CHARS.length)] +
        NUMBER_CHARS[Math.floor(Math.random() * NUMBER_CHARS.length)];
    }

    // Add punctuation occasionally
    if (options.punctuation && Math.random() < 0.1 && i > 0) {
      word = word + PUNCTUATION_CHARS[Math.floor(Math.random() * PUNCTUATION_CHARS.length)];
    }

    words.push(word);
  }
  return words.join(" ");
};



const computeStats = (typed: string, reference: string) => {
  const typedWords = typed.split(" ");
  const referenceWords = reference.split(" ");

  let correct = 0;
  let incorrect = 0;
  let missed = 0;
  let extra = 0;

  for (let i = 0; i < typedWords.length; i++) {
    const typedWord = typedWords[i];
    const refWord = referenceWords[i] || "";

    // If this is the last word, it's the one currently being typed
    const isCurrentWord = i === typedWords.length - 1;

    if (isCurrentWord) {
      // For the current word being typed
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
      // For completed words (or words we've moved past)
      // 1. Compare characters up to the length of the reference word
      for (let j = 0; j < refWord.length; j++) {
        if (j < typedWord.length) {
          if (typedWord[j] === refWord[j]) {
            correct++;
          } else {
            incorrect++;
          }
        } else {
          // Character in reference was not typed
          missed++;
        }
      }

      // 2. Check for extra characters typed beyond reference length
      if (typedWord.length > refWord.length) {
        extra += typedWord.length - refWord.length;
      }
    }

    // Handle space after the word (if not the last word)
    if (i < typedWords.length - 1) {
      const refHasNextWord = i < referenceWords.length - 1;

      if (refHasNextWord) {
        // Check if the word was fully typed before the space
        if (typedWord.length >= refWord.length) {
          correct++;
        } else {
          incorrect++;
        }
      } else {
        extra++;
      }
    }
  }

  return { correct, incorrect, missed, extra };
};

const LINE_HEIGHT = 1.6;

export default function TypingPractice() {
  const [settings, setSettings] = useState<SettingsState>({
    mode: "time",
    duration: 30,
    wordTarget: 25,
    punctuation: false,
    numbers: false,
    typingFontSize: 3.5,
    iconFontSize: 1.25,
    helpFontSize: 1,
    difficulty: "beginner",
    quoteLength: "all",
    textAlign: "left",
    ghostWriterSpeed: 60,
    ghostWriterEnabled: false,
    soundEnabled: false,
    presetText: "",
    presetModeType: "finish",
  });

  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [showThemeModal, setShowThemeModal] = useState(false);

  const [linePreview, setLinePreview] = useState(3);
  const [showSettings, setShowSettings] = useState(false);
  const [showPresetInput, setShowPresetInput] = useState(false);
  const [tempPresetText, setTempPresetText] = useState("");
  const [wordPool, setWordPool] = useState<string[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [words, setWords] = useState("");
  const [typedText, setTypedText] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeWordRef = useRef<HTMLSpanElement | null>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isZenUIHidden, setIsZenUIHidden] = useState(false);
  const zenTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isRepeated, setIsRepeated] = useState(false);
  const [ghostCharIndex, setGhostCharIndex] = useState(0);

  useEffect(() => {
    if (showPresetInput) {
      setTempPresetText(settings.presetText);
    }
  }, [showPresetInput, settings.presetText]);

  // Load word lists based on difficulty
  useEffect(() => {
    const loadWords = async () => {
      const difficulties: Difficulty[] = ["beginner", "easy", "medium", "hard", "extreme"];
      const targetIndex = difficulties.indexOf(settings.difficulty);
      const filesToLoad = difficulties.slice(0, targetIndex + 1);

      try {
        const promises = filesToLoad.map(async (diff) => {
          const res = await fetch(`/words/${diff}.json`);
          if (!res.ok) {
            console.error(`Failed to fetch /words/${diff}.json: ${res.status}`);
            return [];
          }
          return res.json();
        });
        const results = await Promise.all(promises);
        const combinedWords = results.flat();
        if (combinedWords.length > 0) {
          setWordPool(combinedWords);
        }
      } catch (error) {
        console.error("Failed to load word lists:", error);
      }
    };

    loadWords();
  }, [settings.difficulty]);

  // Load quotes
  useEffect(() => {
    if (settings.mode !== "quote") return;

    const loadQuotes = async () => {
      try {
        let filesToLoad: QuoteLength[] = [];
        if (settings.quoteLength === "all") {
          filesToLoad = ["short", "medium", "long", "xl"];
        } else {
          filesToLoad = [settings.quoteLength];
        }

        const promises = filesToLoad.map(async (len) => {
          const res = await fetch(`/quotes/${len}.json`);
          if (!res.ok) {
            console.error(`Failed to load quotes/${len}.json`);
            return [];
          }
          return res.json();
        });

        const results = await Promise.all(promises);
        const combinedQuotes = results.flat();
        setQuotes(combinedQuotes);
      } catch (error) {
        console.error("Failed to load quotes:", error);
      }
    };

    loadQuotes();
  }, [settings.mode, settings.quoteLength]);

  const resetSession = useCallback((isRepeat = false) => {
    setTypedText("");
    setIsRunning(false);
    setIsFinished(false);
    setStartTime(null);
    setElapsedMs(0);
    setElapsedMs(0);
    setScrollOffset(0);
    setGhostCharIndex(0);
    setIsRepeated(isRepeat);
    inputRef.current?.focus();
  }, []);

  const sanitizeText = (text: string) => {
    // Remove non-printable characters and excessive whitespace
    return text.replace(/[^\x20-\x7E\n]/g, "").replace(/\s+/g, " ").trim();
  };

  const handlePresetSubmit = (text: string) => {
    const sanitized = sanitizeText(text);
    if (sanitized.length > 0) {
      updateSettings({ presetText: sanitized });
      setShowPresetInput(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setTempPresetText(text);
    };
    reader.readAsText(file);
  };

  // Generate words or select quote when settings change
  const generateTest = useCallback(() => {
    if (settings.mode === "quote") {
      if (quotes.length === 0) return;

      // Since we now load only relevant quotes (or all), we don't need to filter by length again
      // unless we want to be extra safe, but the file separation handles it.
      // However, if 'all' is selected, we have all quotes, so no filtering needed.
      // If specific length is selected, we only loaded those quotes.
      // So we can just pick a random quote from the loaded 'quotes' array.

      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      if (randomQuote) {
        setCurrentQuote(randomQuote);
        setWords(randomQuote.quote);
        resetSession(false);
        setScrollOffset(0);
      }
      return;
    }

    if (settings.mode === "preset") {
      if (!settings.presetText) {
        setShowPresetInput(true);
        return;
      }
      setWords(settings.presetText);
      resetSession(false);
      setScrollOffset(0);
      return;
    }

    if (wordPool.length === 0) return;

    const wordCount = settings.mode === "words" ? settings.wordTarget : 200;
    setWords(generateWords(wordCount, wordPool, {
      punctuation: settings.punctuation,
      numbers: settings.numbers
    }));
    resetSession(false);
    setScrollOffset(0);
  }, [settings.mode, settings.duration, settings.wordTarget, settings.punctuation, settings.numbers, settings.quoteLength, settings.presetText, wordPool, quotes, resetSession]);

  useEffect(() => {
    generateTest();
  }, [generateTest]);



  const updateSettings = useCallback(
    (updates: Partial<SettingsState>) => {
      setSettings((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const finishSession = useCallback(() => {
    if (isFinished) return;
    setIsFinished(true);
    setIsRunning(false);
  }, [isFinished]);

  // Timer effect
  useEffect(() => {
    if (!isRunning || !startTime) return;

    const interval = window.setInterval(() => {
      const nextElapsed = Date.now() - startTime;
      setElapsedMs(nextElapsed);

      if ((settings.mode === "time" || (settings.mode === "preset" && settings.presetModeType === "time")) && nextElapsed >= settings.duration * 1000) {
        finishSession();
      }
    }, 100);

    return () => window.clearInterval(interval);
  }, [finishSession, isRunning, settings.mode, settings.duration, settings.presetModeType, startTime]);

  // Ghost Writer effect
  useEffect(() => {
    if (!isRunning || !startTime || !settings.ghostWriterEnabled || settings.ghostWriterSpeed <= 0) return;

    let animationFrameId: number;

    const updateGhost = () => {
      const elapsedMinutes = (Date.now() - startTime) / 60000;
      // WPM = (chars / 5) / minutes
      // chars = WPM * 5 * minutes
      const targetChars = settings.ghostWriterSpeed * 5 * elapsedMinutes;
      setGhostCharIndex(targetChars);
      animationFrameId = requestAnimationFrame(updateGhost);
    };

    animationFrameId = requestAnimationFrame(updateGhost);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isRunning, startTime, settings.ghostWriterSpeed, settings.ghostWriterEnabled]);

  const playClickSound = useCallback(() => {
    if (!settings.soundEnabled) return;
    try {
      // Clone the audio to allow overlapping sounds for fast typing
      const audio = new Audio("/sounds/click.wav");
      audio.volume = 0.5;
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Ignore auto-play errors or missing file errors
      });
    } catch (e) {
      console.error("Error playing sound:", e);
    }
  }, [settings.soundEnabled]);

  const handleInput = (value: string) => {
    if (isFinished) return;

    if (!isRunning) {
      setIsRunning(true);
      setStartTime(Date.now());
    }

    // Handle Zen Mode UI visibility
    if (settings.mode === "zen") {
      setIsZenUIHidden(true);
      if (zenTimeoutRef.current) clearTimeout(zenTimeoutRef.current);
      zenTimeoutRef.current = setTimeout(() => {
        setIsZenUIHidden(false);
      }, 3000);
    }

    setTypedText(value);
    playClickSound();

    // Check quote or preset completion
    if (settings.mode === "quote" || settings.mode === "preset") {
      if (value.length === words.length) {
        finishSession();
      }
      return;
    }

    // Infinite words generation for other modes
    const currentWords = value.trim().split(/\s+/).length;
    const totalWords = words.split(" ").length;

    if (totalWords - currentWords < 20) {
      const newWords = generateWords(20, wordPool, {
        punctuation: settings.punctuation,
        numbers: settings.numbers
      });
      setWords(prev => prev + " " + newWords);
    }

    // Check word mode completion
    if (settings.mode === "words") {
      const typedWords = value.trim().split(/\s+/).length;
      if (value.endsWith(" ") && typedWords >= settings.wordTarget) {
        finishSession();
      }
    }
  };

  // Handle scrolling
  useLayoutEffect(() => {
    if (!containerRef.current || !activeWordRef.current) return;

    const container = containerRef.current;
    const activeWord = activeWordRef.current;
    const containerRect = container.getBoundingClientRect();
    const wordRect = activeWord.getBoundingClientRect();

    // Calculate relative position
    const relativeTop = wordRect.top - containerRect.top;
    const lineHeight = parseFloat(getComputedStyle(container).lineHeight || "0");

    // If word is on 3rd line or below (index 2+), scroll up
    // We want active line to be line 2 (index 1), unless we only have 1 line preview
    const targetTop = linePreview === 1 ? 0 : lineHeight;

    if (relativeTop > targetTop + 5) { // +5 for buffer/sub-pixel diffs
      setScrollOffset(prev => prev + lineHeight);
    }
  }, [typedText, settings.typingFontSize, linePreview]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent tab from leaving input
    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        resetSession(true);
      }
    }
  };

  // Handle Enter/Tab to restart/repeat when finished
  useEffect(() => {
    if (!isFinished) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        generateTest();
      } else if (e.key === "Tab" && settings.mode !== "zen") {
        e.preventDefault();
        resetSession(true);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isFinished, generateTest, resetSession]);

  // Handle Escape to end test abruptly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isRunning) {
        finishSession();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRunning, finishSession]);

  // Calculate stats
  const stats = useMemo(() => computeStats(typedText, words), [typedText, words]);
  const accuracy = typedText.length > 0 ? (stats.correct / typedText.length) * 100 : 100;
  const elapsedMinutes = elapsedMs / 60000 || 0.01;
  const wpm = (typedText.length / 5) / elapsedMinutes;
  const raw = wpm;
  const net = wpm * (accuracy / 100);

  // Split words into array for rendering
  const wordArray = words.split(" ");
  const typedArray = typedText.split(" ");
  const currentWordIndex = typedArray.length - 1;

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center px-4 py-8 transition-colors duration-300"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      {/* Settings bar */}
      {!isRunning && !isFinished && (
        <div
          className={`fixed top-[10%] left-0 w-full flex flex-col items-center justify-center gap-4 transition-opacity duration-300 ${settings.mode === "zen" && isZenUIHidden ? "opacity-0 pointer-events-none" : "opacity-100"}`}
          style={{ fontSize: `${settings.iconFontSize}rem` }}
        >
          {/* Top Row: Icons and Modes */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* Settings button */}
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="flex h-[1.5em] w-[1.5em] items-center justify-center rounded transition hover:opacity-75"
              style={{ color: theme.buttonUnselected }}
              title="settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.78 1.35a2 2 0 0 0 .73 2.73l.15.08a2 2 0 0 1 1 1.73v.52a2 2 0 0 1-1 1.73l-.15.08a2 2 0 0 0-.73 2.73l.78 1.35a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.78-1.35a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.73v-.52a2 2 0 0 1 1-1.73l.15-.08a2 2 0 0 0 .73-2.73l-.78-1.35a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>

            {/* Theme button */}
            <button
              type="button"
              onClick={() => setShowThemeModal(true)}
              className="flex h-[1.5em] w-[1.5em] items-center justify-center rounded transition hover:opacity-75"
              style={{ color: theme.buttonUnselected }}
              title="customize theme"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" stroke="none" />
                <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" stroke="none" />
                <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" stroke="none" />
                <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" stroke="none" />
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
              </svg>
            </button>

            {/* Sound toggle */}
            <button
              type="button"
              onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
              className="flex h-[1.5em] w-[1.5em] items-center justify-center rounded transition hover:opacity-75"
              style={{ color: settings.soundEnabled ? theme.buttonSelected : theme.buttonUnselected }}
              title="toggle sound"
            >
              {settings.soundEnabled ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              )}
            </button>

            {/* Ghost Writer toggle */}
            <button
              type="button"
              onClick={() => updateSettings({ ghostWriterEnabled: !settings.ghostWriterEnabled })}
              className="flex h-[1.5em] w-[1.5em] items-center justify-center rounded transition hover:opacity-75"
              style={{ color: settings.ghostWriterEnabled ? theme.buttonSelected : theme.buttonUnselected }}
              title="toggle ghost writer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 10h.01" />
                <path d="M15 10h.01" />
                <path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z" />
              </svg>
            </button>

            {settings.mode !== "preset" && (
              <>
                <div className="mx-2 h-6 w-px bg-gray-700" />

                {/* Punctuation toggle */}
                <button
                  type="button"
                  onClick={() => updateSettings({ punctuation: !settings.punctuation })}
                  className="flex h-[1.5em] w-[1.5em] items-center justify-center rounded transition hover:opacity-75"
                  style={{ color: settings.punctuation ? theme.buttonSelected : theme.buttonUnselected }}
                  title="punctuation"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
                  </svg>
                </button>

                {/* Numbers toggle */}
                <button
                  type="button"
                  onClick={() => updateSettings({ numbers: !settings.numbers })}
                  className="flex h-[1.5em] w-[1.5em] items-center justify-center rounded transition hover:opacity-75"
                  style={{ color: settings.numbers ? theme.buttonSelected : theme.buttonUnselected }}
                  title="numbers"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" x2="20" y1="9" y2="9" />
                    <line x1="4" x2="20" y1="15" y2="15" />
                    <line x1="10" x2="8" y1="3" y2="21" />
                    <line x1="16" x2="14" y1="3" y2="21" />
                  </svg>
                </button>
              </>
            )}

            <div className="mx-2 h-6 w-px bg-gray-700" />

            {/* Mode selector */}
            <div className="flex gap-2">
              {(["time", "words", "quote", "zen", "preset"] as Mode[]).map((mode) => (
                <button
                  type="button"
                  key={mode}
                  onClick={() => {
                    if (settings.mode === mode) {
                        if (mode === "preset") {
                            setShowPresetInput(true);
                        } else {
                            generateTest();
                        }
                    }
                    else updateSettings({ mode });
                  }}
                  className="px-3 py-1 transition hover:opacity-75"
                  style={{ color: settings.mode === mode ? theme.buttonSelected : theme.buttonUnselected }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Row: Mode-specific options */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {settings.mode === "preset" ? (
               <div className="flex gap-2">
                  {(["finish", "time"] as const).map((type) => (
                    <button
                        type="button"
                        key={type}
                        onClick={() => updateSettings({ presetModeType: type })}
                        className="px-3 py-1 transition hover:opacity-75"
                        style={{ color: settings.presetModeType === type ? theme.buttonSelected : theme.buttonUnselected }}
                    >
                        {type}
                    </button>
                  ))}
               </div>
            ) : (
                /* Difficulty/Quote Length selector */
                <div className="flex gap-2">
                {settings.mode === "quote" ? (
                    (["all", "short", "medium", "long", "xl"] as QuoteLength[]).map((len) => (
                    <button
                        type="button"
                        key={len}
                        onClick={() => {
                        if (settings.quoteLength === len) generateTest();
                        else updateSettings({ quoteLength: len });
                        }}
                        className="px-3 py-1 transition hover:opacity-75"
                        style={{ color: settings.quoteLength === len ? theme.buttonSelected : theme.buttonUnselected }}
                    >
                        {len}
                    </button>
                    ))
                ) : (
                    (["beginner", "easy", "medium", "hard", "extreme"] as Difficulty[]).map((diff) => (
                    <button
                        type="button"
                        key={diff}
                        onClick={() => {
                        if (settings.difficulty === diff) generateTest();
                        else updateSettings({ difficulty: diff });
                        }}
                        className="px-3 py-1 transition hover:opacity-75"
                        style={{ color: settings.difficulty === diff ? theme.buttonSelected : theme.buttonUnselected }}
                    >
                        {diff === "extreme" ? "expert" : diff}
                    </button>
                    ))
                )}
                </div>
            )}

            {/* Separator and Presets (only if needed) */}
            {(settings.mode === "time" || settings.mode === "words" || (settings.mode === "preset" && settings.presetModeType === "time")) && (
              <>
                <div className="mx-2 h-6 w-px bg-gray-700" />

                {/* Time/Word presets */}
                {(settings.mode === "time" || (settings.mode === "preset" && settings.presetModeType === "time")) && (
                  <div className="flex gap-2">
                    {TIME_PRESETS.map((duration) => (
                      <button
                        type="button"
                        key={duration}
                        onClick={() => {
                          if (settings.duration === duration) generateTest();
                          else updateSettings({ duration });
                        }}
                        className="px-2 py-1 transition hover:opacity-75"
                        style={{ color: settings.duration === duration ? theme.buttonSelected : theme.buttonUnselected }}
                      >
                        {duration}
                      </button>
                    ))}
                  </div>
                )}

                {settings.mode === "words" && (
                  <div className="flex gap-2">
                    {WORD_PRESETS.map((wordTarget) => (
                      <button
                        type="button"
                        key={wordTarget}
                        onClick={() => {
                          if (settings.wordTarget === wordTarget) generateTest();
                          else updateSettings({ wordTarget });
                        }}
                        className="px-2 py-1 transition hover:opacity-75"
                        style={{ color: settings.wordTarget === wordTarget ? theme.buttonSelected : theme.buttonUnselected }}
                      >
                        {wordTarget}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Live stats (moved to top) */}
      {isRunning && !isFinished && settings.mode !== "zen" && (
        <div className="fixed top-[20%] left-0 w-full flex justify-center gap-6 text-xl text-yellow-500 font-medium">
          <div>
            {Math.round(wpm)} <span className="text-sm text-gray-500">wpm</span>
          </div>
          <div>
            {Math.round(accuracy)}% <span className="text-sm text-gray-500">acc</span>
          </div>
          {(settings.mode === "time" || (settings.mode === "preset" && settings.presetModeType === "time")) && (
            <div>
              {Math.max(0, settings.duration - Math.floor(elapsedMs / 1000))}s
            </div>
          )}
        </div>
      )}

      {/* Quote Info */}
      {settings.mode === "quote" && currentQuote && !isFinished && (
        <div className="mb-8 flex flex-col items-center text-center animate-fade-in">
          <div className="text-xl font-medium text-yellow-500">{currentQuote.author}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-400">{currentQuote.source}, {currentQuote.date}</span>
            <div className="group relative">
              <div className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-gray-600 text-[10px] text-gray-500 hover:border-yellow-500 hover:text-yellow-500">
                i
              </div>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 mb-2 w-48 -translate-x-1/2 scale-0 rounded bg-gray-800 p-2 text-xs text-gray-300 opacity-0 shadow-lg transition-all group-hover:scale-100 group-hover:opacity-100">
                {currentQuote.context}
                <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-800"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Typing area */}
      <div className="w-[80%] max-w-none">
        {!isFinished ? (
          <div className="relative">
            <input
              ref={inputRef}
              name="typing-test-input"
              type="text"
              value={typedText}
              onChange={(e) => handleInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              data-lpignore="true"
              className="absolute left-0 top-0 -z-10 opacity-0"
            />

            <div
              ref={containerRef}
              className="cursor-text font-mono overflow-hidden relative"
              style={{
                fontSize: `${settings.typingFontSize}rem`,
                lineHeight: LINE_HEIGHT,
                maxHeight: `${linePreview * settings.typingFontSize * LINE_HEIGHT}rem`,
                textAlign: settings.textAlign,
              }}
              onClick={() => inputRef.current?.focus()}
            >
              <div
                style={{ transform: `translateY(-${scrollOffset}px)`, transition: 'transform 0.2s ease-out' }}
                className=""
              >
                {wordArray.reduce<{ nodes: React.ReactNode[]; currentIndex: number }>(
                  (acc, word, wordIdx) => {
                    const wordStartIndex = acc.currentIndex;
                    const typedWord = typedArray[wordIdx] || "";
                    const isCurrentWord = wordIdx === currentWordIndex;
                    const isPastWord = wordIdx < currentWordIndex;

                    const wordNode = (
                      <span
                        key={wordIdx}
                        ref={isCurrentWord ? activeWordRef : null}
                        className="inline-block mr-[0.5em] relative"
                      >
                        {word.split("").map((char, charIdx) => {
                          const globalCharIndex = wordStartIndex + charIdx;
                          const typedChar = typedWord[charIdx];
                          const isTyped = typedChar !== undefined;
                          const isCorrect = typedChar === char;
                          const isCursor = isCurrentWord && charIdx === typedWord.length;
                          const isUpcoming = isCursor;
                          const isGhost = settings.ghostWriterEnabled && Math.floor(ghostCharIndex) === globalCharIndex;

                          let charColor = theme.defaultText;
                          if (!isTyped) {
                            if (isPastWord) charColor = theme.incorrectText;
                            else if (isUpcoming) charColor = theme.upcomingText;
                          } else {
                            charColor = isCorrect ? theme.correctText : theme.incorrectText;
                          }

                          return (
                            <span
                              key={charIdx}
                              className="relative"
                              style={{ color: charColor }}
                            >
                              {char}
                              {isCursor && (
                                <span
                                  className="absolute left-0 top-0 h-full w-0.5 animate-pulse"
                                  style={{ backgroundColor: theme.cursor }}
                                />
                              )}
                              {isGhost && (
                                <span
                                  className="absolute left-0 top-0 h-full w-0.5 opacity-70"
                                  style={{ backgroundColor: theme.ghostCursor }}
                                />
                              )}
                            </span>
                          );
                        })}
                        {/* Extra characters typed */}
                        {(isCurrentWord || isPastWord) && typedWord.length > word.length && (
                          <span style={{ color: theme.incorrectText }}>
                            {typedWord.slice(word.length)}
                          </span>
                        )}
                        {/* Cursor at end of word */}
                        {isCurrentWord && typedWord.length === word.length && (
                          <span className="relative">
                            <span
                              className="absolute left-0 top-0 h-full w-0.5 animate-pulse"
                              style={{ backgroundColor: theme.cursor }}
                            />
                          </span>
                        )}
                        {/* Ghost Cursor at end of word (space) */}
                        {settings.ghostWriterEnabled && Math.floor(ghostCharIndex) === wordStartIndex + word.length && (
                          <span className="relative">
                            <span
                              className="absolute left-0 top-0 h-full w-0.5 opacity-70"
                              style={{ backgroundColor: theme.ghostCursor }}
                            />
                          </span>
                        )}
                      </span>
                    );

                    acc.nodes.push(wordNode);
                    acc.currentIndex += word.length + 1; // +1 for space
                    return acc;
                  },
                  { nodes: [], currentIndex: 0 }
                ).nodes}
              </div>
            </div>
          </div>
        ) : (
          // Results screen
          <div className="space-y-8 text-center">
            <div className="space-y-4">
              {/* Row 1: WPM and Accuracy */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-[#2c2e31] p-8">
                  <div className="text-6xl font-bold text-yellow-500">{Math.round(wpm)}</div>
                  <div className="mt-2 text-xl text-gray-500">wpm</div>
                </div>
                <div className="rounded-lg bg-[#2c2e31] p-8">
                  <div className="text-6xl font-bold text-yellow-500">{Math.round(accuracy)}%</div>
                  <div className="mt-2 text-xl text-gray-500">accuracy</div>
                </div>
              </div>

              {/* Row 2: Character Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="rounded-lg bg-[#2c2e31] p-4">
                  <div className="text-2xl font-bold text-gray-200">{stats.correct}</div>
                  <div className="mt-1 text-sm text-gray-500">correct</div>
                </div>
                <div className="rounded-lg bg-[#2c2e31] p-4">
                  <div className="text-2xl font-bold text-red-500">{stats.incorrect}</div>
                  <div className="mt-1 text-sm text-gray-500">incorrect</div>
                </div>
                <div className="rounded-lg bg-[#2c2e31] p-4">
                  <div className="text-2xl font-bold text-gray-400">{stats.missed}</div>
                  <div className="mt-1 text-sm text-gray-500">missed</div>
                </div>
                <div className="rounded-lg bg-[#2c2e31] p-4">
                  <div className="text-2xl font-bold text-gray-400">{stats.extra}</div>
                  <div className="mt-1 text-sm text-gray-500">extra</div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => generateTest()}
              className="mt-8 rounded px-6 py-2 text-sm text-gray-400 transition hover:text-gray-200"
            >
              next test
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      {!isRunning && !isFinished && (
        <div
          className={`fixed bottom-[15%] left-0 w-full text-center text-gray-600 transition-opacity duration-300 ${settings.mode === "zen" && isZenUIHidden ? "opacity-0" : "opacity-100"}`}
          style={{ fontSize: `${settings.helpFontSize}rem` }}
        >
          {isRepeated && (
            <div className="mb-2 text-red-500 font-medium">REPEATED</div>
          )}
          <div>Click on the text area and start typing</div>
          <div className="mt-1">Press Tab + Shift to restart</div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-[#2c2e31] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-200">Settings</h2>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Line Preview Setting */}
              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Lines to Preview
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => setLinePreview(num)}
                      className={`rounded px-4 py-2 text-sm transition ${linePreview === num
                        ? "bg-yellow-500 text-gray-900"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Number of lines of text visible while typing
                </p>
              </div>
            </div>

            {/* Font Size Settings */}
            <div className="space-y-4 border-t border-gray-700 pt-4">
              <h3 className="text-sm font-medium text-gray-200">Appearance</h3>

              {/* Typing Text Size */}
              <div>
                <label className="mb-2 block text-xs text-gray-400">
                  Typing Text Size (rem)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.1"
                  value={settings.typingFontSize}
                  onChange={(e) => updateSettings({ typingFontSize: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded bg-gray-700 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              {/* Text Alignment */}
              <div>
                <label className="mb-2 block text-xs text-gray-400">
                  Text Alignment
                </label>
                <div className="flex gap-2">
                  {(["left", "center", "right", "justify"] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() => updateSettings({ textAlign: align })}
                      className={`rounded px-3 py-1 text-sm capitalize transition ${settings.textAlign === align
                        ? "bg-yellow-500 text-gray-900"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                    >
                      {align}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Size */}
              <div>
                <label className="mb-2 block text-xs text-gray-400">
                  Menu Icon Size
                </label>
                <div className="flex gap-2">
                  {[
                    { label: "xs", value: 0.75 },
                    { label: "s", value: 1 },
                    { label: "m", value: 1.25 },
                    { label: "l", value: 1.5 },
                    { label: "xl", value: 2 },
                  ].map(({ label, value }) => (
                    <button
                      key={label}
                      onClick={() => updateSettings({ iconFontSize: value })}
                      className={`rounded px-3 py-1 text-sm transition ${settings.iconFontSize === value
                        ? "bg-yellow-500 text-gray-900"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Help Text Size */}
              <div>
                <label className="mb-2 block text-xs text-gray-400">
                  Help Text Size (rem)
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="5"
                  step="0.1"
                  value={settings.helpFontSize}
                  onChange={(e) => updateSettings({ helpFontSize: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded bg-gray-700 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              {/* Ghost Writer Speed */}
              <div>
                <label className="mb-2 block text-xs text-gray-400">
                  Ghost Writer Speed (WPM)
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  step="5"
                  value={settings.ghostWriterSpeed}
                  onChange={(e) => updateSettings({ ghostWriterSpeed: parseInt(e.target.value) || 0 })}
                  className="w-full rounded bg-gray-700 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Theme Modal */}
      {showThemeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowThemeModal(false)}
        >
          <div
            className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-lg bg-[#2c2e31] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-200">Customize Theme</h2>
              <button
                type="button"
                onClick={() => setShowThemeModal(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {[
                { key: "backgroundColor", label: "Background Color" },
                { key: "cursor", label: "Cursor Color" },
                { key: "ghostCursor", label: "Ghost Cursor Color" },
                { key: "defaultText", label: "Default Text Color" },
                { key: "upcomingText", label: "Upcoming Text Color" },
                { key: "correctText", label: "Correct Text Color" },
                { key: "incorrectText", label: "Incorrect Text Color" },
                { key: "buttonUnselected", label: "Button Unselected" },
                { key: "buttonSelected", label: "Button Selected" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <label className="text-sm text-gray-400">{label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme[key as keyof Theme]}
                      onChange={(e) => setTheme((prev) => ({ ...prev, [key]: e.target.value }))}
                      className="h-8 w-14 cursor-pointer rounded bg-transparent p-0"
                    />
                    <button
                      type="button"
                      onClick={() => setTheme((prev) => ({ ...prev, [key]: DEFAULT_THEME[key as keyof Theme] }))}
                      className="text-xs text-gray-500 hover:text-gray-300"
                      title="Reset to default"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setTheme(DEFAULT_THEME)}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Reset All Defaults
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Preset Input Modal */}
      {showPresetInput && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => {
             // If no text is set and they click away, maybe go back to previous mode?
             // For simplicity, we just close it if there is text, otherwise we might want to force a mode change or stay open.
             if (settings.presetText) {
                setShowPresetInput(false);
             } else {
                 // If cancelled without text, maybe revert mode?
                 // For now, just close. generateTest will handle empty text by showing it again if needed.
                 // Better: switch to default mode if cancelling initial setup?
                 // Let's just close for now.
                 setShowPresetInput(false);
                 if (!settings.presetText) {
                     updateSettings({ mode: "time" }); // Fallback
                 }
             }
          }}
        >
          <div
            className="w-full max-w-2xl rounded-lg bg-[#2c2e31] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-200">Custom Text</h2>
              <button
                type="button"
                onClick={() => {
                     setShowPresetInput(false);
                     if (!settings.presetText) {
                         updateSettings({ mode: "time" });
                     }
                }}
                className="text-gray-400 hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Paste your text
                </label>
                <textarea
                  className="w-full h-48 rounded bg-gray-700 p-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono text-sm"
                  placeholder="Paste your text here..."
                  onChange={(e) => setTempPresetText(e.target.value)}
                  value={tempPresetText}
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-gray-700" />
                <span className="text-sm text-gray-500">OR</span>
                <div className="h-px flex-1 bg-gray-700" />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Upload text file (.txt)
                </label>
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:rounded file:border-0 file:bg-gray-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-gray-200 hover:file:bg-gray-600"
                />
              </div>
              
              <div className="flex justify-end pt-4">
                 <button
                    type="button"
                    onClick={() => {
                        if (tempPresetText) {
                            handlePresetSubmit(tempPresetText);
                            // generateTest will be triggered by dependency on settings.presetText or we can call it explicitly?
                            // handlePresetSubmit updates settings.presetText.
                            // generateTest depends on settings.presetText.
                            // So it should trigger automatically.
                        }
                    }}
                    disabled={!tempPresetText}
                    className={`px-6 py-2 rounded font-medium transition ${
                        tempPresetText 
                        ? "bg-yellow-500 text-gray-900 hover:opacity-90" 
                        : "bg-gray-700 text-gray-500 cursor-not-allowed"
                    }`}
                 >
                    Start
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
