/**
 * Data Loader Script
 *
 * This script loads the initial kanji data and collections into Supabase.
 * Run with: npx tsx scripts/loadData.ts
 *
 * Make sure you have:
 * 1. Run the schema.sql in Supabase
 * 2. Set up your .env.local with SUPABASE credentials
 */

import { createClient } from "@supabase/supabase-js";
import { allKanjiData, allCollections } from "../lib/data/initialKanji";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables!");
  console.error(
    "Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function loadCharactersAndKanjiData() {
  let successCount = 0;
  let errorCount = 0;

  for (const item of allKanjiData) {
    try {
      // Insert character
      const { error: charError } = await supabase.from("characters").insert({
        id: item.character.id,
        character: item.character.character,
        type: item.character.type,
        stroke_count: item.character.strokeCount,
        stroke_order: item.character.strokeOrder,
        frequency: item.character.frequency,
        tags: item.character.tags,
        created_at: item.character.createdAt,
        updated_at: item.character.updatedAt,
      });

      if (charError) {
        console.error(
          `  ❌ Error inserting character ${item.character.character}:`,
          charError.message
        );
        errorCount++;
        continue;
      }

      // Insert kanji data
      const { error: kanjiError } = await supabase.from("kanji_data").insert({
        character_id: item.kanjiData.characterId,
        meanings: item.kanjiData.meanings,
        grade: item.kanjiData.grade,
        jlpt_level: item.kanjiData.jlptLevel,
        onyomi: item.kanjiData.readings.onyomi,
        kunyomi: item.kanjiData.readings.kunyomi,
        nanori: item.kanjiData.readings.nanori,
        radicals: item.kanjiData.radicals,
        components: item.kanjiData.components,
        example_words: item.kanjiData.exampleWords,
        example_sentences: item.kanjiData.exampleSentences,
      });

      if (kanjiError) {
        console.error(
          `  ❌ Error inserting kanji data for ${item.character.character}:`,
          kanjiError.message
        );
        errorCount++;
        continue;
      }

      successCount++;

      // Progress indicator
      if (successCount % 100 === 0) {
      }
    } catch (error: any) {
      console.error(
        `  ❌ Unexpected error for ${item.character.character}:`,
        error.message
      );
      errorCount++;
    }
  }
}

async function loadCollections() {
  let successCount = 0;
  let errorCount = 0;

  for (const collection of allCollections) {
    try {
      const { error } = await supabase.from("collections").insert({
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
        user_id: null, // System collections have no user
      });

      if (error) {
        console.error(
          `  ❌ Error inserting collection ${collection.name}:`,
          error.message
        );
        errorCount++;
        continue;
      }

      successCount++;
    } catch (error: any) {
      console.error(
        `  ❌ Unexpected error for ${collection.name}:`,
        error.message
      );
      errorCount++;
    }
  }
}

async function verifyData() {
  // Count characters
  const { count: charCount, error: charError } = await supabase
    .from("characters")
    .select("*", { count: "exact", head: true });

  if (charError) {
    console.error("  ❌ Error counting characters:", charError.message);
  } else {
  }

  // Count kanji data
  const { count: kanjiCount, error: kanjiError } = await supabase
    .from("kanji_data")
    .select("*", { count: "exact", head: true });

  if (kanjiError) {
    console.error("  ❌ Error counting kanji data:", kanjiError.message);
  } else {
  }

  // Count collections
  const { count: collCount, error: collError } = await supabase
    .from("collections")
    .select("*", { count: "exact", head: true });

  if (collError) {
    console.error("  ❌ Error counting collections:", collError.message);
  } else {
  }

  // Sample a random kanji
  const { data: sampleKanji, error: sampleError } = await supabase
    .from("characters")
    .select(
      `
      *,
      kanji_data (*)
    `
    )
    .eq("type", "kanji")
    .limit(1)
    .single();

  if (sampleError) {
    console.error("  ❌ Error fetching sample kanji:", sampleError.message);
  } else {
  }
}

async function clearExistingData() {
  // Delete in correct order due to foreign key constraints
  const { error: kanjiError } = await supabase
    .from("kanji_data")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  const { error: collError } = await supabase
    .from("collections")
    .delete()
    .eq("type", "system");
  const { error: charError } = await supabase
    .from("characters")
    .delete()
    .neq("id", "dummy");

  if (kanjiError || collError || charError) {
  } else {
  }
}

async function main() {
  try {
    // Optional: Clear existing data (comment out if you want to keep existing data)
    const clearData = process.argv.includes("--clear");
    if (clearData) {
      await clearExistingData();
    }

    // Load data
    await loadCharactersAndKanjiData();
    await loadCollections();

    // Verify
    await verifyData();
  } catch (error: any) {
    console.error("\n❌ Fatal error:", error.message);
    process.exit(1);
  }
}

// Run the script
main();
