# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
npm run start    # Start production server
```

## Architecture

This is a **Next.js 14 App Router** application with Supabase backend for a personal knowledge management and goal tracking system.

### Tech Stack
- Next.js 14 (App Router, not Pages Router)
- TypeScript with strict mode
- Tailwind CSS for styling
- Supabase for database
- Lucide React for icons

### Directory Structure
```
app/              # App Router pages and layouts
  layout.tsx      # Root layout with metadata
  page.tsx        # Main dashboard (orchestrates all views)
  globals.css     # Global styles and Tailwind utilities
components/       # React components
  Sidebar.tsx     # Navigation + stats + project selector
  CaptureModal.tsx    # Quick entry creation with file upload
  IntelligenceView.tsx # Dashboard with insights and project activity
  EntriesView.tsx     # Entry list/detail with filtering
  LibraryView.tsx     # Media file grid with preview
  GoalsView.tsx       # Goals organized by timeframe
hooks/            # Custom React hooks (data layer)
  useEntries.ts   # Entries CRUD + stats computation
  useGoals.ts     # Goals CRUD + timeframe grouping
  useInsights.ts  # Insights fetching
lib/
  supabase.ts     # Typed Supabase client singleton
types/
  database.ts     # Supabase schema types (entries, goals, insights, weekly_reports)
```

### Data Model (Supabase Tables)
- **entries**: Core data capture (notes, tasks, ideas, decisions, media) with project, priority, status, file attachments, keywords
- **goals**: Goal tracking with timeframes (daily/weekly/monthly/quarterly/yearly), progress tracking
- **insights**: AI-generated insights, themes, questions linked to source entries
- **weekly_reports**: Performance summaries with metrics JSON

### Key Patterns
- All view components use `'use client'` directive
- Custom hooks abstract Supabase queries with loading/error states
- Path alias: `@/*` maps to project root
- 8 predefined projects: TCAS, Trading, Becknology, NKB PR, Nikki GF Content, Property/Home, Family, Wealth Building

### Styling
- Dark theme with purple/pink gradient accents
- Custom utilities in globals.css: `.gradient-text`, `.glass`, `.glow`, `.animate-fade-in`
- Responsive grid layouts with Tailwind breakpoints

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
```
