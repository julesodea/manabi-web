"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
    getIncorrectCharacters,
    incorrectCharacterIds,
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
  const [scrolled, setScrolled] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [inputResult, setInputResult] = useState<
    "correct" | "incorrect" | null
  >(null);

  // Handle scroll for sticky header shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
  }, [
    studyMode,
    currentKanjiData,
    kanjiData,
    currentCharacter?.id,
    sessionKey,
  ]);

  // Load collection data and start session
  useEffect(() => {
    if (characterData && !loading) {
      const chars = shuffleMode
        ? [...characterData.characters].sort(() => Math.random() - 0.5)
        : characterData.characters;

      startSession(collectionId, chars, characterData.kanjiData);
    }
  }, [characterData, loading, collectionId, startSession, shuffleMode]);

  // Check if user input matches any reading or meaning
  const checkUserInput = useCallback(
    (input: string): boolean => {
      if (!currentKanjiData || !input.trim()) return false;

      const normalizedInput = input.trim().toLowerCase();

      // Check against meanings
      const meaningMatch = currentKanjiData.meanings.some(
        (meaning) => meaning.toLowerCase() === normalizedInput
      );

      // Check against onyomi readings
      const onyomiMatch = currentKanjiData.readings.onyomi.some(
        (reading) => reading.toLowerCase() === normalizedInput
      );

      // Check against kunyomi readings
      const kunyomiMatch = currentKanjiData.readings.kunyomi.some(
        (reading) => reading.toLowerCase() === normalizedInput
      );

      return meaningMatch || onyomiMatch || kunyomiMatch;
    },
    [currentKanjiData]
  );

  // Handle input submission
  const handleInputSubmit = useCallback(() => {
    if (!currentCharacter || answerResult || !userInput.trim()) return;

    const isCorrect = checkUserInput(userInput);
    setInputResult(isCorrect ? "correct" : "incorrect");
    setAnswerResult(isCorrect ? "correct" : "incorrect");
    setFlipped(true);

    // Record answer in store
    recordAnswerInStore(isCorrect, currentCharacter.id);

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
        setInputResult(null);
        setUserInput("");
      }
    }, 2000);
  }, [
    currentCharacter,
    currentIndex,
    characters.length,
    answerResult,
    userInput,
    checkUserInput,
    nextCharacter,
    recordAnswerInStore,
  ]);

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
      recordAnswerInStore(isCorrect, currentCharacter.id);

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
      recordAnswerInStore(isCorrect, currentCharacter.id);

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
        // Flashcard mode with input
        if (e.key === "Enter" && !answerResult && userInput.trim()) {
          e.preventDefault();
          handleInputSubmit();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    answerResult,
    sessionComplete,
    studyMode,
    selectedOptionIndex,
    userInput,
    handleInputSubmit,
    handleMultipleChoiceSelect,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">学</div>
          <p className="text-gray-600">Loading study session...</p>
        </div>
      </div>
    );
  }

  if (!collection || characters.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Collection not found or empty</p>
          <Link
            href="/"
            className="px-6 py-2 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    const accuracy =
      sessionStats.total > 0
        ? Math.round((sessionStats.correct / sessionStats.total) * 100)
        : 0;

    const hasFailedCards = incorrectCharacterIds.length > 0;

    const handleRetryFailedCards = () => {
      setSessionComplete(false);
      setFlipped(false);
      setAnswerResult(null);
      setSelectedOptionIndex(null);
      setSessionKey((prev) => prev + 1); // Force regeneration of multiple choice options

      const failedChars = getIncorrectCharacters();

      // Keep the full kanjiData to generate proper multiple choice options
      startSession(collectionId, failedChars, kanjiData);
    };

    const handleCreateCollectionFromFailed = () => {
      const failedIds = incorrectCharacterIds.join(",");
      router.push(
        `/collections/create?characterIds=${encodeURIComponent(failedIds)}`
      );
    };

    return (
      <div className="min-h-screen bg-white">
        <header
          className={`fixed top-0 left-0 right-0 z-50 bg-white transition-all duration-300 ${
            scrolled ? "shadow-md py-3" : "py-4 border-b border-gray-100"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center text-white font-bold">
                  学
                </div>
                <span className="text-rose-500 text-xl font-bold tracking-tight hidden sm:block">
                  Manabi
                </span>
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 pt-24 pb-12">
          <div className="bg-gray-50 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-6">🎉</div>

            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              Great job studying {collection.name}!
            </h2>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="text-3xl font-bold text-gray-900">
                  {sessionStats.total}
                </div>
                <div className="text-sm text-gray-500">Cards Studied</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="text-3xl font-bold text-green-600">
                  {sessionStats.correct}
                </div>
                <div className="text-sm text-gray-500">Correct</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="text-3xl font-bold text-red-500">
                  {sessionStats.incorrect}
                </div>
                <div className="text-sm text-gray-500">Incorrect</div>
              </div>
            </div>

            <div className="mb-8">
              <div className="text-sm text-gray-500 mb-2">Accuracy</div>
              <div className="text-4xl font-bold text-rose-500 mb-2">
                {accuracy}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-rose-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${accuracy}%` }}
                />
              </div>
            </div>

            {hasFailedCards && (
              <div className="mb-8 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <p className="text-sm text-orange-800 mb-3">
                  You got {incorrectCharacterIds.length} card
                  {incorrectCharacterIds.length > 1 ? "s" : ""} wrong. Want to
                  practice them?
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <button
                    onClick={handleRetryFailedCards}
                    className="px-4 py-2 bg-orange-500 text-white rounded-full text-sm font-medium hover:bg-orange-600 transition"
                  >
                    Retry Failed Cards
                  </button>
                  <button
                    onClick={handleCreateCollectionFromFailed}
                    className="px-4 py-2 border border-orange-500 text-orange-700 rounded-full text-sm font-medium hover:bg-orange-50 transition"
                  >
                    Save as New Collection
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/"
                className="px-6 py-3 border border-gray-300 rounded-full font-medium hover:bg-gray-50 transition text-gray-700"
              >
                Go Home
              </Link>
              <button
                onClick={() => {
                  setSessionComplete(false);
                  setFlipped(false);
                  setAnswerResult(null);
                  setInputResult(null);
                  setUserInput("");
                  setSelectedOptionIndex(null);
                  setSessionKey((prev) => prev + 1);
                  if (characterData) {
                    const chars = shuffleMode
                      ? [...characterData.characters].sort(
                          () => Math.random() - 0.5
                        )
                      : characterData.characters;

                    startSession(collectionId, chars, characterData.kanjiData);
                  }
                }}
                className="px-6 py-3 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition"
              >
                Study Again
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-white transition-all duration-300 ${
          scrolled ? "shadow-md py-3" : "py-4 border-b border-gray-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center text-white font-bold">
                  学
                </div>
                <span className="text-rose-500 text-xl font-bold tracking-tight hidden sm:block">
                  Manabi
                </span>
              </Link>
              <div className="hidden sm:block h-6 w-px bg-gray-200" />
              <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">
                {collection.name}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {studyMode === "multiple_choice" && (
                <button
                  onClick={() => setShuffleMode(!shuffleMode)}
                  className="text-sm text-gray-600 hover:text-gray-900 transition"
                >
                  {shuffleMode ? "Shuffled" : "In Order"}
                </button>
              )}
              <div className="text-right">
                <div className="text-sm text-gray-500">Progress</div>
                <div className="text-lg font-semibold text-gray-900">
                  {currentIndex + 1} / {characters.length}
                </div>
              </div>
              <Link
                href="/"
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 transition"
              >
                End
              </Link>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-rose-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / characters.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </header>

      {/* Study Content */}
      <main className="max-w-2xl mx-auto px-4 pt-32 pb-8">
        <div className="h-[calc(100vh-200px)] flex flex-col">
          {studyMode === "multiple_choice" ? (
            // Multiple Choice Mode
            <>
              {/* Kanji Card */}
              <div
                className={`
                  relative bg-gray-50 rounded-2xl flex-1 max-h-[300px] border border-gray-100
                  transition-all duration-500
                  ${answerResult === "correct" ? "ring-4 ring-green-500" : ""}
                  ${answerResult === "incorrect" ? "ring-4 ring-red-500" : ""}
                `}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-8">
                  <div className="text-gray-800 text-6xl sm:text-7xl md:text-8xl lg:text-9xl">
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
                    "bg-white border border-gray-200 text-gray-900 hover:border-gray-300 hover:shadow-md";
                  if (showCorrect) {
                    buttonClass =
                      "bg-green-50 border-2 border-green-500 text-green-900";
                  } else if (showIncorrect) {
                    buttonClass =
                      "bg-red-50 border-2 border-red-500 text-red-900";
                  } else if (isSelected) {
                    buttonClass =
                      "bg-rose-50 border-2 border-rose-500 text-rose-900";
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
                        <span className="text-sm font-medium text-gray-400 w-6">
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
                <p className="text-center text-sm text-gray-400 mt-4">
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
                  relative bg-gray-50 rounded-2xl flex-1 max-h-[500px] border border-gray-100
                  transition-all duration-500
                  ${answerResult === "correct" ? "ring-4 ring-green-500" : ""}
                  ${answerResult === "incorrect" ? "ring-4 ring-red-500" : ""}
                `}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-8">
                  {!flipped ? (
                    // Front: Kanji character with input
                    <div className="text-center w-full">
                      <div className="text-gray-800 text-6xl sm:text-7xl md:text-8xl lg:text-9xl mb-6 md:mb-8">
                        {currentCharacter?.character}
                      </div>
                      <p className="text-gray-500 text-sm mb-4">
                        Type the reading or meaning
                      </p>
                      <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && userInput.trim()) {
                            handleInputSubmit();
                          }
                        }}
                        disabled={!!answerResult}
                        placeholder="Answer"
                        className="w-full max-w-xs px-4 py-2.5 border-2 border-gray-300 rounded-xl text-center text-base text-gray-900 placeholder:text-gray-400 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                      <p className="text-gray-400 text-xs mt-2">
                        Press Enter to check
                      </p>
                    </div>
                  ) : (
                    // Back: Meanings and readings with result
                    <div className="text-center w-full overflow-y-auto">
                      <div className="text-4xl sm:text-5xl md:text-6xl mb-4 md:mb-6 text-gray-800">
                        {currentCharacter?.character}
                      </div>

                      {/* User's answer */}
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 mb-1">
                          You answered:
                        </p>
                        <p
                          className={`text-lg font-semibold ${
                            inputResult === "correct"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {userInput}
                        </p>
                      </div>

                      {/* Meanings */}
                      <div className="mb-4 md:mb-6">
                        <h3 className="text-sm capitalize font-semibold text-gray-500 mb-2">
                          Meanings
                        </h3>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {currentKanjiData?.meanings.map((meaning, i) => (
                            <span
                              key={i}
                              className="capitalize px-3 py-1.5 md:px-4 md:py-2 bg-rose-100 text-rose-800 rounded-full text-base md:text-lg"
                            >
                              {meaning}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Readings */}
                      <div className="grid grid-cols-2 gap-4 mb-4 md:mb-6">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 mb-1">
                            On'yomi
                          </h4>
                          <div className="text-sm text-gray-700">
                            {currentKanjiData?.readings.onyomi.join(", ") ||
                              "None"}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 mb-1">
                            Kun'yomi
                          </h4>
                          <div className="text-sm text-gray-700">
                            {currentKanjiData?.readings.kunyomi.join(", ") ||
                              "None"}
                          </div>
                        </div>
                      </div>

                      {/* JLPT Level */}
                      <div className="text-xs text-gray-400">
                        {currentKanjiData?.jlptLevel} • Grade{" "}
                        {currentKanjiData?.grade}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit button (shown only if not submitted yet) */}
              {!flipped && !answerResult && (
                <div className="mt-4 md:mt-6">
                  <button
                    onClick={handleInputSubmit}
                    disabled={!userInput.trim()}
                    className="w-full py-4 md:py-6 bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Check Answer
                  </button>
                </div>
              )}
            </>
          )}

          {/* Session stats */}
          <div className="mt-8 flex justify-center gap-8 text-sm text-gray-500">
            <div className="capitalize">
              <span className="font-semibold text-green-600">
                {sessionStats.correct}
              </span>{" "}
              correct
            </div>
            <div className="capitalize">
              <span className="capitalize font-semibold text-red-500">
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
