import { supabase } from '../supabase/client';
import { supabaseAdmin } from '../supabase/server';
import {
  Character,
  KanjiData,
  Collection,
  LearningProgress,
  ReviewItem,
  StudySession
} from '@/types';

export class DatabaseService {
  // Character operations
  static async getCharacterById(id: string): Promise<Character | null> {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching character:', error);
      return null;
    }

    return this.mapToCharacter(data);
  }

  static async getKanjiData(characterId: string): Promise<KanjiData | null> {
    const { data, error } = await supabase
      .from('kanji_data')
      .select('*')
      .eq('character_id', characterId)
      .single();

    if (error) {
      console.error('Error fetching kanji data:', error);
      return null;
    }

    return this.mapToKanjiData(data);
  }

  static async getAllKanji(jlptLevel?: string, limit?: number, offset?: number): Promise<Array<Character & { kanjiData: KanjiData }>> {
    // First get all kanji_data (start here to respect JLPT filter)
    let kanjiQuery = supabase
      .from('kanji_data')
      .select('*');

    if (jlptLevel && jlptLevel !== 'All') {
      kanjiQuery = kanjiQuery.eq('jlpt_level', jlptLevel);
    }

    // Add pagination if limit is provided
    if (limit !== undefined) {
      kanjiQuery = kanjiQuery.range(offset || 0, (offset || 0) + limit - 1);
    }

    const { data: kanjiDataList, error: kanjiError } = await kanjiQuery;

    if (kanjiError || !kanjiDataList) {
      console.error('Error fetching kanji data:', kanjiError);
      return [];
    }

    // Get character IDs from kanji data
    const characterIds = kanjiDataList.map(kd => kd.character_id);

    // Fetch characters in batches (Supabase has a 1000 row default limit per query)
    const batchSize = 1000;
    const allCharacters: any[] = [];

    for (let i = 0; i < characterIds.length; i += batchSize) {
      const batch = characterIds.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .in('id', batch);

      if (error) {
        console.error('Error fetching character batch:', error);
        continue;
      }

      if (data) {
        allCharacters.push(...data);
      }
    }

    // Create maps for quick lookup
    const characterMap = new Map(
      allCharacters.map(char => [char.id, char])
    );

    // Combine them - iterate over kanji_data to maintain filtering
    const result = kanjiDataList
      .filter(kd => characterMap.has(kd.character_id))
      .map(kd => ({
        ...this.mapToCharacter(characterMap.get(kd.character_id)),
        kanjiData: this.mapToKanjiData(kd)
      }));

    return result;
  }

  static async searchKanji(query: string, jlptLevel?: string, limit?: number, offset?: number): Promise<Array<Character & { kanjiData: KanjiData }>> {
    // First get all kanji_data with JLPT filter if specified
    let kanjiQuery = supabase
      .from('kanji_data')
      .select('*');

    if (jlptLevel && jlptLevel !== 'All') {
      kanjiQuery = kanjiQuery.eq('jlpt_level', jlptLevel);
    }

    const { data: allKanjiData, error: kanjiError } = await kanjiQuery;

    if (kanjiError || !allKanjiData) {
      console.error('Error fetching kanji data:', kanjiError);
      return [];
    }

    // Get character IDs
    const characterIds = allKanjiData.map(kd => kd.character_id);

    // Fetch all characters
    const { data: allCharacters, error: charactersError } = await supabase
      .from('characters')
      .select('*')
      .in('id', characterIds);

    if (charactersError || !allCharacters) {
      console.error('Error fetching characters:', charactersError);
      return [];
    }

    // Create maps for quick lookup
    const characterMap = new Map(allCharacters.map(char => [char.id, char]));

    // Combine and filter by search query
    const searchLower = query.toLowerCase();
    const filtered = allKanjiData
      .filter(kd => characterMap.has(kd.character_id))
      .map(kd => ({
        ...this.mapToCharacter(characterMap.get(kd.character_id)),
        kanjiData: this.mapToKanjiData(kd)
      }))
      .filter(item => {
        // Search in character
        if (item.character.includes(searchLower)) return true;

        // Search in meanings
        if (item.kanjiData.meanings.some(m => m.toLowerCase().includes(searchLower))) return true;

        // Search in readings
        const allReadings = [
          ...item.kanjiData.readings.onyomi,
          ...item.kanjiData.readings.kunyomi,
          ...item.kanjiData.readings.nanori,
        ];
        if (allReadings.some(r => r.toLowerCase().includes(searchLower))) return true;

        // Search in ID
        if (item.id.toLowerCase().includes(searchLower)) return true;

        return false;
      });

    // Apply pagination
    const start = offset || 0;
    const end = limit ? start + limit : filtered.length;
    return filtered.slice(start, end);
  }

  // Collection operations
  static async getAllCollections(userId?: string): Promise<Collection[]> {
    // Use supabaseAdmin to bypass RLS since we're filtering manually by user_id
    // Get system collections
    const { data: systemCollections, error: systemError } = await supabaseAdmin
      .from('collections')
      .select('*')
      .eq('type', 'system')
      .order('order_index', { ascending: true });

    if (systemError) {
      console.error('Error fetching system collections:', systemError);
      return [];
    }

    // Get user collections if userId is provided
    let userCollections: any[] = [];
    if (userId) {
      const { data, error } = await supabaseAdmin
        .from('collections')
        .select('*')
        .eq('type', 'user')
        .eq('user_id', userId)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching user collections:', error);
      } else {
        userCollections = data || [];
      }
    } else {
      // For unauthenticated users, get user collections without user_id (legacy/anonymous)
      const { data, error } = await supabaseAdmin
        .from('collections')
        .select('*')
        .eq('type', 'user')
        .is('user_id', null)
        .order('order_index', { ascending: true });

      if (!error && data) {
        userCollections = data;
      }
    }

    const allCollections = [...userCollections, ...systemCollections];
    return allCollections.map(this.mapToCollection);
  }

  static async getCollectionById(id: string): Promise<Collection | null> {
    // Use supabaseAdmin to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('collections')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching collection:', error);
      return null;
    }

    return this.mapToCollection(data);
  }

  static async getCharactersByCollection(collectionId: string): Promise<{
    characters: Character[];
    kanjiData: { [id: string]: KanjiData };
    collectionId: string;
  }> {
    const collection = await this.getCollectionById(collectionId);
    if (!collection) {
      return { characters: [], kanjiData: {}, collectionId };
    }

    // Fetch characters
    const { data: charactersData, error: charactersError } = await supabase
      .from('characters')
      .select('*')
      .in('id', collection.characterIds);

    if (charactersError) {
      console.error('Error fetching characters:', charactersError);
      return { characters: [], kanjiData: {}, collectionId };
    }

    // Fetch kanji data for these characters
    const { data: kanjiDataList, error: kanjiError } = await supabase
      .from('kanji_data')
      .select('*')
      .in('character_id', collection.characterIds);

    if (kanjiError) {
      console.error('Error fetching kanji data:', kanjiError);
    }

    const characters: Character[] = charactersData.map(this.mapToCharacter);
    const kanjiData: { [id: string]: KanjiData } = {};

    if (kanjiDataList) {
      kanjiDataList.forEach((item: any) => {
        kanjiData[item.character_id] = this.mapToKanjiData(item);
      });
    }

    return { characters, kanjiData, collectionId };
  }

  static async getUserCollections(userId: string): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('type', 'user')
      .eq('user_id', userId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching user collections:', error);
      return [];
    }

    return data.map(this.mapToCollection);
  }

  static async createCollection(collection: Collection, userId?: string | null): Promise<Collection> {
    const { data, error } = await supabaseAdmin
      .from('collections')
      .insert({
        id: collection.id,
        name: collection.name,
        description: collection.description,
        type: collection.type,
        character_ids: collection.characterIds,
        order_index: collection.orderIndex,
        study_mode: collection.studyMode,
        grade: collection.metadata.grade,
        jlpt_level: collection.metadata.jlptLevel,
        category: collection.metadata.category,
        user_id: userId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating collection:', error);
      throw error;
    }

    return this.mapToCollection(data);
  }

  // NOTE: This method uses supabaseAdmin and bypasses RLS
  // For user collections, use the authenticated client in API routes instead
  static async updateCollection(collection: Collection): Promise<Collection> {
    const { data, error } = await supabaseAdmin
      .from('collections')
      .update({
        name: collection.name,
        description: collection.description,
        character_ids: collection.characterIds,
        study_mode: collection.studyMode,
      })
      .eq('id', collection.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating collection:', error);
      throw error;
    }

    return this.mapToCollection(data);
  }

  // NOTE: This method uses the browser supabase client which may not work correctly in server context
  // For user collections, use the authenticated client in API routes instead
  static async deleteCollection(collectionId: string): Promise<void> {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', collectionId);

    if (error) {
      console.error('Error deleting collection:', error);
      throw error;
    }
  }

  // Learning progress operations
  static async getLearningProgress(userId: string, characterId: string): Promise<LearningProgress | null> {
    const { data, error } = await supabase
      .from('learning_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('character_id', characterId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error fetching learning progress:', error);
      return null;
    }

    return this.mapToLearningProgress(data);
  }

  static async updateLearningProgress(progress: LearningProgress): Promise<void> {
    const { error } = await supabase
      .from('learning_progress')
      .upsert({
        user_id: progress.userId,
        character_id: progress.characterId,
        first_seen: progress.firstSeen,
        last_reviewed: progress.lastReviewed,
        correct_count: progress.correctCount,
        incorrect_count: progress.incorrectCount,
        srs_level: progress.srsLevel,
        next_review_date: progress.nextReviewDate,
        writing_accuracy: progress.studyStats.writingAccuracy,
        reading_accuracy: progress.studyStats.readingAccuracy,
        meaning_accuracy: progress.studyStats.meaningAccuracy,
      });

    if (error) {
      console.error('Error updating learning progress:', error);
      throw error;
    }
  }

  static async getReviewItems(userId: string): Promise<ReviewItem[]> {
    const now = Date.now();
    const { data, error } = await supabase
      .from('learning_progress')
      .select('character_id, srs_level, next_review_date')
      .eq('user_id', userId)
      .lte('next_review_date', now);

    if (error) {
      console.error('Error fetching review items:', error);
      return [];
    }

    return data.map(item => ({
      characterId: item.character_id,
      dueDate: item.next_review_date,
      srsLevel: item.srs_level,
      reviewType: 'meaning' as const,
    }));
  }

  static async getUserStats(userId: string) {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Create initial stats if not found
        return this.createUserStats(userId);
      }
      console.error('Error fetching user stats:', error);
      return null;
    }

    return data;
  }

  static async createUserStats(userId: string) {
    const { data, error } = await supabase
      .from('user_stats')
      .insert({
        user_id: userId,
        study_streak: 0,
        reviews_today: 0,
        reviews_completed_today: 0,
        total_reviews: 0,
        total_study_time: 0,
        characters_learned: 0,
        level: 1,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user stats:', error);
      return null;
    }

    return data;
  }

  // Helper mapping functions
  private static mapToCharacter(data: any): Character {
    return {
      id: data.id,
      character: data.character,
      type: data.type,
      strokeCount: data.stroke_count,
      strokeOrder: data.stroke_order || [],
      frequency: data.frequency || 0,
      tags: data.tags || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private static mapToKanjiData(data: any): KanjiData {
    return {
      characterId: data.character_id,
      meanings: data.meanings || [],
      grade: data.grade,
      jlptLevel: data.jlpt_level,
      readings: {
        onyomi: data.onyomi || [],
        kunyomi: data.kunyomi || [],
        nanori: data.nanori || [],
      },
      radicals: data.radicals || [],
      components: data.components || [],
      exampleWords: data.example_words || [],
      exampleSentences: data.example_sentences || [],
    };
  }

  private static mapToCollection(data: any): Collection {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type,
      characterIds: data.character_ids || [],
      orderIndex: data.order_index,
      studyMode: data.study_mode,
      userId: data.user_id,
      metadata: {
        grade: data.grade,
        jlptLevel: data.jlpt_level,
        category: data.category,
      },
    };
  }

  private static mapToLearningProgress(data: any): LearningProgress {
    return {
      userId: data.user_id,
      characterId: data.character_id,
      firstSeen: data.first_seen,
      lastReviewed: data.last_reviewed,
      correctCount: data.correct_count,
      incorrectCount: data.incorrect_count,
      srsLevel: data.srs_level,
      nextReviewDate: data.next_review_date,
      studyStats: {
        writingAccuracy: data.writing_accuracy,
        readingAccuracy: data.reading_accuracy,
        meaningAccuracy: data.meaning_accuracy,
      },
    };
  }
}
