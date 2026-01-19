"use client";

import Link from "next/link";

interface MinimalHeaderProps {
  onMenuClick?: () => void;
  showMenu?: boolean;
  showBack?: boolean;
  onBackClick?: () => void;
  title?: string;
  progress?: {
    current: number;
    total: number;
  };
  rightContent?: React.ReactNode;
}

export default function MinimalHeader({
  onMenuClick,
  showMenu = false,
  showBack = false,
  onBackClick,
  title,
  progress,
  rightContent,
}: MinimalHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)] border-b border-[var(--border)]">
      <div className="flex items-center justify-between px-4 py-4">
        {/* Left side - Menu or Back button */}
        <div className="flex items-center gap-3">
          {showMenu && (
            <button
              onClick={onMenuClick}
              className="text-[var(--foreground)] hover:text-[var(--muted)] transition-colors"
              aria-label="Open menu"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}
          {showBack && (
            <button
              onClick={onBackClick}
              className="text-[var(--foreground)] hover:text-[var(--muted)] transition-colors"
              aria-label="Go back"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
          )}

          {/* Logo and App Name */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-[var(--accent)] rounded-full flex items-center justify-center text-[var(--accent-text)] font-bold text-base">
              学
            </div>
            <span className="text-lg font-bold text-[var(--foreground)] tracking-tight">
              Manabi
            </span>
          </Link>
        </div>

        {/* Center - Title (optional) */}
        {title && (
          <div className="flex-1 text-center px-4">
            <h1 className="text-base font-medium text-[var(--foreground)]">{title}</h1>
          </div>
        )}
        {!title && !rightContent && <div className="flex-1" />}

        {/* Right side - Custom content, Progress counter, or spacer */}
        {rightContent ? (
          <div>{rightContent}</div>
        ) : progress ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">
              {progress.current}/{progress.total}
            </span>
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "var(--accent)" }}
            />
          </div>
        ) : (
          <div className="w-10" />
        )}
      </div>
    </header>
  );
}
