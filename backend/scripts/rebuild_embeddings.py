#!/usr/bin/env python
"""CLI script to rebuild embeddings for all non-ready cases.

Usage:
    python scripts/rebuild_embeddings.py
    python scripts/rebuild_embeddings.py --force
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlmodel import Session, select

from app.db.init_db import initialize_database
from app.db.seed import run_all_seeds
from app.db.session import engine
from app.models.case import Case
from app.services.embedding_service import generate_embedding_svc


def main() -> None:
    parser = argparse.ArgumentParser(description="Rebuild case embeddings.")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Rebuild embeddings for all enabled cases, including ready ones.",
    )
    args = parser.parse_args()

    initialize_database()
    run_all_seeds()

    with Session(engine) as session:
        stmt = select(Case).where(Case.enabled)
        if not args.force:
            stmt = stmt.where(Case.embedding_status != "ready")
        cases = session.exec(stmt).all()
        print(f"Found {len(cases)} cases needing embedding.")
        for case in cases:
            try:
                generate_embedding_svc(case.id, session)
                print(f"  Case {case.id} ({case.title[:30]}…) → ready")
            except Exception as e:
                print(f"  Case {case.id} FAILED: {e}")
        print("Done.")


if __name__ == "__main__":
    main()
