import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { LearningProgress, ReviewItem, StudySession, StudyMode } from '@/types';

interface LearningState {
  progress: { [characterId: string]: LearningProgress };
  reviewQueue: ReviewItem[];
  currentSession: StudySession | null;
  reviewsToday: number;
  studyStreak: number;
  loading: boolean;
  error: string | null;
}

const initialState: LearningState = {
  progress: {},
  reviewQueue: [],
  currentSession: null,
  reviewsToday: 0,
  studyStreak: 0,
  loading: false,
  error: null,
};

// Async thunks
export const loadReviewQueue = createAsyncThunk(
  'learning/loadReviewQueue',
  async (userId: string) => {
    const response = await fetch(`/api/learning/reviews?userId=${userId}`);
    if (!response.ok) throw new Error('Failed to load review queue');
    return await response.json();
  }
);

export const loadLearningProgress = createAsyncThunk(
  'learning/loadProgress',
  async ({ userId, characterId }: { userId: string; characterId: string }) => {
    const response = await fetch(`/api/learning/progress?userId=${userId}&characterId=${characterId}`);
    if (!response.ok) throw new Error('Failed to load progress');
    const progress = await response.json();
    return { characterId, progress };
  }
);

export const updateProgress = createAsyncThunk(
  'learning/updateProgress',
  async (progress: LearningProgress) => {
    const response = await fetch('/api/learning/progress', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progress),
    });
    if (!response.ok) throw new Error('Failed to update progress');
    return await response.json();
  }
);

export const loadUserStats = createAsyncThunk(
  'learning/loadUserStats',
  async (userId: string) => {
    const response = await fetch(`/api/learning/stats?userId=${userId}`);
    if (!response.ok) throw new Error('Failed to load user stats');
    return await response.json();
  }
);

const learningSlice = createSlice({
  name: 'learning',
  initialState,
  reducers: {
    startStudySession: (state, action: PayloadAction<{ collectionId: string; mode: StudyMode }>) => {
      const session: StudySession = {
        id: `session_${Date.now()}`,
        collectionId: action.payload.collectionId,
        startTime: Date.now(),
        reviewedCount: 0,
        correctCount: 0,
        incorrectCount: 0,
      };
      state.currentSession = session;
    },

    endStudySession: (state) => {
      if (state.currentSession) {
        state.currentSession.endTime = Date.now();
        // Session is saved to database via API route
        state.currentSession = null;
      }
    },

    recordAnswer: (state, action: PayloadAction<{
      characterId: string;
      isCorrect: boolean;
      studyMode: StudyMode;
      timeSpent: number;
    }>) => {
      if (state.currentSession) {
        state.currentSession.reviewedCount += 1;
        if (action.payload.isCorrect) {
          state.currentSession.correctCount += 1;
        } else {
          state.currentSession.incorrectCount += 1;
        }
      }

      // Update progress locally (will be persisted via async thunk)
      const { characterId, isCorrect } = action.payload;
      if (state.progress[characterId]) {
        if (isCorrect) {
          state.progress[characterId].correctCount += 1;
        } else {
          state.progress[characterId].incorrectCount += 1;
        }
        state.progress[characterId].lastReviewed = Date.now();
      }
    },

    removeFromReviewQueue: (state, action: PayloadAction<string>) => {
      state.reviewQueue = state.reviewQueue.filter(
        item => item.characterId !== action.payload
      );
    },

    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load review queue
      .addCase(loadReviewQueue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadReviewQueue.fulfilled, (state, action) => {
        state.loading = false;
        state.reviewQueue = action.payload;
      })
      .addCase(loadReviewQueue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load review queue';
      })

      // Load learning progress
      .addCase(loadLearningProgress.fulfilled, (state, action) => {
        const { characterId, progress } = action.payload;
        if (progress) {
          state.progress[characterId] = progress;
        }
      })

      // Update progress
      .addCase(updateProgress.fulfilled, (state, action) => {
        const progress = action.payload;
        state.progress[progress.characterId] = progress;
      })
      .addCase(updateProgress.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update progress';
      })

      // Load user stats
      .addCase(loadUserStats.fulfilled, (state, action) => {
        state.reviewsToday = action.payload.reviews_today || 0;
        state.studyStreak = action.payload.study_streak || 0;
      });
  },
});

export const {
  startStudySession,
  endStudySession,
  recordAnswer,
  removeFromReviewQueue,
  clearError,
} = learningSlice.actions;

export default learningSlice.reducer;
