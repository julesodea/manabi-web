"use client";

import { useAuth } from "@/lib/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

const DRIFT_KANJI = [
  { ch: "漢", top: "8%",  left: "12%", size: 96,  delay: 0,  dur: 14 },
  { ch: "語", top: "22%", left: "78%", size: 64,  delay: 2,  dur: 18 },
  { ch: "読", top: "62%", left: "8%",  size: 80,  delay: 4,  dur: 16 },
  { ch: "書", top: "78%", left: "70%", size: 112, delay: 1,  dur: 20 },
  { ch: "話", top: "44%", left: "84%", size: 56,  delay: 3,  dur: 13 },
  { ch: "聞", top: "12%", left: "58%", size: 48,  delay: 5,  dur: 17 },
  { ch: "字", top: "88%", left: "32%", size: 72,  delay: 2.5, dur: 15 },
  { ch: "道", top: "52%", left: "44%", size: 40,  delay: 6,  dur: 19 },
];

const PROVERBS = [
  { jp: "毎日少しずつ。",       en: "A little, every day." },
  { jp: "一期一会。",           en: "One time, one meeting." },
  { jp: "七転び八起き。",       en: "Fall seven, rise eight." },
  { jp: "急がば回れ。",         en: "When in a hurry, take the long way." },
];

