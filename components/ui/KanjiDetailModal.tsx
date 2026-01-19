"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useKanji } from "@/lib/hooks/useKanji";
import { useTheme } from "@/lib/providers/ThemeProvider";

interface KanjiDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  kanjiId: string;
}

export function KanjiDetailModal({ isOpen, onClose, kanjiId }: KanjiDetailModalProps) {
  const { data: kanji, isLoading } = useKanji(kanjiId);
  const { colors } = useTheme();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-background rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto border border-border"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-card-bg transition z-10"
          >
            <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4 animate-pulse text-foreground">学</div>
              <p className="text-muted">Loading...</p>
            </div>
          ) : !kanji ? (
            <div className="p-8 text-center">
              <p className="text-muted">Kanji not found</p>
            </div>
          ) : (
            <div className="p-6">
              {/* Kanji Hero */}
              <div className="text-center mb-6">
                <div className="text-8xl mb-4 text-foreground">{kanji.character}</div>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <span
                    className="px-3 py-1 rounded-full text-sm font-bold"
                    style={{
                      backgroundColor: colors.primary,
                      color: colors.isDark ? '#FFFFFF' : '#FFFFFF'
                    }}
                  >
                    {kanji.kanjiData.jlptLevel}
                  </span>
                  {kanji.kanjiData.grade !== 0 && (
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-card-bg text-foreground border border-border">
                      Grade {kanji.kanjiData.grade}
                    </span>
                  )}
                  {kanji.strokeCount !== 0 && (
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-card-bg text-foreground border border-border">
                      {kanji.strokeCount} strokes
                    </span>
                  )}
                </div>
              </div>

              {/* Meanings */}
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">
                  Meanings
                </h3>
                <div className="flex flex-wrap gap-2">
                  {kanji.kanjiData.meanings.map((meaning, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-full font-medium text-sm bg-card-bg text-foreground border border-border"
                    >
                      {meaning.charAt(0).toUpperCase() + meaning.slice(1)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Readings */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">
                    On&apos;yomi
                  </h3>
                  <div className="space-y-1">
                    {kanji.kanjiData.readings.onyomi.length > 0 ? (
                      kanji.kanjiData.readings.onyomi.map((reading, i) => (
                        <div
                          key={i}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-card-bg text-foreground border border-border"
                        >
                          {reading}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted">None</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">
                    Kun&apos;yomi
                  </h3>
                  <div className="space-y-1">
                    {kanji.kanjiData.readings.kunyomi.length > 0 ? (
                      kanji.kanjiData.readings.kunyomi.map((reading, i) => (
                        <div
                          key={i}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-card-bg text-foreground border border-border"
                        >
                          {reading}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted">None</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Example Words (first 4) */}
              {kanji.kanjiData.exampleWords && kanji.kanjiData.exampleWords.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">
                    Example Words
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {kanji.kanjiData.exampleWords.slice(0, 4).map((word, i) => (
                      <div key={i} className="bg-card-bg rounded-lg p-3 border border-border">
                        <div className="text-lg font-bold text-foreground">{word.word}</div>
                        <div className="text-xs text-muted">{word.reading}</div>
                        <div className="text-sm text-foreground">{word.meaning}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* View Full Details Link */}
              <div className="pt-4 border-t border-border">
                <Link
                  href={`/kanji/${kanjiId}`}
                  className="block w-full text-center px-4 py-3 rounded-xl font-semibold transition hover:opacity-90"
                  style={{
                    backgroundColor: colors.primary,
                    color: colors.isDark ? '#FFFFFF' : '#FFFFFF'
                  }}
                  onClick={onClose}
                >
                  View Full Details
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
