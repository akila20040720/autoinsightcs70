"""Database module for vehicle data caching."""

from __future__ import annotations

import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from scrape_all_to_csv import FIELDS


class VehicleDatabase:
    """SQLite database for caching vehicle scrape data."""

    def __init__(self, db_path: Path | str = "vehicles.db"):
        """Initialize database connection."""
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_tables()

    def _init_tables(self) -> None:
        """Create tables if they don't exist."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS vehicles (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    vehicle_type TEXT,
                    make TEXT,
                    model TEXT,
                    year INTEGER,
                    price TEXT,
                    mileage INTEGER,
                    district TEXT,
                    published_date TEXT,
                    vehicle_url TEXT UNIQUE,
                    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT unique_vehicle UNIQUE(vehicle_url)
                )
                """
            )
            
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS scrape_metadata (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    scrape_type TEXT,
                    make TEXT,
                    model TEXT,
                    year TEXT,
                    total_records INTEGER,
                    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT unique_scrape UNIQUE(scrape_type, make, model, year)
                )
                """
            )
            conn.commit()

    def insert_vehicles(self, rows: list[dict[str, Any]]) -> int:
        """Insert vehicle rows, skipping duplicates."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            inserted = 0
            
            for row in rows:
                try:
                    conn.execute(
                        """
                        INSERT INTO vehicles 
                        (vehicle_type, make, model, year, price, mileage, district, 
                         published_date, vehicle_url)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            row.get("Vehicle Type"),
                            row.get("Make"),
                            row.get("Model"),
                            row.get("Year"),
                            row.get("Price"),
                            row.get("Milleage"),
                            row.get("District"),
                            row.get("published date"),
                            row.get("Vehicle URL"),
                        ),
                    )
                    inserted += 1
                except sqlite3.IntegrityError:
                    # Skip duplicates
                    pass
            
            conn.commit()
            return inserted

    def record_scrape(
        self, scrape_type: str, make: str, model: str, year: str, total_records: int
    ) -> None:
        """Record scrape metadata."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO scrape_metadata 
                (scrape_type, make, model, year, total_records)
                VALUES (?, ?, ?, ?, ?)
                """,
                (scrape_type, make, model, year, total_records),
            )
            conn.commit()

    def get_scrape_age(
        self, scrape_type: str, make: str, model: str, year: str
    ) -> timedelta | None:
        """Get age of last scrape for given parameters."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                """
                SELECT scraped_at FROM scrape_metadata
                WHERE scrape_type = ? AND make = ? AND model = ? AND year = ?
                ORDER BY scraped_at DESC LIMIT 1
                """,
                (scrape_type, make, model, year),
            )
            row = cursor.fetchone()
            if row:
                scraped_at = datetime.fromisoformat(row[0])
                return datetime.now() - scraped_at
            return None

    def get_vehicles_from_db(
        self,
        make: str | None = None,
        model: str | None = None,
        year: str | None = None,
        vehicle_type: str | None = None,
        limit: int = 2000,
    ) -> list[dict[str, Any]]:
        """Retrieve vehicles from database with optional filters."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            
            query = "SELECT * FROM vehicles WHERE 1=1"
            params: list[Any] = []
            
            if make:
                query += " AND LOWER(make) LIKE ?"
                params.append(f"%{make.lower()}%")
            if model:
                query += " AND LOWER(model) LIKE ?"
                params.append(f"%{model.lower()}%")
            if year:
                query += " AND year = ?"
                params.append(int(year))
            if vehicle_type:
                query += " AND LOWER(vehicle_type) = ?"
                params.append(vehicle_type.lower())
            
            query += " ORDER BY scraped_at DESC LIMIT ?"
            params.append(limit)
            
            cursor = conn.execute(query, params)
            rows = cursor.fetchall()
            
            # Convert Row objects to dictionaries
            return [dict(row) for row in rows]

    def get_all_vehicles(self, limit: int = 2000) -> list[dict[str, Any]]:
        """Get all vehicles from database."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("SELECT * FROM vehicles ORDER BY scraped_at DESC LIMIT ?", (limit,))
            rows = cursor.fetchall()
            return [dict(row) for row in rows]

    def clear_old_data(self, days: int = 30) -> int:
        """Delete data older than specified days."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                """
                DELETE FROM vehicles 
                WHERE scraped_at < datetime('now', '-' || ? || ' days')
                """,
                (days,),
            )
            conn.commit()
            return cursor.rowcount

    def get_vehicle_count(self) -> int:
        """Get total number of vehicles in database."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("SELECT COUNT(*) FROM vehicles")
            return cursor.fetchone()[0]

    def exists(self) -> bool:
        """Check if database file exists."""
        return self.db_path.exists()

    def delete_all(self) -> None:
        """Delete all data (for testing)."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("DELETE FROM vehicles")
            conn.execute("DELETE FROM scrape_metadata")
            conn.commit()
