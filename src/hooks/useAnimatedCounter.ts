import { useEffect, useRef, useState } from "react";

/**
 * Hook that animates a number from 0 to target value.
 * Returns the current animated value as a rounded integer.
 */
export function useAnimatedCounter(
  target: number,
  duration = 1200,
  delay = 0
): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Clean up any previous animation
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    if (target === 0) {
      // Use rAF to avoid synchronous setState in effect body
      rafRef.current = requestAnimationFrame(() => setValue(0));
      return;
    }

    const timeout = setTimeout(() => {
      startTimeRef.current = null;

      const step = (timestamp: number) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp;
        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step);
        }
      };

      rafRef.current = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, delay]);

  return value;
}
