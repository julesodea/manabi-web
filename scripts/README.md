# Data Loading Scripts

## Load Initial Kanji Data

This script loads all kanji data and system collections into your Supabase database.

### Prerequisites

1. ✅ Supabase project created
2. ✅ Schema (`lib/supabase/schema.sql`) run in Supabase SQL Editor
3. ✅ `.env.local` file configured with your Supabase credentials

### Usage

**Option 1: Load data (keeps existing data)**
```bash
npm run load-data
```

**Option 2: Clear and reload (deletes existing system data)**
```bash
npm run load-data:clear
```

### What Gets Loaded

- **~1250+ Kanji Characters** (N5 through N1)
  - Character information (stroke count, frequency, tags)
  - Meanings (English translations)
  - Readings (on'yomi, kun'yomi, nanori)
  - Example words with readings
  - Example sentences
  - Radicals and components

- **25+ System Collections** (organized by JLPT level and category)
  - N5: Numbers, People, Time, Basic Actions, etc.
  - N4: Education, Work, Transportation, etc.
  - N3: Society, Science, Technology, etc.
  - N2: Business, Environment, Politics, etc.
  - N1: Formal Language, Government, Abstract Concepts, etc.

### Expected Output

```
🚀 Starting data load process...
📍 Supabase URL: https://your-project.supabase.co
🔑 Using service role key: eyJhbGciOiJIUzI1NiI...

📚 Loading Characters and Kanji Data...
Total kanji to load: 1250
  ✓ Loaded 100/1250 kanji...
  ✓ Loaded 200/1250 kanji...
  ...
  ✓ Loaded 1250/1250 kanji...

✅ Characters and Kanji Data loaded!
   Success: 1250
   Errors: 0

📋 Loading Collections...
Total collections to load: 25
  ✓ Loaded: N5 Numbers
  ✓ Loaded: N5 People & Family
  ...

✅ Collections loaded!
   Success: 25
   Errors: 0

🔍 Verifying data...
  ✓ Characters in database: 1250
  ✓ Kanji data entries: 1250
  ✓ Collections in database: 25

📝 Sample kanji: 一
   ID: n5_1
   Stroke count: 1
   JLPT: N5

✅ Data load complete!

💡 Next steps:
   1. Run: npm run dev
   2. Open: http://localhost:3000
   3. Start building the UI!
```

### Troubleshooting

**Error: "Missing environment variables"**
- Make sure your `.env.local` file exists and has all required variables
- Check that the file is in the root directory (`manabi-web/.env.local`)

**Error: "relation 'characters' does not exist"**
- You need to run the schema first in Supabase SQL Editor
- Go to your Supabase dashboard → SQL Editor
- Copy/paste contents from `lib/supabase/schema.sql`
- Click "Run"

**Error: "duplicate key value violates unique constraint"**
- Data already exists in your database
- Use `npm run load-data:clear` to clear and reload
- Or manually delete data from Supabase Table Editor

**Script hangs or times out**
- Check your internet connection
- Verify your Supabase service role key is correct
- Check Supabase dashboard for any service issues

### Data Structure

Each kanji entry consists of:

```typescript
{
  character: {
    id: "n5_1",
    character: "一",
    type: "kanji",
    strokeCount: 1,
    strokeOrder: [],
    frequency: 1,
    tags: ["number", "n5"],
    createdAt: timestamp,
    updatedAt: timestamp
  },
  kanjiData: {
    characterId: "n5_1",
    meanings: ["one"],
    grade: 1,
    jlptLevel: "N5",
    readings: {
      onyomi: ["イチ", "イツ"],
      kunyomi: ["ひと", "ひと.つ"],
      nanori: []
    },
    radicals: [],
    components: [],
    exampleWords: [
      { word: "一つ", reading: "ひとつ", meaning: "one thing" }
    ],
    exampleSentences: []
  }
}
```

### Performance

- Loading typically takes 2-5 minutes depending on your connection
- Progress is shown every 100 kanji
- The script uses the service role key for admin access (bypasses RLS)

### After Loading

Once data is loaded:

1. Verify in Supabase Table Editor:
   - Check `characters` table has ~1250 rows
   - Check `kanji_data` table has ~1250 rows
   - Check `collections` table has ~25 rows

2. Test the API:
   ```bash
   curl http://localhost:3000/api/collections
   curl http://localhost:3000/api/kanji?jlptLevel=N5
   ```

3. Start building the UI!

### Re-running the Script

You can safely re-run the script:

- **Without `--clear`**: Will fail if data already exists (unique constraint errors)
- **With `--clear`**: Deletes all system collections and characters, then reloads

**Warning**: The `--clear` flag will delete:
- All characters
- All kanji_data
- All system collections (type='system')

It will NOT delete:
- User collections (type='user')
- Learning progress
- Study sessions
- User stats
