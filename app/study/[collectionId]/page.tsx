"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  useCollection,
  useCollectionCharacters,
} from "@/lib/hooks/useCollections";
import { useStudyStore } from "@/lib/stores/studyStore";
import { KanjiData } from "@/types";

type AnswerResult = "correct" | "incorrect" | null;

interface MultipleChoiceOption {
  meaning: string;
  isCorrect: boolean;
}

export default function StudyPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.collectionId as string;

  // React Query
  const { data: collection } = useCollection(collectionId);
  const { data: characterData, isLoading: loading } =
    useCollectionCharacters(collectionId);

  // Zustand
  const {
    currentIndex,
    characters,
    kanjiData,
    sessionStats,
    startSession,
    nextCharacter,
    recordAnswer: recordAnswerInStore,
    resetSession,
  } = useStudyStore();

  const currentCharacter = characters[currentIndex];
  const currentKanjiData = currentCharacter
    ? kanjiData[currentCharacter.id]
    : null;

  const [flipped, setFlipped] = useState(false);
  const [answerResult, setAnswerResult] = useState<AnswerResult>(null);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(
    null
  );
  const [shuffleMode, setShuffleMode] = useState(false);

  // Determine study mode from collection
  const studyMode = collection?.studyMode || "flashcard";

  // Generate multiple choice options
  const multipleChoiceOptions = useMemo(() => {
    if (studyMode !== "multiple_choice" || !currentKanjiData || !kanjiData) {
      return [];
    }

    const correctMeaning = currentKanjiData.meanings[0] || "";

    // Get other meanings from other kanji in the collection
    const otherMeanings: string[] = [];
    const kanjiDataValues = Object.values(kanjiData) as KanjiData[];

    for (const kd of kanjiDataValues) {
      if (kd.characterId !== currentCharacter?.id && kd.meanings.length > 0) {
        otherMeanings.push(kd.meanings[0]);
      }
      if (otherMeanings.length >= 10) break; // Get enough options to choose from
    }

    // Shuffle and pick 3 wrong answers
    const shuffledWrong = otherMeanings
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    // Create options array with correct answer
    const options: MultipleChoiceOption[] = [
      { meaning: correctMeaning, isCorrect: true },
      ...shuffledWrong.map((m) => ({ meaning: m, isCorrect: false })),
    ];

    // Shuffle all options
    return options.sort(() => Math.random() - 0.5);
  }, [studyMode, currentKanjiData, kanjiData, currentCharacter?.id]);

  // Load collection data and start session
  useEffect(() => {
    if (characterData && !loading) {
      const chars = shuffleMode
        ? [...characterData.characters].sort(() => Math.random() - 0.5)
        : characterData.characters;

      startSession(collectionId, chars, characterData.kanjiData);
    }
  }, [characterData, loading, collectionId, startSession, shuffleMode]);

  // Handle card flip
  const handleFlip = useCallback(() => {
    if (!flipped && !answerResult) {
      setFlipped(true);
    }
  }, [flipped, answerResult]);

  // Handle answer (for flashcard mode)
  const handleAnswer = useCallback(
    async (isCorrect: boolean) => {
      if (!currentCharacter || answerResult) return;

      setAnswerResult(isCorrect ? "correct" : "incorrect");

      // Record answer in store
      recordAnswerInStore(isCorrect);

      // Wait a moment before moving to next card
      setTimeout(() => {
        const nextIndex = currentIndex + 1;

        if (nextIndex >= characters.length) {
          // Session complete
          setSessionComplete(true);
        } else {
          // Move to next card
          nextCharacter();
          setFlipped(false);
          setAnswerResult(null);
        }
      }, 1000);
    },
    [
      currentCharacter,
      currentIndex,
      characters.length,
      answerResult,
      nextCharacter,
      recordAnswerInStore,
    ]
  );

  // Handle multiple choice selection
  const handleMultipleChoiceSelect = useCallback(
    (optionIndex: number) => {
      if (!currentCharacter || answerResult || selectedOptionIndex !== null)
        return;

      const selectedOption = multipleChoiceOptions[optionIndex];
      if (!selectedOption) return;

      setSelectedOptionIndex(optionIndex);
      const isCorrect = selectedOption.isCorrect;
      setAnswerResult(isCorrect ? "correct" : "incorrect");

      // Record answer in store
      recordAnswerInStore(isCorrect);

      // Wait a moment before moving to next card
      setTimeout(() => {
        const nextIndex = currentIndex + 1;

        if (nextIndex >= characters.length) {
          // Session complete
          setSessionComplete(true);
        } else {
          // Move to next card
          nextCharacter();
          setAnswerResult(null);
          setSelectedOptionIndex(null);
        }
      }, 1500);
    },
    [
      currentCharacter,
      currentIndex,
      characters.length,
      answerResult,
      selectedOptionIndex,
      multipleChoiceOptions,
      nextCharacter,
      recordAnswerInStore,
    ]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (sessionComplete) return;

      if (studyMode === "multiple_choice") {
        // Multiple choice: 1-4 to select options
        if (!answerResult && selectedOptionIndex === null) {
          const keyNum = parseInt(e.key);
          if (keyNum >= 1 && keyNum <= 4) {
            e.preventDefault();
            handleMultipleChoiceSelect(keyNum - 1);
          }
        }
      } else {
        // Flashcard mode
        if (e.key === " " && !flipped) {
          e.preventDefault();
          handleFlip();
        } else if (flipped && !answerResult) {
          if (e.key === "1") {
            handleAnswer(false);
          } else if (e.key === "2") {
            handleAnswer(true);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    flipped,
    answerResult,
    sessionComplete,
    studyMode,
    selectedOptionIndex,
    handleFlip,
    handleAnswer,
    handleMultipleChoiceSelect,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">学</div>
          <p className="text-gray-600">Loading study session...</p>
        </div>
      </div>
    );
  }

  if (!collection || characters.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Collection not found or empty</p>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    const accuracy =
      sessionStats.total > 0
        ? Math.round((sessionStats.correct / sessionStats.total) * 100)
        : 0;

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Session Complete!
            </h1>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-6">🎉</div>

            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              Great job studying {collection.name}!
            </h2>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-gray-900">
                  {sessionStats.total}
                </div>
                <div className="text-sm text-gray-600">Cards Studied</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-green-600">
                  {sessionStats.correct}
                </div>
                <div className="text-sm text-gray-600">Correct</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-red-600">
                  {sessionStats.incorrect}
                </div>
                <div className="text-sm text-gray-600">Incorrect</div>
              </div>
            </div>

            <div className="mb-8">
              <div className="text-sm text-gray-600 mb-2">Accuracy</div>
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {accuracy}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${accuracy}%` }}
                />
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.push("/")}>Go Home</Button>
              <Button
                variant="primary"
                onClick={() => {
                  setSessionComplete(false);
                  if (characterData) {
                    const chars = shuffleMode
                      ? [...characterData.characters].sort(
                          () => Math.random() - 0.5
                        )
                      : characterData.characters;

                    startSession(collectionId, chars, characterData.kanjiData);
                  }
                }}
              >
                Study Again
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-700 text-sm mb-1 inline-block"
              >
                End Session
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                {collection.name}
              </h1>
            </div>
            <div className="flex items-start gap-4">
              {studyMode === "multiple_choice" && (
                <button
                  onClick={() => setShuffleMode(!shuffleMode)}
                  title="Toggle random order"
                  className="text-sm text-gray-600"
                >
                  {shuffleMode ? "Shuffle" : "In Order"}
                </button>
              )}
              <div className="text-right">
                <div className="text-sm text-gray-600">Progress</div>
                <div className="text-lg font-semibold">
                  {currentIndex + 1} / {characters.length}
                </div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / characters.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </header>

      {/* Study Content */}
      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="max-w-2xl mx-auto h-[calc(100vh-220px)] flex flex-col">
          {studyMode === "multiple_choice" ? (
            // Multiple Choice Mode
            <>
              {/* Kanji Card */}
              <div
                className={`
                  relative bg-white rounded-2xl flex-1 max-h-[300px]
                  transition-all duration-500
                  ${answerResult === "correct" ? "ring-4 ring-green-500" : ""}
                  ${answerResult === "incorrect" ? "ring-4 ring-red-500" : ""}
                `}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-8">
                  <div className="text-gray-700 text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold">
                    {currentCharacter?.character}
                  </div>
                  <p className="text-gray-500 text-sm mt-4">
                    What does this kanji mean?
                  </p>
                </div>
              </div>

              {/* Multiple Choice Options */}
              <div className="mt-4 md:mt-6 grid grid-cols-2 gap-3">
                {multipleChoiceOptions.map((option, index) => {
                  const isSelected = selectedOptionIndex === index;
                  const showCorrect = answerResult && option.isCorrect;
                  const showIncorrect =
                    isSelected && answerResult === "incorrect";

                  let buttonClass =
                    "bg-white border-2 border-gray-200 text-gray-900 hover:bg-gray-50";
                  if (showCorrect) {
                    buttonClass =
                      "bg-green-100 border-2 border-green-500 text-green-900";
                  } else if (showIncorrect) {
                    buttonClass =
                      "bg-red-100 border-2 border-red-500 text-red-900";
                  } else if (isSelected) {
                    buttonClass =
                      "bg-blue-100 border-2 border-blue-500 text-blue-900";
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleMultipleChoiceSelect(index)}
                      disabled={answerResult !== null}
                      className={`
                        p-4 md:p-6 rounded-xl transition-all duration-200 text-left
                        disabled:cursor-default
                        ${buttonClass}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-500 w-6">
                          {index + 1}.
                        </span>
                        <span className="capitalize text-base md:text-lg font-medium">
                          {option.meaning}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Hint for keyboard shortcuts */}
              {!answerResult && (
                <p className="text-center text-sm text-gray-500 mt-4">
                  Press 1-4 to select an answer
                </p>
              )}
            </>
          ) : (
            // Flashcard Mode
            <>
              {/* Card */}
              <div
                className={`
                  relative bg-white rounded-2xl cursor-pointer flex-1 max-h-[600px]
                  transition-all duration-500
                  ${answerResult === "correct" ? "ring-4 ring-green-500" : ""}
                  ${answerResult === "incorrect" ? "ring-4 ring-red-500" : ""}
                `}
                onClick={handleFlip}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-8">
                  {!flipped ? (
                    // Front: Kanji character
                    <div className="text-center">
                      <div className="text-gray-700 text-6xl sm:text-7xl md:text-8xl lg:text-9xl mb-4 md:mb-8 font-bold">
                        {currentCharacter?.character}
                      </div>
                      <p className="text-gray-500 text-sm">
                        Tap or press Space to reveal
                      </p>
                    </div>
                  ) : (
                    // Back: Meanings and readings
                    <div className="text-center w-full overflow-y-auto">
                      <div className="text-4xl sm:text-5xl md:text-6xl mb-4 md:mb-6 font-bold text-gray-400">
                        {currentCharacter?.character}
                      </div>

                      {/* Meanings */}
                      <div className="mb-4 md:mb-6">
                        <h3 className="text-sm capitalize font-semibold text-gray-600 mb-2">
                          Meanings
                        </h3>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {currentKanjiData?.meanings.map((meaning, i) => (
                            <span
                              key={i}
                              className="capitalize px-3 py-1.5 md:px-4 md:py-2 bg-blue-100 text-blue-800 rounded-lg text-base md:text-lg"
                            >
                              {meaning}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Readings */}
                      <div className="grid grid-cols-2 gap-4 mb-4 md:mb-6">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-600 mb-1">
                            On'yomi
                          </h4>
                          <div className="text-sm text-gray-700">
                            {currentKanjiData?.readings.onyomi.join(", ") ||
                              "None"}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-gray-600 mb-1">
                            Kun'yomi
                          </h4>
                          <div className="text-sm text-gray-700">
                            {currentKanjiData?.readings.kunyomi.join(", ") ||
                              "None"}
                          </div>
                        </div>
                      </div>

                      {/* JLPT Level */}
                      <div className="text-xs text-gray-500">
                        {currentKanjiData?.jlptLevel} • Grade{" "}
                        {currentKanjiData?.grade}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Answer buttons */}
              {flipped && !answerResult && (
                <div className="mt-4 md:mt-6 grid grid-cols-2 gap-3 md:gap-4">
                  <Button
                    variant="danger"
                    size="lg"
                    onClick={() => handleAnswer(false)}
                    className="py-4 md:py-6"
                  >
                    <div className="text-center">
                      <div className="text-sm md:text-base">Incorrect</div>
                      <div className="text-xs opacity-75">Press 1</div>
                    </div>
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => handleAnswer(true)}
                    className="py-4 md:py-6"
                  >
                    <div className="text-center">
                      <div className="text-sm md:text-base">Correct</div>
                      <div className="text-xs opacity-75">Press 2</div>
                    </div>
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Session stats */}
          <div className="mt-8 flex justify-center gap-8 text-sm text-gray-600">
            <div className="capitalize">
              <span className="font-semibold text-green-600">
                {sessionStats.correct}
              </span>{" "}
              correct
            </div>
            <div className="capitalize">
              <span className="capitalize font-semibold text-red-600">
                {sessionStats.incorrect}
              </span>{" "}
              incorrect
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
