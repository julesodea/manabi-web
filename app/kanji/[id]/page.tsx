"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useKanji } from "@/lib/hooks/useKanji";

export default function KanjiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const { data: kanji, isLoading, error } = useKanji(id);
  const [scrolled, setScrolled] = useState(false);

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
      <div className="min-h-screen bg-gradient-to-r from-[#5B7FFF] to-[#4A6FEE] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse text-white">学</div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !kanji) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#5B7FFF] to-[#4A6FEE] flex items-center justify-center">
        <div className="text-center bg-white rounded-3xl p-8 shadow-2xl max-w-md mx-4">
          <p className="text-gray-600 mb-4">Kanji not found</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gradient-to-r from-[#5B7FFF] to-[#4A6FEE] text-white rounded-full font-semibold shadow-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#5B7FFF] to-[#4A6FEE] duration-300 ${
          scrolled ? "shadow-xl py-3" : "py-4 shadow-lg"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold">
                  学
                </div>
                <span className="text-white text-xl font-bold tracking-tight hidden sm:block">
                  Manabi
                </span>
              </Link>
              <div className="hidden sm:block h-6 w-px bg-white/30" />
              <span className="text-3xl hidden sm:block text-white">{kanji.character}</span>
            </div>

            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-white border border-white/30 rounded-full text-sm font-medium hover:bg-white/20 transition"
            >
              Back
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pt-24 pb-12">
        {/* Kanji Hero */}
        <div className="bg-white rounded-3xl p-8 mb-8 text-center shadow-xl border border-gray-100">
          <div className="text-9xl mb-6 text-gray-900 font-bold">{kanji.character}</div>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="px-4 py-1.5 bg-gradient-to-r from-[#5B7FFF] to-[#4A6FEE] text-white rounded-full text-sm font-bold shadow-md">
              {kanji.kanjiData.jlptLevel}
            </span>
            {kanji.kanjiData.grade !== 0 && (
              <span className="px-4 py-1.5 bg-[#E8ECFF] text-[#4A6FEE] rounded-full text-sm font-semibold">
                Grade {kanji.kanjiData.grade}
              </span>
            )}
            {kanji.strokeCount !== 0 && (
              <span className="px-4 py-1.5 bg-[#E8ECFF] text-[#4A6FEE] rounded-full text-sm font-semibold">
                {kanji.strokeCount} strokes
              </span>
            )}
          </div>
        </div>

        {/* Meanings */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Meanings</h2>
          <div className="flex flex-wrap gap-2">
            {kanji.kanjiData.meanings.map((meaning, i) => (
              <span
                key={i}
                className="px-4 py-2 bg-[#E8ECFF] text-[#5B7FFF] rounded-full font-medium"
              >
                {meaning.charAt(0).toUpperCase() + meaning.slice(1)}
              </span>
            ))}
          </div>
        </div>

        {/* Readings */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-3 text-lg">
              On&apos;yomi (音読み)
            </h3>
            <div className="space-y-2">
              {kanji.kanjiData.readings.onyomi.length > 0 ? (
                kanji.kanjiData.readings.onyomi.map((reading, i) => (
                  <div
                    key={i}
                    className="text-lg text-gray-700 bg-[#E8ECFF] px-4 py-2.5 rounded-xl font-medium"
                  >
                    {reading}
                  </div>
                ))
              ) : (
                <p className="text-gray-500">None</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-3 text-lg">
              Kun&apos;yomi (訓読み)
            </h3>
            <div className="space-y-2">
              {kanji.kanjiData.readings.kunyomi.length > 0 ? (
                kanji.kanjiData.readings.kunyomi.map((reading, i) => (
                  <div
                    key={i}
                    className="text-lg text-gray-700 bg-[#E8ECFF] px-4 py-2.5 rounded-xl font-medium"
                  >
                    {reading}
                  </div>
                ))
              ) : (
                <p className="text-gray-500">None</p>
              )}
            </div>
          </div>
        </div>

        {/* Nanori */}
        {kanji.kanjiData.readings.nanori.length > 0 && (
          <div className="mb-8 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-3 text-lg">
              Nanori (名乗り) - Name readings
            </h3>
            <div className="flex flex-wrap gap-2">
              {kanji.kanjiData.readings.nanori.map((reading, i) => (
                <span
                  key={i}
                  className="px-4 py-2 bg-[#E8ECFF] text-[#4A6FEE] rounded-full font-medium"
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
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Example Words
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {kanji.kanjiData.exampleWords.map((word, i) => (
                  <div
                    key={i}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                  >
                    <div className="text-2xl font-bold mb-1 text-gray-900">
                      {word.word}
                    </div>
                    <div className="text-sm text-gray-500 mb-1">
                      {word.reading}
                    </div>
                    <div className="text-gray-700">{word.meaning}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Example Sentences */}
        {kanji.kanjiData.exampleSentences &&
          kanji.kanjiData.exampleSentences.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Example Sentences
              </h2>
              <div className="space-y-4">
                {kanji.kanjiData.exampleSentences.map((sentence, i) => (
                  <div
                    key={i}
                    className="bg-gray-50 rounded-xl p-4 border-l-4 border-[#5B7FFF]"
                  >
                    <div className="text-lg text-gray-800 mb-1">
                      {sentence.japanese}
                    </div>
                    <div className="text-sm text-gray-500 mb-1">
                      {sentence.reading}
                    </div>
                    <div className="text-gray-700">{sentence.translation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </main>
    </div>
  );
}
