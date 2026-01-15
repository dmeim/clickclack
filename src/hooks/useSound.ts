// src/hooks/useSound.ts
import { useRef, useCallback } from "react";
import { getRandomSoundUrl, type SoundManifest } from "@/lib/sounds";

export function useSound(soundManifest: SoundManifest | null) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = useCallback((category: string, pack: string) => {
    const url = getRandomSoundUrl(soundManifest, category, pack);
    if (!url) return;

    // Reuse or create audio element
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    audioRef.current.src = url;
    audioRef.current.volume = 0.5;
    audioRef.current.play().catch(() => {
      // Ignore autoplay errors
    });
  }, [soundManifest]);

  const playTypingSound = useCallback(
    (pack: string) => {
      playSound("typing", pack);
    },
    [playSound]
  );

  const playWarningSound = useCallback(
    (pack: string) => {
      playSound("warning", pack);
    },
    [playSound]
  );

  return { playTypingSound, playWarningSound, playSound };
}
