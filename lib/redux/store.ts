import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import charactersReducer from './slices/charactersSlice';
import learningReducer from './slices/learningSlice';

export const store = configureStore({
  reducer: {
    characters: charactersReducer,
    learning: learningReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Type-safe hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Selectors
export const selectCurrentCharacter = (state: RootState) => {
  const { currentCollection, currentIndex, entities, collections } = state.characters;
  if (!currentCollection || !collections[currentCollection]) return null;

  const collection = collections[currentCollection];
  const characterId = collection.characterIds[currentIndex];
  return characterId ? entities[characterId] : null;
};

export const selectCurrentKanjiData = (state: RootState) => {
  const currentCharacter = selectCurrentCharacter(state);
  if (!currentCharacter || currentCharacter.type !== 'kanji') return null;

  return state.characters.kanjiData[currentCharacter.id] || null;
};

export const selectCurrentCollectionProgress = (state: RootState) => {
  const { currentCollection, collections } = state.characters;
  if (!currentCollection || !collections[currentCollection]) return { learned: 0, total: 0 };

  const collection = collections[currentCollection];
  const learned = collection.characterIds.filter(
    id => state.learning.progress[id]?.srsLevel > 0
  ).length;

  return { learned, total: collection.characterIds.length };
};
