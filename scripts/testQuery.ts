import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQueries() {
  // Test 1: Count characters
  const { count: charCount, error: charError } = await supabase
    .from("characters")
    .select("*", { count: "exact", head: true });

  // Test 2: Count kanji_data
  const { count: kanjiCount, error: kanjiError } = await supabase
    .from("kanji_data")
    .select("*", { count: "exact", head: true });

  // Test 3: Get one character
  const { data: oneChar, error: oneCharError } = await supabase
    .from("characters")
    .select("*")
    .eq("type", "kanji")
    .limit(1);

  // Test 4: Get character with kanji_data
  const { data: withKanji, error: withKanjiError } = await supabase
    .from("characters")
    .select(
      `
      *,
      kanji_data (*)
    `
    )
    .eq("type", "kanji")
    .limit(1);

  // Test 5: Get all kanji (no filter)
  const { data: allKanji, error: allKanjiError } = await supabase
    .from("characters")
    .select(
      `
      *,
      kanji_data (*)
    `
    )
    .eq("type", "kanji");

  // Test 6: Collections
  const { count: collCount, error: collError } = await supabase
    .from("collections")
    .select("*", { count: "exact", head: true });
}

testQueries()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  });
