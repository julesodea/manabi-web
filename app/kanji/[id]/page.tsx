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
      />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pt-24 pb-12">
        {/* Kanji Hero */}
        <div className="bg-card-bg rounded-3xl p-8 mb-8 text-center shadow-lg border border-border">
          <div className="text-9xl mb-6 text-foreground">{kanji.character}</div>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="px-4 py-1.5 bg-[var(--accent)] text-[var(--accent-text)] rounded-full text-sm font-bold shadow-md">
              {kanji.kanjiData.jlptLevel}
            </span>
            {kanji.kanjiData.grade !== 0 && (
              <span className="px-4 py-1.5 bg-[var(--accent)]/10 text-[var(--accent)] rounded-full text-sm font-semibold">
                Grade {kanji.kanjiData.grade}
              </span>
            )}
            {kanji.strokeCount !== 0 && (
              <span className="px-4 py-1.5 bg-[var(--accent)]/10 text-[var(--accent)] rounded-full text-sm font-semibold">
                {kanji.strokeCount} strokes
              </span>
            )}
          </div>
        </div>

        {/* Meanings */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">Meanings</h2>
          <div className="flex flex-wrap gap-2">
            {kanji.kanjiData.meanings.map((meaning, i) => (
              <span
                key={i}
                className="px-4 py-2 bg-[var(--accent)]/10 text-[var(--accent)] rounded-full font-medium"
              >
                {meaning.charAt(0).toUpperCase() + meaning.slice(1)}
              </span>
            ))}
          </div>
        </div>

        {/* Readings */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-card-bg rounded-2xl p-6 shadow-md border border-border">
            <h3 className="font-bold text-foreground mb-3 text-lg">
              On&apos;yomi (音読み)
            </h3>
            <div className="space-y-2">
              {kanji.kanjiData.readings.onyomi.length > 0 ? (
                kanji.kanjiData.readings.onyomi.map((reading, i) => (
                  <div
                    key={i}
                    className="text-lg px-4 py-2.5 rounded-xl font-medium bg-[var(--accent)]/10 text-[var(--accent)]"
                  >
                    {reading}
                  </div>
                ))
              ) : (
                <p className="text-muted">None</p>
              )}
            </div>
          </div>

          <div className="bg-card-bg rounded-2xl p-6 shadow-md border border-border">
            <h3 className="font-bold text-foreground mb-3 text-lg">
              Kun&apos;yomi (訓読み)
            </h3>
            <div className="space-y-2">
              {kanji.kanjiData.readings.kunyomi.length > 0 ? (
                kanji.kanjiData.readings.kunyomi.map((reading, i) => (
                  <div
                    key={i}
                    className="text-lg px-4 py-2.5 rounded-xl font-medium bg-[var(--accent)]/10 text-[var(--accent)]"
                  >
                    {reading}
                  </div>
                ))
              ) : (
                <p className="text-muted">None</p>
              )}
            </div>
          </div>
        </div>

        {/* Nanori */}
        {kanji.kanjiData.readings.nanori.length > 0 && (
          <div className="mb-8 bg-card-bg rounded-2xl p-6 shadow-md border border-border">
            <h3 className="font-bold text-foreground mb-3 text-lg">
              Nanori (名乗り) - Name readings
            </h3>
            <div className="flex flex-wrap gap-2">
              {kanji.kanjiData.readings.nanori.map((reading, i) => (
                <span
                  key={i}
                  className="px-4 py-2 rounded-full font-medium bg-[var(--accent)]/10 text-[var(--accent)]"
                >
                  {reading}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Example Words */}
        {kanji.kanjiData.exampleWords &&
          kanji.kanjiData.exampleWords.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Example Words
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {kanji.kanjiData.exampleWords.map((word, i) => (
                  <div
                    key={i}
                    className="bg-card-bg rounded-xl p-4 border border-border shadow-sm"
                  >
                    <div className="text-2xl font-bold mb-1 text-foreground">
                      {word.word}
                    </div>
                    <div className="text-sm text-muted mb-1">
                      {word.reading}
                    </div>
                    <div className="text-foreground">{word.meaning}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Example Sentences */}
        {kanji.kanjiData.exampleSentences &&
          kanji.kanjiData.exampleSentences.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">
                Example Sentences
              </h2>
              <div className="space-y-4">
                {kanji.kanjiData.exampleSentences.map((sentence, i) => (
                  <div
                    key={i}
                    className="bg-card-bg rounded-xl p-4 border-l-4 border-[var(--accent)] shadow-sm"
                  >
                    <div className="text-lg text-foreground mb-1">
                      {sentence.japanese}
                    </div>
                    <div className="text-sm text-muted mb-1">
                      {sentence.reading}
                    </div>
                    <div className="text-foreground">{sentence.translation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </main>
    </div>
  );
}
