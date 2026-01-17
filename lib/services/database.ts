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
import { toHiragana, toKatakana, isRomaji } from 'wanakana';

export class DatabaseService {
  // Character operations
  static async getCharacterById(id: string): Promise<Character | null> {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
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
      return null;
    }

    return this.mapToKanjiData(data);
  }

  static async getAllKanji(jlptLevel?: string, limit?: number, offset?: number): Promise<Array<Character & { kanjiData: KanjiData }>> {
    // Use a single query with embedded join via foreign key relationship
    // This fetches kanji_data with its related character in one request
    let query = supabase
      .from('kanji_data')
      .select(`
        *,
        characters!kanji_data_character_id_fkey (*)
      `);

    if (jlptLevel && jlptLevel !== 'All') {
      query = query.eq('jlpt_level', jlptLevel);
    }

    // Add pagination
    if (limit !== undefined) {
      query = query.range(offset || 0, (offset || 0) + limit - 1);
    }

    const { data, error } = await query;

    if (error || !data) {
      return [];
    }

    // Map the joined data
    return data
      .filter((item: any) => item.characters) // Ensure character exists
      .map((item: any) => ({
        ...this.mapToCharacter(item.characters),
        kanjiData: this.mapToKanjiData(item)
      }));
  }

  static async searchKanji(query: string, jlptLevel?: string, limit?: number, offset?: number): Promise<Array<Character & { kanjiData: KanjiData }>> {
    const queryLower = query.toLowerCase();

    // Convert romaji to hiragana and katakana for reading search
    const searchHiragana = isRomaji(query) ? toHiragana(query) : null;
    const searchKatakana = isRomaji(query) ? toKatakana(query) : null;

    // For meaning/reading search on arrays, PostgREST array operators require exact matches
    // We'll fetch data and filter client-side for flexible matching
    // The ORDER BY clause ensures consistent results from Supabase

    let baseQuery = supabase
      .from('kanji_data')
      .select(`
        *,
        characters!kanji_data_character_id_fkey (*)
      `)
      .order('character_id');

    // Apply JLPT filter at database level BEFORE limiting
    if (jlptLevel && jlptLevel !== 'All') {
      baseQuery = baseQuery.eq('jlpt_level', jlptLevel);
    }

    // Fetch all matching kanji for search
    // Note: Supabase has a hard limit of 1000 rows per request
    // We need to paginate to get all kanji when no JLPT filter is applied
    let allKanji: any[] = [];
    let fetchMore = true;
    let currentOffset = 0;
    const BATCH_SIZE = 1000;

    while (fetchMore) {
      const { data: batch, error } = await baseQuery
        .range(currentOffset, currentOffset + BATCH_SIZE - 1);

      if (error) {
        console.error('[searchKanji] Error fetching batch:', error);
        return [];
      }

      if (!batch || batch.length === 0) {
        fetchMore = false;
      } else {
        allKanji = allKanji.concat(batch);
        currentOffset += BATCH_SIZE;

        // Stop if we got less than a full batch (means we're at the end)
        if (batch.length < BATCH_SIZE) {
          fetchMore = false;
        }
      }
    }

    // Filter results client-side for flexible matching and calculate relevance score
    const scoredResults = allKanji
      .map((item: any) => {
        let score = 0;
        let matched = false;

        // Check if query matches the character directly (highest priority)
        if (item.characters?.character === query) {
          score = 100;
          matched = true;
        }

        // Check meanings
        if (item.meanings) {
          for (const meaning of item.meanings) {
            const meaningLower = meaning.toLowerCase();
            if (meaningLower === queryLower) {
              // Exact match (e.g., "cat" matches "cat")
              score = Math.max(score, 90);
              matched = true;
            } else if (meaningLower.split(/[\s,;]+/).includes(queryLower)) {
              // Whole word match (e.g., "cat" matches "big cat" but not "category")
              score = Math.max(score, 80);
              matched = true;
            } else if (meaningLower.startsWith(queryLower)) {
              // Starts with query (e.g., "cat" matches "cattle")
              score = Math.max(score, 70);
              matched = true;
            } else if (meaningLower.includes(queryLower)) {
              // Contains query (e.g., "cat" matches "category")
              score = Math.max(score, 50);
              matched = true;
            }
          }
        }

        // Check readings - original query
        const checkReadings = (readings: string[] | undefined, searchTerm: string, baseScore: number) => {
          if (!readings) return;
          for (const reading of readings) {
            if (reading === searchTerm) {
              score = Math.max(score, baseScore);
              matched = true;
            } else if (reading.includes(searchTerm)) {
              score = Math.max(score, baseScore - 20);
              matched = true;
            }
          }
        };

        checkReadings(item.onyomi, query, 85);
        checkReadings(item.kunyomi, query, 85);
        checkReadings(item.nanori, query, 85);

        // Check readings - converted romaji to hiragana/katakana
        if (searchHiragana) {
          checkReadings(item.onyomi, searchHiragana, 85);
          checkReadings(item.kunyomi, searchHiragana, 85);
          checkReadings(item.nanori, searchHiragana, 85);
        }
        if (searchKatakana) {
          checkReadings(item.onyomi, searchKatakana, 85);
          checkReadings(item.kunyomi, searchKatakana, 85);
          checkReadings(item.nanori, searchKatakana, 85);
        }

        return { item, score, matched };
      })
      .filter(({ matched }) => matched)
      .sort((a, b) => b.score - a.score);

    // Apply pagination
    const start = offset || 0;
    const end = limit ? start + limit : scoredResults.length;
    const paginatedResults = scoredResults.slice(start, end).map(({ item }) => item);

    // Map the joined data
    return paginatedResults
      .filter((item: any) => item.characters)
      .map((item: any) => ({
        ...this.mapToCharacter(item.characters),
        kanjiData: this.mapToKanjiData(item)
      }));
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
        userCollections = [];
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
      return { characters: [], kanjiData: {}, collectionId };
    }

    // Fetch kanji data for these characters
    const { data: kanjiDataList } = await supabase
      .from('kanji_data')
      .select('*')
      .in('character_id', collection.characterIds);

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
      return null;
    }

    return data;
  }

  // Study session operations
  static async saveStudySession(
    userId: string,
    session: {
      id: string;
      collectionId: string;
      startTime: number;
      endTime: number;
      reviewedCount: number;
      correctCount: number;
      incorrectCount: number;
    }
  ): Promise<StudySession | null> {
    const { data, error } = await supabase
      .from('study_sessions')
      .insert({
        id: session.id,
        user_id: userId,
        collection_id: session.collectionId,
        start_time: session.startTime,
        end_time: session.endTime,
        reviewed_count: session.reviewedCount,
        correct_count: session.correctCount,
        incorrect_count: session.incorrectCount,
      })
      .select()
      .single();

    if (error) {
      console.error('[saveStudySession] Error:', error);
      return null;
    }

    return {
      id: data.id,
      collectionId: data.collection_id,
      startTime: data.start_time,
      endTime: data.end_time,
      reviewedCount: data.reviewed_count,
      correctCount: data.correct_count,
      incorrectCount: data.incorrect_count,
    };
  }

  static async getStudySessions(userId: string, limit = 50): Promise<StudySession[]> {
    const { data, error } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[getStudySessions] Error:', error);
      return [];
    }

    return data.map((item: any) => ({
      id: item.id,
      collectionId: item.collection_id,
      startTime: item.start_time,
      endTime: item.end_time,
      reviewedCount: item.reviewed_count,
      correctCount: item.correct_count,
      incorrectCount: item.incorrect_count,
    }));
  }

  static async incrementUserStreak(
    userId: string,
    reviewedCount: number,
    correctCount: number,
    studyTimeSeconds: number
  ): Promise<void> {
    // Get current stats
    const stats = await this.getUserStats(userId);
    if (!stats) return;

    const { error } = await supabase
      .from('user_stats')
      .update({
        study_streak: stats.study_streak + 1,
        total_reviews: stats.total_reviews + reviewedCount,
        reviews_completed_today: stats.reviews_completed_today + correctCount,
        total_study_time: stats.total_study_time + studyTimeSeconds,
        last_study_date: new Date().toISOString().split('T')[0],
      })
      .eq('user_id', userId);

    if (error) {
      console.error('[incrementUserStreak] Error:', error);
    }
  }

  static async batchUpdateLearningProgress(
    userId: string,
    results: Array<{ characterId: string; correct: boolean }>
  ): Promise<void> {
    const now = Date.now();

    for (const result of results) {
      // Get existing progress or create new
      let progress = await this.getLearningProgress(userId, result.characterId);

      if (!progress) {
        progress = {
          userId,
          characterId: result.characterId,
          firstSeen: now,
          lastReviewed: now,
          correctCount: 0,
          incorrectCount: 0,
          srsLevel: 1,
          nextReviewDate: now,
          studyStats: {
            writingAccuracy: 0,
            readingAccuracy: 0,
            meaningAccuracy: 0,
          },
        };
      }

      // Update counts
      if (result.correct) {
        progress.correctCount += 1;
        // Increase SRS level (max 8)
        progress.srsLevel = Math.min(progress.srsLevel + 1, 8);
      } else {
        progress.incorrectCount += 1;
        // Decrease SRS level (min 1)
        progress.srsLevel = Math.max(progress.srsLevel - 1, 1);
      }

      progress.lastReviewed = now;

      // Calculate next review date based on SRS level
      // Intervals: 1=4h, 2=8h, 3=1d, 4=2d, 5=4d, 6=1w, 7=2w, 8=1m
      const intervals = [0, 4, 8, 24, 48, 96, 168, 336, 720]; // hours
      const hoursUntilReview = intervals[progress.srsLevel] || 4;
      progress.nextReviewDate = now + hoursUntilReview * 60 * 60 * 1000;

      // Update accuracy
      const totalAttempts = progress.correctCount + progress.incorrectCount;
      progress.studyStats.meaningAccuracy = totalAttempts > 0
        ? progress.correctCount / totalAttempts
        : 0;

      await this.updateLearningProgress(progress);
    }
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
