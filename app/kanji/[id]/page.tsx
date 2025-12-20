"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useKanji } from "@/lib/hooks/useKanji";

export default function KanjiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';
  const { data: kanji, isLoading, error } = useKanji(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">読</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !kanji) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Kanji not found</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
          >
            Back to Grid
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Kanji Display */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="text-center mb-6">
            <div className="text-9xl font-bold mb-4 text-gray-700">
              {kanji.character}
            </div>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                {kanji.kanjiData.jlptLevel}
              </span>
              <span>Grade {kanji.kanjiData.grade}</span>
              <span>{kanji.strokeCount} strokes</span>
            </div>
          </div>

          {/* Meanings */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-gray-900">
              Meanings
            </h2>
            <div className="flex flex-wrap gap-2">
              {kanji.kanjiData.meanings.map((meaning, i) => (
                <span
                  key={i}
                  className="px-4 py-2 bg-gray-100 rounded-lg text-gray-800"
                >
                  {meaning}
                </span>
              ))}
            </div>
          </div>

          {/* Readings */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold mb-2 text-gray-900">
                On&apos;yomi (音読み)
              </h3>
              <div className="space-y-1">
                {kanji.kanjiData.readings.onyomi.length > 0 ? (
                  kanji.kanjiData.readings.onyomi.map((reading, i) => (
                    <div key={i} className="text-lg text-gray-700">
                      {reading}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-700">None</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2 text-gray-900">
                Kun&apos;yomi (訓読み)
              </h3>
              <div className="space-y-1">
                {kanji.kanjiData.readings.kunyomi.length > 0 ? (
                  kanji.kanjiData.readings.kunyomi.map((reading, i) => (
                    <div key={i} className="text-lg text-gray-700">
                      {reading}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-700">None</p>
                )}
              </div>
            </div>
          </div>

          {/* Nanori */}
          {kanji.kanjiData.readings.nanori.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2 text-gray-900">
                Nanori (名乗り) - Name readings
              </h3>
              <div className="flex flex-wrap gap-2">
                {kanji.kanjiData.readings.nanori.map((reading, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-purple-100 text-purple-800 rounded"
                  >
                    {reading}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Example Words */}
          {kanji.kanjiData.exampleWords && kanji.kanjiData.exampleWords.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-gray-900">
                Example Words
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {kanji.kanjiData.exampleWords.map((word, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="text-2xl font-bold mb-1 text-gray-900">
                      {word.word}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      {word.reading}
                    </div>
                    <div className="text-gray-800">{word.meaning}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Example Sentences */}
          {kanji.kanjiData.exampleSentences && kanji.kanjiData.exampleSentences.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">
                Example Sentences
              </h2>
              <div className="space-y-4">
                {kanji.kanjiData.exampleSentences.map((sentence, i) => (
                  <div key={i} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="text-lg text-gray-700 mb-1">
                      {sentence.japanese}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      {sentence.reading}
                    </div>
                    <div className="text-gray-800">{sentence.translation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
