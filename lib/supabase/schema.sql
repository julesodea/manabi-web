-- Manabi Learning App Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Characters table (base table for all kanji/kana)
CREATE TABLE characters (
  id TEXT PRIMARY KEY,
  character TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('kanji', 'hiragana', 'katakana', 'radical')),
  stroke_count INTEGER NOT NULL,
  stroke_order TEXT[], -- Array of SVG paths
  frequency INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- Kanji data table (additional kanji-specific info)
CREATE TABLE kanji_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  meanings TEXT[] NOT NULL,
  grade INTEGER,
  jlpt_level TEXT,
  onyomi TEXT[] DEFAULT '{}',
  kunyomi TEXT[] DEFAULT '{}',
  nanori TEXT[] DEFAULT '{}',
  radicals TEXT[] DEFAULT '{}',
  components TEXT[] DEFAULT '{}',
  example_words JSONB DEFAULT '[]', -- Array of {word, reading, meaning, audioUrl}
  example_sentences JSONB DEFAULT '[]', -- Array of {japanese, reading, translation, audioUrl}
  UNIQUE(character_id)
);

-- Kana data table (hiragana/katakana specific info)
CREATE TABLE kana_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  romaji TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('hiragana', 'katakana')),
  unicode_block TEXT,
  alternative_forms TEXT[] DEFAULT '{}',
  UNIQUE(character_id)
);

-- Collections table (study sets)
CREATE TABLE collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('system', 'user')),
  character_ids TEXT[] NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  study_mode TEXT NOT NULL CHECK (study_mode IN ('flashcard', 'multiple_choice')),
  grade INTEGER,
  jlpt_level TEXT,
  category TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning progress table (tracks user progress per character)
CREATE TABLE learning_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  first_seen BIGINT NOT NULL,
  last_reviewed BIGINT NOT NULL,
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  srs_level INTEGER DEFAULT 1,
  next_review_date BIGINT NOT NULL,
  writing_accuracy REAL DEFAULT 0,
  reading_accuracy REAL DEFAULT 0,
  meaning_accuracy REAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, character_id)
);

-- Study sessions table (tracks study session history)
CREATE TABLE study_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  start_time BIGINT NOT NULL,
  end_time BIGINT,
  reviewed_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User stats table (aggregated statistics)
CREATE TABLE user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  study_streak INTEGER DEFAULT 0,
  last_study_date DATE,
  reviews_today INTEGER DEFAULT 0,
  reviews_completed_today INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_study_time INTEGER DEFAULT 0, -- in seconds
  characters_learned INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_characters_type ON characters(type);
CREATE INDEX idx_characters_frequency ON characters(frequency DESC);
CREATE INDEX idx_kanji_data_character_id ON kanji_data(character_id);
CREATE INDEX idx_kanji_data_jlpt_level ON kanji_data(jlpt_level);
CREATE INDEX idx_kanji_data_grade ON kanji_data(grade);
CREATE INDEX idx_collections_type ON collections(type);
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_learning_progress_user_id ON learning_progress(user_id);
CREATE INDEX idx_learning_progress_character_id ON learning_progress(character_id);
CREATE INDEX idx_learning_progress_next_review ON learning_progress(next_review_date);
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_collection_id ON study_sessions(collection_id);

-- Enable Row Level Security (RLS)
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collections
CREATE POLICY "System collections are viewable by everyone"
  ON collections FOR SELECT
  USING (type = 'system');

CREATE POLICY "Users can view their own collections"
  ON collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own collections"
  ON collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
  ON collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
  ON collections FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for learning_progress
CREATE POLICY "Users can view their own progress"
  ON learning_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON learning_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON learning_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for study_sessions
CREATE POLICY "Users can view their own sessions"
  ON study_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON study_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_stats
CREATE POLICY "Users can view their own stats"
  ON user_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats"
  ON user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
  ON user_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_progress_updated_at BEFORE UPDATE ON learning_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
