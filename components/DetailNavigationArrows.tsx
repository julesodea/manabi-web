"use client";

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
