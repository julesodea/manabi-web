"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme, ThemeColor } from "@/lib/providers/ThemeProvider";
import { useAuth } from "@/lib/providers/AuthProvider";

const colorOptions: { color: ThemeColor; name: string; description: string; colorValue: string }[] =
  [
    {
      color: "neutral",
      name: "Neutral",
      description: "Classic black and white",
      colorValue: "#1a1a1a",
    },
    {
      color: "blue",
      name: "Ocean Blue",
      description: "Calm and professional",
      colorValue: "#3B82F6",
    },
    {
      color: "red",
      name: "Sunset Red",
      description: "Warm and energetic",
      colorValue: "#EF4444",
    },
    {
      color: "green",
      name: "Forest Green",
      description: "Fresh and natural",
      colorValue: "#22C55E",
    },
    {
      color: "orange",
      name: "Vibrant Orange",
      description: "Bold and creative",
      colorValue: "#FF6B35",
    },
  ];

export default function SettingsPage() {
  const { themeColor, themeMode, setThemeColor, setThemeMode, colors } = useTheme();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleColorChange = (color: ThemeColor) => {
    setThemeColor(color);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleModeChange = (mode: "light" | "dark") => {
    setThemeMode(mode);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 duration-300 border-b border-border ${scrolled ? "py-3" : "py-4"}`}
        style={{
          backgroundColor: colors.background,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-card-bg rounded-lg flex items-center justify-center text-foreground font-bold">
                  学
                </div>
                <span className="text-foreground text-xl font-bold tracking-tight hidden sm:block">
                  Manabi
                </span>
              </Link>
              <div className="hidden sm:block h-6 w-px bg-border" />
              <h1 className="text-lg font-semibold text-foreground hidden sm:block">
                Settings
              </h1>
            </div>

            <Link
              href="/"
              className="px-4 py-2 text-foreground border border-border rounded-full text-sm font-medium hover:bg-card-bg transition"
            >
              Back
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pt-24 pb-20">
        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p className="text-green-800 font-medium">
              Theme updated successfully!
            </p>
          </div>
        )}

        {/* Account Section */}
        {user && (
          <div className="mb-8 bg-card-bg rounded-xl p-6 border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-4">Account</h2>
            <div className="flex items-center gap-4">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Profile"
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              )}
              <div>
                <p className="text-lg font-semibold text-foreground">
                  {user.user_metadata?.name ||
                    user.user_metadata?.full_name ||
                    user.user_metadata?.preferred_username ||
                    "User"}
                </p>
                <p className="text-muted">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Theme Customization */}
        <div className="bg-card-bg rounded-xl p-6 border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-2">Theme</h2>
          <p className="text-muted mb-6">
            Customize your app&apos;s appearance
          </p>

          {/* Light/Dark Mode Toggle */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">Appearance</h3>
            <div className="flex gap-3">
              <button
                onClick={() => handleModeChange("light")}
                className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all font-medium ${
                  themeMode === "light"
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-border text-foreground hover:bg-background"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Light
                </div>
              </button>
              <button
                onClick={() => handleModeChange("dark")}
                className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all font-medium ${
                  themeMode === "dark"
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-border text-foreground hover:bg-background"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  Dark
                </div>
              </button>
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Accent Color</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {colorOptions.map((option) => (
                <button
                  key={option.color}
                  onClick={() => handleColorChange(option.color)}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                    themeColor === option.color
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-muted bg-background"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-8 h-8 rounded-full shadow-md flex items-center justify-center"
                      style={{ backgroundColor: option.colorValue }}
                    >
                      <span className="text-lg font-bold" style={{ color: "#FFFFFF" }}>学</span>
                    </div>
                    {themeColor === option.color && (
                      <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={3}
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <h4 className="font-semibold text-foreground text-sm mb-0.5">{option.name}</h4>
                  <p className="text-xs text-muted">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 bg-background rounded-xl border border-border">
            <p className="text-sm text-muted">
              <span className="font-semibold">Note:</span> Your theme preference
              is saved locally and will persist across sessions.
            </p>
          </div>
        </div>

        {/* Preview Section */}
        <div className="mt-8 bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Preview</h2>
          <div className="space-y-4">
            {/* Preview Button */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Primary Button</p>
              <button
                className="px-6 py-3 text-white rounded-full font-semibold shadow-lg"
                style={{
                  backgroundColor: colors.primary,
                }}
              >
                Start Learning
              </button>
            </div>

            {/* Preview Card */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Collection Card</p>
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 max-w-xs">
                <div
                  className="aspect-[4/3] flex items-center justify-center p-6"
                  style={{
                    backgroundColor: colors.primary,
                  }}
                >
                  <span className="text-6xl font-bold text-white/90 drop-shadow-lg">
                    漢
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 text-lg mb-1">
                    JLPT N5
                  </h3>
                  <p className="text-gray-600 text-sm">80 Kanji characters</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="grid grid-cols-5 h-16">
          <Link
            href="/"
            className="flex flex-col items-center justify-center gap-1 text-gray-500"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="text-xs font-medium">Home</span>
          </Link>

          <Link
            href="/collections/manage"
            className="flex flex-col items-center justify-center gap-1 text-gray-500"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <span className="text-xs font-medium">Collections</span>
          </Link>

          <button className="flex flex-col items-center justify-center relative">
            <Link
              href="/collections/create"
              className="absolute -top-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
              style={{
                backgroundColor: colors.primary,
              }}
            >
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </Link>
          </button>

          <Link
            href="/kanji-grid"
            className="flex flex-col items-center justify-center gap-1 text-gray-500"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="text-xs font-medium">Cards</span>
          </Link>

          <Link
            href="/settings"
            className="flex flex-col items-center justify-center gap-1"
            style={{ color: colors.primary }}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-xs font-medium">Settings</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
