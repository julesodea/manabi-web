import { create } from 'zustand';
import { Character, KanjiData } from '@/types';

interface CharacterResult {
  characterId: string;
  correct: boolean;
}

interface StudyState {
  // Current study session
  currentCollectionId: string | null;
  currentIndex: number;
  characters: Character[];
  kanjiData: { [id: string]: KanjiData };
  sessionStartTime: number | null;

  // Session stats
  sessionStats: {
    correct: number;
    incorrect: number;
    total: number;
  };

  // Track incorrect character IDs
  incorrectCharacterIds: string[];

  // Track per-character results for API
  characterResults: CharacterResult[];

  // Actions
  startSession: (collectionId: string, characters: Character[], kanjiData: { [id: string]: KanjiData }) => void;
  nextCharacter: () => void;
  recordAnswer: (isCorrect: boolean, characterId: string) => void;
  resetSession: () => void;
  getIncorrectCharacters: () => Character[];
  getCharacterResults: () => CharacterResult[];
}

export const useStudyStore = create<StudyState>((set, get) => ({
  currentCollectionId: null,
  currentIndex: 0,
  characters: [],
  kanjiData: {},
  sessionStartTime: null,
  sessionStats: {
    correct: 0,
    incorrect: 0,
    total: 0,
  },
  incorrectCharacterIds: [],
  characterResults: [],

  startSession: (collectionId, characters, kanjiData) => set({
    currentCollectionId: collectionId,
    currentIndex: 0,
    characters,
    kanjiData,
    sessionStartTime: Date.now(),
    sessionStats: { correct: 0, incorrect: 0, total: 0 },
    incorrectCharacterIds: [],
    characterResults: [],
  }),

  nextCharacter: () => set((state) => ({
    currentIndex: state.currentIndex + 1,
  })),

  recordAnswer: (isCorrect, characterId) => set((state) => ({
    sessionStats: {
      correct: state.sessionStats.correct + (isCorrect ? 1 : 0),
      incorrect: state.sessionStats.incorrect + (isCorrect ? 0 : 1),
      total: state.sessionStats.total + 1,
    },
    incorrectCharacterIds: isCorrect
      ? state.incorrectCharacterIds
      : [...state.incorrectCharacterIds, characterId],
    characterResults: [...state.characterResults, { characterId, correct: isCorrect }],
  })),

  getIncorrectCharacters: () => {
    const state = get();
    return state.characters.filter(char =>
      state.incorrectCharacterIds.includes(char.id)
    );
  },

  getCharacterResults: () => {
    return get().characterResults;
  },

  resetSession: () => set({
    currentCollectionId: null,
    currentIndex: 0,
    characters: [],
    kanjiData: {},
    sessionStartTime: null,
    sessionStats: { correct: 0, incorrect: 0, total: 0 },
    incorrectCharacterIds: [],
    characterResults: [],
  }),
}));
