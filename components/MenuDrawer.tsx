"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/providers/AuthProvider";
import { useTheme, ThemeColor } from "@/lib/providers/ThemeProvider";

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  href: string;
  label: string;
  jp: string;
  authOnly?: boolean;
}

export default function MenuDrawer({ isOpen, onClose }: MenuDrawerProps) {
  const { user, signOut } = useAuth();
  const { themeColor, themeMode, setThemeColor, toggleThemeMode } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const navItems: NavItem[] = [
    { href: "/", label: "Home", jp: "ホーム" },
    { href: "/collections/manage", label: "My collections", jp: "コレクション" },
    { href: "/kanji-grid", label: "Browse kanji", jp: "漢字" },
    { href: "/vocab", label: "Browse vocab", jp: "語彙" },
    { href: "/stats", label: "Stats", jp: "統計", authOnly: true },
    { href: "/settings", label: "Settings", jp: "設定" },
  ];

  const visibleNav = navItems.filter((n) => !n.authOnly || user);

  const colors: { value: ThemeColor; label: string; colorValue: string }[] = [
    {
      value: "neutral",
      label: "Ink",
      colorValue: themeMode === "light" ? "#1a1a1a" : "#FFFFFF",
    },
    { value: "blue", label: "Indigo", colorValue: "#3B82F6" },
    { value: "red", label: "Vermilion", colorValue: "#EF4444" },
    { value: "green", label: "Matcha", colorValue: "#22C55E" },
    { value: "orange", label: "Persimmon", colorValue: "#FF6B35" },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  return (
    <>
      {/* Backdrop - always mounted for smooth fade */}
      <div
        onClick={onClose}
        aria-hidden={!isOpen}
        className={`fixed inset-0 z-40 bg-foreground/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <aside
        aria-hidden={!isOpen}
        className={`fixed top-0 left-0 h-full w-[88vw] max-w-90 bg-background border-r border-border z-50 shadow-[8px_0_40px_-12px_rgba(0,0,0,0.15)] transform transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Decorative vertical kanji on right edge */}
        <div
          aria-hidden
          className="absolute right-3 top-1/2 -translate-y-1/2 text-9xl font-black text-foreground opacity-[0.04] leading-none tracking-tighter pointer-events-none select-none [writing-mode:vertical-rl]"
        >
          学習
        </div>

        <div className="relative flex flex-col h-full">
          {/* Brand row */}
          <header className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-border">
            <Link
              href="/"
              onClick={onClose}
              className="group flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-md bg-foreground text-background grid place-items-center font-black text-lg leading-none">
                学
              </div>
              <div className="leading-tight">
                <div className="text-sm font-bold text-foreground tracking-tight">
                  Manabi
                </div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-muted">
                  学習 · menu
                </div>
              </div>
            </Link>
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="w-9 h-9 grid place-items-center rounded-full border border-border text-muted hover:text-foreground hover:border-foreground/30 transition-all duration-200 hover:-translate-y-px active:translate-y-0 active:scale-95"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </header>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-5">
            <div className="flex items-center gap-3 px-3 mb-3">
              <span className="text-[10px] uppercase tracking-[0.22em] text-muted font-mono">
                navigation
              </span>
              <span className="flex-1 h-px bg-border" />
            </div>

            <ul className="flex flex-col">
              {visibleNav.map((item, i) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`group relative flex items-center gap-4 px-3 py-3 rounded-xl transition-colors duration-200 ${
                        active
                          ? "bg-card-bg text-foreground"
                          : "text-foreground/80 hover:bg-card-bg hover:text-foreground"
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full bg-[var(--accent)]" />
                      )}
                      <span className="font-mono text-[11px] text-muted w-6 tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1 font-medium text-[15px] tracking-tight">
                        {item.label}
                      </span>
                      <span className="text-xs text-muted opacity-60">
                        {item.jp}
                      </span>
                      <span
                        className={`font-mono text-sm transition-all duration-200 ${
                          active
                            ? "text-[var(--accent)] opacity-100"
                            : "text-muted opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"
                        }`}
                      >
                        →
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Theme block */}
            <div className="mt-8 pt-6 border-t border-border">
              <div className="flex items-center gap-3 px-3 mb-4">
                <span className="text-[10px] uppercase tracking-[0.22em] text-muted font-mono">
                  appearance · 配色
                </span>
                <span className="flex-1 h-px bg-border" />
              </div>

              {/* Segmented light/dark */}
              <div className="px-3 mb-5">
                <div className="relative grid grid-cols-2 p-1 rounded-xl bg-card-bg border border-border h-11">
                  <span
                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-foreground transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      themeMode === "dark"
                        ? "translate-x-[calc(100%+4px)]"
                        : "translate-x-0"
                    }`}
                  />
                  <button
                    onClick={() => themeMode === "dark" && toggleThemeMode()}
                    className={`relative z-10 flex items-center justify-center gap-2 text-[13px] font-semibold transition-colors duration-200 ${
                      themeMode === "light"
                        ? "text-background"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <circle cx="12" cy="12" r="4" />
                      <path
                        strokeLinecap="round"
                        d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21M5.6 5.6l1.06 1.06M17.34 17.34l1.06 1.06M5.6 18.4l1.06-1.06M17.34 6.66l1.06-1.06"
                      />
                    </svg>
                    Light
                  </button>
                  <button
                    onClick={() => themeMode === "light" && toggleThemeMode()}
                    className={`relative z-10 flex items-center justify-center gap-2 text-[13px] font-semibold transition-colors duration-200 ${
                      themeMode === "dark"
                        ? "text-background"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20.5 14.8A8.5 8.5 0 119.2 3.5 7 7 0 0020.5 14.8z"
                      />
                    </svg>
                    Dark
                  </button>
                </div>
              </div>

              {/* Color swatches */}
              <div className="px-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] text-muted">Accent</span>
                  <span className="text-[11px] font-mono text-muted capitalize">
                    {colors.find((c) => c.value === themeColor)?.label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {colors.map((color) => {
                    const active = themeColor === color.value;
                    return (
                      <button
                        key={color.value}
                        onClick={() => setThemeColor(color.value)}
                        aria-label={color.label}
                        className={`group relative w-6 h-6 rounded-full transition-all duration-200 ${
                          active
                            ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110"
                            : "hover:scale-110 active:scale-95"
                        }`}
                        style={{ backgroundColor: color.colorValue }}
                      >
                        {active && (
                          <span className="absolute inset-0 grid place-items-center">
                            <svg
                              className="w-3 h-3"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke={
                                color.value === "neutral" &&
                                themeMode === "light"
                                  ? "#FFFFFF"
                                  : color.value === "neutral"
                                    ? "#000000"
                                    : "#FFFFFF"
                              }
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </nav>

          {/* User footer */}
          <footer className="border-t border-border px-3 py-4">
            {user ? (
              <div className="flex items-center gap-3 px-3 py-2">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt=""
                    className="w-10 h-10 rounded-full ring-2 ring-border"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-foreground text-background grid place-items-center font-bold text-sm">
                    {(
                      user.user_metadata?.full_name ||
                      user.email ||
                      "·"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate tracking-tight">
                    {user.user_metadata?.full_name ||
                      user.email?.split("@")[0] ||
                      "Member"}
                  </p>
                  <p className="text-[11px] text-muted truncate font-mono">
                    {user.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    signOut();
                    onClose();
                  }}
                  aria-label="Sign out"
                  className="group shrink-0 w-9 h-9 grid place-items-center rounded-full border border-border text-muted hover:text-foreground hover:border-foreground/30 transition-all duration-200"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4M10 17l5-5-5-5M15 12H3"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={onClose}
                className="group flex items-center justify-between gap-3 px-5 h-12 rounded-2xl bg-foreground text-background font-semibold text-[14px] hover:-translate-y-px active:translate-y-0 active:scale-[0.985] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)]"
              >
                <span className="flex items-center gap-2">
                  Sign in
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-60">
                    ログイン
                  </span>
                </span>
                <span className="font-mono text-sm opacity-70 group-hover:translate-x-0.5 transition-transform">
                  →
                </span>
              </Link>
            )}
          </footer>
        </div>
      </aside>
    </>
  );
}
