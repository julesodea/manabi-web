"use client";

import { useEffect, useRef, useCallback } from "react";

interface DetailNavigationArrowsProps {
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export default function DetailNavigationArrows({
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}: DetailNavigationArrowsProps) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;

      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      const SWIPE_THRESHOLD = 50;

      // Only trigger if horizontal swipe is dominant
      if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        if (deltaX > 0 && hasPrev) {
          onPrev();
        } else if (deltaX < 0 && hasNext) {
          onNext();
        }
      }

      touchStartX.current = null;
      touchStartY.current = null;
    },
    [hasPrev, hasNext, onPrev, onNext]
  );

  useEffect(() => {
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  if (!hasPrev && !hasNext) return null;

  return (
    <>
      {hasPrev && (
        <button
          onClick={onPrev}
          aria-label="Previous item"
          className="fixed left-3 top-1/2 -translate-y-1/2 z-40 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-[var(--accent)] flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 opacity-0 hover:opacity-100 focus:opacity-100"
        >
          <svg
            className="w-5 h-5 lg:w-6 lg:h-6 text-[var(--accent-text)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}

      {hasNext && (
        <button
          onClick={onNext}
          aria-label="Next item"
          className="fixed right-3 top-1/2 -translate-y-1/2 z-40 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-[var(--accent)] flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 opacity-0 hover:opacity-100 focus:opacity-100"
        >
          <svg
            className="w-5 h-5 lg:w-6 lg:h-6 text-[var(--accent-text)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}
    </>
  );
}
