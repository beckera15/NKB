#!/usr/bin/env python3
"""
Trading Agent - Processes trade data and posts journal entries to Supabase.

This agent reads trade data from a CSV file, calculates performance metrics,
generates a markdown journal entry, and posts it to a Supabase database.
"""

import argparse
import csv
import logging
import os
import sys
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Optional

import requests
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


@dataclass
class Trade:
    """Represents a single trade."""

    time: datetime
    instrument: str
    direction: str
    entry: Decimal
    exit: Decimal
    size: Decimal
    setup: str
    notes: str
    pnl: Decimal = Decimal("0")

    def calculate_pnl(self) -> Decimal:
        """Calculate profit/loss for this trade."""
        if self.direction.lower() == "long":
            self.pnl = (self.exit - self.entry) * self.size
        elif self.direction.lower() == "short":
            self.pnl = (self.entry - self.exit) * self.size
        else:
            logger.warning(f"Unknown direction '{self.direction}' for trade at {self.time}")
            self.pnl = Decimal("0")
        return self.pnl


@dataclass
class SessionStats:
    """Statistics for a trading session."""

    total_pnl: Decimal
    win_count: int
    loss_count: int
    total_trades: int
    win_rate: float
    avg_win: Decimal
    avg_loss: Decimal
    profit_factor: float
    largest_win: Decimal
    largest_loss: Decimal


