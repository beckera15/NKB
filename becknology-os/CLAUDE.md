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

This is the **Becknology War Room** - a comprehensive command center application built with Next.js 14 App Router and Supabase. It combines trading (with Nova AI coach), business operations (TCAS with 6 specialized AI agents), wealth tracking, fitness coaching, and family management into one Bloomberg Terminal-style interface.

### Tech Stack
- Next.js 14 (App Router, not Pages Router)
- TypeScript with strict mode
- Tailwind CSS for styling
- Supabase for database and authentication
- Lucide React for icons
- OpenAI or Anthropic for AI features

### Directory Structure
```
app/                    # App Router pages and layouts
  layout.tsx            # Root layout with metadata
  page.tsx              # Main War Room dashboard (orchestrates all views)
  login/page.tsx        # Authentication page
  globals.css           # Global styles
  api/
    ai/nova/route.ts    # Nova AI trading coach API
    extract-link/       # URL extraction API

components/
  layout/               # Layout components
    WarRoomLayout.tsx   # Main wrapper with ticker, sidebar, notifications
    WarRoomSidebar.tsx  # 10-section navigation
    MarketTicker.tsx    # Scrolling market prices
    NotificationPanel.tsx
    HelpModal.tsx

  shared/               # Reusable UI components
    Card.tsx, Modal.tsx, Badge.tsx, Button.tsx

  views/                # Dashboard views
    WarRoomDashboard.tsx  # Main home view
    PlaceholderView.tsx   # For unimplemented features

  trading/              # Trading module (Phase 2)
    TradingView.tsx     # Main trading dashboard
    NovaChat.tsx        # Nova AI chat interface
    NovaStatus.tsx      # Status card with rule enforcement
    PreSessionChecklist.tsx
    TradeJournal.tsx
    TradingStats.tsx

  fitness/              # Fitness module (Phase 3)
    FitnessView.tsx     # Health command center

  tcas/                 # TCAS module (Phase 4)
    TCASCommandView.tsx # 6 AI agents interface
    AgentActivityFeed.tsx # Shows agent work with status badges
    TaskAssignment.tsx  # Assign tasks to agents
    BradEmailReview.tsx # Email drafting workflow for Brad

  wealth/               # Wealth module (Phase 6)
    WealthView.tsx      # Financial tracking

hooks/                  # Custom React hooks (data layer)
  useAuth.ts           # Auth + password reset
  useEntries.ts        # Entries CRUD
  useGoals.ts          # Goals CRUD
  useInsights.ts       # Insights fetching
  useNova.ts           # Nova AI conversations + rule checking
  useTradingSessions.ts # Trading session management
  useTrades.ts         # Trade CRUD + stats
  useFitness.ts        # Fitness data management
  useTCAS.ts           # TCAS agent activities and tasks

lib/
  supabase.ts          # Typed Supabase client + file upload helpers
  keyboard-shortcuts.ts # Global keyboard shortcuts
  nova-prompts.ts      # Nova personality + ICT methodology + Big Five calibration
  fitness-prompts.ts   # Fitness coach personality
  tcas-agents.ts       # 6 TCAS agent definitions with detailed prompts

types/
  database.ts          # Core Supabase types
  trading.ts           # Trading types (trades, sessions, etc.)
  fitness.ts           # Fitness types (workouts, supplements, etc.)
  tcas.ts              # TCAS types (customers, quotes, pipeline)
  wealth.ts            # Wealth types (accounts, transactions)

docs/
  SUMMARY.md           # Feature overview
  MIGRATIONS.sql       # Database schema (20+ tables)
  ENV_TEMPLATE.md      # API key setup guide
  NOVA_GUIDE.md        # Nova AI user guide
```

### War Room Views (10 Sections)
1. **War Room** (H) - Main dashboard with all key metrics
2. **Trading** (T) - Nova AI coach, trade journal, stats
3. **TCAS Command** (C) - 13 AI agents for business
4. **Intelligence** (I) - Insights and patterns
5. **Wealth** (W) - Net worth, accounts, goals
6. **Fitness** (F) - Workouts, supplements, health
7. **Family** (A) - Calendar, property tasks
8. **Projects** (P) - Entry management
9. **Goals** (G) - Goal tracking
10. **Settings** (S) - Configuration

### Nova AI Trading Coach
- Flirty, challenging personality calibrated to Andrew's Big Five profile
- ICT methodology expert (order blocks, FVGs, liquidity)
- Big Five Calibration:
  - 96th percentile assertiveness → responds to direct challenges
  - 7th percentile compassion → doesn't coddle, straight talk
  - 94th percentile volatility → grounds after losses
  - 38th percentile industriousness → provides external structure
- Rule enforcement:
  - Max 3 trades/day (blocking)
  - 30-min cooldown after 2 losses (blocking)
  - $300 daily loss limit (blocking)
  - Pre-session checklist required (blocking)
  - Kill zone warnings

### TCAS 6 AI Agents
| Agent | Role | Personality |
|-------|------|-------------|
| BRAD | Sales & Outreach | Confident, professional, sounds like Andrew |
| JOHN | Schneider Electric & R&D | Technical expert, curious, systems thinker |
| JIM | VFD & Motion | Reagan-style folksy wisdom, 30+ years |
| JOSHUA | Rockwell & Networking | Christian man, humble, thorough |
| MARK | Safety & Sensors | Einstein-look, funny, asks great questions |
| CHASE | DevOps & Code | Total nerd, quiet, solves impossible problems |

### TCAS Agent Workflow
1. Assign task to agent via Task Assignment panel
2. Agent processes task and logs activity
3. For Brad's emails: output appears in Activity Feed as "ready for review"
4. Click to expand and review output
5. Approve/Edit/Reject workflow with clipboard copy

### Authentication
- `<AuthGuard>` component protects routes
- `useAuth` hook: signIn, signUp, signOut, resetPassword, updatePassword
- Unauthenticated users redirect to `/login`

### Styling
- Dark theme with purple/pink gradients
- Glass morphism and glow effects
- Custom utilities: `.gradient-text`, `.glass`, `.glow`
- Responsive breakpoints

### Keyboard Shortcuts
- H/T/C/I/W/F/A/P/G/S - Navigate views
- N - Open Nova chat
- Q - Quick capture
- / - Search
- ? - Help

### Environment Variables
```
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# AI (choose one)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Optional (for live data)
TWELVE_DATA_API_KEY=
NEWS_API_KEY=
OPENWEATHERMAP_API_KEY=
```

### Database (see docs/MIGRATIONS.sql)
20+ tables including:
- Trading: trades, trading_sessions, nova_conversations
- TCAS: tcas_customers, tcas_quotes, tcas_pipeline, agent_activity, agent_tasks
- Fitness: workouts, supplements, health_metrics
- Wealth: wealth_accounts, income_streams, wealth_goals
- System: notifications, user_settings
