#!/usr/bin/env python
"""CLI script to import case data from CSV into the SQLite database.

Usage:
    python scripts/import_csv.py ../data/Sheet1.csv
"""

import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlmodel import Session

from app.db.init_db import initialize_database
from app.db.seed import run_all_seeds
from app.db.session import engine
from app.services.csv_import_service import import_csv_from_bytes


def main(csv_path: str) -> None:
    initialize_database()
    run_all_seeds()

    with open(csv_path, "rb") as f:
        content = f.read()

    with Session(engine) as session:
        result = import_csv_from_bytes(content, session)
        print(f"Imported: {result['imported']}")
        if result["skipped"]:
            print(f"Skipped: {result['skipped']}")
        if result["errors"]:
            for err in result["errors"]:
                print(f"  Error: {err}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/import_csv.py <path_to_csv>")
        sys.exit(1)
    main(sys.argv[1])