const MARQUEE = "学 · 道 · 心 · 言 · 書 · 読 · 聞 · 話 · 字 · 知 · 思 · 覚 ·";

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [proverbIdx, setProverbIdx] = useState(0);

  useEffect(() => {
    if (user && !loading) router.push("/");
  }, [user, loading, router]);

  useEffect(() => {
    const id = setInterval(
      () => setProverbIdx((i) => (i + 1) % PROVERBS.length),
      4200,
    );
    return () => clearInterval(id);
  }, []);

  const handleSignIn = async () => {
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div
          className="text-7xl text-foreground"
          style={{ animation: "breathe 1.6s ease-in-out infinite" }}
        >
          学
        </div>
      </div>
    );
  }

  const proverb = PROVERBS[proverbIdx];

  return (
    <div className="min-h-dvh grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] bg-background">
      {/* ───────── Left: kinetic study hall ───────── */}
      <aside className="relative overflow-hidden bg-foreground text-background min-h-[42vh] lg:min-h-dvh">
        {/* Drifting kanji field */}
        <div className="absolute inset-0 pointer-events-none select-none">
          {DRIFT_KANJI.map((k, i) => (
            <span
              key={i}
              className="absolute font-bold leading-none opacity-[0.08]"
              style={{
                top: k.top,
                left: k.left,
                fontSize: `${k.size}px`,
                animation: `drift ${k.dur}s ease-in-out ${k.delay}s infinite`,
                willChange: "transform",
              }}
            >
              {k.ch}
            </span>
          ))}
        </div>

        {/* Enso ring */}
        <div
          className="absolute -right-32 -top-32 w-105 h-105 rounded-full border border-background/10 pointer-events-none"
          style={{ animation: "ensoSpin 80s linear infinite" }}
        />
        <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full border border-background/15 pointer-events-none" />

        {/* Top bar */}
        <header className="relative z-10 flex items-center justify-between p-8 lg:p-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-background text-foreground grid place-items-center font-black">
              学
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">Manabi</div>
              <div className="text-[11px] uppercase tracking-[0.18em] opacity-60">
                study · 学習
              </div>
            </div>
          </div>
          <span
            className="hidden sm:inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] opacity-60"
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-background"
              style={{ animation: "breathe 2s ease-in-out infinite" }}
            />
            session ready
          </span>
        </header>

        {/* Editorial display */}
        <div className="relative z-10 px-8 lg:px-14 pt-4 lg:pt-12">
          <div className="flex items-start gap-6 lg:gap-10">
            <div
              className="text-[180px] sm:text-[240px] lg:text-[320px] leading-[0.78] font-black tracking-tighter"
              style={{ animation: "fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both" }}
            >
              学
            </div>
            <div
              className="hidden sm:flex flex-col gap-2 pt-3 lg:pt-6 [writing-mode:vertical-rl] text-2xl lg:text-3xl font-medium opacity-80"
              style={{ animation: "fadeUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both" }}
            >
              <span>学</span>
              <span>び</span>
              <span>を</span>
              <span>続</span>
              <span>け</span>
              <span>る</span>
            </div>
          </div>

          {/* Rotating proverb */}
          <div
            key={proverbIdx}
            className="mt-10 lg:mt-16 max-w-[28ch]"
            style={{ animation: "fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both" }}
          >
            <div className="text-2xl lg:text-3xl font-medium tracking-tight">
              {proverb.jp}
            </div>
            <div className="mt-2 text-sm opacity-60 italic">— {proverb.en}</div>
          </div>
        </div>

        {/* Bottom marquee */}
        <div className="absolute inset-x-0 bottom-0 z-10 border-t border-background/10 py-4 overflow-hidden">
          <div
            className="flex whitespace-nowrap text-lg font-medium opacity-50"
            style={{ animation: "marquee 38s linear infinite", willChange: "transform" }}
          >
            <span className="px-6">{MARQUEE}</span>
            <span className="px-6">{MARQUEE}</span>
            <span className="px-6">{MARQUEE}</span>
            <span className="px-6">{MARQUEE}</span>
          </div>
        </div>
      </aside>

      {/* ───────── Right: form panel ───────── */}
      <main className="relative flex items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
        <div
          className="w-full max-w-110"
          style={{ animation: "fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both" }}
        >
          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-8">
            <span className="text-[11px] uppercase tracking-[0.22em] text-muted">
              ログイン · sign in
            </span>
            <span className="flex-1 h-px bg-border" />
            <span className="font-mono text-[11px] text-muted">01 / 02</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter leading-[1.02] text-foreground">
            Begin your<br />
            study session<span className="text-accent">.</span>
          </h1>

          <p className="mt-5 text-base text-muted leading-relaxed max-w-[42ch]">
            2,136 jōyō kanji, every reading and stroke order, tracked across
            sessions. Sign in to keep your progress.
          </p>

          {/* Google button */}
          <div className="mt-10">
            <button
              onClick={handleSignIn}
              disabled={submitting}
              className="group relative w-full inline-flex items-center justify-center gap-3 px-6 h-14 rounded-2xl bg-foreground text-background font-semibold text-[15px] tracking-tight overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] disabled:opacity-60 disabled:cursor-wait shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)] hover:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.35)]"
            >
              {/* Sheen */}
              <span
                aria-hidden
                className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-linear-to-r from-transparent via-background/15 to-transparent"
              />
              {submitting ? (
                <span className="inline-flex items-center gap-3">
                  <span
                    className="w-2 h-2 rounded-full bg-background"
                    style={{ animation: "breathe 1.1s ease-in-out infinite" }}
                  />
                  <span>Connecting…</span>
                </span>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Continue with Google</span>
                  <span className="font-mono text-[11px] opacity-50 ml-auto">
                    ↵
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <span className="flex-1 h-px bg-border" />
            <span className="text-[11px] uppercase tracking-[0.22em] text-muted">
              or
            </span>
            <span className="flex-1 h-px bg-border" />
          </div>

          {/* Browse without account */}
          <Link
            href="/"
            className="group flex items-center justify-between w-full px-5 h-12 rounded-xl border border-border bg-card-bg text-foreground text-[14px] font-medium transition-all duration-200 hover:border-foreground/30 hover:-translate-y-px"
          >
            <span>Browse without an account</span>
            <span className="font-mono text-xs text-muted group-hover:text-foreground transition-colors">
              →
            </span>
          </Link>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-border flex items-center justify-between text-[11px] text-muted">
            <span className="font-mono uppercase tracking-[0.18em]">
              v3.0 · 学
            </span>
            <span className="flex items-center gap-4">
              <Link href="/" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link href="/" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
            </span>
          </div>
        </div>

        {/* Subtle ambient mark, bottom-right */}
        <div
          aria-hidden
          className="hidden lg:block absolute bottom-10 right-10 text-[11px] font-mono text-muted opacity-50"
        >
          jp · en · romaji
          <span
            className="ml-2 inline-block w-2 h-3 align-middle bg-foreground"
            style={{ animation: "blink 1.1s steps(1) infinite" }}
          />
        </div>
      </main>
    </div>
  );
}
