"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/providers/AuthProvider";

interface MinimalHeaderProps {
  onMenuClick?: () => void;
  showMenu?: boolean;
  menuOpen?: boolean;
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
  menuOpen = false,
  showBack = false,
  onBackClick,
  title,
  progress,
  rightContent,
}: MinimalHeaderProps) {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed z-50 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] max-w-[calc(80rem-2rem)] transition-all duration-300"
      style={{ top: scrolled ? "1rem" : "0.5rem", opacity: menuOpen ? 0 : 1, pointerEvents: menuOpen ? "none" : "auto" }}
    >
      <div
        className="flex items-center justify-between px-5 py-3 rounded-2xl border transition-all duration-300"
        style={{
          background: scrolled ? "color-mix(in srgb, var(--background) 80%, transparent)" : "transparent",
          backdropFilter: scrolled ? "blur(24px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(24px)" : "none",
          borderColor: scrolled ? "var(--border)" : "transparent",
          boxShadow: scrolled ? "0 10px 15px -3px rgb(0 0 0 / 0.05)" : "none",
        }}
      >
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
            <div className="w-8 h-8 bg-[var(--accent)] rounded-full flex items-center justify-center font-bold text-base relative overflow-hidden">
              <span className="text-[var(--accent-text)] relative z-10">学</span>
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

        {/* Right side - Custom content, Progress counter, Login, or spacer */}
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
        ) : !user ? (
          <Link
            href="/login"
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-accent text-accent-text hover:opacity-90 transition-opacity"
          >
            Sign in
          </Link>
        ) : (
          <div className="w-10" />
        )}
      </div>
    </header>
  );
}
