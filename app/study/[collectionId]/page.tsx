"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useCollection,
  useCollectionCharacters,
} from "@/lib/hooks/useCollections";
import { useStudyStore } from "@/lib/stores/studyStore";
import { useAuth } from "@/lib/providers/AuthProvider";
import { KanjiData } from "@/types";
import { toHiragana, toKatakana } from "wanakana";
import { useTheme } from "@/lib/providers/ThemeProvider";
import MinimalHeader from "@/components/MinimalHeader";
import MenuDrawer from "@/components/MenuDrawer";

type AnswerResult = "correct" | "incorrect" | null;

interface MultipleChoiceOption {
  meaning: string;
  isCorrect: boolean;
}

export default function StudyPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.collectionId as string;
  const { colors } = useTheme();
  const { user } = useAuth();

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
    sessionStartTime,
    startSession,
    nextCharacter,
    recordAnswer: recordAnswerInStore,
    resetSession,
    getIncorrectCharacters,
    getCharacterResults,
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
  const [sessionSaved, setSessionSaved] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const saveAttemptedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Handle scroll for sticky header shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Save session function
  const saveSessionToServer = useCallback(async () => {
    if (!user || !sessionStartTime || !collection) {
      return;
    }

    const totalCharactersInCollection = collection.characterIds.length;

    // Only save if user completed the full collection
    if (sessionStats.total < totalCharactersInCollection) {
      return;
    }

    setSavingSession(true);

    try {
      const response = await fetch("/api/learning/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionId,
          startTime: sessionStartTime,
          endTime: Date.now(),
          reviewedCount: sessionStats.total,
          correctCount: sessionStats.correct,
          incorrectCount: sessionStats.incorrect,
          characterResults: getCharacterResults(),
          totalCharacters: totalCharactersInCollection,
        }),
      });

      const data = await response.json();
      if (data.saved) {
        setSessionSaved(true);
      }
    } catch (error) {
      console.error("Failed to save session:", error);
    } finally {
      setSavingSession(false);
    }
  }, [user, sessionStartTime, collection, collectionId, sessionStats, getCharacterResults]);

  // Save session when complete (only for logged-in users who completed full collection)
  useEffect(() => {
    if (!sessionComplete || saveAttemptedRef.current) {
      return;
    }

    saveAttemptedRef.current = true;
    saveSessionToServer();
  }, [sessionComplete, saveSessionToServer]);

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

  // Auto-focus input on desktop (not iOS) when card changes
  useEffect(() => {
    // Detect if device is iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (
      !isIOS &&
      studyMode === "flashcard" &&
      !flipped &&
      !answerResult &&
      !sessionComplete &&
      inputRef.current
    ) {
      // Focus input on desktop
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [currentIndex, answerResult, flipped, sessionComplete, studyMode]);

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
        if (
          reading === trimmedInput ||
          reading === hiraganaInput ||
          reading === katakanaInput
        ) {
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
      const kunyomiMatch =
        currentKanjiData.readings.kunyomi.some(readingMatches);

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

        // Auto-focus on desktop after moving to next card
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (!isIOS) {
          setTimeout(() => {
            inputRef.current?.focus();
          }, 100);
        }
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
      <div
        className="font-medium min-h-screen flex items-center justify-center bg-background"
        
      >
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse text-white">学</div>
          <p className="text-white">Loading study session...</p>
        </div>
      </div>
    );
  }

  if (!collection || characters.length === 0) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: colors.primary,
        }}
      >
        <div className="text-center bg-white rounded-3xl p-8 shadow-2xl max-w-md mx-4">
          <p className="text-gray-600 mb-4">Collection not found or empty</p>
          <Link
            href="/"
            className="px-6 py-3 text-accent-text rounded-full font-semibold shadow-lg inline-block"
            style={{
              backgroundColor: colors.primary,
            }}
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
      setSessionSaved(false);
      saveAttemptedRef.current = false;

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
      <div
                 
                 
        className="min-h-screen bg-background"
       
      >
        <header
          className={`bg-background fixed top-0 left-0 right-0 z-50 duration-300 ${
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
          <div className="bg-white rounded-3xl p-8 text-center">
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
              <div className="text-sm text-gray-600 mb-2 font-medium">
                Accuracy
              </div>
              <div
                className="text-4xl font-bold mb-2"
                style={{ color: colors.primary }}
              >
                {accuracy}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-background h-3 rounded-full duration-500"
                />
              </div>
            </div>

            {/* Streak saved indicator */}
            {user && sessionSaved && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl">
                <div className="flex items-center justify-center gap-2 text-green-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">Streak +1! Progress saved.</span>
                </div>
              </div>
            )}

            {savingSession && (
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="font-medium">Saving progress...</span>
                </div>
              </div>
            )}

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
                className="px-6 py-3 border-2 border-gray-300 rounded-full font-semibold text-gray-900"
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
                  setSessionSaved(false);
                  saveAttemptedRef.current = false;
                  if (characterData) {
                    const chars = shuffleMode
                      ? [...characterData.characters].sort(
                          () => Math.random() - 0.5
                        )
                      : characterData.characters;

                    startSession(collectionId, chars, characterData.kanjiData);
                  }
                }}
                className="px-6 py-3 text-accent-text rounded-full font-semibold"
                style={{
                  backgroundColor: colors.primary,
                }}
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
    <div className="min-h-screen bg-background">
      {/* Menu Drawer */}
      <MenuDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Minimal Header */}
      <MinimalHeader
        showMenu
        onMenuClick={() => setMenuOpen(true)}
        progress={{
          current: currentIndex + 1,
          total: characters.length,
        }}
      />

      {/* Study Content */}
      <main className="max-w-2xl mx-auto px-4 pt-24 pb-8">
        <div className="h-[calc(100vh-200px)] flex flex-col">
          {studyMode === "multiple_choice" ? (
            // Multiple Choice Mode
            <>
              {/* Kanji Card */}
              <div
                className={`
                  relative bg-card-bg rounded-xl flex-1 max-h-[300px]
                  duration-500 border border-border
                  ${answerResult === "correct" ? "ring-2 ring-green-500" : ""}
                  ${answerResult === "incorrect" ? "ring-2 ring-red-500" : ""}
                `}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-8">
                  <div className="text-foreground text-6xl sm:text-7xl md:text-8xl lg:text-9xl">
                    {currentCharacter?.character}
                  </div>
                  <p className="text-muted text-sm mt-4 font-medium">
                    What does this Kanji mean?
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

                  let buttonClass = "bg-card-bg border border-border text-foreground";
                  if (showCorrect) {
                    buttonClass =
                      "bg-green-50 border-2 border-green-500 text-green-900";
                  } else if (showIncorrect) {
                    buttonClass =
                      "bg-red-50 border-2 border-red-500 text-red-900";
                  } else if (isSelected) {
                    buttonClass = "bg-card-bg border-2 text-foreground";
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
                      style={
                        isSelected && !showCorrect && !showIncorrect
                          ? { borderColor: colors.primary }
                          : undefined
                      }
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-400 w-6">
                          {index + 1}.
                        </span>
                        <span className="text-base md:text-lg font-medium">
                          {option.meaning.charAt(0).toUpperCase() +
                            option.meaning.slice(1)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Hint for keyboard shortcuts */}
              {!answerResult && (
                <p className="text-center text-sm text-muted mt-4">
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
                  relative bg-card-bg rounded-xl flex-1 max-h-[500px]
                  duration-500 border border-border
                  ${answerResult === "correct" ? "ring-2 ring-green-500" : ""}
                  ${answerResult === "incorrect" ? "ring-2 ring-red-500" : ""}
                `}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-8">
                  {!flipped ? (
                    // Front: Kanji character with input
                    <div className="text-center w-full">
                      <div className="text-foreground text-6xl sm:text-7xl md:text-8xl lg:text-9xl mb-6 md:mb-8">
                        {currentCharacter?.character}
                      </div>
                      <p className="text-muted text-sm mb-4 font-medium">
                        Type the reading or meaning
                      </p>
                      <div className="w-full px-4 flex justify-center">
                        <input
                          ref={inputRef}
                          type="text"
                          inputMode="text"
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck="false"
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && userInput.trim()) {
                              handleInputSubmit();
                            }
                          }}
                          disabled={!!answerResult}
                          placeholder="Type your answer..."
                          className="w-full max-w-xs px-4 py-3 border-2 rounded-xl text-center text-foreground placeholder:text-muted outline-none focus:ring-2 disabled:bg-border disabled:cursor-not-allowed bg-background"
                          style={{
                            borderColor: "var(--accent)",
                            fontSize: "16px", // Prevents iOS zoom on focus
                            ["--tw-ring-color" as string]: "var(--accent)",
                          }}
                        />
                      </div>
                      <p className="text-muted text-xs mt-2">
                        Press Enter to check
                      </p>
                    </div>
                  ) : (
                    // Back: Meanings and readings with result
                    <div className="text-center w-full overflow-y-auto">
                      <div className="text-4xl sm:text-5xl md:text-6xl mb-4 md:mb-6 text-foreground">
                        {currentCharacter?.character}
                      </div>

                      {/* User's answer */}
                      <div className="mb-4">
                        <p className="text-sm text-muted mb-1">
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
                        <h3 className="text-sm font-semibold text-muted mb-2">
                          Meanings
                        </h3>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {currentKanjiData?.meanings.map((meaning, i) => (
                            <span
                              key={i}
                              className="px-3 py-1.5 md:px-4 md:py-2 rounded-full text-base md:text-lg font-medium bg-card-bg text-foreground border border-border"
                            >
                              {meaning.charAt(0).toUpperCase() +
                                meaning.slice(1)}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Readings */}
                      <div className="grid grid-cols-2 gap-4 mb-4 md:mb-6">
                        <div>
                          <h4 className="text-xs font-semibold text-muted mb-1">
                            On'yomi
                          </h4>
                          <div className="text-sm text-foreground">
                            {currentKanjiData?.readings.onyomi.join(", ") ||
                              "None"}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-muted mb-1">
                            Kun'yomi
                          </h4>
                          <div className="text-sm text-foreground">
                            {currentKanjiData?.readings.kunyomi.join(", ") ||
                              "None"}
                          </div>
                        </div>
                      </div>

                      {/* JLPT Level */}
                      <div className="text-xs text-muted">
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
                    onClick={(e) => {
                      e.preventDefault();
                      handleInputSubmit();
                    }}
                    disabled={!userInput.trim()}
                    className="w-full py-4 md:py-6 bg-[var(--accent)] text-accent-text rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Check Answer
                  </button>
                </div>
              )}
            </>
          )}

          {/* Session stats */}
          <div className="mt-8 flex justify-center gap-8 text-sm text-muted">
            <div className="capitalize">
              <span className="font-semibold text-foreground">
                {sessionStats.correct}
              </span>{" "}
              correct
            </div>
            <div className="capitalize">
              <span className="capitalize font-semibold text-foreground">
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
