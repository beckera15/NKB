# Trading Agent

A Python-based trading journal agent that processes trade data from CSV files, calculates performance metrics, and automatically posts session summaries to Supabase.

## Features

- **CSV Trade Import**: Reads trade data with columns for time, instrument, direction, entry/exit prices, size, setup type, and notes
- **P&L Calculation**: Computes profit/loss for each trade and session totals
- **Performance Metrics**: Calculates win rate, average win/loss, profit factor, and more
- **Markdown Journal Generation**: Creates formatted trading session summaries
- **Supabase Integration**: Automatically posts journal entries to your Supabase database

## Installation

```bash
cd agents/trading-agent
pip install -r requirements.txt
```

## Configuration

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase anon/service key

## Usage

### Basic Usage

```bash
python trading-agent.py trades.csv
```

### Options

```bash
# Specify output file for markdown journal (optional)
python trading-agent.py trades.csv --output journal.md

# Dry run - generate journal without posting to Supabase
python trading-agent.py trades.csv --dry-run

# Verbose logging
python trading-agent.py trades.csv --verbose
```

## CSV Format

The input CSV must have the following columns:

| Column | Description | Example |
|--------|-------------|---------|
| time | Trade timestamp | 2024-01-15 09:30:00 |
| instrument | Trading instrument | ES, NQ, AAPL |
| direction | Trade direction | long, short |
| entry | Entry price | 4500.00 |
| exit | Exit price | 4510.00 |
| size | Position size | 2 |
| setup | Trade setup type | breakout, pullback |
| notes | Trade notes | Clean break of resistance |

See `sample-trades.csv` for an example.

## Output

The agent generates a markdown journal entry with:

- Session date and summary
- Individual trade details with P&L
- Performance statistics:
  - Total P&L
  - Win rate
  - Number of trades (wins/losses)
  - Average win and average loss
  - Profit factor
  - Largest win and largest loss

## Supabase Schema

The agent posts to an `entries` table with the following structure:

```sql
CREATE TABLE entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  project TEXT,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Error Handling

- Validates CSV structure before processing
- Handles missing or malformed data gracefully
- Logs all operations with configurable verbosity
- Returns appropriate exit codes for scripting

## License

MIT