class TradingAgent:
    """Agent for processing trades and generating journal entries."""

    REQUIRED_COLUMNS = ["time", "instrument", "direction", "entry", "exit", "size", "setup", "notes"]

    def __init__(self, supabase_url: Optional[str] = None, supabase_key: Optional[str] = None):
        """Initialize the trading agent.

        Args:
            supabase_url: Supabase project URL
            supabase_key: Supabase API key
        """
        self.supabase_url = supabase_url
        self.supabase_key = supabase_key
        self.trades: list[Trade] = []
        self.session_date: Optional[datetime] = None

    def load_trades(self, csv_path: Path) -> list[Trade]:
        """Load trades from a CSV file.

        Args:
            csv_path: Path to the CSV file

        Returns:
            List of Trade objects

        Raises:
            FileNotFoundError: If the CSV file doesn't exist
            ValueError: If the CSV is missing required columns or has invalid data
        """
        if not csv_path.exists():
            raise FileNotFoundError(f"CSV file not found: {csv_path}")

        logger.info(f"Loading trades from {csv_path}")

        with open(csv_path, newline="", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)

            # Validate columns
            if reader.fieldnames is None:
                raise ValueError("CSV file is empty or has no headers")

            missing_columns = set(self.REQUIRED_COLUMNS) - set(reader.fieldnames)
            if missing_columns:
                raise ValueError(f"CSV missing required columns: {missing_columns}")

            self.trades = []
            for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
                try:
                    trade = self._parse_trade_row(row, row_num)
                    if trade:
                        trade.calculate_pnl()
                        self.trades.append(trade)
                except ValueError as e:
                    logger.warning(f"Skipping row {row_num}: {e}")

        if not self.trades:
            raise ValueError("No valid trades found in CSV")

        # Set session date from first trade
        self.session_date = self.trades[0].time.date()
        logger.info(f"Loaded {len(self.trades)} trades for session {self.session_date}")

        return self.trades

    def _parse_trade_row(self, row: dict, row_num: int) -> Optional[Trade]:
        """Parse a single row from the CSV into a Trade object.

        Args:
            row: Dictionary representing a CSV row
            row_num: Row number for error reporting

        Returns:
            Trade object or None if row should be skipped
        """
        # Parse timestamp
        time_str = row.get("time", "").strip()
        if not time_str:
            raise ValueError("Missing time value")

        try:
            # Try multiple date formats
            for fmt in ["%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y/%m/%d %H:%M:%S", "%Y/%m/%d %H:%M"]:
                try:
                    trade_time = datetime.strptime(time_str, fmt)
                    break
                except ValueError:
                    continue
            else:
                raise ValueError(f"Unable to parse time: {time_str}")
        except Exception as e:
            raise ValueError(f"Invalid time format: {e}")

        # Parse numeric fields
        try:
            entry = Decimal(row.get("entry", "").strip())
            exit_price = Decimal(row.get("exit", "").strip())
            size = Decimal(row.get("size", "").strip())
        except (InvalidOperation, ValueError) as e:
            raise ValueError(f"Invalid numeric value: {e}")

        # Validate direction
        direction = row.get("direction", "").strip().lower()
        if direction not in ["long", "short"]:
            raise ValueError(f"Invalid direction: {direction}")

        return Trade(
            time=trade_time,
            instrument=row.get("instrument", "").strip().upper(),
            direction=direction,
            entry=entry,
            exit=exit_price,
            size=size,
            setup=row.get("setup", "").strip(),
            notes=row.get("notes", "").strip(),
        )

    def calculate_stats(self) -> SessionStats:
        """Calculate session statistics.

        Returns:
            SessionStats object with calculated metrics
        """
        if not self.trades:
            raise ValueError("No trades loaded")

        wins = [t for t in self.trades if t.pnl > 0]
        losses = [t for t in self.trades if t.pnl < 0]
        breakeven = [t for t in self.trades if t.pnl == 0]

        total_pnl = sum(t.pnl for t in self.trades)
        win_count = len(wins)
        loss_count = len(losses)
        total_trades = len(self.trades)

        # Calculate win rate (excluding breakeven)
        decisive_trades = win_count + loss_count
        win_rate = (win_count / decisive_trades * 100) if decisive_trades > 0 else 0.0

        # Calculate averages
        avg_win = sum(t.pnl for t in wins) / win_count if wins else Decimal("0")
        avg_loss = sum(t.pnl for t in losses) / loss_count if losses else Decimal("0")

        # Calculate profit factor
        gross_profit = sum(t.pnl for t in wins)
        gross_loss = abs(sum(t.pnl for t in losses))
        profit_factor = float(gross_profit / gross_loss) if gross_loss > 0 else float("inf")

        # Find extremes
        largest_win = max((t.pnl for t in wins), default=Decimal("0"))
        largest_loss = min((t.pnl for t in losses), default=Decimal("0"))

        stats = SessionStats(
            total_pnl=total_pnl,
            win_count=win_count,
            loss_count=loss_count,
            total_trades=total_trades,
            win_rate=win_rate,
            avg_win=avg_win,
            avg_loss=avg_loss,
            profit_factor=profit_factor,
            largest_win=largest_win,
            largest_loss=largest_loss,
        )

        logger.info(f"Session stats: {total_trades} trades, {win_rate:.1f}% win rate, P&L: {total_pnl}")
        return stats

    def generate_journal(self) -> str:
        """Generate a markdown journal entry.

        Returns:
            Markdown formatted journal entry
        """
        if not self.trades:
            raise ValueError("No trades loaded")

        stats = self.calculate_stats()
        session_date = self.session_date.strftime("%Y-%m-%d") if self.session_date else "Unknown"

        # Build markdown
        lines = [
            f"# Trading Session - {session_date}",
            "",
            "## Summary",
            "",
            f"- **Total P&L:** ${stats.total_pnl:,.2f}",
            f"- **Win Rate:** {stats.win_rate:.1f}%",
            f"- **Trades:** {stats.total_trades} ({stats.win_count}W / {stats.loss_count}L)",
            "",
            "## Performance Metrics",
            "",
            f"| Metric | Value |",
            f"|--------|-------|",
            f"| Average Win | ${stats.avg_win:,.2f} |",
            f"| Average Loss | ${stats.avg_loss:,.2f} |",
            f"| Profit Factor | {stats.profit_factor:.2f} |",
            f"| Largest Win | ${stats.largest_win:,.2f} |",
            f"| Largest Loss | ${stats.largest_loss:,.2f} |",
            "",
            "## Trade Log",
            "",
            "| Time | Instrument | Direction | Entry | Exit | Size | P&L | Setup |",
            "|------|------------|-----------|-------|------|------|-----|-------|",
        ]

        for trade in self.trades:
            pnl_str = f"${trade.pnl:,.2f}"
            pnl_display = f"**{pnl_str}**" if trade.pnl > 0 else pnl_str
            time_str = trade.time.strftime("%H:%M:%S")
            lines.append(
                f"| {time_str} | {trade.instrument} | {trade.direction.upper()} | "
                f"{trade.entry:,.2f} | {trade.exit:,.2f} | {trade.size} | {pnl_display} | {trade.setup} |"
            )

        # Add notes section if any trade has notes
        trades_with_notes = [t for t in self.trades if t.notes]
        if trades_with_notes:
            lines.extend(["", "## Trade Notes", ""])
            for trade in trades_with_notes:
                time_str = trade.time.strftime("%H:%M:%S")
                lines.append(f"- **{time_str} {trade.instrument}**: {trade.notes}")

        lines.append("")
        journal = "\n".join(lines)
        logger.info(f"Generated journal with {len(lines)} lines")
        return journal

    def post_to_supabase(self, journal: str) -> dict:
        """Post the journal entry to Supabase.

        Args:
            journal: Markdown journal content

        Returns:
            Response data from Supabase

        Raises:
            ValueError: If Supabase credentials are not configured
            requests.RequestException: If the API request fails
        """
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Supabase credentials not configured")

        session_date = self.session_date.strftime("%Y-%m-%d") if self.session_date else "Unknown"
        title = f"Trading Session - {session_date}"

        url = f"{self.supabase_url.rstrip('/')}/rest/v1/entries"
        headers = {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }
        payload = {
            "type": "note",
            "project": "trading",
            "title": title,
            "content": journal,
        }

        logger.info(f"Posting journal to Supabase: {title}")
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()

        data = response.json()
        logger.info(f"Successfully posted to Supabase")
        return data

    def run(self, csv_path: Path, output_path: Optional[Path] = None, dry_run: bool = False) -> dict:
        """Run the complete trading agent workflow.

        Args:
            csv_path: Path to the trades CSV file
            output_path: Optional path to save the markdown journal
            dry_run: If True, don't post to Supabase

        Returns:
            Dictionary with results including journal and stats
        """
        # Load and process trades
        self.load_trades(csv_path)
        stats = self.calculate_stats()
        journal = self.generate_journal()

        # Save to file if requested
        if output_path:
            output_path.write_text(journal, encoding="utf-8")
            logger.info(f"Saved journal to {output_path}")

        # Post to Supabase unless dry run
        supabase_response = None
        if not dry_run:
            try:
                supabase_response = self.post_to_supabase(journal)
            except ValueError as e:
                logger.error(f"Supabase not configured: {e}")
            except requests.RequestException as e:
                logger.error(f"Failed to post to Supabase: {e}")
                raise

        return {
            "session_date": self.session_date,
            "trade_count": len(self.trades),
            "stats": stats,
            "journal": journal,
            "supabase_response": supabase_response,
        }


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Process trades and generate journal entries",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("csv_file", type=Path, help="Path to the trades CSV file")
    parser.add_argument("-o", "--output", type=Path, help="Output path for markdown journal")
    parser.add_argument("--dry-run", action="store_true", help="Don't post to Supabase")
    parser.add_argument("-v", "--verbose", action="store_true", help="Enable verbose logging")

    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    # Load environment variables
    load_dotenv()

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")

    if not args.dry_run and (not supabase_url or not supabase_key):
        logger.warning("Supabase credentials not found in environment. Use --dry-run or set SUPABASE_URL and SUPABASE_KEY")

    try:
        agent = TradingAgent(supabase_url=supabase_url, supabase_key=supabase_key)
        result = agent.run(csv_path=args.csv_file, output_path=args.output, dry_run=args.dry_run)

        # Print summary
        stats = result["stats"]
        print(f"\n{'='*50}")
        print(f"Trading Session Summary - {result['session_date']}")
        print(f"{'='*50}")
        print(f"Total Trades: {result['trade_count']}")
        print(f"Win Rate: {stats.win_rate:.1f}%")
        print(f"Total P&L: ${stats.total_pnl:,.2f}")
        print(f"{'='*50}\n")

        if result["supabase_response"]:
            print("Journal posted to Supabase successfully!")
        elif args.dry_run:
            print("Dry run - journal not posted to Supabase")
            print("\nGenerated Journal:\n")
            print(result["journal"])

    except FileNotFoundError as e:
        logger.error(f"File not found: {e}")
        sys.exit(1)
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        sys.exit(1)
    except requests.RequestException as e:
        logger.error(f"API error: {e}")
        sys.exit(1)
    except Exception as e:
        logger.exception(f"Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
