"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useNoun } from "@/lib/hooks/useNouns";
import { useTheme } from "@/lib/providers/ThemeProvider";
import MinimalHeader from "@/components/MinimalHeader";
import MenuDrawer from "@/components/MenuDrawer";
import { useNavigationList } from "@/lib/hooks/useNavigationList";
import DetailNavigationArrows from "@/components/DetailNavigationArrows";

export default function NounDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const { data: noun, isLoading, error } = useNoun(id);
  const { hasPrev, hasNext, goToPrev, goToNext } = useNavigationList("nouns", id);
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
          <div className="text-6xl mb-4 animate-pulse text-[var(--accent)]">名</div>
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !noun) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center bg-card-bg rounded-3xl p-8 shadow-xl max-w-md mx-4 border border-border">
          <p className="text-muted mb-4">Noun not found</p>
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

      {/* Main Content - Single Card */}
      <main className="flex items-center justify-center px-4 pt-20 pb-4" style={{ minHeight: '100vh' }}>
        <div className="bg-card-bg rounded-3xl p-6 lg:p-10 shadow-xl border border-border max-w-4xl w-full min-h-[80vh] max-h-[90vh] overflow-y-auto flex flex-col justify-evenly relative">
          {/* Large Noun Word */}
          <div className="text-center mb-3 lg:mb-6">
            <div className="text-[6rem] lg:text-[10rem] leading-none font-medium text-foreground mb-2">
              {noun.word}
            </div>
          </div>

          {/* Main Meaning and Info */}
          <div className="mb-4 lg:mb-8 flex flex-col justify-between gap-3">
            <div>
              <h1 className="text-2xl lg:text-4xl font-bold text-foreground mb-2 lg:mb-4">
                {noun.meaning.charAt(0).toUpperCase() + noun.meaning.slice(1)}
              </h1>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 lg:px-4 lg:py-1.5 bg-[var(--accent)] text-[var(--accent-text)] rounded-full text-xs lg:text-sm font-bold">
                  {noun.jlpt_level || 'N5'}
                </span>
                <span className="px-3 py-1 lg:px-4 lg:py-1.5 bg-[var(--accent)]/10 text-[var(--accent)] rounded-full text-xs lg:text-sm font-bold">
                  Noun
                </span>
              </div>
            </div>

            {/* Readings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-5">
              {/* Hiragana Reading */}
              <div>
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">
                  Reading
                </h3>
                <div className="flex flex-wrap gap-2 lg:gap-3">
                  <span className="px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg text-base font-medium bg-card-bg text-foreground border border-border">
                    {noun.reading}
                  </span>
                </div>
              </div>

              {/* Romaji */}
              {noun.romaji && (
                <div>
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">
                    Romaji
                  </h3>
                  <div className="flex flex-wrap gap-2 lg:gap-3">
                    <span className="px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg text-base font-medium bg-card-bg text-foreground border border-border">
                      {noun.romaji.charAt(0).toUpperCase() + noun.romaji.slice(1)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Example Sentences */}
          <div className="space-y-2 lg:space-y-4">
            {noun.example_sentences && noun.example_sentences.length > 0 ? (
              noun.example_sentences.map((sentence, i) => (
                <div key={i} className="border-l-4 border-[var(--accent)] pl-3 lg:pl-5 py-1 lg:py-2">
                  <p className="text-foreground font-medium text-sm lg:text-lg mb-0.5">
                    {sentence.japanese}
                  </p>
                  {sentence.reading && (
                    <p className="text-xs lg:text-sm text-muted mb-0.5">
                      {sentence.reading}
                    </p>
                  )}
                  {sentence.translation && (
                    <p className="text-xs lg:text-base text-muted">
                      {sentence.translation.charAt(0).toUpperCase() + sentence.translation.slice(1)}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted text-sm lg:text-base">No example sentences available yet.</p>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={() => router.back()}
            className="absolute bottom-6 right-6 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-[var(--accent)] flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
          >
            <svg className="w-5 h-5 lg:w-6 lg:h-6 text-[var(--accent-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </main>

      <DetailNavigationArrows
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPrev={goToPrev}
        onNext={goToNext}
      />
    </div>
  );
}
