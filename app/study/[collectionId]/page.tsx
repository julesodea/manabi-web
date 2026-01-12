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
import { toHiragana, toKatakana } from "wanakana";

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

      const trimmedInput = input.trim();
      const normalizedInput = trimmedInput.toLowerCase();

      // Check against meanings
      const meaningMatch = currentKanjiData.meanings.some(
        (meaning) => meaning.toLowerCase() === normalizedInput
      );

      // Convert romaji input to hiragana and katakana for comparison
      // wanakana will convert romaji to kana, or return kana as-is if already kana
      let hiraganaInput: string;
      let katakanaInput: string;
      
      try {
        hiraganaInput = toHiragana(trimmedInput, { IMEMode: false });
        katakanaInput = toKatakana(trimmedInput, { IMEMode: false });
      } catch (e) {
        // If conversion fails, use the original input
        hiraganaInput = trimmedInput;
        katakanaInput = trimmedInput;
      }

      // Helper function to check if a reading matches the input
      const readingMatches = (reading: string): boolean => {
        // Compare exact match (case-sensitive for kana)
        if (reading === trimmedInput || reading === hiraganaInput || reading === katakanaInput) {
          return true;
        }
        // Compare case-insensitive (for romaji)
        if (reading.toLowerCase() === normalizedInput) {
          return true;
        }
        return false;
      };

      // Check against onyomi readings
      const onyomiMatch = currentKanjiData.readings.onyomi.some(readingMatches);

      // Check against kunyomi readings
      const kunyomiMatch = currentKanjiData.readings.kunyomi.some(readingMatches);

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
      <div className="min-h-screen bg-gradient-to-br from-[#5B7FFF] to-[#4A6FEE] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse text-white">学</div>
          <p className="text-white">Loading study session...</p>
        </div>
      </div>
    );
  }

  if (!collection || characters.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#5B7FFF] to-[#4A6FEE] flex items-center justify-center">
        <div className="text-center bg-white rounded-3xl p-8 shadow-2xl max-w-md mx-4">
          <p className="text-gray-600 mb-4">Collection not found or empty</p>
          <Link
            href="/"
            className="px-6 py-3 bg-gradient-to-r from-[#5B7FFF] to-[#4A6FEE] text-white rounded-full font-semibold shadow-lg inline-block"
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
      <div className="min-h-screen bg-gradient-to-br from-[#5B7FFF] to-[#4A6FEE]">
        <header
          className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#5B7FFF] to-[#4A6FEE] duration-300 ${
            scrolled ? "shadow-xl py-3" : "py-4 shadow-lg"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold">
                  学
                </div>
                <span className="text-white text-xl font-bold tracking-tight hidden sm:block">
                  Manabi
                </span>
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 pt-24 pb-12">
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl">
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
              <div className="text-sm text-gray-600 mb-2 font-medium">Accuracy</div>
              <div className="text-4xl font-bold text-[#5B7FFF] mb-2">
                {accuracy}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-[#5B7FFF] to-[#4A6FEE] h-3 rounded-full duration-500"
                  style={{ width: `${accuracy}%` }}
                />
              </div>
            </div>

            {hasFailedCards && (
              <div className="mb-8 p-4 bg-orange-50 border-2 border-orange-200 rounded-2xl">
                <p className="text-sm text-orange-800 mb-3 font-medium">
                  You got {incorrectCharacterIds.length} card
                  {incorrectCharacterIds.length > 1 ? "s" : ""} wrong. Want to
                  practice them?
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <button
                    onClick={handleRetryFailedCards}
                    className="px-4 py-2 bg-orange-500 text-white rounded-full text-sm font-semibold shadow-md"
                  >
                    Retry Failed Cards
                  </button>
                  <button
                    onClick={handleCreateCollectionFromFailed}
                    className="px-4 py-2 border-2 border-orange-500 text-orange-700 rounded-full text-sm font-semibold"
                  >
                    Save as New Collection
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/"
                className="px-6 py-3 border-2 border-gray-300 rounded-full font-semibold text-gray-700"
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
                className="px-6 py-3 bg-gradient-to-r from-[#5B7FFF] to-[#4A6FEE] text-white rounded-full font-semibold shadow-lg"
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
    <div className="min-h-screen bg-gradient-to-br from-[#5B7FFF] to-[#4A6FEE]">
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
              <h1 className="text-lg font-semibold text-white hidden sm:block">
                {collection.name}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-white/80">Progress</div>
                <div className="text-lg font-semibold text-white">
                  {currentIndex + 1} / {characters.length}
                </div>
              </div>
              {studyMode === "multiple_choice" && (
                <button
                  onClick={() => setShuffleMode(!shuffleMode)}
                  className={`px-4 py-2 rounded-full text-sm font-medium duration-200 border ${
                    shuffleMode
                      ? "bg-white/20 text-white border-white/30"
                      : "bg-white/10 text-white border-white/30 hover:bg-white/20"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {shuffleMode ? (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                          />
                        </svg>
                        Shuffled
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                          />
                        </svg>
                        In Order
                      </>
                    )}
                  </span>
                </button>
              )}
              <Link
                href="/"
                className="px-4 py-2 text-white border border-white/30 rounded-full text-sm font-medium hover:bg-white/20 transition"
              >
                End
              </Link>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full duration-300"
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
                  relative bg-white rounded-3xl flex-1 max-h-[300px] shadow-2xl
                  duration-500
                  ${answerResult === "correct" ? "ring-4 ring-green-500" : ""}
                  ${answerResult === "incorrect" ? "ring-4 ring-red-500" : ""}
                `}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-8">
                  <div className="text-gray-900 text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold">
                    {currentCharacter?.character}
                  </div>
                  <p className="text-gray-600 text-sm mt-4 font-medium">
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
                    "bg-white shadow-lg text-gray-900";
                  if (showCorrect) {
                    buttonClass =
                      "bg-green-50 border-2 border-green-500 text-green-900 shadow-lg";
                  } else if (showIncorrect) {
                    buttonClass =
                      "bg-red-50 border-2 border-red-500 text-red-900 shadow-lg";
                  } else if (isSelected) {
                    buttonClass =
                      "bg-white border-2 border-white text-gray-900 shadow-xl";
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleMultipleChoiceSelect(index)}
                      disabled={answerResult !== null}
                      className={`
                        p-4 md:p-6 rounded-2xl duration-200 text-left
                        disabled:cursor-default
                        ${buttonClass}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-400 w-6">
                          {index + 1}.
                        </span>
                        <span className="text-base md:text-lg font-medium">
                          {option.meaning.charAt(0).toUpperCase() + option.meaning.slice(1)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Hint for keyboard shortcuts */}
              {!answerResult && (
                <p className="text-center text-sm text-white/80 mt-4">
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
                  relative bg-white rounded-3xl flex-1 max-h-[500px] shadow-2xl
                  duration-500
                  ${answerResult === "correct" ? "ring-4 ring-green-500" : ""}
                  ${answerResult === "incorrect" ? "ring-4 ring-red-500" : ""}
                `}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-8">
                  {!flipped ? (
                    // Front: Kanji character with input
                    <div className="text-center w-full">
                      <div className="text-gray-900 text-6xl sm:text-7xl md:text-8xl lg:text-9xl mb-6 md:mb-8 font-bold">
                        {currentCharacter?.character}
                      </div>
                      <p className="text-gray-600 text-sm mb-4 font-medium">
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
                        placeholder="Type your answer..."
                        className="w-full max-w-xs px-4 py-3 border-2 border-gray-200 rounded-xl text-center text-base text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#5B7FFF] focus:ring-2 focus:ring-[#5B7FFF]/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                      <p className="text-gray-500 text-xs mt-2">
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
                        <h3 className="text-sm font-semibold text-gray-500 mb-2">
                          Meanings
                        </h3>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {currentKanjiData?.meanings.map((meaning, i) => (
                            <span
                              key={i}
                              className="px-3 py-1.5 md:px-4 md:py-2 bg-[#E8ECFF] text-[#5B7FFF] rounded-full text-base md:text-lg"
                            >
                              {meaning.charAt(0).toUpperCase() + meaning.slice(1)}
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
                    className="w-full py-4 md:py-6 bg-white text-[#5B7FFF] rounded-2xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Check Answer
                  </button>
                </div>
              )}
            </>
          )}

          {/* Session stats */}
          <div className="mt-8 flex justify-center gap-8 text-sm text-white/90">
            <div className="capitalize">
              <span className="font-semibold text-white">
                {sessionStats.correct}
              </span>{" "}
              correct
            </div>
            <div className="capitalize">
              <span className="capitalize font-semibold text-white">
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
