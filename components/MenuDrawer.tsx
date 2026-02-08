"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/providers/AuthProvider";
import { useTheme, ThemeColor, ThemeMode } from "@/lib/providers/ThemeProvider";

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MenuDrawer({ isOpen, onClose }: MenuDrawerProps) {
  const { user, signOut } = useAuth();
  const { themeColor, themeMode, setThemeColor, toggleThemeMode } = useTheme();

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when drawer is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const colors: { value: ThemeColor; label: string; colorValue: string }[] = [
    { value: "neutral", label: "Neutral", colorValue: themeMode === "light" ? "#1a1a1a" : "#FFFFFF" },
    { value: "blue", label: "Ocean Blue", colorValue: "#3B82F6" },
    { value: "red", label: "Sunset Red", colorValue: "#EF4444" },
    { value: "green", label: "Forest Green", colorValue: "#22C55E" },
    { value: "orange", label: "Vibrant Orange", colorValue: "#FF6B35" },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-background border-r border-border z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Menu</h2>
            <button
              onClick={onClose}
              className="text-muted hover:text-foreground transition-colors"
              aria-label="Close menu"
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-6 py-4 overflow-y-auto">
            <div className="space-y-1">
              <Link
                href="/"
                onClick={onClose}
                className="block px-4 py-3 rounded-lg text-foreground hover:bg-card-bg transition-colors"
              >
                Home
              </Link>
              <Link
                href="/collections/manage"
                onClick={onClose}
                className="block px-4 py-3 rounded-lg text-foreground hover:bg-card-bg transition-colors"
              >
                My Collections
              </Link>
              <Link
                href="/kanji-grid"
                onClick={onClose}
                className="block px-4 py-3 rounded-lg text-foreground hover:bg-card-bg transition-colors"
              >
                Browse Kanji
              </Link>
              <Link
                href="/vocab"
                onClick={onClose}
                className="block px-4 py-3 rounded-lg text-foreground hover:bg-card-bg transition-colors"
              >
                Browse Vocab
              </Link>
              {user && (
                <Link
                  href="/stats"
                  onClick={onClose}
                  className="block px-4 py-3 rounded-lg text-foreground hover:bg-card-bg transition-colors"
                >
                  Stats
                </Link>
              )}
              <Link
                href="/settings"
                onClick={onClose}
                className="block px-4 py-3 rounded-lg text-foreground hover:bg-card-bg transition-colors"
              >
                Settings
              </Link>
            </div>

            {/* Theme Selector */}
            <div className="mt-8">
              <h3 className="text-xs uppercase font-semibold text-muted mb-3 px-4">
                Theme
              </h3>

              {/* Light/Dark Toggle */}
              <div className="mb-3">
                <button
                  onClick={toggleThemeMode}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-card-bg hover:bg-card-bg/80 transition-colors"
                >
                  <span className="text-sm font-medium text-foreground">
                    {themeMode === "light" ? "Light Mode" : "Dark Mode"}
                  </span>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {themeMode === "light" ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      )}
                    </svg>
                  </div>
                </button>
              </div>

              {/* Color Options */}
              <div className="space-y-1">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setThemeColor(color.value)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      themeColor === color.value
                        ? "bg-card-bg text-foreground"
                        : "text-muted hover:bg-card-bg hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-5 h-5 rounded-full border border-gray-300"
                        style={{ backgroundColor: color.colorValue }}
                      />
                      <span>{color.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </nav>

          {/* User Section */}
          {user && (
            <div className="px-6 py-4 border-t border-border">
              <div className="flex items-center gap-3 mb-3">
                {user.user_metadata?.avatar_url && (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="User avatar"
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.user_metadata?.full_name || "User"}
                  </p>
                  <p className="text-xs text-muted truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  signOut();
                  onClose();
                }}
                className="w-full px-4 py-2 text-sm text-muted hover:text-foreground text-left"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
