from datetime import datetime
from pathlib import Path
from uuid import uuid4

from fastapi import Body, Cookie, Depends, FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pwdlib import PasswordHash
from sqlmodel import Session, select

from myapp.db import engine
from myapp.models import (
    Bookmark,
    Comment,
    Follow,
    Like,
    Notification,
    Post,
    Story,
    User,
)

password_hash = PasswordHash.recommended()
TEMPLATES = Jinja2Templates(directory=str(Path(__file__).parent / "templates"))

SESSIONS: dict[str, str] = {}
AVATAR_COLORS = [
    "#6200EE",
    "#006EFF",
    "#00D68F",
    "#F89B29",
    "#FF0F7B",
    "#06b6d4",
    "#8b5cf6",
]


def seed_demo_data():
    with Session(engine) as db:
        if db.exec(select(User)).first():
            return
        demo_users = [
            ("masud", "Masud Rahman", "Building StarConnect Asia", "#6200EE", 3, True),
            (
                "nusrat",
                "Nusrat Jahan",
                "Expert in digital marketing",
                "#FF0F7B",
                2,
                True,
            ),
            ("tanvir", "Tanvir Ahmed", "Full-stack developer", "#006EFF", 2, False),
            ("sadia", "Sadia Islam", "Career advisor | Mentor", "#00D68F", 2, True),
        ]
        posts_by_username = {
            "masud": [
                "We are hiring! Looking for passionate developers to join our team. 🌟",
                "Thankful to our amazing community for the constant support and feedback! 🙌",
                "Big milestone reached for StarConnect. The journey is just beginning!",
            ],
            "nusrat": [
                "5 marketing tips that instantly boosted engagement for my clients 📈",
                "Morning routine of top performers: 30 min reading + 10 min planning.",
            ],
            "tanvir": [
                "Just shipped a new FastAPI feature. Async + SQLModel is such a smooth combo!",
                "Learned something today: 'Don't fear the refactor. Fear the bug you ignore.'",
            ],
            "sadia": [
                "Vernacular languages are the future of online learning in South Asia.",
                "Don't wait for the perfect moment. Start small, build momentum.",
            ],
        }
        users = {}
        for username, name, bio, color, _, verified in demo_users:
            u = User(
                username=username,
                password_hash=password_hash.hash("starconnect"),
                name=name,
                bio=bio,
                avatar_color=color,
                verified=verified,
                online=(username == "masud"),
            )
            db.add(u)
            db.flush()
            users[username] = u

        created = datetime.utcnow()
        order = [
            ("masud", 0),
            ("nusrat", 0),
            ("tanvir", 0),
            ("sadia", 0),
            ("masud", 1),
            ("nusrat", 1),
        ]
        all_posts = []
        minute = 5
        for username, idx in order:
            u = users[username]
            content = posts_by_username[username][idx]
            p = Post(
                user_id=u.id,
                content=content,
                created_at=created.replace(hour=10, minute=minute),
            )
            db.add(p)
            db.flush()
            all_posts.append(p)
            minute += 5

        # likes
        like_sets = [
            (users["nusrat"].id, all_posts[0].id),
            (users["tanvir"].id, all_posts[0].id),
            (users["sadia"].id, all_posts[0].id),
            (users["masud"].id, all_posts[2].id),
            (users["sadia"].id, all_posts[4].id),
        ]
        for uid, pid in like_sets:
            db.add(Like(post_id=pid, user_id=uid, reaction="like", created_at=created))

        # comments
        comments = [
            (
                users["nusrat"].id,
                all_posts[0].id,
                "Congrats Masud, this is amazing! 🎉",
            ),
            (
                users["tanvir"].id,
                all_posts[0].id,
                "I would love to join. Let's grow together 🚀",
            ),
            (users["masud"].id, all_posts[1].id, "Very useful tips, thank you Nusrat!"),
        ]
        for uid, pid, text in comments:
            db.add(Comment(post_id=pid, user_id=uid, content=text, created_at=created))

        # follows
        for follower in list(users.values()):
            for target in list(users.values()):
                if follower.id != target.id:
                    db.add(Follow(follower_id=follower.id, following_id=target.id))

        # notifications for masud (demo default login)
        db.add(
            Notification(
                user_id=users["masud"].id,
                actor_id=users["nusrat"].id,
                type="like",
                message="Nusrat Jahan liked your post",
                created_at=created,
            )
        )
        db.add(
            Notification(
                user_id=users["masud"].id,
                actor_id=users["tanvir"].id,
                type="follow",
                message="Tanvir Ahmed started following you",
                created_at=created,
            )
        )

        # stories
        stories = [
            (
                "masud",
                "Big announcement coming! 🔥",
                "linear-gradient(135deg,#6200EE,#D397FA)",
            ),
            ("nusrat", "Daily tip below 👇", "linear-gradient(135deg,#FF0F7B,#F89B29)"),
            ("tanvir", "Coding at night 💻", "linear-gradient(135deg,#006EFF,#00D68F)"),
            ("sadia", "Career Q&A today!", "linear-gradient(135deg,#8B5CF6,#EC4899)"),
        ]
        for username, content, grad in stories:
            db.add(
                Story(
                    user_id=users[username].id,
                    content=content,
                    gradient=grad,
                    created_at=created,
                )
            )
        db.commit()


