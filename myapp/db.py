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

DATABASE_URL = "sqlite:///./myapp/app.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SQLModel.metadata.create_all(engine)
