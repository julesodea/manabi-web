"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useKanji } from "@/lib/hooks/useKanji";
import { useTheme } from "@/lib/providers/ThemeProvider";
import MinimalHeader from "@/components/MinimalHeader";
import MenuDrawer from "@/components/MenuDrawer";

export default function KanjiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const { data: kanji, isLoading, error } = useKanji(id);
  const { colors } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Handle scroll for sticky header shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse text-[var(--accent)]">学</div>
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !kanji) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center bg-card-bg rounded-3xl p-8 shadow-xl max-w-md mx-4 border border-border">
          <p className="text-muted mb-4">Kanji not found</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-[var(--accent)] text-[var(--accent-text)] rounded-full font-semibold shadow-lg hover:shadow-xl transition-shadow"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Menu Drawer */}
      <MenuDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Minimal Header */}
      <MinimalHeader
        showMenu
        onMenuClick={() => setMenuOpen(true)}
        rightContent={
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--accent)]">
              •
            </span>
            <span className="text-lg font-bold text-foreground">
              {kanji.strokeCount !== 0 ? `${kanji.strokeCount}` : "?"}
            </span>
            <span className="text-xs text-muted">/500</span>
          </div>
        }
      />

      {/* Main Content - Single Card */}
      <main className="flex items-center justify-center px-4 py-4" style={{ minHeight: 'calc(100vh - 4rem)' }}>
        <div className="bg-card-bg rounded-3xl p-6 shadow-xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Large Kanji Character */}
          <div className="text-center mb-3">
            <div className="text-[8rem] leading-none font-medium text-foreground mb-2">
              {kanji.character}
            </div>
          </div>

          {/* Main Meaning and Info */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {kanji.kanjiData.meanings.map((m, i) => (
                <span key={i}>
                  {i > 0 && ", "}
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </span>
              ))}
            </h1>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-[var(--accent)] text-[var(--accent-text)] rounded-full text-xs font-bold">
                {kanji.kanjiData.jlptLevel}
              </span>
            </div>

            {/* Readings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              {/* On'yomi */}
              <div>
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">
                  On&apos;yomi
                </h3>
                <div className="flex flex-wrap gap-2">
                  {kanji.kanjiData.readings.onyomi.length > 0 ? (
                    kanji.kanjiData.readings.onyomi.map((reading, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-card-bg text-foreground border border-border"
                      >
                        {reading}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-muted">None</p>
                  )}
                </div>
              </div>

              {/* Kun'yomi */}
              <div>
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">
                  Kun&apos;yomi
                </h3>
                <div className="flex flex-wrap gap-2">
                  {kanji.kanjiData.readings.kunyomi.length > 0 ? (
                    kanji.kanjiData.readings.kunyomi.map((reading, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-card-bg text-foreground border border-border"
                      >
                        {reading}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-muted">None</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Example Sentences and Close Button */}
          <div className="flex gap-4">
            {/* Examples */}
            <div className="flex-1 space-y-2">
              {kanji.kanjiData.exampleWords && kanji.kanjiData.exampleWords.map((word, i) => (
                <div key={i} className="border-l-4 border-[var(--accent)] pl-3 py-1">
                  <p className="text-foreground font-medium text-sm mb-0.5">
                    {word.word}
                  </p>
                  <p className="text-xs text-muted">
                    {word.meaning.charAt(0).toUpperCase() + word.meaning.slice(1)}
                  </p>
                </div>
              ))}
              {kanji.kanjiData.exampleSentences && kanji.kanjiData.exampleSentences.map((sentence, i) => (
                <div key={i} className="border-l-4 border-[var(--accent)] pl-3 py-1">
                  <p className="text-foreground font-medium text-sm mb-0.5">
                    {sentence.japanese}
                  </p>
                  <p className="text-xs text-muted">
                    {sentence.translation.charAt(0).toUpperCase() + sentence.translation.slice(1)}
                  </p>
                </div>
              ))}
            </div>

            {/* Close Button */}
            <div className="flex items-end">
              <button
                onClick={() => router.back()}
                className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
              >
                <svg className="w-5 h-5 text-[var(--accent-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
