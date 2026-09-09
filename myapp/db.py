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
