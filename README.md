# Manabi Learning

[manabi-web.vercel.app](https://manabi-web.vercel.app)

A Next.js web application for learning Japanese Kanji using spaced repetition system (SRS). Migrated from React Native to provide a full-featured web experience.

## Features

- **Spaced Repetition Learning**: SM2 algorithm with 10 mastery levels
- **Two Study Modes**: Flashcard (honor system) and Multiple Choice
- **Custom Collections**: Create personalized study sets from 1000+ kanji
- **System Collections**: Pre-built collections by JLPT level and category
- **Progress Tracking**: Track your learning with streaks, accuracy stats, and review scheduling
- **Kanji Browser**: Browse and filter kanji by JLPT level (N5-N1)
- **Detailed Kanji Info**: Meanings, readings (on'yomi, kun'yomi), example words, and sentences

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **State Management**: Redux Toolkit
- **Fonts**: Noto Sans JP (for Japanese characters)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier works)

### 1. Clone and Install

```bash
cd manabi-web
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Copy the contents of `lib/supabase/schema.sql`
4. Run it in the SQL Editor to create all tables, indexes, and Row Level Security policies

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Get these from: Supabase Dashboard → Project Settings → API

### 4. Load Initial Data

The kanji data is in `lib/data/initialKanji.ts`. You need to create a script to load this into your Supabase database.

See `MIGRATION_STATUS.md` for the current implementation status and next steps.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
manabi-web/
├── app/                          # Next.js app directory
│   ├── layout.tsx               # Root layout with Redux Provider
│   ├── page.tsx                 # Home page
│   ├── kanji-grid/              # Browse all kanji
│   ├── kanji/[id]/              # Kanji detail page
│   ├── study/[collectionId]/    # Study session page
│   ├── collections/             # Collection management
│   └── api/                     # API routes
│       ├── collections/         # Collection CRUD
│       ├── learning/            # Progress, reviews, stats
│       └── kanji/               # Kanji data endpoints
├── components/                   # Reusable React components
├── lib/
│   ├── redux/                   # Redux store and slices
│   ├── services/                # Database and SRS engine
│   ├── supabase/                # Supabase client and schema
│   └── data/                    # Initial kanji dataset
├── types/                       # TypeScript definitions
└── MIGRATION_STATUS.md          # Detailed migration progress
```

## Database Schema

The database uses Supabase (PostgreSQL) with Row Level Security enabled. See `lib/supabase/schema.sql` for the complete schema.

### Main Tables

- **characters**: Base character data
- **kanji_data**: Kanji-specific information
- **collections**: Study collections
- **learning_progress**: User progress per character
- **study_sessions**: Session history
- **user_stats**: Aggregated statistics

## API Routes

All API routes follow RESTful conventions. See the `app/api` directory for implementations.

## Contributing

Contributions are welcome! Please check `MIGRATION_STATUS.md` for areas that need implementation.

## License

MIT License

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
