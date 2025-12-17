import { create } from 'zustand';
import { Character, KanjiData } from '@/types';

interface StudyState {
  // Current study session
  currentCollectionId: string | null;
  currentIndex: number;
  characters: Character[];
  kanjiData: { [id: string]: KanjiData };

  // Session stats
  sessionStats: {
    correct: number;
    incorrect: number;
    total: number;
  };

  // Actions
  startSession: (collectionId: string, characters: Character[], kanjiData: { [id: string]: KanjiData }) => void;
  nextCharacter: () => void;
  recordAnswer: (isCorrect: boolean) => void;
  resetSession: () => void;
}

export const useStudyStore = create<StudyState>((set) => ({
  currentCollectionId: null,
  currentIndex: 0,
  characters: [],
  kanjiData: {},
  sessionStats: {
    correct: 0,
    incorrect: 0,
    total: 0,
  },

  startSession: (collectionId, characters, kanjiData) => set({
    currentCollectionId: collectionId,
    currentIndex: 0,
    characters,
    kanjiData,
    sessionStats: { correct: 0, incorrect: 0, total: 0 },
  }),

  nextCharacter: () => set((state) => ({
    currentIndex: state.currentIndex + 1,
  })),

  recordAnswer: (isCorrect) => set((state) => ({
    sessionStats: {
      correct: state.sessionStats.correct + (isCorrect ? 1 : 0),
      incorrect: state.sessionStats.incorrect + (isCorrect ? 0 : 1),
      total: state.sessionStats.total + 1,
    },
  })),

  resetSession: () => set({
    currentCollectionId: null,
    currentIndex: 0,
    characters: [],
    kanjiData: {},
    sessionStats: { correct: 0, incorrect: 0, total: 0 },
  }),
}));