def get_db():
    with Session(engine) as session:
        yield session


def get_current_user(
    session_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> User | None:
    if not session_token or session_token not in SESSIONS:
        return None
    username = SESSIONS[session_token]
    return db.exec(select(User).where(User.username == username)).first()


def require_user(user: User | None = Depends(get_current_user)) -> User:
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


def pick_color() -> str:
    return AVATAR_COLORS[len(SESSIONS) % len(AVATAR_COLORS)]


def notify(db: Session, user_id: int, actor_id: int | None, type: str, message: str):
    db.add(Notification(user_id=user_id, actor_id=actor_id, type=type, message=message))


app = FastAPI()


@app.on_event("startup")
def on_startup():
    try:
        seed_demo_data()
    except Exception:
        pass


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return TEMPLATES.TemplateResponse(request, "index.html", {})


def public_user(u: User) -> dict:
    return {
        "id": u.id,
        "username": u.username,
        "name": u.name or u.username,
        "bio": u.bio,
        "avatar_color": u.avatar_color,
        "verified": u.verified,
    }


def post_dict(
    p: Post,
    author: User,
    liked: bool,
    like_count: int,
    comments: list,
    reaction: str = "",
    bookmarked: bool = False,
) -> dict:
    return {
        "id": p.id,
        "content": p.content,
        "gradient": p.gradient,
        "time": p.created_at.strftime("%Y-%m-%d %H:%M"),
        "author": public_user(author),
        "liked": liked,
        "reaction": reaction,
        "like_count": like_count,
        "bookmarked": bookmarked,
        "comments": comments,
    }


# ---------- Auth ----------


@app.post("/api/auth/signup")
async def signup(body: dict = Body(...), db: Session = Depends(get_db)):
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""
    name = (body.get("name") or "").strip() or username
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")
    if db.exec(select(User).where(User.username == username)).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    user = User(
        username=username,
        password_hash=password_hash.hash(password),
        name=name,
        avatar_color=pick_color(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = str(uuid4())
    SESSIONS[token] = username
    return {"token": token, "user": public_user(user)}


@app.post("/api/auth/login")
async def login(body: dict = Body(...), db: Session = Depends(get_db)):
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""
    user = db.exec(select(User).where(User.username == username)).first()
    if not user or not password_hash.verify(password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    user.online = True
    db.add(user)
    db.commit()
    token = str(uuid4())
    SESSIONS[token] = user.username
    return {"token": token, "user": public_user(user)}


@app.post("/api/auth/logout")
async def logout(
    session_token: str | None = Cookie(default=None), db: Session = Depends(get_db)
):
    if session_token:
        username = SESSIONS.pop(session_token, None)
        if username:
            user = db.exec(select(User).where(User.username == username)).first()
            if user:
                user.online = False
                db.add(user)
                db.commit()
    return {"ok": True}


@app.get("/api/me")
async def me(
    user: User | None = Depends(get_current_user), db: Session = Depends(get_db)
):
    if not user:
        return {"user": None}
    followers = len(db.exec(select(Follow).where(Follow.following_id == user.id)).all())
    following = len(db.exec(select(Follow).where(Follow.follower_id == user.id)).all())
    posts = len(db.exec(select(Post).where(Post.user_id == user.id)).all())
    unread = len(
        db.exec(
            select(Notification).where(
                Notification.user_id == user.id, not Notification.read
            )
        ).all()
    )
    return {
        "user": public_user(user),
        "followers": followers,
        "following": following,
        "posts": posts,
        "unread": unread,
    }


# ---------- Posts ----------


def build_comments(db: Session, post_id: int) -> list:
    comments = db.exec(
        select(Comment)
        .where(Comment.post_id == post_id)
        .order_by(Comment.created_at.asc())
    ).all()
    result = []
    for c in comments:
        c_author = db.get(User, c.user_id)
        result.append(
            {
                "id": c.id,
                "content": c.content,
                "time": c.created_at.strftime("%Y-%m-%d %H:%M"),
                "author": public_user(c_author),
            }
        )
    return result


def build_post(db: Session, p: Post, user: User | None) -> dict:
    author = db.get(User, p.user_id)
    my_like = (
        db.exec(
            select(Like).where(Like.post_id == p.id, Like.user_id == user.id)
        ).first()
        if user
        else None
    )
    likes = db.exec(select(Like).where(Like.post_id == p.id)).all()
    bookmarked = bool(
        user
        and db.exec(
            select(Bookmark).where(
                Bookmark.post_id == p.id, Bookmark.user_id == user.id
            )
        ).first()
    )
    comment_list = build_comments(db, p.id)
    return post_dict(
        p,
        author,
        liked=bool(my_like),
        like_count=len(likes),
        comments=comment_list,
        reaction=my_like.reaction if my_like else "",
        bookmarked=bookmarked,
    )


@app.get("/api/feed")
async def get_feed(
    user: User | None = Depends(get_current_user), db: Session = Depends(get_db)
):
    posts = db.exec(select(Post).order_by(Post.created_at.desc())).all()
    return {
        "user": public_user(user) if user else None,
        "posts": [build_post(db, p, user) for p in posts],
    }


@app.get("/api/search")
async def search(
    q: str = "",
    user: User | None = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = q.strip().lower()
    results = []
    if q:
        users = db.exec(
            select(User).where(User.username.contains(q) | User.name.contains(q))
        ).all()
        posts = db.exec(select(Post)).all()
        matched = [p for p in posts if q in p.content.lower()]
        results = [{"type": "user", **public_user(u)} for u in users] + [
            {"type": "post", **build_post(db, p, user)} for p in matched
        ]
    return {"results": results, "q": q}


@app.get("/api/trending")
async def trending(
    user: User | None = Depends(get_current_user), db: Session = Depends(get_db)
):
    topics = [
        {"tag": "#StarConnect", "posts": "12.5k posts"},
        {"tag": "#FastAPI", "posts": "8.2k posts"},
        {"tag": "#CareerTips", "posts": "5.1k posts"},
        {"tag": "#BengaliTech", "posts": "3.4k posts"},
        {"tag": "#Marketing", "posts": "2.9k posts"},
    ]
    return {"topics": topics}


@app.get("/api/stories")
async def get_stories(
    user: User | None = Depends(get_current_user), db: Session = Depends(get_db)
):
    stories = db.exec(select(Story).order_by(Story.created_at.desc())).all()
    return {
        "stories": [
            {
                "id": s.id,
                "content": s.content,
                "gradient": s.gradient,
                "time": s.created_at.strftime("%H:%M"),
                "author": public_user(db.get(User, s.user_id)),
            }
            for s in stories
        ]
    }


@app.post("/api/posts")
async def create_post(
    body: dict = Body(...),
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    content = (body.get("content") or "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="Post content required")
    gradient = body.get("gradient") or ""
    post = Post(
        user_id=user.id,
        content=content,
        gradient=gradient if gradient else "linear-gradient(135deg,#6200EE,#D397FA)",
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return build_post(db, post, user)


@app.post("/api/posts/{post_id}/like")
async def toggle_like(
    post_id: int,
    body: dict = Body(default={}),
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    reaction = (body.get("reaction") or "like") if body else "like"
    existing = db.exec(
        select(Like).where(Like.post_id == post_id, Like.user_id == user.id)
    ).first()
    liked = True
    if existing:
        if existing.reaction == reaction:
            db.delete(existing)
            liked = False
        else:
            existing.reaction = reaction
            db.add(existing)
    else:
        db.add(Like(post_id=post_id, user_id=user.id, reaction=reaction))
        author = db.get(User, post.user_id)
        if author and author.id != user.id:
            notify(
                db,
                author.id,
                user.id,
                "like",
                f"{user.name or user.username} reacted {reaction} to your post",
            )
    db.commit()
    count = len(db.exec(select(Like).where(Like.post_id == post_id)).all())
    return {"liked": liked, "like_count": count, "reaction": reaction}


@app.post("/api/posts/{post_id}/bookmark")
async def toggle_bookmark(
    post_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)
):
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    existing = db.exec(
        select(Bookmark).where(Bookmark.post_id == post_id, Bookmark.user_id == user.id)
    ).first()
    saved = True
    if existing:
        db.delete(existing)
        saved = False
    else:
        db.add(Bookmark(post_id=post_id, user_id=user.id))
    db.commit()
    return {"bookmarked": saved}


@app.post("/api/stories")
async def create_story(
    body: dict = Body(...),
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    content = (body.get("content") or "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="Story content required")
    gradient = body.get("gradient") or "linear-gradient(135deg,#6200EE,#D397FA)"
    story = Story(user_id=user.id, content=content, gradient=gradient)
    db.add(story)
    db.commit()
    db.refresh(story)
    return {"ok": True, "id": story.id}


@app.post("/api/posts/{post_id}/comments")
async def add_comment(
    post_id: int,
    body: dict = Body(...),
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    content = (body.get("content") or "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="Comment required")
    comment = Comment(post_id=post_id, user_id=user.id, content=content)
    db.add(comment)
    author = db.get(User, post.user_id)
    if author and author.id != user.id:
        notify(
            db,
            author.id,
            user.id,
            "comment",
            f"{user.name or user.username} commented on your post",
        )
    db.commit()
    db.refresh(comment)
    return {
        "id": comment.id,
        "content": comment.content,
        "time": comment.created_at.strftime("%Y-%m-%d %H:%M"),
        "author": public_user(user),
    }


# ---------- Follows ----------


@app.get("/api/users")
async def list_users(user: User = Depends(require_user), db: Session = Depends(get_db)):
    users = db.exec(select(User).where(User.id != user.id)).all()
    following_ids = {
        f.following_id
        for f in db.exec(select(Follow).where(Follow.follower_id == user.id)).all()
    }
    result = []
    for u in users:
        data = public_user(u)
        data["following"] = u.id in following_ids
        data["post_count"] = len(
            db.exec(select(Post).where(Post.user_id == u.id)).all()
        )
        result.append(data)
    return {"users": result}


@app.post("/api/users/{user_id}/follow")
async def toggle_follow(
    user_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)
):
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    existing = db.exec(
        select(Follow).where(
            Follow.follower_id == user.id, Follow.following_id == user_id
        )
    ).first()
    following = True
    if existing:
        db.delete(existing)
        following = False
    else:
        db.add(Follow(follower_id=user.id, following_id=user_id))
        notify(
            db,
            user_id,
            user.id,
            "follow",
            f"{user.name or user.username} started following you",
        )
    db.commit()
    return {"following": following}


@app.get("/api/connections")
async def connections(
    user: User = Depends(require_user), db: Session = Depends(get_db)
):
    following_ids = [
        f.following_id
        for f in db.exec(select(Follow).where(Follow.follower_id == user.id)).all()
    ]
    people = []
    for uid in following_ids:
        u = db.get(User, uid)
        if u:
            people.append(public_user(u))
    return {"users": people}


@app.get("/api/bookmarks")
async def bookmarks(user: User = Depends(require_user), db: Session = Depends(get_db)):
    marks = db.exec(
        select(Bookmark)
        .where(Bookmark.user_id == user.id)
        .order_by(Bookmark.created_at.desc())
    ).all()
    posts = []
    for m in marks:
        post = db.get(Post, m.post_id)
        if post:
            posts.append(build_post(db, post, user))
    return {"posts": posts}


# ---------- Notifications ----------


@app.get("/api/notifications")
async def get_notifications(
    user: User = Depends(require_user), db: Session = Depends(get_db)
):
    notifs = db.exec(
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
    ).all()
    result = []
    for n in notifs:
        actor = db.get(User, n.actor_id) if n.actor_id else None
        result.append(
            {
                "id": n.id,
                "type": n.type,
                "message": n.message,
                "read": n.read,
                "time": n.created_at.strftime("%Y-%m-%d %H:%M"),
                "actor": public_user(actor) if actor else None,
            }
        )
    return {"notifications": result}


@app.post("/api/notifications/read")
async def mark_read(user: User = Depends(require_user), db: Session = Depends(get_db)):
    notifs = db.exec(
        select(Notification).where(
            Notification.user_id == user.id, not Notification.read
        )
    ).all()
    for n in notifs:
        n.read = True
    db.commit()
    return {"ok": True}


# ---------- Profile ----------


@app.get("/api/users/{user_id}/posts")
async def user_posts(
    user_id: int,
    user: User | None = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    posts = db.exec(
        select(Post).where(Post.user_id == user_id).order_by(Post.created_at.desc())
    ).all()
    return {
        "user": public_user(target),
        "posts": [build_post(db, p, user) for p in posts],
    }


@app.post("/api/profile")
async def update_profile(
    body: dict = Body(...),
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    if "name" in body:
        user.name = (body.get("name") or "").strip()
    if "bio" in body:
        user.bio = (body.get("bio") or "").strip()
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"user": public_user(user)}
