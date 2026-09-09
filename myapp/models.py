from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    password_hash: str
    name: str = ""
    bio: str = ""
    avatar_color: str = "#6366f1"
    verified: bool = False
    online: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Post(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    content: str
    gradient: str = Field(default="linear-gradient(135deg,#8364E8,#D397FA)")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Comment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    post_id: int = Field(index=True, foreign_key="post.id")
    user_id: int = Field(index=True, foreign_key="user.id")
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Like(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    post_id: int = Field(index=True, foreign_key="post.id")
    user_id: int = Field(index=True, foreign_key="user.id")
    reaction: str = Field(default="like")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Bookmark(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    post_id: int = Field(index=True, foreign_key="post.id")
    user_id: int = Field(index=True, foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Follow(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    follower_id: int = Field(index=True, foreign_key="user.id")
    following_id: int = Field(index=True, foreign_key="user.id")


class Story(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    content: str
    gradient: str = Field(default="linear-gradient(135deg,#6200EE,#D397FA)")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Notification(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    actor_id: Optional[int] = Field(default=None, foreign_key="user.id")
    type: str
    message: str
    read: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)