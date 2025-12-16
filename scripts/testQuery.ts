import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQueries() {
  console.log('Testing database queries...\n');

  // Test 1: Count characters
  const { count: charCount, error: charError } = await supabase
    .from('characters')
    .select('*', { count: 'exact', head: true });

  console.log('1. Characters count:', charCount, charError ? `Error: ${charError.message}` : '✓');

  // Test 2: Count kanji_data
  const { count: kanjiCount, error: kanjiError } = await supabase
    .from('kanji_data')
    .select('*', { count: 'exact', head: true });

  console.log('2. Kanji data count:', kanjiCount, kanjiError ? `Error: ${kanjiError.message}` : '✓');

  // Test 3: Get one character
  const { data: oneChar, error: oneCharError } = await supabase
    .from('characters')
    .select('*')
    .eq('type', 'kanji')
    .limit(1);

  console.log('3. Sample character:', oneChar?.[0]?.character || 'None', oneCharError ? `Error: ${oneCharError.message}` : '✓');

  // Test 4: Get character with kanji_data
  const { data: withKanji, error: withKanjiError } = await supabase
    .from('characters')
    .select(`
      *,
      kanji_data (*)
    `)
    .eq('type', 'kanji')
    .limit(1);

  console.log('4. Character with kanji_data:');
  console.log('   Character:', withKanji?.[0]?.character || 'None');
  console.log('   Has kanji_data:', withKanji?.[0]?.kanji_data ? 'Yes' : 'No');
  console.log('   Kanji_data length:', withKanji?.[0]?.kanji_data?.length || 0);
  if (withKanjiError) console.log('   Error:', withKanjiError.message);

  // Test 5: Get all kanji (no filter)
  const { data: allKanji, error: allKanjiError } = await supabase
    .from('characters')
    .select(`
      *,
      kanji_data (*)
    `)
    .eq('type', 'kanji');

  console.log('5. All kanji query:');
  console.log('   Total results:', allKanji?.length || 0);
  console.log('   With kanji_data:', allKanji?.filter((k: any) => k.kanji_data?.length > 0).length || 0);
  if (allKanjiError) console.log('   Error:', allKanjiError.message);

  // Test 6: Collections
  const { count: collCount, error: collError } = await supabase
    .from('collections')
    .select('*', { count: 'exact', head: true });

  console.log('6. Collections count:', collCount, collError ? `Error: ${collError.message}` : '✓');
}

testQueries().then(() => {
  console.log('\nTest complete!');
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
