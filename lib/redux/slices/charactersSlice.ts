import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Character, KanjiData, Collection, StudyMode } from '@/types';

interface CharactersState {
  entities: { [id: string]: Character };
  kanjiData: { [characterId: string]: KanjiData };
  collections: { [id: string]: Collection };
  currentCollection: string | null;
  currentIndex: number;
  loadedSets: string[];
  loading: boolean;
  error: string | null;
}

const initialState: CharactersState = {
  entities: {},
  kanjiData: {},
  collections: {},
  currentCollection: null,
  currentIndex: 0,
  loadedSets: [],
  loading: false,
  error: null,
};

// Async thunks - using API routes
export const loadCollections = createAsyncThunk(
  'characters/loadCollections',
  async () => {
    const response = await fetch('/api/collections');
    if (!response.ok) throw new Error('Failed to load collections');
    return await response.json();
  }
);

export const loadCharactersByCollection = createAsyncThunk(
  'characters/loadCharactersByCollection',
  async (collectionId: string) => {
    const response = await fetch(`/api/collections/${collectionId}/characters`);
    if (!response.ok) throw new Error('Failed to load characters');
    return await response.json();
  }
);

export const createCustomCollection = createAsyncThunk(
  'characters/createCustomCollection',
  async (collectionData: {
    name: string;
    description: string;
    studyMode: StudyMode;
    characterIds: string[];
  }) => {
    const response = await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collectionData),
    });
    if (!response.ok) throw new Error('Failed to create collection');
    return await response.json();
  }
);

export const updateCustomCollection = createAsyncThunk(
  'characters/updateCustomCollection',
  async (collectionData: {
    id: string;
    name: string;
    description: string;
    studyMode: StudyMode;
    characterIds: string[];
  }) => {
    const response = await fetch(`/api/collections/${collectionData.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collectionData),
    });
    if (!response.ok) throw new Error('Failed to update collection');
    return await response.json();
  }
);

export const deleteCustomCollection = createAsyncThunk(
  'characters/deleteCustomCollection',
  async (collectionId: string) => {
    const response = await fetch(`/api/collections/${collectionId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete collection');
    return collectionId;
  }
);

export const loadUserCollections = createAsyncThunk(
  'characters/loadUserCollections',
  async () => {
    const response = await fetch('/api/collections?type=user');
    if (!response.ok) throw new Error('Failed to load user collections');
    return await response.json();
  }
);

const charactersSlice = createSlice({
  name: 'characters',
  initialState,
  reducers: {
    setCurrentCollection: (state, action: PayloadAction<string>) => {
      state.currentCollection = action.payload;
      state.currentIndex = 0;
    },
    setCurrentIndex: (state, action: PayloadAction<number>) => {
      state.currentIndex = action.payload;
    },
    nextCharacter: (state) => {
      if (state.currentCollection) {
        const collection = state.collections[state.currentCollection];
        if (collection && state.currentIndex < collection.characterIds.length - 1) {
          state.currentIndex += 1;
        }
      }
    },
    previousCharacter: (state) => {
      if (state.currentIndex > 0) {
        state.currentIndex -= 1;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load collections
      .addCase(loadCollections.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadCollections.fulfilled, (state, action) => {
        state.loading = false;
        state.collections = action.payload.reduce((acc: { [id: string]: Collection }, collection: Collection) => {
          acc[collection.id] = collection;
          return acc;
        }, {});
      })
      .addCase(loadCollections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load collections';
      })

      // Load characters by collection
      .addCase(loadCharactersByCollection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadCharactersByCollection.fulfilled, (state, action) => {
        state.loading = false;
        const { characters, kanjiData, collectionId } = action.payload;

        // Add characters to entities
        characters.forEach((character: Character) => {
          state.entities[character.id] = character;
        });

        // Add kanji data
        Object.assign(state.kanjiData, kanjiData);

        // Mark collection as loaded
        if (!state.loadedSets.includes(collectionId)) {
          state.loadedSets.push(collectionId);
        }

        // Set as current collection if none is set
        if (!state.currentCollection) {
          state.currentCollection = collectionId;
          state.currentIndex = 0;
        }
      })
      .addCase(loadCharactersByCollection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load characters';
      })

      // Create custom collection
      .addCase(createCustomCollection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCustomCollection.fulfilled, (state, action) => {
        state.loading = false;
        const collection = action.payload;
        state.collections[collection.id] = collection;
      })
      .addCase(createCustomCollection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create collection';
      })

      // Update custom collection
      .addCase(updateCustomCollection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCustomCollection.fulfilled, (state, action) => {
        state.loading = false;
        const collection = action.payload;
        state.collections[collection.id] = collection;
      })
      .addCase(updateCustomCollection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update collection';
      })

      // Delete custom collection
      .addCase(deleteCustomCollection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCustomCollection.fulfilled, (state, action) => {
        state.loading = false;
        const collectionId = action.payload;
        delete state.collections[collectionId];

        // Clear current collection if it was deleted
        if (state.currentCollection === collectionId) {
          state.currentCollection = null;
          state.currentIndex = 0;
        }
      })
      .addCase(deleteCustomCollection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete collection';
      })

      // Load user collections
      .addCase(loadUserCollections.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadUserCollections.fulfilled, (state, action) => {
        state.loading = false;
        action.payload.forEach((collection: Collection) => {
          state.collections[collection.id] = collection;
        });
      })
      .addCase(loadUserCollections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load user collections';
      });
  },
});

export const {
  setCurrentCollection,
  setCurrentIndex,
  nextCharacter,
  previousCharacter,
  clearError,
} = charactersSlice.actions;

// Selectors
export const selectCurrentCharacter = (state: { characters: CharactersState }) => {
  if (!state.characters.currentCollection) return null;
  const collection = state.characters.collections[state.characters.currentCollection];
  if (!collection) return null;
  const characterId = collection.characterIds[state.characters.currentIndex];
  return state.characters.entities[characterId] || null;
};

export const selectCurrentKanjiData = (state: { characters: CharactersState }) => {
  if (!state.characters.currentCollection) return null;
  const collection = state.characters.collections[state.characters.currentCollection];
  if (!collection) return null;
  const characterId = collection.characterIds[state.characters.currentIndex];
  return state.characters.kanjiData[characterId] || null;
};

export const selectCollectionProgress = (state: { characters: CharactersState }, collectionId: string) => {
  const collection = state.characters.collections[collectionId];
  if (!collection) return null;

  return {
    current: state.characters.currentIndex,
    total: collection.characterIds.length,
  };
};

export default charactersSlice.reducer;
