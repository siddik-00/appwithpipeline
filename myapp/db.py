import logging
import os
from pathlib import Path

from sqlmodel import SQLModel, create_engine

from myapp.models import (  # noqa: F401  (ensure tables registered)
    Bookmark,
    Comment,
    Follow,
    Like,
    Message,
    Notification,
    Post,
    Story,
    StoryView,
    User,
)

logger = logging.getLogger("uvicorn.error")

DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()


def _engine_url(url: str) -> str:
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    return url


if DATABASE_URL:
    engine = create_engine(_engine_url(DATABASE_URL))
else:
    _DB_DIR = Path("myapp")
    _DB_DIR.mkdir(parents=True, exist_ok=True)
    DATABASE_URL = f"sqlite:///{_DB_DIR / 'app.db'}"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


def init_db() -> None:
    try:
        SQLModel.metadata.create_all(engine)
    except Exception:
        logger.exception("Failed to create database tables")
        raise


init_db()

if DATABASE_URL.lower().startswith("sqlite"):
    try:
        from sqlalchemy import text

        NEW_COLUMNS = {
            "user": [
                "first_name",
                "last_name",
                "email",
                "phone",
                "profession",
                "address",
                "country",
                "website",
                "avatar_url",
            ],
            "post": ["parent_id", "image"],
        }
        for table, cols in NEW_COLUMNS.items():
            with engine.connect() as conn:
                existing = {
                    row[1]
                    for row in conn.execute(
                        text(f"PRAGMA table_info({table})")
                    ).fetchall()
                }
            for col in cols:
                if col not in existing:
                    col_def = (
                        "INTEGER"
                        if col == "parent_id"
                        else "TEXT DEFAULT ''"
                        if col == "image"
                        else "VARCHAR DEFAULT ''"
                    )
                    with engine.begin() as conn:
                        conn.execute(
                            text(f"ALTER TABLE {table} ADD COLUMN {col} {col_def}")
                        )
    except Exception:
        pass
