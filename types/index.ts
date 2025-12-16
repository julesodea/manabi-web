// Base character types
export type CharacterType = 'kanji' | 'hiragana' | 'katakana' | 'radical';

export interface Character {
  id: string;
  character: string;
  type: CharacterType;
  strokeCount: number;
  strokeOrder: string[]; // SVG paths or animation data
  frequency: number;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface KanjiData {
  characterId: string;
  meanings: string[];
  grade: number; // 1-6 for elementary, 7+ for secondary
  jlptLevel: string; // N5-N1
  readings: {
    onyomi: string[];
    kunyomi: string[];
    nanori: string[]; // name readings
  };
  radicals: string[];
  components: string[]; // character IDs that compose this kanji
  exampleWords: ExampleWord[];
  exampleSentences: ExampleSentence[];
}

export interface KanaData {
  characterId: string;
  romaji: string;
  type: 'hiragana' | 'katakana';
  unicodeBlock: string;
  alternativeForms: string[]; // for variations like ゐ, ゑ
}

export interface ExampleWord {
  word: string;
  reading: string;
  meaning: string;
  audioUrl?: string;
}

export interface ExampleSentence {
  japanese: string;
  reading: string;
  translation: string;
  audioUrl?: string;
}

export interface LearningProgress {
  userId: string;
  characterId: string;
  firstSeen: number;
  lastReviewed: number;
  correctCount: number;
  incorrectCount: number;
  srsLevel: number; // Spaced Repetition System level
  nextReviewDate: number;
  studyStats: {
    writingAccuracy: number;
    readingAccuracy: number;
    meaningAccuracy: number;
  };
}

export type StudyMode = 'flashcard' | 'multiple_choice';

export interface Collection {
  id: string;
  name: string;
  description: string;
  type: 'system' | 'user';
  characterIds: string[];
  orderIndex: number;
  studyMode: StudyMode;
  metadata: {
    grade?: number;
    jlptLevel?: string;
    category?: string;
  };
}

// Study session types
export interface StudySession {
  id: string;
  collectionId: string;
  startTime: number;
  endTime?: number;
  reviewedCount: number;
  correctCount: number;
  incorrectCount: number;
}

export interface ReviewItem {
  characterId: string;
  dueDate: number;
  srsLevel: number;
  reviewType: 'meaning' | 'reading' | 'writing';
}

// UI Types
export interface StudyModeInfo {
  id: string;
  name: string;
  description: string;
  type: 'recognition' | 'recall' | 'writing' | 'reading';
}

export interface UserProfile {
  id: string;
  name: string;
  studyStreak: number;
  totalStudyTime: number;
  charactersLearned: number;
  level: number;
  preferences: {
    dailyGoal: number;
    studyReminders: boolean;
    soundEnabled: boolean;
    hapticFeedback: boolean;
    theme: 'light' | 'dark' | 'system';
  };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconName: string;
  unlockedAt?: number;
  progress?: number;
  target?: number;
}
