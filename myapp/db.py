import os
from pathlib import Path

from sqlmodel import SQLModel, create_engine

from myapp.models import (  # noqa: F401  (ensure tables registered)
    Bookmark,
    Comment,
    Follow,
    Like,
    Notification,
    Post,
    Story,
    User,
)

if os.environ.get("VERCEL"):
    _DB_DIR = Path("/tmp")
else:
    _DB_DIR = Path("myapp")
    _DB_DIR.mkdir(parents=True, exist_ok=True)
DATABASE_URL = f"sqlite:///{_DB_DIR / 'app.db'}"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

try:
    SQLModel.metadata.create_all(engine)
except Exception:
    pass

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
        ],
        "post": ["parent_id"],
    }
    for table, cols in NEW_COLUMNS.items():
        with engine.connect() as conn:
            existing = {
                row[1]
                for row in conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
            }
        for col in cols:
            if col not in existing:
                col_def = "INTEGER" if col == "parent_id" else "VARCHAR DEFAULT ''"
                with engine.begin() as conn:
                    conn.execute(
                        text(f"ALTER TABLE {table} ADD COLUMN {col} {col_def}")
                    )
except Exception:
    pass
